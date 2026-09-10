/* ============================================================
   Carrinho de compras persistido em LocalStorage.
   Regra de negocio: so entra no carrinho o que tem estoque disponivel.
   Vale-presente e cursos (tipo DIGITAL) nao consomem saldo.
   ============================================================ */

const Carrinho = {
  itens() {
    try {
      const bruto = JSON.parse(localStorage.getItem(CONFIG.CHAVE_CARRINHO) || '[]');
      return Array.isArray(bruto) ? bruto : [];
    } catch (_) {
      return [];
    }
  },

  gravar(itens) {
    localStorage.setItem(CONFIG.CHAVE_CARRINHO, JSON.stringify(itens));
    Carrinho.atualizarContador();
    document.dispatchEvent(new CustomEvent('carrinho:alterado'));
  },

  quantidadeTotal() {
    return Carrinho.itens().reduce((soma, i) => soma + i.quantidade, 0);
  },

  quantidadeDoProduto(produtoId) {
    return Carrinho.itens().find((i) => i.produto_id === Number(produtoId))?.quantidade || 0;
  },

  /**
   * Adiciona respeitando o estoque.
   * @returns {{ok: boolean, mensagem: string}}
   */
  adicionar(produto, quantidade = 1) {
    const qtd = Math.max(1, Number(quantidade) || 1);
    const estoque = produto.estoque || {};
    const ilimitado = Boolean(estoque.ilimitado);
    const disponivel = ilimitado ? Infinity : Number(estoque.quantidade ?? 0);

    // Bloqueio 1: produto esgotado.
    if (!ilimitado && disponivel <= 0) {
      return { ok: false, mensagem: `"${produto.nome}" esta esgotado no momento.` };
    }

    const itens = Carrinho.itens();
    const existente = itens.find((i) => i.produto_id === produto.id);
    const jaNoCarrinho = existente ? existente.quantidade : 0;

    // Bloqueio 2: soma passaria do estoque disponivel.
    if (jaNoCarrinho + qtd > disponivel) {
      const restante = disponivel - jaNoCarrinho;
      return {
        ok: false,
        mensagem: restante > 0
          ? `Estoque insuficiente: restam apenas ${restante} unidade(s) de "${produto.nome}".`
          : `Voce ja tem todas as ${disponivel} unidade(s) disponiveis de "${produto.nome}" no carrinho.`,
      };
    }

    if (existente) {
      existente.quantidade += qtd;
    } else {
      itens.push({
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        preco: Number(produto.preco),
        imagem: produto.imagem,
        tipo: produto.tipo,
        categoria: produto.categoria?.nome || '',
        estoque_disponivel: ilimitado ? null : disponivel,
        quantidade: qtd,
      });
    }

    Carrinho.gravar(itens);
    return { ok: true, mensagem: `"${produto.nome}" adicionado ao carrinho.` };
  },

  alterarQuantidade(produtoId, delta) {
    const itens = Carrinho.itens();
    const item = itens.find((i) => i.produto_id === Number(produtoId));
    if (!item) return { ok: false, mensagem: 'Item nao encontrado no carrinho.' };

    const nova = item.quantidade + delta;
    if (nova <= 0) return Carrinho.remover(produtoId);

    const limite = item.estoque_disponivel;
    if (limite !== null && limite !== undefined && nova > limite) {
      return { ok: false, mensagem: `Estoque maximo de "${item.nome}": ${limite} unidade(s).` };
    }

    item.quantidade = nova;
    Carrinho.gravar(itens);
    return { ok: true, mensagem: '' };
  },

  remover(produtoId) {
    Carrinho.gravar(Carrinho.itens().filter((i) => i.produto_id !== Number(produtoId)));
    return { ok: true, mensagem: 'Item removido do carrinho.' };
  },

  limpar() { Carrinho.gravar([]); },

  /**
   * Previa dos totais no navegador (mesmas regras do backend).
   * O valor definitivo e sempre o devolvido por POST /pedidos.
   */
  calcularTotais() {
    const itens = Carrinho.itens();
    const subtotal = Math.round(itens.reduce((s, i) => s + i.preco * i.quantidade, 0) * 100) / 100;
    const unidades = itens.reduce((s, i) => s + i.quantidade, 0);
    const apenasDigital = itens.length > 0 && itens.every((i) => i.tipo === 'DIGITAL');

    const faixa = CONFIG.FAIXAS_DESCONTO.find((f) => subtotal >= f.minimo);
    const regras = [];
    let percentual = 0;

    if (faixa) { percentual += faixa.percentual; regras.push(faixa.rotulo); }
    if (unidades >= CONFIG.BONUS_VOLUME.minimoUnidades) {
      percentual += CONFIG.BONUS_VOLUME.percentual;
      regras.push(CONFIG.BONUS_VOLUME.rotulo);
    }
    percentual = Math.min(percentual, CONFIG.TETO_PERCENTUAL);

    const desconto = Math.round(((subtotal * percentual) / 100) * 100) / 100;
    const comDesconto = Math.round((subtotal - desconto) * 100) / 100;

    let frete = 0;
    if (!apenasDigital && subtotal > 0) {
      frete = comDesconto >= CONFIG.FRETE_GRATIS_ACIMA_DE ? 0 : CONFIG.FRETE_PADRAO;
      if (frete === 0) regras.push(`Frete gratis acima de ${moeda(CONFIG.FRETE_GRATIS_ACIMA_DE)}`);
    }

    return {
      subtotal,
      unidades,
      percentual,
      desconto,
      frete: Math.round(frete * 100) / 100,
      total: Math.round((comDesconto + frete) * 100) / 100,
      regras,
      apenasDigital,
    };
  },

  /** Corpo enviado para POST /pedidos. */
  paraPedido() {
    return Carrinho.itens().map((i) => ({ produto_id: i.produto_id, quantidade: i.quantidade }));
  },

  atualizarContador() {
    const total = Carrinho.quantidadeTotal();
    document.querySelectorAll('[data-carrinho-contador]').forEach((el) => {
      el.textContent = total;
      el.style.display = total > 0 ? 'grid' : 'none';
    });
  },
};
