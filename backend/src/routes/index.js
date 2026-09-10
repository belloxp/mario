'use strict';

const express = require('express');

const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const produtoRoutes = require('./produtoRoutes');
const estoqueRoutes = require('./estoqueRoutes');
const pedidoRoutes = require('./pedidoRoutes');
const entregaRoutes = require('./entregaRoutes');
const relatorioRoutes = require('./relatorioRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    sucesso: true,
    api: 'Breck Barber',
    versao: '1.0.0',
    documentacao: 'Consulte o arquivo rest_client.http na raiz do backend.',
    endpoints: {
      publicos: [
        'POST /login',
        'POST /usuarios',
        'GET /produtos',
        'GET /produtos/:id',
        'GET /produtos/buscar?nome=',
        'GET /produtos/codigo/:codigo',
        'GET /categorias',
      ],
      privados: [
        'GET /usuarios/perfil',
        'PUT /usuarios/:id',
        'PATCH /usuarios/:id',
        'POST /pedidos',
        'GET /pedidos/meus-pedidos',
        'POST|PUT|PATCH|DELETE /produtos',
        'POST /estoque',
        'PUT /estoque/:id',
        'GET /relatorios/vendas',
        'GET /relatorios/estoque',
      ],
    },
  });
});

router.get('/health', (req, res) => res.json({ sucesso: true, status: 'ok' }));

router.use('/login', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/produtos', produtoRoutes);
router.use('/estoque', estoqueRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/entregas', entregaRoutes);
router.use('/relatorios', relatorioRoutes);

module.exports = router;
