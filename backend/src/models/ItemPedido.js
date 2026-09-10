'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ItemPedido = sequelize.define(
  'ItemPedido',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    pedido_id: { type: DataTypes.INTEGER, allowNull: false },
    produto_id: { type: DataTypes.INTEGER, allowNull: false },
    // Snapshot do produto no momento da compra (o catalogo pode mudar depois).
    nome_produto: { type: DataTypes.STRING(150), allowNull: false },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: { args: [1], msg: 'A quantidade do item deve ser no minimo 1.' } },
    },
    preco_unitario: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: 'itens_pedido' }
);

module.exports = ItemPedido;
