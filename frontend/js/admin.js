/* ============================================================
   Gestao da barbearia - CRUD de produtos, estoque, pedidos
   e relatorios gerenciais com Chart.js.
   Todas as chamadas usam rotas privadas (Authorization: Bearer).
   ============================================================ */

(function painelAdmin() {
  UI.montarCabecalho('admin');
  UI.montarRodape();

  if (!Auth.protegerPagina(true)) return;

  // Escala de cinza da identidade preto e branco (css/style.css).
  const PALETA = ['#ffffff', '#c9c9c9', '#9a9a9a', '#727272', '#515151', '#3a3a3a', '#e5e5e5', '#868686'];
  const graficos = {};

  let produtos = [];
  let categorias = [];
  let pedidos = [];

  const el = (id) => document.getElementById(id);
  const valor = (id) => el(id).value.trim();

  function sucesso(texto) {
    UI.mensagem('avisoAdmin', '');
    UI.mensagem('sucessoAdmin', texto, 'ok');
    UI.aviso(texto, 'ok');
    setTimeout(() => UI.mensagem('sucessoAdmin', ''), 5000);
  }

  function falha(e) {
    UI.mensagem('sucessoAdmin', '');
    const detalhes = Array.isArray(e.detalhes)
      ? ` (${e.detalhes.map((d) => `${d.campo}: ${d.mensagem}`).join('; ')})`
      : '';
    UI.mensagem('avisoAdmin', e.message + detalhes);
    UI.aviso(e.message, 'erro', 4600);
  }

  /* ============================================================
     ABAS
     ============================================================ */

  const ABAS = ['produtos', 'estoque', 'pedidos', 'relatorios'];

  function abrirAba(nome, atualizarHash = true) {
    if (!ABAS.includes(nome)) return;

    document.querySelectorAll('.aba').forEach((a) => a.classList.toggle('ativa', a.dataset.aba === nome));
    document.querySelectorAll('.aba-conteudo').forEach((c) => c.classList.toggle('ativa', c.id === `aba-${nome}`));

    // Deep-link: admin.html#relatorios abre direto na aba certa.
    if (atualizarHash && window.location.hash !== `#${nome}`) {
      history.replaceState(null, '', `#${nome}`);
    }

    if (nome === 'relatorios') carregarRelatorios();
    if (nome === 'pedidos') carregarPedidos();
  }

  document.querySelectorAll('.aba').forEach((aba) => {
    aba.addEventListener('click', () => abrirAba(aba.dataset.aba));
  });

  window.addEventListener('hashchange', () => abrirAba(window.location.hash.slice(1), false));

  /* ============================================================
     PRODUTOS
     ============================================================ */

  async function carregarCategorias() {
    categorias = await API.listarCategorias();
    const opcoes = categorias.map((c) => `<option value="${c.id}">${escapar(c.nome)}</option>`).join('');
    el('categoriaId').innerHTML = `<option value="">Selecione...</option>${opcoes}`;
  }

  async function carregarProdutos() {
    // incluirInativos mostra tambem os produtos desativados por terem vendas.
    produtos = await API.listarProdutos({ incluirInativos: 'true', ordenar: 'nome' });
    renderizarTabelaProdutos();
    preencherSelectEstoque();
  }

  function renderizarTabelaProdutos() {
    const termo = valor('buscaAdminProduto').toLowerCase();
    const lista = termo
      ? produtos.filter((p) => `${p.codigo} ${p.nome}`.toLowerCase().includes(termo))
      : produtos;

    const corpo = el('corpoAdminProdutos');

    if (!lista.length) {
      corpo.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--texto-suave);padding:26px">Nenhum produto encontrado.</td></tr>';
      return;
    }

    corpo.innerHTML = lista.map((p) => {
      const ilimitado = p.estoque?.ilimitado;
      const qtd = Number(p.estoque?.quantidade ?? 0);
      const situacao = !p.ativo ? 'INATIVO' : ilimitado ? 'ILIMITADO' : qtd === 0 ? 'ESGOTADO' : qtd <= 5 ? 'CRITICO' : 'NORMAL';

      return `
        <tr>
          <td>${escapar(p.codigo)}</td>
          <td><strong>${escapar(p.nome)}</strong></td>
          <td>${escapar(p.categoria?.nome || '-')}</td>
          <td>${escapar(p.tipo)}</td>
          <td class="numero">${moeda(p.preco)}</td>
          <td class="numero">${ilimitado ? '&#8734;' : qtd}</td>
          <td><span class="tag tag--${UI.corDoStatus(situacao)}">${situacao}</span></td>
          <td style="white-space:nowrap">
            <button class="btn btn--contorno btn--pequeno" data-editar="${p.id}">Editar</button>
            <button class="btn btn--contorno btn--pequeno" data-preco="${p.id}">Preco</button>
            <button class="btn btn--perigo btn--pequeno" data-excluir="${p.id}">Excluir</button>
          </td>
        </tr>`;
    }).join('');

    corpo.querySelectorAll('[data-editar]').forEach((b) =>
      b.addEventListener('click', () => carregarNoFormulario(Number(b.dataset.editar))));

    corpo.querySelectorAll('[data-preco]').forEach((b) =>
      b.addEventListener('click', () => alterarPreco(Number(b.dataset.preco))));

    corpo.querySelectorAll('[data-excluir]').forEach((b) =>
      b.addEventListener('click', () => excluirProduto(Number(b.dataset.excluir))));
  }

  function carregarNoFormulario(id) {
    const p = produtos.find((x) => x.id === id);
    if (!p) return;

    el('produtoId').value = p.id;
    el('codigo').value = p.codigo;
    el('nomeProduto').value = p.nome;
    el('preco').value = Number(p.preco);
    el('categoriaId').value = p.categoria_id;
    el('tipoProduto').value = p.tipo;
    el('linha').value = p.linha || '';
    el('finalidade').value = p.finalidade || '';
    el('marca').value = p.marca || '';
    el('imagem').value = p.imagem || '';
    el('descricao').value = p.descricao || '';
    el('especificacoes').value = p.especificacoes ? JSON.stringify(p.especificacoes, null, 2) : '';
    el('quantidadeEstoque').value = Number(p.estoque?.quantidade ?? 0);
    el('quantidadeEstoque').disabled = true;

    el('tituloFormProduto').textContent = `Editando: ${p.nome}`;
    el('btnSalvarProduto').textContent = 'Salvar alteracoes (PUT)';
    el('btnCancelarEdicao').style.display = 'inline-flex';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function limparFormulario() {
    el('formProduto').reset();
    el('produtoId').value = '';
    el('quantidadeEstoque').disabled = false;
    el('tituloFormProduto').textContent = 'Cadastrar novo produto';
    el('btnSalvarProduto').textContent = 'Cadastrar produto';
    el('btnCancelarEdicao').style.display = 'none';
  }

  el('btnCancelarEdicao').addEventListener('click', limparFormulario);
  el('buscaAdminProduto').addEventListener('input', renderizarTabelaProdutos);

  el('formProduto').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    UI.mensagem('avisoAdmin', '');

    if (!valor('codigo') || !valor('nomeProduto') || !valor('preco') || !valor('categoriaId')) {
      UI.mensagem('avisoAdmin', 'Preencha codigo, nome, preco e categoria.');
      return;
    }

    let especificacoes = null;
    if (valor('especificacoes')) {
      try {
        especificacoes = JSON.parse(valor('especificacoes'));
      } catch (_) {
        UI.mensagem('avisoAdmin', 'O campo Especificacoes precisa ser um JSON valido.');
        return;
      }
    }

    const payload = {
      codigo: valor('codigo'),
      nome: valor('nomeProduto'),
      preco: Number(valor('preco')),
      categoria_id: Number(valor('categoriaId')),
      tipo: valor('tipoProduto'),
      linha: valor('linha') || null,
      finalidade: valor('finalidade') || null,
      marca: valor('marca') || null,
      imagem: valor('imagem') || null,
      descricao: valor('descricao') || null,
      especificacoes,
    };

    const id = el('produtoId').value;
    const botao = el('btnSalvarProduto');
    botao.disabled = true;

    try {
      if (id) {
        await API.put(`/produtos/${id}`, payload);
        sucesso('Produto atualizado com sucesso.');
      } else {
        payload.quantidade_estoque = Number(el('quantidadeEstoque').value || 0);
        await API.post('/produtos', payload, true);
        sucesso('Produto cadastrado com sucesso.');
      }
      limparFormulario();
      await carregarProdutos();
    } catch (e) {
      falha(e);
    } finally {
      botao.disabled = false;
    }
  });

  async function alterarPreco(id) {
    const p = produtos.find((x) => x.id === id);
    if (!p) return;

    const novo = prompt(`Novo preco para "${p.nome}" (atual: ${moeda(p.preco)}):`, Number(p.preco));
    if (novo === null) return;

    const numero = Number(String(novo).replace(',', '.'));
    if (!Number.isFinite(numero) || numero <= 0) {
      UI.aviso('Informe um preco valido maior que zero.', 'erro');
      return;
    }

    try {
      await API.patch(`/produtos/${id}`, { preco: numero });
      sucesso(`Preco de "${p.nome}" atualizado para ${moeda(numero)}.`);
      await carregarProdutos();
    } catch (e) {
      falha(e);
    }
  }

  async function excluirProduto(id) {
    const p = produtos.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Excluir "${p.nome}"? Produtos com vendas sao apenas desativados.`)) return;

    try {
      await API.delete(`/produtos/${id}`);
      sucesso('Operacao concluida.');
      await carregarProdutos();
    } catch (e) {
      falha(e);
    }
  }

  /* ============================================================
     ESTOQUE
     ============================================================ */

  function preencherSelectEstoque() {
    el('estoqueProduto').innerHTML = '<option value="">Selecione...</option>' +
      produtos.map((p) => {
        const saldo = p.estoque?.ilimitado ? 'ilimitado' : Number(p.estoque?.quantidade ?? 0);
        return `<option value="${p.id}">${escapar(p.codigo)} - ${escapar(p.nome)} (saldo: ${saldo})</option>`;
      }).join('');
  }

  async function carregarEstoque() {
    const relatorio = await API.relatorioEstoque();

    el('kpisEstoque').innerHTML = `
      <div class="kpi"><div class="kpi__rotulo">Itens cadastrados</div><div class="kpi__valor">${relatorio.resumo.itens_cadastrados}</div></div>
      <div class="kpi"><div class="kpi__rotulo">Unidades em estoque</div><div class="kpi__valor">${relatorio.resumo.unidades_totais}</div></div>
      <div class="kpi"><div class="kpi__rotulo">Valor imobilizado</div><div class="kpi__valor kpi__valor--acento">${moeda(relatorio.resumo.valor_total_imobilizado)}</div></div>
      <div class="kpi"><div class="kpi__rotulo">Esgotados / criticos</div><div class="kpi__valor">${relatorio.resumo.esgotados} / ${relatorio.resumo.criticos}</div></div>`;

    el('corpoEstoque').innerHTML = relatorio.itens.map((i) => `
      <tr>
        <td>${escapar(i.codigo)}</td>
        <td><strong>${escapar(i.produto)}</strong></td>
        <td>${escapar(i.categoria)}</td>
        <td class="numero">${i.ilimitado ? '&#8734;' : i.quantidade}</td>
        <td class="numero">${i.quantidade_minima}</td>
        <td class="numero">${i.ilimitado ? '-' : moeda(i.valor_imobilizado)}</td>
        <td><span class="tag tag--${UI.corDoStatus(i.situacao)}">${escapar(i.situacao)}</span></td>
        <td style="white-space:nowrap">
          <button class="btn btn--contorno btn--pequeno" data-entrada="${i.produto_id}">+10</button>
          <button class="btn btn--contorno btn--pequeno" data-ajuste="${i.produto_id}">Ajustar</button>
        </td>
      </tr>`).join('');

    el('corpoEstoque').querySelectorAll('[data-entrada]').forEach((b) =>
      b.addEventListener('click', () => movimentar(Number(b.dataset.entrada), 'ENTRADA', 10)));

    el('corpoEstoque').querySelectorAll('[data-ajuste]').forEach((b) =>
      b.addEventListener('click', () => {
        const novo = prompt('Novo saldo para este item:');
        if (novo === null) return;
        movimentar(Number(b.dataset.ajuste), 'AJUSTE', Number(novo));
      }));
  }

  async function movimentar(produtoId, tipo, quantidade) {
    if (!Number.isInteger(quantidade) || quantidade < 0) {
      UI.aviso('Informe uma quantidade inteira maior ou igual a zero.', 'erro');
      return;
    }
    try {
      await API.movimentarEstoque({ produto_id: produtoId, tipo, quantidade });
      sucesso(`Movimentacao de ${tipo} registrada.`);
      await carregarProdutos();
      await carregarEstoque();
    } catch (e) {
      falha(e);
    }
  }

  el('formEstoque').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const produtoId = Number(valor('estoqueProduto'));
    if (!produtoId) { UI.mensagem('avisoAdmin', 'Selecione o produto.'); return; }

    await movimentar(produtoId, valor('estoqueTipo'), Number(el('estoqueQuantidade').value));
    el('estoqueQuantidade').value = 1;
  });

  /* ============================================================
     PEDIDOS
     ============================================================ */

  async function carregarPedidos() {
    try {
      const status = valor('filtroStatusPedido');
      pedidos = await API.get(`/pedidos${status ? `?status=${status}` : ''}`, true);
    } catch (e) {
      falha(e);
      return;
    }

    const corpo = el('corpoPedidos');

    if (!pedidos.length) {
      corpo.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--texto-suave);padding:26px">Nenhum pedido encontrado.</td></tr>';
      return;
    }

    const proximo = { PENDENTE: 'PAGO', PAGO: 'ENVIADO', ENVIADO: 'CONCLUIDO' };

    corpo.innerHTML = pedidos.map((p) => {
      const unidades = (p.itens || []).reduce((s, i) => s + i.quantidade, 0);
      const avanco = proximo[p.status];
      return `
        <tr>
          <td><strong>${escapar(p.codigo)}</strong></td>
          <td>${escapar(p.usuario?.nome || '-')}<br><span style="color:var(--texto-suave);font-size:.78rem">${escapar(p.usuario?.email || '')}</span></td>
          <td>${dataHoraBR(p.created_at)}</td>
          <td class="numero">${unidades}</td>
          <td class="numero"><strong>${moeda(p.total)}</strong></td>
          <td><span class="tag tag--${UI.corDoStatus(p.status)}">${escapar(p.status)}</span></td>
          <td>${p.entrega ? `<span class="tag tag--${UI.corDoStatus(p.entrega.status)}">${escapar(p.entrega.status)}</span>` : '-'}</td>
          <td style="white-space:nowrap">
            ${avanco ? `<button class="btn btn--contorno btn--pequeno" data-avancar="${p.id}" data-status="${avanco}">&rarr; ${avanco}</button>` : ''}
            ${['CONCLUIDO', 'CANCELADO'].includes(p.status) ? '' : `<button class="btn btn--perigo btn--pequeno" data-cancelar="${p.id}">Cancelar</button>`}
          </td>
        </tr>`;
    }).join('');

    corpo.querySelectorAll('[data-avancar]').forEach((b) =>
      b.addEventListener('click', async () => {
        try {
          await API.patch(`/pedidos/${b.dataset.avancar}`, { status: b.dataset.status });
          sucesso(`Pedido atualizado para ${b.dataset.status}.`);
          await carregarPedidos();
        } catch (e) { falha(e); }
      }));

    corpo.querySelectorAll('[data-cancelar]').forEach((b) =>
      b.addEventListener('click', async () => {
        if (!confirm('Cancelar este pedido? O estoque sera estornado.')) return;
        try {
          await API.delete(`/pedidos/${b.dataset.cancelar}`);
          sucesso('Pedido cancelado e estoque estornado.');
          await carregarPedidos();
          await carregarProdutos();
        } catch (e) { falha(e); }
      }));
  }

  el('filtroStatusPedido').addEventListener('change', carregarPedidos);

  /* ============================================================
     RELATORIOS (Chart.js)
     ============================================================ */

  // Quem pediu menos movimento no sistema tambem nao deve ver os graficos animarem.
  const MENOS_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const opcoesBase = {
    responsive: true,
    maintainAspectRatio: false,
    animation: MENOS_MOVIMENTO ? false : undefined,
    plugins: {
      legend: { labels: { color: '#a1a1a1', font: { size: 12 } } },
      tooltip: { backgroundColor: '#151515', borderColor: 'rgba(255,255,255,.32)', borderWidth: 1, padding: 12 },
    },
    scales: {
      x: { ticks: { color: '#a1a1a1' }, grid: { color: 'rgba(255,255,255,.08)' } },
      y: { ticks: { color: '#a1a1a1' }, grid: { color: 'rgba(255,255,255,.08)' }, beginAtZero: true },
    },
  };

  function desenhar(idCanvas, configuracao) {
    if (graficos[idCanvas]) graficos[idCanvas].destroy();
    graficos[idCanvas] = new Chart(el(idCanvas), configuracao);
  }

  async function carregarRelatorios() {
    try {
      const [vendas, estoque] = await Promise.all([
        API.relatorioVendas({ de: valor('periodoDe'), ate: valor('periodoAte') }),
        API.relatorioEstoque(),
      ]);

      // ---- KPIs ----
      el('kpisRelatorio').innerHTML = `
        <div class="kpi"><div class="kpi__rotulo">Faturamento</div><div class="kpi__valor kpi__valor--acento">${moeda(vendas.resumo.faturamento)}</div><div class="kpi__nota">Pedidos pagos, enviados e concluidos</div></div>
        <div class="kpi"><div class="kpi__rotulo">Pedidos</div><div class="kpi__valor">${vendas.resumo.total_pedidos}</div><div class="kpi__nota">No periodo selecionado</div></div>
        <div class="kpi"><div class="kpi__rotulo">Ticket medio</div><div class="kpi__valor">${moeda(vendas.resumo.ticket_medio)}</div></div>
        <div class="kpi"><div class="kpi__rotulo">Descontos concedidos</div><div class="kpi__valor">${moeda(vendas.resumo.descontos_concedidos)}</div></div>`;

      // ---- Relatorio 1: faturamento mensal (barras + linha) ----
      const meses = vendas.faturamento_mensal;
      desenhar('graficoFaturamento', {
        type: 'bar',
        data: {
          labels: meses.map((m) => m.competencia),
          datasets: [
            {
              label: 'Faturamento (R$)',
              data: meses.map((m) => m.faturamento),
              backgroundColor: 'rgba(255,255,255,.88)',
              borderRadius: 6,
              yAxisID: 'y',
            },
            {
              label: 'Pedidos',
              data: meses.map((m) => m.pedidos),
              type: 'line',
              borderColor: '#8a8a8a',
              backgroundColor: '#8a8a8a',
              tension: 0.35,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...opcoesBase,
          scales: {
            ...opcoesBase.scales,
            y1: {
              position: 'right',
              beginAtZero: true,
              ticks: { color: '#a1a1a1', precision: 0 },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });

      // ---- Relatorio 2: vendas por categoria (rosca) ----
      const porCategoria = vendas.vendas_por_categoria;
      desenhar('graficoCategorias', {
        type: 'doughnut',
        data: {
          labels: porCategoria.map((c) => c.categoria || 'Sem categoria'),
          datasets: [{
            data: porCategoria.map((c) => c.faturamento),
            backgroundColor: PALETA,
            borderColor: '#070707',
            borderWidth: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: MENOS_MOVIMENTO ? false : undefined,
          cutout: '58%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#a1a1a1', padding: 14, font: { size: 11 } } },
            tooltip: {
              backgroundColor: '#151515',
              callbacks: {
                label: (ctx) => `${ctx.label}: ${moeda(ctx.parsed)}`,
              },
            },
          },
        },
      });

      // ---- Estoque por categoria (barras horizontais) ----
      const estoqueCategoria = estoque.estoque_por_categoria;
      desenhar('graficoEstoque', {
        type: 'bar',
        data: {
          labels: estoqueCategoria.map((c) => c.categoria),
          datasets: [{
            label: 'Valor imobilizado (R$)',
            data: estoqueCategoria.map((c) => c.valor_imobilizado),
            backgroundColor: PALETA.map((c) => `${c}cc`),
            borderRadius: 6,
          }],
        },
        options: { ...opcoesBase, indexAxis: 'y', plugins: { ...opcoesBase.plugins, legend: { display: false } } },
      });

      // ---- Top produtos ----
      el('corpoTopProdutos').innerHTML = vendas.top_produtos.length
        ? vendas.top_produtos.map((p) => `
            <tr>
              <td>${escapar(p.produto)}</td>
              <td class="numero">${p.unidades}</td>
              <td class="numero"><strong>${moeda(p.faturamento)}</strong></td>
            </tr>`).join('')
        : '<tr><td colspan="3" style="text-align:center;color:var(--texto-suave);padding:20px">Sem vendas no periodo.</td></tr>';

      // ---- Alertas de reposicao ----
      el('corpoAlertas').innerHTML = estoque.alertas.length
        ? estoque.alertas.map((i) => `
            <tr>
              <td>${escapar(i.codigo)}</td>
              <td><strong>${escapar(i.produto)}</strong></td>
              <td>${escapar(i.categoria)}</td>
              <td class="numero">${i.quantidade}</td>
              <td class="numero">${i.quantidade_minima}</td>
              <td><span class="tag tag--${UI.corDoStatus(i.situacao)}">${escapar(i.situacao)}</span></td>
            </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center;color:var(--texto-suave);padding:20px">Nenhum item precisa de reposicao.</td></tr>';

    } catch (e) {
      falha(e);
    }
  }

  el('btnAplicarPeriodo').addEventListener('click', carregarRelatorios);
  el('btnLimparPeriodo').addEventListener('click', () => {
    el('periodoDe').value = '';
    el('periodoAte').value = '';
    carregarRelatorios();
  });

  /* ============================================================
     CARGA INICIAL
     ============================================================ */

  (async function iniciar() {
    try {
      await carregarCategorias();
      await carregarProdutos();
      await carregarEstoque();

      // Respeita a aba pedida na URL (ex.: admin.html#relatorios).
      const alvo = window.location.hash.slice(1);
      if (ABAS.includes(alvo) && alvo !== 'produtos') abrirAba(alvo, false);
    } catch (e) {
      falha(e);
    }
  })();
})();
