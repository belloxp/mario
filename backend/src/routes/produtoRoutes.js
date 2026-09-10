'use strict';

const express = require('express');
const produtoController = require('../controllers/produtoController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- PUBLICAS (vitrine, busca e filtro sem login) ---------- */
router.get('/', produtoController.listar);
router.get('/buscar', produtoController.buscar);
router.get('/codigo/:codigo', produtoController.consultarPorCodigo);
router.get('/:id', produtoController.consultarPorId);

/* ---------- PRIVADAS - gestao do catalogo (admin) ---------- */
router.post('/', autenticar, somenteAdmin, produtoController.cadastrar);
router.put('/:id', autenticar, somenteAdmin, produtoController.atualizar);
router.patch('/:id', autenticar, somenteAdmin, produtoController.atualizarParcial);
router.delete('/:id', autenticar, somenteAdmin, produtoController.remover);

module.exports = router;
