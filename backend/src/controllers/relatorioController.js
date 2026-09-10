'use strict';

const { Op, fn, col, literal } = require('sequelize');
const { Pedido, ItemPedido, Produto, Categoria, Estoque, Entrega } = require('../models');
const { ok } = require('../utils/respostas');

// Pedidos cancelados nunca entram no faturamento.
const STATUS_FATURAVEL = ['PAGO', 'ENVIADO', 'CONCLUIDO'];

function periodoDoQuery(query) {
  const where = { status: { [Op.in]: STATUS_FATURAVEL } };
  if (query.de || query.ate) {
    where.created_at = {};
    if (query.de) where.created_at[Op.gte] = new Date(`${query.de}T00:00:00`);
    if (query.ate) where.created_at[Op.lte] = new Date(`${query.ate}T23:59:59`);
  }
  return where;
}

/**
 * GET /relatorios/vendas  (admin)
 * Alimenta os graficos do painel: faturamento por mes (barras/linhas)
 * e vendas por segmento/prateleira da barbearia (rosca).
 */
async function vendas(req, res, next) {
  try {
    const wherePedido = periodoDoQuery(req.query);

    // --- Indicadores gerais ---
    const [resumo] = await Pedido.findAll({
      where: wherePedido,
      attributes: [
        [fn('COUNT', col('id')), 'total_pedidos'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'faturamento'],
        [fn('COALESCE', fn('SUM', col('desconto')), 0), 'descontos_concedidos'],
        [fn('COALESCE', fn('AVG', col('total')), 0), 'ticket_medio'],
      ],
      raw: true,
    });

    // --- Faturamento mensal (grafico de barras/linhas) ---
    const porMes = await Pedido.findAll({
      where: wherePedido,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'competencia'],
        [fn('COUNT', col('id')), 'pedidos'],
        [fn('COALESCE', fn('SUM', col('total')), 0), 'faturamento'],
      ],
      group: [literal('competencia')],
      order: [literal('competencia ASC')],
      raw: true,
    });

    // --- Vendas por categoria / segmento da barbearia (grafico de rosca) ---
    const porCategoria = await ItemPedido.findAll({
      attributes: [
        [col('produto->categoria.nome'), 'categoria'],
        [col('produto->categoria.segmento'), 'segmento'],
        [fn('SUM', col('ItemPedido.quantidade')), 'unidades'],
        [fn('COALESCE', fn('SUM', col('ItemPedido.subtotal')), 0), 'faturamento'],
      ],
      include: [
        { model: Pedido, as: 'pedido', attributes: [], where: wherePedido },
        {
          model: Produto,
          as: 'produto',
          attributes: [],
          include: [{ model: Categoria, as: 'categoria', attributes: [] }],
        },
      ],
      group: [col('produto->categoria.id'), col('produto->categoria.nome'), col('produto->categoria.segmento')],
      order: [[literal('faturamento'), 'DESC']],
      raw: true,
    });

    // --- Ranking de produtos mais vendidos ---
    const topProdutos = await ItemPedido.findAll({
      attributes: [
        [col('ItemPedido.nome_produto'), 'produto'],
        [fn('SUM', col('ItemPedido.quantidade')), 'unidades'],
        [fn('COALESCE', fn('SUM', col('ItemPedido.subtotal')), 0), 'faturamento'],
      ],
      include: [{ model: Pedido, as: 'pedido', attributes: [], where: wherePedido }],
      group: [col('ItemPedido.nome_produto')],
      order: [[literal('unidades'), 'DESC']],
      limit: 10,
      raw: true,
    });

    // --- Distribuicao por status (inclui cancelados, para gestao) ---
    const porStatus = await Pedido.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'quantidade']],
      group: ['status'],
      raw: true,
    });

    return ok(res, {
      periodo: { de: req.query.de || null, ate: req.query.ate || null },
      resumo: {
        total_pedidos: Number(resumo.total_pedidos || 0),
        faturamento: Number(resumo.faturamento || 0),
        descontos_concedidos: Number(resumo.descontos_concedidos || 0),
        ticket_medio: Number(resumo.ticket_medio || 0),
      },
      faturamento_mensal: porMes.map((l) => ({
        competencia: l.competencia,
        pedidos: Number(l.pedidos),
        faturamento: Number(l.faturamento),
      })),
      vendas_por_categoria: porCategoria.map((l) => ({
        categoria: l.categoria,
        segmento: l.segmento,
        unidades: Number(l.unidades),
        faturamento: Number(l.faturamento),
      })),
      top_produtos: topProdutos.map((l) => ({
        produto: l.produto,
        unidades: Number(l.unidades),
        faturamento: Number(l.faturamento),
      })),
      pedidos_por_status: porStatus.map((l) => ({ status: l.status, quantidade: Number(l.quantidade) })),
    });
  } catch (e) {
    return next(e);
  }
}

/**
 * GET /relatorios/estoque  (admin)
 * Posicao de estoque, itens criticos e valor imobilizado por segmento.
 */
async function estoque(req, res, next) {
  try {
    const posicao = await Estoque.findAll({
      include: [
        {
          model: Produto,
          as: 'produto',
          attributes: ['id', 'codigo', 'nome', 'preco', 'tipo', 'ativo'],
          include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nome', 'segmento'] }],
        },
      ],
      order: [['quantidade', 'ASC']],
    });

    const linhas = posicao
      .filter((registro) => registro.produto)
      .map((registro) => {
        const preco = Number(registro.produto.preco);
        const qtd = registro.quantidade;
        return {
          produto_id: registro.produto.id,
          codigo: registro.produto.codigo,
          produto: registro.produto.nome,
          categoria: registro.produto.categoria?.nome || 'Sem categoria',
          segmento: registro.produto.categoria?.segmento || 'CABELO',
          tipo: registro.produto.tipo,
          quantidade: qtd,
          quantidade_minima: registro.quantidade_minima,
          ilimitado: registro.ilimitado,
          preco_unitario: preco,
          valor_imobilizado: Math.round((preco * qtd + Number.EPSILON) * 100) / 100,
          situacao: registro.ilimitado
            ? 'ILIMITADO'
            : qtd === 0
              ? 'ESGOTADO'
              : qtd <= registro.quantidade_minima
                ? 'CRITICO'
                : 'NORMAL',
        };
      });

    // Agrupamento por categoria para o grafico de barras do painel.
    const porCategoria = Object.values(
      linhas.reduce((acc, linha) => {
        acc[linha.categoria] = acc[linha.categoria] || {
          categoria: linha.categoria,
          segmento: linha.segmento,
          unidades: 0,
          valor_imobilizado: 0,
          itens: 0,
        };
        acc[linha.categoria].unidades += linha.ilimitado ? 0 : linha.quantidade;
        acc[linha.categoria].valor_imobilizado += linha.ilimitado ? 0 : linha.valor_imobilizado;
        acc[linha.categoria].itens += 1;
        return acc;
      }, {})
    ).map((l) => ({ ...l, valor_imobilizado: Math.round((l.valor_imobilizado + Number.EPSILON) * 100) / 100 }));

    return ok(res, {
      resumo: {
        itens_cadastrados: linhas.length,
        unidades_totais: linhas.reduce((s, l) => s + (l.ilimitado ? 0 : l.quantidade), 0),
        valor_total_imobilizado:
          Math.round((linhas.reduce((s, l) => s + (l.ilimitado ? 0 : l.valor_imobilizado), 0) + Number.EPSILON) * 100) / 100,
        esgotados: linhas.filter((l) => l.situacao === 'ESGOTADO').length,
        criticos: linhas.filter((l) => l.situacao === 'CRITICO').length,
      },
      estoque_por_categoria: porCategoria.sort((a, b) => b.valor_imobilizado - a.valor_imobilizado),
      itens: linhas,
      alertas: linhas.filter((l) => ['ESGOTADO', 'CRITICO'].includes(l.situacao)),
    });
  } catch (e) {
    return next(e);
  }
}

/** GET /relatorios/entregas  (admin) - complementa o painel logistico */
async function entregas(req, res, next) {
  try {
    const porStatus = await Entrega.findAll({
      attributes: ['status', 'tipo', [fn('COUNT', col('id')), 'quantidade']],
      group: ['status', 'tipo'],
      raw: true,
    });

    return ok(res, {
      entregas_por_status: porStatus.map((l) => ({
        status: l.status,
        tipo: l.tipo,
        quantidade: Number(l.quantidade),
      })),
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { vendas, estoque, entregas };
