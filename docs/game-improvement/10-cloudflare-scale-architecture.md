# 10 — Arquitetura de Grande Escala na Cloudflare & Registro de Deploy em Produção

> **Status do Documento:** Implementado, Provisionado e Publicado em Produção  
> **URL Oficial em Produção:** https://delta-city-edge.ca88321499.workers.dev  
> **Conta Cloudflare (`wrangler whoami`):** `ca88321499@gmail.com` (`Account ID: 623fd1e96fc794d2657e16234959ddd1`)  
> **Wrangler CLI:** `v4.142.0`

---

## 1. Mapeamento do Ecossistema Cloudflare em Produção

Cada componente do **Delta City** foi provisionado e vinculado na borda da Cloudflare através do arquivo [`wrangler.toml`](file:///c:/Users/Carlos/Documents/gittown/wrangler.toml) e do entrypoint [`worker/index.js`](file:///c:/Users/Carlos/Documents/gittown/worker/index.js):

| Ferramenta Cloudflare | Binding / Recurso | Papel e Otimização Aplicada |
| :--- | :--- | :--- |
| **Workers Static Assets / Pages** | `env.ASSETS` (`./dist`) | Serve o bundle HTML5, CSS e JS compilado pelo Vite diretamente dos 300+ datacenters globais da Cloudflare sob o mesmo domínio da API (eliminando `OPTIONS` preflight de CORS). |
| **Cloudflare Workers** | `delta-city-edge` ([`worker/index.js`](file:///c:/Users/Carlos/Documents/gittown/worker/index.js)) | Executa autenticação criptográfica stateless (`HMAC-SHA256` via `crypto.subtle`), CRUD transacional de cidades, proteção contra conflitos e ranking global. |
| **Durable Objects (SQLite-backed)** | `env.CITY_SESSION` (`CitySession`) | Instância *single-threaded* com memória dedicada por cidade (`/api/city/:id/action`, `/api/city/:id/state` e WebSockets). Processa ações em fila sequencial sem *race conditions* e transmite *diffs* em tempo real. |
| **Cloudflare D1 (SQLite Edge)** | `env.DB` (`79f040e9-2507-4cff-b7e5-16fe8e991d4f`) | Armazena contas (`delta_users`), metadados leves indexados por jogador (`delta_cities`), estado binário compactado (`delta_city_blobs`) e o ranking global (`idx_delta_cities_leaderboard`). |
| **Cloudflare Workers KV** | `env.DELTA_KV` (`6112371e37d8492fb177db7e3d453547`) | Faz cache de borda de baixa latência para configurações globais (`/api/config`), ranking top 20 (`/api/leaderboard`) e snapshots de cidades (`city:<id>`). |

---

## 2. Arquitetura de Banco de Dados e Estado Distribuído

### 2.1. Simulação Ativa e Coordenação: Durable Objects (`CitySession`)
- **Isolamento por Cidade:** Cada cidade é roteada para sua própria instância de Durable Object via `env.CITY_SESSION.idFromName(cityId)`.
- **Zero Conflito (Single-Threaded Event Loop):** Todas as mutações de tiles (`POST /api/city/:id/action` ou mensagens WebSocket) são processadas sequencialmente na memória do Durable Object, incrementando monotonicamente a propriedade `version` e persistindo no armazenamento transacional da instância.
- **Broadcast de Diffs via WebSocket:** Clientes conectados ao endpoint `/api/city/:id/ws` recebem apenas o delta da alteração (`{ type: 'diff', diff: { x, y, tile, version } }`), evitando o reenvio da matriz inteira.

### 2.2. Persistência Relacional e Isolamento por Usuário: Cloudflare D1 ([`schema.sql`](file:///c:/Users/Carlos/Documents/gittown/schema.sql))
Para garantir listagens instantâneas no menu principal sem ler megabytes de mapas desnecessariamente, o banco D1 divide os dados em 3 tabelas isoladas por `owner_id`:
1. **`delta_users`:** `id`, `username` (único), `password_hash` (SHA-256), `role`, `created_at`.
2. **`delta_cities` (Metadados Leves):** `id`, `owner_id`, `name`, `pop`, `funds`, `city_rank`, `city_points`, `year`, `seed`, `size`, `type`, `difficulty`, `version`, `created_at`, `updated_at`. Indexada por `(owner_id, updated_at DESC)` e `(city_points DESC, pop DESC)`.
3. **`delta_city_blobs` (Estado Completo SoA):** `city_id`, `owner_id`, `version`, `payload_json`, `updated_at`. Lida exclusivamente quando o jogador abre a cidade (`GET /api/cities/:id`).

---

## 3. Otimização de Requisições e Prevenção de Travamentos

1. **Serialização Binária SoA em Base64 (`v: 6` em [`src/core/state/persistence.js`](file:///c:/Users/Carlos/Documents/gittown/src/core/state/persistence.js)):**
   - Os 29 arrays `Uint8Array` (`U8`), `cornerH` e `pivot` (`Int32Array`) são convertidos diretamente em Base64 binário (`encodeU8` / `encodeI32`), mantendo retrocompatibilidade total de leitura com o formato `v: 5`.
   - Evita a criação de centenas de milhares de elementos via `Array.from()`, reduzindo o tempo de CPU no cliente para `< 1ms` (sem *frame drops*).
2. **Fila *Single-Flight* + *Dirty Check* ([`src/persistence/remote-storage.js`](file:///c:/Users/Carlos/Documents/gittown/src/persistence/remote-storage.js)):**
   - Calcula uma assinatura rápida do estado (`computeQuickSignature`). Se nada mudou na cidade, o ciclo de auto-save de 25s ignora a chamada de rede.
   - Garante que nunca existam dois `PUT` simultâneos para a mesma cidade (`saveLocks` + `pendingPayloads`).
   - Dispara salvamento com `keepalive: true` no evento `visibilitychange` ao fechar ou ocultar a aba.
3. **Controle de Concorrência Otimista (`HTTP 409 Conflict`):**
   - Cada atualização (`PUT /api/cities/:id`) verifica `expectedVersion` contra a coluna `version` no D1 e no Durable Object. Caso uma aba desatualizada tente sobrescrever um save mais novo, o Worker rejeita a escrita com `409 Conflict`.

---

## 4. Comandos de Operação e Deploy (`package.json`)

```powershell
# 1. Rodar ambiente Cloudflare localmente
npm run cf:dev

# 2. Aplicar migrações SQL no banco D1 remoto
npm run d1:migrate

# 3. Compilar frontend (Vite) e publicar Worker + Durable Object + Assets na Cloudflare
npm run cf:deploy
```

---

## 5. Resultados da Verificação ao Vivo em Produção

Todos os 9 testes automatizados executados contra `https://delta-city-edge.ca88321499.workers.dev` foram aprovados:

| # | Teste Executado | Resultado Obtido |
|---|---|---|
| 1 | Entrega do Frontend na CDN (`GET /`) | `200 OK` (HTML/CSS/JS servidos pela borda) |
| 2 | Configurações Globais no KV (`GET /api/config`) | `200 OK` (`version: 4.0.0-edge`) |
| 3 | Autenticação D1 + JWT WebCrypto (`POST /api/auth/login`) | `200 OK` (Token assinado emitido) |
| 4 | Validação Stateless de Sessão (`GET /api/auth/session`) | `200 OK` (`usr_f3342823`) |
| 5 | Criação de Cidade $64\times64$ Base64 v6 (`POST /api/cities`) | `201 Created` (`version: 1`, `182.4 KB` brutos / `~38 KB` gzip) |
| 6 | Atualização Otimista (`PUT /api/cities/:id` com `expectedVersion: 1`) | `200 OK` (Avançou para `version: 2`) |
| 7 | Proteção contra Conflito (`PUT` com `expectedVersion: 1` obsoleto) | `409 Conflict` (Sobrescrita bloqueada com sucesso) |
| 8 | Mutação Atômica no Durable Object (`POST /api/city/:id/action`) | `200 OK` (`status: success`, tile `[5,6]` atualizado em RAM/SQLite) |
| 9 | Leaderboard Global (`GET /api/leaderboard`) | `200 OK` (Top 20 indexado e cacheado no KV) |
