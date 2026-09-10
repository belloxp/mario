'use strict';

const { Op, fn, col } = require('sequelize');
const { Categoria, Produto } = require('../models');
const { erro, ok, apenasCamposEnviados } = require('../utils/respostas');

const CAMPOS = ['nome', 'slug', 'descricao', 'segmento', 'icone', 'ativo'];

/** GET /categorias  (publico) */
async function listar(req, res, next) {
  try {
    const where = {};
    if (req.query.ativo !== undefined) where.ativo = req.query.ativo !== 'false';

    const categorias = await Categoria.findAll({
      where,
      attributes: {
        include: [[fn('COUNT', col('produtos.id')), 'total_produtos']],
      },
      include: [{ model: Produto, as: 'produtos', attributes: [] }],
      group: ['Categoria.id'],
      order: [['nome', 'ASC']],
      subQuery: false,
    });

    return ok(res, categorias);
  } catch (e) {
    return next(e);
  }
}

/** GET /categorias/buscar?nome=  (publico) */
async function buscar(req, res, next) {
  try {
    const { nome, segmento } = req.query;
    if (!nome && !segmento) throw erro(400, 'Informe nome ou segmento para a busca.');

    const where = {};
    if (nome) where.nome = { [Op.like]: `%${nome}%` };
    if (segmento) where.segmento = String(segmento).toUpperCase();

    const categorias = await Categoria.findAll({ where, order: [['nome', 'ASC']] });
    if (!categorias.length) throw erro(404, 'Nenhuma categoria encontrada.');

    return ok(res, categorias);
  } catch (e) {
    return next(e);
  }
}

/** GET /categorias/:id  (publico) */
async function consultarPorId(req, res, next) {
  try {
    const categoria = await Categoria.findByPk(req.params.id, {
      include: [{ model: Produto, as: 'produtos', attributes: ['id', 'codigo', 'nome', 'preco', 'imagem'] }],
    });
    if (!categoria) throw erro(404, 'Categoria nao encontrada.');
    return ok(res, categoria);
  } catch (e) {
    return next(e);
  }
}

/** POST /categorias  (admin) */
async function cadastrar(req, res, next) {
  try {
    const { nome } = req.body || {};
    if (!String(nome ?? '').trim()) throw erro(400, 'O nome da categoria e obrigatorio.');

    // Verificacao previa de existencia.
    const jaExiste = await Categoria.findOne({ where: { nome: String(nome).trim() } });
    if (jaExiste) throw erro(409, 'Ja existe uma categoria com este nome.');

    const categoria = await Categoria.create(apenasCamposEnviados(req.body, CAMPOS));
    return ok(res, categoria, 'Categoria cadastrada com sucesso.', 201);
  } catch (e) {
    return next(e);
  }
}

async function aplicarAtualizacao(req, exigirTodos) {
  const categoria = await Categoria.findByPk(req.params.id);
  if (!categoria) throw erro(404, 'Categoria nao encontrada.');

  if (exigirTodos && !String(req.body?.nome ?? '').trim()) {
    throw erro(400, 'PUT exige o registro completo. O campo nome e obrigatorio.');
  }

  const dados = apenasCamposEnviados(req.body || {}, CAMPOS);
  if (!Object.keys(dados).length) throw erro(400, 'Nenhum campo valido para atualizar foi enviado.');

  if (dados.nome) {
    const duplicada = await Categoria.findOne({
      where: { nome: dados.nome, id: { [Op.ne]: categoria.id } },
    });
    if (duplicada) throw erro(409, 'Ja existe outra categoria com este nome.');
  }

  await categoria.update(dados);
  return categoria;
}

/** PUT /categorias/:id  (admin) */
async function atualizar(req, res, next) {
  try {
    const categoria = await aplicarAtualizacao(req, true);
    return ok(res, categoria, 'Categoria atualizada com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** PATCH /categorias/:id  (admin) */
async function atualizarParcial(req, res, next) {
  try {
    const categoria = await aplicarAtualizacao(req, false);
    return ok(res, categoria, 'Categoria atualizada com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** DELETE /categorias/:id  (admin) */
async function remover(req, res, next) {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) throw erro(404, 'Categoria nao encontrada.');

    const vinculados = await Produto.count({ where: { categoria_id: categoria.id } });
    if (vinculados > 0) {
      throw erro(409, `Nao e possivel excluir: existem ${vinculados} produto(s) nesta categoria.`);
    }

    await categoria.destroy();
    return ok(res, { id: Number(req.params.id) }, 'Categoria excluida com sucesso.');
  } catch (e) {
    return next(e);
  }
}

module.exports = { listar, buscar, consultarPorId, cadastrar, atualizar, atualizarParcial, remover };
