# 04 — Estado Global, Simulação Urbana e Economia (`Delta.Game`)

> **Propósito:** Documentar exaustivamente a estrutura de estado da classe `Game` (`L224–L922`), todas as tabelas de constantes de balanceamento (`FAC`, `POPCAP`, `JOBC`, `JOBI`, `CAPM`, `TAXM`), os algoritmos de rede elétrica/hídrica e cobertura radial (`recalc`), fórmulas de valor da terra, classe social, felicidade, demanda RCI, aprovações políticas, fechamento mensal (`monthTick`), crescimento e coalescência de arranha-céus (`growth`), protestos/greves (`riotDay`), incêndios (`fireDay`), crimes (`crimeDay`) e tráfego/viaturas (`dispatch`, `moveVehicles`, `spawnCars`).
> **Referência cruzada:** Ferramentas de construção e `cost1`/`place` estão em `05_TOOLS_AND_PLACEMENT.md`.

---

## 1. Tabelas Estáticas de Balanceamento (`L92–L134`)

### 1.1 Enumeradores `BIO`, `K` e Nomes `KN` (`L92–L101`)
- **`BIO`:** `{ WATER: 0, PLAIN: 1, FOREST: 2, HILL: 3 }`.
- **`K` e `KN`:**

| `K` (Chave) | Código | `KN[k]` (Nome Oficial) | Categoria Funcional | Pegada (`sz`) | Precisa de Rua (`Draft.needsRoad`, `L198`) |
|---|---|---|---|---|---|
| `NONE` | `0` | `'Vazio'` | Terreno livre | — | — |
| `ROAD` | `1` | `'Rua'` | Via de transporte | `1×1` | `true` |
| `RES` | `2` | `'Residencial'` | Zona 1×1 (`isZone`) | `1×1` | `true` |
| `COM` | `3` | `'Comercial'` | Zona 1×1 (`isZone`) | `1×1` | `true` |
| `IND` | `4` | `'Industrial'` | Zona 1×1 (`isZone`) | `1×1` | `true` |
| `PARK` | `5` | `'Parque'` | Lazer | `1×1` | `false` |
| `POLICE` | `6` | `'Delegacia'` | Serviço + Base de viaturas | `1×1` | `true` |
| `FIRE` | `7` | `'Bombeiros'` | Serviço + Base de caminhões | `1×1` | `true` |
| `HOSP` | `8` | `'Hospital'` | Serviço | `1×1` | `true` |
| `SCHOOL` | `9` | `'Escola'` | Serviço | `1×1` | `true` |
| `COAL` | `10` | `'Usina a carvão'` | Energia | `1×1` | `false` |
| `SOLAR` | `11` | `'Usina solar'` | Energia | `1×1` | `false` |
| `WTOWER` | `12` | `'Torre de água'` | Água | `1×1` | `false` |
| `SKY_RES` | `13` | `'Condomínio Imperial (2x2)'` | Marco / Arranha-céu (`isSky`) | `2×2` | `true` |
| `SKY_COM` | `14` | `'Torre Corporativa (2x2)'` | Marco / Arranha-céu (`isSky`) | `2×2` | `true` |
| `MEGA` | `15` | `'Mega Center Delta (3x3)'` | Marco / Arranha-céu (`isSky`) | `3×3` | `true` |
| `LANDMARK` | `16` | `'Torre Panorama (2x2)'` | Marco / Arranha-céu (`isSky`) | `2×2` | `true` |

### 1.2 Tabela de Instalações e Marcos (`FAC`, `L103–L109`)

| `k` (`K`) | `sz` | `up` ($/mês) | `r` (Raio) | `pow` (MW) | `wat` (L) | `pop` | `jobs` | `pw` (Demanda MW) | `wt` (Demanda L) |
|---|---|---|---|---|---|---|---|---|---|
| `5` (`PARK`) | `1` | `4` | `6` | — | — | — | — | `0` | `0` |
| `6` (`POLICE`) | `1` | `30` | `12` | — | — | — | — | `3` *(fixo em L622)* | `0` |
| `7` (`FIRE`) | `1` | `30` | `12` | — | — | — | — | `3` *(fixo em L622)* | `3` *(fixo em L623)* |
| `8` (`HOSP`) | `1` | `60` | `14` | — | — | — | — | `3` *(fixo em L622)* | `3` *(fixo em L623)* |
| `9` (`SCHOOL`) | `1` | `40` | `12` | — | — | — | — | `3` *(fixo em L622)* | `0` |
| `10` (`COAL`) | `1` | `80` | — | `320` | — | — | — | `0` | `0` |
| `11` (`SOLAR`) | `1` | `14` | — | `85` | — | — | — | `0` | `0` |
| `12` (`WTOWER`) | `1` | `25` | — | — | `220` | — | — | `0` | `0` |
| `13` (`SKY_RES`) | `2` | `35` | — | — | — | `240` | — | `14` | `14` |
| `14` (`SKY_COM`) | `2` | `45` | — | — | — | — | `210` | `18` | `14` |
| `15` (`MEGA`) | `3` | `110` | `14` | — | — | — | `480` | `36` | `28` |
| `16` (`LANDMARK`)| `2` | `40` | `16` | — | — | — | `65` | `10` | `6` |

### 1.3 Capacidades RCI por Nível e Multiplicadores por Classe (`L133–L134`)
- **Capacidade por Nível ($\text{lvl} \in \{1, 2, 3\}$, indexado por $\text{lvl} - 1$):**
  - `POPCAP = [8, 20, 48]` (Residencial 1×1 base)
  - `JOBC = [6, 15, 34]` (Comercial 1×1)
  - `JOBI = [10, 24, 50]` (Industrial 1×1)
- **Multiplicadores por Classe Social ($\text{cls} \in \{0, 1, 2\}$):**
  - `CLSN = ['Pobre', 'Média', 'Elite']`
  - `CAPM = [1.4, 1.0, 0.6]` (Multiplicador de população residencial: prédios pobres abrigam $+40\%$, elite $-40\%$)
  - `TAXM = [0.6, 1.0, 2.2]` (Multiplicador de arrecadação fiscal R e C: elite paga $2.2\times$ por habitante/emprego)

---

## 2. Schema Completo da Instância `Game` (`L225–L246`)

### 2.1 Propriedades Escalares e Objetos de Controle
| Propriedade | Tipo | Valor Inicial (`new Game`) | Persistido em `toJSON`? | Descrição |
|---|---|---|---|---|
| `name` | `string` | `o.name \|\| 'Delta City'` | **Não** | Nome da cidade |
| `N` | `number` | `o.size \|\| 48` | Sim | Lado do mapa em tiles ($n = N^2$, $cn = (N+1)^2$) |
| `seed` | `number` | `(o.seed ?? Date.now() & 0xffffff) >>> 0` | Sim | Semente mestra sem sinal de 32 bits |
| `rs` | `number` | `seed` | Sim | Estado corrente do PRNG `rand()` |
| `type` | `string` | `o.type \|\| 'continent'` | Sim | `'continent' \| 'island' \| 'river' \| 'lake'` |
| `funds` | `number` | `28000` | Sim | Caixa atual da prefeitura em `$` |
| `day`, `month`, `year` | `number` | `1`, `1`, `2026` | Sim | Calendário ($30$ dias/mês, $12$ meses/ano) |
| `tod` | `number` | `0.32` | Sim | Hora do dia normalizada $[0, 1)$ |
| `speed` | `number` | `1` | Sim | Índice em `SPEEDS = [0, 1, 2, 4, 8]` |
| `acc` | `number` | `0` | **Não** | Acumulador de milissegundos simulados para `dayTick` |
| `anim` | `number` | `0` | **Não** | Contador contínuo de animação ($+\text{dt}/250$) |
| `tax` | `{r, c, i}` | `{ r: 10, c: 10, i: 10 }` | Sim | Alíquotas de imposto em % ($[0, 30]$ na UI) |
| `interest` | `number` | `8` | Sim | Taxa básica de juros (Selic) anual em % ($[1, 25]$) |
| `inflation` | `number` | `4` | Sim | Inflação anualizada em % ($[0, 40]$) |
| `apP`, `apR` | `number` | `62`, `64` | **Não** *(recalculado)* | Aprovação dos Pobres e da Elite ($[0, 100]$) |
| `strikes`, `nProt` | `number` | `0`, `0` | **Não** | Fábricas em greve e bairros residenciais em protesto |
| `popC` | `[number,number,number]` | `[0, 0, 0]` | **Não** *(recalculado)* | População total por classe `[Pobre, Média, Elite]` |
| `flight` | `number` | `0` | **Não** | Lotes da Elite abandonados no mês corrente |
| `demand` | `{r, c, i}` | `{ r: 0.4, c: 0.3, i: 0.3 }` | Sim | Demanda RCI suavizada em $[-1, 1]$ |
| `pop`, `jobs`, `happy` | `number` | `0`, `0`, `68` | **Não** *(recalculado)* | População total, empregos totais e felicidade média |
| `crimeIdx` | `number` | `0` | **Não** | Índice de risco criminal médio ($[0, 100]$) |
| `income`, `expense`, `unemp` | `number` | `0`, `0`, `0` | **Não** | Receita/despesa do último mês e taxa de desemprego $[0, 1]$ |
| `last` | `{tr,tc,ti,up,rent,debt}` | todos `0` | Sim | Detalhamento contábil do último mês fechado |
| `cx`, `cy` | `number` | `N >> 1`, `N >> 1` | Sim | Posição atual do cursor em tiles |
| `cat`, `item` | `number` | `0`, `0` | **Não** | Categoria e índice da ferramenta selecionada em `CATS` |
| `sel`, `preview` | `Object \| null` | `null`, `null` | **Não** | Seleção ativa e prévia de custo/validação |
| `msg` | `string` | `'Bem-vindo a Delta City!...'` | **Não** | Mensagem exibida no `#toast` |
| `logs` | `Array<{t,m,lvl}>` | `[]` | **Não** | Histórico de até 40 mensagens |
| `hist` | `{pop,funds,happy,inf}` | `{ pop:[], funds:[], happy:[], inf:[] }` | Sim | Séries históricas mensais (máx. 60 meses) |
| `over` | `boolean` | `false` | **Não** | Flag de fim de jogo por falência |
| `dirty`, `sinceCalc` | `boolean`, `number` | `true`, `0` | **Não** | Controle de disparo de `recalc()` no `dayTick` |
| `stats` | `{solved,lost,fires}` | `{ solved: 0, lost: 0, fires: 0 }` | Sim | Contadores acumulados da partida |
| `pwS, pwD, wtS, wtD` | `number` | `0` | **Não** *(recalculado)* | Oferta (`S`) e demanda (`D`) de energia e água |
| `builtCount, roads` | `number` | `0` | **Não** *(recalculado)* | Total de edifícios construídos e tiles de rua |
| `nRes, nCom, nInd` | `number` | `0` | **Não** *(recalculado)* | Contagem de origens construídas por setor |
| `emR, emC, emI` | `number` | `0` | **Não** *(recalculado)* | Contagem de lotes de zona vazios por setor |
| `terrainVer` | `number` | `1` | **Não** | Contador de versão da topografia (invalida chunks) |

### 2.2 Os 28 Arrays Tipados por Tile (`U8`, `Uint8Array(N * N)`, `L221`, `L235`)
Todos os 28 arrays abaixo são salvos e restaurados em `toJSON` / `fromJSON`:
1. `bio`: bioma (`0..3`).
2. `kind`: tipo de construção (`0..16`).
3. `lvl`: nível (`0..3`).
4. `vr`: variante visual (`0..255`).
5. `built`: `1` se construído, `0` se vazio.
6. `pw`: `1` se possui fio elétrico.
7. `pipe`: `1` se possui cano d'água.
8. `pwOn`: `1` se energizado no último `recalc`.
9. `wtOn`: `1` se abastecido com água no último `recalc`.
10. `fire`: intensidade de incêndio (`0..255`).
11. `nd`: dias consecutivos sem rua/energia/água (`0..4`).
12. `ab`: `1` se abandonado.
13. `cr`: mancha de criminalidade local (`0..40`).
14. `roadAdj`: `1` se conectado a rua.
15. `cPol`: cobertura policial (`0..100`).
16. `cFir`: cobertura de bombeiros (`0..100`).
17. `cHea`: cobertura de saúde (`0..100`).
18. `cEdu`: cobertura educacional (`0..100`).
19. `cPar`: cobertura de parques/marcos (`0..100`).
20. `poll`: nível de poluição (`0..100`).
21. `land`: valor do solo (`0` na água, `5..100` em terra).
22. `hap`: felicidade do lote (`0..100`).
23. `cls`: classe social (`0` Pobre, `1` Média, `2` Elite).
24. `riot`: `1` se em protesto ou greve.
25. `riotT`: duração do protesto (`1..250`) ou cooldown pós-protesto (`8` ou `15` até `0`).
26. `bSize`: tamanho da pegada no tile pivô (`1`, `2` ou `3`; `0` nos tiles secundários da pegada).
27. `moisture`: umidade do solo (`0..100`).
28. `slopeMask`: máscara de inclinação (`bits 0..3` = cantos elevados, `bits 4..7` = desnível).

### 2.3 Arrays de Relevo e Indexação Multi-Tile (`L236–L242`)
- `pivot`: `Int32Array(n)` preenchido com `-1` (persistido em `toJSON`). Em prédios construídos, aponta para o índice linear do canto superior-esquerdo $(x_0, y_0)$ da pegada.
- `cornerH`: `Uint8Array((N+1)*(N+1))` (persistido em `toJSON`). Elevação inteira `0..9` de cada vértice.
- `elevF`: `Float32Array((N+1)*(N+1))` (não persistido). Elevação contínua `0..100`.
- `elev`: `Float32Array(n)` (não persistido). Média dos 4 cantos de cada tile.
- `busy`: `Uint8Array(n)` (não persistido). Quantidade de viaturas despachadas a partir da estação `s` (`0..2`).

---

## 3. Fórmulas de População e Empregos por Edifício (`L555–L568`)

Um edifício em `i` só produz população ou empregos se **todas** as condições abaixo forem verdadeiras:
- `this.isOrigin(i)` (`pivot[i] < 0 || pivot[i] === i`)
- `this.built[i] === 1`
- `this.ab[i] === 0` (não abandonado)
- `!this.newCons(i)` (não está em obra inicial `from === 0`; nota: upgrades `from > 0` **continuam** produzindo população e empregos durante a obra!).

### 3.1 População (`popAt(i)`, `L555–L560`)
$$\text{popAt}(i) = \begin{cases}
\text{Math.round}\Big(240 \cdot \big(0.6 + 0.4 \cdot \text{clamp}(\text{hap}[i]/100,\, 0,\, 1)\big)\Big), & \text{se } k = \text{K.SKY\_RES} \\
\text{Math.round}\Big(\text{POPCAP}[\text{lvl}[i]-1] \cdot \text{CAPM}[\text{cls}[i]] \cdot \big(0.5 + 0.5 \cdot \text{clamp}(\text{hap}[i]/100,\, 0,\, 1)\big)\Big), & \text{se } k = \text{K.RES} \\
0, & \text{caso contrário}
\end{cases}$$

### 3.2 Empregos (`jobsAt(i)`, `L561–L566`)
Se `this.riot[i] !== 0` (em greve/protesto), retorna `0`. Caso contrário:
$$\text{jobsAt}(i) = \begin{cases}
\text{FAC}[k].\text{jobs}, & \text{se } k \in \{\text{SKY\_COM} (210),\, \text{MEGA} (480),\, \text{LANDMARK} (65)\} \\
\text{JOBC}[\text{lvl}[i]-1], & \text{se } k = \text{K.COM} \\
\text{JOBI}[\text{lvl}[i]-1], & \text{se } k = \text{K.IND} \\
0, & \text{caso contrário}
\end{cases}$$

---

## 4. Algoritmo Completo de Recálculo Geral (`recalc`, `L591–L673`)

Executado no construtor, em toda ação de construção/demolição (`selEnd`), ao alterar impostos/juros no modal, no comando `funds` e no `dayTick` quando `this.dirty || ++this.sinceCalc >= 3` (no mínimo a cada 3 dias).

### Passo 1: Adjacência Viária e Listas de Entidades (`L594–L612`)
1. Zera `dirty = false`, `sinceCalc = 0`, `zl = []`, `bl = []`, `st = []` e os contadores `bc, roads, nR, nC, nI, emR, emC, emI`.
2. Para cada tile $i \in [0, n)$:
   - `roadAdj[i] = 1` se qualquer vizinho ortogonal D4 tiver `kind === K.ROAD`; senão `0`.
   - Se `kind[i] === K.ROAD`, incrementa `roads++`.
   - Se `isOrigin(i)`:
     - Zonas (`RES`, `COM`, `IND`) entram em `zl`. Se `built[i] === 1`, entram em `bl`, incrementam `bc` e `nR`/`nC`/`nI`; se `built[i] === 0`, incrementam `emR`/`emC`/`emI`.
     - Arranha-céus (`isSky(k)`) construídos entram em `bl`, incrementam `bc` e somam em `nR` (se `SKY_RES`) ou `nC` (demais `isSky`).
     - Demais construções com `built[i] && k !== K.ROAD` incrementam `bc`.
     - `POLICE` e `FIRE` entram em `st`.
3. **Propagação Multi-Tile de `roadAdj` (`L607–L611`):** Para cada pivô com `bSize[i] > 1`, se qualquer tile da pegada $\text{sz} \times \text{sz}$ tiver `roadAdj === 1`, todos os tiles da pegada recebem `roadAdj = 1`.

### Passo 2: Redes de Energia e Água (`net`, `near3`, `L578–L587`, `L613–L630`)
1. **BFS 8-conectado (`net(isSrc, flag)`):**
   - Fontes de energia: tiles $i$ onde $(k = \text{COAL} \lor k = \text{SOLAR}) \land !\text{cons.has}(i)$. Propaga para qualquer vizinho na janela $3\times3$ ($\text{dx}, \text{dy} \in [-1, 1]$) que tenha `pw[j] === 1`. Gera a máscara `pcP`.
   - Fontes de água: tiles $i$ onde $k = \text{WTOWER} \land !\text{cons.has}(i)$. Propaga por `pipe[j] === 1`. Gera a máscara `pcW`.
2. **Proximidade $3\times3$ (`near3(pc, j)`):** Um tile $j$ está conectado à rede se existe algum tile na sua vizinhança $3\times3$ com `pc === 1`. Em edifícios multi-tile, basta que **um** tile da pegada satisfaça `near3` (`L621`).
3. **Oferta e Demanda de Utilidades (`L618–L624`):**
   - Oferta: soma `FAC[k].pow` (`COAL` = 320, `SOLAR` = 85) em `pS` e `FAC[k].wat` (`WTOWER` = 220) em `wS` para usinas/torres fora de obra (`!cons.has(i)`).
   - Demanda de Energia (`pD`, apenas prédios construídos `b === 1` e conectados `nrP === true`):
     $$d_P(i) = \begin{cases}
     \text{FAC}[k].\text{pw}, & \text{se } \text{isSky}(k) \quad (14, 18, 36 \text{ ou } 10) \\
     4 \cdot \text{lvl}[i], & \text{se } k = \text{K.IND} \\
     2 \cdot \text{lvl}[i], & \text{se } k \in \{\text{RES}, \text{COM}\} \\
     3, & \text{se } k \in \{\text{POLICE}, \text{FIRE}, \text{HOSP}, \text{SCHOOL}\}
     \end{cases}$$
   - Demanda de Água (`wD`, apenas prédios construídos `b === 1` e conectados `nrW === true`; nota: `POLICE` e `SCHOOL` **não** consomem água):
     $$d_W(i) = \begin{cases}
     \text{FAC}[k].\text{wt}, & \text{se } \text{isSky}(k) \quad (14, 14, 28 \text{ ou } 6) \\
     6 \cdot \text{lvl}[i], & \text{se } k = \text{K.IND} \\
     2 \cdot \text{lvl}[i], & \text{se } k \in \{\text{RES}, \text{COM}\} \\
     3, & \text{se } k \in \{\text{HOSP}, \text{FIRE}\}
     \end{cases}$$
4. **Racionamento Determinístico (`L625–L629`):**
   - Razões de atendimento: $r_P = p_D \le p_S ? 1 : p_S / p_D$ e $r_W = w_D \le w_S ? 1 : w_S / w_D$.
   - Um edifício conectado (`nrP === true`) recebe `pwOn = 1` em toda a sua pegada se $r_P \ge 1 \lor \text{hash2}(i, 1, 5) < 100 \cdot r_P$.
   - Um edifício conectado (`nrW === true`) recebe `wtOn = 1` em toda a sua pegada se $r_W \ge 1 \lor \text{hash2}(i, 2, 9) < 100 \cdot r_W$.
   - Tiles de `COAL` e `SOLAR` sempre recebem `pwOn[i] = 1` (`L629`).

### Passo 3: Difusão Radial de Coberturas e Poluição (`spread`, `L570–L577`, `L631–L639`)
`spread(i, r, arr, w)` percorre todos os tiles $(x, y)$ dentro do círculo Euclidiano $d = \text{hypot}(\text{dx}, \text{dy}) \le r$ ao redor de $(x_0, y_0)$ e acumula com decaimento linear até $30\%$ na borda:
$$\text{arr}[j] = \min\left(100,\; \text{arr}[j] + w \cdot \left(1 - 0.7 \cdot \frac{d}{r}\right)\right)$$

| Origem (`built[i] && !cons.has(i)`) | Condição Extra | Array Alvo | Raio $r$ | Peso $w$ |
|---|---|---|---|---|
| `PARK` | — | `cPar` | `6` | `100` |
| `MEGA` | — | `cPar` | `14` | `120` |
| `LANDMARK` | — | `cPar` | `16` | `120` |
| `POLICE` | `pwOn[i] === 1` | `cPol` | `12` | `100` |
| `FIRE` | `pwOn[i] === 1` | `cFir` | `12` | `100` |
| `HOSP` | `pwOn[i] === 1` | `cHea` | `14` | `100` |
| `SCHOOL` | `pwOn[i] === 1` | `cEdu` | `12` | `100` |
| `IND` | `!ab[i]` | `poll` | $4 + \text{lvl}[i]$ ($5..7$) | $18 \cdot \text{lvl}[i]$ ($18, 36, 54$) |
| `COAL` | — | `poll` | `8` | `55` |

### Passo 4: Valor da Terra (`land`), Classe Social (`cls`) e Felicidade (`hap`) (`L640–L660`)
Para cada tile terrestre ($b \ne \text{BIO.WATER}$):
1. **Bônus de Natureza e Altitude (`L644–L645`):**
   - Conta `nat` = número de tiles na janela $3\times3$ cujo bioma é `WATER` ou `FOREST`.
   - $\text{elevBonus} = \min\big(8,\, \max(0,\, \text{getTerrainHeight}(x, y) - 1) \cdot 2\big)$.
2. **Valor do Solo (`land[i]`, `L646`):**
   $$\text{land}[i] = \text{clamp}\Big(\text{Math.round}\big(36 + \text{elevBonus} + \min(5, \text{nat}) \cdot 3 + 0.22 \cdot \text{cPar}[i] + 0.12 \cdot \text{cEdu}[i] + 0.08 \cdot \text{cPol}[i] - 0.5 \cdot \text{poll}[i] - 0.8 \cdot \text{cr}[i] + (\text{roadAdj}[i] ? 6 : 0)\big),\; 5,\; 100\Big)$$
3. **Classificação Social (`cls[i]`, `L649–L651`):**
   - Se `isSky(k)`: `cls[i] = 2` (Elite).
   - Se $k === \text{K.IND}$: `cls[i] = 0` (Pobre/Operário).
   - Se $k \in \{\text{RES}, \text{COM}\}$:
     $$\text{sc} = \text{land}[i] + \frac{\text{cEdu}[i]}{3} + \frac{\text{cHea}[i]}{5} - \frac{\text{poll}[i]}{2} - \frac{\text{cr}[i]}{3}$$
     $$\text{cls}[i] = \begin{cases} 2 \text{ (Elite)}, & \text{se } \text{sc} \ge 72 \land \text{poll}[i] < 25 \\ 1 \text{ (Média)}, & \text{se } \text{sc} \ge 42 \land \text{poll}[i] < 55 \\ 0 \text{ (Pobre)}, & \text{caso contrário} \end{cases}$$
4. **Felicidade do Edifício (`hap[i]`, `L652–L655`):**
   Seja $\text{tx}$ a alíquota do setor ($\text{tax.r}$ para `RES`/`SKY_RES`, $\text{tax.i}$ para `IND`, $\text{tax.c}$ para os demais):
   $$h_{\text{base}} = 60 + 0.12 \cdot \text{cPol}[i] + 0.08 \cdot \text{cFir}[i] + 0.10 \cdot \text{cHea}[i] + 0.06 \cdot \text{cEdu}[i] + 0.14 \cdot \text{cPar}[i] - 0.4 \cdot \text{poll}[i] - 1.2 \cdot \text{cr}[i] - 1.3 \cdot (\text{tx} - 10)$$
   Penalidades cumulativas de infraestrutura e sinistros:
   $$h = h_{\text{base}} - (!\text{pwOn}[i] ? 25 : 0) - (!\text{wtOn}[i] ? 20 : 0) - (!\text{roadAdj}[i] ? 30 : 0) - (\text{fire}[i] ? 25 : 0)$$
   $$\text{hap}[i] = \text{clamp}(\text{Math.round}(h),\, 0,\, 100)$$
5. **Felicidade Global da Cidade (`this.happy`, `L660`):**
   Média ponderada pela população residencial (`hp = pop`): se $\text{hp} > 0$, $\text{happy} = \text{Math.round}(\text{hs} / \text{hp})$; se a cidade não tiver moradores ($\text{hp} = 0$), assume `65`.

### Passo 5: Demanda RCI, Desemprego e Aprovação Política (`L661–L673`)
1. **Variáveis Macroeconômicas (`L661`):**
   - Força de trabalho: $\text{wk} = 0.5 \cdot \text{pop}$.
   - Total de vagas: $\text{jobs} = j_c + j_i$.
   - Impulso de cidade nova: $\text{boot} = (\text{pop} < 60) ? 0.6 : 0$.
   - Estímulo monetário (juros baixos estimulam crescimento): $\text{rt} = (8 - \text{interest}) / 12$.
   - Penalidade por excesso de lotes vazios: $\text{pen}(\text{em}, b) = \text{clamp}\big((\text{em} - 8 - 0.6b) \cdot 0.03,\, 0,\, 0.6\big)$.
2. **Alvos de Demanda (`tgt`, `L662–L667`):**
   $$\text{tgt}_r = \text{clamp}\left(\frac{\text{jobs} - \text{wk}}{\max(30, \text{jobs} + \text{wk})} \cdot 2.2 + \text{boot} + \frac{\text{happy} - 55}{120} - \frac{T_r - 10}{18} + 0.3 \cdot \text{rt} - \text{pen}(\text{em}_R, n_R),\; -1,\; 1\right)$$
   $$\text{tgt}_c = \text{clamp}\left(\frac{0.35 \cdot \text{pop} - j_c}{\max(30, 0.35 \cdot \text{pop} + j_c)} \cdot 2.2 + 0.6 \cdot \text{boot} - \frac{T_c - 10}{18} + \text{rt} - \text{pen}(\text{em}_C, n_C),\; -1,\; 1\right)$$
   $$\text{tgt}_i = \text{clamp}\left(\frac{\text{wk} - \text{jobs}}{\max(30, \text{wk} + \text{jobs})} \cdot 2.2 + 0.1 + 0.8 \cdot \text{boot} - \frac{T_i - 10}{18} + \text{rt} - \text{pen}(\text{em}_I, n_I),\; -1,\; 1\right)$$
   Suavização exponencial ($\alpha = 0.4$):
   $$\text{demand}_k \leftarrow \text{demand}_k + 0.4 \cdot (\text{tgt}_k - \text{demand}_k), \quad k \in \{r, c, i\}$$
3. **Desemprego (`unemp`, `L668`):**
   $$\text{unemp} = \text{wk} > 0 ? \text{clamp}\left(\frac{\text{wk} - \text{jobs}}{\text{wk}},\, 0,\, 1\right) : 0$$
4. **Aprovação Popular (`apP`) e da Elite (`apR`) (`L670–L671`):**
   Seja $q = \max(1, n_r)$ o número de edifícios residenciais construídos e $a_H, a_E, a_P, a_L$ as somas de `cHea`, `cEdu`, `cPar` e `land` nesses edifícios:
   $$\text{apP} = \text{clamp}\left(\text{Math.round}\left(58 - 2(T_r - 10) - 3\max(0, \text{inf} - 3) - 55 \cdot \text{unemp} - 0.3 \cdot \text{crimeIdx} + 0.12 \frac{a_H}{q} + 0.12 \frac{a_E}{q} + 0.10 \frac{a_P}{q}\right),\, 0,\, 100\right)$$
   $$\text{apR} = \text{clamp}\left(\text{Math.round}\left(52 - 2.5\left(\frac{T_r + T_c + T_i}{3} - 10\right) - 3 \cdot \text{strikes} - 0.25 \cdot \text{crimeIdx} + 1.2(\text{interest} - 8) + (n_r ? 0.5\left(\frac{a_L}{q} - 45\right) : 0) + (\text{funds} > 0 ? 3 : -6)\right),\, 0,\, 100\right)$$
5. **Risco Local de Protesto/Crime (`riskAt(i)`, `L673`):**
   $$\text{riskAt}(i) = \text{clamp}\big(30 + 60 \cdot \text{unemp} + 0.6 \cdot (50 - \text{land}[i]) - 0.55 \cdot \text{cPol}[i],\; 0,\; 100\big)$$

---

## 5. Fechamento Econômico Mensal (`monthTick`, `L692–L716`)

Disparado a cada 30 dias (`++this.day > 30`):
1. **Arrecadação Tributária (`tr, tc, ti`, `L694–L700`):**
   Para cada edifício $i \in \text{this.bl}$ que seja origem (`isOrigin(i)`), não abandonado (`!ab[i]`) e sem protesto/greve (`!riot[i]`):
   - Residencial (`RES` ou `SKY_RES`): $\text{tr} \mathrel{+}= \text{popAt}(i) \cdot 2.2 \cdot \frac{T_r}{10} \cdot \text{TAXM}[\text{cls}[i]]$
   - Industrial (`IND`): $\text{ti} \mathrel{+}= \text{jobsAt}(i) \cdot 2.2 \cdot \frac{T_i}{10}$ *(não multiplica por `TAXM`)*
   - Comercial (`COM`, `SKY_COM`, `MEGA`, `LANDMARK`): $\text{tc} \mathrel{+}= \text{jobsAt}(i) \cdot 2.6 \cdot \frac{T_c}{10} \cdot \text{TAXM}[\text{cls}[i]]$
2. **Despesa Base de Manutenção (`up`, `L701–L705`):**
   - Cada tile de rua (`K.ROAD`): $+\$1.20$.
   - Cada edifício construído (`isOrigin(i) && built[i] && FAC[k]`): $+\text{FAC}[k].\text{up}$.
3. **Dinâmica da Inflação (Curva de Phillips + Regra de Taylor, `L706`):**
   $$\text{itg} = 4 + 2 \cdot (10 - \text{interest}) - \frac{100 \cdot \text{unemp}}{5}$$
   $$\text{inflation} \leftarrow \text{clamp}\big(\text{inflation} + 0.25 \cdot (\text{itg} - \text{inflation}),\; 0,\; 40\big)$$
4. **Juros sobre Caixa / Dívida e Correção Inflacionária (`L707–L709`):**
   $$\text{rent} = \text{funds} > 0 ? \text{Math.round}\left(\frac{\text{funds} \cdot \text{interest}}{1200}\right) : 0$$
   $$\text{debt} = \text{funds} < 0 ? \text{Math.round}\left(\frac{-\text{funds} \cdot \text{interest}}{1200}\right) : 0$$
   $$\text{up}_{\text{final}} = \text{Math.round}\left(\text{up} \cdot \left(1 + \frac{2 \cdot \text{inflation}}{100}\right)\right) + \text{debt}$$
   $$\text{tr} = \text{Math.round}(\text{tr}), \quad \text{tc} = \text{Math.round}(\text{tc}), \quad \text{ti} = \text{Math.round}(\text{ti})$$
   $$\text{income} = \text{tr} + \text{tc} + \text{ti} + \text{rent}, \quad \text{expense} = \text{up}_{\text{final}}, \quad \text{funds} \mathrel{+}= \text{income} - \text{expense}$$
5. **Condição de Derrota (`L715`):**
   Se $\text{funds} < -5000 \land !\text{this.over}$, define `this.over = true`, `this.speed = 0` e registra `'FALÊNCIA! A cidade quebrou.'`.

---

## 6. Crescimento Urbano e Coalescência em Arranha-Céus (`growth`, `L719–L744`)

Executado diariamente para $m = \max(3, \lceil 0.12 \cdot |\text{zl}| \rceil)$ lotes sorteados aleatoriamente de `zl`:
Seja $\text{ok} = \text{roadAdj}[i] \land \text{pwOn}[i] \land \text{wtOn}[i]$ e $\text{dm}$ a demanda do setor (`d.r`, `d.c` ou `d.i`):
1. **Lote Vazio (`!built[i]`, `L735`):**
   - Se $\text{ok} \land \text{dm} > 0.05 \land \text{rand}() < 0.25 + 0.7 \cdot \text{dm}$:
   - Constrói nível 1 (`built = 1, lvl = 1, pivot = i, bSize = 1`), sorteia `vr = (rand() * 256) | 0` e inicia obra `{ p: 0, from: 0, dur: 1.5 }`.
2. **Fuga de Capital da Elite (`L736`):**
   - Se $k = \text{RES} \land \text{cls}[i] = 2 \land \text{tax.r} > 18 \land \text{rand}() < 0.25$:
   - Escombros/esvaziamento imediato (`built = 0, lvl = 0, pivot = -1, bSize = 0`) e incrementa `this.flight++`.
3. **Lote Abandonado (`ab[i] === 1`, `L737`):**
   - Se `ok`, reocupa imediatamente (`ab[i] = 0`).
   - Se `!ok` e $\text{rand}() < 0.35$, demolido para zona vazia (`built = 0, lvl = 0, ab = 0`).
4. **Falta de Infraestrutura (`!ok`, `L738`):**
   - Incrementa `++nd[i]`. Ao atingir `nd[i] >= 4`, torna-se abandonado (`ab[i] = 1`).
5. **Upgrade de Densidade $1 \to 2 \to 3$ (`L740`):**
   - Se $\text{lvl}[i] < 3 \land \text{hap}[i] \ge 62 \land \text{dm} > 0.15 \land \text{land}[i] \ge (\text{lvl}[i] === 1 ? 42 : 56) \land \text{rand}() < 0.30$:
   - Inicia obra `{ p: 0, from: lvl[i], dur: 1 }` e incrementa `lvl[i]++`.
6. **Coalescência Automática $2\times2$ em Arranha-Céu (`tryCoalesceSkyscraper`, `L719–L728`, `L741`):**
   - Se $\text{lvl}[i] === 3 \land \text{hap}[i] \ge 74 \land \text{land}[i] \ge 68 \land \text{dm} > 0.20 \land \text{rand}() < 0.18$:
   - Verifica se $(x_0, y_0)$ é o canto superior-esquerdo de um bloco $2\times2$ onde **todos os 4 tiles** possuem o mesmo $k \in \{\text{RES}, \text{COM}\}$, `built === 1`, `lvl >= 3`, `!ab`, `!cons.has` e `bSize === 1`.
   - Se verdadeiro, substitui os 4 prédios por um `SKY_RES` ou `SKY_COM` $2\times2$ via `placeFootprint(x0, y0, ..., 2, false, 3)` (obra de `dur: 2.5` dias).
7. **Downgrade por Crise (`L742`):**
   - Se $(\text{hap}[i] < 28 \lor \text{dm} < -0.35) \land \text{rand}() < 0.25$: reduz `lvl[i]--` (ou zera o lote se estava no nível 1).

---

## 7. Eventos Diários: Protestos, Incêndios e Crimes (`L747–L809`)

### 7.1 Protestos e Greves (`riotDay`, `L747–L767`)
Apenas para edifícios em `bl` com $k \in \{\text{RES}, \text{IND}\}$ (`COM` e `isSky` nunca entram em protesto):
- **Início (`L763–L764`):** Se `riot[i] === 0 && riotT[i] === 0`:
  - Condição `RES`: $\text{cls}[i] === 0 \land \text{apP} < 35 \land \big(\text{riskAt}(i) > 45 \lor (\text{hap}[i] < 25 \land \text{tax.r} > 14)\big)$.
  - Condição `IND`: $\text{apP} < 30$.
  - Se a condição for satisfeita e $\text{rand}() < 0.12$: ativa `riot[i] = 1, riotT[i] = 1`.
- **Evolução (`L754–L760`):** Enquanto `riot[i] === 1`:
  - Pacificação espontânea: se $\big(k = \text{RES} ? (\text{apP} \ge 40 \land \text{riskAt}(i) \le 45) : \text{apP} \ge 34\big) \land \text{rand}() < 0.30$, encerra (`riot[i] = 0`) com cooldown `riotT[i] = 8` dias.
  - Incrementa `riotT[i]` (até 250). Se `riotT[i] >= 12 && !fire[i] && rand() < 0.04`, ateia fogo de barricada (`fire[i] = 18`).
  - Despacha viatura policial `dispatch('police', i)` se `'p' + i` não estiver em `assign`.

### 7.2 Incêndios (`fireDay`, `L770–L791`)
- **Tentativas de Ignição Diárias:** $A = 1 + \lfloor \text{builtCount} / 150 \rfloor$.
  - Sorteia tile pivô $i$. Se construído, não for `PARK`/`ROAD` e não estiver em chamas:
  - Multiplicador de risco: $\text{mult} = (k = \text{IND}) ? 2.5 : (k = \text{COAL}) ? 3.0 : 1.0$.
  - Probabilidade de ignição: $P_{\text{fire}} = 0.008 \cdot \text{mult} \cdot \left(1 - \frac{\text{cFir}[i]}{130}\right)$. Se ocorrer, inicia com `fire[i] = 18`.
- **Progressão e Combate (`L778–L790`):**
  - Se há caminhão de bombeiros trabalhando no local (`v.kind === 'fire' && v.state === 'work' && v.tgt === i`): $\text{fire}[i] \leftarrow \max(0, \text{fire}[i] - 45)$.
  - Caso contrário: $\text{fire}[i] \leftarrow \min\big(255,\, \text{fire}[i] + 14 + (\text{cFir}[i] < 20 ? 6 : 0)\big)$.
  - Se $\text{fire}[i] \ge 45$: para cada vizinho D4 construído (exceto `ROAD`/`PARK`), propaga com probabilidade $0.20$ (`fire[j] = 15`).
  - Se $\text{fire}[i] \ge 100$: **destrói o prédio** (`clearFootprint(i)`), mantendo o zoneamento original se era zona (`wasZ`).

### 7.3 Crimes (`crimeDay`, `L794–L809`)
- **Tentativas Diárias:** $A = 1 + \lfloor \text{builtCount} / 80 \rfloor$ sobre prédios sorteados de `bl`.
- **Probabilidade de Ocorrência:** $P_{\text{crime}} = 0.006 + 0.03 \cdot \frac{\text{riskAt}(i)}{100}$. Cria `{ i, age: 0, done: false }` e chama `dispatch('police', i)`.
- **Índice de Crime (`crimeIdx`, `L801`):** Média de `riskAt` sobre 40 amostras aleatórias de `bl`.
- **Impunidade (`L805`):** Se um crime atingir `++c.age >= 4` dias sem ser resolvido pela polícia:
  - Multa o caixa da prefeitura em $-\$12 \cdot (\text{lvl}[c.i] \parallel 1)$.
  - Agrava a mancha criminal do tile: $\text{cr}[c.i] \leftarrow \min(40,\, \text{cr}[c.i] + 12)$.
  - Incrementa `stats.lost++`.

---

## 8. Pathfinding de Viaturas e Simulação de Tráfego (`L811–L884`)

### 8.1 Despacho via BFS Reverso (`dispatch(type, tgt)`, `L812–L833`)
1. Chave de atendimento: `key = type[0] + tgt` (`'f' + tgt` ou `'p' + tgt`). Se `assign.has(key)`, retorna `true`.
2. Inicializa `dist = Int16Array(n).fill(-1)` e `par = Int32Array(n).fill(-1)`.
3. Enfileira com `dist = 0` todas as ruas (`K.ROAD`) ortogonalmente adjacentes (D4) a qualquer tile da pegada $\text{sz} \times \text{sz}$ do alvo `tgt`.
4. Executa BFS sobre a malha de `K.ROAD`, preenchendo `dist[j] = dist[i] + 1` e o ponteiro pai `par[j] = i`.
5. Procura em `this.st` a estação $s$ do tipo correspondente (`FIRE` ou `POLICE`) que esteja energizada (`pwOn[s] === 1`), com menos de 2 viaturas fora (`busy[s] < 2`) e que possua uma rua adjacente $r$ com a menor distância `dist[r] >= 0`.
6. Reconstrói o caminho `path` seguindo `par` de `best.r` até a rua encostada no alvo (`par === -1`), incrementa `busy[best.s]++` e cria a viatura com velocidade `sp: 1.6` tiles/s.

### 8.2 Movimentação, Engarrafamento e Trabalho (`moveVehicles(dt)`, `L853–L874`)
Recebe `dt = e / 1000` (segundos simulados):
1. **Controle de Congestionamento por Aresta Direcionada (`L855–L856`):**
   - Agrupa veículos na mesma aresta $(x, y) \to (\text{nx}, \text{ny})$ pela chave $k = (yN + x)N^2 + (\text{ny} \cdot N + \text{nx})$ e ordena por progresso $p$ decrescente.
   - Se a distância para o veículo da frente na mesma faixa for $p_{j-1} - p_j < 0.3$, limita a velocidade: $\text{cur}_j = \min(\text{sp}_j,\, 0.85 \cdot \text{cur}_{j-1})$.
2. **Tempo de Trabalho no Alvo (`state === 'work'`, `L859–L864`):**
   - Bombeiros (`'fire'`): permanecem trabalhando até `!fire[v.tgt]` ou `v.timer > 12` s simulados, quando chamam `retreat(v)`.
   - Polícia (`'police'`): após `v.timer > 1.5` s simulados, encerra protesto (`riot = 0, riotT = 15`), marca crime como resolvido (`c.done = true, stats.solved++`) e chama `retreat(v)`.
3. **Geração de Tráfego Civil (`spawnCars`, `L875–L884`):**
   - Quantidade desejada de carros civis:
     $$\text{day}_{\text{fac}} = 0.5 + 0.5 \cdot \cos((g.\text{tod} - 0.5) \cdot 6.2832)$$
     $$\text{want} = \min\Big(260,\; \big\lfloor (0.22 \cdot \text{roads} + \text{pop} / 14) \cdot (0.35 + 0.65 \cdot \text{day}_{\text{fac}}) \big\rfloor\Big)$$
   - Tenta criar até 2 carros por chamada em tiles aleatórios de rua, com velocidade $\text{sp} \in [0.8, 1.5)$ tiles/s, vida útil $\text{life} \in [40, 159]$ tiles percorridos e cor `col` $\in \{0 \dots 7\}$.