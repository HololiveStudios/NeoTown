Catálogo de Engenharia Visual e Exemplares Procedurais (Anatomia Pixel a Pixel)A análise técnica das capturas de referência em close-up revela exatamente por que esse estilo visual possui tanta personalidade e legibilidade em resoluções baixas: não há cores totalmente chapadas (flat) nem gradientes suaves. Todo elemento — da grama às telhas das casas e aos carros na avenida — utiliza ruído de luminância por pixel (Dithering Estocástico) e geometria modular com sombreamento direcional rígido.Abaixo está o documento de especificação prática detalhando como o motor de código (em JavaScript/Canvas ou GDScript/Shader) constrói cada um desses exemplares matematicamente, sem carregar arquivos PNG externos.1. Exemplar de Terreno e Vegetação (Baseado nos Prints 1 e 2)Na captura de zoom máximo da floresta, observa-se que o chão nunca é um losango pintado com um único código hexadecimal #4ade80. Ele é uma malha onde cada pixel interno $(u, v)$ sofre uma perturbação matemática determinística.1.1 Textura Procedural do Solo (Grama com Micro-Ruído)Para cada lote $(gx, gy)$, em vez de preencher o polígono com cor sólida, o rasterizador percorre os pixels internos do losango (ex.: matriz $32 \times 16$) e aplica um hash posicional rápido:Equação de Cor por Pixel:$$\text{Luminância}(u, v) = \text{BaseGreen} + \left( (\text{Hash}(gx \cdot 32 + u, gy \cdot 16 + v, \text{seed}) \bmod 5) - 2 \right) \times 6$$Paleta de Amostragem da Grama (5 Tons extraídos do Print 2):Sombra de tufo (15% dos pixels): #2e4726Base escura (30% dos pixels): #39572eBase média (35% dos pixels): #466838Grama alta iluminada (15% dos pixels): #557a44Brilho/flor seca isolada (5% dos pixels): #6b8e53Transição Costeira (Praia e Água - Print 1):Quando uma célula de grama faz fronteira com WATER, os pixels cuja distância até a borda da água é menor que 6 recebem a paleta de Areia Úmida/Seca (#d8c898, #e6d8aa, #bfa975).Na água (#1b3f66), pixels adjacentes à areia recebem Espuma Costeira (#8ab4d6 e #ffffff) modulada por uma função seno animada pelo tempo: $\sin(\text{time} + u \cdot 0{,}5) > 0{,}7$.1.2 Árvores Procedurais por "Clusters de Folhagem" (Print 2)O Print 2 mostra que as árvores não são cones lisos, mas aglomerados de pequenos blocos de pixels (clusters) com luz vindo do topo-esquerda e sombra densa na base-direita:      [Esquema de Pixels da Árvore - 12x18 px]
                  . # # .          <- Topo iluminado (#6fa338)
                # # @ @ % .        <- Meio-tom (#497824)
              # @ @ % % * * .      <- Sombra interna (#2b4c16)
                # @ % * * * .      <- Sombra profunda (#172b0b)
              # # @ % % * * *
                . % * | | * .      <- Tronco exposto (#cbb18b / #6e5233)
                      | |
                    . . . .        <- Sombra projetada no chão
Regra de Código para Gerar a Árvore (drawProceduralTree):Tronco: Desenhe um retângulo vertical de $2 \times 4$ pixels na base $(cx, cy)$. Coluna esquerda em madeira iluminada (#cbb18b para bétulas claras ou #8c6239 para carvalhos) e coluna direita na sombra (#4a341e).Copa Folhosa (Algoritmo de Esferas Empilhadas): Gere de 18 a 28 micro-blocos ($2 \times 2$ px) distribuídos dentro de uma elipse vertical acima do tronco.Sombreamento Automático da Copa: Para cada micro-bloco na posição relativa $(dx, dy)$ em relação ao centro da copa:Se $dx < 0$ e $dy < 0$ (Quadrante Superior Esquerdo): pinte com Verde Solar (#7cb342 / #558b2f).Se $dx + dy > 2$ (Quadrante Inferior Direito): pinte com Verde Abissal/Preto (#1b3011 / #0f1c09).Caso contrário: pinte com Verde Médio (#33691e).2. Exemplar de Infraestrutura Viária e Veículos (Baseado nos Prints 1 e 3)O Print 3 exibe o zoom máximo de uma avenida em diagonal com um carro vermelho e árvores nas calçadas.2.1 Anatomia da Estrada Isométrica (Print 3)A via não é apenas uma linha cinza; ela possui 5 sub-camadas transversais ao longo da largura do lote:Meio-Fio Externo (1 px de largura): Linha contínua de concreto claro (#b0b5ba) que separa a grama do asfalto.Sarjeta / Borda da Pista (1 px de largura): Linha cinza média (#6c7075) logo abaixo do meio-fio para dar relevo de calçada.Leito de Asfalto Texturizado: Preenchido com cinza-chumbo escuro (#454346 e #3b393c alternados via ruído de 2 tons para imitar piche granulado).Pintura de Faixa Central Tracejada: A cada 6 pixels ao longo do eixo da rua, desenham-se 2 pixels brancos puros (#f0f4f8) e 4 pixels de asfalto vazio.Postes e Fiação (Print 1): Em estradas principais ou zonas energizadas, a cada 3 blocos ergue-se uma haste vertical de 1 pixel de largura (#2b2d30) com 12 pixels de altura, conectada ao poste do bloco vizinho por um algoritmo de linha de Bresenham com curvatura parabólica (catenária de 2 pixels de queda no meio) para desenhar os fios pretos de alta tensão.2.2 O Micro-Sprite Procedural do Carro (Print 3)No Print 3, o carro vermelho ocupa uma matriz minúscula de aproximadamente $10 \times 7$ pixels alinhada ao eixo isométrico 2:1. Ele é composto por 2 caixas sobrepostas (chassi inferior + cabine superior) e 4 detalhes pontuais:         [Matriz Procedural do Veículo - Direção SE]
                  . . R R R . . . . .   (R = Teto Vermelho Claro #d6382b)
                . R R R W W B B . . .   (W = Para-brisa #14181c)
              . R R D D D W W B B . .   (D = Lateral Vermelho Médio #b5261b)
              . K K D D D D S S F . .   (S = Frente Sombreada #801810)
                . K K D D S S Y S Y .   (K = Roda Preta #0a0a0a)
                  . . . K K S S . . .   (Y = Farol Amarelo #fef08a)
Como o Código Desenha Qualquer Carro (drawIsoVehicle):Parâmetros: pos (x, y), direção (NE, NW, SE, SW), corPrimaria (ex: #d6382b, #3b82f6, #22c55e, #e2e8f0).Passo 1 (Sombra e Rodas): Pinte a base e os 2 pares de rodas com #0d0f12 ($2 \times 2$ px cada roda) nas laterais inferiores.Passo 2 (Chassi): Desenhe um mini-prisma isométrico de $8 \times 4 \times 2$ pixels usando corPrimaria na lateral iluminada e corPrimaria * 0.7 na frente/traseira sombreada.Passo 3 (Cabine e Vidros): Desenhe um segundo prisma menor ($4 \times 4 \times 2$ px) no centro com corPrimaria * 1.15 no teto e preencha as bordas da cabine com preto-azulado (#11161d) para o para-brisa e janelas laterais.Passo 4 (Faróis): Se o veículo estiver indo para baixo (SE ou SW), pinte 2 pixels amarelos brilhantes (#fff380) nas extremidades frontais; se estiver indo para cima (NE ou NW), pinte 2 pixels vermelhos vivos (#ff2a2a) representando as lanternas traseiras.3. Exemplar de Construções Residenciais e Urbanas (Baseado nos Prints 1 e 4)O Print 4 é a referência mais importante para as edificações: ele mostra lado a lado casas térreas, sobrados europeus com telhado de duas águas (gable roof) e um prédio residencial vertical de tijolos amarelos.3.1 A Casa de Telhado Inclinado ("Chalé / Sobrado" - Print 4)Diferente de um caixote de topo reto, as casas do Print 4 possuem empena triangular (oitão) e telhado em águas inclinadas com textura de telhas.           [Geometria Procedural da Casa com Telhado em "A"]
                        /\
                       /  \  <- Água do Telhado (Textura Xadrez #a84232 / #8c3224)
                      /    \
                     /      \
                    /\      /\
                   /  \    /  \
                  / .. \  /    \  <- Sótão / Empena Triangular (#cbb89d)
                 /  ..  \/      \
                +-------+--------+
                | [] [] | []  [] | <- Fachada Iluminada (#d6c3a5) vs Sombreada (#9e8c72)
                |       |   __   |
                | [] [] |  |  |  | <- Porta de Madeira (#5c3a21)
                +-------+--------+
Receita Matemática para Construir a Casa no Código:Jardim e Calçada do Lote (Base 1x1):Pinte a borda frontal junto à rua com calçada cinza (#8c9299).Pinte o recuo frontal e lateral com grama aparada (#658542) e adicione um caminho de 2 pixels de largura ligando a porta da casa até a calçada (#b8b0a4).Corpo Principal (Alvenaria):Eleve as paredes esquerda e direita com altura $h = 10\text{ px}$.Na parede esquerda (iluminada), aplique ruído sutil de reboco ou tijolo variando entre #d8c5a8 e #c9b495.Na parede direita (sombra), escureça 30% (#96856c e #85745c).Empena Triangular (O Segredo do Telhado Inclinado):Na face frontal-esquerda, em vez de parar na linha horizontal do topo, continue subindo um triângulo isósceles cujo pico central atinge $h_{\text{pico}} = h + 8\text{ px}$.Insira 1 ou 2 janelas pequenas ($2 \times 3$ px) dentro desse triângulo para formar o sótão (como visto na casa bege central do Print 4).Plano Inclinado das Telhas (Dithering Xadrez):Ligue a linha do pico (cumeeira) até a borda superior da parede direita formando um paralelogramo inclinado.Preencha esse polígono aplicando um padrão xadrez $(x + y) \bmod 2$: alterne entre telha clara (#b84a39) e telha escura (#8f3324) para criar exatamente a textura de telhado cerâmico visível no Print 4.Se a semente sortear chaminé, desenhe um mini-prisma de $2 \times 2 \times 4$ pixels furando o meio do telhado.Janelas com Profundidade e Moldura (Print 4):Observe no Print 4 que as janelas não são de uma cor só: elas possuem 1 coluna vertical de pixels brancos (#ffffff = batente iluminado pelo sol) ao lado de 1 ou 2 colunas escuras (#2b2623 ou #1a2634 = vidro profundo em sombra).Código da janela:JavaScript// Desenha janela com batente branco e vidro escuro (Estilo Print 4)
ctx.fillStyle = '#ffffff';
ctx.fillRect(wx, wy, 1, 3);     // Batente esquerdo brilhante
ctx.fillStyle = '#2c2520';
ctx.fillRect(wx + 1, wy, 2, 3); // Vidro escuro interno
3.2 Edifício Residencial Vertical (Prédio Amarelo no Canto Esquerdo - Print 4)Corpo: Prisma mais alto ($h = 28\text{ a }40\text{ px}$) ocupando 75% da área do lote.Textura de Fachada: Linhas horizontais sutis a cada 5 pixels demarcando as lajes dos andares (#b59252 sobre fundo ocre #cca662).Térreo Diferenciado: Os primeiros 5 pixels de altura da base são pintados em pedra cinza escura (#5a5d64) com uma entrada recuada preta (#1c1e21).Cobertura: Telhado piramidal de 4 águas em telha vermelha escura ou mansarda cinza chumbo (#4a4d52).3.3 Prédios Comerciais Modernos e Caixa D'Água (Print 1)No Print 1, destacam-se duas estruturas especiais ao lado da avenida:Prédios Comerciais de Esquina (Fachada de Vidro Curva/Chanfrada):Paredes brancas de concreto limpo (#dce3e8 na luz, #9aa5b1 na sombra).Grandes panos verticais de vidro azul-petróleo (#2b5b75) cortados por colunas brancas e estacionamento asfaltado ao redor com carros estacionados lado a lado.Torre de Água (Cilindro Esférico sob Treliça - Print 1):Base: 4 linhas finas cinza-claro (#c2c8ce) descendo do reservatório até o chão com traços horizontais e diagonais formando um "X" (treliça metálica vazada que deixa ver a grama atrás).Reservatório Superior: Elipse de $14 \times 12$ pixels no topo, sombreada radialmente da esquerda para a direita: branco puro no foco solar (#ffffff), cinza claro no meio (#d0d7de) e cinza azulado escuro na borda direita inferior (#6e7885).4. Tabela Resumo de Parâmetros para o Gerador (buildings.js)Elemento / ConstruçãoGeometria Base (Primitivas)Técnica de Textura ProceduralDetalhes Obrigatórios de CódigoGrama / FlorestaLosango $W \times H$ + Elipses de copaRuído Hash de 5 tons verdes por pixelSombra preta na base direita da árvore; tronco de $2 \times 4$ px.Estrada + CarroFaixa diagonal + 2 mini-prismas ($10 \times 7$ px)Ruído de 2 tons no asfalto + meio-fio de 2 pxFaixa central branca tracejada; carro com vidro preto e 2 faróis amarelos.Casa Popular / ChaléPrisma base + Empena triangular + Plano inclinadoXadrez $(x+y)\bmod 2$ no telhado cerâmicoJanela de 3 px (1 px batente branco #fff + 2 px vidro escuro); caminho até a rua.Prédio de ApartamentosPrisma alto ($h=32$) + Telhado piramidalLajes marcadas a cada 5 px + ruído de tijoloTérreo em pedra cinza (#5a5d64) + grade regular de $3 \times 5$ janelas por face.Comércio com EstacionamentoPátio de asfalto + Prisma branco com chanfroVidro contínuo azul (#2b5b75) com reflexo diagonalVagas demarcadas no chão com 3 a 5 mini-carros coloridos estacionados.Caixa D'Água / InfraestruturaTreliça de linhas + Esfera superiorSombreamento radial de 4 faixas no tanqueEstrutura inferior transparente (vazada) permitindo ver a grama ao fundo.5. Função Prática: O Gerador da Casa do Print 4 em Código PuroAbaixo está a função exata em JavaScript/Canvas para desenhar pixel a pixel a casa com telhado inclinado texturizado, parede com ruído de alvenaria e janelas com batente branco (como no Print 4):JavaScriptfunction drawTheoHouse(ctx, cx, cy, seed, palette) {
  // palette exemplo: { wall: [214, 195, 165], roof: [175, 68, 52] }
  const hash = (x, y) => ((Math.imul(x, 374761393) + Math.imul(y, 668265263) + seed) >>> 0) % 100;
  const rgb = (c, f) => `rgb(${(c[0]*f)|0}, ${(c[1]*f)|0}, ${(c[2]*f)|0})`;

  const w = 12; // Largura de cada face em pixels
  const h = 11; // Altura da parede reto
  const peak = 7; // Altura extra do triângulo do telhado (oitão)

  // 1. PAREDE ESQUERDA (Frente Iluminada + Empena Triangular do Sótão)
  for (let ix = 0; ix < w; ix++) {
    const baseY = cy - Math.floor(ix / 2);
    // O topo sobe formando um triângulo até o meio (ix = w/2) e depois desce
    const roofOffset = (ix <= w / 2)
      ? Math.floor((ix / (w / 2)) * peak)
      : Math.floor(((w - ix) / (w / 2)) * peak);
    const totalH = h + roofOffset;

    for (let iy = 0; iy < totalH; iy++) {
      const px = cx - ix;
      const py = baseY - iy;
      // Micro-ruído de tijolo/reboco (varia +-5% no brilho)
      const noise = 0.95 + (hash(px, py) % 10) * 0.01;
      ctx.fillStyle = rgb(palette.wall, noise);
      ctx.fillRect(px, py, 1, 1);
    }
  }

  // 2. PAREDE DIREITA (Lateral na Sombra)
  for (let ix = 1; ix <= w; ix++) {
    const baseY = cy - Math.floor(ix / 2);
    for (let iy = 0; iy < h; iy++) {
      const px = cx + ix;
      const py = baseY - iy;
      const noise = 0.68 + (hash(px, py) % 8) * 0.01; // 30% mais escura (sombra)
      ctx.fillStyle = rgb(palette.wall, noise);
      ctx.fillRect(px, py, 1, 1);
    }
  }

  // 3. TELHADO INCLINADO COM TEXTURA XADREZ DE TELHAS (Água Direita)
  const ridgeX = cx - Math.floor(w / 2);
  const ridgeY = cy - Math.floor(w / 4) - h - peak;

  for (let step = 0; step <= w; step++) {
    const startX = ridgeX + step;
    const startY = ridgeY + Math.floor(step / 2);
    // Desce da cumeeira até o beiral da parede direita
    for (let drop = 0; drop <= peak + 1; drop++) {
      const px = startX + Math.floor(drop * 0.8);
      const py = startY + drop;
      // Efeito Dithering Xadrez das telhas (Print 4)
      const isDarkTile = ((px + py) & 1) === 0;
      const shade = isDarkTile ? 0.82 : 0.98;
      ctx.fillStyle = rgb(palette.roof, shade);
      ctx.fillRect(px, py, 1, 1);
    }
  }

  // 4. JANELAS COM BATENTE BRANCO E VIDRO ESCURO (Assinatura Visual do Print 4)
  const drawWindow = (wx, wy) => {
    ctx.fillStyle = '#ffffff'; // Batente iluminado
    ctx.fillRect(wx, wy, 1, 3);
    ctx.fillStyle = '#2b241f'; // Vidro escuro profundo
    ctx.fillRect(wx + 1, wy, 1, 3);
  };

  // Janelas da fachada esquerda + 1 janela no sótão
  drawWindow(cx - 3, cy - 5);
  drawWindow(cx - 8, cy - 7);
  drawWindow(cx - 6, cy - 12); // Sótão

  // Janelas da lateral direita + Porta de madeira
  drawWindow(cx + 4, cy - 8);
  drawWindow(cx + 8, cy - 10);
  ctx.fillStyle = '#5c3818'; // Porta
  ctx.fillRect(cx + 5, cy - 5, 2, 4);
}