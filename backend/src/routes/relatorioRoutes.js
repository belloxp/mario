'use strict';

const express = require('express');
const relatorioController = require('../controllers/relatorioController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- TODAS PRIVADAS (admin) - alimentam os graficos Chart.js ---------- */
router.use(autenticar, somenteAdmin);

router.get('/vendas', relatorioController.vendas);
router.get('/estoque', relatorioController.estoque);
router.get('/entregas', relatorioController.entregas);

module.exports = router;
