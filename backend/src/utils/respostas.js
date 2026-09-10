'use strict';

/** Erro de negocio com status HTTP proprio, tratado pelo errorHandler. */
class ApiError extends Error {
  constructor(status, mensagem, detalhes = null) {
    super(mensagem);
    this.status = status;
    this.detalhes = detalhes;
  }
}

const erro = (status, mensagem, detalhes) => new ApiError(status, mensagem, detalhes);

/** Envelope padrao de sucesso usado por todos os controllers. */
function ok(res, dados, mensagem = null, status = 200) {
  return res.status(status).json({
    sucesso: true,
    ...(mensagem ? { mensagem } : {}),
    dados,
  });
}

/** Remove chaves undefined para permitir PATCH parcial seguro. */
function apenasCamposEnviados(corpo, permitidos) {
  return permitidos.reduce((acc, campo) => {
    if (Object.prototype.hasOwnProperty.call(corpo, campo) && corpo[campo] !== undefined) {
      acc[campo] = corpo[campo];
    }
    return acc;
  }, {});
}

/** Gera codigo legivel de pedido: BRK-20260827-4821 */
function gerarCodigoPedido() {
  const agora = new Date();
  const data = `${agora.getFullYear()}${String(agora.getMonth() + 1).padStart(2, '0')}${String(agora.getDate()).padStart(2, '0')}`;
  const sufixo = String(Math.floor(Math.random() * 9000) + 1000);
  return `BRK-${data}-${sufixo}`;
}

module.exports = { ApiError, erro, ok, apenasCamposEnviados, gerarCodigoPedido };
