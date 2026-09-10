'use strict';

const express = require('express');
const pedidoController = require('../controllers/pedidoController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- TODAS PRIVADAS ---------- */
router.use(autenticar);

// Checkout: converte o carrinho do LocalStorage em venda real.
router.post('/', pedidoController.finalizar);

router.get('/meus-pedidos', pedidoController.meusPedidos);
router.get('/buscar', pedidoController.buscar);
router.get('/', somenteAdmin, pedidoController.listar);
router.get('/:id', pedidoController.consultarPorId);

router.put('/:id', somenteAdmin, pedidoController.atualizarStatus);
router.patch('/:id', somenteAdmin, pedidoController.atualizarStatus);
router.delete('/:id', somenteAdmin, pedidoController.cancelar);

module.exports = router;
