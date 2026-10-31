# 08 — Registro de Decisões Aprovadas e Validações

> **Status do Documento:** Decisões Oficiais Validadas pelo Usuário  
> **Data de Aprovação:** 30/10/2026  
> **Resultado da Validação:** Todas as diretrizes centrais foram confirmadas e aprofundadas com regras de negócio específicas para arquitetura online, zoneamento inflacionário, evolução por qualidade de vida e algoritmo de entropia visual anti-monotonia.

---

## 1. Sumário das Decisões Validadas

| Nº | Tema / Decisão | Decisão Aprovada | Detalhamento / Especificação |
|---|---|---|---|
| **D1** | **Arquitetura & Autenticação** | **Jogo Online com Persistência Remota** | O jogo será online (não puramente local). Exige backend com API de autenticação (`/api/auth`) e persistência remota de cidades (`/api/cities`), suportando login, sessão e credenciais `admin/admin` em ambiente de demonstração local. |
| **D2** | **Destino do `starter.js`** | **Preservar como Cenário Demo; Terreno Virgem Padrão** | `starter.js` fica desacoplado do fluxo normal. Novo jogo inicia em terreno virgem sem construções automáticas. |
| **D3** | **Regra de Negócio: Crescimento em 3 Pilares** | **Inflação de Zoneamento, Upgrade por Qualidade de Vida e Entropia Visual** | 1. Custo de zona cresce geometricamente: $C = \text{Base} \times (1 + \text{Taxa})^N$.<br/>2. Lotes evoluem de Tier (1, 2, 3) e Densidade via `qualidade_de_vida` local.<br/>3. Anti-Monotonia: Spawner usa pesos inversamente proporcionais para evitar repetição estética em clusters. |
| **D4** | **Pipeline de Pixel Art** | **Bayer 4x4, Paletas Indexadas e Costa com Praia** | Substituição da interpolação contínua Gouraud/bicúbica por dithering ordenado e paletas de pixel art conforme diretrizes visuais. |
| **D5** | **Escopo Inicial** | **Foco na Cidade Individual** | Foco absoluto na cidade individual e na persistência remota cliente-servidor, deixando o mapa de regiões multi-cidades para expansão posterior. |

---

## 2. Especificação da Arquitetura Online e Persistência Remota

1. **Camada de Servidor (`server.js`):**
   - Endpoints REST para autenticação:
     - `POST /api/auth/login`: autentica usuário (aceita `admin/admin` em ambiente de desenvolvimento local e registra novos prefeitos). Retorna token/sessão.
     - `GET /api/auth/me`: valida a sessão atual.
   - Endpoints REST para cidades:
     - `GET /api/cities`: lista as cidades salvas do usuário no servidor.
     - `GET /api/cities/:id`: recupera os dados completos da cidade (schema JSON v5).
     - `POST /api/cities`: cria ou salva remotamente o estado de uma cidade.
     - `PUT /api/cities/:id`: atualiza os dados da cidade (auto-save remoto).
   - Armazenamento em disco no servidor em pasta persistente (`data/saves/` e `data/users.json`).

2. **Camada de Cliente (`src/persistence/remote-storage.js`):**
   - Comunicação assíncrona com fallback resiliente para cache local.
   - Sincronização periódica do auto-save com o backend.

---

## 3. Especificação dos Três Pilares de Zoneamento e Spawning

### Pilar 1: Inflação Geométrica de Zoneamento
Para modelar a escassez de terra e o custo crescente de expansão urbana:
$$\text{Custo}(k) = \text{Base}(k) \times (1 + \text{taxa})^{Z_{\text{total}}}$$
- $\text{Base}(k)$: Custo nominal base ($20 para Residencial, $25 para Comercial, $25 para Industrial).
- $Z_{\text{total}}$: Total acumulado de zonas já adquiridas na cidade.
- $\text{taxa}$: Taxa suave calibrada entre $0.5\%$ e $1.5\%$ (padrão: $0.008$ ou $0.8\%$).
- **Comportamento:**
  - Primeira zona: $\$20 \times (1.008)^0 = \$20$.
  - Zona 100: $\$20 \times (1.008)^{100} \approx \$44$.
  - Zona 500: $\$20 \times (1.008)^{500} \approx \$1.074$.
  - Zona 1500: $\$20 \times (1.008)^{1500} \approx \$3.167.000$ (atinge milhões para cidades gigantescas!).

### Pilar 2: Upgrade por Atributo de Terreno (`qualidade_de_vida`)
O avanço de um lote de Tier 1 (Pobre/Simples) para Tier 2 (Médio) e Tier 3 (Rico/Elite), bem como a transição de Baixa para Alta Densidade, é função estrita da pontuação local:
$$\text{QdV} = f(\text{energia}, \text{água}, \text{estrada}, \text{saúde}, \text{educação}, \text{segurança}, \text{bombeiros}, \text{parques}, \text{poluição}, \text{crime})$$
- $\text{QdV} < 35$: Lote permanece em Tier 1 Baixa Densidade.
- $35 \le \text{QdV} < 70$: Lote atinge Tier 2 Média Densidade.
- $\text{QdV} \ge 70$: Lote é elegível a Tier 3 Alta Densidade (Arranha-céus e Torres).

### Pilar 3: Algoritmo de Entropia Visual (Anti-Monotonia)
Quando o spawner escolhe o modelo estético $m$ de um edifício dentro do Tier/Densidade selecionado:
1. Conta a ocorrência global do modelo no mapa: $C_{\text{global}}(m)$.
2. Conta a ocorrência do modelo na vizinhança imediata ($7\times7$ tiles): $C_{\text{local}}(m)$.
3. Atribui a cada modelo candidato um peso de seleção:
   $$W(m) = \frac{1}{\big(1 + C_{\text{global}}(m) \times 0.2 + C_{\text{local}}(m) \times 3.0\big)^{1.5}}$$
4. Sorteia o modelo usando amostragem ponderada pela roleta estocástica de pesos $W(m)$.
- **Efeito:** Prédios idênticos têm chance quase nula de serem instanciados lado a lado, e a cidade distribui organicamente todas as variações arquitetônicas disponíveis.
