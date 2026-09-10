'use strict';

const { Entrega, Pedido, Usuario } = require('../models');
const { erro, ok, apenasCamposEnviados } = require('../utils/respostas');

const CAMPOS = [
  'tipo', 'status', 'codigo_rastreio', 'transportadora',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
  'previsao_entrega', 'data_entrega',
];

const INCLUDE_PEDIDO = [
  {
    model: Pedido,
    as: 'pedido',
    attributes: ['id', 'codigo', 'total', 'status', 'usuario_id'],
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] }],
  },
];

/** GET /entregas  (admin) */
async function listar(req, res, next) {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status).toUpperCase();

    const entregas = await Entrega.findAll({ where, include: INCLUDE_PEDIDO, order: [['created_at', 'DESC']] });
    return ok(res, entregas);
  } catch (e) {
    return next(e);
  }
}

/** GET /entregas/:id  (privado) - dono do pedido ou admin */
async function consultarPorId(req, res, next) {
  try {
    const entrega = await Entrega.findByPk(req.params.id, { include: INCLUDE_PEDIDO });
    if (!entrega) throw erro(404, 'Entrega nao encontrada.');

    if (req.usuario.perfil !== 'ADMIN' && entrega.pedido?.usuario_id !== req.usuario.id) {
      throw erro(403, 'Esta entrega pertence ao pedido de outro cliente.');
    }
    return ok(res, entrega);
  } catch (e) {
    return next(e);
  }
}

/** GET /entregas/rastreio/:codigo  (privado) - consulta pelo codigo de rastreio */
async function consultarPorRastreio(req, res, next) {
  try {
    const entrega = await Entrega.findOne({
      where: { codigo_rastreio: String(req.params.codigo).trim().toUpperCase() },
      include: INCLUDE_PEDIDO,
    });
    if (!entrega) throw erro(404, 'Nenhuma entrega com este codigo de rastreio.');

    if (req.usuario.perfil !== 'ADMIN' && entrega.pedido?.usuario_id !== req.usuario.id) {
      throw erro(403, 'Esta entrega pertence ao pedido de outro cliente.');
    }
    return ok(res, entrega);
  } catch (e) {
    return next(e);
  }
}

/** POST /entregas  (admin) - cria a entrega de um pedido que ainda nao tenha uma */
async function cadastrar(req, res, next) {
  try {
    const { pedido_id: pedidoId } = req.body || {};
    if (!pedidoId) throw erro(400, 'Informe o pedido_id.');

    const pedido = await Pedido.findByPk(pedidoId);
    if (!pedido) throw erro(404, 'Pedido nao encontrado.');

    const jaExiste = await Entrega.findOne({ where: { pedido_id: pedidoId } });
    if (jaExiste) throw erro(409, 'Este pedido ja possui uma entrega vinculada.');

    const entrega = await Entrega.create({
      pedido_id: pedidoId,
      ...apenasCamposEnviados(req.body, CAMPOS),
    });

    const criada = await Entrega.findByPk(entrega.id, { include: INCLUDE_PEDIDO });
    return ok(res, criada, 'Entrega cadastrada com sucesso.', 201);
  } catch (e) {
    return next(e);
  }
}

const STATUS_VALIDOS = ['AGUARDANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'];

async function aplicarAtualizacao(req, exigirTodos) {
  const entrega = await Entrega.findByPk(req.params.id);
  if (!entrega) throw erro(404, 'Entrega nao encontrada.');

  if (exigirTodos && !req.body?.status) {
    throw erro(400, 'PUT exige o registro completo. O campo status e obrigatorio.');
  }

  const dados = apenasCamposEnviados(req.body || {}, CAMPOS);
  if (!Object.keys(dados).length) throw erro(400, 'Nenhum campo valido para atualizar foi enviado.');

  if (dados.status) {
    dados.status = String(dados.status).toUpperCase();
    if (!STATUS_VALIDOS.includes(dados.status)) {
      throw erro(400, `Status invalido. Use um destes: ${STATUS_VALIDOS.join(', ')}.`);
    }
    // Carimba a data automaticamente ao marcar como entregue.
    if (dados.status === 'ENTREGUE' && !dados.data_entrega) dados.data_entrega = new Date();
  }

  await entrega.update(dados);
  return Entrega.findByPk(entrega.id, { include: INCLUDE_PEDIDO });
}

/** PUT /entregas/:id  (admin) */
async function atualizar(req, res, next) {
  try {
    const entrega = await aplicarAtualizacao(req, true);
    return ok(res, entrega, 'Entrega atualizada com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** PATCH /entregas/:id  (admin) */
async function atualizarParcial(req, res, next) {
  try {
    const entrega = await aplicarAtualizacao(req, false);
    return ok(res, entrega, 'Entrega atualizada com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** DELETE /entregas/:id  (admin) */
async function remover(req, res, next) {
  try {
    const entrega = await Entrega.findByPk(req.params.id);
    if (!entrega) throw erro(404, 'Entrega nao encontrada.');
    if (entrega.status === 'ENTREGUE') throw erro(409, 'Uma entrega ja concluida nao pode ser excluida.');

    await entrega.destroy();
    return ok(res, { id: Number(req.params.id) }, 'Entrega excluida com sucesso.');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listar, consultarPorId, consultarPorRastreio,
  cadastrar, atualizar, atualizarParcial, remover,
};
