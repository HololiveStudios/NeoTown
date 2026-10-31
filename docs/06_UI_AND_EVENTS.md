# 06 — Interface de Usuário (HUD), Minimapa, Modais e Eventos de Entrada

> **Propósito:** Especificar exaustivamente toda a camada de front-end do Delta City (`L9–L85` e `L2060–L2311`), incluindo a árvore DOM completa, sistema de design CSS e breakpoints, gerador procedural de ícones pixel-art $8\times8$, algoritmos de atualização da HUD (`hud`, `hudExtra`, dirty-checking `_k`), renderizador do minimapa (`#mmc`), máquina de estados de entrada (ponteiro único, pinça multi-touch, mouse e teclado) e as 4 abas da janela modal (`drawModal`).

---

## 1. Mapa Completo de Elementos DOM (`L78–L85`, `L2120–L2143`)

| ID / Seletor | Tag | Pai Direto | Criado em | Função e Interação |
|---|---|---|---|---|
| `#stage` | `div` | `body` | HTML (`L79`) | Container `position:fixed; inset:0` monitorado por `ResizeObserver` (`L2307`). |
| `#c` | `canvas` | `#stage` | HTML (`L79`) | Viewport principal onde o framebuffer RGBA `img` é desenhado via `putImageData`. |
| `#top` | `div` | `body` | HTML (`L80`) | Barra superior (`left:8px; right:8px; top:calc(8px + var(--sa))`). Delega clique em `#cN` para `togPerf()` (`L2139`). |
| `#bB` | `button.pb.big` | `#top` | JS (`L2121`) | Botão do martelo ($60\times60$ px, ícone `hammer` escala 4). Alterna `toggleMenu()` (`L2128`). |
| `#cN` | `div.chip.in` | `#top` | JS (`L2121`) | Nome da cidade (`cl(g.name)`). Clicar nele liga/desliga `#perf`. |
| `#cP` | `div.chip.in` | `#top` | JS (`L2121`) | População total (`ic('pop') + '<b>' + g.pop + '</b>'`). |
| `#cH` | `div.chip.in` | `#top` | JS (`L2121`) | Felicidade global (`smile` se $\ge 60$, `flat` se $\ge 40$, `sad` se $< 40$; classe `.bad` se $< 30$). |
| `#side` | `div` | `body` | HTML (`L80`) | Barra vertical esquerda com 4 atalhos rápidos (`bulldoze`, `inspect`, `zone`, `road`), botão de heatmap (`bH`), espaçador `.sp`, botão `stats` (`bG`) e botão `gear` (`#bM`). |
| `#bM` | `button.pb` | `#side` | JS (`L2142`) | Abre a janela modal na última aba visitada: `openModal(tab)` (`L2257`). |
| `#perf` | `div.px` | `body` | JS (`L2138`) | Overlay de telemetria (`left:68px; top:calc(150px + env(safe-area-inset-top))`). Inicialmente `display:none`. |
| `#sub` | `div` | `body` | HTML (`L80`) | Sub-barra superior (`left:68px; top:calc(58px + var(--sa))`) com medidor `#rci` e 6 chips de indicadores. |
| `#rci` | `div` | `#sub` | JS (`L2122`) | Contém 3 barras `.bar.in` (`R` verde `#3fcf5a`, `C` azul `#3f86f0`, `I` amarelo `#f0c640`, ou `#d55` quando negativas). |
| `#cE` | `div.chip.in` | `#sub` | JS (`L2122`) | Energia: `ic('bolt') + Math.min(999, g.pwS) + '/' + g.pwD` (`.bad` se `pwD > pwS`). |
| `#cW` | `div.chip.in` | `#sub` | JS (`L2122`) | Água: `ic('drop') + g.wtS + '/' + g.wtD` (`.bad` se `wtD > wtS`). |
| `#cC` | `div.chip.in` | `#sub` | JS (`L2122`) | Crime: `ic('shield') + g.crimeIdx + '%'` (`.bad` se `crimeIdx > 60`). |
| `#cI` | `div.chip.in` | `#sub` | JS (`L2122`) | Inflação: `'INF ' + g.inflation.toFixed(1) + '%'` (`.bad` se `inflation > 9`). |
| `#cJ` | `div.chip.in` | `#sub` | JS (`L2122`) | Juros: `ic('bank') + 'JUR ' + g.interest + '%'`. |
| `#cG` | `div.chip.in` | `#sub` | JS (`L2122`) | Greves + Protestos: `ic('fist') + (g.nProt + g.strikes)` (`.bad` se $> 0$). |
| `#dial` | `div` | `body` | HTML (`L80`) | Mostrador circular SVG $96\times96$ no canto superior direito (`L2149–L2150`). |
| `#gift` | `button.pb` | `body` | HTML (`L80`) | Botão circular $46\times46$ (`right:14px; top:calc(138px + var(--sa))`). Abre `openModal('log')` (`L2143`). |
| `#card` | `div.px` | `body` | HTML (`L81`) | Card flutuante de inspeção (`showInfo`, `L2212`). Fecha em qualquer `pointerdown` no canvas (`L2214`). |
| `#cost` | `div.px` | `body` | HTML (`L82`) | Pílula centralizada de custo da seleção ativa: `'$' + pv.cost + ' / ' + validTiles + ' tile(s)'` (`L2183`). |
| `#bot` | `div` | `body` | HTML (`L83`) | Container inferior (`left:68px; right:100px; bottom:calc(68px + var(--sb))`). |
| `#row1` | `div` | `#bot` | HTML (`L83`) | Linha com `#tool` (`display:none`), `#toast` e `#conf`. |
| `#toast` | `div` | `#row1` | HTML (`L83`) | Exibe `cl(g.msg)`. Clicar abre `openModal('log')` (`L2129`). |
| `#conf` | `div` | `#row1` | HTML (`L83`) | Botões de confirmação `#bOk` (`g.selEnd()`) e `#bNo` (`g.selCancel()`). |
| `#its` | `div.px` | `#bot` | HTML (`L83`) | Carrossel horizontal de itens da categoria selecionada (`openCat`). |
| `#cats` | `div.px` | `#bot` | HTML (`L83`) | Carrossel horizontal com os 9 botões `.pb.cat` de `CATS`. |
| `#clk` | `div.px` | `body` | HTML (`L84`) | Painel inferior esquerdo com ícone `clock`, data `#cD` e 4 botões de velocidade `#spd` (`II`, `>`, `>>`, `>>>`). |
| `#money` | `div` | `body` | HTML (`L84`) | Painel inferior direito (`right:98px`) com `#cF`. Clicar abre `openModal('budget')` (`L2143`). |
| `#cF` | `div.chip.in` | `#money` | JS (`L2123`) | Caixa formatado (`$28.0K`) + saldo mensal `.net` (`+`/`-`). Classe `.bad` se `funds < 0`. |
| `#mm` / `#mmc` | `div.px` / `canvas`| `body` / `#mm`| HTML (`L84`) | Minimapa $82\times82$ px CSS (resolução interna $N \times N$ pixels). |
| `#win` | `div` | `body` | HTML (`L85`) | Overlay modal (`z-index:9`), contendo `#wb > (#wt > (#wtt + #wx), #tabs, #wc)`. |

---

## 2. Gerador Procedural de Ícones Pixel-Art $8\times8$ (`L2081–L2119`)

O jogo possui **23 sprites $8\times8$** codificados em ASCII no objeto `SPR` (`L2082–L2106`), onde:
- `'.'` = pixel transparente
- `'X'` = cor primária `a` (padrão `COL[n][0]`)
- `'o'` = cor secundária `b` (padrão `COL[n][1]`)

### 2.1 Algoritmo `iconUrl(n, a, b)` e Cache `IC` (`L2108–L2114`)
1. Chave de cache: `k = n + a + b`. Se `IC[k]` existir, retorna a string `'url(data:image/png;base64,...)'` imediatamente.
2. Cria um `<canvas>` em memória de $8\times8$ pixels e percorre as 8 strings de `SPR[n]`.
3. Para cada caractere `'X'` ou `'o'`, define `x.fillStyle = (ch === 'X' ? a : b)` e desenha `x.fillRect(i, y, 1, 1)`.
4. Converte via `c.toDataURL()`, armazena em `IC[k]` e retorna.
5. A função `ic(n, s, a, b)` (`L2115`) gera a tag HTML `<i class="ic" style="width:(8*s)px;height:(8*s)px;background-image:..."></i>` (escala padrão $s = 2 \implies 16\times16$ px).

### 2.2 Sanitizador de Texto e Emojis (`cl(s)`, `L2070`)
Para evitar que emojis quebrem o visual pixel-art na HUD e nos logs, toda string dinâmica passa por:
```js
const cl = (s) => String(s)
  .replace(/\u26A0\uFE0F?/g, '! ')
  .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D]/gu, '')
  .replace(/\s+/g, ' ')
  .trim();
```
*(Substitui `⚠️` por `'! '` e remove todos os demais pictogramas Unicode).*

---

## 3. Atualização da HUD, Mostrador SVG (`#dial`) e Minimapa (`#mmc`) (`L2146–L2186`)

### 3.1 Dirty-Checking de DOM (`set(id, h, bad)`, `L2167`)
Para evitar *reflow/repaint* desnecessário do navegador a cada 200 ms, cada elemento guarda sua última chave renderizada na propriedade customizada `e._k = h + (bad ? '!' : '')`. O `innerHTML` e `classList.toggle('bad', !!bad)` só são tocados quando `e._k !== k`.

### 3.2 Formatação Monetária (`fm(v)`, `L2168`)
$$\text{fm}(v) = |v| \ge 1000 ? \left(\frac{v}{1000}\right)\text{.toFixed}(1) + \text{'K'} : v$$

### 3.3 Barras de Demanda `#rci` (`L2180`)
Cada container `.bar` tem $30\text{ px}$ de altura com linha divisória central em $15\text{ px}$ (`top: 50%`). Para cada setor $k \in \{\text{'r'}, \text{'c'}, \text{'i'}\}$ com valor $v = g.\text{demand}[k] \in [-1, 1]$:
- Altura da barra interna `<i>`: $h = |v| \cdot 15\text{ px}$.
- Posição vertical `top`: se $v \ge 0$, $\text{top} = (15 - h)\text{ px}$ (cresce para cima a partir do meio); se $v < 0$, $\text{top} = 15\text{ px}$ (cresce para baixo a partir do meio).
- Cor de fundo: se $v < 0$, vermelho `#d55`; senão `RC[i]` (`#3fcf5a`, `#3f86f0`, `#f0c640`).

### 3.4 Medidor Semicircular `#dial` (`hudExtra`, `L2147–L2150`)
- Se a ferramenta ativa for `'res'`, `'com'` ou `'ind'`:
  - Exibe a demanda percentual do setor: $\text{val} = \text{Math.round}(v \cdot 100)$, fração de preenchimento do arco $f = \min(1, |v|)$, cor `#e55` (se $v < 0$) ou `RC[i]`.
- Para qualquer outra ferramenta:
  - Exibe o custo da ferramenta: $\text{val} = t.\text{cost} \parallel 0$, fração $f = \min(1, \text{val} / 500)$, cor dourada `#ffd24a`.
- O arco SVG ($r = 38$, perímetro $\approx 239$, arco útil de $270^\circ = 179$ unidades rotacionado em $135^\circ$) usa `stroke-dasharray="(179 * f).toFixed(1) 239"`.

### 3.5 Renderização e Navegação do Minimapa (`#mmc`, `L2144–L2164`)
Executado no máximo a cada **400 ms** (`now - mmT >= 400`), ou imediatamente ao clicar no minimapa (`mmT = 0`):
1. Se `mmc.width !== g.N`, redimensiona o canvas `#mmc` para $N \times N$ pixels e aloca `mmImg = mx.createImageData(N, N)`.
2. Para cada tile $i \in [0, N^2)$:
   - **Se `k === 0` (terreno natural):** pega a cor base do bioma em `MC = [[44,92,150], [78,120,56], [40,82,42], [110,112,96]]` e multiplica pelo sombreamento de altitude $\text{shd} = 0.86 + \text{elv} \cdot 0.04$.
   - **Se `k > 0` (construído ou zoneado):** sobrescreve com cor sólida:
     - `k === 1` (`ROAD`): cinza `[150, 150, 150]`
     - `k === 2` (`RES`): verde `[120, 226, 120]`
     - `k === 3` (`COM`): azul `[90, 150, 255]`
     - `k === 4` (`IND`): amarelo `[250, 210, 70]`
     - `g.isSky(k)` (`13..16`): dourado `[255, 218, 92]`
     - `k >= 5` (serviços/usinas/parques): branco `[236, 236, 236]`
3. Desenha `mx.putImageData(mmImg, 0, 0)` e sobrepõe o quadrado amarelo `#ffe828` do frustum da câmera:
   $$\text{sz} = \text{clamp}\left(\frac{W}{\text{hwF}} \cdot 0.7,\, 3,\, N\right), \quad c_x = \frac{u_0 + v_0 - 1}{2}, \quad c_y = \frac{v_0 - u_0 - 1}{2}$$
4. **Clique no Minimapa (`pointerdown` em `#mm`, `L2164`):**
   Converte a posição relativa $(x, y) \in [0, N]^2$ para coordenadas de câmera:
   $$u_0 = x - y, \quad v_0 = x + y + 1$$
   Aplica `camClamp()`, zera `mmT = 0` e marca `dirty = true`.

---

## 4. Máquina de Estados de Entrada: Ponteiro, Pinça, Roda e Teclado (`L2206–L2247`)

### 4.1 Estado de Entrada (`L2207`)
- `ptr = new Map()`: mapeia `pointerId` $\to$ `[x, y]` em coordenadas internas do framebuffer ($[0, W] \times [0, H]$).
- `mode`: `'sel' | 'pan' | 'pinch' | null`.
- `pan`: `{ sx, sy, moved, px, py }`.
- `pinch`: `{ d, m }` onde $d$ é a distância Euclidiana entre os 2 dedos (`dist()`) e $m$ é o ponto médio (`mid()`).

### 4.2 Transições de Ponteiro (`pointerdown`, `pointermove`, `pointerup`)
1. **`pointerdown` (`L2213–L2219`):**
   - Sempre oculta `#card` e fecha o menu de construção se estiver aberto (`menuOpen = false`).
   - **Se `ptr.size === 2` (2 dedos na tela):** cancela qualquer seleção em andamento (`g.selCancel()`), entra em `mode = 'pinch'` e grava `pinch = { d: dist(), m: mid() }`.
   - **Se `g.tool().mode === 'inspect' || e.button === 1 || e.button === 2`:** entra em `mode = 'pan'` com `moved = false`.
   - **Caso contrário (1 dedo / botão esquerdo com ferramenta de construção):** projeta `t = g.screenToTile(p[0], p[1])`. Se válido, entra em `mode = 'sel'`, oculta `#conf` e chama `g.selBegin(t[0], t[1])`.
2. **`pointermove` (`L2220–L2227`):**
   - **Hover sem clique (`!ptr.has(e.pointerId)`):** se a ferramenta atual for `mode === 'point'`, atualiza o cursor `g.setCursor(t[0], t[1])` em tempo real para que a prévia e o anel de raio sigam o mouse.
   - **Em `mode === 'pinch' && ptr.size === 2`:**
     $$\text{hwF} \leftarrow \text{clamp}\left(\text{hwF} \cdot \frac{d}{\text{pinch}.d},\, 8,\, 64\right)$$
     $$\text{panBy}(m_x - \text{pinch}.m_x,\; m_y - \text{pinch}.m_y), \quad \text{pinch} \leftarrow \{ d, m \}$$
   - **Em `mode === 'pan'`:** se $|p_x - \text{pan.sx}| + |p_y - \text{pan.sy}| > 5$ pixels, marca `pan.moved = true`. Enquanto `pan.moved`, desloca a câmera:
     $$\text{panBy}(\text{dx}, \text{dy}): \quad u_0 \mathrel{-}= \frac{\text{dx}}{v.\text{hw}}, \quad v_0 \mathrel{-}= \frac{\text{dy}}{v.\text{hh}}, \quad u_0 \in [-N, N],\; v_0 \in [0, 2N]$$
   - **Em `mode === 'sel'`:** chama `g.selMove(t[0], t[1])`.
3. **`pointerup` / `pointercancel` (`up`, `L2228–L2232`):**
   - Se estava em `mode === 'pan'`, **não moveu** (`!pan.moved`) e a ferramenta é `'inspect'`, posiciona o cursor no tile clicado e abre o card de inspeção `showInfo(t[0], t[1])`.
   - Se estava em `mode === 'sel'` e `ptr.size === 1`: se `cfg.confirm === true`, exibe os botões `#bOk`/`#bNo` (`showConf()`); senão executa `g.selEnd()` imediatamente.

### 4.3 Zoom via Roda do Mouse (`wheel`, `L2234`)
$$\text{hwF} \leftarrow \text{clamp}\big(\text{hwF} \cdot \exp(-e.\text{deltaY} \cdot 0.0012),\; 8,\; 64\big)$$

### 4.4 Tabela Completa de Atalhos de Teclado (`keydown`, `L2235–L2246`)
*(Nota: se a janela modal `#win` estiver aberta com `display === 'flex'`, apenas `Escape` funciona, fechando o modal via `closeModal()`).*

| Tecla (`e.key`) | Ação Executada |
|---|---|
| `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown` | Move o cursor de tile em `[-1,0]`, `[1,0]`, `[0,-1]`, `[0,1]` via `g.setCursor(...)`. Se houver seleção ativa (`g.sel`), expande via `g.selMove(g.cx, g.cy)`. |
| `'a'`, `'d'`, `'w'`, `'s'` | Move a câmera via `panBy`: `'a'` $\to (+40, 0)$, `'d'` $\to (-40, 0)$, `'w'` $\to (0, +40)$, `'s'` $\to (0, -40)$. |
| `'1'` a `'9'` | Abre/seleciona a categoria de construção `pickCat(+k - 1)` (`0` a `8`). |
| `' '` (Espaço) ou `'Enter'` | Se `!g.sel`, inicia seleção em `(g.cx, g.cy)` (`g.selBegin`); se `g.sel` já existe, confirma a construção (`g.selEnd()`). |
| `'Escape'` | Cancela seleção (`g.selCancel()`), esconde `#conf` e fecha o menu de construção (`menuOpen = false; buildItems()`). |
| `'+'` ou `'='` | Aumenta zoom em $+15\%$: `hwF = clamp(hwF * 1.15, 8, 64)`. |
| `'-'` | Reduz zoom em $-15\%$: `hwF = clamp(hwF / 1.15, 8, 64)`. |
| `'f'` | Liga/desliga o painel de performance `#perf` (`togPerf()`). |
| `'h'` | Aciona `bH.click()`, ciclando o mapa de calor `heatI = (heatI + 1) % 8`. |
| `'p'` | Alterna pausa: `g.speed = g.speed ? 0 : 1`. |
| `'b'` | Abre o modal na aba de Orçamento: `openModal('budget')`. |

---

## 5. Janela Modal e Gráficos Sparkline (`drawModal`, `L2248–L2286`)

A janela `#win` possui 4 abas definidas em `T = [['budget', 'Orçamento'], ['stats', 'Cidade'], ['log', 'Mensagens'], ['new', 'Novo jogo']]`:

1. **Aba `'budget'` (Orçamento, `L2262–L2269`):**
   - Controles `+`/`-` (`[data-k]`, passo `1`, `L2281`) para:
     - `g.tax.r`, `g.tax.c`, `g.tax.i`: limitados a $[0, 30]\%$.
     - `g.interest` (`data-k="int"`): limitado a $[1, 25]\%$.
     - Qualquer clique chama `g.recalc()` e `drawModal()` imediatamente.
   - Exibe projeção ao vivo de juros: $\text{liveR} = \text{Math.round}(|g.\text{funds}| \cdot g.\text{interest} / 1200)$.
   - Exibe texto dinâmico do Banco Central: crédito barato ($\le 5\%$), crédito caro ($\ge 14\%$) ou juros neutros ($6\%\dots13\%$), mais o impacto da inflação na manutenção ($+(2 \cdot \text{inf})\%$).
   - Desenha **4 gráficos SVG Sparkline (`spark(a, col)`, `L2249`)** sobre `g.hist.funds` (`#ffd54a`), `g.hist.pop` (`#7be08a`), `g.hist.happy` (`#7bb8ff`) e `g.hist.inf` (`#ff8a7a`):
     - `viewBox="0 0 100 40"`. Para uma série $a$ de comprimento $L \ge 2$ com mínimo $\text{mn}$, máximo $\text{mx}$ e amplitude $\text{sp} = (\text{mx} - \text{mn}) \parallel 1$:
       $$x_i = \frac{100 i}{L - 1}, \quad y_i = 38 - 36 \cdot \frac{a[i] - \text{mn}}{\text{sp}}$$

2. **Aba `'stats'` (Cidade, `L2270–L2275`):**
   - Distribuição populacional por classe (`Pobre`, `Média`, `Elite`), com percentual `Math.round(pc[c] / tot * 100)` e aprovação por classe `ap = [g.apP, Math.round((g.apP + g.apR) / 2), g.apR]` (destacada em vermelho `.b` se $< 35\%$).
   - Indicadores políticos (`apP`, `apR`, `nProt`, `strikes`) e 12 métricas gerais da cidade.

3. **Aba `'log'` (Mensagens, `L2276`):**
   - Lista `g.logs` (até 40 entradas) com classes `.lg.info`, `.lg.good` ou `.lg.bad`.

4. **Aba `'new'` (Novo Jogo, `L2252–L2254`, `L2277`, `L2282–L2284`):**
   - Estado de configuração de nova partida `NG = { size: 48, type: 'lake', starter: 1 }`.
   - Opções cíclicas `NGO`:
     - `size`: `32` (`Pequeno 32x32`), `48` (`Médio 48x48`), `64` (`Grande 64x64`), `96` (`Enorme 96x96`).
     - `type`: `'continent'` (`Continente`), `'island'` (`Ilha`), `'river'` (`Rio`), `'lake'` (`Lago`).
     - `starter`: `1` (`Vila pronta`), `0` (`Terreno vazio`).
   - Botão `#nCf`: inverte `cfg.confirm = !cfg.confirm`.
   - Botão `#nGo` (`CRIAR CIDADE`): executa `newGame({ size: NG.size, type: NG.type, starter: NG.starter === 1 }); save(); closeModal();`.