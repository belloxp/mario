'use strict';

const { sequelize, Sequelize } = require('../config/database');

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Produto = require('./Produto');
const Estoque = require('./Estoque');
const Pedido = require('./Pedido');
const ItemPedido = require('./ItemPedido');
const Entrega = require('./Entrega');

/* ============================================================
   RELACIONAMENTOS (7 entidades)
   Categoria 1 --- N Produto
   Produto   1 --- 1 Estoque
   Usuario   1 --- N Pedido
   Pedido    1 --- N ItemPedido      N --- 1 Produto
   Pedido    1 --- 1 Entrega
   ============================================================ */

Categoria.hasMany(Produto, { foreignKey: 'categoria_id', as: 'produtos' });
Produto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

Produto.hasOne(Estoque, { foreignKey: 'produto_id', as: 'estoque', onDelete: 'CASCADE' });
Estoque.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

Usuario.hasMany(Pedido, { foreignKey: 'usuario_id', as: 'pedidos' });
Pedido.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Pedido.hasMany(ItemPedido, { foreignKey: 'pedido_id', as: 'itens', onDelete: 'CASCADE' });
ItemPedido.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

Produto.hasMany(ItemPedido, { foreignKey: 'produto_id', as: 'itensVendidos' });
ItemPedido.belongsTo(Produto, { foreignKey: 'produto_id', as: 'produto' });

Pedido.hasOne(Entrega, { foreignKey: 'pedido_id', as: 'entrega', onDelete: 'CASCADE' });
Entrega.belongsTo(Pedido, { foreignKey: 'pedido_id', as: 'pedido' });

module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Categoria,
  Produto,
  Estoque,
  Pedido,
  ItemPedido,
  Entrega,
};
