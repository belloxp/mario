'use strict';

const { Usuario } = require('../models');
const { erro, ok } = require('../utils/respostas');
const { gerarToken } = require('../middlewares/auth');

/** POST /login  (publico) */
async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      throw erro(400, 'Informe e-mail e senha.');
    }

    // Precisa do scope comSenha porque o defaultScope esconde o hash.
    const usuario = await Usuario.scope('comSenha').findOne({
      where: { email: String(email).trim().toLowerCase() },
    });

    // Mensagem generica de proposito: nao revela se o e-mail existe.
    if (!usuario) throw erro(401, 'E-mail ou senha invalidos.');
    if (!usuario.ativo) throw erro(403, 'Conta desativada. Procure o suporte.');

    const senhaConfere = await usuario.verificarSenha(senha);
    if (!senhaConfere) throw erro(401, 'E-mail ou senha invalidos.');

    const token = gerarToken(usuario);
    const dados = usuario.toJSON();
    delete dados.senha;

    return ok(res, { token, usuario: dados }, 'Login realizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** GET /login/validar  (privado) - permite ao frontend conferir a sessao. */
async function validar(req, res) {
  return ok(res, { usuario: req.usuario }, 'Token valido.');
}

module.exports = { login, validar };
