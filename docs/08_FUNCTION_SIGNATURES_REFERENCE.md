# 08 — Catálogo Exaustivo de Assinaturas de Funções e Métodos (Delta City)

> **Propósito:** Fornecer um índice de referência rápida, determinístico e sem omissões com **todas as funções, classes e métodos** existentes nos 5 blocos de script de `index.html`, mapeando linha original, módulo alvo em `src/`, assinatura exata com tipos de entrada, tipo de retorno, mutações de estado (efeitos colaterais) e chamadores diretos.

---

## 1. Script 1 — Core Kernel, Matemática, Entidades e Simulação (`L86–L924`)

### 1.1 Funções Matemáticas e Utilitárias (`src/core/math/*`)

| Símbolo | Linha | Módulo Alvo | Assinatura Exata | Retorno | Efeitos Colaterais | Chamadores Principais |
|---|---|---|---|---|---|---|
| `clamp` | `L135` | `math/util.js` | `clamp(v: number, a: number, b: number)` | `number` | Puro | Global (Core, Render, UI) |
| `hash2` | `L136` | `math/util.js` | `hash2(x: int, y: int, s: int)` | `number` (`0.0..99.9`) | Puro | `qnoise`, `placeFootprint`, `starter`, `place`, `recalc`, `wins`, `ground` |
| `qnoise` | `L166` | `math/noise.js` | `qnoise(x: number, y: number, s: int, cell: number)` | `number` (`0.0..99.9`) | Puro | `fbm`, `ridgedFbm` |
| `fbm` | `L172` | `math/noise.js` | `fbm(x: number, y: number, s: int, baseCell: number, octaves?: int)` | `number` (`0.0..99.9`) | Puro | `genTerrain` |
| `ridgedFbm` | `L180` | `math/noise.js` | `ridgedFbm(x: number, y: number, s: int, baseCell: number, octaves?: int)` | `number` (`0..100`) | Puro | `genTerrain` |
| `Vector.constructor` | `L140` | `math/vector.js` | `new Vector(x?: number, y?: number, z?: number)` | `Vector` (frozen) | Puro | `render` (`sunVec`), `ground` (`nVec`) |
| `Vector.prototype.copy` | `L141` | `math/vector.js` | `copy()` | `Vector` | Puro | API externa |
| `Vector.prototype.add` | `L142` | `math/vector.js` | `add(v: Vector)` | `Vector` | Puro | API externa |
| `Vector.prototype.sub` | `L143` | `math/vector.js` | `sub(v: Vector)` | `Vector` | Puro | API externa |
| `Vector.prototype.scale` | `L144` | `math/vector.js` | `scale(s: number)` | `Vector` | Puro | API externa |
| `Vector.prototype.dot` | `L145` | `math/vector.js` | `dot(v: Vector)` | `number` | Puro | `ground` (`nVec.dot(sunVec)`) |
| `Vector.prototype.cross` | `L146` | `math/vector.js` | `cross(v: Vector)` | `Vector` | Puro | `ground` (`L1620`) |
| `Vector.prototype.length` | `L147` | `math/vector.js` | `length()` | `number` | Puro | `Vector.prototype.normalized` |
| `Vector.prototype.normalized` | `L148` | `math/vector.js` | `normalized()` | `Vector` | Puro | `render` (`L1536`), `ground` (`L1620`) |
| `Util.collectFullRectTiles` | `L151` | `math/util.js` | `collectFullRectTiles(x: int, y: int, w: int, h: int)` | `Array<[int, int]>` | Puro | API externa / Plugins |
| `Util.collectRectTiles` | `L152` | `math/util.js` | `collectRectTiles(x: int, y: int, w: int, h: int, noCorners?: boolean)` | `Array<[int, int]>` | Puro | API externa / Plugins |
| `Util.optStorage` | `L160` | `math/util.js` | `optStorage(src: Object, name: string, ctor?: Function)` | `Object` | Muta `src[name]` se ausente | API externa / Plugins |
| `Util.color2hex` | `L161` | `math/util.js` | `color2hex(r: int, g: int, b: int)` | `string` (`'#rrggbb'`) | Puro | API externa / Plugins |
| `Util.hex2color` | `L162` | `math/util.js` | `hex2color(hex: string)` | `[int, int, int]` | Puro | API externa / Plugins |

---

### 1.2 Entidades e Wrappers (`src/core/entities/*`)

| Símbolo | Linha | Módulo Alvo | Assinatura Exata | Retorno | Efeitos Colaterais | Chamadores Principais |
|---|---|---|---|---|---|---|
| `Draft.append` | `L193` | `entities/draft.js` | `append(d: {id: string, k?: int, title?: string, sz?: int, needsRoad?: boolean})` | `Object` | Registra em `DRAFTS` | Boot (`L198`), Plugins |
| `Draft.merge` | `L194` | `entities/draft.js` | `merge(d: Object)` | `Object` | Sobrescreve chaves em `DRAFTS` | Plugins |
| `Draft.getDraft` | `L195` | `entities/draft.js` | `getDraft(id: string)` | `Object \| null` | Puro | `Building.prototype.getDraft` |
| `Draft.getDrafts` | `L196` | `entities/draft.js` | `getDrafts()` | `Array<Object>` | Puro | Plugins |
| `Building.constructor` | `L201` | `entities/building.js` | `new Building(g: Game, pivotIdx: int)` | `Building` | Puro | `Game.prototype.getBuilding` |
| `Building.prototype.getX` | `L202` | `entities/building.js` | `getX()` | `int` | Puro | `getXY`, `getDrawXY` |
| `Building.prototype.getY` | `L203` | `entities/building.js` | `getY()` | `int` | Puro | `getXY`, `getDrawXY` |
| `Building.prototype.getXY` | `L204` | `entities/building.js` | `getXY()` | `[int, int]` | Puro | Plugins |
| `Building.prototype.getDrawXY` | `L205` | `entities/building.js` | `getDrawXY()` | `[int, int]` | Puro | Plugins |
| `Building.prototype.getWidth` | `L206` | `entities/building.js` | `getWidth()` | `int` (`1..3`) | Puro | Plugins |
| `Building.prototype.getHeight` | `L207` | `entities/building.js` | `getHeight()` | `int` (`1..3`) | Puro | Plugins |
| `Building.prototype.getDraft` | `L208` | `entities/building.js` | `getDraft()` | `Object \| null` | Puro | `hasNeededRoad` |
| `Building.prototype.getText` | `L209` | `entities/building.js` | `getText()` | `string` | Puro | Plugins |
| `Building.prototype.setText` | `L210` | `entities/building.js` | `setText(t: string \| null)` | `void` | Muta `g.bText` | Plugins |
| `Building.prototype.hasRoad` | `L211` | `entities/building.js` | `hasRoad()` | `boolean` | Puro | Plugins |
| `Building.prototype.hasNeededRoad` | `L212` | `entities/building.js` | `hasNeededRoad()` | `boolean` | Puro | `isWorking` |
| `Building.prototype.isWorking` | `L213` | `entities/building.js` | `isWorking()` | `boolean` | Puro | Plugins |
| `Building.prototype.isUpgradeInConstruction` | `L214` | `entities/building.js` | `isUpgradeInConstruction()` | `boolean` | Puro | Plugins |
| `NeighborCity.create / get / getNeighbors` | `L218` | `entities/stubs.js` | `() => null \| []` | `null \| []` | Puro (Stub) | Plugins |
| `DSA.getSupplies / isInMoon` | `L219` | `entities/stubs.js` | `() => 0 \| false` | `0 \| false` | Puro (Stub) | Plugins |

---

### 1.3 Métodos da Classe `Game` (`src/core/state/*`, `world/*`, `tools/*`, `sim/*`)

| Método | Linha | Módulo Alvo | Assinatura Exata | Retorno | Efeitos Colaterais | Chamadores Principais |
|---|---|---|---|---|---|---|
| `constructor` | `L225` | `state/game.js` | `new Game(o?: {seed?: int, size?: int, name?: string, type?: string, starter?: boolean})` | `Game` | Aloca todos os arrays, chama `genTerrain`, `starter`, `recalc` | `newGame`, `Game.fromJSON` |
| `rand` | `L247` | `state/game.js` | `rand()` | `number` (`[0, 1)`) | Avança `this.rs` (Mulberry32) | `genTerrain`, `dayTick`, `growth`, `riotDay`, `fireDay`, `crimeDay`, `nextNode`, `spawnCars` |
| `dateStr` | `L248` | `state/game.js` | `dateStr()` | `string` (`'DD/MM/YYYY'`) | Puro | `log`, `hud` |
| `clock` | `L249` | `state/game.js` | `clock()` | `string` (`'HH:MM'`) | Puro | API externa |
| `say` | `L250` | `state/game.js` | `say(m: string)` | `void` | Define `this.msg = m` | `log`, `setTool`, `selBegin`, `selEnd`, `Debug.toast`, UI |
| `log` | `L251` | `state/game.js` | `log(m: string, lvl?: 'info'\|'good'\|'bad')` | `void` | Define `this.msg = m` e insere no topo de `this.logs` (máx. 40) | `selEnd`, `update`, `monthTick`, `riotDay`, `fireDay`, `crimeDay`, `dispatch`, `moveVehicles` |
| `ok` | `L252` | `state/game.js` | `ok(x: int, y: int)` | `boolean` | Puro | Todo o Core e Render |
| `pivotOf` | `L253` | `world/footprint.js` | `pivotOf(i: int)` | `int` | Puro | `getBuilding`, `clearFootprint`, `inspect`, `newCons`, `fireDay` |
| `isOrigin` | `L254` | `world/footprint.js` | `isOrigin(i: int)` | `boolean` | Puro | `popAt`, `jobsAt`, `recalc`, `monthTick`, `render` |
| `getBuilding` | `L255` | `world/footprint.js` | `getBuilding(x: int, y: int)` | `Building \| null` | Puro | API externa / Plugins |
| `getCornerTerrainHeight` | `L258` | `world/terrain-queries.js` | `getCornerTerrainHeight(cx: int, cy: int)` | `int` (`0..9`) | Puro | API externa |
| `getTileCorners` | `L263` | `world/terrain-queries.js` | `getTileCorners(x: int, y: int)` | `[int, int, int, int]` | Puro | `getTerrainHeight`, `isFlat` |
| `getTerrainHeight` | `L267` | `world/terrain-queries.js` | `getTerrainHeight(x: int, y: int)` | `number` (`0..9`) | Puro | `inspect`, `recalc`, `screenToTile`, `hudExtra`, `render` |
| `isFlat` | `L272` | `world/terrain-queries.js` | `isFlat(x: int, y: int)` | `boolean` | Puro | `isSlope` |
| `isSlope` | `L277` | `world/terrain-queries.js` | `isSlope(x: int, y: int)` | `boolean` | Puro | `cost1` |
| `isCoast` | `L278` | `world/terrain-queries.js` | `isCoast(x: int, y: int)` | `boolean` | Puro | API externa |
| `updateSlopeMasks` | `L283` | `world/terrain-queries.js` | `updateSlopeMasks()` | `void` | Atualiza `slopeMask`, `elev` e incrementa `terrainVer++` | `flattenArea`, `genTerrain`, `Game.fromJSON` |
| `flattenArea` | `L294` | `world/terrain-queries.js` | `flattenArea(x0: int, y0: int, w: int, h: int, targetH?: int)` | `void` | Nivela `cornerH`, `elevF` e chama `updateSlopeMasks` | `placeFootprint`, `starter`, `place` |
| `genTerrain` | `L309` | `world/terrain-gen.js` | `genTerrain(type: string)` | `void` | Preenche `elevF`, `cornerH`, `moisture`, `bio` e chama `updateSlopeMasks` | `Game.constructor` |
| `placeFootprint` | `L378` | `world/footprint.js` | `placeFootprint(x0: int, y0: int, k: int, sz?: int, instant?: boolean, lvl?: int)` | `boolean` | Nivela área, preenche pegada `sz×sz`, define `pivot`, `bSize` e `cons` | `starter`, `selEnd`, `tryCoalesceSkyscraper` |
| `clearFootprint` | `L393` | `world/footprint.js` | `clearFootprint(i: int)` | `void` | Limpa todos os tiles da pegada do pivô, remove `cons` e `bText` | `place` (`bull`), `fireDay` |
| `starter` | `L405` | `world/starter.js` | `starter()` | `void` | Constrói a cidade inicial no centro do mapa | `Game.constructor` |
| `tool` | `L449` | `tools/tools.js` | `tool()` | `Object` (`CATS[cat].items[item]`) | Puro | `setTool`, `setCursor`, `buildPreview`, `selBegin`, `selEnd`, `render`, UI |
| `setTool` | `L450` | `tools/tools.js` | `setTool(cat: int, it?: int)` | `void` | Define `cat`, `item`, `sel = null`, `say(...)` e `buildPreview()` | `selectItem`, `pickCat`, `buildItems` |
| `setCursor` | `L451` | `tools/tools.js` | `setCursor(x: int, y: int)` | `void` | Atualiza `cx`, `cy` e chama `buildPreview()` se `mode === 'point'` | `pointermove`, `pointerup`, `keydown` |
| `tilesOf` | `L452` | `tools/selection.js` | `tilesOf(s: {x0,y0,x1,y1}, it: Object)` | `Array<int>` | Puro | `buildPreview` |
| `cost1` | `L470` | `tools/placement.js` | `cost1(i: int, it: Object)` | `int` (`>= 0` ou `-1`) | Puro | `buildPreview` |
| `buildPreview` | `L480` | `tools/placement.js` | `buildPreview()` | `void` | Atualiza `this.preview = { tiles, cost, ok }` | `setTool`, `setCursor`, `selBegin`, `selMove`, `selCancel`, `selEnd` |
| `selBegin` | `L494` | `tools/selection.js` | `selBegin(x: int, y: int)` | `void` | Atualiza `cx, cy`, `sel` (ou inspeciona se `inspect`) e `buildPreview` | `pointerdown`, `keydown` |
| `selMove` | `L499` | `tools/selection.js` | `selMove(x: int, y: int)` | `void` | Atualiza `cx, cy`, `sel.x1, sel.y1` e `buildPreview` | `pointermove`, `keydown` |
| `selCancel` | `L500` | `tools/selection.js` | `selCancel()` | `void` | Zera `sel = null` e chama `buildPreview` | `#bNo`, `pointerdown` (pinch), `keydown` (`Escape`) |
| `selEnd` | `L501` | `tools/placement.js` | `selEnd()` | `int` (`n` tiles afetados) | Constrói/demole lotes, debita `funds`, chama `recalc` e `buildPreview` | `#bOk`, `pointerup`, `keydown` |
| `place` | `L517` | `tools/placement.js` | `place(i: int, it: Object)` | `void` | Aplica ferramenta `it` no tile `i` | `selEnd` |
| `inspect` | `L534` | `tools/inspect.js` | `inspect(x: int, y: int)` | `{ title: string, lines: Array<string> }` | Puro | `selBegin`, `showInfo` |
| `popAt` | `L555` | `tools/inspect.js` | `popAt(i: int)` | `int` | Puro | `inspect`, `recalc`, `monthTick` |
| `jobsAt` | `L561` | `tools/inspect.js` | `jobsAt(i: int)` | `int` | Puro | `inspect`, `recalc`, `monthTick` |
| `newCons` | `L567` | `tools/inspect.js` | `newCons(i: int)` | `boolean` | Puro | `Building.prototype.isWorking`, `popAt`, `jobsAt` |
| `puff` | `L568` | `tools/inspect.js` | `puff(i: int, kind: 'dust'\|'done')` | `void` | Insere partícula em `this.fx` (máx. 60) | `place`, `update`, `fireDay` |
| `isZone` | `L569` | `sim/network.js` | `isZone(k: int)` | `boolean` | Puro | `inspect`, `recalc`, `growth`, `fireDay`, `render` |
| `isSky` | `L590` | `sim/network.js` | `isSky(k: int)` | `boolean` | Puro | `recalc`, `riotDay`, `render`, `hudExtra` |
| `spread` | `L570` | `sim/network.js` | `spread(i: int, r: number, arr: Uint8Array, w: number)` | `void` | Soma cobertura radial em `arr` (saturado em 100) | `recalc` |
| `net` | `L578` | `sim/network.js` | `net(isSrc: (i:int)=>boolean, flag: Uint8Array)` | `Uint8Array` | Puro (retorna máscara BFS 8-conectada) | `recalc` |
| `near3` | `L587` | `sim/network.js` | `near3(pc: Uint8Array, i: int)` | `boolean` | Puro | `recalc` |
| `recalc` | `L591` | `sim/network.js` + `happiness-demand.js` | `recalc()` | `void` | Recalcula redes, coberturas, valor do solo, classes, felicidade, demandas, desemprego e aprovações | `constructor`, `selEnd`, `dayTick`, `fromJSON`, `D.run('funds')`, modal |
| `riskAt` | `L673` | `sim/happiness-demand.js` | `riskAt(i: int)` | `number` (`0..100`) | Puro | `riotDay`, `crimeDay`, `render` (heatmap) |
| `update` | `L676` | `sim/clock.js` | `update(dt: number)` | `void` | Avança `anim`, `fx`, `tod`, `acc`, `cons`, dispara `dayTick` e `moveVehicles` | `loop` |
| `dayTick` | `L686` | `sim/clock.js` | `dayTick()` | `void` | Avança calendário, chama `monthTick`, `recalc`, `growth`, `riotDay`, `fireDay`, `crimeDay` e decai `cr` | `update` |
| `monthTick` | `L692` | `sim/economy.js` | `monthTick()` | `void` | Cobra impostos/manutenção, atualiza inflação/juros/histórico e checa falência | `dayTick` |
| `tryCoalesceSkyscraper` | `L719` | `sim/growth.js` | `tryCoalesceSkyscraper(i: int)` | `boolean` | Funde bloco $2\times2$ nível 3 em `SKY_RES` ou `SKY_COM` | `growth` |
| `growth` | `L729` | `sim/growth.js` | `growth()` | `void` | Evolui, degrada ou abandona lotes em `zl` | `dayTick` |
| `riotDay` | `L747` | `sim/events.js` | `riotDay()` | `void` | Inicia/encerra protestos e greves, despacha polícia | `dayTick` |
| `fireDay` | `L770` | `sim/events.js` | `fireDay()` | `void` | Inicia/propaga/apaga incêndios, destrói prédios com `fire >= 100`, despacha bombeiros | `dayTick` |
| `crimeDay` | `L794` | `sim/events.js` | `crimeDay()` | `void` | Gera crimes, atualiza `crimeIdx`, pune impunidade (`age >= 4`), despacha polícia | `dayTick` |
| `dispatch` | `L812` | `sim/vehicles.js` | `dispatch(type: 'fire'\|'police', tgt: int)` | `boolean` | Faz BFS nas ruas, aloca estação em `st`, incrementa `busy` e insere viatura em `veh` | `riotDay`, `fireDay`, `crimeDay` |
| `nextNode` | `L834` | `sim/vehicles.js` | `nextNode(v: Object)` | `boolean` | Avança veículo para próxima aresta ou muda `v.state = 'work'` | `moveVehicles` |
| `endVeh` | `L848` | `sim/vehicles.js` | `endVeh(v: Object)` | `void` | Decrementa `busy[v.st]`, limpa `assign` se abortou na ida e marca `v.dead = true` | `nextNode`, `retreat` |
| `retreat` | `L849` | `sim/vehicles.js` | `retreat(v: Object)` | `void` | Inverte `v.path` para retorno à base (`v.state = 'back'`) | `moveVehicles` |
| `moveVehicles` | `L853` | `sim/vehicles.js` | `moveVehicles(dt: number)` | `void` | Move todos os veículos, resolve trabalho no alvo, remove mortos e chama `spawnCars` | `update` |
| `spawnCars` | `L875` | `sim/vehicles.js` | `spawnCars()` | `void` | Cria até 2 carros civis por quadro até atingir `want` ($\le 260$) | `moveVehicles` |
| `toJSON` | `L887` | `state/persistence.js` | `toJSON()` | `Object` (Save `v: 5`) | Puro | `save` |
| `Game.fromJSON` | `L895` | `state/persistence.js` | `Game.fromJSON(o: Object)` | `Game` | Instancia e restaura `Game` com migração `v4 -> v5` | `load` |
| `screenToTile` | `L910` | `render/camera.js` | `screenToTile(sx: number, sy: number)` | `[int, int] \| null` | Puro | `pointerdown`, `pointermove`, `pointerup` |

---

## 2. Script 2 — Biblioteca de Construções 3D (`L925–L1422`, `src/render/buildings/*`)

| Função | Linha | Módulo Alvo | Assinatura Exata | Retorno | Descrição |
|---|---|---|---|---|---|
| `sh` | `L934` | `buildings/palettes.js` | `sh(c: [int,int,int], f: number)` | `[int, int, int]` | Multiplica RGB por `f` saturado em 255 |
| `mix` | `L935` | `buildings/palettes.js` | `mix(a: [int,int,int], b: [int,int,int], t: number)` | `[int, int, int]` | Interpolação linear inteira entre duas cores |
| `pick` | `L936` | `buildings/palettes.js` | `pick<T>(a: Array<T>, n: int)` | `T` | Seleção circular positiva em array |
| `mat` | `L937` | `buildings/palettes.js` | `mat(c: [int,int,int])` | `{t, l, r}` | Gera trio de cores de iluminação isométrica (`1.14x`, `1.0x`, `0.70x`) |
| `make` | `L950` | `buildings/registry.js` | `make(X: KitContext)` | `Object` (`{drawAt, tree, fx, ...}`) | Instancia o construtor de primitivas e modelos acoplado ao kit `X` |
| `P` | `L953` | `buildings/primitives.js` | `P(u: number, v: number, z?: number)` | `[number, number]` | Projeta coordenada local do tile $(u,v,z)$ para tela |
| `Q` | `L954` | `buildings/primitives.js` | `Q(ps: Array<[number,number]>, c: RGB, j?: int, a?: number)` | `void` | Achata lista de pontos 2D e chama `X.poly` |
| `LN` | `L955` | `buildings/primitives.js` | `LN(a: [number,number], b: [number,number], c: RGB)` | `void` | Wrapper para `X.ln` |
| `PT` | `L956` | `buildings/primitives.js` | `PT(p: [number,number], c: RGB)` | `void` | Wrapper para `X.pt` |
| `hull` | `L958` | `buildings/primitives.js` | `hull(pts: Array<[number,number]>)` | `Array<[number,number]>` | Fecho convexo 2D (Monotone Chain) |
| `shadow` | `L964` | `buildings/primitives.js` | `shadow(u0, v0, u1, v1, h)` | `void` | Projeta sombra solar no solo usando `hull` |
| `blk` | `L968` | `buildings/primitives.js` | `blk(u0, v0, u1, v1, z0, z1, c: {t,l,r}, nosh?: boolean)` | `void` | Desenha prisma retangular 3D com sombra e arestas de topo |
| `B` | `L975` | `buildings/primitives.js` | `B(u0, v0, u1, v1)` | `{u0, v0, u1, v1}` | Construtor de caixa delimitadora horizontal |
| `FP` | `L976` | `buildings/primitives.js` | `FP(b, f: 'L'\|'R', s: number, z: number)` | `[number, number]` | Projeta coordenada parametrizada $(s \in [0,1], z)$ sobre a face `'L'` ou `'R'` |
| `fq` | `L977` | `buildings/primitives.js` | `fq(b, f: 'L'\|'R', s0, s1, z0, z1, c: RGB, j?, a?)` | `void` | Desenha quadrilátero sobre a face `'L'` ou `'R'` de um bloco |
| `fw` | `L978` | `buildings/primitives.js` | `fw(b, f: 'L'\|'R')` | `number` | Largura projetada em pixels da face `'L'` ou `'R'` |
| `wins` | `L979` | `buildings/primitives.js` | `wins(b, f, cols, rows, z0, z1, m, ab, tint?)` | `void` | Grade de janelas diurnas/noturnas com emissão `X.emQ` |
| `door` | `L990` | `buildings/primitives.js` | `door(b, f, s0, s1, h, c, ab)` | `void` | Porta térrea com batentes em zoom `hi` |
| `awning` | `L991` | `buildings/primitives.js` | `awning(b, f, s0, s1, z, d, c1, c2)` | `void` | Toldo comercial listrado inclinado |
| `gable` | `L1000` | `buildings/primitives.js` | `gable(b, z, rh, c, alongU?: boolean)` | `void` | Telhado de duas águas com empena triangular |
| `hip` | `L1013` | `buildings/primitives.js` | `hip(b, z, rh, c)` | `void` | Telhado piramidal de quatro águas |
| `flatRoof` | `L1018` | `buildings/primitives.js` | `flatRoof(b, z, c, par?: boolean)` | `void` | Platibanda de topo plano (`hi && par`) |
| `cyl` | `L1019` | `buildings/primitives.js` | `cyl(u, v, r, z0, z1, c, seg?, stripe?)` | `void` | Cilindro vertical sombreado com tampa elíptica de 18 lados |
| `cone` | `L1028` | `buildings/primitives.js` | `cone(u, v, r, z, h, c)` | `void` | Cone circular 3D |
| `disk` | `L1029` | `buildings/primitives.js` | `disk(u, v, r, z, c, a?)` | `void` | Disco horizontal elíptico de 16 lados |
| `txt` | `L1030` | `buildings/primitives.js` | `txt(b, f, s0, z, str, col, glowCol?)` | `void` | Renderizador de texto matricial $3\times5$ isométrico (`FONT`) |
| `lampPost` | `L1036` | `buildings/primitives.js` | `lampPost(u, v, h)` | `void` | Poste de jardim com halo noturno |
| `fence` | `L1037` | `buildings/primitives.js` | `fence(u0, v0, u1, v1, c?)` | `void` | Cerca baixa com estacas verticais |
| `person` | `L1038` | `buildings/primitives.js` | `person(u, v, col, ph)` | `void` | Pedestre animado em órbita local (`hi`) |
| `smoke` | `L1039` | `buildings/primitives.js` | `smoke(u, v, z, n, col?)` | `void` | Pluma de fumaça ascendente (`mid`) |
| `minicar` | `L1040` | `buildings/primitives.js` | `minicar(u, v, along: 'u'\|'v', c, flash?: boolean)` | `void` | Veículo estacionado em pátio de prédio |
| `sign` | `L1045` | `buildings/primitives.js` | `sign(b, f, s, z, w, h, c, label?, lc?)` | `void` | Placa de fachada com texto opcional |
| `tree` | `L1046` | `buildings/primitives.js` | `tree(u, v, h, c1, kind: 0\|1, sway?: number)` | `void` | Pinheiro em 3 camadas (`kind=0`) ou árvore frondosa (`kind=1`) com balanço de vento |
| `constructionSite` | `L1055` | `buildings/construction.js` | `constructionSite(b, H, p, big)` | `number` (`cur`) | Tapume, fundação, andaime metálico e tela verde de obra |
| `crane` | `L1073` | `buildings/construction.js` | `crane(u, v, h, p)` | `void` | Guindaste de torre giratório com contrapeso, cabo e luz de topo |
| `res1`, `res2`, `res3` | `L1083..L1128` | `buildings/residential.js` | `res1(t)`, `res2(t)`, `res3(t)` | `void` | Modelos residenciais níveis 1, 2 e 3 |
| `com1`, `com2`, `com3` | `L1141..L1168` | `buildings/commercial.js` | `com1(t)`, `com2(t)`, `com3(t)` | `void` | Modelos comerciais níveis 1, 2 e 3 |
| `ind1`, `ind2`, `ind3` | `L1183..L1203` | `buildings/industrial.js` | `ind1(t)`, `ind2(t)`, `ind3(t)` | `void` | Modelos industriais níveis 1, 2 e 3 |
| `police`, `fire`, `hosp`, `school` | `L1216..L1246` | `buildings/services.js` | `(t: TileDrawDesc) => void` | `void` | Modelos de serviços públicos |
| `coal`, `solar`, `wtower`, `park` | `L1258..L1290` | `buildings/services.js` | `(t: TileDrawDesc) => void` | `void` | Modelos de infraestrutura e lazer |
| `skyRes`, `skyCom`, `megaTower`, `landmark` | `L1302..L1375` | `buildings/skyscrapers.js` | `(t: TileDrawDesc) => void` | `void` | Modelos monumentais $2\times2$ e $3\times3$ |
| `drawAt` | `L1403` | `buildings/registry.js` | `drawAt(t: TileDrawDesc)` | `void` | Aplica tonalizador de classe/abandono `t.tn`, gerencia obra/clipping e despacha para `DRAW[t.k][lv]` |
| `fx` | `L1414` | `buildings/registry.js` | `fx(f: {x, y, t, kind})` | `void` | Desenha partículas `'dust'` ou `'done'` |

---

## 3. Script 3 — Motor de Renderização em Software (`L1423–L1997`, `src/render/*`)

| Função | Linha | Módulo Alvo | Assinatura Exata | Retorno | Descrição |
|---|---|---|---|---|---|
| `fillPoly` | `L1435` | `raster/pixel.js` | `fillPoly(fb: Uint8ClampedArray, W: int, H: int, p: Array<number>, c: RGB, jit?: int, al?: number)` | `void` | Preenchedor scanline de polígono com fast-path `Uint32Array.fill`, dither e alpha |
| `put` | `L1458` | `raster/pixel.js` | `put(fb: Uint8ClampedArray, W: int, H: int, x: number, y: number, c: RGB)` | `void` | Grava pixel RGBA respeitando `CLIP` e modo `ERASE` |
| `erasePoly` | `L1460` | `raster/pixel.js` | `erasePoly(u: Uint32Array, W: int, H: int, p: Array<number>)` | `void` | Zera pixels cobertos por polígono opaco no buffer emissivo |
| `terrainTex` | `L1476` | `raster/terrain-texture.js` | `terrainTex(seed: int)` | `Uint8Array(65536)` | Gera e cacheia textura de ruído tileável $256\times256$ em `D._ttex` |
| `terrTri` | `L1483` | `raster/terrain-texture.js` | `terrTri(u32: Uint32Array, W: int, H: int, a: V8, b: V8, c: V8, T: Uint8Array, fine: number)` | `void` | Rasterizador de triângulo Gouraud com textura procedural por pixel |
| `line` | `L1514` | `raster/pixel.js` | `line(fb: Uint8ClampedArray, W: int, H: int, x0, y0, x1, y1, c: RGB)` | `void` | Traçador de linha DDA via `put` |
| `render` | `L1520` | `renderer.js` | `render(g: Game, fb: Uint8ClampedArray, W: int, H: int, view?: {hw?, u0?, v0?, follow?, qn?, heat?})` | `void` | Função mestra de renderização dos 4 passes |
| `ground` | `L1555` | `terrain-pass.js` | `ground(Tc, X, poly, vis, A, night, x0, x1, y0, y1, GB)` | `void` | Renderiza terreno 3D, água, zonas, estradas e árvores/rochas de um retângulo de tiles |
| `sigOf` | `L1703` | `terrain-pass.js` | `sigOf(x0: int, x1: int, y0: int, y1: int)` | `int` | Calcula hash de invalidação de um chunk $8\times8$ |
| `fillShadowMask` | `L1704` | `raster/caches.js` | `fillShadowMask(u: Uint32Array, Wd: int, Ht: int, p: Array<number>)` | `void` | Grava sentinela `0x01000000` em pixels transparentes da sombra do sprite |
| `buildSpans` | `L1759` | `raster/caches.js` | `buildSpans(px: Uint32Array, w: int, h: int)` | `Int16Array(h * 3)` | Compila limites horizontais `[s0, s1, contig]` por linha do sprite |
| `bakeSprite` | `L1769` | `object-pass.js` | `bakeSprite(t: TileDrawDesc)` | `BakedSprite` | Assa 1 ou 4 fases do edifício, extrai deltas `df`, sombra e camada emissiva `ex` |
| `blitSprite` | `L1799` | `object-pass.js` | `blitSprite(s: BakedSprite, cx: int, cy: int)` | `void` | Transfere sprite assado para `fb32` via spans e aplica sombra em stencil |
| `drawB` | `L1816` | `object-pass.js` | `drawB(t: TileDrawDesc)` | `void` | Desenha prédio via cache `D._spr` (ou ao vivo se em obra/protesto) e aplica oclusão emissiva |
| `bubble` | `L1916` | `effects.js` | `bubble(fb, W, H, cx, cy, name: string, S?: int)` | `void` | Desenha balão de alerta com ícone $5\times5$ (`ICON[name]`) |
| `flames` | `L1923` | `effects.js` | `flames(X, f: int, cx, cy, hw, hh, A, x)` | `void` | Desenha labaredas e fumaça de incêndio |
| `protest` | `L1932` | `effects.js` | `protest(X, hw, hh, A, x, cx, cy, kit)` | `void` | Desenha manifestantes, cartazes e fogueira |
| `pole` | `L1942` | `roads.js` | `pole(X, kit, hw, g, x, y, T, cx, cy)` | `void` | Desenha poste elétrico e cabos para `(x+1,y)` e `(x,y+1)` |
| `road` | `L1948` | `roads.js` | `road(g, x, y, T, poly, X, hw, bridge, night, A, hi, mid)` | `void` | Desenha calçadas, asfalto/ponte, faixas tracejadas, faixas de pedestres e postes de rua |
| `roadFG` | `L1974` | `roads.js` | `roadFG(g, x, y, cx, cy, X, hw, hh, A)` | `void` | Desenha luzes de semáforo acima dos veículos em cruzamentos |
| `car` | `L1982` | `roads.js` | `car(X, poly, T, v: Vehicle, hw, hh, night, A, hi)` | `void` | Desenha carro civil, caminhão de bombeiros ou viatura policial 3D |

---

## 4. Script 4 e Script 5 — Runtime, Plugins e Interface (`L1998–L2311`)

| Função / Método | Linha | Módulo Alvo | Assinatura Exata | Retorno | Descrição |
|---|---|---|---|---|---|
| `Debug.info / log / toast` | `L2003..L2005` | `runtime/debug.js` | `info(v)`, `log(...args)`, `toast(v)` | `void` | Telemetria em `#perf`, log no console e toast na HUD |
| `Runtime.postpone / flush` | `L2009..L2010` | `runtime/runtime.js` | `postpone(fn: Function, delayMS?: number)`, `flush(dtMS?: number)` | `void` | Fila de execução adiada por delta-time |
| `Runtime.getStorage` | `L2018` | `runtime/runtime.js` | `getStorage(id: string)` | `Object` | Retorna sub-objeto persistente do plugin |
| `Runtime.registerCommand` | `L2019` | `runtime/runtime.js` | `registerCommand(n: string, f: (g:Game, args:string[])=>any)` | `void` | Registra comando para `Delta.run` |
| `Runtime.toJson / fromJson` | `L2020..L2021` | `runtime/runtime.js` | `toJson(t)`, `fromJson(s)` | `string` / `any` | Serialização JSON |
| `Runtime.getTime / getUuid` | `L2022..L2023` | `runtime/runtime.js` | `getTime()`, `getUuid()` | `int` / `string` | Timestamp em ms e gerador UUID v4 |
| `guard` | `L2025` | `runtime/script-lifecycle.js` | `guard(o: PluginObj, f: Function, a: Array)` | `void` | Invoca listener de plugin e desativa após 5 erros |
| `Script.on / emit` | `L2029..L2030` | `runtime/script-lifecycle.js` | `on(ev: string, fn: Function, owner?: Object)`, `emit(ev: string, g?: Game, x?: any)` | `void` | Pub/Sub de eventos de ciclo de vida |
| `Script.bootEngine / bootCity` | `L2032..L2036` | `runtime/script-lifecycle.js` | `bootEngine()`, `bootCity(g: Game, isNew: boolean)` | `void` | Transiciona fases estritas de boot da engine e da cidade |
| `Plugins.add / setActive` | `L2050..L2051` | `runtime/plugins.js` | `add(p: Object)`, `setActive(id: string, on: boolean)` | `Object` / `void` | Registra plugin e liga/desliga status ativo |
| `Delta.run` | `L2052` | `runtime/console.js` | `run(line: string)` | `any` | Executa comando textual registrado em `CMD` |
| `$` / `el` / `cl` / `Q` | `L2063..L2070`, `L2279` | `ui/dom.js` | `$(id)`, `el(tag, cls?, html?)`, `cl(s)`, `Q(sel, fn)` | `HTMLElement` / `string` / `void` | Helpers de manipulação DOM e limpeza de string |
| `newGame` | `L2072` | `persistence/storage.js` | `newGame(o: Object)` | `void` | Cria `new D.Game(o)`, chama `bootCity(g, true)` e reseta câmera (`hwF=28, u0=0, v0=g.N`) |
| `load` / `save` | `L2073..L2074` | `persistence/storage.js` | `load()`, `save()` | `void` | Carrega/salva estado em `localStorage` |
| `resize` | `L2075` | `ui/app-loop.js` | `resize()` | `void` | Recalcula `W, H`, redimensiona `canvas#c` e recria `ImageData` |
| `iconUrl` / `ic` / `itIc` | `L2109..L2118` | `ui/icons.js` | `iconUrl(n, a, b)`, `ic(n, s?, a?, b?)`, `itIc(id, s?)` | `string` | Gera Data URL PNG e HTML `<i>` de ícone $8\times8$ |
| `selectItem` | `L2134` | `ui/hud.js` | `selectItem(id: string)` | `void` | Busca ferramenta pelo `id` em `CATS` e ativa via `g.setTool` |
| `togPerf` | `L2139` | `ui/hud.js` | `togPerf()` | `void` | Alterna visibilidade de `#perf` |
| `hudExtra` / `hud` | `L2146`, `L2166` | `ui/hud.js` | `hudExtra()`, `hud()` | `void` | Atualiza chips da HUD, `#dial`, barras `#rci` e minimapa `#mmc` |
| `toggleMenu` / `pickCat` / `buildItems` | `L2190..L2196` | `ui/build-menu.js` | `toggleMenu()`, `pickCat(ci: int)`, `buildItems()` | `void` | Controla abertura e renderização de `#cats` e `#its` |
| `showConf` / `hideConf` | `L2203` | `ui/build-menu.js` | `showConf()`, `hideConf()` | `void` | Exibe/oculta botões `#conf` (`OK`/`X`) |
| `pos` / `pts` / `dist` / `mid` | `L2208..L2209` | `ui/input.js` | Helpers internos de ponteiro/pinça | `Array<number>` / `number` | Conversão de coordenadas de tela e geometria multi-touch |
| `camClamp` / `panBy` | `L2210..L2211` | `ui/input.js` | `camClamp()`, `panBy(dx: number, dy: number)` | `void` | Desloca e limita coordenadas $(u_0, v_0)$ da câmera |
| `showInfo` | `L2212` | `ui/input.js` | `showInfo(x: int, y: int)` | `void` | Preenche e exibe `#card` com retorno de `g.inspect(x, y)` |
| `spark` / `row` / `hd` / `step` / `cyc` | `L2249..L2254` | `ui/modals.js` | Helpers de template HTML/SVG do modal | `string` | Geram linhas, cabeçalhos, botões step/cycle e gráficos SVG |
| `openModal` / `closeModal` / `drawModal` | `L2255..L2258` | `ui/modals.js` | `openModal(t: string)`, `closeModal()`, `drawModal()` | `void` | Controle e renderização das 4 abas de `#win` |
| `loop` | `L2288` | `ui/app-loop.js` | `loop(t: number)` | `void` | Laço principal `requestAnimationFrame` |