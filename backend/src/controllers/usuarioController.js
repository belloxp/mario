'use strict';

const { Op } = require('sequelize');
const { Usuario, Pedido } = require('../models');
const { erro, ok, apenasCamposEnviados } = require('../utils/respostas');
const { validarCPF, somenteDigitos } = require('../utils/cpf');

const CAMPOS_EDITAVEIS = [
  'nome', 'email', 'senha', 'telefone',
  'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
];

const CAMPOS_OBRIGATORIOS = [
  'nome', 'email', 'senha', 'cpf',
  'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf',
];

/** POST /usuarios  (publico) - cadastro de cliente */
async function cadastrar(req, res, next) {
  try {
    const corpo = req.body || {};

    const faltando = CAMPOS_OBRIGATORIOS.filter((c) => !String(corpo[c] ?? '').trim());
    if (faltando.length) {
      throw erro(400, `Campos obrigatorios nao preenchidos: ${faltando.join(', ')}.`, { campos: faltando });
    }

    if (String(corpo.senha).length < 6) {
      throw erro(400, 'A senha deve ter no minimo 6 caracteres.');
    }

    // Validacao matematica do CPF antes de qualquer acesso ao banco.
    if (!validarCPF(corpo.cpf)) {
      throw erro(400, 'CPF invalido pela formula dos digitos verificadores.');
    }

    const email = String(corpo.email).trim().toLowerCase();
    const cpf = somenteDigitos(corpo.cpf);

    // Verificacao previa de existencia (e-mail / CPF ja cadastrados).
    const jaExiste = await Usuario.findOne({ where: { [Op.or]: [{ email }, { cpf }] } });
    if (jaExiste) {
      const campo = jaExiste.email === email ? 'e-mail' : 'CPF';
      throw erro(409, `Este ${campo} ja esta cadastrado.`);
    }

    const usuario = await Usuario.create({
      nome: corpo.nome,
      email,
      senha: corpo.senha,
      cpf,
      telefone: corpo.telefone || null,
      cep: somenteDigitos(corpo.cep),
      logradouro: corpo.logradouro,
      numero: corpo.numero,
      complemento: corpo.complemento || null,
      bairro: corpo.bairro,
      cidade: corpo.cidade,
      uf: corpo.uf,
      // O perfil nunca vem do cliente: cadastro publico e sempre CLIENTE.
      perfil: 'CLIENTE',
    });

    const dados = usuario.toJSON();
    delete dados.senha;
    return ok(res, dados, 'Cadastro realizado com sucesso.', 201);
  } catch (e) {
    return next(e);
  }
}

/** GET /usuarios  (admin) - listagem geral */
async function listar(req, res, next) {
  try {
    const where = {};
    if (req.query.perfil) where.perfil = String(req.query.perfil).toUpperCase();

    const usuarios = await Usuario.findAll({ where, order: [['nome', 'ASC']] });
    return ok(res, usuarios);
  } catch (e) {
    return next(e);
  }
}

/** GET /usuarios/buscar?nome=&email=&cpf=  (admin) - consulta especifica */
async function buscar(req, res, next) {
  try {
    const { nome, email, cpf } = req.query;
    if (!nome && !email && !cpf) {
      throw erro(400, 'Informe ao menos um criterio de busca: nome, email ou cpf.');
    }

    const where = {};
    if (nome) where.nome = { [Op.like]: `%${nome}%` };
    if (email) where.email = { [Op.like]: `%${String(email).toLowerCase()}%` };
    if (cpf) where.cpf = somenteDigitos(cpf);

    const usuarios = await Usuario.findAll({ where, order: [['nome', 'ASC']] });
    if (!usuarios.length) throw erro(404, 'Nenhum usuario encontrado com os criterios informados.');

    return ok(res, usuarios);
  } catch (e) {
    return next(e);
  }
}

/** GET /usuarios/perfil  (privado) - dados da conta logada */
async function perfil(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      include: [
        { model: Pedido, as: 'pedidos', attributes: ['id', 'codigo', 'total', 'status', 'created_at'] },
      ],
      order: [[{ model: Pedido, as: 'pedidos' }, 'created_at', 'DESC']],
    });
    return ok(res, usuario);
  } catch (e) {
    return next(e);
  }
}

/** GET /usuarios/:id  (privado) - o proprio usuario ou um admin */
async function consultarPorId(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) throw erro(404, 'Usuario nao encontrado.');

    if (req.usuario.perfil !== 'ADMIN' && req.usuario.id !== usuario.id) {
      throw erro(403, 'Voce so pode consultar os seus proprios dados.');
    }
    return ok(res, usuario);
  } catch (e) {
    return next(e);
  }
}

/** Regras comuns de PUT e PATCH. */
async function aplicarAtualizacao(req, exigirTodos) {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) throw erro(404, 'Usuario nao encontrado.');

  if (req.usuario.perfil !== 'ADMIN' && req.usuario.id !== usuario.id) {
    throw erro(403, 'Voce so pode alterar os seus proprios dados.');
  }

  const corpo = req.body || {};

  if (exigirTodos) {
    const obrigatoriosPut = ['nome', 'email', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'];
    const faltando = obrigatoriosPut.filter((c) => !String(corpo[c] ?? '').trim());
    if (faltando.length) {
      throw erro(400, `PUT exige o registro completo. Campos ausentes: ${faltando.join(', ')}.`, { campos: faltando });
    }
  }

  const dados = apenasCamposEnviados(corpo, CAMPOS_EDITAVEIS);

  if (dados.senha !== undefined && String(dados.senha).length < 6) {
    throw erro(400, 'A senha deve ter no minimo 6 caracteres.');
  }
  if (dados.senha === '' || dados.senha === null) delete dados.senha;

  if (dados.email) {
    dados.email = String(dados.email).trim().toLowerCase();
    const emailEmUso = await Usuario.findOne({
      where: { email: dados.email, id: { [Op.ne]: usuario.id } },
    });
    if (emailEmUso) throw erro(409, 'Este e-mail ja esta em uso por outro usuario.');
  }

  if (dados.cep) dados.cep = somenteDigitos(dados.cep);

  // Somente um admin pode promover/rebaixar perfil ou (des)ativar contas.
  if (req.usuario.perfil === 'ADMIN') {
    if (corpo.perfil !== undefined) dados.perfil = String(corpo.perfil).toUpperCase();
    if (corpo.ativo !== undefined) dados.ativo = Boolean(corpo.ativo);
  }

  if (!Object.keys(dados).length) throw erro(400, 'Nenhum campo valido para atualizar foi enviado.');

  await usuario.update(dados);
  return usuario;
}

/** PUT /usuarios/:id  (privado) - atualizacao completa */
async function atualizar(req, res, next) {
  try {
    const usuario = await aplicarAtualizacao(req, true);
    return ok(res, usuario, 'Cadastro atualizado com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** PATCH /usuarios/:id  (privado) - atualizacao parcial */
async function atualizarParcial(req, res, next) {
  try {
    const usuario = await aplicarAtualizacao(req, false);
    return ok(res, usuario, 'Dados atualizados com sucesso.');
  } catch (e) {
    return next(e);
  }
}

/** DELETE /usuarios/:id  (admin) */
async function remover(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) throw erro(404, 'Usuario nao encontrado.');

    if (usuario.id === req.usuario.id) {
      throw erro(400, 'Um administrador nao pode excluir a propria conta.');
    }

    // Cliente com historico de pedidos e desativado (preserva a integridade dos relatorios).
    const totalPedidos = await Pedido.count({ where: { usuario_id: usuario.id } });
    if (totalPedidos > 0) {
      await usuario.update({ ativo: false });
      return ok(res, { id: usuario.id, ativo: false }, 'Usuario possui pedidos: a conta foi desativada em vez de excluida.');
    }

    await usuario.destroy();
    return ok(res, { id: Number(req.params.id) }, 'Usuario excluido com sucesso.');
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  cadastrar, listar, buscar, perfil, consultarPorId,
  atualizar, atualizarParcial, remover,
};
