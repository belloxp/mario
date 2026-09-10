'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Pedido = sequelize.define(
  'Pedido',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    percentual_desconto: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
    desconto: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    frete: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    regra_desconto: { type: DataTypes.STRING(120), allowNull: true },
    forma_pagamento: {
      type: DataTypes.ENUM('PIX', 'CARTAO', 'BOLETO'),
      allowNull: false,
      defaultValue: 'PIX',
    },
    status: {
      type: DataTypes.ENUM('PENDENTE', 'PAGO', 'ENVIADO', 'CONCLUIDO', 'CANCELADO'),
      allowNull: false,
      defaultValue: 'PENDENTE',
    },
    observacao: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'pedidos' }
);

module.exports = Pedido;
