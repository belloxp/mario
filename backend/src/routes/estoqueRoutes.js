'use strict';

const express = require('express');
const estoqueController = require('../controllers/estoqueController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- TODAS PRIVADAS (admin) ---------- */
router.use(autenticar, somenteAdmin);

router.get('/', estoqueController.listar);
router.get('/produto/:produtoId', estoqueController.consultarPorProduto);
router.get('/:id', estoqueController.consultarPorId);
router.post('/', estoqueController.movimentar);
router.put('/:id', estoqueController.atualizar);
router.patch('/:id', estoqueController.atualizarParcial);
router.delete('/:id', estoqueController.remover);

module.exports = router;
