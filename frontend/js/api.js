/* ============================================================
   Camada REST - todo acesso a API passa por aqui.
   Injeta automaticamente o cabecalho Authorization: Bearer <token>
   e trata 401 derrubando a sessao local.
   ============================================================ */

const API = {
  /** Requisicao generica. */
  async requisitar(caminho, { metodo = 'GET', corpo = null, autenticado = false } = {}) {
    const opcoes = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
    };

    if (autenticado) {
      const token = Auth.token();
      if (!token) {
        throw Object.assign(new Error('Voce precisa estar logado para continuar.'), { status: 401 });
      }
      opcoes.headers.Authorization = `Bearer ${token}`;
    }

    if (corpo !== null) opcoes.body = JSON.stringify(corpo);

    let resposta;
    try {
      resposta = await fetch(`${CONFIG.API_URL}${caminho}`, opcoes);
    } catch (e) {
      throw Object.assign(
        new Error('Nao foi possivel falar com o servidor. Verifique se a API esta no ar.'),
        { status: 0, causa: e }
      );
    }

    let dados = null;
    const texto = await resposta.text();
    if (texto) {
      try { dados = JSON.parse(texto); } catch (_) { dados = { mensagem: texto }; }
    }

    if (!resposta.ok) {
      // Token invalido/expirado: limpa a sessao e devolve o erro para a tela.
      if (resposta.status === 401 && autenticado) Auth.encerrar(false);
      throw Object.assign(new Error(dados?.mensagem || `Erro ${resposta.status}.`), {
        status: resposta.status,
        detalhes: dados?.detalhes || null,
      });
    }

    return dados?.dados !== undefined ? dados.dados : dados;
  },

  get: (caminho, autenticado = false) => API.requisitar(caminho, { autenticado }),
  post: (caminho, corpo, autenticado = false) => API.requisitar(caminho, { metodo: 'POST', corpo, autenticado }),
  put: (caminho, corpo, autenticado = true) => API.requisitar(caminho, { metodo: 'PUT', corpo, autenticado }),
  patch: (caminho, corpo, autenticado = true) => API.requisitar(caminho, { metodo: 'PATCH', corpo, autenticado }),
  delete: (caminho, autenticado = true) => API.requisitar(caminho, { metodo: 'DELETE', autenticado }),

  /* ---------------- Atalhos por recurso ---------------- */

  login: (email, senha) => API.post('/login', { email, senha }),
  cadastrarUsuario: (dados) => API.post('/usuarios', dados),
  meuPerfil: () => API.get('/usuarios/perfil', true),

  listarProdutos: (filtros = {}) => {
    const query = new URLSearchParams(
      Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    ).toString();
    return API.get(`/produtos${query ? `?${query}` : ''}`);
  },
  buscarProdutos: (termo) => API.get(`/produtos/buscar?nome=${encodeURIComponent(termo)}`),
  produtoPorId: (id) => API.get(`/produtos/${id}`),
  produtoPorCodigo: (codigo) => API.get(`/produtos/codigo/${encodeURIComponent(codigo)}`),

  listarCategorias: () => API.get('/categorias'),

  finalizarPedido: (payload) => API.post('/pedidos', payload, true),
  meusPedidos: () => API.get('/pedidos/meus-pedidos', true),

  listarEstoque: (criticos = false) => API.get(`/estoque${criticos ? '?critico=true' : ''}`, true),
  movimentarEstoque: (payload) => API.post('/estoque', payload, true),

  relatorioVendas: (periodo = {}) => {
    const query = new URLSearchParams(Object.entries(periodo).filter(([, v]) => v)).toString();
    return API.get(`/relatorios/vendas${query ? `?${query}` : ''}`, true);
  },
  relatorioEstoque: () => API.get('/relatorios/estoque', true),

  /** Consulta o CEP no ViaCEP (API externa, sem token). */
  async viaCep(cep) {
    const limpo = String(cep).replace(/\D/g, '');
    if (limpo.length !== 8) throw new Error('O CEP deve ter 8 digitos.');

    const resposta = await fetch(`${CONFIG.VIACEP_URL}/${limpo}/json/`);
    if (!resposta.ok) throw new Error('Nao foi possivel consultar o CEP agora.');

    const dados = await resposta.json();
    if (dados.erro) throw new Error('CEP nao encontrado.');
    return dados;
  },
};
