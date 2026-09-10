'use strict';

const { Op } = require('sequelize');
const { sequelize, Pedido, ItemPedido, Produto, Estoque, Entrega, Usuario, Categoria } = require('../models');
const { erro, ok, gerarCodigoPedido } = require('../utils/respostas');
const { calcularTotais } = require('../utils/desconto');

const INCLUDE_COMPLETO = [
  {
    model: ItemPedido,
    as: 'itens',
    include: [
      {
        model: Produto,
        as: 'produto',
        attributes: ['id', 'codigo', 'nome', 'imagem', 'tipo'],
        include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nome', 'segmento'] }],
      },
    ],
  },
  { model: Entrega, as: 'entrega' },
  { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email', 'telefone'] },
];

/**
 * POST /pedidos  (privado)
 * Converte o carrinho do LocalStorage em venda real:
 * valida estoque -> calcula desconto -> grava Pedido + ItemPedido -> deduz estoque -> cria Entrega.
 * Tudo dentro de uma transacao: se qualquer item falhar, nada e gravado.
 */
async function finalizar(req, res, next) {
  const transacao = await sequelize.transaction();
  try {
    const { itens, forma_pagamento: formaPagamento, observacao, entrega } = req.body || {};

    if (!Array.isArray(itens) || itens.length === 0) {
      throw erro(400, 'O carrinho esta vazio: envie ao menos um item.');
    }

    // Consolida quantidades repetidas do mesmo produto.
    const consolidado = new Map();
    for (const item of itens) {
      const id = Number(item.produto_id ?? item.id);
      const qtd = Number(item.quantidade ?? 1);
      if (!Number.isInteger(id) || id <= 0) throw erro(400, 'Item do carrinho sem produto_id valido.');
      if (!Number.isInteger(qtd) || qtd <= 0) throw erro(400, 'A quantidade de cada item deve ser um inteiro maior que zero.');
      consolidado.set(id, (consolidado.get(id) || 0) + qtd);
    }

    const idsProdutos = [...consolidado.keys()];

    // Trava as linhas de estoque envolvidas ate o fim da transacao.
    const produtos = await Produto.findAll({
      where: { id: { [Op.in]: idsProdutos } },
      include: [{ model: Estoque, as: 'estoque' }],
      transaction: transacao,
      lock: transacao.LOCK.UPDATE,
    });

    if (produtos.length !== idsProdutos.length) {
      const encontrados = produtos.map((p) => p.id);
      const ausentes = idsProdutos.filter((id) => !encontrados.includes(id));
      throw erro(404, `Produto(s) inexistente(s): ${ausentes.join(', ')}.`, { produtos: ausentes });
    }

    // ---- Validacao de disponibilidade antes de gravar qualquer coisa ----
    const indisponiveis = [];
    for (const produto of produtos) {
      const solicitada = consolidado.get(produto.id);

      if (!produto.ativo) {
        indisponiveis.push({ produto_id: produto.id, nome: produto.nome, motivo: 'Produto inativo no catalogo.' });
        continue;
      }
      if (!produto.estoque) {
        indisponiveis.push({ produto_id: produto.id, nome: produto.nome, motivo: 'Produto sem registro de estoque.' });
        continue;
      }
      if (!produto.estoque.temDisponibilidade(solicitada)) {
        indisponiveis.push({
          produto_id: produto.id,
          nome: produto.nome,
          solicitado: solicitada,
          disponivel: produto.estoque.quantidade,
          motivo: produto.estoque.quantidade === 0 ? 'Produto esgotado.' : 'Quantidade solicitada acima do estoque.',
        });
      }
    }

    if (indisponiveis.length) {
      throw erro(409, 'Ha itens sem estoque suficiente. Ajuste o carrinho e tente novamente.', { indisponiveis });
    }

    // ---- Totais e regras de desconto (fonte de verdade e o backend) ----
    let subtotal = 0;
    let unidades = 0;
    const linhas = produtos.map((produto) => {
      const qtd = consolidado.get(produto.id);
      const precoUnitario = Number(produto.preco);
      const totalLinha = Math.round((precoUnitario * qtd + Number.EPSILON) * 100) / 100;
      subtotal += totalLinha;
      unidades += qtd;
      return {
        produto_id: produto.id,
        nome_produto: produto.nome,
        quantidade: qtd,
        preco_unitario: precoUnitario,
        subtotal: totalLinha,
      };
    });

    const apenasDigital = produtos.every((p) => p.tipo === 'DIGITAL');
    const totais = calcularTotais(subtotal, unidades, apenasDigital);

    // ---- Gravacao ----
    const pedido = await Pedido.create(
      {
        codigo: gerarCodigoPedido(),
        usuario_id: req.usuario.id,
        subtotal: totais.subtotal,
        percentual_desconto: totais.percentual_desconto,
        desconto: totais.desconto,
        frete: totais.frete,
        total: totais.total,
        regra_desconto: totais.regra_desconto,
        forma_pagamento: String(formaPagamento || 'PIX').toUpperCase(),
        status: 'PAGO',
        observacao: observacao || null,
      },
      { transaction: transacao }
    );

    await ItemPedido.bulkCreate(
      linhas.map((linha) => ({ ...linha, pedido_id: pedido.id })),
      { transaction: transacao, validate: true }
    );

    // ---- Deducao automatica do estoque ----
    for (const produto of produtos) {
      if (produto.estoque.ilimitado) continue;
      await produto.estoque.update(
        {
          quantidade: produto.estoque.quantidade - consolidado.get(produto.id),
          ultima_movimentacao: new Date(),
        },
        { transaction: transacao }
      );
    }

    // ---- Entrega vinculada ----
    const endereco = entrega || {};
    const cliente = req.usuario;
    const previsao = new Date();
    previsao.setDate(previsao.getDate() + (apenasDigital ? 0 : 7));

    await Entrega.create(
      {
        pedido_id: pedido.id,
        tipo: apenasDigital ? 'DIGITAL' : 'FISICA',
        status: apenasDigital ? 'ENTREGUE' : 'AGUARDANDO',
        transportadora: apenasDigital ? 'Entrega imediata por e-mail' : 'Breck Log',
        cep: endereco.cep || cliente.cep,
        logradouro: endereco.logradouro || cliente.logradouro,
        numero: endereco.numero || cliente.numero,
        complemento: endereco.complemento ?? cliente.complemento,
        bairro: endereco.bairro || cliente.bairro,
        cidade: endereco.cidade || cliente.cidade,
        uf: endereco.uf || cliente.uf,
        previsao_entrega: previsao.toISOString().slice(0, 10),
        data_entrega: apenasDigital ? new Date() : null,
      },
      { transaction: transacao }
    );

    await transacao.commit();

    const completo = await Pedido.findByPk(pedido.id, { include: INCLUDE_COMPLETO });
    return ok(res, completo, `Pedido ${pedido.codigo} registrado com sucesso.`, 201);
  } catch (e) {
    await transacao.rollback();
    return next(e);
  }
}

/** GET /pedidos/meus-pedidos  (privado) - historico do cliente logado */
async function meusPedidos(req, res, next) {
  try {
    const pedidos = await Pedido.findAll({
      where: { usuario_id: req.usuario.id },
      include: INCLUDE_COMPLETO,
      order: [['created_at', 'DESC']],
    });
    return ok(res, pedidos);
  } catch (e) {
    return next(e);
  }
}

/** GET /pedidos  (admin) - todos os pedidos, com filtro de status e periodo */
async function listar(req, res, next) {
  try {
    const { status, de, ate } = req.query;
    const where = {};
    if (status) where.status = String(status).toUpperCase();
    if (de || ate) {
      where.created_at = {};
      if (de) where.created_at[Op.gte] = new Date(`${de}T00:00:00`);
      if (ate) where.created_at[Op.lte] = new Date(`${ate}T23:59:59`);
    }

    const pedidos = await Pedido.findAll({ where, include: INCLUDE_COMPLETO, order: [['created_at', 'DESC']] });
    return ok(res, pedidos);
  } catch (e) {
    return next(e);
  }
}

/** GET /pedidos/buscar?codigo=  (privado) */
async function buscar(req, res, next) {
  try {
    const { codigo } = req.query;
    if (!codigo) throw erro(400, 'Informe o codigo do pedido.');

    const where = { codigo: String(codigo).trim().toUpperCase() };
    if (req.usuario.perfil !== 'ADMIN') where.usuario_id = req.usuario.id;

    const pedido = await Pedido.findOne({ where, include: INCLUDE_COMPLETO });
    if (!pedido) throw erro(404, 'Pedido nao encontrado.');
    return ok(res, pedido);
  } catch (e) {
    return next(e);
  }
}

/** GET /pedidos/:id  (privado) */
async function consultarPorId(req, res, next) {
  try {
    const pedido = await Pedido.findByPk(req.params.id, { include: INCLUDE_COMPLETO });
    if (!pedido) throw erro(404, 'Pedido nao encontrado.');

    if (req.usuario.perfil !== 'ADMIN' && pedido.usuario_id !== req.usuario.id) {
      throw erro(403, 'Este pedido pertence a outro cliente.');
    }
    return ok(res, pedido);
  } catch (e) {
    return next(e);
  }
}

const TRANSICOES = {
  PENDENTE: ['PAGO', 'CANCELADO'],
  PAGO: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['CONCLUIDO'],
  CONCLUIDO: [],
  CANCELADO: [],
};

/** PUT|PATCH /pedidos/:id  (admin) - muda o status do pedido */
async function atualizarStatus(req, res, next) {
  try {
    const pedido = await Pedido.findByPk(req.params.id, { include: [{ model: Entrega, as: 'entrega' }] });
    if (!pedido) throw erro(404, 'Pedido nao encontrado.');

    const novoStatus = String(req.body?.status ?? '').toUpperCase();
    if (!novoStatus) throw erro(400, 'Informe o novo status do pedido.');
    if (!Object.keys(TRANSICOES).includes(novoStatus)) {
      throw erro(400, `Status invalido. Use um destes: ${Object.keys(TRANSICOES).join(', ')}.`);
    }
    if (novoStatus !== pedido.status && !TRANSICOES[pedido.status].includes(novoStatus)) {
      throw erro(409, `Transicao invalida: ${pedido.status} -> ${novoStatus}.`);
    }

    await pedido.update({
      status: novoStatus,
      ...(req.body.observacao !== undefined ? { observacao: req.body.observacao } : {}),
    });

    // Mantem a entrega em sincronia com o pedido.
    if (pedido.entrega && pedido.entrega.tipo === 'FISICA') {
      if (novoStatus === 'ENVIADO') {
        await pedido.entrega.update({
          status: 'EM_TRANSITO',
          codigo_rastreio: pedido.entrega.codigo_rastreio || `BRK${String(pedido.id).padStart(8, '0')}BR`,
        });
      } else if (novoStatus === 'CONCLUIDO') {
        await pedido.entrega.update({ status: 'ENTREGUE', data_entrega: new Date() });
      } else if (novoStatus === 'CANCELADO') {
        await pedido.entrega.update({ status: 'CANCELADA' });
      }
    }

    const atualizado = await Pedido.findByPk(pedido.id, { include: INCLUDE_COMPLETO });
    return ok(res, atualizado, `Pedido atualizado para ${novoStatus}.`);
  } catch (e) {
    return next(e);
  }
}

/** DELETE /pedidos/:id  (admin) - cancela o pedido e devolve o estoque */
async function cancelar(req, res, next) {
  const transacao = await sequelize.transaction();
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [{ model: ItemPedido, as: 'itens' }, { model: Entrega, as: 'entrega' }],
      transaction: transacao,
    });
    if (!pedido) throw erro(404, 'Pedido nao encontrado.');
    if (pedido.status === 'CANCELADO') throw erro(409, 'Este pedido ja esta cancelado.');
    if (pedido.status === 'CONCLUIDO') throw erro(409, 'Um pedido concluido nao pode ser cancelado.');

    // Estorna o estoque de cada item.
    for (const item of pedido.itens) {
      const registro = await Estoque.findOne({ where: { produto_id: item.produto_id }, transaction: transacao });
      if (registro && !registro.ilimitado) {
        await registro.update(
          { quantidade: registro.quantidade + item.quantidade, ultima_movimentacao: new Date() },
          { transaction: transacao }
        );
      }
    }

    await pedido.update({ status: 'CANCELADO' }, { transaction: transacao });
    if (pedido.entrega) await pedido.entrega.update({ status: 'CANCELADA' }, { transaction: transacao });

    await transacao.commit();
    return ok(res, { id: pedido.id, status: 'CANCELADO' }, 'Pedido cancelado e estoque estornado.');
  } catch (e) {
    await transacao.rollback();
    return next(e);
  }
}

module.exports = {
  finalizar, meusPedidos, listar, buscar, consultarPorId, atualizarStatus, cancelar,
};
