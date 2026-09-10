'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

// PUBLICA
router.post('/', authController.login);

// PRIVADA - confere se o token guardado no frontend ainda vale.
router.get('/validar', autenticar, authController.validar);

module.exports = router;
