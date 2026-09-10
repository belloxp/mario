'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Estoque = sequelize.define(
  'Estoque',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: { msg: 'Este produto ja possui um registro de estoque.' },
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: { args: [0], msg: 'A quantidade em estoque nao pode ser negativa.' } },
    },
    quantidade_minima: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    // Vale-presente e cursos digitais sao ilimitados: nao bloqueiam a venda.
    ilimitado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    localizacao: { type: DataTypes.STRING(80), allowNull: true, defaultValue: 'LOJA-MATRIZ' },
    ultima_movimentacao: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'estoque' }
);

Estoque.prototype.temDisponibilidade = function temDisponibilidade(qtd) {
  return this.ilimitado || this.quantidade >= qtd;
};

module.exports = Estoque;
