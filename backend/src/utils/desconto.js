'use strict';

/* ============================================================
   REGRAS DE DESCONTO E FRETE - Breck Barber
   Aplicadas no checkout (backend) e espelhadas no carrinho (frontend).
   A tabela e progressiva e NAO cumulativa: vale sempre a maior faixa
   atingida pelo subtotal do carrinho.
   ============================================================ */

const FAIXAS_DESCONTO = [
  { minimo: 600, percentual: 15, rotulo: 'Cadeira Premium: 15% acima de R$ 600,00' },
  { minimo: 300, percentual: 10, rotulo: 'Barba e Cabelo: 10% acima de R$ 300,00' },
  { minimo: 150, percentual: 5, rotulo: 'Cliente da Casa: 5% acima de R$ 150,00' },
];

/** Bonus cumulativo de 5% para carrinhos com 10 ou mais unidades (compra de barbearia). */
const BONUS_VOLUME = { minimoUnidades: 10, percentual: 5, rotulo: 'Bonus atacado (10+ itens): +5%' };

/** Teto de desconto permitido pelo P.O. */
const TETO_PERCENTUAL = 20;

const FRETE_PADRAO = 19.9;
const FRETE_GRATIS_ACIMA_DE = 199;

function arredondar(valor) {
  return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
}

/**
 * @param {number} subtotal  soma de (preco * quantidade) de todos os itens
 * @param {number} unidades  soma das quantidades
 * @param {boolean} apenasDigital  pedido so com vale-presente/curso -> sem frete
 */
function calcularTotais(subtotal, unidades = 0, apenasDigital = false) {
  const base = arredondar(subtotal);

  const faixa = FAIXAS_DESCONTO.find((f) => base >= f.minimo);
  const regras = [];
  let percentual = 0;

  if (faixa) {
    percentual += faixa.percentual;
    regras.push(faixa.rotulo);
  }
  if (unidades >= BONUS_VOLUME.minimoUnidades) {
    percentual += BONUS_VOLUME.percentual;
    regras.push(BONUS_VOLUME.rotulo);
  }
  percentual = Math.min(percentual, TETO_PERCENTUAL);

  const desconto = arredondar((base * percentual) / 100);
  const baseComDesconto = arredondar(base - desconto);

  let frete = 0;
  if (!apenasDigital && base > 0) {
    frete = baseComDesconto >= FRETE_GRATIS_ACIMA_DE ? 0 : FRETE_PADRAO;
    if (frete === 0) regras.push(`Frete gratis acima de R$ ${FRETE_GRATIS_ACIMA_DE.toFixed(2)}`);
  }

  return {
    subtotal: base,
    percentual_desconto: percentual,
    desconto,
    frete: arredondar(frete),
    total: arredondar(baseComDesconto + frete),
    regra_desconto: regras.length ? regras.join(' | ') : 'Sem desconto aplicavel',
  };
}

module.exports = {
  calcularTotais,
  FAIXAS_DESCONTO,
  BONUS_VOLUME,
  TETO_PERCENTUAL,
  FRETE_PADRAO,
  FRETE_GRATIS_ACIMA_DE,
};
