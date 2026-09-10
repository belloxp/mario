'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * O Railway injeta a string de conexao pronta (MYSQL_URL / DATABASE_URL).
 * Em ambiente local caimos nas variaveis individuais do .env.
 */
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

const commonOptions = {
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? (msg) => console.log(`[sql] ${msg}`) : false,
  timezone: '-03:00',
  define: {
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: {
    decimalNumbers: true,
  },
};

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, commonOptions)
  : new Sequelize(
      process.env.DB_NAME || 'barbearia_breck',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        ...commonOptions,
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
      }
    );

module.exports = { sequelize, Sequelize };
