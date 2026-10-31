# 02 — Motor de Renderização por Software (`Delta.render`)

> **Propósito:** Documentar com determinismo matemático e algorítmico 100% do pipeline de renderização em software do Delta City (`L1423–L1997` + primitivas 3D de `L925–L1081` e `L1395–L1422`), incluindo estrutura do framebuffer RGBA/Uint32, projeção isométrica, câmera, rasterizadores de polígonos e triângulos Gouraud, os 4 passes de desenho, caches de chunks e sprites com spans opacos, oclusão de camada emissiva e LUT noturna.
> **Referência cruzada:** Fórmulas de geração de terreno e PRNG estão em `03_ALGORITHMS_AND_MATH.md`; catálogo individual de prédios (`res1`..`landmark`) está em `09_BUILDINGS_CATALOG.md`.

---

## 1. Ideia Central e Arquitetura do Framebuffer

O Delta City **não utiliza primitivas de desenho vetorial do Canvas 2D** (`ctx.beginPath`, `ctx.fill`, `ctx.stroke`) para renderizar a cidade. Todo o mundo 3D é rasterizado por software diretamente em memória RAM sobre um `ImageData` (`img.data`, `Uint8ClampedArray` de tamanho $W \times H \times 4$ bytes) e transferido de uma só vez para a GPU via `ctx.putImageData(img, 0, 0)` (`L2293`).

### 1.1 Visão Dupla do Framebuffer (`fb` e `fb32`)
- **`fb` (`Uint8ClampedArray`):** Array de bytes RGBA indexado por $k = (y \cdot W + x) \cdot 4$, onde `fb[k] = R`, `fb[k+1] = G`, `fb[k+2] = B`, `fb[k+3] = A`. Usado quando há alpha blending (`al`) ou jitter/dither por pixel (`jit`).
- **`fb32` (`Uint32Array`, `L1530`):** Criado e cacheado na propriedade `fb._u32 = new Uint32Array(fb.buffer, fb.byteOffset, W * H)`. Em arquiteturas Little-Endian (x86/ARM), um pixel opaco $(R, G, B, 255)$ é empacotado em um inteiro de 32 bits como:
  $$\text{col32} = \text{0xFF000000} \mid ((B \ \& \ 255) \ll 16) \mid ((G \ \& \ 255) \ll 8) \mid (R \ \& \ 255)$$
  Permite preenchimento horizontal via `fb32.fill(col32, start, end)` e cópia de blocos de memória via `fb32.set(subarray, dst)` (velocidade de `memcpy` / SIMD).

### 1.2 Resolução Interna Adaptativa (`resize`, `L2075–L2079`)
Para manter alta taxa de quadros em telas de alta densidade (Retina/4K/Mobile), a resolução interna $(W, H)$ é reduzida por um fator inteiro $s$:
$$s = \max\left(1, \left\lceil \frac{\text{rect.width}}{640} \right\rceil\right)$$
$$W = \max\left(64, \left\lfloor \frac{\text{rect.width}}{s} \right\rfloor\right), \quad H = \max\left(64, \left\lfloor \frac{\text{rect.height}}{s} \right\rfloor\right)$$
O elemento `<canvas id="c">` recebe `cv.width = W; cv.height = H` e é escalado via CSS (`image-rendering: pixelated`) para `rect.width` $\times$ `rect.height`.

---

## 2. Projeção Isométrica 2.5D, Câmera e Conversão Tela ↔ Mundo

### 2.1 Quantização do Zoom e Métricas Espaciais (`L1522`)
A função `render(g, fb, W, H, view)` recebe `view.hw` (na UI, `hwF` contínuo em $[8, 64]$) e seleciona o valor mais próximo na tabela discreta `ZL` de 21 níveis (garantindo que `hw` seja sempre par e evitando invalidação contínua dos caches durante zoom suave):
$$\text{ZL} = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 52, 56, 60, 64]$$
A partir do `hw` escolhido, derivam-se:
- **Meia-altura do tile:** $\text{hh} = \text{hw} / 2$ (proporção isométrica exata $2:1$).
- **Unidade vertical de prédio:** $U = \text{hw} / 16$ pixels por unidade $z$.
- **Altura de degrau de terreno:** $\text{elevPx} = \text{Math.round}(\text{hw} \cdot 0.24)$ pixels por unidade de `cornerH`.
- **Flags de Nível de Detalhe (LOD, `L1527`, `L951`):**
  - `mid`: $\text{hw} \ge 12$
  - `hi`: $\text{hw} \ge 20$
  - `vhi`: $\text{hw} \ge 36$ (exclusivo de `buildings.make`)

### 2.2 Posição da Câmera e Origem de Tela (`L1523–L1525`)
- Coordenadas de câmera: `u0` (padrão `0`) e `v0` (padrão `N`).
- Se `view.follow` for verdadeiro: $u_0 = g.\text{cx} - g.\text{cy}$ e $v_0 = g.\text{cx} + g.\text{cy} + 1$.
- Origem do mundo $(0,0,0)$ em pixels na tela:
  $$\text{ox} = \text{Math.round}\left(\frac{W}{2} - u_0 \cdot \text{hw}\right), \quad \text{oy} = \text{Math.round}\left(\frac{H}{2} - v_0 \cdot \text{hh}\right)$$
- O objeto `g.view = { ox, oy, hw, hh }` é gravado na instância do jogo.

### 2.3 Função de Projeção Mundo → Tela `T(x, y)` (`L1532–L1535`)
Dado qualquer ponto $(x, y)$ no plano do mapa:
$$\text{ix} = \text{clamp}(\text{Math.round}(x), 0, N), \quad \text{iy} = \text{clamp}(\text{Math.round}(y), 0, N)$$
$$\text{hz} = g.\text{cornerH}[\text{iy} \cdot (N + 1) + \text{ix}]$$
$$T(x, y) = \Big[\, \text{ox} + (x - y) \cdot \text{hw} \,,\; \text{oy} + (x + y) \cdot \text{hh} - \text{hz} \cdot \text{elevPx} \,\Big]$$

### 2.4 Projeção Local de Construções `P(u, v, z)` (`L951–L953`)
Dentro de `Delta.buildings.make(X)`, para um edifício de pegada $\text{sz} \in \{1, 2, 3\}$ cujo pivô tem centro de tile projetado em $(X.\text{cx}, X.\text{cy})$:
- $\text{hw}_{\text{eff}} = X.\text{hw} \cdot \text{sz}$, $\quad \text{hh}_{\text{eff}} = X.\text{hh} \cdot \text{sz}$, $\quad U = X.\text{hw} / 16$ (nota: $U$ **não** multiplica por `sz`).
- Deslocamento do centro para pegadas multi-tile: $\text{cy}_0 = X.\text{cy} + (\text{sz} - 1) \cdot X.\text{hh}$.
- Coordenadas locais $u, v \in [-0.5, 0.5]$ e altura $z \ge 0$:
  $$P(u, v, z) = \Big[\, X.\text{cx} + (u - v) \cdot \text{hw}_{\text{eff}} \,,\; \text{cy}_0 + (u + v) \cdot \text{hh}_{\text{eff}} - z \cdot U \,\Big]$$

### 2.5 Projeção Inversa Tela → Tile com Refinamento Iterativo (`g.screenToTile`, `L910–L921`)
Para converter um clique $(\text{sx}, \text{sy})$ em coordenadas de tile $(x, y)$ compensando o relevo 3D:
1. $\text{elevPx} = v.\text{hw} \cdot 0.24$ (ponto flutuante, sem `Math.round`).
2. Estimativa plana ($h = 0$):
   $$u = \frac{\text{sx} - v.\text{ox}}{v.\text{hw}}, \quad w = \frac{\text{sy} - v.\text{oy}}{v.\text{hh}}, \quad x = \left\lfloor \frac{u + w}{2} \right\rfloor, \quad y = \left\lfloor \frac{w - u}{2} \right\rfloor$$
3. **2 iterações de ponto fixo (`it = 0, 1`):**
   - Se `!this.ok(x, y)`, interrompe o laço.
   - Lê a altura média do tile candidato: $h = \text{this.getTerrainHeight}(x, y)$.
   - Corrige a coordenada vertical desfazendo o deslocamento de altura:
     $$w_{\text{adj}} = \frac{\text{sy} + h \cdot \text{elevPx} - v.\text{oy}}{v.\text{hh}}$$
   - Recalcula:
     $$x = \left\lfloor \frac{u + w_{\text{adj}}}{2} \right\rfloor, \quad y = \left\lfloor \frac{w_{\text{adj}} - u}{2} \right\rfloor$$
4. Retorna `[x, y]` se `this.ok(x, y)` for verdadeiro, ou `null` caso contrário.

---

## 3. Primitivas de Rasterização em Software

### 3.1 Estado Global do Rasterizador (`L1433`)
- `CLIP`: limite superior de recorte vertical ($y < \text{CLIP}$ é descartado). Padrão `-1e9`. Usado para revelar progressivamente edifícios em construção de baixo para cima (`L1411–L1412`).
- `ERASE`: booleano (padrão `false`). Quando `true`, `put()` escreve `0, 0, 0, 0` nos 4 canais RGBA (usado para apagar linhas na camada emissiva durante o baking de sprites, `L1774`, `L1780`).

### 3.2 `put(fb, W, H, x, y, c)` (`L1458`)
- Arredonda $x = \text{Math.round}(x)$ e $y = \text{Math.round}(y)$.
- Descarta se $x < 0 \lor y < 0 \lor x \ge W \lor y \ge H \lor y < \text{CLIP}$.
- Calcula $k = (y \cdot W + x) \cdot 4$. Se `ERASE` for `true`, zera `fb[k..k+3] = 0`; senão grava `c[0], c[1], c[2], 255`.

### 3.3 `line(fb, W, H, x0, y0, x1, y1, c)` (`L1514`)
- Interpolador DDA simples: $n = \max(|x_1 - x_0|, |y_1 - y_0|, 1)$.
- Para $i = 0 \dots n$, chama `put(fb, W, H, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c)`.

### 3.4 `fillPoly(fb, W, H, p, c, jit, al)` (`L1435–L1457`)
Rasterizador scanline para polígonos convexos (ou horizontalmente monotônicos) dados por array plano `p = [x0, y0, x1, y1, ...]`:
1. Encontra $y_0 = \min(y_i)$ e $y_1 = \max(y_i)$.
2. Limites de scanline (amostragem no centro da linha $y_c = y + 0.5$):
   $$y_a = \max\big(0,\, \lceil y_0 - 0.5 \rceil,\, \lceil \text{CLIP} - 0.5 \rceil\big), \quad y_b = \min\big(H - 1,\, \lceil y_1 - 0.5 \rceil - 1\big)$$
3. Para cada linha $y \in [y_a, y_b]$ com $y_c = y + 0.5$:
   - Percorre todas as arestas $(a_x, a_y) \to (b_x, b_y)$. Se $(a_y \le y_c \land b_y > y_c) \lor (b_y \le y_c \land a_y > y_c)$, calcula a interseção:
     $$x = a_x + \frac{(y_c - a_y)(b_x - a_x)}{b_y - a_y}$$
     e atualiza $\text{lo} = \min(\text{lo}, x)$ e $\text{hi} = \max(\text{hi}, x)$.
   - Converte para colunas inteiras: $x_a = \max(0, \text{Math.round}(\text{lo}))$, $x_b = \min(W, \text{Math.round}(\text{hi}))$.
4. **Caminho Rápido (`!jit && !al`, `L1439`, `L1449`):**
   - Executa `u32.fill(col32, y * W + xa, y * W + xb)`.
5. **Caminho com Ruído / Alpha (`jit || al`, `L1450–L1455`):**
   - Se `jit` for não-zero, calcula o ruído espacial determinístico por pixel:
     $$n_2 = \Big(\big(((x \cdot 73856093) \oplus (y \cdot 19349663)) \ggg 7\big) \ \& \ 7\Big) - 3 \in [-3, +4]$$
     $$n_2 \leftarrow n_2 \cdot \text{jit}$$
   - Se `al` (alpha $\in (0, 1]$) estiver presente:
     $$\text{fb}[k + \text{ch}] \leftarrow \text{fb}[k + \text{ch}] + (c[\text{ch}] + n_2 - \text{fb}[k + \text{ch}]) \cdot \text{al}, \quad \text{fb}[k + 3] = 255$$
   - Se `!al`: $\text{fb}[k + \text{ch}] = c[\text{ch}] + n_2, \quad \text{fb}[k + 3] = 255$.

### 3.5 `erasePoly(u, W, H, p)` (`L1460–L1474`)
Idêntico ao cálculo de scanlines de `fillPoly` (sem `CLIP`), mas opera diretamente sobre um `Uint32Array u` executando `u.fill(0, y * W + xa, y * W + xb)`. Usado para apagar pixels na camada emissiva quando uma face opaca é desenhada na frente de luzes anteriores.

### 3.6 `terrTri(u32, W, H, a, b, c, T, fine)` (`L1483–L1513`)
Rasterizador de triângulos com interpolação Gouraud de 6 atributos por vértice.
- Cada vértice é um array de 8 elementos: `[x, y, r, g, b, rough, wx, wy]`.
- Para cada scanline $y \in [y_a, y_b]$ ($y_c = y + 0.5$):
  - Intersecta as 3 arestas do triângulo. Na menor interseção $x$ (`lo`), interpola linearmente os 6 atributos `[r, g, b, rough, wx, wy]` no vetor `L[0..5]`. Na maior interseção (`hi`), interpola em `R[0..5]`.
  - Para cada pixel $x \in [x_a, x_b)$ com fator horizontal $s = \text{clamp}\big(\frac{x + 0.5 - \text{lo}}{\max(1, \text{hi} - \text{lo})}, 0, 1\big)$:
    - Interpola coordenadas de mundo $(w_x, w_y)$ e rugosidade $\text{rough}$.
    - Se $\text{rough} > 0$, amostra a textura tileável $256\times256$ `T` (`terrainTex(g.seed)`) com filtro bicúbico/Hermite (`bil(wx * 0.4 + 7, wy * 0.4 + 3)`):
      $$m = 1 + \text{rough} \cdot \big(\text{bil}(w_x \cdot 0.4 + 7,\, w_y \cdot 0.4 + 3) - 0.5\big) \cdot 2$$
    - Calcula a cor modulada $(R, G, B) = \text{clamp}(\text{lerp}(L, R, s) \cdot m, 0, 255)$ e grava em `u32[y * W + x]`.
  - Nota: o parâmetro `fine` é recebido na assinatura (`L1483`), mas não é utilizado no corpo atual.

---

## 4. Preparação do Quadro e Ciclo Solar (`L1520–L1553`)

Antes do Passe 1, `render()` executa:
1. **Fator diurno/noturno (`L1526–L1528`):**
   $$\text{day}_0 = \text{clamp}\big(0.5 + 0.8 \cdot \cos((g.\text{tod} - 0.5) \cdot 6.2832),\, 0,\, 1\big)$$
   $$\text{night} = \begin{cases} \frac{\text{Math.round}((1 - \text{day}_0) \cdot \text{view.qn})}{\text{view.qn}}, & \text{se } \text{view.qn} \\ 1 - \text{day}_0, & \text{caso contrário} \end{cases}, \quad \text{day} = 1 - \text{night}$$
   $$\text{st} = \text{clamp}\left(\frac{g.\text{tod} - 0.25}{0.5},\, 0,\, 1\right)$$
2. **Preenchimento do Fundo (`L1531`):**
   Para cada linha $y \in [0, H)$, com $f = y / H$:
   $$R = (10 + 8f) \mid 0, \quad G = (16 + 12f) \mid 0, \quad B = (28 + 22f) \mid 0$$
   Preenche a linha inteira via `fb32.fill(...)`.
3. **Vetor Solar e Sombras (`L1536`, `L1542`):**
   - Vetor de iluminação do terreno: $\vec{S}_{\text{terr}} = \text{normalize}(-0.55, -0.35, 0.75) \approx (-0.5547, -0.3530, 0.7537)$.
   - Parâmetros de sombra projetada de prédios no kit `X`:
     $$\text{sunX} = (0.9 - 1.8 \cdot \text{st}) \cdot 0.55, \quad \text{sunY} = 0.1, \quad \text{shA} = 0.26 \cdot \text{day}$$
4. **Buffer Emissivo (`D._emb`, `L1539–L1540`):**
   - Aloca (ou reutiliza se $W \times H$ não mudou) `D._emb = new Uint32Array(W * H)` e `D._emb8 = new Uint8ClampedArray(emb32.buffer)`.
   - `nightOn` é verdadeiro se e somente se $\text{night} > 0.25$. Se `nightOn`, zera `emb32.fill(0)`.
5. **Indexação Espacial de Veículos (`vb` e `out`, `L1551–L1552`):**
   - Para cada veículo $v \in g.\text{veh}$:
     $$f_x = v.x + 0.5 + (v.\text{nx} - v.x) \cdot v.p, \quad f_y = v.y + 0.5 + (v.\text{ny} - v.y) \cdot v.p$$
     $$\text{key} = \lfloor f_y \rfloor \cdot N + \lfloor f_x \rfloor$$
     Insere $v$ na lista `vb.get(key)`.
   - Se $v.\text{kind} \ne \text{'car'}$, contabiliza em `out.get(v.st)` quantos veículos saíram da base `v.st` (`o.n++`) e marca `o.near = true` se $v.\text{ri} \le 2 \land v.\text{state} \ne \text{'work'}$ (usado para abrir a porta da garagem dos bombeiros e ativar sirene/viatura externa).

---

## 5. Passe 1: Terreno 3D e Cache de Chunks $8\times8$ (`L1554–L1755`)

### 5.1 Função `ground(Tc, X, poly, vis, A, night, x0, x1, y0, y1, GB)`
Renderiza os tiles $[x_0, x_1) \times [y_0, y_1)$ no buffer `GB = { u32, w, h }`:

1. **Cor e Iluminação por Canto Terrestre (`cinfo(cx, cy)`, `L1573–L1586`):**
   - Avalia os até 4 tiles que compartilham o vértice $(\text{cx}, \text{cy})$: $(t_x, t_y) = (\text{cx} - (q \& 1), \text{cy} - (q \gg 1))$ para $q \in \{0,1,2,3\}$.
   - Para cada tile não-água, calcula `landBase(tx, ty, bb, ch, cx, cy)` (`L1561–L1571`), onde $\text{tint} = \text{tnz}(\text{cx} \cdot 0.3 + 3, \text{cy} \cdot 0.3 + 9)$:
     - `BIO.HILL`: $s = \text{clamp}((\text{ch} - 2)/6, 0, 1)$, $\text{gh} = \text{mix}([98,176,74], [126,196,80], \text{tint})$. Se $s < 0.62$, mistura $\text{gh} \to [176,152,124]$ com $(s/0.62)^{1.4}$ e $\text{rough}=0.03$; senão mistura $[176,152,124] \to [244,247,252]$ (neve) com $(s-0.62)/0.38$ e $\text{rough}=0.025$.
     - `BIO.FOREST`: $\text{mix}([54,148,84], [78,172,84], \text{tint})$, $\text{rough}=0.035$.
     - Costeiro (`isCoastT(tx, ty)`): $\text{mix}([246,220,152], [252,230,166], \text{tint})$, $\text{rough}=0.02$.
     - `BIO.PLAIN`: mistura grama `GRA` $[92,184,70]$, `GRB` $[132,208,84]$ e `DRY` $[170,214,90]$, clareada pela altitude em até $0.25$, $\text{rough}=0.04$.
   - Tira a média das cores e rugosidades dos tiles terrestres vizinhos. Se houver tiles de água adjacentes ($\text{wat} > 0$), mistura com areia úmida `WET` $[226,196,128]$ pelo fator $0.18 + 0.1 \cdot \text{wat}$. Se todos os 4 forem água ($n = 0$), usa `SAND` $[246,220,152]$ e $\text{rough} = 0.05$.
   - **Normal por diferenças finitas centradas (`L1583–L1584`):**
     $$a = (h(\text{cx}+1, \text{cy}) - h(\text{cx}-1, \text{cy})) \cdot 0.225, \quad b_2 = (h(\text{cx}, \text{cy}+1) - h(\text{cx}, \text{cy}-1)) \cdot 0.225$$
     $$\text{shade} = \text{clamp}\left(0.68 + 0.46 \cdot \frac{-a \cdot S_X - b_2 \cdot S_Y + S_Z}{\sqrt{a^2 + b_2^2 + 1}},\, 0.66,\, 1.24\right)$$
   - Multiplica a cor base por `shade` e guarda no `Map cm`.

2. **Cor por Canto Aquático (`winfo(cx, cy)`, `L1587–L1594`):**
   - Busca na janela $6\times6$ ($\text{dx}, \text{dy} \in [-3, 2]$) a menor distância de Chebyshev `dist` ($\le 4$) até um tile não-água.
   - Calcula profundidade $\text{dep} = \text{clamp}((34 - g.\text{elevF}[\text{key}]) / 26, 0, 1)$ e fator combinado $t = \text{clamp}(\text{dist}/4, 0, 1) \cdot 0.8 + \text{dep} \cdot 0.2$.
   - Interpola entre água rasa `WSH` $[132,232,238]$, média `WMID` $[66,176,238]$ ($t = 0.5$) e profunda `WDP` $[40,112,214]$, com $\text{rough} = 0$.

3. **Divisão adaptativa do Quad em 2 Triângulos (`landTile`, `L1606–L1608`):**
   - Se $|h_0 - h_2| \le |h_1 - h_3|$, divide pela diagonal principal $(v_0, v_1, v_2)$ e $(v_0, v_2, v_3)$.
   - Caso contrário, divide pela diagonal secundária $(v_0, v_1, v_3)$ e $(v_1, v_2, v_3)$ para evitar quinas artificiais em encostas.

4. **Saias Rochosas / Falésias (`L1632–L1645`):**
   - Nas bordas sul do tile ($x = N - 1$ ou vizinho $x+1$ é água; $y = N - 1$ ou vizinho $y+1$ é água), se o tile possui elevação $> 0$, desenha polígonos verticais de fechamento com cores $[138, 96, 62]$ (face leste) e $[172, 126, 84]$ (face oeste).

5. **Detalhes de Superfície (`L1649–L1699`):**
   - **Água (`L1649–L1657`):** Em zoom `mid`, desenha 3 cristas de onda animadas por `A` e linhas brancas de espuma nas bordas costeiras.
   - **Planície vazia (`L1658–L1664`):** Em zoom `mid` fora da costa, desenha 2 tufos de grama por tile e, se $\text{hash2}(x, y, \text{seed}) > 68$, uma flor colorida (amarela $>86$, branca $>77$, rosa $>68$).
   - **Marcação de Zona (`L1666–L1671`):** Pinta o losango com verde (`RES` $[70,210,90]$), azul (`COM` $[70,130,240]$) ou amarelo (`IND` $[240,200,50]$) usando alpha `0.08` (se construído) ou `0.32` (se vazio), mais borda interna e 3 pontos brancos em zonas vazias (`hi`).
   - **Estradas (`L1672–L1679`):** Invoca `road(...)` com interpolador bilinear de altura `Ttile(u, v)` sobre os 4 cantos.
   - **Canos subterrâneas (`L1680`):** Se `showPipe` (ferramenta cano ou torre d'água ativa) e `g.pipe[i] === 1`, desenha losango azul $[70, 160, 255]$ no centro do tile.
   - **Vegetação de Floresta e Rochas de Colina (`L1682–L1699`):** Em tiles sem construção (`!g.kind[i]`), desenha 2 (`<12`), 4 (`mid`) ou 7 (`hi`) árvores em `BIO.FOREST`; em `BIO.HILL` (`mid`), se $h_{\max} \ge 5$ e $\text{hash2}(x,y,\text{seed}+7) < 48$, desenha matacão elíptico de 14 lados (nevado se $h_{\max} \ge 7$), ou uma árvore isolada se $\text{hash2}(x,y,\text{seed}+3) < 35$.

### 5.2 Cache de Chunks $8\times8$ (`D._chunks`, `L1701–L1755`)
Para não re-rasterizar triângulos Gouraud de terreno a cada quadro, o mapa $N\times N$ é dividido em blocos de $\text{CS} = 8 \times 8$ tiles:
- **Margem vertical de relevo:** $\text{padY} = \text{elevPx} \cdot 10 + 8$.
- **Dimensões da caixa do chunk $(c_x, c_y)$ (`L1721`):**
  $$b_x = (x_0 - y_1 + 1) \cdot \text{hw} - \text{hw}, \quad b_y = (x_0 + y_0) \cdot \text{hh} - \text{padY}$$
  $$\text{cw} = (x_1 - 1 - y_0 - (x_0 - y_1 + 1) + 2) \cdot \text{hw}$$
  $$\text{ch} = (x_1 + y_1 - 2 - x_0 - y_0) \cdot \text{hh} + 2 \cdot \text{hh} + \text{padY} + \text{elevPx} \cdot 2$$
- **Frustum Culling 2D (`L1722`):** Descarta o chunk imediatamente se $s_x > W \lor s_x + \text{cw} < 0 \lor s_y > H \lor s_y + \text{ch} < 0$, onde $(s_x, s_y) = (\text{ox} + b_x, \text{oy} + b_y)$.
- **Assinatura de Invalidação (`sigOf`, `L1703`):**
  $$h_0 = \text{hw} \cdot 131 + N \cdot 7 + (\text{showPipe} ? 7 : 0) + g.\text{seed} + (g.\text{terrainVer} \parallel 0) \cdot 97$$
  Itera sobre os tiles do chunk expandido em 1 tile de borda ($[x_0-1, x_1+1) \times [y_0-1, y_1+1)$):
  $$h \leftarrow \big(\text{Math.imul}(h, 31) + g.\text{kind}[i]\cdot 5 + g.\text{built}[i]\cdot 3 + g.\text{bio}[i]\cdot 11 + g.\text{slopeMask}[i]\cdot 17 + (\text{showPipe} ? g.\text{pipe}[i] : 0)\big) \mid 0$$
- **Compilação de Spans por Linha (`L1729–L1738`):**
  Ao assar um chunk, tapa furos de 1 pixel transparente entre dois pixels opacos (`L1734`) e grava em `sp` (`Int16Array(ch * 3)`) para cada linha `yy`:
  - `sp[yy*3] = s0` (primeira coluna opaca), `sp[yy*3+1] = s1` (última coluna opaca + 1), `sp[yy*3+2] = 1` se o intervalo $[s_0, s_1)$ não contém nenhum pixel transparente (`!holes`), ou `0` caso contrário.
- **Blitting Otimizado (`L1741–L1748`):** Se `sp[yy*3+2] === 1`, copia a linha inteira com uma única instrução `fb32.set(u.subarray(k + xa, k + xb), dst + xa)`.
- **Política de Evicção LRU (`L1754`):** Limite máximo de **64 MB** (`64 * 1048576` bytes). Quando excedido, remove iterativamente o chunk com menor timestamp `v.t < F.t`.

---

## 6. Cache de Sprites 3D, Sombras em Stencil e Oclusão Emissiva (`L1756–L1837`)

### 6.1 Quando um Edifício Usa Cache vs. Renderização Direta (`drawB`, `L1816–L1818`)
- Edifícios em obra (`t.cons != null`) ou em protesto/greve (`t.riot !== 0`) **nunca usam cache**: são desenhados diretamente no framebuffer via `D.buildings.make(X).drawAt(t)`.
- Todos os demais edifícios são cacheados em `D._spr` usando a chave composta de 11 campos (`L1818`):
  $$\text{key} = [t.k,\, t.\text{lv},\, t.\text{vr},\, t.\text{ab},\, t.\text{cls},\, t.\text{out}?1:0,\, t.\text{open}?1:0,\, t.\text{alarm}?1:0,\, \text{hw},\, \text{sunQ},\, t.\text{sz}\parallel 1]\text{.join('|')}$$
  onde $\text{sunQ} = \text{Math.round}(X.\text{sunX} \cdot 8)$.

### 6.2 Processo de Baking (`bakeSprite(t)`, `L1769–L1798`)
1. **Dimensões do Canvas Temporário:** $\text{SWd} = \text{hw} \cdot 4 \cdot \text{sz}$, $\text{SHt} = \text{hw} \cdot (7 + \text{sz} \cdot 3) + 8$, âncora $(\text{sax}, \text{say}) = (\text{SWd} \gg 1, \text{SHt} - \text{hw} \cdot \text{sz} - 4)$.
2. **Fases de Animação (`L1771–L1772`):**
   - `animates` é verdadeiro para `PARK`, `IND`, `COAL`, `FIRE`, `POLICE`, `MEGA`, `LANDMARK` e `COM` nível 3.
   - Se `animates`, renderiza `phases = 4` quadros ($A \in \{0, 1, 2, 3\}$); caso contrário, `phases = 1`.
3. **Extração de Pixels Animados (`dif`, `L1788–L1790`):**
   - Compara os 4 buffers `bufs[0..3]`. Pixels que mudam entre qualquer fase (até o limite de `1600` pixels) são salvos na lista de deltas `df = [{ x, y, v: [v0, v1, v2, v3] }]` e zerados no buffer base `u[i] = 0` para que o corpo estático seja blitado via `fb32.set` e apenas os pixels animados sejam sobrepostos depois (`L1822–L1823`).
4. **Máscara de Sombra em Stencil (`fillShadowMask`, `L1704–L1718`, `L1779`, `L1791`):**
   - Quando `shadow()` chama `X.poly(q, [0,0,20], 0, X.shA)`, o baker intercepta a chamada (`a === Xb.shA`) e guarda o polígono em `shd`.
   - Ao final, `fillShadowMask` preenche os pixels de `u` que ainda estão transparentes (`!u[row + x]`) com o valor sentinela `0x01000000` (alpha = 1, RGB = 0).
   - Durante o `blitSprite` (`L1810–L1811`), pixels com `v >>> 24 === 255` são copiados normalmente, enquanto pixels com `v !== 0` (sentinela `0x01000000`) e `hasSh` escurecem o terreno já desenhado no framebuffer em $75\%$ sem divisão usando bit-shift rápido:
     $$\text{fb32}[d] = \text{0xFF000000} \mid \big(((\text{fb32}[d] \ \& \ \text{0xFCFCFC}) \cdot 3) \gg 2\big)$$
5. **Baking e Auto-Oclusão da Camada Emissiva (`eb32`, `L1773–L1786`):**
   - Na fase `ph === 0`, janelas acesas (`emQ`) e pontos luminosos sem halo (`emP` com `gl=0`) pintam no buffer emissivo local `eb8`.
   - Qualquer polígono opaco (`!a`), linha (`ln`) ou ponto (`pt`) desenhado **depois** no mesmo prédio chama `erasePoly(eb32, ...)` / `eraseLn`, apagando as luzes que ficaram atrás de outras partes do próprio edifício.
   - O retângulo delimitador mínimo (`ex0..ex1, ey0..ey1`) de `eb32` é recortado em `ex = { px, w, h, ox, oy }`.
6. **Recorte do Bounding Box e LRU (`L1792–L1797`, `L1836`):**
   - Recorta `u` para a caixa mínima `[x0..x1, y0..y1]`, constrói `sp = buildSpans(px, w, h)` e armazena no cache `SP`.
   - O cache de sprites tem limite LRU de **48 MB** (`48 * 1048576` bytes).

---

## 7. Passe 2: Objetos por Profundidade (Painter's Algorithm), Veículos e Semáforos (`L1838–L1867`)

O Passe 2 percorre o mapa em ordem estrita de profundidade isométrica crescente $s = x + y \in [0, 2N - 2]$:
1. Para cada tile $(x, y)$ com $y = s - x$:
   - Ignora se `!g.kind[i] && !vb.get(i)`.
   - Calcula âncora do tile:
     $$\text{cx} = \text{ox} + (x - y) \cdot \text{hw}, \quad \text{cy} = \text{oy} + (x + y + 1) \cdot \text{hh} - \text{cornerH}[y \cdot N_1 + x] \cdot \text{elevPx}$$
   - **Frustum Culling 3D (`vis(cx, cy, sz)`, `L1548`):**
     $$m = \text{sz} \cdot \text{hw} \cdot 3.5$$
     $$\text{visível} \iff (\text{cx} + m > 0) \land (\text{cx} - m < W) \land (\text{cy} + \text{hw} \cdot 3 > 0) \land (\text{cy} - \text{hw} \cdot 9 < H)$$
2. **Ordem exata de desenho dentro do tile $(x, y)$ (`L1847–L1863`):**
   - **a) Edifício (`drawB(t)`):** Desenhado apenas se `g.isOrigin(i)` e (`g.built[i]` ou `k >= K.POLICE`).
     - Se `nightOn` (`night > 0.25`), os spans opacos (`spx[k + xx] >>> 24 === 255`) do prédio **zeram `emb32`** (`L1830`), apagando janelas de prédios desenhados antes (mais ao fundo), e em seguida copiam o buffer emissivo próprio `s.ex` para `emb32` (`L1832`).
   - **b) Protesto (`protest`, `L1852`):** Se `g.riot[i] && g.built[i]`, desenha 5 manifestantes animados, placas (`hw >= 14`) e fogueira de barricada (`flames` com intensidade `34`).
   - **c) Poste de Energia em Lote (`pole`, `L1853`):** Se `g.pw[i] && k !== K.ROAD`.
   - **d) Poste de Energia em Rua (`pole`, `L1855`):** Se `k === K.ROAD && g.pw[i]`. Conecta cabos `[44, 44, 50]` para os vizinhos $(x+1, y)$ e $(x, y+1)$ que também tenham `pw`.
   - **e) Chamas de Incêndio (`flames`, `L1856`):** Se `g.fire[i] && g.isOrigin(i)`, desenha $6 + \lfloor \text{clamp}(f/100, 0.25, 1.4) \cdot 10 \rfloor$ línguas de fogo triangulares animadas, luzes emissivas e 5 partículas de fumaça.
   - **f) Veículos (`car`, `L1857`):** Desenha todos os veículos em `vb.get(i)` deslocados para a mão direita da via ($\text{ox} = -\text{dy} \cdot 0.17, \text{oy} = \text{dx} \cdot 0.17$), com sombra, rodas (`hi`), chassi 3D orientado ao longo do vetor direção, para-brisa (`hi`), faróis/lanternas noturnas (`night > 0.2`) e giroflex piscante (`em` para polícia e bombeiros).
   - **g) Semáforos em Foreground (`roadFG`, `L1859`):** Desenhados **após** os carros em cruzamentos ($\ge 3$ braços de rua, zoom `hi`, fora d'água), alternando verde `[60, 230, 90]` e vermelho `[240, 60, 50]` conforme `((A >> 2) + x + y) & 1`.
   - **h) Empilhamento de Balões de Alerta (`L1860–L1863`):** Em zoom $\text{hw} \ge 12$, para prédios prontos sem obra, verifica na ordem de prioridade: falta de rua (`'road'`) $\to$ falta de luz (`'bolt'`) $\to$ falta de água (`'drop'`), sobrescritos por `'riot'` e por último `'fire'`. Pisca ocultando quando $(A + x) \bmod 4 === 3$.
3. **Partículas e Alertas de Crime (`L1865–L1866`):**
   - Desenha todas as partículas `g.fx` (`'dust'` = 14 pontos radiais de poeira; `'done'` = 10 pontos dourados festivos com brilho emissivo, `L1414–L1418`).
   - Para cada crime ativo em `g.crimes` (se $\text{hw} \ge 8$), agenda um balão `'cop'`.

---

## 8. Passe 3: Seleção, Raio de Cobertura, Cursor 3D e Heatmaps (`L1868–L1888`)

1. **Prévia de Construção (`g.preview`, `L1869–L1873`):**
   Para cada tile `{ i, c }` em `g.preview.tiles`, projeta os 4 cantos `p0..p3` com `T(x, y)` e preenche com alpha `0.5`:
   - Inválido ($c < 0$): vermelho `[240, 60, 60]`.
   - Válido e com saldo ($c \ge 0 \land \text{pv.ok}$): verde `[60, 240, 110]`.
   - Válido, mas sem saldo ou bloqueado ($c \ge 0 \land !\text{pv.ok}$): laranja `[255, 170, 40]`.
2. **Anel de Raio de Cobertura (`L1874–L1875`):**
   Se a ferramenta for `mode === 'point'` e `FAC[tool.k].r` existir, desenha um polígono de 72 segmentos ao redor de $(g.\text{cx} + 0.5, g.\text{cy} + 0.5)$ com raio `rad` acompanhando a elevação do terreno via `T(...)`, na cor ciano `[120, 230, 255]`.
3. **Cursor Amarelo (`L1876–L1877`):**
   Contorna o tile $(g.\text{cx}, g.\text{cy})$ com 4 linhas de cor `[255, 232, 40]`.
4. **Sobreposição de Mapa de Calor (`view.heat`, `L1879–L1888`):**
   Para cada tile não-água visível na tela:
   - Extrai o valor normalizado $v(i) \in [0, 100]$:
     - `'cls'`: $g.\text{cls}[i] \cdot 50$
     - `'risk'`: $g.\text{riskAt}(i)$
     - `'poll'`: $g.\text{poll}[i]$
     - `'crime'`: $g.\text{cr}[i]$
     - `'land'`: $g.\text{land}[i]$
     - `'elev'`: $g.\text{elev}[i] \cdot 12.5$
     - `'cPol'`: $g.\text{cPol}[i]$
   - Define $t = \text{clamp}(v(i)/100, 0, 1)$. Se a métrica for positiva (`!bad`, ou seja, `'cls'`, `'land'`, `'elev'`, `'cPol'`), inverte $t \leftarrow 1 - t$ (para que valores altos fiquem verdes e baixos vermelhos).
   - Gradiente verde $\to$ amarelo $\to$ vermelho com alpha `0.45`:
     $$c = \begin{cases} [\,(60 + 380t) \mid 0,\; 220,\; 60\,], & \text{se } t < 0.5 \\ [\,250,\; (220 - 380(t - 0.5)) \mid 0,\; 50\,], & \text{se } t \ge 0.5 \end{cases}$$

---

## 9. Passe 4: Pós-Processamento Noturno via LUT 32-bits, Emissivos e Bolhas (`L1889–L1914`)

1. **LUT de Crepúsculo e Noite (`night > 0.18`, `L1890–L1903`):**
   - Fator de crepúsculo (pico em $\text{night} = 0.45$, zero fora de $[0.20, 0.70]$):
     $$\text{dusk} = \max\big(0,\, 1 - |\text{night} - 0.45| \cdot 4\big) \cdot 0.5$$
   - Multiplicadores de ponto fixo (escala $/256$) e offset azul:
     $$m_a = \text{Math.round}\big((1 - 0.64 \cdot \text{night}) \cdot (1 + 0.1 \cdot \text{dusk}) \cdot 240\big)$$
     $$m_b = \text{Math.round}\big((1 - 0.58 \cdot \text{night}) \cdot 238\big)$$
     $$m_c = \text{Math.round}\big((1 - 0.30 \cdot \text{night}) \cdot (1 - 0.12 \cdot \text{dusk}) \cdot 232\big), \quad \text{add} = (10 \cdot \text{night}) \mid 0$$
   - Preenche `D._lut` (`Uint32Array(768)`) para $i \in [0, 255]$:
     - `lut[i] = Math.min(255, (i * ma) >> 8)` (Canal R)
     - `lut[256 + i] = Math.min(255, (i * mb) >> 8) << 8` (Canal G)
     - `lut[512 + i] = (Math.min(255, ((i * mc) >> 8) + add) << 16) | 0xff000000` (Canal B + Alpha 255)
   - Aplica em todos os $W \times H$ pixels do framebuffer com apenas 3 lookups e 2 ORs bit-a-bit por pixel (`L1899–L1902`):
     $$\text{fb32}[p] = \text{lut}[\text{px} \ \& \ 255] \mid \text{lut}[256 + ((\text{px} \ggg 8) \ \& \ 255)] \mid \text{lut}[512 + ((\text{px} \ggg 16) \ \& \ 255)]$$

2. **Composição da Camada Emissiva Ocluída (`L1905`):**
   - Se `nightOn` ($\text{night} > 0.25$), copia todos os pixels não-zero de `emb32` sobre o framebuffer já escurecido: `if (v) fb32[p] = v`.

3. **Pontos de Brilho com Halo e Balões de Alerta (`em`, `L1906–L1913`):**
   - Se o item `e` tem `e.b` (nome do ícone), desenha o balão branco $8\times8$ com ponta inferior e ícone $5\times5$ colorido via `bubble(fb, W, H, e.x, e.y, e.b, hw >= 18 ? 2 : 1)` (`L1916–L1922`).
   - Se for ponto luminoso com halo (`e.f === 1` e $\text{night} > 0.2$), pinta o pixel central `put(fb, W, H, e.x, e.y, e.c)` e mistura os 4 vizinhos ortogonais D4 na proporção $60\%$ fundo + $40\%$ cor da luz (`L1912`).