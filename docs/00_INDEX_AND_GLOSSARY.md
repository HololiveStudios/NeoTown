# 00 — Índice, Protocolo de Leitura e Glossário (Delta City)

> **Público-alvo:** modelos de linguagem (LLMs) e engenheiros que precisam entender o Delta City sem acesso ao código.
> **Fonte da verdade:** `index.html` (2.314 linhas, UTF-8). Toda afirmação desta base cita a linha original no formato `L<n>` ou `L<a>–L<b>`.
> **Versão do código documentada:** núcleo "v4" (comentário L86), formato de save `v: 5` (L888).

---

## 1. Protocolo obrigatório para IAs consumidoras

1. **Hierarquia de verdade:** (1) o código em `index.html`; (2) os documentos `00`–`09`; (3) nada mais. Se uma informação não estiver em (1) nem em (2), a resposta correta é: *"não documentado no Delta City"*. É proibido inferir por analogia com TheoTown, SimCity ou qualquer outro jogo.
2. **Constantes são literais.** Nunca arredonde, normalize ou "melhore" um número. `0.68` é `0.68`, não "cerca de 2/3".
3. **Atual vs. planejado:** cada símbolo tem um **local atual** (linha em `index.html`) e um **local planejado** (arquivo em `src/…`, Entrega 1). Ao gerar código, use o planejado. Ao explicar comportamento, cite o atual.
4. **Comportamento "como está":** a seção 7 lista peculiaridades reais do código. Elas fazem parte do comportamento oficial. Não as corrija silenciosamente; se for corrigir, declare explicitamente a mudança.
5. **Desambiguação de nomes:** vários identificadores curtos têm significados diferentes por contexto (`dirty`, `s`, `T`, `X`, `R`, `D`, `A`, `p`). Use sempre a tabela da seção 6.
6. **Unidades:** respeite as unidades da seção 4. "Dia" sempre significa **dia de jogo** (5.000 ms de tempo simulado a 1x), nunca dia real.
7. **Ordem de execução importa:** o gerador pseudoaleatório `g.rand()` é compartilhado. Reordenar chamadas muda todo o resultado subsequente (ver seção 5).

---

## 2. Mapa da base de conhecimento

| Arquivo | Escopo | Consulte quando a pergunta envolver… |
|---|---|---|
| `00_INDEX_AND_GLOSSARY.md` | Este arquivo | vocabulário, coordenadas, unidades, fontes de aleatoriedade, peculiaridades |
| `01_ARCHITECTURE_AND_FLOW.md` | Arquitetura modular, grafo de dependências, boot, ciclo de vida `Script`, fluxo ponta a ponta | "em que ordem as coisas acontecem", "quem chama quem" |
| `02_RENDER_ENGINE.md` | Rasterizador por software, passes 1–4, câmera, projeção, caches, culling, noite | qualquer pixel na tela |
| `03_ALGORITHMS_AND_MATH.md` | `hash2`, `rand`, `qnoise`, `fbm`, `ridgedFbm`, `genTerrain`, `Vector`, iluminação, triângulos gouraud | fórmulas e geração procedural |
| `04_STATE_AND_SIMULATION.md` | Schema do `Game`, `recalc`, economia, crescimento, protestos, incêndios, crimes, viaturas, relógio | regras de jogo e números da simulação |
| `05_TOOLS_AND_PLACEMENT.md` | Ferramentas (`CATS`), seleção, custo, prévia, construção, demolição, multi-tile, `inspect` | o que o jogador pode construir e quanto custa |
| `06_UI_AND_EVENTS.md` | DOM, HUD, minimapa, menu, modais, input (pointer/pinch/wheel/teclado), laço principal | eventos de interface e atualização de tela |
| `07_PERSISTENCE_AND_RUNTIME_API.md` | `localStorage`, `toJSON`/`fromJSON`, migração v4→v5, `Runtime`, `Debug`, `Plugins`, console | salvar/carregar, extensões e plugins |
| `08_FUNCTION_SIGNATURES_REFERENCE.md` | Índice exaustivo de funções/métodos | assinatura, retorno, efeitos colaterais, chamadores |
| `09_BUILDINGS_CATALOG.md` | Cada desenho de construção (`res1`…`landmark`) | aparência e geometria de cada prédio |
| `game-improvement/` | **Planejamento Oficial da Evolução** | Gameplay, fluxo inicial, progressão, pixel art, roadmap, validação e arquitetura Cloudflare em escala (documentos 00 a 10) |

---

## 3. Mapa do arquivo-fonte

| Bloco | Linhas | Exporta / anexa | Local planejado |
|---|---|---|---|
| CSS | L9–L76 | — | `src/styles/*.css` |
| Esqueleto HTML | L78–L85 | IDs do DOM | `index.html`, `src/html/*.html` |
| Núcleo (UMD) | L86–L924 | `window.Delta = { BIO, K, KN, FAC, CATS, SIZES, CLSN, Game, Vector, Util, Draft, Building, NeighborCity, DSA, hash2, clamp, fbm }` (L923) | `src/core/**` |
| Biblioteca de construções | L925–L1422 | `Delta.buildings` (L929) | `src/render/buildings/**` |
| Renderizador | L1423–L1997 | `Delta.render` (L1426) — função `render(g, fb, W, H, view)` (L1520) | `src/render/**` |
| Runtime / Script / Plugins | L1998–L2059 | `Delta.Debug`, `Delta.Runtime`, `Delta.Script`, `Delta.Plugins`, `Delta.run` | `src/runtime/**` |
| Interface e laço | L2060–L2311 | nenhum export; IIFE que liga tudo | `src/ui/**`, `src/persistence/storage.js`, `src/main.js` |

Variáveis anexadas dinamicamente ao namespace `Delta` (não exportadas na L923):

| Chave | Criada em | Conteúdo |
|---|---|---|
| `Delta.game` | L2038 (`bootCity`), L2289 (`loop`) | instância ativa de `Game` |
| `Delta._chunks` | L1702 | cache de chunks de terreno `{ m: Map, bytes, t, baked }` |
| `Delta._spr` | L1757 | cache de sprites de prédios `{ m: Map, bytes, t, baked }` |
| `Delta._ttex` | L1480 | textura procedural de terreno `{ seed, t }` |
| `Delta._emb`, `Delta._emb8` | L1539 | camada emissiva (`Uint32Array` W×H e sua visão `Uint8ClampedArray`) |
| `Delta._lut` | L1893 | tabela de escurecimento noturno (`Uint32Array(768)`: 3 canais × 256) |

---

## 4. Sistemas de coordenadas, índices e unidades

### 4.1 Grade de tiles
- `N` = lado do mapa em tiles. Valores permitidos pela UI: `32`, `48`, `64`, `96` (`SIZES`, L102; `NGO`, L2253). Padrão: `48` (L227).
- `n = N * N` = total de tiles.
- **Índice linear de tile:** `i = y * N + x`. Inversa: `x = i % N`, `y = (i / N) | 0`.
- **Validade:** `g.ok(x, y)` ⇔ `x >= 0 && y >= 0 && x < N && y < N` (L252).
- **Vizinhança D4** (ordem fixa, relevante para determinismo): `D4 = [[1,0],[-1,0],[0,1],[0,-1]]` (L222).
- **Vizinhança 3×3** (8 vizinhos + o próprio tile): usada em `net` (L583), `near3` (L587) e no valor do solo (L644).

### 4.2 Grade de cantos (vértices)
- Dimensão `(N+1) × (N+1)`; `N1 = N + 1`; `cn = N1 * N1`.
- **Índice de canto:** `ci = cy * N1 + cx`, com `cx, cy ∈ [0, N]`.
- **Cantos do tile (x, y)** — ordem fixa `[h0, h1, h2, h3]` (L263–L265):

| Nome | Canto | Índice | Posição na tela (isométrica) |
|---|---|---|---|
| `h0` | `(x, y)` | `i0 = y*N1 + x` | vértice **superior** |
| `h1` | `(x+1, y)` | `i0 + 1` | vértice **direito** |
| `h2` | `(x+1, y+1)` | `i0 + N1 + 1` | vértice **inferior** |
| `h3` | `(x, y+1)` | `i0 + N1` | vértice **esquerdo** |

### 4.3 Espaço de câmera e projeção isométrica
- **Coordenadas de câmera:** `u = x − y`, `v = x + y`.
- **Estado da câmera (UI, L2066):** `u0` (inicial `0`), `v0` (inicial `0`, ajustado para `g.N` em `newGame`/`load`, L2072–L2073), `hwF` (zoom pedido, inicial `28`).
- **Limites (L2210):** `u0 ∈ [−N, N]`, `v0 ∈ [0, 2N]`. **Zoom (L2224, L2234, L2243):** `hwF ∈ [8, 64]`.
- **Quantização do zoom (L1522):** o renderizador escolhe `hw` como o valor de `ZL = [8,10,12,14,16,18,20,22,24,26,28,30,32,36,40,44,48,52,56,60,64]` mais próximo de `hwF`. Empate: vence o primeiro encontrado (comparação estrita `<`).
- **Métricas derivadas (L1522):** `hh = hw / 2`; `U = hw / 16` (pixels por unidade de altura `z` nos desenhos de prédios); `elevPx = Math.round(hw * 0.24)` (pixels por nível de `cornerH`).
- **Origem da tela (L1525):** `ox = Math.round(W/2 − u0*hw)`, `oy = Math.round(H/2 − v0*hh)`. O renderizador grava `g.view = { ox, oy, hw, hh }` a cada desenho.
- **Projeção de canto → tela (L1532–L1535):**
  `T(x, y) = [ ox + (x − y)*hw , oy + (x + y)*hh − cornerH[round(y)*N1 + round(x)] * elevPx ]`, com `round` limitado a `[0, N]`.
- **Inversa tela → tile:** `g.screenToTile(sx, sy)` (L910–L921), com 2 iterações de refinamento por altura. Detalhes no `02`.

### 4.4 Altimetria
| Campo | Tipo | Domínio | Significado |
|---|---|---|---|
| `elevF[ci]` | `Float32Array(cn)` | `[0, 100]` | elevação contínua bruta do gerador (L351) |
| `cornerH[ci]` | `Uint8Array(cn)` | inteiro `[0, 9]` | nível discreto: `elevF < 34 → 0`, senão `min(9, 1 + floor((elevF − 34) / 7.5))` (L352) |
| `elev[i]` | `Float32Array(n)` | `[0, 9]` | média dos 4 cantos do tile (L290) |
| `slopeMask[i]` | `Uint8Array(n)` | bits 0–3 | bit `b` = 1 se o canto `h_b` está acima do mínimo do tile (L288) |
| | | bits 4–7 | `min(15, max − min)` dos 4 cantos (L289) |
| `getTerrainHeight(x,y)` | método | `[0, 9]` | `(h0+h1+h2+h3) * 0.25`; fora do mapa = `0` (L267–L271) |

### 4.5 Tempo
| Grandeza | Valor | Fonte |
|---|---|---|
| Duração de 1 dia de jogo | `DAY_MS = 5000` ms de tempo simulado | L134 |
| Tempo simulado por quadro | `e = dt * SPEEDS[g.speed]`, com `dt = min(100, t − last)` ms reais | L681, L2289 |
| Multiplicadores | `SPEEDS = [0, 1, 2, 4, 8]` (índice 0 = pausado) | L134 |
| Mês | 30 dias (`day > 30` → `day = 1`) | L687 |
| Ano | 12 meses | L687 |
| Data inicial | `01/01/2026` | L229 |
| Hora do dia `tod` | `[0, 1)`, inicial `0.32` (07:40) | L229 |
| Avanço de `tod` | `+dt / 120000` por quadro, **independe do multiplicador**; só avança se `SPEEDS[speed] > 0` e `!over` | L679–L680 |
| Ciclo dia/noite completo | 120.000 ms reais | L680 |
| Relógio exibido | `minutos = floor(tod * 1440)` → `HH:MM` | L249 |
| Contador de animação `anim` | `+dt / 250` por quadro (avança mesmo pausado) | L677 |

### 4.6 Moeda, impostos e percentuais
- `funds`: dinheiro da cidade em `$`, inteiro na prática; inicial `28000` (L229). Falência: `funds < −5000` no fechamento do mês (L715).
- `tax = { r, c, i }`: alíquotas em **% (pontos inteiros)**, iniciais `10` (L230).
- `interest`: taxa de juros **anual em %**, inicial `8` (L230). Juros mensais = `funds * interest / 1200` (L707). Console limita a `[1, 25]` (L2055).
- `inflation`: % anual, inicial `4`, limitada a `[0, 40]` (L706).
- Indicadores `[0, 100]`: `happy`, `apP`, `apR`, `hap[i]`, `land[i]`, coberturas `c*`, `poll[i]`, `moisture[i]`.
- `demand.r/c/i`: `[−1, 1]` (L663–L665).

---

## 5. Fontes de aleatoriedade e determinismo

| Fonte | Onde | Determinística? | Uso |
|---|---|---|---|
| `hash2(x, y, s)` | L136 | **Sim** (função pura) | ruído, variantes visuais `vr`, distribuição de energia/água sob escassez, janelas acesas |
| `g.rand()` | L247 | Sim **dada a sequência de chamadas** | geração de rio/lago, crescimento, eventos, viaturas, carros |
| Semente padrão `Date.now() & 0xffffff` | L227 | **Não** | só quando `o.seed` não é informado (sempre no fluxo da UI) |
| `Math.random()` / `crypto.randomUUID()` | L2023 | Não | apenas `Runtime.getUuid()` |
| `performance.now()` | L2022, L2066, L2153, L2289 | Não | relógio real, medição de performance, limitação do minimapa |

**Fatos críticos:**
1. `hash2` retorna valores em `[0, 99.9]` com passo `0.1`: `((h ^ (h >>> 16)) >>> 0) % 1000 / 10`.
2. `g.rand()` é um gerador do tipo *mulberry32* com estado inteiro `g.rs` (inicial = `seed`). Retorna `[0, 1)`. `rs` é salvo e restaurado (L888, L897).
3. **A simulação não é reprodutível entre execuções** mesmo com a mesma semente: `moveVehicles` → `nextNode` (carros) e `spawnCars` consomem `g.rand()` **a cada quadro** (L840, L879–L882). Como o número de quadros depende da taxa de atualização do dispositivo, a sequência de `rand()` vista por `dayTick` varia.
4. A geração de terreno **é** reprodutível para o mesmo `(seed, N, type)`: só usa `fbm`/`ridgedFbm`/`hash2` e as primeiras chamadas de `rand()` (L311–L312).

---

## 6. Glossário

### 6.1 Entidades do mundo

| Termo | Definição exata |
|---|---|
| **Tile** | Célula `(x, y)` da grade; todos os arrays por tile têm comprimento `n`. |
| **Canto** | Vértice da grade `(N+1)²`; guarda `cornerH` e `elevF`. |
| **Bioma (`bio`)** | `BIO = { WATER: 0, PLAIN: 1, FOREST: 2, HILL: 3 }` (L92). Água força os 4 cantos a `0` (L365). |
| **Kind (`kind`)** | Tipo do conteúdo do tile, `K` (L93–L96): `NONE 0, ROAD 1, RES 2, COM 3, IND 4, PARK 5, POLICE 6, FIRE 7, HOSP 8, SCHOOL 9, COAL 10, SOLAR 11, WTOWER 12, SKY_RES 13, SKY_COM 14, MEGA 15, LANDMARK 16`. |
| **KN** | Nomes exibidos por kind, mesmo índice de `K` (L97–L101). |
| **FAC** | Tabela de parâmetros por kind (L103–L109). Campos: `r` raio de cobertura (tiles), `up` manutenção mensal ($), `sz` lado da pegada, `pow` MW gerados, `wat` água fornecida, `pop` moradores, `jobs` empregos, `pw` demanda de energia, `wt` demanda de água. Kinds 0–4 **não têm** entrada em `FAC`. |
| **Zona** | `RES`, `COM` ou `IND` (`isZone`, L569). Começa vazia (`built = 0`) e cresce sozinha. |
| **Sky / multi-tile** | `SKY_RES`, `SKY_COM`, `MEGA`, `LANDMARK` (`isSky`, L590). Pegada `2×2` (`MEGA` = `3×3`). |
| **Serviço** | `POLICE`, `FIRE`, `HOSP`, `SCHOOL` (cobertura em raio; exigem energia para cobrir). |
| **Utilidade** | `COAL`, `SOLAR` (energia) e `WTOWER` (água). |
| **Pegada (footprint)** | Quadrado `sz × sz` ocupado por uma construção, com canto superior-esquerdo `(x0, y0)`. |
| **Pivô** | Tile `(x0, y0)` da pegada; dono dos dados da construção. `pivot[i]` (`Int32Array`) = índice do pivô, ou `−1` se o tile é seu próprio dono/vazio/rua. `pivotOf(i)` devolve `pivot[i]` se `>= 0`, senão `i` (L253). |
| **Origem** | `isOrigin(i)` ⇔ `pivot[i] < 0 || pivot[i] === i` (L254). Laços da simulação só processam origens. |
| **bSize** | `bSize[pivô] = sz`; demais tiles da pegada = `0` (L388). Ruas recebem `1` no `starter` (L411). |
| **Nível (`lvl`)** | `0` = zona vazia; `1..3` = densidade. Serviços colocados pelo jogador: `1`. `placeFootprint` padrão: `3`. |
| **Classe (`cls`)** | `0` Pobre, `1` Média, `2` Elite (`CLSN`, L133). `IND` é sempre `0`; Sky é sempre `2` (L649–L650). |
| **Variante (`vr`)** | Byte `0..255` que escolhe a variação visual do prédio. |
| **built** | `1` = existe estrutura no tile; `0` = vazio ou zona sem prédio. |
| **Obra (`cons`)** | `Map<pivô, { p, from, dur }>`: `p` progresso `[0,1)`, `from` nível anterior (`0` = construção nova), `dur` duração em dias. Avança `p += e / (DAY_MS * dur)` (L682). |
| **Obra nova** | `newCons(i)` ⇔ existe `cons` no pivô com `from === 0` (L567). Prédio em obra nova não gera população/empregos. |
| **Abandonado (`ab`)** | `1` após 4 dias seguidos sem rua/energia/água (`nd >= 4`, L738). |
| **nd** | Contador de dias sem necessidades atendidas. |
| **roadAdj** | `1` se algum vizinho D4 é `ROAD`; em pegadas multi-tile, propagado para todos os tiles se qualquer borda tocar rua (L597–L611). |
| **pw / pipe** | Flags de fio elétrico / cano d'água colocados no tile (ferramentas de linha). |
| **pwOn / wtOn** | `1` se o tile recebe energia / água no último `recalc` (L626–L629). Usinas têm `pwOn = 1` sempre. |
| **Coberturas** | `cPol` polícia, `cFir` bombeiros, `cHea` saúde, `cEdu` educação, `cPar` parques/lazer; `[0, 100]`, recalculadas por `spread` (L570–L577). |
| **poll** | Poluição `[0, 100]`. |
| **land** | Valor do solo `[5, 100]` (L646); água = `0`. |
| **hap** | Felicidade do prédio `[0, 100]` (L653–L655). |
| **cr** | Resíduo de crime `[0, 40]`: `+12` quando um criminoso escapa (L805); `−1` por dia com probabilidade `0.1` (L690). |
| **riot / riotT** | `riot = 1`: protesto (RES) ou greve (IND). `riotT`: contador de duração enquanto ativo (máx. `250`) ou de carência após terminar (L749–L766). |
| **fire** | Intensidade `0..255`. Ignição `18` (propagação: `15`). `≥ 45` propaga; `≥ 100` destrói (L770–L791). |
| **moisture** | Umidade `[0, 100]` gerada no terreno (L360–L361). |
| **bText** | `Map<pivô, string>`: letreiro do prédio (ex.: `'MEGA CENTER DELTA'`, L420). |

### 6.2 Listas e estruturas auxiliares (reconstruídas a cada `recalc`)

| Termo | Definição |
|---|---|
| `zl` | Origens de zona (construídas ou não) (L601). |
| `bl` | Origens construídas de zona **ou** Sky (L601–L602). |
| `st` | Origens de `POLICE` e `FIRE` (estações) (L604). |
| `veh` | Veículos ativos: viaturas `'police'`, caminhões `'fire'` e carros `'car'` (L830, L882). |
| `crimes` | `{ i, age, done }` ativos (L799). |
| `assign` | `Set` de chaves de atendimento: `'p' + i` (polícia) e `'f' + i` (fogo) (L813). |
| `noted` | `Set` de chaves já avisadas como "sem viatura alcançável" (L827). |
| `busy[s]` | Veículos fora da estação `s`; despacho recusado se `>= 2` (L823). |
| `fx` | Efeitos `{ x, y, t, kind }`, `kind ∈ { 'dust', 'done' }`, máx. 60 (L568); vida `1.6 s` (`done`) ou `1.2 s` (L678). |
| `logs` | `{ t: dateStr, m, lvl ∈ 'info'|'good'|'bad' }`, máx. 40, mais recente primeiro (L251). |
| `hist` | Séries mensais `pop`, `funds`, `happy`, `inf`, máx. 60 pontos (L710). |
| `preview` | `{ tiles: [{ i, c }], cost, ok }` da ferramenta atual (L492). `c = −1` = tile inválido. |
| `sel` | Seleção em andamento `{ x0, y0, x1, y1 }` ou `null`. |

### 6.3 Economia e opinião

| Termo | Definição |
|---|---|
| `demand.r/c/i` | Demanda RCI suavizada: `demand += (alvo − demand) * 0.4` a cada `recalc` (L667). |
| `apP` | Aprovação dos **Pobres** (L670). |
| `apR` | Aprovação da **Elite/Ricos** (L671). A UI exibe a Média como `round((apP + apR) / 2)` (L2271). |
| `unemp` | Desemprego `[0, 1]` = `(wk − jobs) / wk`, com `wk = pop * 0.5` (L661, L668). |
| `crimeIdx` | Média de `riskAt` em 40 amostras de `bl` (L801). |
| `riskAt(i)` | Risco social `= clamp(30 + unemp*60 + (50 − land[i])*0.6 − cPol[i]*0.55, 0, 100)` (L673). |
| `last` | Balanço do último mês `{ tr, tc, ti, up, rent, debt }` (L709). |
| `flight` | Lotes de Elite abandonados no mês por imposto residencial `> 18` (L736, L713). |
| `over` | `true` após falência; congela a simulação (L679, L715). |

### 6.4 Renderização

| Termo | Definição |
|---|---|
| **Framebuffer (`fb`)** | `Uint8ClampedArray` RGBA de `W × H` (o `ImageData.data` da UI), com visão `fb._u32` (`Uint32Array`) (L1530). |
| **W, H** | Resolução interna: `s = max(1, ceil(largura / 640))`; `W = max(64, floor(largura / s))`, `H = max(64, floor(altura / s))` (L2076–L2077). |
| **hw / hh** | Meia-largura / meia-altura do losango de um tile, em px. |
| **Chunk** | Bloco de `8 × 8` tiles de terreno pré-renderizado e cacheado (`CS = 8`, L1702). |
| **Sprite** | Prédio pré-desenhado (com sombra) e reutilizado por blit (L1756–L1837). |
| **Camada emissiva** | Buffer separado de luzes noturnas, composto no passe 4 com oclusão por profundidade (L1537–L1540). |
| **Kit (`X`)** | Contexto de desenho passado aos construtores de prédio: `hw, hh, sz, A, night, cx, cy, sunX, sunY, shA, poly, ln, pt, emP, emQ, setClip` (L1541–L1545). |
| **Heatmap** | Sobreposição selecionada por `HEATS[heatI]`: `null`, `elev`, `cls`, `land`, `poll`, `crime`, `risk`, `cPol` (L2136). |
| `night` / `day` | `day0 = clamp(0.5 + 0.8*cos((tod − 0.5)*6.2832), 0, 1)`; `night = 1 − day0` (ou quantizado por `view.qn`); `day = 1 − night` (L1526–L1527). |
| `hi` / `mid` | Níveis de detalhe: `hi ⇔ hw >= 20`; `mid ⇔ hw >= 12` (L1527). |

### 6.5 Runtime e extensões

| Termo | Definição |
|---|---|
| **Draft** | Descritor de construção registrado em `DRAFTS` com id `'$b_' + k` (L198). Campos padrão: `w = h = sz`, `needsRoad` (falso para `PARK`, `COAL`, `SOLAR`, `WTOWER`). |
| **Building** | Wrapper somente-leitura sobre um pivô (`new Building(g, pivô)`, L200–L215). Criado só para `kind >= 2` (L255). |
| **Script / fase** | Máquina de estados do ciclo de vida (`Delta.Script.phase`), L2026–L2049. Detalhes no `01`/`07`. |
| **Plugin** | Objeto registrado em `Delta.Plugins.add`; desativado após 5 erros (`guard`, L2025). |
| **Runtime.storage** | Armazenamento persistente por plugin, salvo em `localStorage['delta_city_v4_st']`. |

---

## 7. Peculiaridades oficiais (comportamento "como está")

| # | Fato | Linhas |
|---|---|---|
| P1 | A velocidade `8x` (`SPEEDS[4]`) existe, mas a UI só oferece índices `0..3` e o comando `speed` limita a `[0, 3]`. Só é alcançável atribuindo `g.speed = 4` diretamente. | L134, L2127, L2053 |
| P2 | `screenToTile` usa `elevPx = hw * 0.24` **sem arredondar**; o renderizador usa `Math.round(hw * 0.24)`. Em encostas altas a seleção pode diferir da imagem em até 1 tile. | L911, L1522 |
| P3 | O save **não** inclui `cons`, `bText`, `veh`, `crimes`, `logs`, `name`, `elevF`, `busy`, `assign`, `noted`, `fx`, `cat`, `item`. Ao carregar, obras em andamento aparecem prontas, o letreiro `MEGA CENTER DELTA` some e `elevF` vem do gerador (sem os aplainamentos). | L887–L908 |
| P4 | A chave de save chama-se `delta_city_v4`, mas o conteúdo está no formato `v: 5`. | L2064, L888 |
| P5 | Em `fromJSON`, o construtor regenera o terreno (consumindo `rand()`), e só depois `rs` é sobrescrito pelo valor salvo. | L896–L897 |
| P6 | `'PIZZA'.slice(0, 0) || 'ARTE'` resulta em `'ARTE'`. | L948 |
| P7 | Sem fonte de energia suficiente, quem recebe energia não é sorteado: é decidido por `hash2(i, 1, 5) < rP * 100` (água: `hash2(i, 2, 9) < rW * 100`). Os mesmos prédios ficam sempre sem energia. | L627–L628 |
| P8 | `tod` avança com o tempo real (`dt`), não com o multiplicador de velocidade. | L680 |
| P9 | Existem duas flags distintas chamadas `dirty`: `g.dirty` (simulação: forçar `recalc` no próximo dia, L688) e `dirty` local da UI (forçar redesenho no próximo quadro, L2293). | L232, L2066 |
| P10 | O arquivo é UTF-8. O PowerShell 5 (`Get-Content` sem `-Encoding UTF8`) exibe acentos corrompidos (`MǸdia`); isso é artefato do terminal, não do arquivo. | — |

---

## 8. Dicionário de abreviações do código

| Abreviação | Significado | Contexto |
|---|---|---|
| `D` | namespace `window.Delta` | todos os blocos |
| `g` | instância de `Game` | UI, render, runtime |
| `N`, `N1`, `n`, `cn` | lado; lado+1; tiles; cantos | núcleo |
| `i`, `j` | índices lineares de tile | todo lugar |
| `k`, `kd` | kind do tile; array `kind` | núcleo |
| `b`, `bb` | bioma | núcleo |
| `x0, y0`, `piv`, `sz` | canto da pegada; pivô; lado da pegada | multi-tile |
| `lv` | nível | núcleo, prédios |
| `it` | item de ferramenta (`CATS[cat].items[item]`) | ferramentas |
| `s` | seleção (`sel`) **ou** semente (`seed`) **ou** estação (`dispatch`), por contexto | ferramentas, ruído, viaturas |
| `pv` | `preview` | ferramentas |
| `dm` | demanda da zona do tile | `growth` |
| `T`, `T2` | `this.tax` em `recalc`/`monthTick`; **em `render`, `T` é a projeção** de canto → tela | núcleo / render |
| `pc`, `pcP`, `pcW` | mapa de alcance BFS (rede elétrica / hídrica) | `recalc` |
| `pS, pD, wS, wD` | oferta e demanda de energia / água | `recalc` |
| `rP, rW` | razão de atendimento `min(1, oferta/demanda)` | `recalc` |
| `wk` | força de trabalho `pop * 0.5` | `recalc` |
| `e` | tempo simulado do quadro (`dt * multiplicador`) | `update` |
| `X` | kit de desenho | render, prédios |
| `A` | quadro de animação inteiro `floor(g.anim)` | render |
| `U` | px por unidade de altura (`hw / 16`) | prédios |
| `ox, oy` | origem da projeção na tela | render |
| `u0, v0`, `hwF` | centro da câmera; zoom pedido | UI |
| `fb`, `fb32`, `W`, `H` | framebuffer; visão 32 bits; dimensões | render |
| `em`, `emb32`, `emb8` | lista de brilhos; camada emissiva | render |
| `R` | função `Delta.render` | UI (L2063) |
| `cv`, `ctx`, `img` | canvas principal, contexto 2D, `ImageData` | UI |
| `$`, `el`, `cl` | `getElementById`; fábrica de elemento; limpeza de emojis | UI |
