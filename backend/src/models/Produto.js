'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Produto = sequelize.define(
  'Produto',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { msg: 'Ja existe um produto com este codigo.' },
      validate: { notEmpty: { msg: 'O codigo do produto e obrigatorio.' } },
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: { msg: 'O nome do produto e obrigatorio.' } },
    },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'O preco deve ser maior que zero.' } },
    },
    imagem: { type: DataTypes.STRING(500), allowNull: true },
    /**
     * COSMETICO  -> pomadas, oleos, balms, shampoos (exibe a tabela de composicao)
     * FERRAMENTA -> maquinas, navalhas, tesouras e acessorios da cadeira
     * DIGITAL    -> vale-presente e cursos (entrega imediata, licencas ilimitadas)
     */
    tipo: {
      type: DataTypes.ENUM('COSMETICO', 'FERRAMENTA', 'DIGITAL'),
      allowNull: false,
      defaultValue: 'COSMETICO',
    },
    // Linha do produto: Barba, Cabelo, Navalhas, Maquinas...
    linha: { type: DataTypes.STRING(60), allowNull: true },
    // Finalidade no atendimento: fixacao forte, hidratacao, acabamento...
    finalidade: { type: DataTypes.STRING(80), allowNull: true },
    marca: { type: DataTypes.STRING(60), allowNull: true },
    /**
     * Dados contextuais variaveis por tipo de produto:
     * composicao e rendimento (COSMETICO), ficha tecnica (FERRAMENTA) ou
     * conteudo programatico (DIGITAL).
     */
    especificacoes: { type: DataTypes.JSON, allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    categoria_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'produtos',
    hooks: {
      beforeValidate(produto) {
        if (produto.codigo) produto.codigo = String(produto.codigo).trim().toUpperCase();
      },
    },
  }
);

module.exports = Produto;
