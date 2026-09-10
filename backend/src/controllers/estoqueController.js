'use strict';

const { Op, literal } = require('sequelize');
const { Estoque, Produto, Categoria } = require('../models');
const { erro, ok, apenasCamposEnviados } = require('../utils/respostas');

const INCLUDE_PRODUTO = [
  {
    model: Produto,
    as: 'produto',
    attributes: ['id', 'codigo', 'nome', 'preco', 'tipo', 'imagem', 'ativo'],
    include: [{ model: Categoria, as: 'categoria', attributes: ['id', 'nome', 'segmento'] }],
  },
];

/** GET /estoque  (admin) - posicao geral */
async function listar(req, res, next) {
  try {
    const where = {};
    // ?critico=true -> somente itens no ou abaixo do minimo
    if (req.query.critico === 'true') {
      where.ilimitado = false;
      where[Op.and] = literal('Estoque.quantidade <= Estoque.quantidade_minima');
    }

    const posicao = await Estoque.findAll({
      where,
      include: INCLUDE_PRODUTO,
      order: [['quantidade', 'ASC']],
    });

    return ok(res, posicao);
  } catch (e) {
    return next(e);
  }
}

/** GET /estoque/:id  (admin) */
async function consultarPorId(req, res, next) {
  try {
    const registro = await Estoque.findByPk(req.params.id, { include: INCLUDE_PRODUTO });
    if (!registro) throw erro(404, 'Registro de estoque nao encontrado.');
    return ok(res, registro);
  } catch (e) {
    return next(e);
  }
}

/** GET /estoque/produto/:produtoId  (admin) - consulta pelo produto */
async function consultarPorProduto(req, res, next) {
  try {
    const registro = await Estoque.findOne({
      where: { produto_id: req.params.produtoId },
      include: INCLUDE_PRODUTO,
    });
    if (!registro) throw erro(404, 'Este produto ainda nao possui registro de estoque.');
    return ok(res, registro);
  } catch (e) {
    return next(e);
  }
}

/**
 * POST /estoque  (admin) - movimentacao de entrada/saida.
 * Corpo: { produto_id, tipo: 'ENTRADA'|'SAIDA'|'AJUSTE', quantidade }
 */
async function movimentar(req, res, next) {
  try {
    const { produto_id: produtoId, tipo, quantidade } = req.body || {};

    if (!produtoId) throw erro(400, 'Informe o produto_id.');
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd < 0) throw erro(400, 'A quantidade deve ser um numero inteiro maior ou igual a zero.');

    const movimento = String(tipo || 'ENTRADA').toUpperCase();
    if (!['ENTRADA', 'SAIDA', 'AJUSTE'].includes(movimento)) {
      throw erro(400, 'O tipo de movimentacao deve ser ENTRADA, SAIDA ou AJUSTE.');
    }

    // Verificacao previa: o produto precisa existir.
    const produto = await Produto.findByPk(produtoId);
    if (!produto) throw erro(404, 'Produto nao encontrado.');

    let registro = await Estoque.findOne({ where: { produto_id: produtoId } });

    if (!registro) {
      registro = await Estoque.create({
        produto_id: produtoId,
        quantidade: movimento === 'SAIDA' ? 0 : qtd,
        quantidade_minima: Number(req.body.quantidade_minima ?? 5),
        ilimitado: produto.tipo === 'DIGITAL',
        localizacao: req.body.localizacao || 'LOJA-MATRIZ',
        ultima_movimentacao: new Date(),
      });
      const criado = await Estoque.findByPk(registro.id, { include: INCLUDE_PRODUTO });
      return ok(res, criado, 'Registro de estoque criado.', 201);
    }

    let novaQuantidade = registro.quantidade;
    if (movimento === 'ENTRADA') novaQuantidade += qtd;
    else if (movimento === 'SAIDA') novaQuantidade -= qtd;
    else novaQuantidade = qtd;

    if (novaQuantidade < 0) {
      throw erro(400, `Saida maior que o disponivel. Estoque atual: ${registro.quantidade} unidade(s).`);
    }

    await registro.update({
      quantidade: novaQuantidade,
      ...(req.body.quantidade_minima !== undefined ? { quantidade_minima: Number(req.body.quantidade_minima) } : {}),
      ...(req.body.localizacao !== undefined ? { localizacao: req.body.localizacao } : {}),
      ultima_movimentacao: new Date(),
    });

    const atualizado = await Estoque.findByPk(registro.id, { include: INCLUDE_PRODUTO });
    return ok(res, atualizado, `Movimentacao de ${movimento} registrada. Saldo atual: ${novaQuantidade}.`);
  } catch (e) {
    return next(e);
  }
}

const CAMPOS = ['quantidade', 'quantidade_minima', 'ilimitado', 'localizacao'];

async function aplicarAtualizacao(req, exigirTodos) {
  const registro = await Estoque.findByPk(req.params.id);
  if (!registro) throw erro(404, 'Registro de estoque nao encontrado.');

  if (exigirTodos && req.body?.quantidade === undefined) {
    throw erro(400, 'PUT exige o registro completo. O campo quantidade e obrigatorio.');
  }

  const dados = apenasCamposEnviados(req.body || {}, CAMPOS);
  if (!Object.keys(dados).length) throw erro(400, 'Nenhum campo valido para atualizar foi enviado.');

  if (dados.quantidade !== undefined) {
    const qtd = Number(dados.quantidade);
    if (!Number.isInteger(qtd) || qtd < 0) throw erro(400, 'A quantidade deve ser um inteiro maior ou igual a zero.');
    dados.quantidade = qtd;
  }

  dados.ultima_movimentacao = new Date();
  await registro.update(dados);
  return Estoque.findByPk(registro.id, { include: INCLUDE_PRODUTO });
}

/** PUT /estoque/:id  (admin) */
async function atualizar(req, res, next) {
  try {
    const registro = await aplicarAtualizacao(req, true);
    return ok(res, registro, 'Estoque atualizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** PATCH /estoque/:id  (admin) */
async function atualizarParcial(req, res, next) {
  try {
    const registro = await aplicarAtualizacao(req, false);
    return ok(res, registro, 'Estoque atualizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** DELETE /estoque/:id  (admin) */
async function remover(req, res, next) {
  try {
    const registro = await Estoque.findByPk(req.params.id);
    if (!registro) throw erro(404, 'Registro de estoque nao encontrado.');

    await registro.destroy();
    return ok(res, { id: Number(req.params.id) }, 'Registro de estoque excluido.');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listar, consultarPorId, consultarPorProduto,
  movimentar, atualizar, atualizarParcial, remover,
};
