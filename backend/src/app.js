'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const rotas = require('./routes');
const { errorHandler, naoEncontrado } = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');

/**
 * CORS liberado por padrao para que a loja hospedada no Vercel
 * consiga consumir a API publicada no Railway.
 * Defina CORS_ORIGINS no .env para restringir (lista separada por virgula).
 */
const origens = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: origens.length ? origens : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Log simples de requisicoes (ajuda na correcao e no debug do deploy).
app.use((req, res, next) => {
  const inicio = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio}ms)`);
  });
  next();
});

app.use('/', rotas);

app.use(naoEncontrado);
app.use(errorHandler);

module.exports = app;
