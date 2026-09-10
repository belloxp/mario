/* ============================================================
   Sessao do usuario + controle de rotas privadas no frontend.
   O token JWT e o usuario ficam no LocalStorage.
   ============================================================ */

const Auth = {
  token: () => localStorage.getItem(CONFIG.CHAVE_TOKEN),

  usuario() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.CHAVE_USUARIO) || 'null');
    } catch (_) {
      return null;
    }
  },

  logado() { return Boolean(Auth.token()); },
  admin() { return Auth.usuario()?.perfil === 'ADMIN'; },

  iniciar(token, usuario) {
    localStorage.setItem(CONFIG.CHAVE_TOKEN, token);
    localStorage.setItem(CONFIG.CHAVE_USUARIO, JSON.stringify(usuario));
  },

  atualizarUsuario(usuario) {
    localStorage.setItem(CONFIG.CHAVE_USUARIO, JSON.stringify(usuario));
  },

  /** Encerra a sessao. O carrinho e preservado de proposito. */
  encerrar(redirecionar = true) {
    localStorage.removeItem(CONFIG.CHAVE_TOKEN);
    localStorage.removeItem(CONFIG.CHAVE_USUARIO);
    if (redirecionar) window.location.href = 'login.html';
  },

  /**
   * Guarda de rota privada: chame no topo das paginas protegidas.
   * @param {boolean} exigirAdmin exige perfil ADMIN
   */
  protegerPagina(exigirAdmin = false) {
    if (!Auth.logado()) {
      const destino = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
      window.location.href = `login.html?redirecionar=${destino}`;
      return false;
    }
    if (exigirAdmin && !Auth.admin()) {
      alert('Area restrita a administradores.');
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },
};
