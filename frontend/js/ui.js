/* ============================================================
   Componentes compartilhados: barra de servico, cabecalho,
   biblioteca de icones, rodape institucional e helpers de tela.
   O cabecalho e montado por JS para refletir o estado de login em
   todas as paginas sem duplicar HTML.
   ============================================================ */

/** Dados cadastrais da barbearia, usados no rodape e nos contatos. */
const LOJA = {
  nome: 'Breck Barber',
  razaoSocial: 'BRECK BARBER LTDA',
  cnpj: '56.869.573/0001-00',
  endereco: 'Av. Emilia Ramos, 485 - Sala 02',
  bairro: 'XV de Novembro',
  cidade: 'Tijucas',
  uf: 'SC',
  cep: '88203-020',
  instagram: 'https://www.instagram.com/breckbarbearia/',
  instagramUsuario: '@breckbarbearia',
  desde: '2024',
};

const UI = {
  /**
   * Biblioteca de icones em SVG (sem emoji e sem fonte de icones).
   * Todos herdam a cor do texto por currentColor, entao entram
   * automaticamente na identidade preto e branco da loja.
   */
  ICONES: {
    carrinho: '<path d="M6 8h12l-1.1 11a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8L6 8Z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/>',
    busca: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.4-4.4"/>',
    caixa: '<path d="M12 3.5 3.5 8v8L12 20.5 20.5 16V8L12 3.5Z"/><path d="M3.5 8 12 12.5 20.5 8"/><path d="M12 12.5v8"/>',
    pomada: '<path d="M6 6.5h12v2.8H6z"/><path d="M7.4 9.3h9.2V19a2 2 0 0 1-2 2H9.4a2 2 0 0 1-2-2V9.3Z"/><path d="M10 13.5h4"/>',
    barba: '<path d="M12 5v5.5"/><path d="M12 10.5c-1.2 3.2-3.2 4.6-5.2 4.6-1.8 0-2.9-1.1-2.9-2.6 0-1.8 1.7-3.4 3.6-2.6"/><path d="M12 10.5c1.2 3.2 3.2 4.6 5.2 4.6 1.8 0 2.9-1.1 2.9-2.6 0-1.8-1.7-3.4-3.6-2.6"/>',
    shampoo: '<path d="M10 3h4v3h-4z"/><path d="M8.2 9.2A3.2 3.2 0 0 1 11.4 6h1.2a3.2 3.2 0 0 1 3.2 3.2V19a2 2 0 0 1-2 2h-3.6a2 2 0 0 1-2-2V9.2Z"/><path d="M8.2 13h7.6"/>',
    maquina: '<path d="M8 3h8v10.5H8z"/><path d="M6 13.5h12V17H6z"/><path d="M9 17v3.5M12 17v3.5M15 17v3.5"/>',
    navalha: '<circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8.3 15.7 18 4.5"/><path d="M15.7 15.7 6 4.5"/>',
    acessorios: '<path d="M3.5 9h17v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V9Z"/><path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3.5 14h17"/>',
    curso: '<path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z"/><path d="M6.5 11v4.6c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3V11"/>',
    seta: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/>',
    local: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    frete: '<path d="M2.5 7.5h11v9h-11z"/><path d="M13.5 11h4l3 3v2.5h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    etiqueta: '<path d="M11.6 3.5H20v8.4l-8.7 8.7a1.6 1.6 0 0 1-2.3 0l-6.1-6.1a1.6 1.6 0 0 1 0-2.3l8.7-8.7Z"/><circle cx="16.2" cy="7.8" r="1.3"/>',
    presente: '<path d="M3.5 8.5h17v4h-17z"/><path d="M5 12.5h14V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.5Z"/><path d="M12 8.5V21"/><path d="M12 8.5C10.5 5 8.8 4 7.6 4.6c-1.2.6-1 2.6.7 3.4"/><path d="M12 8.5c1.5-3.5 3.2-4.5 4.4-3.9 1.2.6 1 2.6-.7 3.4"/>',
    // Fallback: losango da marca.
    padrao: '<path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z"/>',
  },

  /**
   * Devolve o SVG de um icone pela chave.
   * A chave e sempre resolvida contra a lista acima: nada vindo da API
   * e injetado no HTML, entao valor invalido cai no icone padrao.
   */
  icone(chave, tamanho = 24) {
    const traco = UI.ICONES[String(chave || '').toLowerCase()] || UI.ICONES.padrao;
    return `<svg class="icone" width="${tamanho}" height="${tamanho}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
      aria-hidden="true" focusable="false">${traco}</svg>`;
  },

  /** Placeholder usado quando a URL da imagem do produto falha ao carregar. */
  IMAGEM_FALLBACK:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#151515"/>' +
      '<g fill="none" stroke="#3d3d3d" stroke-width="8" stroke-linecap="round">' +
      '<rect x="168" y="112" width="64" height="150" rx="32"/><path d="M200 262v46"/></g>' +
      '<text x="200" y="344" font-family="sans-serif" font-size="22" fill="#6b6b6b" ' +
      'text-anchor="middle">Sem imagem</text></svg>'
    ),

  /** Atributo onerror padrao para <img> de produto (evita o alt vazar sobre o card). */
  get onErroImagem() {
    return `onerror="this.onerror=null;this.src='${UI.IMAGEM_FALLBACK}'"`;
  },

  /**
   * Monta a barra de servico e a navegacao no topo.
   * A barra de servico rola junto com a pagina; so o cabecalho fica fixo.
   */
  montarCabecalho(paginaAtiva = '') {
    const alvo = document.getElementById('cabecalho');
    if (!alvo) return;

    const usuario = Auth.usuario();
    const logado = Auth.logado();
    const admin = Auth.admin();

    const link = (href, rotulo, chave) =>
      `<a href="${href}" class="${paginaAtiva === chave ? 'ativo' : ''}">${rotulo}</a>`;

    alvo.innerHTML = `
      <div class="barra-servico">
        <div class="container barra-servico__linha">
          <span>${UI.icone('frete', 15)} Frete gratis acima de ${moeda(CONFIG.FRETE_GRATIS_ACIMA_DE)}</span>
          <span class="barra-servico__separador"></span>
          <span>${UI.icone('local', 15)} ${LOJA.cidade}/${LOJA.uf}</span>
          <a href="${LOJA.instagram}" target="_blank" rel="noopener" class="barra-servico__rede">
            ${UI.icone('instagram', 15)} ${LOJA.instagramUsuario}
          </a>
        </div>
      </div>

      <header class="topo">
        <div class="container topo__linha">
          <a href="index.html" class="marca" aria-label="${escapar(LOJA.nome)} - inicio">
            <img src="img/logo.png" alt="${escapar(LOJA.nome)}" class="marca__logo">
          </a>

          <nav class="nav" id="navPrincipal">
            ${link('index.html', 'A Barbearia', 'vitrine')}
            ${link('produtos.html', 'Produtos', 'catalogo')}
            ${logado ? link('meus-pedidos.html', 'Meus Pedidos', 'pedidos') : ''}
            ${admin ? link('admin.html', 'Gestao da Loja', 'admin') : ''}
            ${logado ? link('perfil.html', 'Minha conta', 'perfil') : ''}
            ${logado
              ? `<a href="#" id="btnSair">Sair (${escapar((usuario?.nome || '').split(' ')[0])})</a>`
              : `${link('login.html', 'Entrar', 'login')}${link('cadastro.html', 'Criar conta', 'cadastro')}`}
          </nav>

          <div class="topo__acoes">
            <a href="carrinho.html" class="carrinho-btn" title="Carrinho" aria-label="Abrir o carrinho">
              ${UI.icone('carrinho', 20)}
              <span class="carrinho-btn__contador" data-carrinho-contador style="display:none">0</span>
            </a>
            <button class="menu-hamburguer" id="btnMenu" aria-label="Abrir menu">${UI.icone('menu', 20)}</button>
          </div>
        </div>
      </header>
      <div class="avisos-flutuantes" id="avisosFlutuantes"></div>
    `;

    document.getElementById('btnMenu')?.addEventListener('click', () => {
      document.getElementById('navPrincipal')?.classList.toggle('aberto');
    });

    document.getElementById('btnSair')?.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.encerrar();
    });

    Carrinho.atualizarContador();
    UI.barraDeProgresso();
  },

  /** Barra fina no topo indicando o progresso da rolagem. */
  barraDeProgresso() {
    if (document.querySelector('.progresso-scroll')) return;

    const barra = document.createElement('div');
    barra.className = 'progresso-scroll';
    document.body.appendChild(barra);

    const atualizar = () => {
      const rolavel = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.width = rolavel > 40 ? `${(window.scrollY / rolavel) * 100}%` : '0';
    };

    window.addEventListener('scroll', atualizar, { passive: true });
    window.addEventListener('resize', atualizar);
    atualizar();
  },

  /** Anima um numero de 0 ate o valor final. */
  contar(elemento, valorFinal, duracao = 900, sufixo = '') {
    const el = typeof elemento === 'string' ? document.getElementById(elemento) : elemento;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = `${valorFinal}${sufixo}`;
      return;
    }

    const inicio = performance.now();
    const passo = (agora) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      // Ease-out cubico: desacelera no fim.
      const suave = 1 - Math.pow(1 - progresso, 3);
      el.textContent = `${Math.round(valorFinal * suave)}${sufixo}`;
      if (progresso < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  },

  /** Rodape institucional com os dados cadastrais reais da barbearia. */
  montarRodape() {
    const alvo = document.getElementById('rodape');
    if (!alvo) return;
    alvo.innerHTML = `
      <footer class="rodape">
        <div class="container">
          <div class="rodape__grade">
            <div class="rodape__bloco">
              <img src="img/logo.png" alt="${escapar(LOJA.nome)}" class="rodape__logo">
              <p class="rodape__texto">
                Barbearia em ${escapar(LOJA.cidade)} desde ${escapar(LOJA.desde)}.
                A mesma linha de produtos que usamos na cadeira, na sua casa.
              </p>
            </div>

            <div class="rodape__bloco">
              <h4 class="rodape__titulo">Onde estamos</h4>
              <p class="rodape__texto">
                ${escapar(LOJA.endereco)}<br>
                ${escapar(LOJA.bairro)} &middot; ${escapar(LOJA.cidade)}/${escapar(LOJA.uf)}<br>
                CEP ${escapar(LOJA.cep)}
              </p>
            </div>

            <div class="rodape__bloco">
              <h4 class="rodape__titulo">Fale com a gente</h4>
              <a href="${LOJA.instagram}" target="_blank" rel="noopener" class="rodape__link">
                ${UI.icone('instagram', 17)} ${escapar(LOJA.instagramUsuario)}
              </a>
              <a href="produtos.html" class="rodape__link">${UI.icone('etiqueta', 17)} Ver a loja</a>
              <a href="carrinho.html" class="rodape__link">${UI.icone('carrinho', 17)} Meu carrinho</a>
            </div>
          </div>

          <div class="rodape__base">
            <span>${escapar(LOJA.razaoSocial)} &middot; CNPJ ${escapar(LOJA.cnpj)}</span>
            <span>Cabeleireiros, barbearia e venda de cosmeticos</span>
          </div>
        </div>
      </footer>
    `;
    UI.revelarNoScroll();
  },

  /** Anima elementos .revelar conforme entram na tela. */
  revelarNoScroll() {
    const alvos = document.querySelectorAll('.revelar:not(.visivel)');
    if (!alvos.length) return;

    if (!('IntersectionObserver' in window)) {
      alvos.forEach((el) => el.classList.add('visivel'));
      return;
    }

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visivel');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    alvos.forEach((el) => observador.observe(el));
  },

  /** Notificacao flutuante. tipo: 'ok' | 'erro' | 'info' */
  aviso(mensagem, tipo = 'info', duracao = 3600) {
    let caixa = document.getElementById('avisosFlutuantes');
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.id = 'avisosFlutuantes';
      caixa.className = 'avisos-flutuantes';
      document.body.appendChild(caixa);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensagem;
    caixa.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .25s';
      setTimeout(() => toast.remove(), 250);
    }, duracao);
  },

  /** Mensagem fixa dentro de um elemento (formularios). */
  mensagem(idElemento, texto, tipo = 'erro') {
    const el = document.getElementById(idElemento);
    if (!el) return;
    if (!texto) { el.hidden = true; el.textContent = ''; return; }
    el.className = `aviso aviso--${tipo}`;
    el.textContent = texto;
    el.hidden = false;
  },

  /** Blocos de carregamento no lugar dos cards. */
  esqueletos(alvo, quantidade = 8) {
    const el = typeof alvo === 'string' ? document.getElementById(alvo) : alvo;
    if (!el) return;
    el.innerHTML = Array.from({ length: quantidade }, () => '<div class="esqueleto"></div>').join('');
  },

  /**
   * Estado vazio de uma listagem.
   * @param {string} chaveIcone chave da biblioteca UI.ICONES
   */
  vazio(alvo, chaveIcone, titulo, descricao = '') {
    const el = typeof alvo === 'string' ? document.getElementById(alvo) : alvo;
    if (!el) return;
    el.innerHTML = `
      <div class="vazio" style="grid-column:1/-1">
        <div class="vazio__icone">${UI.icone(chaveIcone, 36)}</div>
        <h3 style="margin:0 0 6px">${escapar(titulo)}</h3>
        <p style="margin:0">${escapar(descricao)}</p>
      </div>`;
  },

  /**
   * Classe da etiqueta conforme o status do pedido/entrega.
   * O design e monocromatico: em vez de cor, cada estado tem um traco.
   * ok = solido | info = contorno | alerta = tracejado | off = apagado
   */
  corDoStatus(status) {
    return {
      PENDENTE: 'alerta', PAGO: 'info', ENVIADO: 'info', CONCLUIDO: 'ok', CANCELADO: 'off',
      AGUARDANDO: 'alerta', EM_TRANSITO: 'info', ENTREGUE: 'ok', CANCELADA: 'off',
      ESGOTADO: 'off', CRITICO: 'alerta', NORMAL: 'ok', ILIMITADO: 'info',
    }[status] || 'neutro';
  },

  /** Rotulo comercial de cada tipo de produto do catalogo. */
  ETIQUETA_TIPO: { COSMETICO: 'Cuidado', FERRAMENTA: 'Ferramenta', DIGITAL: 'Digital' },

  /**
   * Card de produto usado na vitrine e no catalogo.
   * Anatomia: selo de estoque sobre a foto, preco em destaque acima do nome
   * e botao redondo de "+" no rodape, ao lado da categoria.
   */
  cardProduto(produto) {
    const estoque = produto.estoque || {};
    const ilimitado = Boolean(estoque.ilimitado);
    const qtd = Number(estoque.quantidade ?? 0);

    let selo = '<span class="card__selo card__selo--ok">Em estoque</span>';
    let bloqueado = false;

    if (ilimitado) {
      selo = '<span class="card__selo card__selo--ok">Imediato</span>';
    } else if (qtd === 0) {
      selo = '<span class="card__selo card__selo--zero">Esgotado</span>';
      bloqueado = true;
    } else if (qtd <= 5) {
      selo = `<span class="card__selo card__selo--baixo">Ultimas ${qtd}</span>`;
    }

    const etiquetaTipo = UI.ETIQUETA_TIPO[produto.tipo] || produto.tipo;

    return `
      <article class="card ${bloqueado ? 'card--esgotado' : ''}">
        <span class="card__brilho"></span>
        <a href="produto.html?id=${produto.id}" class="card__imagem">
          <img src="${escapar(produto.imagem || UI.IMAGEM_FALLBACK)}" alt="" loading="lazy" ${UI.onErroImagem}>
          <span class="card__etiqueta">${escapar(etiquetaTipo)}</span>
          ${selo}
        </a>
        <div class="card__corpo">
          <div class="card__topo">
            <span class="card__preco">${moeda(produto.preco)}</span>
            <span class="card__ref">${escapar(produto.codigo || '')}</span>
          </div>
          <h3 class="card__nome"><a href="produto.html?id=${produto.id}">${escapar(produto.nome)}</a></h3>
          <div class="card__rodape">
            <span class="card__meta">${escapar(produto.categoria?.nome || 'Sem categoria')}${produto.finalidade ? ` &middot; ${escapar(produto.finalidade)}` : ''}</span>
            <button class="btn ${bloqueado ? 'btn--contorno' : 'btn--primario'} card__add"
                    data-adicionar="${produto.id}" ${bloqueado ? 'disabled' : ''}
                    title="${bloqueado ? 'Produto esgotado' : 'Adicionar ao carrinho'}"
                    aria-label="${bloqueado ? 'Produto esgotado' : `Adicionar ${escapar(produto.nome)} ao carrinho`}">
              ${UI.icone(bloqueado ? 'fechar' : 'mais', 18)}
            </button>
          </div>
        </div>
      </article>`;
  },

  /**
   * Faz o brilho de cada card seguir o cursor.
   * Usa variaveis CSS (--mx/--my) para nao recalcular layout.
   */
  ligarSpotlight(container) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el || window.matchMedia('(hover: none)').matches) return;

    el.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (evento) => {
        const area = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${evento.clientX - area.left}px`);
        card.style.setProperty('--my', `${evento.clientY - area.top}px`);
      });
    });
  },

  /**
   * Liga os botoes "Adicionar" de uma lista de cards ao carrinho.
   * @param {Array} produtos lista carregada da API (para achar o objeto completo)
   */
  ligarBotoesAdicionar(container, produtos) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    UI.ligarSpotlight(el);

    el.querySelectorAll('[data-adicionar]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const produto = produtos.find((p) => p.id === Number(botao.dataset.adicionar));
        if (!produto) return;

        const resultado = Carrinho.adicionar(produto, 1);
        if (resultado.ok) {
          UI.aviso(resultado.mensagem, 'ok');
        } else {
          // Alerta bloqueando a acao quando nao ha estoque.
          UI.aviso(resultado.mensagem, 'erro', 4200);
          alert(resultado.mensagem);
        }
      });
    });
  },
};

/* Mantem o contador do carrinho sincronizado entre abas abertas. */
window.addEventListener('storage', (e) => {
  if (e.key === CONFIG.CHAVE_CARRINHO) Carrinho.atualizarContador();
});
