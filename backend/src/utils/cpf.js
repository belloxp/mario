'use strict';

/** Remove tudo que nao for digito. */
function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '');
}

/**
 * Validacao matematica do CPF pela formula real dos digitos verificadores.
 *
 * 1o digito: soma de cada um dos 9 primeiros digitos multiplicado por pesos 10..2.
 *            resto = (soma * 10) % 11 ; se resto == 10 ou 11 -> 0
 * 2o digito: mesma logica usando os 10 primeiros digitos e pesos 11..2.
 */
function validarCPF(valor) {
  const cpf = somenteDigitos(valor);

  if (cpf.length !== 11) return false;
  // Rejeita sequencias repetidas (000.000.000-00, 111.111.111-11, ...)
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) {
    soma += Number(cpf[i]) * (10 - i);
  }
  let primeiroDigito = (soma * 10) % 11;
  if (primeiroDigito >= 10) primeiroDigito = 0;
  if (primeiroDigito !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) {
    soma += Number(cpf[i]) * (11 - i);
  }
  let segundoDigito = (soma * 10) % 11;
  if (segundoDigito >= 10) segundoDigito = 0;
  if (segundoDigito !== Number(cpf[10])) return false;

  return true;
}

/** 12345678909 -> 123.456.789-09 */
function formatarCPF(valor) {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11) return valor;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

module.exports = { validarCPF, formatarCPF, somenteDigitos };
