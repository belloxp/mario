'use strict';

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { validarCPF, somenteDigitos } = require('../utils/cpf');

const Usuario = sequelize.define(
  'Usuario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: { msg: 'O nome e obrigatorio.' }, len: { args: [3, 120], msg: 'O nome deve ter entre 3 e 120 caracteres.' } },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: { msg: 'Este e-mail ja esta cadastrado.' },
      validate: { isEmail: { msg: 'E-mail invalido.' } },
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: { msg: 'A senha e obrigatoria.' } },
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: { msg: 'Este CPF ja esta cadastrado.' },
      validate: {
        cpfMatematico(valor) {
          if (!validarCPF(valor)) throw new Error('CPF invalido pela formula dos digitos verificadores.');
        },
      },
    },
    telefone: { type: DataTypes.STRING(20), allowNull: true },
    perfil: {
      type: DataTypes.ENUM('CLIENTE', 'ADMIN'),
      allowNull: false,
      defaultValue: 'CLIENTE',
    },
    // ---- Endereco (obrigatorio, preenchido via ViaCEP) ----
    cep: {
      type: DataTypes.STRING(8),
      allowNull: false,
      validate: { is: { args: /^\d{8}$/, msg: 'CEP deve conter 8 digitos.' } },
    },
    logradouro: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: { msg: 'O logradouro e obrigatorio.' } } },
    numero: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: { msg: 'O numero e obrigatorio.' } } },
    complemento: { type: DataTypes.STRING(80), allowNull: true },
    bairro: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: { msg: 'O bairro e obrigatorio.' } } },
    cidade: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: { msg: 'A cidade e obrigatoria.' } } },
    uf: { type: DataTypes.STRING(2), allowNull: false, validate: { len: { args: [2, 2], msg: 'UF deve ter 2 letras.' } } },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'usuarios',
    hooks: {
      beforeValidate(usuario) {
        if (usuario.cpf) usuario.cpf = somenteDigitos(usuario.cpf);
        if (usuario.cep) usuario.cep = somenteDigitos(usuario.cep);
        if (usuario.email) usuario.email = String(usuario.email).trim().toLowerCase();
        if (usuario.uf) usuario.uf = String(usuario.uf).trim().toUpperCase();
      },
      async beforeSave(usuario) {
        // Criptografa somente quando a senha realmente mudou (evita re-hash no PATCH).
        if (usuario.changed('senha')) {
          usuario.senha = await bcrypt.hash(usuario.senha, 10);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ['senha'] },
    },
    scopes: {
      comSenha: { attributes: { include: ['senha'] } },
    },
  }
);

Usuario.prototype.verificarSenha = function verificarSenha(senhaPura) {
  return bcrypt.compare(senhaPura, this.senha);
};

module.exports = Usuario;
