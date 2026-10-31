Especificação Técnica de Engenharia Gráfica e Procedural: Estilo Isométrico 2.5DEste documento detalha as fórmulas matemáticas, estruturas de dados, algoritmos gerativos de terreno e edificações, sombreamento procedural e pós-processamento de silhueta para implementação direta no motor gráfico do jogo (Web/Canvas ou Godot 4).1. Fundação Matemática: Grade Isométrica Dimétrica 2:1A perspectiva isométrica clássica dos simuladores urbanos não utiliza projeção isométrica verdadeira de 30° ($1{,}732:1$), mas sim a aproximação dimétrica com tangente de $0{,}5$, resultando na proporção inteira de 2 pixels horizontais para cada 1 pixel vertical. Essa escolha elimina serrilhamento (aliasing) irregular e garante que diagonais sejam desenhadas por escadas de passos uniformes de $2 \times 1$ pixels.1.1 Proporções do Bloco (Tile)As dimensões devem ser potências de 2 ou múltiplos pares exatos:Miniatura / Visão geral: $W = 32\text{ px},\ H = 16\text{ px}$.Resolução padrão / HD: $W = 64\text{ px},\ H = 32\text{ px}$ (Tile base recomendado).Close-up: $W = 128\text{ px},\ H = 64\text{ px}$.Relação fundamental: $H = \frac{W}{2}$. O raio horizontal vale $hw = \frac{W}{2}$ e o raio vertical vale $hh = \frac{H}{2} = \frac{W}{4}$.1.2 Projeção do Espaço Lógico para a Tela (World-to-Screen)Dado um ponto no plano lógico do mapa $(gx, gy)$ com coordenadas contínuas ou discretas:$$\text{Screen}_X = \text{Origin}_X + (gx - gy) \cdot \frac{W}{2}$$$$\text{Screen}_Y = \text{Origin}_Y + (gx + gy) \cdot \frac{H}{2}$$1.3 Desprojeção de Tela para Matriz Lógica (Screen-to-World / Raycasting 2D)Para mapear toques ou cliques na tela $(sx, sy)$ para o índice da célula na matriz $(gx, gy)$:$$dx = sx - \text{Origin}_X$$$$dy = sy - \text{Origin}_Y$$$$gx = \left\lfloor \frac{\frac{dy}{hh} + \frac{dx}{hw}}{2} \right\rfloor = \left\lfloor \frac{dy \cdot hw + dx \cdot hh}{2 \cdot hw \cdot hh} \right\rfloor$$$$gy = \left\lfloor \frac{\frac{dy}{hh} - \frac{dx}{hw}}{2} \right\rfloor = \left\lfloor \frac{dy \cdot hw - dx \cdot hh}{2 \cdot hw \cdot hh} \right\rfloor$$Para detecção exata dentro de um losango sem arredondamentos imperfeitos, calcula-se a coordenada normalizada Manhattan:$$\text{dist} = \frac{\vert{}sx - \text{TileCenterX}\vert{}}{hw} + \frac{\vert{}sy - \text{TileCenterY}\vert{}}{hh} \le 1{,}0$$Se $\text{dist} \le 1{,}0$, o cursor está estritamente dentro da face do terreno daquele bloco.2. Topologia do Mapa e Auto-Tiling Procedural2.1 Modelo em Camadas (Layered Stack)Cada célula $(x, y)$ da matriz do mapa não é apenas um número inteiro, mas uma pilha de dados ortogonais que não se sobrescrevem:+-------------------------------------------------------+
| Camada 4: Entidades Dinâmicas (Veículos, Efeitos)     |
+-------------------------------------------------------+
| Camada 3: Elevação / Construção Vertical (Height/Prism)|
+-------------------------------------------------------+
| Camada 2: Infraestrutura Viária e Redes (Road Bitmask) |
+-------------------------------------------------------+
| Camada 1: Zoneamento e Ocupação (R/C/I, Nível, Renda)  |
+-------------------------------------------------------+
| Camada 0: Terreno e Bioma Base (Água, Areia, Grama)   |
+-------------------------------------------------------+
2.2 Geração Procedural do Terreno por Ruído DeterminísticoA geração dispensa imagens de relevo pré-fabricadas. Toda a geografia é derivada de uma semente inteira (seed):PRNG Determinístico (Mulberry32):
Gera sequências numéricas idênticas em qualquer plataforma para uma mesma semente.Value Noise / Perlin 2D Octave:Amostragem de elevação $E(x, y)$:$$E(x, y) = 0{,}7 \cdot \text{Noise}(x \cdot 0{,}08, y \cdot 0{,}08) + 0{,}3 \cdot \text{Noise}(x \cdot 0{,}2, y \cdot 0{,}2)$$Amostragem de umidade/floresta $M(x, y)$:$$M(x, y) = \text{Noise}((x + 500) \cdot 0{,}12, (y + 500) \cdot 0{,}12)$$Classificação dos Biomas:$E < 0{,}30$: Água profunda (azul escuro #1d4ed8 / cinza-azulado).$0{,}30 \le E < 0{,}36$: Margem / Areia (#fde047 / bege costeiro).$0{,}36 \le E < 0{,}65$: Planície / Grama temperada (#22c55e).$E \ge 0{,}65$: Colina / Rocha / Pico mineral (#959286).Se $E \ge 0{,}36$ e $M > 0{,}55$: Mancha florestal densa (árvores procedurais).2.3 Auto-Tiling de Vias por Bitmasking de 4 Vizinhos (Direções Cardeais Isométricas)Para desenhar esquinas, cruzamentos, retas e calçadas contínuas sem descontinuidades, calcula-se a máscara de conectividade binária da célula $(x, y)$:$$\text{Bitmask} = (N \ll 0) \mid (E \ll 1) \mid (S \ll 2) \mid (W \ll 3)$$Onde cada vizinho $N, E, S, W$ vale $1$ se contiver uma via conectável e $0$ se for outro tipo de terreno:$N = (x, y - 1)$ — Noroeste na tela (NW)$E = (x + 1, y)$ — Nordeste na tela (NE)$S = (x, y + 1)$ — Sudeste na tela (SE)$W = (x - 1, y)$ — Sudoeste na tela (SW)Valor DecimalPadrão BinárioGeometria Renderizada Proceduralmente00000Praça viária local / Pista isolada quadrada no centro do losango.50101Reta contínua no eixo Y (NW $\leftrightarrow$ SE).101010Reta contínua no eixo X (SW $\leftrightarrow$ NE).30011Curva em cotovelo (NW $\leftrightarrow$ NE).60110Curva em cotovelo (NE $\leftrightarrow$ SE).121100Curva em cotovelo (SE $\leftrightarrow$ SW).91001Curva em cotovelo (SW $\leftrightarrow$ NW).7, 11, 13, 14—Conexão em entroncamento "T" (3 ramais com triângulo central de asfalto).151111Cruzamento em 4 direções completo com faixas nos 4 braços.Geometria dos Sub-Segmentos da Estrada:Em vez de desenhar uma imagem fixa, a pista é montada traçando polígonos locais em coordenadas normalizadas $u, v \in [0, 1]$ dentro da célula:Caixa Central: Losango concêntrico de $u \in [0{,}35; 0{,}65]$ e $v \in [0{,}35; 0{,}65]$ pintado com cor de asfalto (#333740).Braços: Retângulos projetados ligando a caixa central às bordas ativas indicadas pelo bitmask.Calçadas: Os cantos desocupados pelos braços recebem tom de concreto claro (#94a3b8).Faixa Central: Linha tracejada amarela (#facc15) renderizada ao longo da linha média dos braços ativos.3. Renderização Procedural de Construções (Zero Assets Externos)Toda a arquitetura é gerada a partir da união de prismas isométricos (Iso-Boxes). Não existem texturas PNG externas.3.1 Anatomia Geométrica do Prisma IsométricoUm prisma posicionado em $(cx, cy)$ com largura transversal $w$, profundidade longitudinal $d$ e altura vertical $h$ possui três faces visíveis que resolvem toda a ilusão 3D:            P5 (cx, cy - h - (w+d)/4)   <-- Vértice Superior Traseiro
             /\
            /  \
           /    \
P4 (cx-w/2,      \
cy-h-w/4) \      / P6 (cx+d/2, cy-h-d/4)
           \    /
            \  /
             \/ 
            P1 (cx, cy - h)              <-- Vértice Central Elevado
            /| \
           / |  \
          /  |   \
         /   |    \
 P2     /    |     \ P3
(cx-w/2,|    |      |(cx+d/2, cy-d/4)
cy-w/4) \    |     /
         \   |    /
          \  |   /
           \ |  /
            \| /
             v
            P0 (cx, cy)                  <-- Vértice Inferior Frontal
Face Esquerda (Plano XZ / Parede Lateral):
Polígono fechado pelos vértices $[P_2,\ P_0,\ P_1,\ P_4]$.
Iluminação: Recebe o vetor de luz média.Face Direita (Plano YZ / Fachada de Sombra):
Polígono fechado pelos vértices $[P_0,\ P_3,\ P_6,\ P_1]$.
Iluminação: Encontra-se oposta à fonte do sol, recebendo tom sombreado.Face Superior (Telhado / Cobertura):
Polígono fechado pelos vértices $[P_1,\ P_6,\ P_5,\ P_4]$.
Iluminação: Face totalmente exposta ao zênite/céu, com tom de luminância máxima.3.2 Paleta Restrita, Tripla de Iluminação e OutlinesPara estabelecer o contraste limpo característico:Modelo Direcional Simulado: O sol é fixado no quadrante superior esquerdo elevado ($\theta = 135^\circ, \phi = 45^\circ$).Fórmula de Tonalização:$\text{Cor}_{\text{Topo}} = \text{BaseColor} \times 1{,}15$ (Destacado).$\text{Cor}_{\text{Esquerda}} = \text{BaseColor} \times 0{,}90$ (Meio-tom base).$\text{Cor}_{\text{Direita}} = \text{BaseColor} \times 0{,}65$ (Sombra própria).Contorno e Arestas (Crisp Outlines):
As arestas exteriores dos prismas recebem um traço de 1 pixel com tom escuro derivado da própria cor ou preto suavizado (#10141d).
Em Canvas 2D: aplicar ctx.lineWidth = 1; ctx.strokeStyle = '#10141d'; ctx.stroke() imediatamente após cada polígono.3.3 Tipologias Arquitetônicas Gerativas por Código      CASA POPULAR (1x1)              PRÉDIO CORPORATIVO (2x2 ou 4x4)
         [Telhado Duplo]                        [Heliponto]
              /\                                    __||__
             /  \                                  [______]
            /====\                                    ||
           /      \                               +---+----+
          +--------+                              |   |    |
          | []  [] |                              | []| [] |
          |   __   |                              | []| [] |
          |  |  |  |                              |   |    |
          +--+--+--+                              +---+----+
Residencial Baixa Renda (1x1)Volume: 1 prisma principal baixo ($w = 20\text{ px}, h = 12\text{ a }18\text{ px}$).Telhado: Prisma secundário com beiral saliente de 2 pixels em tom cerâmico escuro (#78350f / #92400e).Detalhes: Porta estreita centralizada no térreo e uma janela de $2 \times 2$ pixels iluminada em amarelo pálido (#fef08a).Residencial Alta Renda (Fusão 2x2 ou 4x4)Base: Lote ampliado ocupando 4 ou 16 blocos com calçada perimetral e piscina escavada na face frontal (prisma invertido preenchido com ciano límpido #38bdf8).Torres: Duas caixas conectadas com alturas assimétricas ($h_1 = 36\text{ px}, h_2 = 54\text{ px}$) em tons de branco gelo (#f8fafc) e painéis de vidro azul (#bae6fd).Cobertura: Estrutura recuada no terraço com heliponto ou antena de telecomunicação encimada por uma baliza vermelha piscante.Comercial e ServiçosBaixa densidade: Volume térreo de alvenaria com vitrine larga e toldo listrado procedural desenhado na fachada esquerda/direita alternando tiras coloridas (#ef4444 e #ffffff).Alta densidade: Arranha-céu vertical com andares modulados a cada 5 pixels. Uma malha iterativa for (floor = 0; floor < floors; floor++) insere os fragmentos retangulares de janelas reflexivas em tons ciano escuro e branco.IndustrialPavilhões baixos e compridos com telhados em formato de dente de serra.Chaminé vertical modelada como prisma estreito ($2 \times 2$ pixels de base, 20 pixels de altura) acompanhada de partículas procedurais de fumaça desenhadas por círculos que sobem sofrendo translação senoidal $x + \sin(\text{time} + y) \cdot 2$.4. Oclusão, Ordenação e Alocação Multi-Bloco (1x1 a 4x4)4.1 Algoritmo do Pintor (Y-Sorting Isométrico)Para garantir que edifícios da frente sobreponham corretamente os blocos de trás sem recorrer a um Z-Buffer denso em GPU, a iteração de desenho percorre as diagonais do mapa ordenadas pela soma $x + y$:JavaScriptfor (let sum = 0; sum <= (MAP_SIZE - 1) * 2; sum++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    let y = sum - x;
    if (y < 0 || y >= MAP_SIZE) continue;
    renderTileAndStructures(x, y);
  }
}
4.2 Âncora Frontal e Fusão de Lotes (Master-Slave System)Prédios que ocupam múltiplos blocos (ex.: $2 \times 2$ ou $4 \times 4$) causam artefatos visuais se desenhados na célula de origem traseira, pois as células vizinhas frontais seriam desenhadas depois, cortando a estrutura ao meio.Regra da Âncora Frontal: O edifício multi-bloco é registrado e desenhado exclusivamente no bloco mais próximo da câmera dentro de sua área de ocupação:$$\text{Master}_X = \text{StartX} + \text{Size} - 1$$$$\text{Master}_Y = \text{StartY} + \text{Size} - 1$$Células Subordinadas (Slaves): Todos os outros $(N^2 - 1)$ blocos da área reservada recebem uma referência $\text{master} = \{\text{Master}_X, \text{Master}_Y\}$ e têm sua renderização vertical desativada, servindo apenas para compor o piso e responder a eventos de demolição conjunta.Layout de um Lote 4x4:
(gx, gy) ------------------------->
+-----------+-----------+-----------+-----------+
| Slave     | Slave     | Slave     | Slave     |  (Distante da câmera)
+-----------+-----------+-----------+-----------+
| Slave     | Slave     | Slave     | Slave     |
+-----------+-----------+-----------+-----------+
| Slave     | Slave     | Slave     | Slave     |
+-----------+-----------+-----------+-----------+
| Slave     | Slave     | Slave     | MASTER    |  <-- ÂNCORA DE DESENHO
+-----------+-----------+-----------+-----------+  (Mais próximo da câmera)
5. Arquitetura do Outline Overlay (Composição Gráfica da Silhueta)Para criar o enquadramento de uma silhueta destacada (como uma máscara vetorial ou ícone temático) preservando a integridade contínua do cenário isométrico ao fundo, utiliza-se um pipeline de composição em três camadas com suporte a operações de corte (blending / stencil):+-----------------------------------------------------------+
| CAMADA 1: Buffer do Cenário (Fundo Isométrico 2.5D)       |
| -> Grade contínua, edifícios, estradas e biomas          |
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| CAMADA 2: Viewport / Canvas de Máscara (Forma Vetorial)   |
| -> Desenho da silhueta em escala com traço uniforme de 2px|
+-----------------------------------------------------------+
                             |
                             v
+-----------------------------------------------------------+
| CAMADA 3: Passagem de Fusão (Composição na Tela Principal)|
| -> Caso Moldura: Desenho direto da silhueta vazada       |
| -> Caso Máscara: Operação 'destination-in' / 'source-in'  |
+-----------------------------------------------------------+
5.1 Implementação no Canvas 2D (Web API)JavaScriptfunction renderComposedScene(ctx, screenW, screenH, silhouettePath) {
  // 1. Renderiza a malha urbana isométrica completa
  renderIsometricWorld(ctx);

  // 2. Sobreposição do contorno vetorial uniforme
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000'; // Traço preto rígido
  ctx.stroke(silhouettePath);
  ctx.restore();
}

function renderMaskedScene(ctx, mainCanvas, maskCanvas, silhouettePath) {
  const maskCtx = maskCanvas.getContext('2d');
  
  // Limpa o canvas auxiliar
  maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  
  // Desenha a forma sólida da silhueta
  maskCtx.fillStyle = '#000000';
  maskCtx.fill(silhouettePath);
  
  // Corta o fundo isométrico para existir apenas dentro da forma
  maskCtx.globalCompositeOperation = 'source-in';
  maskCtx.drawImage(mainCanvas, 0, 0);
  
  // Desenha a borda da silhueta
  maskCtx.globalCompositeOperation = 'source-over';
  maskCtx.lineWidth = 2;
  maskCtx.strokeStyle = '#000000';
  maskCtx.stroke(silhouettePath);
}
5.2 Implementação no Godot 4 (CanvasItem Shader)Para aplicar contorno de 1 pixel em tempo real via hardware sobre os sprites ou prismas procedurais gerados, anexa-se um Shader de amostragem perimetral ao nó:OpenGL Shading Languageshader_type canvas_item;

uniform vec4 line_color : source_color = vec4(0.06, 0.08, 0.11, 1.0);
uniform float line_thickness : hint_range(0.0, 4.0) = 1.0;

void fragment() {
    vec2 size = TEXTURE_PIXEL_SIZE * line_thickness;
    float outline = texture(TEXTURE, UV + vec2(-size.x, 0.0)).a;
    outline += texture(TEXTURE, UV + vec2(size.x, 0.0)).a;
    outline += texture(TEXTURE, UV + vec2(0.0, -size.y)).a;
    outline += texture(TEXTURE, UV + vec2(0.0, size.y)).a;
    outline = min(outline, 1.0);
    
    vec4 current_color = texture(TEXTURE, UV);
    COLOR = mix(current_color, line_color, outline - current_color.a);
}
6. Configurações de Motor e Práticas de PerformanceDesativação de Filtros Bilineares:Web/Canvas: Fixar ctx.imageSmoothingEnabled = false no contexto e aplicar image-rendering: pixelated; no CSS do elemento <canvas>.Godot 4: Nas configurações do projeto (Project Settings), definir Rendering > Textures > Canvas Textures > Default Texture Filter como Nearest (Modo Ponto/Rígido).Buffer de Offscreen Canvas (Cache de Sprites):Não re-calcule vértices matemáticos e laços de repetição de janelas 60 vezes por segundo para prédios estáticos.No momento em que um lote evoluir ou for construído, renderize o prisma procedural uma única vez dentro de um mini-canvas isolado (ex.: $64 \times 96$ pixels) e guarde sua referência em um dicionário Map<SpriteKey, OffscreenCanvas> indexado pela chave [zona]_[renda]_[tamanho]_[semente].O loop principal do jogo executará apenas chamadas diretas de transferência de blocos (drawImage ou cópia de VRAM), mantendo estabilidade cravada em 60 FPS mesmo em hardwares de baixo custo.