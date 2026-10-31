# 05 — Ferramentas, Seleção, Custos, Construção e Inspeção (`Delta.CATS` e `Game`)

> **Propósito:** Especificar com precisão absoluta o catálogo de ferramentas (`CATS`, `L110–L132`), a máquina de seleção (`point`, `line`, `area`, `inspect`), o cálculo de custo por tile e por pegada (`cost1`, `buildPreview`), as regras de construção e demolição (`selEnd`, `place`, `placeFootprint`, `clearFootprint`), a geração da cidade inicial (`starter`, `L405–L446`) e a formatação exata do inspetor de lotes (`inspect`, `L534–L552`).

---

## 1. Catálogo Completo de Categorias e Ferramentas (`CATS`, `L110–L132`)

A estrutura `CATS` é um array de **9 categorias** (`ci = 0..8`), cada uma contendo um array `items` (`ii = 0..n-1`). A ferramenta ativa é sempre obtida por `g.tool() = CATS[g.cat].items[g.item]` (`L449`).

| Índice `[ci][ii]` | `cat.id` (`cat.name`) | `it.id` | `it.name` | `it.mode` | `it.cost` ($) | `it.k` (`K`) | `it.sz` | Flags Extras |
|---|---|---|---|---|---|---|---|---|
| `[0][0]` | `'info'` (`Info`) | `'inspect'` | `'Inspecionar'` | `'inspect'` | `0` | — | — | — |
| `[1][0]` | `'road'` (`Vias`) | `'road'` | `'Rua'` | `'line'` | `10` | `K.ROAD` (`1`) | — | — |
| `[1][1]` | `'road'` (`Vias`) | `'power'` | `'Fio elétrico'` | `'line'` | `5` | — | — | `flag: 'pw'` |
| `[1][2]` | `'road'` (`Vias`) | `'pipe'` | `'Cano d’água'` | `'line'` | `5` | — | — | `flag: 'pipe'` |
| `[2][0]` | `'zone'` (`Zonas`) | `'res'` | `'Residencial'` | `'area'` | `20` | `K.RES` (`2`) | — | — |
| `[2][1]` | `'zone'` (`Zonas`) | `'com'` | `'Comercial'` | `'area'` | `25` | `K.COM` (`3`) | — | — |
| `[2][2]` | `'zone'` (`Zonas`) | `'ind'` | `'Industrial'` | `'area'` | `25` | `K.IND` (`4`) | — | — |
| `[3][0]` | `'sky'` (`Marcos`) | `'sky_res'` | `'Condomínio 2x2'` | `'point'` | `2400` | `K.SKY_RES` (`13`)| `2` | — |
| `[3][1]` | `'sky'` (`Marcos`) | `'sky_com'` | `'Torre Corp 2x2'` | `'point'` | `3200` | `K.SKY_COM` (`14`)| `2` | — |
| `[3][2]` | `'sky'` (`Marcos`) | `'landmark'`| `'Panorama 2x2'` | `'point'` | `3800` | `K.LANDMARK`(`16`)| `2` | — |
| `[3][3]` | `'sky'` (`Marcos`) | `'mega'` | `'Mega Center 3x3'`| `'point'` | `6800` | `K.MEGA` (`15`) | `3` | — |
| `[4][0]` | `'power'` (`Energia`) | `'coal'` | `'Usina a carvão'` | `'point'` | `3000` | `K.COAL` (`10`) | — | — |
| `[4][1]` | `'power'` (`Energia`) | `'solar'` | `'Usina solar'` | `'point'` | `1500` | `K.SOLAR` (`11`) | — | — |
| `[5][0]` | `'water'` (`Água`) | `'wtower'` | `'Torre de água'` | `'point'` | `1200` | `K.WTOWER` (`12`) | — | — |
| `[6][0]` | `'serv'` (`Serviços`) | `'police'` | `'Delegacia'` | `'point'` | `900` | `K.POLICE` (`6`) | — | — |
| `[6][1]` | `'serv'` (`Serviços`) | `'fire'` | `'Bombeiros'` | `'point'` | `900` | `K.FIRE` (`7`) | — | — |
| `[6][2]` | `'serv'` (`Serviços`) | `'hosp'` | `'Hospital'` | `'point'` | `1800` | `K.HOSP` (`8`) | — | — |
| `[6][3]` | `'serv'` (`Serviços`) | `'school'` | `'Escola'` | `'point'` | `1000` | `K.SCHOOL` (`9`) | — | — |
| `[7][0]` | `'rec'` (`Lazer`) | `'park'` | `'Parque'` | `'point'` | `200` | `K.PARK` (`5`) | — | — |
| `[7][1]` | `'rec'` (`Lazer`) | `'tree'` | `'Plantar árvores'`| `'area'` | `4` | — | — | `tree: 1` |
| `[8][0]` | `'bull'` (`Demolir`) | `'bulldoze'`| `'Demolir'` | `'area'` | `3` | — | — | `bull: 1` |

### 1.1 Seleção de Ferramenta (`setTool(cat, it)`, `L450`)
1. Satura `this.cat = clamp(cat, 0, CATS.length - 1)` e `this.item = clamp(it || 0, 0, CATS[this.cat].items.length - 1)`.
2. Cancela qualquer seleção em andamento (`this.sel = null`).
3. Formata a mensagem no toast (`this.say(...)`):
   $$\text{msg} = t.\text{name} + \big(t.\text{cost} ? \text{' — \$'} + t.\text{cost} + (t.\text{mode} \in \{\text{'area'}, \text{'line'}\} ? \text{'/tile'} : \text{''}) : \text{''}\big)$$
4. Invoca `this.buildPreview()`.

---

## 2. Geometria de Seleção (`tilesOf(s, it)`, `L452–L469`)

Dada uma caixa de seleção `s = { x0, y0, x1, y1 }` e o item `it` (com $\text{sz} = \text{it.sz} \parallel 1$):

1. **Modo `'point'` (`L454–L460`):**
   - Usa apenas o ponto final $(s.x_1, s.y_1)$ como canto superior-esquerdo da pegada $\text{sz} \times \text{sz}$:
   - Para $\text{dy} = 0 \dots \text{sz} - 1$ e $\text{dx} = 0 \dots \text{sz} - 1$:
     - Se `this.ok(s.x1 + dx, s.y1 + dy)`, adiciona $(s.y_1 + \text{dy})N + (s.x_1 + \text{dx})$ ao array `out`.
   - *(Se parte da pegada cair fora do mapa, `out.length` será menor que $\text{sz}^2$, o que fará `allFit` ser `false` em `buildPreview`).*

2. **Modo `'line'` (`L461–L466`):**
   - Calcula $\text{dx} = s.x_1 - s.x_0$ e $\text{dy} = s.y_1 - s.y_0$.
   - **Se $|\text{dx}| \ge |\text{dy}|$ (linha horizontal fixa em $y = s.y_0$):**
     - Para $x = \min(s.x_0, s.x_1) \dots \max(s.x_0, s.x_1)$, adiciona $s.y_0 \cdot N + x$.
   - **Se $|\text{dx}| < |\text{dy}|$ (linha vertical fixa em $x = s.x_0$):**
     - Para $y = \min(s.y_0, s.y_1) \dots \max(s.y_0, s.y_1)$, adiciona $y \cdot N + s.x_0$.

3. **Modo `'area'` (`L467–L468`):**
   - Retângulo fechado $[\min(s.x_0, s.x_1), \max(s.x_0, s.x_1)] \times [\min(s.y_0, s.y_1), \max(s.y_0, s.y_1)]$ em ordem row-major ($y$ externo, $x$ interno).

---

## 3. Cálculo Exato de Custo e Validação (`cost1` e `buildPreview`, `L470–L493`)

### 3.1 Custo Individual por Tile (`cost1(i, it)`, `L470–L479`)
Seja $k = \text{this.kind}[i]$, $b = \text{this.bio}[i]$, $(x, y) = (i \bmod N, \lfloor i / N \rfloor)$ e a sobretaxa de declive:
$$\text{slopeCost} = \text{this.isSlope}(x, y) ? 6 : 0$$
A função avalia as 7 regras abaixo **em ordem estrita** (retornando `-1` quando a operação é inválida no tile $i$):

| Ordem | Condição | Retorno (`cost1`) | Explicação |
|---|---|---|---|
| **1** | `it.bull` (Demolir) | $(k \lor \text{pw}[i] \lor \text{pipe}[i] \lor b === \text{BIO.FOREST}) ? 3 : -1$ | Só cobra `$3` se houver construção/zona, fio, cano ou floresta no tile; terreno limpo retorna `-1`. |
| **2** | `it.tree` (Plantar árvores) | $(b === \text{BIO.PLAIN} \land !k) ? 4 : -1$ | Só permite plantar em planície vazia sem zona/construção (`$4`). |
| **3** | `it.flag` (`'pw'` ou `'pipe'`) | $(b \ne \text{BIO.WATER} \land !\text{this}[\text{it.flag}][i]) ? 5 : -1$ | Proíbe na água e onde já existe a mesma utilidade (`$5`). *(Pode coexistir com prédios e ruas).* |
| **4** | `k !== 0` | `-1` | Qualquer ferramenta abaixo exige tile sem construção/zona (`kind[i] === 0`). |
| **5** | `it.id === 'road'` | Se $b === \text{BIO.WATER}$: $10 \times 4 = \mathbf{40}$ (ponte, sem `slopeCost`)<br>Se $b === \text{BIO.HILL}$: $10 \times 2 + \text{slopeCost} = \mathbf{20 + \text{slopeCost}}$<br>Senão: $10 + \text{slopeCost} = \mathbf{10 + \text{slopeCost}}$ | Ruas podem atravessar água (pontes a `$40`), colinas (`$20` ou `$26`) e planícies/florestas (`$10` ou `$16`). |
| **6** | `b === BIO.WATER` | `-1` | Nenhuma zona, serviço, usina ou marco pode ser construído na água. |
| **7** | Caso geral (Zonas, Serviços, Usinas, Marcos) | $\big(\text{it.sz} > 1 ? \text{Math.round}(\text{it.cost} / \text{sz}^2) : \text{it.cost}\big) + (b === \text{BIO.FOREST} ? 5 : 0) + \text{slopeCost}$ | Adiciona `+$5` de desmatamento se for floresta e `+$6` de terraplenagem se for encosta. |

### 3.2 Agregação da Prévia (`buildPreview()`, `L480–L493`)
1. Se `it.mode === 'inspect'`, define `this.preview = null` e retorna.
2. Define a seleção base $s = \text{this.sel} \parallel \{ x_0: \text{cx}, y_0: \text{cy}, x_1: \text{cx}, y_1: \text{cy} \}$.
3. Mapeia `raw = this.tilesOf(s, it)` para `tiles = raw.map(i => ({ i, c: this.cost1(i, it) }))`.
4. Verifica cabimento de ferramentas pontuais:
   $$\text{allFit} = (\text{it.mode} === \text{'point'}) ? \big(\text{raw.length} === \text{sz}^2 \land \forall t \in \text{tiles},\, t.c \ge 0\big) : \text{true}$$
5. **Cálculo do Custo Total (`cost`, `L485–L491`):**
   - **Caso Especial (`it.mode === 'point' && sz > 1`, Marcos $2\times2$ e $3\times3$):**
     $$\text{cost} = \text{allFit} ? \text{it.cost} : 0$$
     Se `!allFit`, força `t.c = -1` em todos os tiles da prévia (para que toda a pegada fique vermelha na tela).
     *(Nota importante: para Marcos multi-tile, o custo final cobrado é exatamente `it.cost` tabelado — `$2400`, `$3200`, `$3800` ou `$6800` — ignorando as sobretaxas individuais de floresta/declive que serviram apenas para validar `t.c >= 0` em `cost1`).*
   - **Demais Ferramentas (`sz === 1`, `line` ou `area`):**
     $$\text{cost} = \sum_{t \in \text{tiles},\, t.c \ge 0} t.c$$
6. Grava `this.preview = { tiles, cost, ok: allFit && cost <= this.funds && cost > 0 }`.

---

## 4. Efetivação de Construção e Demolição (`selEnd`, `place`, `placeFootprint`, `clearFootprint`)

### 4.1 Finalização de Seleção (`selEnd()`, `L501–L516`)
1. Se `!this.sel`: se `it.mode === 'point'`, cria seleção unitária em `(cx, cy)`; caso contrário retorna `0`.
2. Atualiza `this.buildPreview()`, captura `pv = this.preview` e `s = this.sel`, e limpa `this.sel = null`.
3. Se `!pv.cost || !pv.ok`:
   - Exibe `'Caixa insuficiente: precisa de $' + pv.cost` (se `pv.cost > this.funds`) ou `'Não dá para construir aqui.'`.
   - Atualiza `this.buildPreview()` e retorna `0`.
4. **Execução:**
   - Se `it.mode === 'point' && (it.sz || 1) > 1`: chama `this.placeFootprint(s.x1, s.y1, it.k, it.sz, false, 3)` e define $n = \text{sz}^2$.
   - Caso contrário: para cada $t \in \text{pv.tiles}$ com $t.c \ge 0$, chama `this.place(t.i, it)` e incrementa $n$.
5. Desconta `this.funds -= pv.cost`, chama `this.recalc()` e exibe `it.name + ': ' + n + ' tile(s) [-$' + pv.cost + ']'`.
6. **Alerta de Delegacia/Bombeiros sem Rua (`L514`):**
   - Se $(it.k === \text{K.POLICE} \lor it.k === \text{K.FIRE}) \land !\text{this.roadAdj}[\text{this.cy} \cdot N + \text{this.cx}]$, registra no log com nível `'bad'`:
     `'⚠️ ' + it.name + ' sem rua encostada: as viaturas não conseguem sair!'`.

### 4.2 Mutação de Tile Único (`place(i, it)`, `L517–L533`)
1. **Demolição (`it.bull`, `L519–L523`):**
   - Se `this.kind[i] || this.built[i]`: emite partícula `this.puff(i, 'dust')` e chama `this.clearFootprint(i)` (que resolve o pivô automaticamente e limpa toda a pegada $1\times1$, $2\times2$ ou $3\times3$ se o jogador demolir qualquer tile de um arranha-céu!).
   - Zera `this.pw[i] = 0; this.pipe[i] = 0`.
   - Se `b === BIO.FOREST`, converte em `BIO.PLAIN`. Retorna.
2. **Plantio de Floresta (`it.tree`, `L524`):** Define `this.bio[i] = BIO.FOREST` e retorna.
3. **Fio ou Cano (`it.flag`, `L525`):** Define `this[it.flag][i] = 1` e retorna.
4. **Construção de Rua, Zona ou Instalação $1\times1$ (`L526–L532`):**
   - Se `b === BIO.FOREST`, desmata para `BIO.PLAIN`.
   - Define `kind[i] = it.k`, `vr[i] = (hash2(x, y, this.seed) * 2.55) | 0`, `nd[i] = 0`, `ab[i] = 0`, `pivot[i] = i`, `bSize[i] = 1`.
   - **Se `it.k === K.ROAD`:** define `built[i] = 1`, `pivot[i] = -1` e retorna **sem nivelar o terreno** (ruas acompanham as encostas 3D).
   - **Demais construções/zonas:** nivela o tile chamando `this.flattenArea(x, y, 1, 1)`.
   - **Se for Zona (`RES`, `COM`, `IND`):** define `built[i] = 0`, `lvl[i] = 0`, `pivot[i] = -1`, `bSize[i] = 0` (lote demarcado aguardando `growth()`).
   - **Se for Instalação/Serviço/Parque:** define `built[i] = 1`, `lvl[i] = 1` e registra obra em `this.cons.set(i, { p: 0, from: 0, dur: it.k === K.PARK ? 1.5 : 3 })`.

### 4.3 Alocação e Limpeza de Pegada Multi-Tile (`placeFootprint` e `clearFootprint`, `L378–L402`)
- **`placeFootprint(x0, y0, k, sz, instant, lvl)`:**
  1. Nivela todos os vértices da pegada via `this.flattenArea(x0, y0, sz, sz)`.
  2. Calcula $\text{piv} = y_0 N + x_0$ e variante $\text{vr} = (\text{hash2}(x_0, y_0, \text{this.seed} + 13k) \cdot 2.55) \mid 0$.
  3. Para cada tile $(x_0 + \text{dx}, y_0 + \text{dy})$ da pegada $\text{sz} \times \text{sz}$:
     - Converte floresta em planície; define `kind[i] = k`, `built[i] = 1`, `lvl[i] = lvl || 3`, `cls[i] = 2`, `vr[i] = vr`, `nd[i] = 0`, `ab[i] = 0`, `pivot[i] = piv`.
     - Define `bSize[i] = (dx === 0 && dy === 0) ? sz : 0`.
  4. Se `!instant`, inicia obra no pivô: `this.cons.set(piv, { p: 0, from: 0, dur: sz === 3 ? 4 : 2.5 })`.
- **`clearFootprint(i)`:**
  1. Resolve $\text{piv} = \text{this.pivotOf}(i)$ e $\text{sz} = \text{this.bSize}[\text{piv}] \parallel 1$.
  2. Remove `this.cons.delete(piv)` e `this.bText.delete(piv)`.
  3. Zera `kind`, `built`, `lvl`, `ab`, `fire`, `bSize` e restaura `pivot[j] = -1` em todos os tiles $\text{sz} \times \text{sz}$ a partir de $(x_0, y_0)$.

---

## 5. Layout Exato da Cidade Inicial (`starter()`, `L405–L446`)

Quando `o.starter !== false` (opção `'Vila pronta'` na UI), `starter()` constrói uma metrópole funcional centrada em $c = N \gg 1$ ($\lfloor N / 2 \rfloor$):
1. **Terraplenagem Central (`L407`):** `this.flattenArea(c - 8, c - 8, 16, 16, 2)` — achata o quadrado $[c-8, c+8]^2$ para `cornerH = 2`.
2. **Grade de 6 Avenidas (`L414–L417`):**
   Para $d \in [-8, +8]$, constrói ruas já equipadas com energia e água (`kind = ROAD, built = 1, pw = 1, pipe = 1`) nas linhas horizontais $y \in \{c-4, c, c+4\}$ e colunas verticais $x \in \{c-4, c, c+4\}$ (exceto sobre água).
3. **Marcos e Arranha-Céus Instantâneos (`L419–L425`):**
   - $(c+1, c+1)$: `K.MEGA` ($3\times3$, nível 3, com letreiro `bText = 'MEGA CENTER DELTA'`).
   - $(c-3, c+1)$ e $(c+1, c-3)$: `K.SKY_COM` ($2\times2$, nível 3).
   - $(c-3, c-3)$ e $(c-6, c+1)$: `K.SKY_RES` ($2\times2$, nível 3).
   - $(c+5, c+1)$: `K.LANDMARK` ($2\times2$, nível 3).
4. **Infraestrutura e Serviços (`L428–L431`, todos com `pw = 1, pipe = 1`):**
   - Energia e Água: `COAL` em $(c-8, c)$, `SOLAR` em $(c-8, c-4)$, `WTOWER` em $(c+8, c)$.
   - Serviços: `POLICE` em $(c-3, c+3)$, `FIRE` em $(c+3, c-3)$, `HOSP` em $(c+5, c-3)$, `SCHOOL` em $(c-6, c-3)$.
   - Lazer: `PARK` em $(c-1, c+3)$ e $(c+3, c-1)$.
5. **Anel de Edifícios RCI $1\times1$ (`L434–L445`):**
   Para $d \in \{5, 6, 7\}$ ($\text{lv}_d = (d === 5 ? 3 : 2)$):
   - $(c-d, c-1)$: `RES` nível $\text{lv}_d$; $(c-d, c-2)$: `RES` nível 2.
   - $(c+d, c-1)$: `COM` nível $\text{lv}_d$; $(c+d, c+3)$: `IND` nível 2.
   - $(c-1, c-d)$: `RES` nível $\text{lv}_d$; $(c+1, c+d)$: `COM` nível 2.
   - $(c-2, c+d)$: `RES` nível 1; $(c+2, c+d)$: `IND` nível 1.

---

## 6. Especificação do Inspetor de Lotes (`inspect(x, y)`, `L534–L552`)

Dado $(x, y)$, resolve `rawI = y * N + x`, o pivô `i = this.pivotOf(rawI)`, `k = this.kind[i]` e `sz = this.bSize[i] || 1`. Retorna `{ title: nm, lines: L }` onde `nm = k ? KN[k] : ['Água', 'Planície', 'Floresta', 'Colinas'][this.bio[rawI]]`:

| Ordem | Condição | String Adicionada ao Array `L` |
|---|---|---|
| **1** | Sempre | `nm + ' (' + x + ',' + y + ') \| Alt ' + this.getTerrainHeight(x, y).toFixed(1) + 'm' + (sz > 1 ? ' [' + sz + 'x' + sz + ']' : '')` |
| **2** | `this.bText.has(i)` | `'🏷️ ' + this.bText.get(i)` |
| **3** | `this.cons.has(i)` | `'🏗️ Em obra: ' + Math.round(this.cons.get(i).p * 100) + '%'` |
| **4a** | Zona ou `SKY_RES`/`SKY_COM`/`MEGA` e `!built[i]` | `'Zona vazia'` |
| **4b** | Zona ou `SKY_RES`/`SKY_COM`/`MEGA` e `built[i]` | `'Nível ' + lvl[i] + (k !== K.IND ? ' [Classe ' + CLSN[cls[i]] + ']' : '') + (ab[i] ? ' ABANDONADO' : '') + ' \| ' + ((k === K.RES \|\| k === K.SKY_RES) ? 'Moradores ' + popAt(i) : 'Empregos ' + jobsAt(i))` |
| **4c** | Zona ou `SKY_RES`/`SKY_COM`/`MEGA` | Verifica `!roadAdj[i]` (`'rua'`), `!pwOn[i]` (`'energia'`), `!wtOn[i]` (`'água'`) $\to$ `'Falta: ...'` ou `'Necessidades OK'` |
| **4d** | Zona ou `SKY_RES`/`SKY_COM`/`MEGA` e `built[i]` | `'Felicidade ' + hap[i] + '%'` e, se `riot[i]`, `k === K.IND ? '⚠️ EM GREVE!' : '⚠️ EM PROTESTO!'` |
| **5a** | Não entrou no bloco 4 e `FAC[k] && FAC[k].r` | `'Raio ' + FAC[k].r + ' tiles' + (k !== K.PARK && !pwOn[i] ? ' \| SEM ENERGIA' : '')` *(cobre `PARK`, `POLICE`, `FIRE`, `HOSP`, `SCHOOL` e `LANDMARK`)* |
| **5b** | Senão, se `FAC[k] && FAC[k].pow` | `'Gera ' + FAC[k].pow + ' MW'` (`COAL`, `SOLAR`) |
| **5c** | Senão, se `FAC[k] && FAC[k].wat` | `'Fornece ' + FAC[k].wat + ' L'` (`WTOWER`) |
| **6** | `this.bio[rawI] !== BIO.WATER` | `'Valor ' + land[i] + ' \| Polui ' + poll[i] + ' \| Pol ' + cPol[i] + ' Bomb ' + cFir[i] + ' Saúde ' + cHea[i] + ' Edu ' + cEdu[i]` |
| **7** | `this.fire[i] > 0` | `'🔥 EM CHAMAS ' + this.fire[i] + '%'` |