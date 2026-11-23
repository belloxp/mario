## 1. O que você precisa ter instalado

| Programa | Versão | Como conferir |
|---|---|---|
| Node.js | 18 ou superior | `node -v` |
| MySQL Server | 8.0 | o serviço **MySQL80** precisa estar rodando |

Você também precisa saber o **usuário e a senha** do seu MySQL (normalmente `root`).

---

## 2. Criar o banco de dados

Abra o terminal do MySQL (ou o MySQL Workbench) e rode:

```sql
CREATE DATABASE IF NOT EXISTS barbearia_breck
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Pela linha de comando:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS barbearia_breck CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> As tabelas **não** precisam ser criadas à mão: o seed (passo 5) cria todas.

---

## 3. Configurar o `.env` do backend

Dentro da pasta `backend`, copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env        # no PowerShell: copy .env.example .env
```

Abra o `.env` e coloque **a senha do seu MySQL** em `DB_PASS`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=barbearia_breck
DB_USER=root
DB_PASS=sua_senha_aqui
PORT=3333
JWT_SECRET=troque-este-segredo
```

> Não deixe a porta diferente de **3333**: o frontend procura a API em `http://localhost:3333`.

---

## 4. Instalar as dependências

Ainda dentro de `backend`:

```bash
npm install
```

---

## 5. Popular o banco (seed)

```bash
npm run seed
```

O comando deve terminar com:

```
[seed] 2 usuarios criados.
[seed] 7 categorias criadas.
[seed] 28 produtos criados com estoque.
[seed] 3 pedidos historicos criados.
 Carga inicial concluida com sucesso!
```

> ⚠️ O seed **apaga e recria todas as tabelas**. Rode de novo sempre que quiser voltar o banco ao estado inicial, mas lembre que pedidos e cadastros feitos depois serão perdidos.

---

## 6. Subir a API

```bash
npm run dev     # reinicia sozinho quando você salva um arquivo
# ou
npm start       # modo normal
```

Quando estiver tudo certo, aparece:

```
[banco] conexao estabelecida com o MySQL.
[api] Breck Barber rodando em http://localhost:3333
```

Para testar, abra http://localhost:3333 no navegador: deve aparecer um JSON com a lista de endpoints.

**Deixe esse terminal aberto.**

---

## 7. Subir o frontend

Abra **outro terminal**, entre na pasta `frontend` e rode um servidor estático:

```bash
cd frontend
npx http-server -p 5500 -c-1
```

Também funciona usar a extensão **Live Server** do VS Code (botão *Go Live*). Ela usa a porta 5500.

> Não abra os `.html` com duplo clique (`file://`): a página não consegue chamar a API dessa forma.

---

## 8. Acessar a loja

| Página | Endereço |
|---|---|
| Loja | http://localhost:5500 |
| Login | http://localhost:5500/login.html |
| Painel do admin | http://localhost:5500/admin.html |

### Usuários criados pelo seed

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@breckbarber.com | admin123 |
| Cliente | joao.cliente@email.com | cliente123 |

Também dá para criar uma conta nova de cliente pela página de cadastro.

---

## Resumo rápido (para quem já fez tudo uma vez)

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npx http-server -p 5500 -c-1
```
