# 07 — Persistência (`Save v5`), Runtime, Plugins e API TheoTown (`Delta.*`)

> **Propósito:** Especificar com exatidão o protocolo de persistência local (`localStorage`), o schema JSON completo do save `v: 5`, o algoritmo de migração retrocompatível `v4 -> v5`, a API completa de extensibilidade modelada sobre o TheoTown (`Draft`, `Building`, `Util`, `Runtime`, `Debug`, `Script`, `Plugins`, `NeighborCity`, `DSA`), o interpretador de comandos `Delta.run` e o contrato arquitetural para integração futura com um back-end remoto.

---

## 1. Persistência em `localStorage` (`L2064`, `L2067–L2074`, `L2304–L2308`)

O jogo utiliza três chaves independentes no `window.localStorage`:

| Constante / Chave | Valor Literal da Chave | Conteúdo Serializado | Momento de Leitura | Momento de Escrita |
|---|---|---|---|---|
| `KEY` | `'delta_city_v4'` | `JSON.stringify(g.toJSON())` (Objeto Save `v: 5`) | No boot via `load()` (`L2073`, `L2306`) | Em `save()` (`L2074`): a cada `15000` ms (`setInterval`, `L2308`), em `visibilitychange` (quando `document.hidden === true`), em `pagehide` e ao clicar em `#nGo` (`CRIAR CIDADE`, `L2284`). |
| `KEY + '_st'` | `'delta_city_v4_st'` | `JSON.stringify(D.Runtime.storage)` (dicionário de dados de plugins indexado por `plugin.id`) | No boot (`L2304`), **antes** de `D.Script.bootEngine()` | Em toda chamada de `save()` (`L2074`). |
| `SET` | `'delta_city_v4_set'` | `JSON.stringify(cfg)` (`{ confirm: boolean }`) | Na inicialização da UI (`L2068`) | Em toda chamada de `save()` (`L2074`). |

> **Comportamento de Tolerância a Falhas (`try/catch`):** Todas as leituras e escritas em `localStorage` são envolvidas em blocos `try { ... } catch (e) { }` silenciosos (`L2068`, `L2073`, `L2074`, `L2304`). Se o `localStorage` estiver bloqueado (modo anônimo restrito ou quota excedida) ou o JSON estiver corrompido, `load()` cai automaticamente no fallback `newGame({ size: 48, type: 'lake' })`.

---

## 2. Schema Completo do Save `v: 5` (`toJSON` e `fromJSON`, `L886–L909`)

### 2.1 Serialização (`Game.prototype.toJSON()`, `L887–L894`)
Retorna um objeto plano contendo exatamente **49 propriedades**:
1. **Cabeçalho (5 campos):**
   - `v`: `5` (versão do formato de save)
   - `N`: `this.N` (`32 | 48 | 64 | 96`)
   - `seed`: `this.seed` (inteiro sem sinal de 32 bits)
   - `rs`: `this.rs` (estado atual do PRNG Mulberry32)
   - `type`: `this.type` (`'continent' | 'island' | 'river' | 'lake'`)
2. **Escalares e Objetos Econômicos/Estatísticos (14 campos, `L889`):**
   - `funds`, `day`, `month`, `year`, `tod`, `speed`, `tax` (`{r,c,i}`), `demand` (`{r,c,i}`), `hist` (`{pop,funds,happy,inf}`), `stats` (`{solved,lost,fires}`), `last` (`{tr,tc,ti,up,rent,debt}`), `cx`, `cy`, `interest`, `inflation`.
3. **Os 28 Arrays de `U8` convertidos via `Array.from(this[k])` (comprimento $N^2$, `L890`):**
   - `bio`, `kind`, `lvl`, `vr`, `built`, `pw`, `pipe`, `pwOn`, `wtOn`, `fire`, `nd`, `ab`, `cr`, `roadAdj`, `cPol`, `cFir`, `cHea`, `cEdu`, `cPar`, `poll`, `land`, `hap`, `cls`, `riot`, `riotT`, `bSize`, `moisture`, `slopeMask`.
4. **Arrays de Pegada e Topografia (2 campos, `L891–L892`):**
   - `pivot`: `Array<number>` de comprimento $N^2$ (valores `-1` ou índice do pivô `0..N²-1`).
   - `cornerH`: `Array<number>` de comprimento $(N+1)^2$ (valores `0..9`).

### 2.2 Desserialização e Migração Automática `v4 -> v5` (`Game.fromJSON(o)`, `L895–L909`)
1. Instancia `const g = new Game({ seed: o.seed, size: o.N, type: o.type, starter: false })`.
   - *(Isso executa `genTerrain(o.type)` com a semente salva, reconstruindo `elevF` base).*
2. Copia os 15 campos escalares/objetos se `o[k] !== undefined` (os 14 campos de `L889` mais `rs`, que sobrescreve o estado do PRNG após `genTerrain`).
3. Para cada um dos 28 nomes em `U8`, se `o[k] && o[k].length === g[k].length`, copia os bytes via `g[k].set(o[k])`.
4. **Restauração ou Migração de `pivot` (`L899–L906`):**
   - Se `o.pivot && o.pivot.length === g.pivot.length`: executa `g.pivot.set(o.pivot)` (caminho `v: 5`).
   - **Caso contrário (Save legado `v: 4` sem multi-tile):** reconstrói `pivot` e `bSize` varrendo `i = 0 .. g.kind.length - 1`:
     ```js
     if (g.built[i] && g.kind[i] >= 2) {
       g.pivot[i] = i;
       g.bSize[i] = 1;
     } else {
       g.pivot[i] = -1;
       g.bSize[i] = 0;
     }
     ```
5. **Restauração de `cornerH` (`L907`):**
   - Se `o.cornerH && o.cornerH.length === g.cornerH.length`, executa `g.cornerH.set(o.cornerH)` e chama `g.updateSlopeMasks()` (que atualiza `slopeMask`, `elev` e incrementa `terrainVer`).
6. Normaliza `g.hist.inf = g.hist.inf || []` e `g.last.rent = g.last.rent || 0`, executa `g.recalc()` e retorna `g`.

---

## 3. Especificação Completa da API Estilo TheoTown (`Delta.*`)

### 3.1 `Delta.Draft` e `DRAFTS` (`L191–L198`)
Registro central de definições estáticas (blueprints) de construções:
- **`Draft.append(d)`:** Define padrões `{ w: d.sz || 1, h: d.sz || 1, needsRoad: true }`, mescla `d` por cima, salva em `DRAFTS.set(d.id, ...)` e retorna o draft criado.
- **`Draft.merge(d)`:** Mescla propriedades sobre um draft já existente (ou `{}` se não existir) em `DRAFTS.set(d.id, Object.assign(cur, d))` e o retorna.
- **`Draft.getDraft(id)`:** Retorna `DRAFTS.get(id) || null`.
- **`Draft.getDrafts()`:** Retorna `Array.from(DRAFTS.values())`.
- **Drafts Registrados Automaticamente no Boot (`L198`):**
  Para $k = 1 \dots 16$, registra `id = '$b_' + k` com `{ id, k, title: KN[k], sz: (FAC[k] && FAC[k].sz) || 1, w: sz, h: sz, needsRoad: k !== K.PARK && k !== K.COAL && k !== K.SOLAR && k !== K.WTOWER }`.

### 3.2 `Delta.Building` (`L200–L215`)
Instanciado por `g.getBuilding(x, y)` (`L255`) quando `g.kind[piv] >= 2` (retorna `null` para terreno vazio ou rua):
- `constructor(g, pivotIdx)`: armazena `this.g = g` e `this.i = pivotIdx`.
- `getX()` / `getY()`: coordenadas do canto superior-esquerdo (pivô) `this.i % g.N` e `(this.i / g.N) | 0`.
- `getXY()` / `getDrawXY()`: retorna `[this.getX(), this.getY()]`.
- `getWidth()` / `getHeight()`: retorna `this.g.bSize[this.i] || 1`.
- `getDraft()`: retorna `Draft.getDraft('$b_' + this.g.kind[this.i])`.
- `getText()` / `setText(t)`: lê ou define o letreiro customizado do prédio em `this.g.bText` (remove a chave se `t` for falsy).
- `hasRoad()`: `!!this.g.roadAdj[this.i]`.
- `hasNeededRoad()`: `!d || !d.needsRoad || !!this.g.roadAdj[this.i]`.
- `isWorking()`: `!!g.built[i] && !g.ab[i] && !g.newCons(i) && this.hasNeededRoad() && (!!g.pwOn[i] || g.kind[i] === K.PARK)`.
- `isUpgradeInConstruction()`: `this.g.cons.has(this.i)`.

### 3.3 `Delta.Util` (`L150–L163`)
- **`collectFullRectTiles(x, y, w, h)`:** Retorna lista de pares `[x + i, y + j]` para $j \in [0, h)$ e $i \in [0, w)$ (preenchimento completo).
- **`collectRectTiles(x, y, w, h, noCorners)`:** Retorna os pares `[tx, ty]` do **perímetro** do retângulo $w \times h$ em sentido horário (topo $\to$ direita $\to$ base $\to$ esquerda). Se `noCorners === true`, omite os 4 vértices extremos do retângulo.
- **`optStorage(src, name, ctor)`:** Garante que `src[name]` exista (inicializando com `ctor()` se `ctor` for função, ou `{}`) e o retorna.
- **`color2hex(r, g, b)`:** Converte 3 inteiros $[0, 255]$ para string hexadecimal `'#rrggbb'`.
- **`hex2color(hex)`:** Converte `'#rrggbb'` ou `'rrggbb'` para `[r, g, b]`.

### 3.4 `Delta.Runtime`, `Delta.Debug`, `Delta.Plugins` e `Delta.run` (`L2001–L2057`)
- **`Delta.Debug` (`L2001–L2006`):**
  - `_info`: string anexada ao final do painel `#perf` (`L2298`).
  - `info(v)`: define `_info = v == null ? '' : String(v)`.
  - `log(...args)`: formata objetos com `JSON.stringify` e imprime no console com prefixo `'[Delta.Debug]'`.
  - `toast(v)`: se `D.game` existir, chama `D.game.say(String(v))`.
- **`Delta.Runtime` (`L2007–L2024`):**
  - `postpone(fn, delayMS)`: agenda `fn` na fila `Q` para executar após `Math.max(0, +delayMS || 0)` ms de tempo de quadro.
  - `flush(dtMS)`: chamado todo quadro por `loop(t)` (`L2292`). Subtrai `dt = Math.max(1, +dtMS || 16.6)` de todos os itens presentes no início do turno e executa aqueles cujo `ms <= 0` dentro de `try/catch`.
  - `getStorage(id)`: retorna o objeto persistente `this.storage[id]` (criando `{}` se não existir).
  - `registerCommand(n, f)`: registra comando no mapa `CMD[n] = f`.
  - `toJson(t)` / `fromJson(s)`: wrappers de `JSON.stringify` / `JSON.parse`.
  - `getTime()`: `Math.round(performance.now())`.
  - `getUuid()`: UUID v4 via `crypto.randomUUID()` ou fallback hexadecimal.
- **`Delta.Plugins` (`L2050–L2051`):**
  - `add(p)`: cria o descritor `o = { id: p.id, err: 0, off: false, storage: () => D.Runtime.getStorage(p.id) }`, adiciona à lista `PL` e registra automaticamente qualquer método de `p` cujo nome pertença aos 17 eventos de `D.Script.EV`, vinculando `this` ao objeto `o`.
  - `setActive(id, on)`: ativa/desativa o plugin `id` (`o.off = !on`) e zera o contador de falhas `o.err = 0`.
  - **Plugin Nativo `$diario00` (`L2057`):** incrementa `this.storage().meses = (s.meses || 0) + 1` a cada evento `'nextMonth'`.
- **Console `Delta.run(line)` e Comandos Nativos (`L2052–L2056`):**
  Divide `line` por espaços (`/\s+/`), busca `CMD[a[0]]` e invoca `f(D.game, a.slice(1))`:
  - `Delta.run('speed 2')`: define `g.speed = clamp(+a[0] || 0, 0, 3)` e retorna `'ok'`.
  - `Delta.run('funds 5000')`: soma `+a[0] || 0` a `g.funds`, chama `g.recalc()` e retorna o novo saldo.
  - `Delta.run('interest 12')`: define `g.interest = clamp(+a[0] || g.interest, 1, 25)` e retorna a nova taxa.
  - `Delta.run('plugins')`: retorna lista de IDs dos plugins separados por vírgula (com sufixo `' (off)'` se desativados).

---

## 4. Contrato Arquitetural para Integração Futura com Back-End (`src/persistence/storage.js`)

Atualmente o sistema é 100% *client-side*. No desmembramento modular (`src/persistence/storage.js`), a camada de persistência deve expor uma interface assíncrona compatível com adaptadores remotos (REST / IndexedDB / Cloud Save) mantendo o `localStorage` como cache síncrono primário (Write-Through):

1. **Completude do Payload de Save (`v: 6` opcional ou extensão de `v: 5`):**
   Para eliminar a Peculiaridade `P3` documentada no `00_INDEX_AND_GLOSSARY.md` quando desejado em modo servidor, o payload pode incluir opcionalmente:
   - `name`: `string`
   - `bText`: `Array<[number, string]>` (`Array.from(this.bText.entries())`)
   - `cons`: `Array<[number, {p, from, dur}]>` (`Array.from(this.cons.entries())`)
   - `crimes`: `this.crimes`
2. **Assinatura do Adaptador de Persistência:**
   - `saveSnapshot(game, runtimeStorage, config) -> Promise<void>`
   - `loadSnapshot() -> Promise<{ gameData, runtimeStorage, config } | null>`