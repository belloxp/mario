'use strict';

const { ApiError } = require('../utils/respostas');

/** 404 para rotas inexistentes. */
function naoEncontrado(req, res) {
  return res.status(404).json({
    sucesso: false,
    mensagem: `Rota nao encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/** Tratamento central de erros: converte erros do Sequelize em respostas legiveis. */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      sucesso: false,
      mensagem: err.message,
      ...(err.detalhes ? { detalhes: err.detalhes } : {}),
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Dados invalidos.',
      detalhes: err.errors.map((e) => ({ campo: e.path, mensagem: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      sucesso: false,
      mensagem: err.errors?.[0]?.message || 'Registro duplicado.',
      detalhes: err.errors.map((e) => ({ campo: e.path, mensagem: e.message })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      sucesso: false,
      mensagem: 'Existe um vinculo com outro registro que impede esta operacao.',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ sucesso: false, mensagem: 'JSON malformado no corpo da requisicao.' });
  }

  console.error('[erro-nao-tratado]', err);
  return res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
}

module.exports = { errorHandler, naoEncontrado };
