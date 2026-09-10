'use strict';

require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./models');

const PORTA = Number(process.env.PORT || 3333);

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('[banco] conexao estabelecida com o MySQL.');

    if (String(process.env.DB_SYNC).toLowerCase() === 'true') {
      const alter = String(process.env.DB_SYNC_ALTER).toLowerCase() === 'true';
      await sequelize.sync({ alter });
      console.log(`[banco] schema sincronizado (alter=${alter}).`);
    }

    app.listen(PORTA, () => {
      console.log(`[api] Breck Barber rodando em http://localhost:${PORTA}`);
    });
  } catch (e) {
    console.error('[api] falha ao iniciar:', e.message);
    process.exit(1);
  }
}

iniciar();
