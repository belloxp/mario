'use strict';

const { Op } = require('sequelize');
const { sequelize, Produto, Categoria, Estoque, ItemPedido } = require('../models');
const { erro, ok, apenasCamposEnviados } = require('../utils/respostas');

const CAMPOS = [
  'codigo', 'nome', 'descricao', 'preco', 'imagem', 'tipo',
  'linha', 'finalidade', 'marca', 'especificacoes', 'ativo', 'categoria_id',
];

const INCLUDE_PADRAO = [
  { model: Categoria, as: 'categoria', attributes: ['id', 'nome', 'slug', 'segmento', 'icone'] },
  { model: Estoque, as: 'estoque', attributes: ['id', 'quantidade', 'quantidade_minima', 'ilimitado'] },
];

/** GET /produtos  (publico) - listagem geral com filtros opcionais */
async function listar(req, res, next) {
  try {
    const { categoria, tipo, linha, finalidade, precoMin, precoMax, ordenar, incluirInativos } = req.query;

    const where = {};
    if (incluirInativos !== 'true') where.ativo = true;
    if (tipo) where.tipo = String(tipo).toUpperCase();
    if (linha) where.linha = { [Op.like]: `%${linha}%` };
    if (finalidade) where.finalidade = { [Op.like]: `%${finalidade}%` };
    if (precoMin || precoMax) {
      where.preco = {};
      if (precoMin) where.preco[Op.gte] = Number(precoMin);
      if (precoMax) where.preco[Op.lte] = Number(precoMax);
    }

    const includeCategoria = { ...INCLUDE_PADRAO[0] };
    if (categoria) {
      // Aceita id numerico, slug ou nome da categoria.
      if (/^\d+$/.test(categoria)) {
        where.categoria_id = Number(categoria);
      } else {
        includeCategoria.where = {
          [Op.or]: [{ slug: categoria }, { nome: { [Op.like]: `%${categoria}%` } }],
        };
      }
    }

    const ordens = {
      preco_asc: [['preco', 'ASC']],
      preco_desc: [['preco', 'DESC']],
      nome: [['nome', 'ASC']],
      recentes: [['created_at', 'DESC']],
    };

    const produtos = await Produto.findAll({
      where,
      include: [includeCategoria, INCLUDE_PADRAO[1]],
      order: ordens[ordenar] || [['nome', 'ASC']],
    });

    return ok(res, produtos);
  } catch (e) {
    return next(e);
  }
}

/** GET /produtos/buscar?nome=&codigo=  (publico) - consulta por nome ou codigo */
async function buscar(req, res, next) {
  try {
    const { nome, codigo, q } = req.query;
    const termo = nome || q;

    if (!termo && !codigo) {
      throw erro(400, 'Informe nome (ou q) ou codigo para a busca.');
    }

    const where = { ativo: true };
    if (codigo) where.codigo = String(codigo).trim().toUpperCase();
    if (termo) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${termo}%` } },
        { descricao: { [Op.like]: `%${termo}%` } },
        { marca: { [Op.like]: `%${termo}%` } },
        { linha: { [Op.like]: `%${termo}%` } },
      ];
    }

    const produtos = await Produto.findAll({ where, include: INCLUDE_PADRAO, order: [['nome', 'ASC']] });
    if (!produtos.length) throw erro(404, 'Nenhum produto encontrado para os criterios informados.');

    return ok(res, produtos);
  } catch (e) {
    return next(e);
  }
}

/** GET /produtos/codigo/:codigo  (publico) - consulta por codigo */
async function consultarPorCodigo(req, res, next) {
  try {
    const produto = await Produto.findOne({
      where: { codigo: String(req.params.codigo).trim().toUpperCase() },
      include: INCLUDE_PADRAO,
    });
    if (!produto) throw erro(404, `Nenhum produto com o codigo ${req.params.codigo}.`);
    return ok(res, produto);
  } catch (e) {
    return next(e);
  }
}

/** GET /produtos/:id  (publico) */
async function consultarPorId(req, res, next) {
  try {
    if (!/^\d+$/.test(req.params.id)) throw erro(400, 'O id do produto deve ser numerico.');

    const produto = await Produto.findByPk(req.params.id, { include: INCLUDE_PADRAO });
    if (!produto) throw erro(404, 'Produto nao encontrado.');
    return ok(res, produto);
  } catch (e) {
    return next(e);
  }
}

/** POST /produtos  (admin) - cria o produto e ja abre o registro de estoque */
async function cadastrar(req, res, next) {
  const transacao = await sequelize.transaction();
  try {
    const corpo = req.body || {};
    const obrigatorios = ['codigo', 'nome', 'preco', 'categoria_id'];
    const faltando = obrigatorios.filter((c) => corpo[c] === undefined || String(corpo[c]).trim() === '');
    if (faltando.length) {
      throw erro(400, `Campos obrigatorios nao preenchidos: ${faltando.join(', ')}.`, { campos: faltando });
    }

    // Verificacao previa: codigo duplicado e categoria existente.
    const codigo = String(corpo.codigo).trim().toUpperCase();
    const duplicado = await Produto.findOne({ where: { codigo }, transaction: transacao });
    if (duplicado) throw erro(409, `Ja existe um produto com o codigo ${codigo}.`);

    const categoria = await Categoria.findByPk(corpo.categoria_id, { transaction: transacao });
    if (!categoria) throw erro(404, 'Categoria informada nao existe.');

    const produto = await Produto.create(apenasCamposEnviados(corpo, CAMPOS), { transaction: transacao });

    await Estoque.create(
      {
        produto_id: produto.id,
        quantidade: Number(corpo.quantidade_estoque ?? 0),
        quantidade_minima: Number(corpo.quantidade_minima ?? 5),
        ilimitado: corpo.tipo === 'DIGITAL' ? corpo.estoque_ilimitado !== false : Boolean(corpo.estoque_ilimitado),
        ultima_movimentacao: new Date(),
      },
      { transaction: transacao }
    );

    await transacao.commit();

    const criado = await Produto.findByPk(produto.id, { include: INCLUDE_PADRAO });
    return ok(res, criado, 'Produto cadastrado com sucesso.', 201);
  } catch (e) {
    await transacao.rollback();
    return next(e);
  }
}

async function aplicarAtualizacao(req, exigirTodos) {
  // Verificacao previa de existencia antes de qualquer manipulacao.
  const produto = await Produto.findByPk(req.params.id);
  if (!produto) throw erro(404, 'Produto nao encontrado.');

  const corpo = req.body || {};

  if (exigirTodos) {
    const obrigatorios = ['codigo', 'nome', 'preco', 'categoria_id'];
    const faltando = obrigatorios.filter((c) => corpo[c] === undefined || String(corpo[c]).trim() === '');
    if (faltando.length) {
      throw erro(400, `PUT exige o registro completo. Campos ausentes: ${faltando.join(', ')}.`, { campos: faltando });
    }
  }

  const dados = apenasCamposEnviados(corpo, CAMPOS);
  if (!Object.keys(dados).length) throw erro(400, 'Nenhum campo valido para atualizar foi enviado.');

  if (dados.codigo) {
    const codigo = String(dados.codigo).trim().toUpperCase();
    const duplicado = await Produto.findOne({ where: { codigo, id: { [Op.ne]: produto.id } } });
    if (duplicado) throw erro(409, `Ja existe outro produto com o codigo ${codigo}.`);
  }

  if (dados.categoria_id) {
    const categoria = await Categoria.findByPk(dados.categoria_id);
    if (!categoria) throw erro(404, 'Categoria informada nao existe.');
  }

  await produto.update(dados);
  return Produto.findByPk(produto.id, { include: INCLUDE_PADRAO });
}

/** PUT /produtos/:id  (admin) */
async function atualizar(req, res, next) {
  try {
    const produto = await aplicarAtualizacao(req, true);
    return ok(res, produto, 'Produto atualizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** PATCH /produtos/:id  (admin) - ex.: reajuste de preco */
async function atualizarParcial(req, res, next) {
  try {
    const produto = await aplicarAtualizacao(req, false);
    return ok(res, produto, 'Produto atualizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** DELETE /produtos/:id  (admin) */
async function remover(req, res, next) {
  try {
    const produto = await Produto.findByPk(req.params.id);
    if (!produto) throw erro(404, 'Produto nao encontrado.');

    // Produto ja vendido nao pode sumir do historico: e apenas desativado.
    const vendido = await ItemPedido.count({ where: { produto_id: produto.id } });
    if (vendido > 0) {
      await produto.update({ ativo: false });
      return ok(
        res,
        { id: produto.id, ativo: false },
        'Produto possui vendas registradas: foi desativado do catalogo em vez de excluido.'
      );
    }

    await Estoque.destroy({ where: { produto_id: produto.id } });
    await produto.destroy();
    return ok(res, { id: Number(req.params.id) }, 'Produto excluido com sucesso.');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listar, buscar, consultarPorCodigo, consultarPorId,
  cadastrar, atualizar, atualizarParcial, remover,
};
