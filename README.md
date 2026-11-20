# NeoTown / GitTown - Cidade Virtual & Visualizador TheoTown

## 1. Objetivo e Finalidade
Plataforma interativa para planejamento urbano, visualização de metadados de cidades compatíveis com TheoTown e gerenciamento colaborativo de regiões.

## 2. Tecnologias Utilizadas
- JavaScript, Vite, HTML5 Canvas, Cloudflare Pages, Cloudflare D1 (SQLite), CSS3

## 3. Arquitetura e Estrutura de Diretórios
Aplicação web rica em visualização gráfica com renderização em Canvas/DOM, integrada à nuvem Cloudflare com banco D1 (`schema.sql`). Suporte tanto a bundle monolítico quanto modular.

## 4. Principais Arquivos e Responsabilidades
- `index.html`: Interface principal de navegação e renderização de mapa.
- `index.monolith.html`: Versão de arquivo único autossuficiente.
- `schema.sql`: Definição de banco de dados para cidades e construções.
- `Delta City plano revisado (API do TheoTown).md`: Especificação técnica de compatibilidade.

## 5. Funcionalidades Identificadas
- Visualização de grid urbano e dados de regiões de cidades virtuais
- Compatibilidade com estruturas de dados do jogo TheoTown
- Armazenamento em nuvem na Cloudflare D1
- Modo monolítico portátil para testes sem servidor

## 6. Como Compilar ou Executar
```bash
npm install
npm run dev
# Deploy Cloudflare: npm run cf:deploy
```

## 7. Estado Atual do Projeto
**Completo**

## 8. Pendências e Limitações Identificadas
Concluir a importação de arquivos de save game `.city` nativos.
