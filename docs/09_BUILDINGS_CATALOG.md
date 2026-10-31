# 09 — Catálogo Técnico da Biblioteca de Construções 3D (`Delta.buildings`)

> **Propósito:** Documentar exaustivamente todos os 21 modelos procedurais 3D gerados por código em `L925–L1422` (`res1..res3`, `com1..com3`, `ind1..ind3`, `police`, `fire`, `hosp`, `school`, `coal`, `solar`, `wtower`, `park`, `skyRes`, `skyCom`, `megaTower`, `landmark`), incluindo paletas de cores (`C`), fonte matricial `FONT`, função tonalizadora de classe social/abandono (`t.tn`), tabelas de altura/caixa de obra (`HEIGHT`, `BOX`) e as coordenadas exatas $(u, v, z)$ de cada sub-bloco.

---

## 1. Paletas Globais (`C`), Fonte Matricial (`FONT`) e Tonalizador (`t.tn`)

### 1.1 Paletas de Cores RGB (`C`, `L939–L947`)
| Chave | Valores RGB Exatos | Uso Principal |
|---|---|---|
| `C.wall` (7 cores) | `[240,224,192]`, `[234,202,172]`, `[208,222,234]`, `[244,234,170]`, `[230,186,178]`, `[204,218,192]`, `[246,246,240]` | Paredes de casas residenciais (`res1`) |
| `C.roof` (7 cores) | `[192,84,58]`, `[152,72,56]`, `[98,112,144]`, `[124,110,92]`, `[172,60,60]`, `[72,92,122]`, `[90,70,60]` | Telhados `gable` e `hip` de `res1` (`pick(C.roof, v >> 3)`) |
| `C.apt` (5 cores) | `[228,210,192]`, `[202,180,172]`, `[184,200,214]`, `[218,192,152]`, `[196,172,160]` | Fachadas de edifícios de apartamentos (`res2`) |
| `C.glass` (4 cores)| `[112,200,236]`, `[122,172,236]`, `[100,222,206]`, `[170,190,240]` | Torres espelhadas de classe média (`res3`) e comerciais (`com3`) |
| `C.shop` (5 cores) | `[96,150,240]`, `[90,190,150]`, `[236,150,90]`, `[190,120,220]`, `[236,96,110]` | Fachadas e toldos de lojas (`com1`, `com2`) e carros em garagem (`res1`) |
| `C.ind` (4 cores) | `[214,172,72]`, `[192,152,112]`, `[172,178,188]`, `[204,120,90]` | Galpões industriais (`ind1`, `ind2`, `ind3`) |
| Constantes fixas | `brick: [176,84,62]`, `conc: [172,172,176]`, `dark: [40,44,56]`, `glassd: [150,196,230]` | Chaminés, concreto e detalhes |

### 1.2 Fonte Matricial $3\times5$ (`FONT`, `L938`)
Cada glifo é uma string de 15 bits (`'0'` ou `'1'`, 5 linhas $\times$ 3 colunas) renderizada por `txt(b, f, s0, z, str, col, glowCol)` (`L1030–L1035`) com inclinação isométrica $\text{sl} = (f === \text{'L'} ? 0.5 : -0.5)$.
- **26 caracteres disponíveis:** `A, B, C, D, E, F, G, H, I, J, L, M, N, O, P, R, S, T, U, V, X, Z, 0, 1, 2, 3, 9`.
- **Letreiros efetivamente desenhados nos prédios:** `'LOJA'`, `'CAFE'`, `'PAO'`, `'BAR'`, `'ARTE'`, `'LUA'`, `'SHOP'`, `'190'`, `'193'`, `'H'`, `'ESC'`, `'CORP'`, `'DELTA'`.

### 1.3 Função Tonalizadora de Classe Social e Abandono (`t.tn(c)`, `L1405`)
Antes de invocar qualquer modelo em `drawAt(t)`, `t.tn` é injetada no descritor do tile:
1. Se $t.k \in \{\text{K.RES}, \text{K.COM}\}$:
   - Se $t.\text{cls} === 0$ (Pobre): escurece e acinzenta a cor: $c \leftarrow \text{mix}(\text{sh}(c, 0.88), [130, 122, 114], 0.30)$.
   - Se $t.\text{cls} === 2$ (Elite): aquece com tom dourado: $c \leftarrow \text{mix}(c, [255, 232, 176], 0.14)$.
2. Se $t.\text{ab}$ (abandonado): multiplica por $0.55$ ($\text{sh}(c, 0.55)$) e, após desenhar o prédio em zoom `hi`, adiciona 6 pontos escuros `[30, 26, 24]` de sujeira/deterioração (`L1407`).

### 1.4 Tabelas de Altura e Caixa de Obra (`HEIGHT` e `BOX`, `L1401–L1402`)
Usadas por `drawAt(t)` quando `t.cons != null` para dimensionar o andaime e a linha de corte `clipY`:
- **`HEIGHT`:**
  - `2` (`RES`): `[16, 32, 62]`
  - `3` (`COM`): `[14, 32, 78]`
  - `4` (`IND`): `[20, 34, 46]`
  - `5` (`PARK`): `[14]`, `6` (`POLICE`): `[20]`, `7` (`FIRE`): `[34]`, `8` (`HOSP`): `[32]`, `9` (`SCHOOL`): `[26]`
  - `10` (`COAL`): `[56]`, `11` (`SOLAR`): `[8]`, `12` (`WTOWER`): `[44]`
  - `13` (`SKY_RES`): `[82]`, `14` (`SKY_COM`): `[110]`, `15` (`MEGA`): `[130]`, `16` (`LANDMARK`): `[96]`
- **`BOX`:**
  - `2` (`RES`): `[B(-.34,-.3,.24,.2), B(-.36,-.34,.34,.3), B(-.4,-.4,.4,.38)]`
  - `3` (`COM`): `[B(-.4,-.34,.22,.2), B(-.4,-.38,.38,.3), B(-.42,-.4,.4,.36)]`
  - `4` (`IND`): `[B(-.42,-.3,.36,.3), B(-.42,-.36,.3,.32), B(-.44,-.4,.4,.34)]`
  - Demais kinds usam o fallback `B(-.36, -.34, .34, .3)`.

---

## 2. Modelos Residenciais $1\times1$ (`res1`, `res2`, `res3`, `L1082–L1139`)

### 2.1 `res1(t)` — Casas Térreas e Sobrados (`L1083–L1109`)
- Gramado base `[-.44, .44]^2` verde `[112, 176, 84]` com alpha `0.55`.
- Seleciona estilo por `st = t.vr % 4`:
  - **`st === 0` (Chalé com chaminé):** Corpo `B(-.28, -.26, .16, .18)` altura `z=0..9`, telhado `gable` (`rh=6.5` ao longo de $u$), chaminé de tijolos `z=9..17` com 3 partículas de fumaça (`smoke`), caminho de pedras, cercas nas bordas `.4` e 1 árvore (`h=15`).
  - **`st === 1` (Casa em L com garagem):** Corpo principal `B(-.34, -.3, .06, .16)` (`z=0..9`, telhado `hip` `rh=7`) + anexo `B(.06, -.1, .34, .16)` (`z=0..6`, teto plano, portão basculante listrado), entrada asfaltada, `minicar` estacionado e 1 árvore (`h=13`).
  - **`st === 2` (Sobrado de 2 andares com sacada):** Corpo `B(-.3, -.28, .2, .2)` (`z=0..16`, telhado `hip` `rh=8`), 2×2 janelas em cada face, sacada frontal em `z=7.5..8.3` com guarda-corpo (`hi`), cerca frontal, árvore (`h=17`) e poste de jardim (`lampPost`).
  - **`st === 3` (Bangalô com alpendre e piscina):** Corpo `B(-.34, -.22, .24, .14)` (`z=0..7`, `gable` `rh=6`), 4 colunas brancas sustentando cobertura de varanda (`z=7..7.7`) e, se `mid && t.cls !== 0`, piscina azul `[80, 170, 236]` com reflexos animados.
- **Bônus de Elite no `DRAW[K.RES][0]` (`L1396`):** Se `t.cls === 2 && !t.ab && mid && (t.vr % 4) !== 3`, adiciona piscina no quintal `[.0..0.22, .28..0.44]` e árvore extra em `(-.4, -.4)`.

### 2.2 `res2(t)` — Edifícios de Apartamentos de Média Densidade (`L1110–L1127`)
- Seleciona estilo por `st = t.vr % 3`:
  - **`st === 0` ou `1` (Torre única):** Bloco `B(-.36, -.34, .34, .3)` com altura $H = 22$ (`st=0`) ou $H = 26$ (`st=1`), térreo escuro `z=0..6.5` com toldo listrado vermelho/branco, 4×3 janelas por face, sacadas individuais sorteadas por `hash2(r, c, v) < 45` (`hi`), caixa d'água cilíndrica no topo (`z=H..H+5`), casa de máquinas e antena com luz vermelha de obstáculo aéreo (`H+9`). Se `st === 1`, adiciona cobertura *penthouse* `B(-.2, -.2, .18, .16)` (`z=H..H+9`).
  - **`st === 2` (Torres gêmeas assimétricas):** Bloco esquerdo `B(-.36, -.36, .0, .3)` (`z=0..30`) + bloco direito `B(.0, -.36, .34, .3)` (`z=0..20`), toldo azul/branco e jardim no terraço superior (`z=30.5`).

### 2.3 `res3(t)` — Condomínio Vertical de Alta Densidade (`L1128–L1138`)
- Pódio `B(-.4, -.4, .4, .38)` (`z=0..8`) + torre envidraçada `B(-.3, -.3, .28, .26)` (`z=8..52`, cor dourada/azul se Elite, cinza se Pobre, `C.glass` se Média) + coroamento `B(-.2, -.2, .18, .16)` (`z=52..58`).
- Topo: se `(v & 1) || t.cls === 2`, desenha **heliponto** circular com letra `'H'` e 4 luzes giratórias noturnas; caso contrário, antena de `z=58..80` com luz piscante.

---

## 3. Modelos Comerciais $1\times1$ (`com1`, `com2`, `com3`, `L1140–L1181`)

### 3.1 `com1(t)` — Comércio Local e Cafés (`L1141–L1151`)
- Bloco `B(-.4, -.34, .22, .2)` (`z=0..11`), vitrine iluminada à noite (`X.emQ`), toldo listrado, placa `sign` com um dos 6 nomes `['LOJA', 'CAFE', 'PAO', 'BAR', 'ARTE', 'LUA'][v % 6]`, 2 pedestres animados (`person`) e poste de luz.
- Se o nome for `'CAFE'` ou `'BAR'`, desenha 2 guarda-sóis cônicos (`cone`) com mesas na calçada.

### 3.2 `com2(t)` — Edifício Comercial ou Strip Mall (`L1152–L1167`)
- Se `v % 3 !== 2`: Prédio de escritórios `B(-.4, -.38, .38, .3)` (`z=0..28`) com faixas horizontais de vidro a cada `4.6` unidades, térreo comercial com toldo e letreiro `'SHOP'` no topo.
- Se `v % 3 === 2` (`mall`): Shopping baixo `B(-.44, -.4, .4, .2)` (`z=0..16`) com letreiro `'SHOP'` rosa e estacionamento frontal asfaltado com 6 vagas demarcadas e 3 carros (`minicar`) estacionados.

### 3.3 `com3(t)` — Torre Empresarial Escalonada (`L1168–L1180`)
- Pódio `B(-.42, -.4, .4, .36)` (`z=0..14`) + corpo médio `B(-.32, -.3, .3, .26)` (`z=14..38`) + corpo superior `B(-.22, -.2, .2, .16)` (`z=38..56`) + antena `z=56..76`.
- **Animação Exclusiva (`L1176`):** Feixe luminoso horizontal ciano `[190, 240, 255]` (elevador panorâmico / scanner de fachada) que sobe continuamente de $z = 14$ até $z = 56$ conforme $k = (A \bmod 12) / 12$.
- Se `v & 1`, exibe letreiro vertical `'LUA'` na face direita do pódio.

---

## 4. Modelos Industriais $1\times1$ (`ind1`, `ind2`, `ind3`, `L1182–L1214`)

1. **`ind1(t)` — Galpão Logístico (`L1183–L1192`):** Pátio de concreto, galpão `B(-.42, -.3, .36, .3)` (`z=0..11`, telhado `gable` `rh=5`), 2 docas de carga, 3 contêineres coloridos empilhados, caminhão (`minicar` + baú branco) e chaminé baixa (`z=14..18`) com fumaça.
2. **`ind2(t)` — Fábrica Pesada (`L1193–L1202`):** Bloco fabril `B(-.42, -.36, .12, .32)` (`z=0..14`), **2 chaminés altas de tijolos** (`z=14..38` e `z=14..34`) com anéis brancos, fumaça densa e luzes de alerta, silo cilíndrico lateral (`r=.14, z=0..16` + tampa cônica) conectado por tubulação aérea e esteira transportadora animada no pátio.
3. **`ind3(t)` — Complexo Petroquímico / Refinaria (`L1203–L1213`):** Bloco `B(-.44, -.4, .1, .34)` (`z=0..18`) com 3 sheds *sawtooth* no teto, torre de resfriamento cilíndrica (`z=0..40`) emitindo vapor branco, torre de fracionamento (`z=0..44`) com luz de topo, **torre de flare (`z=0..20` em `(.3, .3)`) com chama viva contínua** (se `!t.ab`), 3 contêineres e ponte rolante animada.

---

## 5. Serviços Públicos, Utilidades e Lazer $1\times1$ (`L1215–L1300`)

| Função | Kind (`K`) | Linhas | Geometria e Animações Exclusivas |
|---|---|---|---|
| `police(t)` | `K.POLICE` (`6`) | `L1216–L1225` | Prédio `B(-.4, -.34, .34, .26)` (`z=0..15`) azul-claro com faixa azul-marinho (`z=7.5..9.5`), letreiro `'190'`, giroflex no teto (`z=15..17`) piscando vermelho/azul, mastro com bandeira tremulando (`z=0..26`) e viatura estacionada com giroflex no pátio **apenas quando `!t.out`** (some quando a viatura sai em patrulha). |
| `fire(t)` | `K.FIRE` (`7`) | `L1226–L1235` | Prédio vermelho `B(-.42, -.34, .26, .28)` (`z=0..15`) com faixa branca, 2 portões de garagem (que **se abrem** para `dh = 2.5` revelando a traseira do caminhão quando `t.open === true`), letreiro `'193'` e torre de treinamento lateral `B(.26, -.3, .42, -.14)` (`z=0..32`) com sirene no topo (`z=33`) que pisca e emite halo quando `t.alarm === true`. |
| `hosp(t)` | `K.HOSP` (`8`) | `L1236–L1245` | Ala de emergência térrea `B(-.4, .28, .0, .44)` (`z=0..9`) + bloco hospitalar `B(-.4, -.36, .36, .28)` (`z=0..26`) branco com janelas azuis, cruz vermelha na fachada direita, heliponto no teto (`'H'` vermelho e 4 luzes giratórias) e ambulância branca estacionada no pátio. |
| `school(t)` | `K.SCHOOL` (`9`) | `L1246–L1257` | Corpo em tijolo laranja `B(-.42, -.34, .3, .1)` (`z=0..14`), entrada central `ce` (`z=0..18`, telhado `gable` e placa `'ESC'`), torre do relógio `tw` (`z=0..24`, telhado `hip` `rh=8` e mostrador com ponteiros de hora e minuto animados por `A`), bandeira tremulando, quadra esportiva demarcada com tabela de basquete, balanço infantil oscilante (`hi`) e 4 alunos animados no pátio. |
| `coal(t)` | `K.COAL` (`10`) | `L1258–L1269` | Casa de força cinza `B(-.44, -.4, .1, .36)` (`z=0..24`), 2 chaminés listradas (`z=24..54` e `z=24..50`) expelindo fumaça escura, torre de resfriamento hiperbólica (`z=0..24`) expelindo vapor branco, pilha de carvão mineral preta no pátio e correia transportadora inclinada levando carvão para a caldeira. |
| `solar(t)` | `K.SOLAR` (`11`) | `L1270–L1281` | Base de cascalho + matriz $3\times3$ de painéis fotovoltaicos inclinados (`z=3..6.5`) com reflexo solar deslizante (`sheen = (A * .08) % 3`) e subestação inversora `B(.3, .3, .44, .42)` (`z=0..5`). |
| `wtower(t)` | `K.WTOWER` (`12`) | `L1282–L1289` | Casa de bombas `B(-.42, .18, -.14, .42)` (`z=0..7`), 4 pilares metálicos treliçados (`z=0..26`), reservatório cilíndrico azul com faixas brancas (`r=.22, z=26..40`), teto cônico (`z=40..46`) e gotas d'água animadas no indicador de nível. |
| `park(t)` | `K.PARK` (`5`) | `L1290–L1299` | Gramado verde com caminhos cruzados de areia, 6 árvores mistas, 2 bancos de madeira, flores (`hi`), 3 pedestres passeando e centro variável por `st = v % 3`: chafariz circular com 6 jatos d'água parabólicos animados (`st !== 1`) ou lago com 2 patos nadando (`st === 1`). |

---

## 6. Arranha-Céus e Marcos Monumentais Multi-Tile (`L1301–L1394`)

| Função | Kind (`K`) | Pegada (`sz`) | Altura Total ($z$) | Arquitetura e Elementos Procedurais Exatos |
|---|---|---|---|---|
| `skyRes(t)` | `K.SKY_RES` (`13`) | $2\times2$ | $82$ ($68 + 14$ antena) | **Condomínio Imperial:** Pódio paisagístico `B(-.45, -.45, .45, .45)` (`z=0..10`) com piscina azul no terraço (`z=10.2`), **duas torres gêmeas escalonadas** `t1` (`z=10..68`) e `t2` (`z=10..60`) conectadas por uma **passarela aérea (`skybridge`)** suspensa em `z=38..43`, 2 antenas com luzes alternadas e 3 árvores na calçada. |
| `skyCom(t)` | `K.SKY_COM` (`14`) | $2\times2$ | $112$ ($90 + 22$ antena) | **Torre Corporativa:** Pódio escuro `B(-.45, -.45, .45, .45)` (`z=0..14`) com letreiro luminoso `'CORP'` ciano + 3 segmentos piramidais concêntricos de vidro (`b1` `z=14..48`, `b2` `z=48..74`, `b3` `z=74..90`) com contraventamento diagonal em X (`hi` `L1339`) e mastro duplo até $z=112$. |
| `megaTower(t)`| `K.MEGA` (`15`) | $3\times3$ | $132$ ($108 + 24$ antena) | **Mega Center Delta:** Esplanada cívica `[-.48, .48]^2`, pódio `B(-.42, -.42, .42, .38)` (`z=0..16`) com letreiro dourado `'DELTA'`, 2 torres laterais de apoio (`z=16..62` e `z=16..56`), **torre supertall central em 3 estágios** (`s=.26` `z=16..58`, `s=.20` `z=58..88`, `s=.13` `z=88..108`) coroados por frisos de ouro (`gold`), heliponto no topo (`z=108.6`), antena dourada até $z=132$ e 4 árvores. |
| `landmark(t)` | `K.LANDMARK` (`16`)| $2\times2$ | $96$ ($74 + 22$ antena) | **Torre Panorama:** Praça com espelho d'água circular (`r=.36`), base cilíndrica (`r=.14, z=1..12`), fuste esbelto (`r=.055, z=12..74`), **cápsula panorâmica de observação** em `z=62..74` com **6 luzes giratórias noturnas** (`th = k * 1.047 + A * .15` em $z=65$), antena até $z=96$ e 4 árvores nos cantos. |