# 03 — Algoritmos Procedurais e Matemática Exata (Delta City)

> **Propósito:** Especificar todas as fórmulas matemáticas, funções de hash e PRNG, álgebra vetorial, síntese de ruído multi-oitava (FBM e Ridged Multifractal), geração procedural de terreno em 2 fases, máscaras de inclinação e algoritmos geométricos (`hull`, cilindros, cones, árvores e sombras) do Delta City. Todas as constantes e operações bit-a-bit são reproduzidas literalmente (`input -> fórmula exata -> output`).
> **Referência cruzada:** Fórmulas de economia, felicidade, demanda e eventos residem em `04_STATE_AND_SIMULATION.md`.

---

## 1. Funções Utilitárias Base, Hash Espacial e PRNG

### 1.1 Saturação Linear (`clamp`, `L135`)
- **Assinatura:** `clamp(v, a, b)`
- **Input:** `v` (número), `a` (limite inferior), `b` (limite superior).
- **Fórmula Exata:**
  $$\text{clamp}(v, a, b) = \begin{cases} a, & \text{se } v < a \\ b, & \text{se } v > b \\ v, & \text{caso contrário} \end{cases}$$

### 1.2 Hash Espacial 2D Determinístico (`hash2`, `L136`)
- **Assinatura:** `hash2(x, y, s)`
- **Input:** `x, y` (coordenadas inteiras de grade), `s` (semente inteira).
- **Fórmula Bit-a-Bit Exata (aritmética inteira de 32 bits com sinal `Math.imul` e shift sem sinal `>>>`):**
  $$h_0 = \big(s + \text{Math.imul}(x, 374761393) + \text{Math.imul}(y, 668265263)\big) \mid 0$$
  $$h_1 = \text{Math.imul}\big(h_0 \oplus (h_0 \ggg 13),\, 1274126177\big)$$
  $$\text{hash2}(x, y, s) = \frac{\big((h_1 \oplus (h_1 \ggg 16)) \ggg 0\big) \bmod 1000}{10}$$
- **Output:** Número em ponto flutuante no intervalo discreto $[0.0, 99.9]$ com passo $0.1$ ($1000$ valores possíveis equiprováveis).

### 1.3 Gerador Pseudoaleatório de Estado (`Game.prototype.rand`, `L247`)
Variante exata do algoritmo **Mulberry32** operando sobre a propriedade `this.rs` (inteiro de 32 bits inicializado com `this.seed` em `L229`):
- **Fórmula de Transição de Estado e Output:**
  $$t_0 = \text{this.rs} \leftarrow (\text{this.rs} + \text{0x6D2B79F5}) \mid 0$$
  $$t_1 = \text{Math.imul}\big(t_0 \oplus (t_0 \ggg 15),\, t_0 \mid 1\big)$$
  $$t_2 = t_1 \oplus \Big(t_1 + \text{Math.imul}\big(t_1 \oplus (t_1 \ggg 7),\, t_1 \mid 61\big)\Big)$$
  $$\text{rand}() = \frac{(t_2 \oplus (t_2 \ggg 14)) \ggg 0}{4294967296}$$
- **Output:** `number` $\in [0, 1)$ com resolução de $2^{-32}$.

### 1.4 Gerador da Textura de Terreno $256\times256$ (`terrainTex`, `L1476–L1480`)
- **Input:** `seed` (`g.seed`).
- **Inicialização do estado `s`:**
  $$s_0 = (\text{seed} \cdot 2654435761 + 12345) \ggg 0$$
- **Laço para $i = 0 \dots 65535$:**
  $$s \leftarrow (s + \text{0x6D2B79F5}) \mid 0$$
  $$z_1 = \text{Math.imul}(s \oplus (s \ggg 15),\, s \mid 1)$$
  $$z_2 = z_1 \oplus \big(z_1 + \text{Math.imul}(z_1 \oplus (z_1 \ggg 7),\, z_1 \mid 61)\big)$$
  $$t[i] = \big((z_2 \oplus (z_2 \ggg 14)) \ggg 0\big) \ \& \ 255$$
- **Output:** `Uint8Array(65536)` com bytes em $[0, 255]$.

---

## 2. Álgebra Vetorial 3D (`Delta.Vector`, `L139–L149`)

Todos os objetos `Vector` são imutáveis (`Object.freeze(this)` no construtor) e coerzem entradas com `+x || 0`:

| Método | Input | Fórmula Exata | Output |
|---|---|---|---|
| `new Vector(x,y,z)` | `x, y, z` | $\vec{u} = (+x \parallel 0,\, +y \parallel 0,\, +z \parallel 0)$ | `Vector` congelado |
| `u.copy()` | — | $\text{new Vector}(u_x, u_y, u_z)$ | `Vector` |
| `u.add(v)` | `v: Vector` | $(u_x + v_x,\, u_y + v_y,\, u_z + v_z)$ | `Vector` |
| `u.sub(v)` | `v: Vector` | $(u_x - v_x,\, u_y - v_y,\, u_z - v_z)$ | `Vector` |
| `u.scale(s)` | `s: number` | $(u_x \cdot s,\, u_y \cdot s,\, u_z \cdot s)$ | `Vector` |
| `u.dot(v)` | `v: Vector` | $u_x v_x + u_y v_y + u_z v_z$ | `number` |
| `u.cross(v)` | `v: Vector` | $(u_y v_z - u_z v_y,\; u_z v_x - u_x v_z,\; u_x v_y - u_y v_x)$ | `Vector` |
| `u.length()` | — | $\text{Math.hypot}(u_x, u_y, u_z) = \sqrt{u_x^2 + u_y^2 + u_z^2}$ | `number` |
| `u.normalized()` | — | $l = \text{u.length}() \parallel 1 \implies (u_x/l,\, u_y/l,\, u_z/l)$ | `Vector` unitário |

---

## 3. Síntese de Ruído Coerente (`qnoise`, `fbm`, `ridgedFbm`, `L166–L188`)

### 3.1 Ruído de Valor com Interpolação Quíntica de Perlin (`qnoise`, `L166–L171`)
- **Assinatura:** `qnoise(x, y, s, cell)`
- **Input:** coordenadas contínuas $(x, y)$, semente $s$, tamanho da célula `cell`.
- **Fórmula Exata:**
  1. Coordenadas de célula e parte fracionária:
     $$f_x = \frac{x}{\text{cell}}, \quad f_y = \frac{y}{\text{cell}}, \quad x_0 = \lfloor f_x \rfloor, \quad y_0 = \lfloor f_y \rfloor, \quad t_x = f_x - x_0, \quad t_y = f_y - y_0$$
  2. Polinômio quíntico $C^2$-contínuo $S(t) = t^3(t(6t - 15) + 10) = 6t^5 - 15t^4 + 10t^3$:
     $$s_x = t_x^3 (t_x (6 t_x - 15) + 10), \quad s_y = t_y^3 (t_y (6 t_y - 15) + 10)$$
  3. Amostragem dos 4 vértices da grade via `hash2`:
     $$a = \text{hash2}(x_0, y_0, s), \quad b = \text{hash2}(x_0 + 1, y_0, s)$$
     $$c = \text{hash2}(x_0, y_0 + 1, s), \quad d = \text{hash2}(x_0 + 1, y_0 + 1, s)$$
  4. Interpolação bilinear suavizada:
     $$\text{qnoise}(x, y, s, \text{cell}) = \big(a + (b - a) s_x\big)(1 - s_y) + \big(c + (d - c) s_x\big) s_y$$
- **Output:** `number` $\in [0.0, 99.9]$.

### 3.2 Movimento Browniano Fracionário (`fbm`, `L172–L179`)
- **Assinatura:** `fbm(x, y, s, baseCell, octaves)`
- **Parâmetros de acumulação:** $\text{oct} = \text{octaves} \parallel 4$, $\text{amp}_0 = 0.5$, $\text{freq}_0 = 1$, **lacunaridade** $= 2.02$, **ganho (persistência)** $= 0.5$, **passo de semente por oitava** $= +37$.
- **Fórmula Exata:**
  Para $o = 0, 1, \dots, \text{oct} - 1$:
  $$\text{val} \mathrel{+}= \text{amp} \cdot \text{qnoise}(x \cdot \text{freq},\; y \cdot \text{freq},\; s + 37o,\; \text{baseCell})$$
  $$\text{norm} \mathrel{+}= \text{amp}, \quad \text{amp} \leftarrow 0.5 \cdot \text{amp}, \quad \text{freq} \leftarrow 2.02 \cdot \text{freq}$$
  $$\text{fbm} = \frac{\text{val}}{\text{norm}}$$
- **Output:** `number` $\in [0.0, 99.9]$.

### 3.3 Multifractal de Cristas Afiadas (`ridgedFbm`, `L180–L188`)
- **Assinatura:** `ridgedFbm(x, y, s, baseCell, octaves)`
- **Parâmetros:** $\text{oct} = \text{octaves} \parallel 3$, $\text{amp}_0 = 0.5$, $\text{freq}_0 = 1$, $\text{weight}_0 = 1$, **lacunaridade** $= 2.1$, **ganho** $= 0.5$, **passo de semente** $= +53$.
- **Fórmula Exata por Oitava $o = 0 \dots \text{oct} - 1$:**
  $$n_{\text{raw}} = 1 - \left| \frac{\text{qnoise}(x \cdot \text{freq},\; y \cdot \text{freq},\; s + 53o,\; \text{baseCell})}{50} - 1 \right| \in [0, 1]$$
  $$n = n_{\text{raw}}^2 \cdot \text{weight}$$
  $$\text{weight} \leftarrow \text{clamp}(n \cdot 1.6,\, 0,\, 1)$$
  $$\text{val} \mathrel{+}= n \cdot \text{amp}, \quad \text{norm} \mathrel{+}= \text{amp}, \quad \text{amp} \leftarrow 0.5 \cdot \text{amp}, \quad \text{freq} \leftarrow 2.1 \cdot \text{freq}$$
  $$\text{ridgedFbm} = \left(\frac{\text{val}}{\text{norm}}\right) \cdot 100$$
- **Output:** `number` $\in [0, 100]$.

---

## 4. Geração Procedural de Terreno em 2 Fases (`genTerrain`, `L309–L375`)

### 4.1 Parâmetros Globais de Inicialização (`L310–L313`)
Dado o tamanho do mapa $N$, número de vértices por lado $N_1 = N + 1$, semente $s = \text{this.seed}$ e tipo $\text{type} \in \{\text{'continent'}, \text{'island'}, \text{'river'}, \text{'lake'}\}$:
- **Centro do mapa:** $c = 0.5 N$.
- **Escala da célula de ruído:** $\text{cell} = \max(6,\, N / 3.4)$.
- **Raio do platô metropolitano central:** $\text{plateauR} = \min(11.5,\, 0.24 N)$.
- **Consumo de `this.rand()` na inicialização (atenção à ordem):**
  - Se $\text{type} === \text{'river'}$ (consome **3** chamadas de `rand()`):
    $$\text{rv} = \Big\{\, a: N \cdot (0.11 + r_1 \cdot 0.1),\; f: 1.4 + r_2 \cdot 1.6,\; \text{ph}: r_3 \cdot 6.28,\; w: 1.6 + \frac{N}{40} \,\Big\}$$
  - Se $\text{type} === \text{'lake'}$ (consome **3** chamadas de `rand()`):
    $$\text{lk} = \Big[\, N \cdot (0.24 + r_1 \cdot 0.16),\; N \cdot (0.24 + r_2 \cdot 0.16),\; N \cdot (0.17 + r_3 \cdot 0.08) \,\Big]$$
  - Se `'continent'` ou `'island'`: consome **0** chamadas de `rand()`.

---

### 4.2 Fase 0: Altimetria por Vértices $(\text{cx}, \text{cy}) \in [0, N]^2$ (`L316–L353`)

Para cada canto $(\text{cx}, \text{cy})$, executa-se a seguinte cadeia de 7 transformações sobre a elevação $e$:

1. **Domain Warping 2D (`L317–L318`):**
   $$w_x = \text{cx} + \big(\text{fbm}(\text{cx},\, \text{cy},\, s + 101,\, \text{cell} \cdot 0.85,\, 3) - 50\big) \cdot 0.16$$
   $$w_y = \text{cy} + \big(\text{fbm}(\text{cx} + 31,\, \text{cy} + 17,\, s + 203,\, \text{cell} \cdot 0.85,\, 3) - 50\big) \cdot 0.16$$

2. **Síntese Híbrida Base + Cristas (`L319–L321`):**
   $$\text{base} = \text{fbm}(w_x, w_y, s, \text{cell}, 4)$$
   $$\text{ridge} = \text{ridgedFbm}(w_x, w_y, s + 409, \text{cell} \cdot 0.9, 3)$$
   $$e_1 = 0.68 \cdot \text{base} + 0.32 \cdot \text{ridge}$$

3. **Modelagem Macro-Geográfica por Tipo de Mapa (`L323–L325`):**
   $$d_{\text{norm}} = \text{hypot}\left(\frac{\text{cx} - c}{0.5N},\, \frac{\text{cy} - c}{0.5N}\right)$$
   $$e_2 = \begin{cases} e_1 - \max(0,\, d_{\text{norm}} - 0.36) \cdot 92, & \text{se } \text{type} === \text{'island'} \\ e_1 + (d_{\text{norm}} - 0.55) \cdot 28, & \text{se } \text{type} === \text{'continent'} \land d_{\text{norm}} > 0.55 \\ e_1, & \text{caso contrário} \end{cases}$$

4. **Aplainamento Hermite da Bacia Central (`L328–L333`):**
   Seja $d_c = \text{hypot}(\text{cx} - c, \text{cy} - c)$. Se $d_c < 1.35 \cdot \text{plateauR}$:
   $$t = \text{clamp}\left(\frac{d_c - 0.72 \cdot \text{plateauR}}{0.63 \cdot \text{plateauR}},\, 0,\, 1\right), \quad \text{smooth} = t^2 (3 - 2t)$$
   $$e_3 = 46 \cdot (1 - \text{smooth}) + e_2 \cdot \text{smooth}$$
   *(Para $d_c \le 0.72 \cdot \text{plateauR}$, $t = 0 \implies e_3 = 46$, que corresponde exatamente a $\text{cornerH} = 2$).*

5. **Escavação de Calha Fluvial Senoidal (`rv`, `L335–L342`):**
   Se $\text{type} === \text{'river'}$:
   $$r_x = c + 0.92 \cdot \text{plateauR} + \text{rv}.a \cdot \sin\left(\frac{\text{cy}}{N} \cdot \text{rv}.f \cdot \pi + \text{rv}.\text{ph}\right)$$
   $$d_r = |\text{cx} - r_x|$$
   Se $d_r < 2.4 \cdot \text{rv}.w$:
   $$r_t = \text{clamp}\left(\frac{d_r}{2.4 \cdot \text{rv}.w},\, 0,\, 1\right) \implies e_4 = \min\big(e_3,\, 14 + 36 \cdot r_t^2\big)$$

6. **Escavação de Bacia Lacustre (`lk`, `L343–L349`):**
   Se $\text{type} === \text{'lake'}$:
   $$d_l = \text{hypot}(\text{cx} - \text{lk}[0],\, \text{cy} - \text{lk}[1])$$
   Se $d_l < 1.35 \cdot \text{lk}[2]$:
   $$l_t = \text{clamp}\left(\frac{d_l}{1.35 \cdot \text{lk}[2]},\, 0,\, 1\right) \implies e_5 = \min\big(e_4,\, 12 + 38 \cdot l_t^2\big)$$

7. **Quantização para Níveis Discretos (`L350–L352`):**
   $$e = \text{clamp}(e_5,\, 0,\, 100)$$
   $$\text{elevF}[\text{cy} \cdot N_1 + \text{cx}] = e$$
   $$\text{cornerH}[\text{cy} \cdot N_1 + \text{cx}] = \begin{cases} 0, & \text{se } e < 34 \\ \min\left(9,\, 1 + \left\lfloor \frac{e - 34}{7.5} \right\rfloor\right), & \text{se } e \ge 34 \end{cases}$$

**Tabela de Correspondência Exata `elevF` $\to$ `cornerH`:**
| Faixa de `elevF` | Nível `cornerH` | Significado Geomorfológico |
|---|---|---|
| $[0.0,\, 34.0)$ | `0` | Nível do mar / leito submerso |
| $[34.0,\, 41.5)$ | `1` | Planície costeira / várzea baixa |
| $[41.5,\, 49.0)$ | `2` | Platô metropolitano padrão ($e = 46$) |
| $[49.0,\, 56.5)$ | `3` | Terraço elevado |
| $[56.5,\, 64.0)$ | `4` | Início de colina (`BIO.HILL` se $\max(h) \ge 4$) |
| $[64.0,\, 71.5)$ | `5` | Colina média (início de rochas se $\ge 5$) |
| $[71.5,\, 79.0)$ | `6` | Monte alto |
| $[79.0,\, 86.5)$ | `7` | Pico alpino (rochas nevadas se $\ge 7$) |
| $[86.5,\, 94.0)$ | `8` | Cordilheira alta |
| $[94.0,\, 100.0]$ | `9` | Cume máximo |

---

### 4.3 Fase 1: Hidrologia, Umidade e Classificação de Biomas (`L355–L375`)

Para cada tile $(x, y) \in [0, N)^2$ com índice $i = yN + x$ e canto superior-esquerdo $i_0 = yN_1 + x$:
1. **Média de Elevação Contínua dos 4 Cantos (`L359`):**
   $$e_{\text{avg}} = 0.25 \cdot \big(\text{elevF}[i_0] + \text{elevF}[i_0 + 1] + \text{elevF}[i_0 + N_1 + 1] + \text{elevF}[i_0 + N_1]\big)$$
2. **Campo de Umidade (`moisture[i]`, `L360–L361`):**
   $$m = \text{clamp}\Big(\text{fbm}(x + 19,\, y - 13,\, s \oplus \text{0x9e37},\, \text{cell} \cdot 0.65,\, 3) + (55 - e_{\text{avg}}) \cdot 0.18 + \big(\text{fbm}(x + 77,\, y - 41,\, s \oplus \text{0x51ed},\, 3.4,\, 2) - 50\big) \cdot 0.4,\; 0,\; 100\Big)$$
   $$\text{moisture}[i] = m \mid 0$$
3. **Árvore de Decisão Estrita de Bioma (`L362–L372`):**
   - **Condição 1 (`BIO.WATER = 0`):** se $(h_0 = 0 \land h_1 = 0 \land h_2 = 0 \land h_3 = 0) \lor e_{\text{avg}} < 33.5$:
     $$\text{bio}[i] = 0, \quad h_0 = h_1 = h_2 = h_3 = 0 \text{ (força os 4 cantos no array cornerH a zero)}$$
   - **Condição 2 (`BIO.HILL = 3`):** senão, se $\max(h_0, h_1, h_2, h_3) \ge 4 \lor e_{\text{avg}} > 66$:
     $$\text{bio}[i] = 3$$
   - **Condição 3 (`BIO.FOREST = 2`):** senão, se $m > 58 \land \text{hypot}(x - c, y - c) > 0.62 \cdot \text{plateauR}$:
     $$\text{bio}[i] = 2$$
   - **Condição 4 (`BIO.PLAIN = 1`):** caso contrário:
     $$\text{bio}[i] = 1$$

---

### 4.4 Máscaras de Inclinação (`updateSlopeMasks`, `L283–L293`) e Terraplenagem (`flattenArea`, `L294–L306`)

1. **`updateSlopeMasks()`:** Para cada tile $(x, y)$:
   $$\text{mn} = \min(h_0, h_1, h_2, h_3), \quad \text{mx} = \max(h_0, h_1, h_2, h_3)$$
   $$\text{mask} = (h_0 > \text{mn} ? 1 : 0) \mid (h_1 > \text{mn} ? 2 : 0) \mid (h_2 > \text{mn} ? 4 : 0) \mid (h_3 > \text{mn} ? 8 : 0)$$
   $$\text{slopeMask}[yN + x] = \text{mask} \mid \big(\min(15,\, \text{mx} - \text{mn}) \ll 4\big)$$
   $$\text{elev}[yN + x] = 0.25 \cdot (h_0 + h_1 + h_2 + h_3)$$
   Ao final, incrementa `this.terrainVer++`.

2. **`flattenArea(x0, y0, w, h, targetH)`:**
   - Opera sobre todos os vértices $(x, y) \in [x_0, x_0 + w] \times [y_0, y_0 + h]$ dentro de $[0, N]^2$.
   - Se `targetH == null`: calcula a média aritmética dos `cornerH` existentes na região e define $\text{targetH} = \max(1, \text{Math.round}(\text{sum} / \max(1, \text{cnt})))$.
   - Atribui em cada vértice da região:
     $$\text{cornerH}[yN_1 + x] = \text{targetH}, \quad \text{elevF}[yN_1 + x] = \max(36,\, \text{targetH} \cdot 11)$$
   - Chama `this.updateSlopeMasks()`.

---

## 5. Algoritmos Geométricos 3D (`Delta.buildings.make`, `L950–L1081`)

### 5.1 Fecho Convexo 2D — Andrew's Monotone Chain (`hull`, `L958–L963`)
Usado por `shadow(u0, v0, u1, v1, h)` para encontrar o polígono de contorno da projeção da base do prédio somada à base deslocada pelo sol $(+\text{sunX}\cdot h \cdot U,\, +\text{sunY}\cdot h \cdot U)$:
1. Ordena os pontos `pts` lexicograficamente por $x$ crescente e, em caso de empate, por $y$ crescente: `pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])`.
2. Produto vetorial 2D (orientação):
   $$\text{cr}(o, a, b) = (a_x - o_x)(b_y - o_y) - (a_y - o_y)(b_x - o_x)$$
3. Constrói a cadeia inferior `lo` e a cadeia superior `up`, removendo o último ponto enquanto $\text{cr} \le 0$ (curva não-positiva ou pontos colineares).
4. Remove o último ponto duplicado de cada metade e retorna `lo.concat(up)`.

### 5.2 Iluminação de Materiais e Cálculos de Cilindros/Cones (`L937`, `L1019–L1029`)
- **Material de Bloco (`mat(c)`, `L937`):**
  $$\text{mat}(c) = \big\{\, t: \text{sh}(c, 1.14),\; l: c,\; r: \text{sh}(c, 0.70) \,\big\}$$
  onde `t` é o topo ($z = z_1$), `l` é a face sudoeste ($v = v_1$) e `r` é a face sudeste ($u = u_1$).
- **Cilindro Vertical (`cyl(u, v, r, z0, z1, c, seg, stripe)`, `L1019–L1027`):**
  - Raios projetados na elipse isométrica: $a_x = r \cdot \text{hw}_{\text{eff}} \cdot 1.4142$, $a_y = r \cdot \text{hh}_{\text{eff}} \cdot 1.4142$.
  - Número de faixas verticais: $n = \text{seg} \parallel (\text{hi} ? 12 : 6)$.
  - Para cada faixa $i \in [0, n)$:
    $$t_0 = -1 + \frac{2i}{n}, \quad t_1 = -1 + \frac{2(i+1)}{n}, \quad t_m = \frac{t_0 + t_1}{2}$$
    $$x_0 = c_{0x} + t_0 a_x, \quad x_1 = c_{0x} + t_1 a_x, \quad f_0 = \sqrt{1 - t_0^2} \cdot a_y, \quad f_1 = \sqrt{1 - t_1^2} \cdot a_y$$
    $$\text{col} = \text{sh}\left(c,\, 1.22 - 0.62 \cdot \frac{t_m + 1}{2}\right)$$
    *(Varia suavemente o brilho de $1.22\times$ na borda esquerda iluminada até $0.60\times$ na borda direita sombreada).*
  - Topo elíptico de 18 lados com cor $\text{sh}(c, 1.3)$.

### 5.3 Recorte Progressivo de Obras (`drawAt`, `L1408–L1412`)
Quando um edifício possui `t.cons = { p, from, dur }`:
1. Se `cs.from > 0` (upgrade de prédio existente) e $p < 0.5$, desenha primeiro o modelo do nível anterior `old(t)`.
2. Desenha o canteiro de obras `constructionSite(bx, H, p, big)`, onde a altura do andaime é:
   $$\text{cur} = H \cdot \text{clamp}\left(\frac{p - 0.12}{0.88},\, 0,\, 1\right)$$
3. Se $p > 0.12$, calcula a fração revelada $\text{pr} = \text{clamp}\big(\frac{p - 0.12}{0.88}, 0, 1\big)$ e a linha de corte horizontal em coordenadas de tela:
   $$\text{clipY} = X.\text{cy} + \text{hh}_{\text{eff}} - \text{pr} \cdot (H \cdot U + \text{hw}_{\text{eff}} \cdot 1.3)$$
4. Define `X.setClip(clipY)`, invoca a função do prédio novo `fn(t)` (que só consegue pintar pixels abaixo de `clipY`, isto é, $y \ge \text{clipY}$), restaura `X.setClip(-1e9)` e, se `mid && pr < 1`, desenha 4 faíscas de solda animadas exatamente sobre a linha `clipY`.