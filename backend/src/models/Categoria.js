'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categoria = sequelize.define(
  'Categoria',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: { msg: 'Ja existe uma categoria com este nome.' },
      validate: { notEmpty: { msg: 'O nome da categoria e obrigatorio.' } },
    },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    descricao: { type: DataTypes.STRING(255), allowNull: true },
    // Segmento da barbearia usado nos relatorios gerenciais.
    segmento: {
      type: DataTypes.ENUM('CABELO', 'BARBA', 'FERRAMENTA', 'DIGITAL'),
      allowNull: false,
      defaultValue: 'CABELO',
    },
    // Chave do icone SVG desenhado no frontend (js/ui.js -> UI.ICONES).
    icone: { type: DataTypes.STRING(30), allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'categorias',
    hooks: {
      beforeValidate(categoria) {
        if (categoria.nome && !categoria.slug) {
          categoria.slug = String(categoria.nome)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        }
      },
    },
  }
);

module.exports = Categoria;
