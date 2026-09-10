/* ============================================================
   Configuracao global do frontend Breck Barber
   Trocar API_URL pela URL publicada no Railway antes do deploy no Vercel.
   ============================================================ */

const CONFIG = {
  // Em localhost usa a API local; publicado, usa a URL do Railway.
  API_URL: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3333'
    : 'https://SEU-PROJETO.up.railway.app',

  VIACEP_URL: 'https://viacep.com.br/ws',

  CHAVE_TOKEN: 'breck_token',
  CHAVE_USUARIO: 'breck_usuario',
  CHAVE_CARRINHO: 'breck_carrinho',

  /* Espelho das regras de desconto do backend (src/utils/desconto.js).
     O backend continua sendo a fonte de verdade: aqui e apenas previa. */
  FAIXAS_DESCONTO: [
    { minimo: 600, percentual: 15, rotulo: 'Cadeira Premium: 15% acima de R$ 600,00' },
    { minimo: 300, percentual: 10, rotulo: 'Barba e Cabelo: 10% acima de R$ 300,00' },
    { minimo: 150, percentual: 5, rotulo: 'Cliente da Casa: 5% acima de R$ 150,00' },
  ],
  BONUS_VOLUME: { minimoUnidades: 10, percentual: 5, rotulo: 'Bonus atacado (10+ itens): +5%' },
  TETO_PERCENTUAL: 20,
  FRETE_PADRAO: 19.9,
  FRETE_GRATIS_ACIMA_DE: 199,
};

/** Formata numero como moeda brasileira. */
function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata data ISO como dd/mm/aaaa. */
function dataBR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

/** Formata data/hora ISO como dd/mm/aaaa hh:mm. */
function dataHoraBR(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Escapa texto vindo da API antes de injetar em innerHTML. */
function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
