'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Entrega = sequelize.define(
  'Entrega',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pedido_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    // Pedidos compostos apenas por itens digitais recebem entrega DIGITAL.
    tipo: { type: DataTypes.ENUM('FISICA', 'DIGITAL'), allowNull: false, defaultValue: 'FISICA' },
    status: {
      type: DataTypes.ENUM('AGUARDANDO', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA'),
      allowNull: false,
      defaultValue: 'AGUARDANDO',
    },
    codigo_rastreio: { type: DataTypes.STRING(40), allowNull: true },
    transportadora: { type: DataTypes.STRING(60), allowNull: true },
    cep: { type: DataTypes.STRING(8), allowNull: true },
    logradouro: { type: DataTypes.STRING(150), allowNull: true },
    numero: { type: DataTypes.STRING(20), allowNull: true },
    complemento: { type: DataTypes.STRING(80), allowNull: true },
    bairro: { type: DataTypes.STRING(100), allowNull: true },
    cidade: { type: DataTypes.STRING(100), allowNull: true },
    uf: { type: DataTypes.STRING(2), allowNull: true },
    previsao_entrega: { type: DataTypes.DATEONLY, allowNull: true },
    data_entrega: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: 'entregas' }
);

module.exports = Entrega;
