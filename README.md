# ZelaCidade

**Cidadania e zeladoria urbana em um só lugar.** O ZelaCidade é um mural
comunitário onde moradores relatam problemas de infraestrutura do bairro,
apoiam as demandas mais urgentes e acompanham o status público de cada
solicitação.

> Projeto full-stack com impacto social, construído com Next.js 14 (App Router),
> TypeScript, Tailwind CSS, Shadcn UI, Lucide Icons e Supabase.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack e decisões de arquitetura](#stack-e-decisões-de-arquitetura)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Pré-requisitos](#pré-requisitos)
- [Passo 1 — Configurar o Supabase](#passo-1--configurar-o-supabase)
- [Passo 2 — Rodar localmente](#passo-2--rodar-localmente)
- [Passo 3 — Deploy no Cloudflare Pages](#passo-3--deploy-no-cloudflare-pages)
- [CI/CD](#cicd)
- [Como atualizar o status de um relato](#como-atualizar-o-status-de-um-relato)
- [Modelo de segurança (RLS)](#modelo-de-segurança-rls)
- [Acessibilidade e UI/UX](#acessibilidade-e-uiux)
- [Solução de problemas](#solução-de-problemas)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Funcionalidades

### MVP entregue

| Funcionalidade | Descrição |
| --- | --- |
| **Feed de ocorrências** | Mural com relatos ordenados por data ou por número de apoiadores, com filtro por categoria e paginação ("Carregar mais"). |
| **Cadastro de relato** | Formulário mobile-first com título, categoria, bairro (opcional), descrição e upload de foto. A imagem é comprimida no dispositivo antes do envio. |
| **Sistema de apoio** | Botão de upvote com atualização otimista, bloqueio de autoapoio e unicidade por usuário/relato garantida no banco. |
| **Status público** | Selo e linha do tempo com os estados **Aberto**, **Em análise** e **Resolvido**. |
| **Sessão anônima** | O visitante recebe uma sessão anônima do Supabase para apoiar e publicar sem cadastro. |
| **Meus relatos** | Página com os relatos vinculados à sessão anônima do navegador. |
| **Compartilhamento** | Compartilhamento nativo (Web Share API) com fallback para cópia do link. |

### Destaques de engenharia

- **Static Export** (`output: 'export'`) — 100% compatível com Cloudflare Pages,
  sem adapter e sem servidor Node.
- **Segurança no banco** — toda a autorização é aplicada por **RLS** no
  PostgreSQL; a chave `anon` é pública por design.
- **Contador de apoios consistente** — trigger `SECURITY DEFINER` mantém
  `reports.upvotes_count` sincronizado, sem permitir `UPDATE` ao cidadão.
- **Upload seguro** — políticas de Storage restringem o upload à pasta
  `<user_id>/<report_id>/`, com limite de 8 MB e MIME types permitidos.
- **Performance mobile** — compressão de imagem no cliente (máx. 1600 px, JPEG
  0.82), imagens lazy e bundle compartilhado de ~87 kB.
- **Acessibilidade** — foco visível, alvos de toque ≥ 44 px, contraste AA,
  labels explícitos, `aria-live` nos estados de carregamento e respeito a
  `prefers-reduced-motion`.

---

## Stack e decisões de arquitetura

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS + Shadcn UI + Lucide Icons |
| Banco | Supabase PostgreSQL + Row Level Security |
| Arquivos | Supabase Storage (bucket público `report-images`) |
| Deploy | Cloudflare Pages (Git integration) |
| CI | GitHub Actions (lint + typecheck + build) |

### Por que Static Export?

O Cloudflare Pages serve arquivos estáticos nativamente. Com
`output: 'export'`, o build gera a pasta `out/` e o deploy não depende do
adapter `@cloudflare/next-on-pages` nem de runtime Node/Edge no servidor.

Toda a leitura e escrita acontece no browser via `@supabase/supabase-js`, e a
**fronteira de segurança é o RLS** — não o servidor Next. Isso torna o MVP
simples de operar, barato e resistente a indisponibilidades de runtime.

> Se no futuro forem necessários SSR, Server Actions ou rotas de API, a
> alternativa é migrar para `@cloudflare/next-on-pages` e declarar
> `export const runtime = 'edge'` nas rotas dinâmicas. A camada de dados em
> `src/lib/reports.ts` foi isolada para facilitar essa migração.

### Sobre a sessão anônima

O Supabase permite `signInAnonymously()`. O usuário recebe um `auth.users`
anônimo (role `authenticated`) e a sessão é persistida no `localStorage`.

- **Vantagem:** relatar e apoiar sem cadastro, mantendo unicidade de apoios e
  autoria.
- **Limitação:** a sessão pertence ao navegador. Limpar os dados do site ou
  trocar de dispositivo remove o acesso a "Meus relatos". Isso é comunicado na
  interface.
- **Requisito:** habilitar **Anonymous sign-ins** no painel do Supabase
  (detalhado abaixo).

---

## Estrutura de diretórios

```text
zelacidade/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Lint, typecheck e build em cada push/PR
├── public/
│   ├── _headers                    # Headers de segurança e cache (Cloudflare Pages)
│   ├── logo.svg
│   └── manifest.webmanifest        # Metadados PWA
├── supabase/
│   └── schema.sql                  # Esquema completo: tabelas, triggers, RLS e Storage
├── src/
│   ├── app/
│   │   ├── globals.css             # Design tokens (azul-marinho + laranja) e utilitários
│   │   ├── icon.svg                # Favicon
│   │   ├── layout.tsx              # Shell: header, footer, bottom nav, providers
│   │   ├── page.tsx                # Feed (rota /)
│   │   ├── relatar/page.tsx        # Formulário (rota /relatar)
│   │   ├── relato/page.tsx         # Detalhe via ?id= (rota /relato)
│   │   ├── meus-relatos/page.tsx   # Relatos da sessão (rota /meus-relatos)
│   │   └── not-found.tsx           # 404
│   ├── components/
│   │   ├── ui/                     # Componentes Shadcn (button, input, card, badge...)
│   │   ├── bottom-nav.tsx          # Navegação inferior mobile
│   │   ├── config-notice.tsx       # Aviso quando o Supabase não está configurado
│   │   ├── empty-state.tsx
│   │   ├── home-hero.tsx           # Hero + "Como funciona"
│   │   ├── logo.tsx
│   │   ├── my-reports.tsx
│   │   ├── providers.tsx           # AuthProvider + Toaster
│   │   ├── report-card.tsx
│   │   ├── report-detail.tsx       # Detalhe + linha do tempo de status
│   │   ├── report-feed.tsx         # Feed com filtros, ordenação e paginação
│   │   ├── report-form.tsx         # Formulário + upload + estados de envio
│   │   ├── share-button.tsx
│   │   ├── site-footer.tsx
│   │   ├── site-header.tsx
│   │   ├── skeletons.tsx
│   │   ├── status-badge.tsx
│   │   └── upvote-button.tsx
│   ├── hooks/
│   │   └── use-auth.tsx            # Sessão anônima + ensureSession()
│   └── lib/
│       ├── constants.ts            # Categorias, status, limites e paginação
│       ├── format.ts               # Datas, números e tamanho de arquivo
│       ├── image.ts                # Compressão/redimensionamento no cliente
│       ├── reports.ts              # Camada de acesso a dados
│       ├── utils.ts                # cn(), mensagens de erro, caminho de imagem
│       └── supabase/
│           ├── client.ts           # Cliente Supabase (browser)
│           └── types.ts            # Tipos do banco (Database)
├── .env.example
├── .nvmrc                          # Node 20
├── next.config.js                  # Static export para Cloudflare Pages
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Pré-requisitos

- **Node.js 20+** (recomendado; `.nvmrc` incluído)
- Conta gratuita no [Supabase](https://supabase.com)
- Conta gratuita no [Cloudflare](https://dash.cloudflare.com)
- Repositório no GitHub
- Git e npm

---

## Passo 1 — Configurar o Supabase

### 1.1 Criar o projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e clique em
   **New project**.
2. Escolha nome, senha do banco e região (prefira uma próxima ao Brasil, como
   `South America (São Paulo)`).
3. Aguarde a provisionamento do projeto.

### 1.2 Executar o esquema SQL

1. No painel do projeto, abra **SQL Editor**.
2. Clique em **New query**.
3. Copie todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql).
4. Cole e clique em **Run**.

O script é idempotente e cria:

- Tipos `report_category` e `report_status`
- Tabelas `reports` e `upvotes` (com constraints e índices)
- Triggers de `updated_at` e do contador de apoios
- Políticas de RLS e permissões
- O bucket público **`report-images`** no Storage
- Políticas de Storage para leitura pública e upload na própria pasta

**Verificação rápida** (rode no SQL Editor):

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'report-images';

select policyname, cmd, roles
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, policyname;
```

### 1.3 Habilitar o login anônimo (obrigatório)

O app usa sessões anônimas para permitir publicar e apoiar sem cadastro.

1. No painel, vá em **Authentication** → **Sign In / Providers**
   (em versões anteriores: **Authentication** → **Providers**).
2. Localize **Anonymous sign-ins**.
3. Ative a opção e salve.

> Sem isso, o app exibe "Não foi possível iniciar uma sessão" e as escritas
> falham com erro de autenticação. A leitura do feed continua funcionando.

### 1.4 Criar/verificar o bucket de imagens

O script SQL já cria o bucket `report-images` como **público**, com limite de
**8 MB** e MIME types `image/jpeg`, `image/png` e `image/webp`.

Se preferir criar manualmente:

1. Vá em **Storage** → **New bucket**.
2. Nome: `report-images`.
3. Marque **Public bucket**.
4. Em **File size limit**, defina `8 MB`.
5. Em **Allowed MIME types**, adicione `image/jpeg`, `image/png` e
   `image/webp`.
6. Confirme. As políticas de acesso já foram criadas pelo `schema.sql`.

**Convenção de caminho:** `report-images/<user_id>/<report_id>/foto-<timestamp>.jpg`.
A política de `INSERT` valida que a primeira pasta é o `auth.uid()`, impedindo
que um usuário envie arquivos na pasta de outro.

### 1.5 Copiar as credenciais

Em **Project Settings** → **API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> ⚠️ A chave `anon` é **pública por design** e pode ir para o browser. Nunca
> exponha a chave `service_role` em variáveis `NEXT_PUBLIC_*`, no código do
> cliente ou no repositório.

---

## Passo 2 — Rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/SEU-USUARIO/zelacidade.git
cd zelacidade

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
# Linux/macOS
cp .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local

# 4. Preencha o .env.local
# NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

# 5. Suba o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o static export em `out/` |
| `npm run preview` | Serve a pasta `out/` localmente |
| `npm run lint` | ESLint (Next.js) |
| `npm run typecheck` | TypeScript sem emitir arquivos |

> As variáveis `NEXT_PUBLIC_*` são **embutidas no bundle durante o build**.
> Depois de alterá-las, reinicie o `npm run dev` ou refaça o deploy.

---

## Passo 3 — Deploy no Cloudflare Pages

### 3.1 Enviar o projeto para o GitHub

```bash
git init
git add .
git commit -m "feat: MVP do ZelaCidade"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/zelacidade.git
git push -u origin main
```

### 3.2 Conectar o repositório ao Cloudflare Pages

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Vá em **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
3. Autorize o GitHub e selecione o repositório `zelacidade`.
4. Em **Set up builds and deployments**, configure:

   | Campo | Valor |
   | --- | --- |
   | **Production branch** | `main` |
   | **Framework preset** | `Next.js (Static HTML Export)` (se não existir, use `None`) |
   | **Build command** | `npm run build` |
   | **Build output directory** | `out` |
   | **Node version** (env var) | `NODE_VERSION=20` |

5. Em **Environment variables**, adicione (para **Production** e **Preview**):

   ```text
   NEXT_PUBLIC_SUPABASE_URL      = https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = sua-chave-anon-publica
   ```

6. Clique em **Save and Deploy**.

O Cloudflare Pages executa `npm install` + `npm run build`, publica `out/` e
gera uma URL `https://zelacidade.pages.dev` (ou o nome que você escolher).

### 3.3 CI/CD automático

Com a integração Git ativa:

- **Push na `main`** → novo deploy de produção.
- **Pull request** → deploy de preview com URL própria.
- **Rollback** → aba **Deployments** → escolha uma versão anterior.

O workflow em [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) roda
lint, typecheck e build em cada push/PR, garantindo que o código chegue ao
Pages já validado.

### 3.4 Domínio personalizado (opcional)

Em **Pages** → seu projeto → **Custom domains** → **Set up a custom domain**.
Adicione o domínio e configure o CNAME indicado. O HTTPS é automático.

### 3.5 Headers de segurança

O arquivo [`public/_headers`](./public/_headers) é copiado para `out/` e
aplicado pelo Cloudflare Pages:

- CSP restritiva (ajuste se usar domínio customizado no Supabase)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- Cache imutável para `/_next/static/*`

> Se o seu projeto Supabase usar um domínio próprio (ex.:
> `api.minhacidade.com`), adicione-o em `img-src` e `connect-src` no
> `public/_headers` e refaça o deploy.

### 3.6 Checklist de deploy

- [ ] `supabase/schema.sql` executado sem erros
- [ ] Bucket `report-images` existe e é público
- [ ] **Anonymous sign-ins** habilitado
- [ ] Variáveis do Supabase configuradas no Cloudflare Pages
- [ ] Build command `npm run build` e output `out`
- [ ] `NODE_VERSION=20`
- [ ] Deploy concluído e feed carregando
- [ ] Teste de publicação com foto e apoio em outro navegador

---

## CI/CD

```text
GitHub (push/PR)
   │
   ├── GitHub Actions ──► lint + typecheck + build (validação)
   │
   └── Cloudflare Pages ──► npm run build ──► out/ ──► CDN global
                                 │
                                 └── Supabase (PostgreSQL + Storage + Auth)
```

O app é estático; não há servidor de aplicação para manter. As credenciais
`NEXT_PUBLIC_*` são públicas e a autorização é feita pelo RLS.

---

## Como atualizar o status de um relato

Não existe política de `UPDATE` para cidadãos — isso evita que qualquer pessoa
altere o status de um relato. As atualizações são feitas por quem tem acesso
administrativo ao projeto.

### Opção A — SQL Editor (rápido)

```sql
-- Em análise
update public.reports
   set status = 'em_analise'
 where id = 'UUID-DO-RELATO';

-- Resolvido
update public.reports
   set status = 'resolvido'
 where id = 'UUID-DO-RELATO';
```

### Opção B — Table Editor

**Table Editor** → `reports` → edite a coluna `status` → salve.

### Opção C — Painel administrativo (evolução recomendada)

Crie uma tabela `profiles` com `role = 'admin'` e uma política de `UPDATE` que
valide `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`.
O roadmap abaixo já prevê essa evolução.

> O `service_role` ignora RLS. Use-o apenas em scripts/server e **nunca** no
> front-end.

---

## Modelo de segurança (RLS)

### Tabelas

| Tabela | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `reports` | Público (`anon` + `authenticated`) | Próprio `user_id` | ❌ (somente service_role) | Próprio autor |
| `upvotes` | Público | Próprio `user_id`, relato de outra pessoa, único por relato | ❌ | Próprio apoio |

### Storage (`report-images`)

| Operação | Regra |
| --- | --- |
| Leitura | Pública (bucket público + policy de SELECT) |
| Upload | `authenticated` e caminho iniciando com `auth.uid()` |
| Atualização/Exclusão | Dono da pasta (`auth.uid()`) |

### Consistência do contador

- `upvotes` tem `unique (report_id, user_id)`.
- Trigger `upvotes_sync_count` (SECURITY DEFINER) incrementa/decrementa
  `reports.upvotes_count` de forma atômica.
- O cidadão não tem `UPDATE` em `reports`; não é possível "inflar" o contador
  pelo cliente.

### Boas práticas já aplicadas

- `search_path` fixo nas funções `SECURITY DEFINER`.
- `revoke all` + `grant` explícito nas tabelas públicas.
- Validação de tamanho de título/descrição/bairro no banco **e** no formulário.
- Bloqueio de autoapoio na política de `INSERT` de `upvotes`.
- Limite de 8 MB e MIME types restritos no bucket.

---

## Acessibilidade e UI/UX

- **Mobile-first:** navegação inferior fixa, botões com altura ≥ 44 px,
  formulário em coluna única e tipografia de 16 px nos campos (evita zoom no
  iOS).
- **Contraste:** azul-marinho `#102a47` sobre branco e laranja de ação
  `#b64a0c` com texto branco (≈ 5,3:1). Selos de status usam fundos claros com
  texto escuro.
- **Foco visível:** `focus-visible` em todos os elementos interativos e skip
  link para o conteúdo principal.
- **Estados de carregamento:** skeletons no feed e no detalhe; estados
  explícitos no upload ("Otimizando foto" → "Enviando foto" → "Publicando"),
  com `role="progressbar"` e `aria-live`.
- **Semântica:** `fieldset`/`legend` na categoria, `aria-pressed` nos filtros e
  no apoio, `aria-current` na navegação e na linha do tempo.
- **Reduced motion:** animações desativadas via `prefers-reduced-motion`.
- **Mensagens claras:** erros em português, associados aos campos via
  `aria-describedby`, com foco no primeiro campo inválido.

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| "Não foi possível iniciar uma sessão" | Login anônimo desabilitado | Ative **Anonymous sign-ins** no Supabase |
| Feed vazio com erro | `.env.local` ausente/inválido | Confira URL e chave `anon`; reinicie o dev server |
| Upload retorna 400/403 | Bucket ou política ausente | Reexecute `supabase/schema.sql`; confira `report-images` |
| Imagem não aparece | CSP bloqueando o domínio | Ajuste `img-src` em `public/_headers` |
| 404 ao abrir `/relato/?id=...` direto | Rota não exportada | Confirme `trailingSlash: true` e a pasta `out/relato/index.html` |
| Variáveis novas não funcionam | Build estático já gerou o bundle | Refaça o deploy no Cloudflare Pages |
| Apoio duplicado | Sessão antiga/outra aba | O banco garante unicidade; recarregue a página |
| "Você não pode apoiar o próprio relato" | Política de autoapoio | Comportamento esperado |

### Verificar se o static export está correto

```bash
npm run build
ls out/index.html out/relato/index.html out/relatar/index.html
```

---

## Roadmap

- [ ] Painel administrativo com autenticação por e-mail e papéis (`admin`)
- [ ] Geolocalização do relato (mapa + clustering)
- [ ] Notificações por e-mail/WhatsApp quando o status mudar
- [ ] Moderação e denúncia de conteúdo
- [ ] Rate limiting por usuário/IP (Upstash ou Cloudflare Turnstile)
- [ ] Realtime no feed (Supabase Realtime)
- [ ] Métricas públicas por bairro e categoria
- [ ] Testes E2E com Playwright e testes unitários com Vitest
- [ ] Revisão de LGPD e política de retenção de imagens

---

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE).

---

Feito para fortalecer a cidadania e a zeladoria urbana. 💙🧡
