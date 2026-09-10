'use strict';

const express = require('express');
const entregaController = require('../controllers/entregaController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- TODAS PRIVADAS ---------- */
router.use(autenticar);

router.get('/rastreio/:codigo', entregaController.consultarPorRastreio);
router.get('/', somenteAdmin, entregaController.listar);
router.get('/:id', entregaController.consultarPorId);

router.post('/', somenteAdmin, entregaController.cadastrar);
router.put('/:id', somenteAdmin, entregaController.atualizar);
router.patch('/:id', somenteAdmin, entregaController.atualizarParcial);
router.delete('/:id', somenteAdmin, entregaController.remover);

module.exports = router;
