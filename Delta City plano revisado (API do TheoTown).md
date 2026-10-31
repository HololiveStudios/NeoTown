# Delta City: plano revisado a partir da API completa do TheoTown

Revisão de 28/10/2026 (leitura 100% concluída).
**Fonte:** `https://doc.theotown.com/` — **todos os 18 módulos** (`Array`, `Builder`, `Building`, `Car`, `City`, `DSA`, `Debug`, `Draft`, `Drawing`, `GUI`, `NeighborCity`, `Runtime`, `Script`, `TheoTown`, `Tile`, `Util`, `Vector`, `string`) e os **2 tópicos** (`00-intro.md`, `01-lua.md`) foram lidos por inteiro e cruzados com o código atual do jogo em `delta_city (2).html` (1.516 linhas).

**Legenda:** **\[API\]** está documentado em `doc.theotown.com`. **\[Inferência\]** é dedução arquitetural, pois o código do TheoTown é fechado e a documentação expõe o contrato, não a fórmula interna. **\[Nosso\]** é melhoria ou mecânica própria do Delta City. Direitos: apenas a documentação pública serve de inspiração; nada de sprites, textos ou código proprietário do jogo.

---

## 1. O que já foi feito (auditoria de `delta_city (2).html`)

| Item do plano antigo | Estado atual em `delta_city (2).html` | O que ainda falta dele |
| --- | --- | --- |
| HUD estilo TheoTown, tom realista dos pixels, grade de cor | Pronto (HUD pixel-art, dial SVG, minimapa, vinheta + granulado fixo) | Nada |
| Fase 0, medição | Overlay de ms (`sim`, `render`, `ui`), `chunks` (MB) e `sprites` (clique em `#cN` ou tecla `F`) | Integrar `Debug.info` ao overlay e registrar baseline em 48x48 e 96x96 com teste headless fixo |
| Fase 2, barramento de eventos e Runtime | `Delta.Script` (`init`, `nextDay`, `nextMonth`, `nextYear`, `update`, `build`, `remove`), `Delta.Runtime` (`postpone`, `flush`, `getStorage`, `registerCommand`), `Delta.Plugins` com desativação após 5 erros, console `Delta.run` | Disparar `init`, `build`/`event` e `remove`; converter atraso de `postpone` de frames para `delayMS` \[API\]; adicionar `toJson`/`fromJson`/`getTime`/`getUuid`; storage por prédio, estrada e carro; extrair Banco Central e Protestos para plugins internos |
| §8.7 mapas de calor | 6 mapas (`cls`, `land`, `poll`, `crime`, `risk`, `cPol`, tecla `H`) | Ler diretamente dos 26 mapas de influência da seção 5.3 |
| §8.2 cache de chunks 8x8 | Pronto (LRU de 64 MB em `D._chunks`, assinatura por chunk) | Semáforo de cruzamento ficou congelado no chunk estático; mover luzes de semáforo para camada `FG` dinâmica \[API\] |
| §8.1 sprites de prédios | Pronto (LRU de 48 MB em `D._spr`, 4 fases `A & 3`, patch de diferenças ≤ 90 px, fumaça forte volta ao vivo, sombra dinâmica separada) | Rotação de câmera (0 a 3); separar animações grandes numa camada dinâmica por slot (`Building` / `Tile` animation slots) |
| §8.3 dia e noite | Parcial: loop de pixel com tabelas `D._vc` em cache; janelas e luzes emissivas por lista `em` | Composição por `multiply` (`Drawing.getDaytimeColor`) e máscara emissiva por `frameType` (seção 8) |

---

## 2. O que a leitura completa da API revelou (módulos antes não cobertos ou vistos só pelo índice)

Cada item abaixo foi extraído da documentação oficial e mapeado nas fases da seção 12:

1. **Ciclo de vida completo do prédio** \[API: `Tile`, `Building`\]: em construção (`getDaysBuilt() < 0`), funcionando (`isWorking`), vazio (`isEmpty`, moradores saíram, só RCI), pegando fogo (`isBurning`), com doentes (`isIll`), cheio de lixo (`isFullOfWaste`), cheio de corpos (`isFullOfDeadPeople`), abandonado (`abandonBuilding`), intocável (`isUntouchable`, protegido contra substituição automática de RCI), com upgrade pendente (`isUpgradeInConstruction` / `hasBuildingPendingUpgrade`).
2. **Objeto `Building` e textos por instância** \[API: `Building`\]: `Tile.getBuilding(x, y)` retorna um wrapper com todos os métodos de prédio e adiciona `building:getText()` / `building:setText(text)` (que não existe solto em `Tile`), diferencia `hasRoad()` (tem rua adjacente mesmo sem precisar) de `hasNeededRoad()` (tem a rua exigida ou não precisa de rua), expõe `getWidth()`/`getHeight()` da base, `getXY()` (pivô lógico) e `getDrawXY()` (canto mais à esquerda da base para `Drawing.setTile` independente de rotação).
3. **Animações por slot em prédios e em duas camadas nas estradas (base e `FG`)** \[API: `Tile`, `Building`\]:
   - Prédios possuem slots 1-based com `get/setAnimationFrame`, `get/setAnimationColor(r,g,b,a,slot)`, `pauseAnimation(slot)`, `resumeAnimation(slot, speed)` e `isAnimationPaused(slot)`.
   - Estradas possuem **duas camadas de animação por slot**: normal (`getRoadAnimationFrame`, `setRoadAnimationColor`, `pauseRoadAnimation`, `resumeRoadAnimation`) e **foreground (`FG`)** (`getRoadAnimationFrameFG`, `setRoadAnimationColorFG`, `pauseRoadAnimationFG`, `resumeRoadAnimationFG`) para elementos que ficam acima dos carros (semáforos, pórticos, cancelas).
4. **Serviços que o jogo ainda não tem** \[API: `City`, `Tile`\]: coleta de lixo (`WASTE_DISPOSAL`, `ACTIONPLACE_GARBAGE`), descarte de corpos (`BODY_DISPOSAL`), hospital com epidemia e ambulância (`DISASTER_ILLNESS`, `ACTIONPLACE_MEDIC`), SWAT (`ACTIONPLACE_SWAT`, tipo `"swat"`), ônibus (`bus depot`, `buildBusStop`), ferrovia (`railway station`, `PASSENGER_TRAIN`), aeroporto (`airport`, `INFO_AIRPORT`), religião, esporte, cultura e gestão (`INFLUENCE_MANAGEMENT`).
5. **14 ícones internos de status de prédio** \[API: `Tile.setBuildingIcon`\]: `$buildingicon_illness00`, `noroad00`, `noenergy00`, `nowater00`, `overloaded00`, `unhappy00`, `waste00`, `wasteoverloaded00`, `deadbodies00`, `deadbodiesoverloaded00`, `crimegraffiti00`, `crimeburglary00`, `crimemurder00`, `crimeriot00`. Ícones nativos têm precedência sobre o ícone customizado definido por `setBuildingIcon`.
6. **Upgrades de prédio** \[API: `Builder`, `Tile`, `Building`\]: `buildBuildingUpgrade(draft, x, y)`, `getBuildingUpgradePrice`, `removeBuildingUpgrade` (não remove se estiver pendente), `hasBuildingUpgrade`, `hasBuildingPendingUpgrade`. Aplicados como pendentes, sujeitos a tempo de obra, e podem substituir outros upgrades.
7. **Estradas ricas** \[API: `Tile`, `Builder`, `Draft`\]: níveis (`level`, com `getRoadAbsoluteLevel = level - terrainHeight`), alinhamento `0..15`, mão única `0..63` (`setRoadOneWayAlignment`), direção em bits (`1=leste, 2=norte, 4=oeste, 8=sul`), direção de rampa (`getRoadSlopeDirection`: `0` plana, `1,2,4,8` entrada/saída de ponte), pilares (`isRoadPile`/`setRoadPile`), tipos de ponte (`getRoadBridgeType`/`setRoadBridgeType`/`countRoadBridgeType`), decorações (`buildRoadDeco`, `countRoadDecos`, `getRoadDeco`, `removeRoadDeco`, `Draft:hasDecorations`), ocupação temporária (`getRoadOccupation`/`setRoadOccupation`), tráfego `0..1`, contadores `getRoadCarCount` e `getRoadChargeableCarCount` (pedágio), mão inglesa (`City.isLeftSideTraffic`/`setLeftSideTraffic`).
8. **Transporte público e pedestres** \[API: `Builder`, `Tile`, `Draft`\]: `buildBusStop(draft, x, y, level)` na estrada, `Draft:getDepotCapacity()` para garagens, `Draft:getCapacity()` unificado (prédio, parada de ônibus e carro + cauda), e `Tile.spawnBuildingPedestrian(x, y, amount)` que agenda pedestres nas ruas vizinhas conforme atributo `"pedestrian"` do prédio ou influências locais.
9. **Terreno por cantos e geometria de retângulos** \[API: `Tile`, `Builder`, `Util`\]: `getCornerTerrainHeight(x, y)` em `(0..W, 0..H)` com degrau visual de 12 px e oceano = 0, `getTerrainHeight` (média interpolada dos 4 cantos), `isFlat`, `isSlope`, `isCoast`, `setTerrainHeight` / `getTerrainHeightPrice` / `isTerrainHeightBuildable`, mais alturas legadas (`get/setGroundHeight`) para sombreamento e profundidade da água. `Util.collectFullRectTiles(x, y, w, h)` e `Util.collectRectTiles(x, y, w, h, noCorners)` (borda em sentido horário) apoiam ferramentas de zona, murada e cerca (`buildFenceAround`, `removeFenceWithin`, `hasFenceWithin`).
10. **Economia profunda e formatação** \[API: `City`, `TheoTown`\]: `spendMoney(amount, x, y, budgetItem)` (mostra preço vermelho flutuando em `x,y` e classifica no item de orçamento), preços que mudam com o tempo (`get*Price`), empréstimos (`INFO_LOAN`), XP (`getXp`), rank (`getRank` retorna `draft, index`), modo sandbox (`isSandbox`) e modo Uber (`isUber`), moeda secundária (`getCurrency`/`spendCurrency`), diamantes (`TheoTown.getDiamonds`/`spendDiamonds`, `Draft:getDiamondPrice` = 0 no desktop), `TheoTown.formatMoney(amount, signed)` e `TheoTown.formatNumber(amount, signed, abbreviate)`.
11. **13 desastres e cidades vizinhas** \[API: `City`, `NeighborCity`\]: 13 constantes `DISASTER_*`, `enableDisaster`, `getDisaster` (um ativo por vez), `issueDisaster(name, x, y, radius, radioactive)`. `NeighborCity` (experimental) cria vizinhos virtuais por draft que exportam energia (`getPower`, `getPowerExport` com sinal), água (`getWater`), descarte de lixo (`getWasteDisposal`) e descarte de corpos (`getBodyDisposal`).
12. **Pipeline completo de `Drawing`** \[API: `Drawing`\]:
    - Cores e composição: `setColor(r,g,b | hex)` multiplicativo, `addColor(r,g,b)` aditivo, `adjustColor(r,g,b | hex)` (converte cores de light mode para dark mode!), `setAlpha(0..1)`, `setAdditive(0..1)`, `reset()`.
    - Primitivas: `drawImage`, `drawImageRect`, `drawNinePatch(frame, x, y, w, h, sparse)`, `drawQuad` (mais rápido que 2 `drawTriangle`), `drawTriangle`, `drawRect`, `drawLine(x0,y0,x1,y1,width)`, `drawCircle(x,y,w,h,fillRatio,startAngle,endAngle)`, `drawTileFrame(frame)` (deita o frame na rampa do tile atual), `setTile(tx,ty,ox,oy,sx,sy)`.
    - **Flow Layout de texto e imagem**: `setFont`, `drawText(text,x,y,font,centerX,centerY)`, `getTextSize`, `setTextFrame(x,y,w,h)`, `flowText(text)`, `flowImage(frame)` (auto-escala imagem para a altura da fonte!), `nl(spacing)` e `getFlowHeight()`.
    - Shaders e luz do dia: `getDaytime()` (`0.5` = meio-dia visual), `getDaytimeColor()`, `allocateFrameType()`, `setFrameType(0..255)` (`0..64` reservados), `setUniform(name, v0..v3)` e `flush()`.
13. **Árvore de widgets `GUI`, diálogos prontos e toque contínuo** \[API: `GUI`\]:
    - `GUI.getRoot()` (painel raiz cujo padding define a **safe area** contra notches), `GUI.get(id)`, `GUI.isDarkMode()`.
    - 10 widgets: `addPanel`, `addLayout`, `addLabel`, `addButton`, `addIcon`, `addListBox`, `addSlider`, `addTextField`, `addTextFrame`, `addCanvas`.
    - Métodos de layout e estado: `getClientWidth/Height` (área útil descontando `getPadding`), `setPosition`, `setSize`, `setChildIndex`, `setShowBorder` (para `textframe`/`listbox`), `getShiftY`/`setShiftY` (restaurar posição de scroll de `listbox` após rebuild!), `setTouchThrough`, `getTouchPoint()` (retorna `x, y, firstX, firstY, speedX, speedY, time` em ms), `addHotkey`/`removeHotkey` (com `"ctrl"`, `"shift"`, `"alt"`).
    - 5 diálogos nativos: `createDialog`, `createMenu`, `createRenameDialog` (com `filter(val)` booleano), `createSelectDraftDialog` (seleção simples ou múltipla de drafts com `minSelection`/`maxSelection`/`selectableOnly`) e `showColorPicker`.
14. **Utilitários de linguagem, Runtime, Debug, Tradução e DSA** \[API: `Runtime`, `Util`, `Debug`, `Array`, `Vector`, `string`, `TheoTown`, `DSA`\]:
    - `Runtime`: `postpone(func, delayMS)`, `toJson(tbl)`, `fromJson(str)`, `getTime()` (ms Unix), `getUuid()`, `getPlatform()`, `getVersion()`, `getVersionCode()`, `isPremium()`.
    - `Util`: `optStorage(src, name, constructor)` (inicializa e retorna chave de storage), `unite(t1, t2, ...)` (proxy que lê da primeira tabela que tiver a chave e escreve em todas), `color2hex`, `hex2color`, `rgb2hsv`, `hsv2rgb`.
    - `Debug`: `Debug.info(...)` (mostrado no overlay de debug a cada frame dentro de `script:update()`), `Debug.log(...)`, `Debug.toast(...)` (enfileirado).
    - `Array` (lista com índice negativo `-1`, `pick`, `shuffle`, `sum`, `removeWhere`, `filter`, `map`, `forEach`), `Vector` (vetor 3D imutável com `cross`, `dot`, `length`, `normalized`), `string` (`contains`, `startsWith`, `endsWith`, `split`, `trim`).
    - `TheoTown`: `translate(id)` / `Translation.key`, `translateInline("default[pt]Português[en]English")`, `isRTL()`, `execute(cmd, receiver)`, `loadCity`.
    - `DSA`: `DSA.getSupplies()` e `DSA.isInMoon()` (integração com estação espacial e Lua; documentado na API, mas tratado como expansão temática opcional fora do escopo principal).

---

## 3. Arquitetura alvo e mapeamento dos 18 módulos da API

Camadas sem dependência para cima:
**Kernel** (sem DOM, roda no Node) → **Serviços** (economia, política, utilidades, saúde, lixo, mobilidade, desastres; usam só a API pública, como plugins) → **Renderizador** (somente leitura do kernel + fila de comandos `Drawing`) → **GUI** (DOM pixel-art sobre a árvore `Delta.GUI`) → **Plugins**.

### Mapeamento completo dos 18 módulos no objeto global `Delta`

| Módulo da API | Papel no `Delta` |
| --- | --- |
| `Draft` | Registro `DRAFTS` (`append`, `merge`, `getDraft`, `getDrafts(tag)`, metadados, preços, frames, `frameType`, `call`, `callAll`) |
| `Tile` | Acesso direto às camadas SoA por `(x, y, level)`, 26 constantes `INFLUENCE_*`, animações de prédio e de estrada (base + `FG`) |
| `Building` | Wrapper leve retornado por `Tile.getBuilding(x, y)` com `get/setText`, `hasRoad`/`hasNeededRoad`, `getDrawXY`, slots de animação e upgrades |
| `City` | Fachada do estado da cidade: finanças, impostos, população/empregos por nível, 16 `HAPPINESS_*`, 13 `DISASTER_*`, 13 `INFO_*`, 5 `ACTIONPLACE_*`, iteradores 1-based (`getBuilding`, `getRoad`, `getPipe`, `getWire`), listeners, câmera, `createDraftDrawer` |
| `Builder` | Única porta de mutação do mapa (`build*`, `remove*`, `is*Buildable`, `get*Price` para prédio, upgrade, estrada, deco, ponto de ônibus, fio, cano, zona, árvore, cerca, chão e altura de terreno) |
| `Car` | Enfileiramento assíncrono `Car.spawn`, controle de smart cars (`driveTo`, `wait`, `despawn`, `setSpeed`, `setColor`, cauda `addTail`/`removeTail`) e `getCars()` por dono |
| `NeighborCity` | Vizinhos comerciais virtuais por draft (`create`, `get`, `getNeighbors`, exportação de energia, água, lixo e corpos) |
| `Script` | Ciclo de vida completo, eventos de instância/ferramenta (`EVENT_*`), eventos de smart car, tags e hierarquia (`addScript`, `setActive`, `getScript`, `getScripts`) |
| `Drawing` | Contexto imediato e em lote para plugins e UI customizada (cores multiplicativas/aditivas, `adjustColor`, primitivas, `drawTileFrame`, flow text/image, `frameType`, `setUniform`) |
| `GUI` | Árvore de widgets declarativa (`getRoot`, `get`, `add*`, `createDialog`, `createMenu`, `createRenameDialog`, `createSelectDraftDialog`, `showColorPicker`, `isDarkMode`) |
| `Runtime` | Fila síncrona por frame `postpone(fn, delayMS)`, `toJson`/`fromJson`, `getTime`, `getUuid`, informações de plataforma/versão |
| `TheoTown` | Storage global e de arquivo (`getStorage`, `getFileStorage`), `get/setGlobalFunVar`, console (`registerCommand`, `execute`), formatação (`formatMoney`, `formatNumber`), tradução (`translate`, `translateInline`, `isRTL`), som global |
| `Debug` | `Debug.info` (overlay por frame), `Debug.log` (histórico de scripts) e `Debug.toast` (fila de avisos) |
| `Util` | `collectFullRectTiles`, `collectRectTiles(x,y,w,h,noCorners)`, `color2hex`/`hex2color`, `rgb2hsv`/`hsv2rgb`, `optStorage(src,name,ctor)` e `unite(...)` |
| `Array` | Wrapper sobre `Array` JS com suporte a índice `-1`, `add`, `addAll`, `clear`, `contains`, `copy`, `count`, `exists`, `pick`, `remove`, `removeAt`, `removeIf`, `removeWhere`, `shuffle`, `sum` |
| `Vector` | Vetor 3D imutável `Vector(x,y,z)` com `copy`, `cross`, `dot`, `length`, `normalized` (usado no gerador 3D e disponível para plugins) |
| `string` | Helpers `contains`, `startsWith`, `endsWith`, `split`, `trim` |
| `DSA` | Stubs de compatibilidade `getSupplies()` e `isInMoon()` (expansão espacial fora do escopo padrão) |

Níveis de plugin: **A** JSON de dados (`data`, `template`, prédios, carros); **B** script JS na mesma thread (confiável, síncrono, um por vez \[API\], com `guard` de 5 erros); **C** Web Worker (só se houver galeria pública de terceiros).

---

## 4. Modelo de dados

### 4.1 Draft (molde) e instância

O dicionário `DRAFTS` vem de JSON (com suporte a `Draft.append` e `Draft.merge` durante o carregamento do script \[API\]).
- **Campos mínimos de prédio:** `id`, `unifiedId`, `type`, `size` `{w,h}`, `level` (`0` pobre, `1` médio, `2` rico), `buildHeight` (px/8), `power` e `water` (negativo = consome) \[API\], `capacity`, `depotCapacity` \[API\], `jobs`, `price`, `monthlyPrice`, `diamondPrice`, `needs` `{road, power, water, zone}`, `emits` `[{type, radius, strength}]`, `frames`, `previewFrames`, `frameTypes`, `render`, `pedestrian`, `tags`, `meta`, `scripts`, `upgrades`, `minPerformance` e `maxPerformance` \[API\], `ordinal`, `isFinal`, `isComposition`, `hidden` (`isVisible`/`setVisible`), `unlockedBy`.
- **30 tipos de prédio aceitos por `countBuildingsOfType`** \[API\]: `"residential"`, `"commercial"`, `"industrial"`, `"farm"`, `"harbor ind"`, `"harbor pier"`, `"park"`, `"sport"`, `"public"`, `"religion"`, `"award"`, `"energy"`, `"water"`, `"medic"`, `"police"`, `"swat"`, `"fire brigade"`, `"education"`, `"bus depot"`, `"destroyed"`, `"decoration"`, `"buoy"`, `"railway station"`, `"waste disposal"`, `"body disposal"`, `"military"`, `"airport"`, `"terrain"`, `"landmark"`, `"building"`.
- **Categorias de draft distinguidas pelo kernel** \[API\]: `building`, `road`, `road decoration`, `bus stop`, `tree`, `ground`, `fence`, `zone`, `pipe`, `wire`, `car`, `animation`, `category`, `data`, `template`, `rank`, `sound`, `script`.

### 4.2 Por tile (SoA, sem objeto por tile)

| Camada | Estrutura em Arrays Tipados / Mapas Esparsos |
| --- | --- |
| Prédio | `draft` Uint16, `pivot` Int32, `variant` Uint8 (`frame`), `flags` Uint16, `daysBuilt` Int16 (negativo = em obra \[API\]), `perf` Uint8 (`0..255` ↔ `0..1`) |
| Flags do prédio | `inConstruction`, `burning`, `abandoned`, `empty` (só RCI), `noPower`, `noWater`, `noRoad`, `ill`, `fullOfWaste`, `fullOfDeadPeople`, `untouchable`, `upgradePending`, `riot` |
| Metadados esparsos de prédio | `Map<pivotIdx, { name, text, icon, upgrades[], pendingUpgrade, animSlots[] }>` (cobre `setName`, `Building:setText`, `setBuildingIcon`, slots de animação e upgrades \[API\]) |
| Zona | `zone` Uint8 (draft id de zona), persiste sob o prédio mesmo após demolição ou incêndio \[API\] |
| Estrada (por nível) | `roadDraft` Uint8, `align` `0..15`, `oneWay` `0..63`, `dir` 4 bits (`1=E, 2=N, 4=W, 8=S`), `slopeDir` (`0,1,2,4,8`), `bridgeType`, `pile` bool, `busStop` Uint8, `occupation` Uint8, `traffic` Uint8 (`0..255` ↔ `0..1`), `carCount` Uint32, `chargeableCarCount` Uint32; `decos` e `animSlots` (base + `FG`) em `Map` esparso \[API\] |
| Fio e cano | `pipe` Uint8 (máscara 4 bits + draft); `wire` por níveis `-1` (subterrâneo), `0` (normal), `1` (alta tensão) com flag `wirePole` nos níveis `0` e `1` \[API\] |
| Cerca | `fence` Uint16 (4 arestas por tile: `0=SE, 1=NE, 2=NW, 3=SW`, mantendo invariante de aresta compartilhada com o vizinho \[API\]) |
| Terreno e Chão | `cornerHeight` `(N+1)x(N+1)` Uint8 (passo visual 12 px, oceano = `0`); `groundHeight` Int8 legado (sombra e profundidade da água); `ground` níveis `-1` (água), `0` (principal), `1` (decal/decoração), mais `treeDraft`/`treeFrame` \[API\] |

Storage esparso em `Map<key, objeto>` para prédio, estrada e carro, inicializado sob demanda com `Util.optStorage(src, name, ctor)`, mais `City.getStorage()`, `TheoTown.getStorage()`, `TheoTown.getFileStorage()` e `funVars` numéricas (locais da cidade e globais prefixadas com `!`) \[API\].

### 4.3 Migração e Índices 1-based

- Gerar os 27 drafts RCI (`3 tipos x 3 densidades x 3 níveis de riqueza 0..2`) por código, mais os serviços. `kind`, `lvl` e `cls` viram getters derivados do draft para manter compatibilidade com o código atual durante a transição.
- Manter listas indexadas incrementais para suportar os iteradores 1-based da API (`City.countBuildings(draft)` / `City.getBuilding(i, draft)`, `countRoads` / `getRoad`, `countPipes` / `getPipe`, `countWires` / `getWire`, `countZones`) sem varrer o mapa.
- Save v5 guarda ids de draft; conversor lê o v4 (`delta_city_v4`). Draft de plugin ausente vira `$missing`, preservando o save \[API: `Draft:isLoaded`\].

---

## 5. Regras de simulação extraídas da API

### 5.1 Ciclo de vida do prédio e wrapper `Building`

- **Funcionando (`isWorking`)** = tem estrada se precisar (`hasNeededRoad`), não está em construção (`daysBuilt >= 0`), não está vazio (`!isEmpty`), e tem energia e água se precisar \[API\]. É a única condição usada por empregos, impostos, emissão de influência e ícones.
- **Conexão viária dupla** \[API: `Building`, `Tile`\]: `hasRoad(x, y)` verifica se há rua adjacente; `hasNeededRoad(x, y)` retorna `true` se o prédio tem rua adjacente **ou** se o draft não exige rua.
- **Performance (`0..1`)**: escalar limitado por `minPerformance` e `maxPerformance` do draft \[API\]. Combina abastecimento, estrada, felicidade, imposto, lixo e doença. Quando cai abaixo do limiar por N dias, aciona `abandonBuilding(x, y)` (que esvazia o RCI: `isEmpty = true`) \[API\], substituindo o contador `nd` atual.
- **Intocável (`isUntouchable` / `setUntouchable`)**: impede que um prédio RCI seja substituído automaticamente pela evolução/regressão de zona \[API\]. Entra como interruptor no cartão de inspeção do prédio.
- **Nome, texto e ícone por instância**: `setName(name)`, `Building:setText(text)` e `setBuildingIcon(icon)` \[API\]. Ícones de alerta do próprio jogo têm precedência sobre o ícone customizado.
- **Animações por slot**: cada prédio e estrada pode pausar, retomar com multiplicador de velocidade (`resumeAnimation(slot, speed)`), trocar quadro (`setAnimationFrame`) e tingir (`setAnimationColor(r,g,b,a,slot)`) \[API\].

### 5.2 Demanda RCI por nível de riqueza

- Toda a contabilidade RCI é separada nos níveis `0` (pobre), `1` (médio) e `2` (rico) \[API\]: `City.getPeople(level)`, `City.getResidentialSpace(level, progress)`, `City.getCommercialJobs(level, progress)`, `City.getIndustrialJobs(level, progress)`. Quando `progress = true`, prédios em construção são incluídos na conta \[API\] (evitando superprodução de prédios do mesmo nível).
- O crescimento cruza a demanda global do nível com as influências locais `INFLUENCE_LEVEL_LOW`, `INFLUENCE_LEVEL_MIDDLE` e `INFLUENCE_LEVEL_HIGH` para decidir qual draft nasce ou evolui \[Inferência\].

### 5.3 Influências (26 mapas incrementais + 3 extras nossos)

Um array `Uint8Array(N * N)` por tipo, exposto em `0..1` por `Tile.getInfluence(type, x, y)` \[API\].
- **26 tipos da API:** `BODY_DISPOSAL`, `COMMERCIAL`, `CULTURE`, `DENSITY`, `EDUCATION_HIGH`, `EDUCATION_LOW`, `FIREDEPARTMENT`, `HEALTH`, `INDUSTRIAL`, `LEVEL_HIGH`, `LEVEL_LOW`, `LEVEL_MIDDLE`, `MANAGEMENT`, `NATURE`, `NOISE`, `PARK`, `PASSENGER_BUS`, `PASSENGER_TRAIN`, `POLICE`, `POLLUTION`, `RADIOACTIVITY`, `RELIGION`, `RESIDENTIAL`, `SPORT`, `TRAFFIC`, `WASTE_DISPOSAL`.
- **3 extras nossos \[Nosso\]:** `CRIME`, `PROTEST_RISK`, `LAND_VALUE`.
- **Implementação incremental:** máscara (kernel) circular pré-calculada por raio; ao construir/ativar um prédio soma-se o kernel (`O(r²)`), ao demolir/desativar subtrai-se, sem varrer o mapa inteiro. Reconstrução completa a cada N meses e no load para eliminar deriva.

### 5.4 Felicidade (13 indicadores visíveis + 2 ocultos + agregado)

- **13 indicadores visíveis (`City.getHappiness(type)`)** \[API\]: `EDUCATION`, `ENVIRONMENT`, `FIREDEPARTMENT`, `FREETIME`, `HEALTH`, `PARK`, `POLICE`, `RELIGION`, `SPORT`, `SUPPLY`, `TAXES`, `TRANSPORT`, `WASTE`.
- **Agregado e ocultos** \[API\]: `HAPPINESS_GENERAL` (média ponderada) e os ocultos `HAPPINESS_LEVEL` e `HAPPINESS_ZONE` (uso interno na evolução de lotes).
- Como a documentação alerta que `getHappiness(type)` é custoso e não deve rodar a cada frame \[API\], reavaliamos por amostragem diária em lotes e mantemos média móvel exponencial, com pesos configuráveis em draft `data` JSON \[Nosso\].

### 5.5 Impostos, orçamento e moedas

- **Matriz 3x3 de impostos:** `City.getTax(rci, level)` retorna `0..100`% \[API\], onde `rci` é `TAX_RESIDENTIAL`, `TAX_COMMERCIAL` ou `TAX_INDUSTRIAL`. **Atenção:** `getTax` exige `level` em **`1..3`**, enquanto `getPeople`/`getJobs`/`Draft:getLevel` usam **`0..2`** \[API\]. Internamente usamos `0..2` em todo o código e convertemos (`level - 1`) exclusivamente dentro de `City.getTax`.
- A regra de fuga de capital da Elite (> 18%) passa a ler `City.getTax(City.TAX_RESIDENTIAL, 3)`.
- `City.spendMoney(amount, x, y, budgetItem)` valida com `canSpend(amount)`, lança o valor na linha de orçamento correspondente (`budgetItem`) e, se `x, y` forem passados, exibe o texto vermelho flutuante na posição \[API\].
- Preços de construção (`Builder.get*Price`) variam no tempo conforme a inflação acumulada do Banco Central \[API + Nosso\].
- Suporte opcional a `City.getCurrency(name)` / `spendCurrency(name, amount)` e `TheoTown.formatMoney(amount, signed)`.

### 5.6 Progressão, Sandbox e Uber

- `City.getXp()` e `City.getRank()` (retorna `rankDraft, rankIndex` começando em 0) \[API\]. Subir de rank destrava novos drafts (`Draft:isUnlocked()`) e abre celebração.
- `City.isSandbox()` (obras instantâneas e gratuitas) e `City.isUber()` \[API\].

### 5.7 Serviços e capacidades

| Serviço | Contrato na API | Implementação no Delta City |
| --- | --- | --- |
| Polícia e SWAT | `INFLUENCE_POLICE`; `ACTIONPLACE_POLICE` e `ACTIONPLACE_SWAT`; ícones `crimegraffiti00`, `crimeburglary00`, `crimemurder00`, `crimeriot00` | Polícia atende crimes leves/médios; SWAT (`"swat"`) contém tumultos, greves e crimes graves |
| Bombeiros | `INFLUENCE_FIREDEPARTMENT`; `ACTIONPLACE_FIRE`; `isBuildingBurning`, `extinguishBurningBuilding` | Já funciona; expor pelo contrato de `Tile`/`Building` e `Car` |
| Saúde | `INFLUENCE_HEALTH`; `ACTIONPLACE_MEDIC`; `isBuildingIll`; `DISASTER_ILLNESS`; ícone `illness00` | Doença surge por poluição/lixo/corpos e espalha aos vizinhos; ambulância trata; hospital tem `capacity` |
| Lixo | `INFLUENCE_WASTE_DISPOSAL`; `ACTIONPLACE_GARBAGE`; `isBuildingFullOfWaste`; ícones `waste00` e `wasteoverloaded00` | Prédios geram lixo diariamente; caminhão de lixo coleta; aterro/incinerador tem capacidade |
| Corpos | `INFLUENCE_BODY_DISPOSAL`; `isBuildingFullOfDeadPeople`; ícones `deadbodies00` e `deadbodiesoverloaded00` | Mortalidade ligada a saúde/doença; carro funerário/crematório/cemitério com capacidade |
| Educação | `INFLUENCE_EDUCATION_LOW` e `INFLUENCE_EDUCATION_HIGH` | Separar em escola básica (`LOW`) e ensino médio/universidade (`HIGH`), exigido pela Elite |
| Lazer, Cultura, Religião, Esporte | `INFLUENCE_PARK`, `CULTURE`, `RELIGION`, `SPORT` e respectivas constantes `HAPPINESS_*` | Edifícios modulares em JSON com raio e manutenção mensal |
| Gestão | `INFLUENCE_MANAGEMENT` | \[Inferência\] Prefeitura/ministérios que aumentam a eficiência orçamentária |

Quando a demanda de um prédio de serviço ou transporte supera `Draft:getCapacity()`, ativa-se o ícone `$buildingicon_overloaded00` \[API\].

### 5.8 Energia, água e cidades vizinhas (`NeighborCity`)

- Fios em 3 níveis (`-1` subterrâneo sem poste, `0` aéreo normal com poste, `1` alta tensão com torre) \[API: `Tile.isWire`, `isWirePole`, `setWirePole`\].
- Componentes conexos mantidos incrementalmente, com oferta e demanda por sub-rede.
- `NeighborCity` \[API, experimental\]: `create(id, name)`, `get(id)`, `getNeighbors()`, com `get/setPower`, `getPowerExport` (positivo = exporta, negativo = importa), `get/setWater`, `get/setWasteDisposal` e `get/setBodyDisposal`. Conecta-se à tela `INFO_NEIGHBOR` para contratos mensais de importação/exportação.

### 5.9 Desastres (13 tipos)

- 13 constantes em `City` \[API\]: `DISASTER_FIRE`, `CRIME`, `RIOT`, `ILLNESS`, `FLOODING`, `EARTHQUAKE`, `TORNADO`, `METEOR`, `UFO`, `NUKE`, `BLIZZARD`, `GREEN_SLIME`, `PINK_SLIME`.
- `City.enableDisaster(name, state)`, `City.getDisaster()` (apenas um desastre maior ativo por vez) e `City.issueDisaster(name, x, y, radius, radioactive)`. `DISASTER_NUKE` preenche o mapa `INFLUENCE_RADIOACTIVITY`.

### 5.10 Tempo, aleatoriedade e agendador orçado

- Velocidades `0..4` (`0` pausa, `1` lenta, `2` normal, `3` rápida, `4` ultrarrápida) \[API: `City.setSpeed`\].
- `City.getDay()` (`1..30`), `getMonth()` (`1..12`), `getYear()` (`>= 1`), `getDayPart()` (`0..1`), `getAbsoluteDay()` e `getTime()` (ms de animação). Relógio contínuo: `getDay() + getDayPart()` \[API\].
- `City.hash(x, y)` (inteiro 32-bit positivo determinístico por cidade e coordenada) e `City.noise(x, y, z, w)` (`-1..1`) \[API\].
- Agendador com orçamento de ~3 ms/frame: `daily(x, y, level)` fatiado em fila circular; `random(x, y)` sorteado diariamente em número proporcional aos tiles da cidade \[API\].

---

## 6. Mobilidade

### 6.1 Estradas e níveis

- Cada tile suporta múltiplos níveis de estrada (`level = 0` solo; `level >= 1` ponte/viaduto; `level < 0` túnel), com `Tile.getRoadAbsoluteLevel(x, y, level)` \[API\].
- Atributos por `(x, y, level)`: alinhamento `0..15`, mão única `0..63` (`setRoadOneWayAlignment`), direção (`1=E, 2=N, 4=W, 8=S`), rampa (`isRoadSlope`, `getRoadSlopeDirection`), pilar (`isRoadPile`), tipo de ponte (`getRoadBridgeType`), decorações (`getRoadDeco`, `countRoadDecos`), ocupação (`getRoadOccupation`) e animações em duas camadas (base e `FG`) \[API\].
- Preço de ponte escala com a altura (`Draft:getBridgePrice`), e túnel usa `Draft:getTunnelPrice` \[API\].

### 6.2 Tráfego e pedágio

- `Tile.getRoadTraffic(x, y, level)` em `0..1` alimenta `INFLUENCE_TRAFFIC` e `INFLUENCE_NOISE` e reduz a velocidade efetiva dos carros (`car:getEffectiveSpeed()`).
- `Tile.getRoadCarCount` e `Tile.getRoadChargeableCarCount` acumulam o total de veículos e de veículos pagantes que entraram no tile \[API\], permitindo cabines de pedágio em scripts.
- `City.isLeftSideTraffic()` / `setLeftSideTraffic(bool)` inverte o deslocamento lateral das faixas \[API\].

### 6.3 Carros inteligentes (`Car`)

- `Car.spawn(carDraft, startX, startY, targetX, targetY, frame, storage, startLevel, targetLevel)` enfileira o pedido de forma assíncrona \[API\]. Se `storage` (tabela serializável sem funções) for passado, o veículo nasce como **smart car** pertencente ao draft que o chamou (*car ownership*).
- Ciclo de vida nos scripts do draft dono \[API\]: `onCarSpawned(car)` → `onCarFoundWay(car)` ou `onCarFoundNoWay(car)` → `onCarReached(car)` → `onCarDespawned(car)`, ou `onCarNotSpawned(storage)` se falhar antes de nascer. Além disso, prédios com spawner recebem `EVENT_CAR_SPAWNED`, `EVENT_CAR_REACHED` e `EVENT_CAR_DESPAWNED` em `script:event` \[API\].
- Métodos de `car` \[API\]: `driveTo(x, y, level)`, `wait()` (pausa brevemente e volta a chamar `onCarReached`), `despawn()`, `get/setSpeed(factor)`, `getEffectiveSpeed()`, `get/setFrame(f)`, `setColor(hex, tailIndex)` (`-1` = comboio todo, `0` = líder), `getDir()` (`1=SE, 2=NE, 4=NW, 8=SW`), `getX/Y/Level/XY()`, `getCapacity()` (soma líder + cauda), `addTail(draft, pos, frame)`, `removeTail(pos)`, `removeWholeTail()`, `tailSize()`, `getTailDraft(pos)`, `get/setTailFrame(pos, frame)`, `isValid()`, `openFollowTool()`.
- Serviço de caminhos \[Nosso\]: campos de distância em cache por base (BFS multi-fonte invalidado por `roadVersion`) + fila A\* com orçamento por frame.

### 6.4 Ônibus, trem e pedestres

- `Builder.buildBusStop(draft, x, y, level)` / `Tile.isBusStop` / `getBusStop` / `removeBusStop` \[API\]. Garagens usam `Draft:getDepotCapacity()`.
- Pedestres \[API\]: `Tile.spawnBuildingPedestrian(x, y, amount)` alimenta uma fila leve de pedestres visuais nas calçadas vizinhas.

---

## 7. Terreno, mundo e ferramentas de área

- **Altura por canto** \[API\]: matriz `(N+1)x(N+1)` lida por `Tile.getCornerTerrainHeight(x, y)`. `Tile.isFlat(x, y)` é verdadeiro quando os 4 cantos têm a mesma altura; caso contrário `Tile.isSlope(x, y)` é verdadeiro. Edifícios exigem terreno plano ou cobram terraplenagem (`Builder.getTerrainHeightPrice` / `setTerrainHeight`).
- **Chão em 3 níveis** \[API: `Tile.getGroundDraft(x, y, level)`\]: `-1` água, `0` terreno principal, `1` decal/decoração (removível com `Builder.removeGround(x, y)`). `Tile.isCoast(x, y)` detecta terra ortogonalmente vizinha à água.
- **Cercas nas arestas** \[API\]: `Builder.buildFence(fence, x, y, edge)`, `buildFenceAround(fence, x, y, w, h)`, `removeFence`, `removeFenceWithin`, `Tile.getFenceDraft`, `hasFence`, `hasFenceWithin` (arestas `0=SE, 1=NE, 2=NW, 3=SW` compartilhadas com o tile vizinho).
- **Geometria de retângulos (`Util`)** \[API\]: `Util.collectFullRectTiles(x, y, w, h)` e `Util.collectRectTiles(x, y, w, h, noCorners)` unificam a seleção de área cheia e de borda/anel.
- **Geração de mapa em 2 fases** \[API\]: `enterCityGeneration(0)` (terreno/água/elevação) e `enterCityGeneration(1)` (florestas/decoração), seguidas de `leaveCityGeneration(phase)`, usando `City.hash` e `City.noise`.

---

## 8. Renderização restante e módulo `Drawing`

1. **Dia e noite por composição e `frameType`** \[API: `Drawing.getDaytime`, `getDaytimeColor`, `allocateFrameType`, `setFrameType`\]:
   - Desenhar a cena base em luz neutra, compor a iluminação do horário (`getDaytimeColor`) e aplicar a máscara emissiva para frames cujo `frameType` indique emissão noturna (`0..64` reservados pelo motor, `65..255` alocáveis por plugins via `allocateFrameType()`), eliminando o loop JS por pixel da tela inteira.
2. **Camada dinâmica de animações de prédio e estrada `FG`**:
   - Separar animações grandes (fumaça densa, guindaste, bandeiras) e animações `FG` de estrada (semáforos nos cruzamentos, cancelas) dos bitmaps estáticos de chunk/sprite.
3. **Rampas e `drawTileFrame`** \[API\]:
   - Projetar os 4 cantos de altura do tile no losango isométrico e implementar `Drawing.drawTileFrame(frame)` para desenhar zonas, cursores, estradas e decals distorcidos corretamente sobre encostas.
4. **Implementação completa de `Delta.Drawing` para plugins e UI** \[API\]:
   - Estado: `reset`, `setColor`/`getColor` (multiplicativo, aceita RGB ou hex), `addColor` (aditivo), `adjustColor` (adapta cor de light mode para dark mode), `setAlpha`/`getAlpha`, `setAdditive`/`getAdditive`, `setScale`/`getScale`, `getSize`, `setClipping`/`resetClipping`, `setTile`, `flush`, `setUniform`.
   - Primitivas: `drawImage`, `drawImageRect`, `drawNinePatch(frame,x,y,w,h,sparse)`, `drawQuad`, `drawTriangle`, `drawRect`, `drawLine(x0,y0,x1,y1,width)`, `drawCircle(x,y,w,h,fillRatio,startAngle,endAngle)` e `getImageSize`/`getImageHandle`.
   - Texto e Flow Layout: `setFont`, `drawText(text,x,y,font,centerX,centerY)`, `getTextSize`, `setTextFrame(x,y,w,h)`, `flowText(text)`, `flowImage(frame)`, `nl(spacing)` e `getFlowHeight()`.
5. **Ganchos de desenho de `Script`** \[API\]: `beforeToolDrawing`, `afterToolDrawing`, `draw(x, y, level)` (ou `draw(x, y, tx, ty)` para ferramentas customizadas), `drawCity()`, `update()` (abaixo da UI) e `overlay()` (acima da UI, inclusive fora da cidade).
6. **Ícones de status completos**: desenhar os 14 ícones da seção 2.5 por ordem de prioridade (fogo > tumulto/crime > doença > corpos > lixo > sem estrada > sem energia > sem água > sobrecarregado > infeliz > customizado).

---

## 9. Interface restante e módulo `GUI`

1. **Árvore de widgets `Delta.GUI`** \[API\]:
   - `GUI.getRoot()` (painel raiz cujo padding reflete `env(safe-area-inset-*)`), `GUI.get(id)` (com ids nos elementos principais do HUD) e `GUI.isDarkMode()`.
   - Construtores em qualquer container: `addPanel`, `addLayout`, `addLabel`, `addButton`, `addIcon`, `addListBox`, `addSlider`, `addTextField`, `addTextFrame`, `addCanvas`.
   - Métodos de instância: `get/setPosition`, `get/setSize`, `getClientWidth/Height`, `get/setPadding`, `getParent`, `getAbsoluteParent`, `getAbsoluteX/Y`, `countChildren`, `getChild`, `get/setChildIndex`, `delete`, `isValid`, `is/setVisible`, `is/setEnabled`, `is/setActive`, `isMouseOver`, `get/setText`, `get/setFont`, `get/setIcon`, `get/setId`, `setShowBorder`, `get/setShiftY`, `setTouchThrough`, `getTouchPoint` (`x, y, firstX, firstY, speedX, speedY, time`), `addHotkey`/`removeHotkey` e `layout()`.
2. **Diálogos padronizados da API** \[API\]:
   - `GUI.createDialog(args)`, `GUI.createMenu(args)`, `GUI.createRenameDialog(args)` (com validação `filter(val)`), `GUI.createSelectDraftDialog(args)` (usado para escolher espécies de árvores ou variantes de drafts) e `GUI.showColorPicker(args)`.
3. **As 13 telas de informação (`City.openInfo`)** \[API\]:
   - Dividir o modal atual nas 13 constantes `INFO_*`: `GENERAL`, `BUDGET`, `RCI`, `EDUCATION`, `HEALTH`, `ENERGY`, `WATER`, `LOAN`, `NEIGHBOR`, `RANK`, `RATING`, `STATISTICS`, `AIRPORT`.
4. **Notificações ricas e Marcadores de Ação** \[API\]:
   - `City.showNotification{ icon, text, title, important, question, optionOk, closeable, locationX, locationY, immersive, onOk, onCancel, onClose, actions }` e `City.alert(actionPlaceType, x, y)` para os 5 `ACTIONPLACE_*` (`FIRE`, `GARBAGE`, `MEDIC`, `POLICE`, `SWAT`) com botão de ir para o local.
5. **Menu de construção com `City.createDraftDrawer`** \[API\]:
   - Objeto drawer com `getWidth/Height`, `getTitle/Text`, `getPrice/MonthlyPrice/DiamondPrice`, `isActive`, `isSelectable`, `hasFrames`, `nextFrame`/`prevFrame`, `select`, `markAsUsed` (remove selo "Novo"), `draw(x,y,w,h)` e `getHistory()` (últimos drafts usados), mais `City.rebuildUI()`.
6. **Cartão de inspeção extensível**: chama `script:finishInformationDialog(x, y, lvl, dialog)` \[API\] para que scripts anexados ao prédio/estrada adicionem linhas ou botões (como interruptor de `untouchable`, upgrades e classe social).
7. **Câmera e Som** \[API\]: `City.getView()` / `setView(x, y, scale, adjustY)`, `City.move(dx, dy)`, `get/setScale`, `get/setRotation`, `City.playSound(sound, x, y, volume, loop)` e `TheoTown.playSound(sound, volume, loop)`.

---

## 10. Scripts, Runtime, Debug e Utilitários

- **Ordem exata do ciclo de vida** \[API: `Script`, `00-intro.md`\]:
  `earlyInit` → `init` → `lateInit` → `load` → `finishLoading` → (`enterStage` / geração: `enterCityGeneration(0)` → `leaveCityGeneration(0)` → `enterCityGeneration(1)` → `leaveCityGeneration(1)`) → `enterCity` → `buildCityGUI`.
  Em jogo: `update` (por frame, antes da UI), `overlay` (por frame, sobre a UI), `nextDay`, `nextMonth`, `nextYear`, `daily(x, y, level)`, `random(x, y)`.
  Ao salvar/sair: `save` → `leaveCity` → `leaveStage` → `unload` / `exit`.
- **Ordem de toque no mapa** \[API: `Script`\]:
  `earlyTap(tileX, tileY, x, y)` (retornar `false` veta a ferramenta atual) → execução da ferramenta → `tap(tileX, tileY, x, y)` → se a ferramenta não tratou, `clickAny(tileX, tileY)` (retornar `false` interrompe) → `click(x, y, level)` no draft do prédio/estrada (ou da custom tool onde `isBuildable` foi `true`; retornar `false` veta o diálogo padrão do tile).
- **Eventos de instância e ferramenta (`script:event`)** \[API\]:
  `EVENT_PLACED`, `EVENT_FINISHED`, `EVENT_UPGRADE`, `EVENT_ALIGNED`, `EVENT_REPLACED` (undo/redo), `EVENT_REMOVE` (usar `Runtime.postpone` para evitar cascata!), `EVENT_CAR_SPAWNED`, `EVENT_CAR_REACHED`, `EVENT_CAR_DESPAWNED`, `EVENT_TOOL_ENTER`, `EVENT_TOOL_LEAVE`.
- **Listeners dinâmicos** \[API, instável\]: `City.addBuildingListener{ draft, added, finished, upgraded, removed }` e `City.addRoadListener{ draft, added, removed }` (registrados em `enterCity`).
- **Módulos de suporte (`Runtime`, `Debug`, `Util`, `Array`, `Vector`, `TheoTown`)** \[API\]:
  - `Runtime.postpone(fn, delayMS)` com atraso em ms, `toJson`/`fromJson`, `getTime()`, `getUuid()`.
  - `Debug.info(...)` (acumula linhas por frame e exibe no overlay de performance), `Debug.log(...)`, `Debug.toast(...)` (fila com tempo mínimo de exibição).
  - `Util.optStorage`, `Util.unite`, conversores RGB/HSV/Hex e coletores de retângulos de tiles.
  - `TheoTown.translate` / `Translation`, `translateInline`, `formatMoney`, `formatNumber`, `registerCommand` (aceita string ou função predicado!) e `execute(cmd, receiver)`.

---

## 11. Persistência e versionamento

- **6 escopos de storage** \[API\]: cidade (`City.getStorage`), prédio (`Tile.getBuildingStorage`), estrada (`Tile.getRoadStorage`), carro (`car:getStorage`), global do jogo (`TheoTown.getStorage`) e arquivo persistente (`TheoTown.getFileStorage`), mais variáveis numéricas `funVar` (`City.get/setFunVar` e `TheoTown.get/setGlobalFunVar` com `!`).
- **Serialização segura:** nenhuma função pode ser guardada em `storage` \[API\]; camadas tipadas salvas em RLE + base64 no save `v5`, com migrador automático de `v4` → `v5`.
- `City.save(enforce)` nunca deve ser chamado diretamente dentro de um callback de evento, devendo passar por `Runtime.postpone` \[API\].

---

## 12. Roteiro revisado em 9 fases

Cada fase mantém o jogo funcionando e possui critério objetivo de aceitação:

| Fase | Entrega | Critério de Aceitação |
| --- | --- | --- |
| **1** | **Kernel de Drafts, `Building`, `Util`/`Array`/`Vector` e Grade SoA v5:** registro `DRAFTS` (`append`/`merge`), 27 drafts RCI + serviços, camadas SoA com flags completas e metadados esparsos (`name`, `text`, `icon`, `upgrades`), iteradores 1-based (`getBuilding`/`getRoad`/`getPipe`/`getWire`), `Util.optStorage`, save v5 com conversor v4 | Jogo idêntico ao atual; save v4 abre e converte para v5; `Tile.getBuilding(x,y)` e `Draft.getDraft(id)` operacionais |
| **2** | **Ciclo de vida completo de `Script`, `Builder`, `Runtime` (`delayMS`) e `Debug`:** ordem de eventos (`earlyInit`..`enterCity`), ordem de toque (`earlyTap`..`click`), `EVENT_*`, listeners de prédio/estrada, `Builder.build*/remove*/is*Buildable/get*Price`; Banco Central e Protestos extraídos para plugins internos | Mesmos resultados nos testes de inflação, juros e protestos; `Debug.info` visível no overlay; eventos de remoção usam `postpone` sem cascata |
| **3** | **Simulação escalável:** 26 mapas de influência incrementais (+ 3 extras), 13 indicadores de felicidade amostrados, `performance` do prédio (`0..1`), demanda RCI e empregos por nível (`0..2` com `progress`), matriz de impostos 3x3 (`getTax` com conversão `1..3`), agendador fatiado (≤ 3 ms) e velocidade 4 | Simulação ≤ 3 ms/frame em mapa 96x96; mapas de calor lendo diretamente dos arrays de influência |
| **4** | **Novos serviços e desastres:** coleta de lixo, descarte de corpos, saúde/doença com contágio, SWAT, crime em 4 níveis, educação baixa/alta, lazer/cultura/religião/esporte, 13 desastres (`enable`/`issue`/`getDisaster`), 14 ícones de prédio e 5 `ACTIONPLACE_*` | Cada um dos 14 ícones aparece conforme a regra da seção 5.1; `issueDisaster` testado via console para todos os tipos |
| **5** | **Mobilidade avançada e Smart Cars:** estradas com níveis/pontes/mão única/pedágio e animações `FG` (semáforos vivos fora do chunk estático), campo de distâncias por base + A\*, `Car.spawn` assíncrono com callbacks (`onCarReached`, `wait`, `driveTo`, `addTail`), tráfego `0..1`, paradas de ônibus e pedestres (`spawnBuildingPedestrian`) | Sem alocação de arrays no tick; SWAT contém tumulto via script de smart car; semáforos animam sem invalidar chunks |
| **6** | **Economia profunda, Progressão e Vizinhos:** `spendMoney` com `budgetItem` e preço flutuante, preços dinâmicos por inflação, empréstimos (`INFO_LOAN`), XP, ranks (`getRank`) e desbloqueio (`isUnlocked`), modo sandbox, `NeighborCity` (comércio de energia, água, lixo e corpos) e `TheoTown.formatMoney`/`formatNumber` | Tela de orçamento detalhada por item; subida de rank destrava novos drafts; contrato com cidade vizinha cobre déficit |
| **7** | **Terreno por cantos, Cercas e Geração em 2 fases:** `cornerHeight` `(N+1)x(N+1)`, `isFlat`/`isSlope`/`isCoast`, terraplenagem paga, chão em 3 níveis (`-1, 0, 1`), cercas nas 4 arestas com `Util.collectRectTiles`, árvores como drafts e geração em fases 0 e 1 com `hash`/`noise` | Prédios exigem terreno plano ou cobram nivelamento; cercas compartilham arestas entre tiles vizinhos; seed reproduz o mapa |
| **8** | **Renderizador final e módulo `Drawing`:** dia/noite por composição (`getDaytimeColor`) e máscara emissiva por `frameType`, `drawTileFrame` em rampas, pipeline completo de `Drawing` (incluindo `drawNinePatch`, `drawCircle`, `adjustColor` e flow text/image) e ganchos `draw`/`drawCity`/`overlay`/`beforeToolDrawing` | Render ≤ 8 ms/frame em celular intermediário; sem loop JS de escurecimento pixel a pixel na tela cheia |
| **9** | **Árvore `GUI`, 13 telas `INFO_*`, `createDraftDrawer` e Loader de Plugins:** `GUI.getRoot` (safe area), 10 tipos de widgets, 5 diálogos (`createRenameDialog`, `createSelectDraftDialog`, `showColorPicker`), `showNotification`, `createDraftDrawer` com histórico e selo "Novo", `translateInline` e loader de plugins JSON + JS | Plugin de exemplo adiciona categoria, prédio com upgrade, smart car, botão na GUI e painel próprio sem tocar no núcleo |

**Metas de desempenho:** 60 fps em mapa 96x96 em celular intermediário; orçamento por frame de 16,6 ms (`render ≤ 8 ms`, `sim ≤ 3 ms`, `ui ≤ 2 ms`); caches limitados a 112 MB (64 MB de chunks + 48 MB de sprites).

---

## 13. Riscos, particularidades da API e decisões em aberto

- **Fidelidade vs. código fechado:** a API documenta todas as assinaturas e constantes, mas não expõe os pesos internos da felicidade, a equação exata de demanda RCI nem as taxas de geração de lixo/doença. Esses parâmetros ficam isolados num draft `data` JSON de balanceamento \[Nosso\].
- **Inconsistência de índice em `City.getTax(rci, level)`** \[API\]: `getTax` exige `level` de **1 a 3**, enquanto todo o resto da API usa **0 a 2** (e listagens/slots usam **1 a N**). Concentraremos essa conversão num único ponto na fachada `City`.
- **Recursos marcados como instáveis/experimentais na API:** `City.addBuildingListener`, `City.addRoadListener`, `City.exit` e o módulo `NeighborCity` têm aviso explícito de instabilidade na documentação; serão encapsulados para fácil adaptação.
- **Módulo `DSA` (Estação Espacial / Lua):** documentado com 2 funções (`getSupplies`, `isInMoon`), mantido apenas como stub para não inflar o escopo urbano.
- **Rotação de câmera (`0..3`):** multiplica o cache de sprites e chunks por 4; só deve entrar na Fase 8 se você quiser rotação de mapa.

**Decisões arquiteturais definidas para a implementação inicial:**

1. **Ordem de execução e arquitetura base (Prioridade Máxima):** foco imediato nas Fases 1 e 2 + núcleo de terreno da Fase 7, com inicialização determinística em máquina de estados (`earlyInit` → `init` → `lateInit` → `load` → `finishLoading` → `enterCityGeneration(0/1)` → `enterCity` → `buildCityGUI`), sem race conditions, vazamentos de memória ou acoplamento cíclico.
2. **Geração imediata de edifícios de grande porte (`2x2` e `3x3`):** suporte nativo a estruturas multi-tile via pivô (`pivot`, `bSize`, `Building.getWidth/getHeight`) e instanciação imediata de arranha-céus (`2x2` e `3x3`) e marcos visuais (*landmarks*) já na inicialização da cidade (`starter()`) e no menu de construção, além de coalescência automática em zonas de alta densidade.
3. **Sistema avançado de geração e renderização de terreno 3D (Foco Central):** malha de elevação por cantos `(N+1)x(N+1)` (`cornerH`, `0000`–`1111`), FBM multi-oitava com *Domain Warping*, *Ridged Multifractal* e bacias hidrográficas, iluminação lambertiana por vetor normal da encosta (`Delta.Vector`), curvas de nível (*contour lines*), saias rochosas estratificadas, *Frustum Culling* 3D, chunking inteligente 8x8 com invalidação por assinatura e 3 níveis de LOD para 60 FPS estáveis.
4. **Escopo e adiamento de módulos:** o sistema de cidades vizinhas (`NeighborCity`) e redes de apoio externo fica adiado (mantido apenas como stub limpo de compatibilidade da API) para concentrar 100% na fundação do motor, terreno procedural 3D e edifícios principais.
