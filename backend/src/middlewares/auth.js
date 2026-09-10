'use strict';

const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { erro } = require('../utils/respostas');

const SEGREDO = process.env.JWT_SECRET || 'segredo-dev-barbearia';

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil, nome: usuario.nome },
    SEGREDO,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function extrairToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return null;
  const [esquema, token] = String(header).split(' ');
  if (!/^Bearer$/i.test(esquema) || !token) return null;
  return token.trim();
}

/** Rotas privadas: exige Authorization: Bearer <TOKEN_JWT>. Sem token valido -> 401. */
async function autenticar(req, res, next) {
  try {
    const token = extrairToken(req);
    if (!token) {
      throw erro(401, 'Token de autenticacao ausente. Envie o cabecalho Authorization: Bearer <token>.');
    }

    let payload;
    try {
      payload = jwt.verify(token, SEGREDO);
    } catch (e) {
      const mensagem = e.name === 'TokenExpiredError' ? 'Sessao expirada. Faca login novamente.' : 'Token invalido.';
      throw erro(401, mensagem);
    }

    // Confere se o usuario do token ainda existe e esta ativo.
    const usuario = await Usuario.findByPk(payload.id);
    if (!usuario || !usuario.ativo) throw erro(401, 'Usuario do token nao encontrado ou inativo.');

    req.usuario = usuario;
    return next();
  } catch (e) {
    return next(e);
  }
}

/** Restringe a rota ao perfil ADMIN. */
function somenteAdmin(req, res, next) {
  if (!req.usuario) return next(erro(401, 'Autenticacao necessaria.'));
  if (req.usuario.perfil !== 'ADMIN') {
    return next(erro(403, 'Acesso restrito a administradores.'));
  }
  return next();
}

/** Le o token quando houver, mas nao bloqueia visitantes (usado em rotas mistas). */
async function autenticarOpcional(req, res, next) {
  const token = extrairToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, SEGREDO);
    req.usuario = await Usuario.findByPk(payload.id);
  } catch (_) {
    req.usuario = null;
  }
  return next();
}

module.exports = { autenticar, somenteAdmin, autenticarOpcional, gerarToken };
