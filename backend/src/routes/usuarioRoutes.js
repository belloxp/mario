'use strict';

const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { autenticar, somenteAdmin } = require('../middlewares/auth');

const router = express.Router();

/* ---------- PUBLICA ---------- */
router.post('/', usuarioController.cadastrar);

/* ---------- PRIVADAS ---------- */
router.use(autenticar);

router.get('/perfil', usuarioController.perfil);
router.get('/buscar', somenteAdmin, usuarioController.buscar);
router.get('/', somenteAdmin, usuarioController.listar);
router.get('/:id', usuarioController.consultarPorId);
router.put('/:id', usuarioController.atualizar);
router.patch('/:id', usuarioController.atualizarParcial);
router.delete('/:id', somenteAdmin, usuarioController.remover);

module.exports = router;
