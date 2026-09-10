'use strict';

const express = require('express');
const categoriaController = require('../controllers/categoriaController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- PUBLICAS ---------- */
router.get('/', categoriaController.listar);
router.get('/buscar', categoriaController.buscar);
router.get('/:id', categoriaController.consultarPorId);

/* ---------- PRIVADAS (admin) ---------- */
router.post('/', autenticar, somenteAdmin, categoriaController.cadastrar);
router.put('/:id', autenticar, somenteAdmin, categoriaController.atualizar);
router.patch('/:id', autenticar, somenteAdmin, categoriaController.atualizarParcial);
router.delete('/:id', autenticar, somenteAdmin, categoriaController.remover);

module.exports = router;
