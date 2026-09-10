/* ============================================================
   Validacoes de formulario reaproveitadas pelo cadastro e pelo perfil.
   A validacao do CPF usa a mesma formula do backend (src/utils/cpf.js).
   ============================================================ */

const Validar = {
  digitos: (valor) => String(valor ?? '').replace(/\D/g, ''),

  /**
   * Validacao matematica do CPF pelos digitos verificadores.
   * 1o digito: pesos 10..2 sobre os 9 primeiros; resto = (soma*10)%11 (10 ou 11 -> 0)
   * 2o digito: pesos 11..2 sobre os 10 primeiros.
   */
  cpf(valor) {
    const cpf = Validar.digitos(valor);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
    let primeiro = (soma * 10) % 11;
    if (primeiro >= 10) primeiro = 0;
    if (primeiro !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
    let segundo = (soma * 10) % 11;
    if (segundo >= 10) segundo = 0;
    return segundo === Number(cpf[10]);
  },

  email: (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(valor).trim()),

  /* ---------- Mascaras ---------- */

  mascaraCPF(valor) {
    const d = Validar.digitos(valor).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  },

  mascaraCEP(valor) {
    const d = Validar.digitos(valor).slice(0, 8);
    return d.replace(/(\d{5})(\d)/, '$1-$2');
  },

  mascaraTelefone(valor) {
    const d = Validar.digitos(valor).slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  },

  /** Aplica mascara ao digitar. */
  ligarMascara(idCampo, funcaoMascara) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    campo.addEventListener('input', () => {
      const posicaoFinal = campo.selectionStart === campo.value.length;
      campo.value = funcaoMascara(campo.value);
      if (posicaoFinal) campo.setSelectionRange(campo.value.length, campo.value.length);
    });
  },

  /** Marca/desmarca o erro visual de um campo. */
  marcarErro(idCampo, mensagem) {
    const campo = document.getElementById(idCampo);
    if (!campo) return;
    const grupo = campo.closest('.campo');
    const alvoErro = grupo?.querySelector('.campo__erro');
    grupo?.classList.toggle('campo--erro', Boolean(mensagem));
    if (alvoErro) alvoErro.textContent = mensagem || '';
  },
};

/* ============================================================
   Integracao ViaCEP: preenche rua, bairro, cidade e UF pelo CEP.
   ============================================================ */

const ViaCep = {
  /**
   * @param {object} campos ids dos inputs: {cep, logradouro, bairro, cidade, uf, numero}
   * @param {function} aoAvisar callback(mensagem, tipo)
   */
  ligar(campos, aoAvisar = () => {}) {
    const elCep = document.getElementById(campos.cep);
    if (!elCep) return;

    const preencher = async () => {
      const cep = Validar.digitos(elCep.value);
      Validar.marcarErro(campos.cep, '');

      if (cep.length !== 8) {
        if (cep.length > 0) Validar.marcarErro(campos.cep, 'O CEP deve ter 8 digitos.');
        return;
      }

      const bloquear = (estado) => {
        [campos.logradouro, campos.bairro, campos.cidade, campos.uf].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.disabled = estado;
        });
      };

      bloquear(true);
      aoAvisar('Consultando o CEP no ViaCEP...', 'info');

      try {
        const endereco = await API.viaCep(cep);

        document.getElementById(campos.logradouro).value = endereco.logradouro || '';
        document.getElementById(campos.bairro).value = endereco.bairro || '';
        document.getElementById(campos.cidade).value = endereco.localidade || '';
        document.getElementById(campos.uf).value = endereco.uf || '';

        aoAvisar('Endereco preenchido automaticamente pelo ViaCEP.', 'ok');
        document.getElementById(campos.numero)?.focus();
      } catch (e) {
        Validar.marcarErro(campos.cep, e.message);
        aoAvisar(e.message, 'erro');
        // CEP nao encontrado: libera a digitacao manual.
      } finally {
        bloquear(false);
      }
    };

    elCep.addEventListener('blur', preencher);
    elCep.addEventListener('input', () => {
      if (Validar.digitos(elCep.value).length === 8) preencher();
    });
  },
};
