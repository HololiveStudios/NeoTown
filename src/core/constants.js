export const BIO = { WATER: 0, PLAIN: 1, FOREST: 2, HILL: 3 };

export const K = {
  NONE: 0, ROAD: 1, RES: 2, COM: 3, IND: 4, PARK: 5,
  POLICE: 6, POLICE_MED: 17, POLICE_LG: 18,
  FIRE: 7, FIRE_MED: 19, FIRE_LG: 20,
  HOSP: 8, HOSP_MED: 21, HOSP_LG: 22,
  SCHOOL: 9, SCHOOL_MED: 23, SCHOOL_LG: 24,
  COAL: 10, SOLAR: 11, WTOWER: 12, SKY_RES: 13, SKY_COM: 14, MEGA: 15, LANDMARK: 16
};

export const KN = [
  'Vazio', 'Rua', 'Residencial', 'Comercial', 'Industrial', 'Parque',
  'Posto Policial', 'Posto de Bombeiros', 'Posto de Saúde', 'Escola Básica',
  'Usina a carvão', 'Usina solar', 'Torre de água',
  'Condomínio Imperial (2x2)', 'Torre Corporativa (2x2)', 'Mega Center NeoTown (3x3)', 'Torre Panorama (2x2)',
  'Delegacia Regional', 'Quartel Geral de Polícia',
  'Estação de Bombeiros', 'Quartel Central de Bombeiros',
  'Pronto-Socorro Municipal', 'Hospital Geral Metropolitano',
  'Colégio Integrado', 'Campus Universitário'
];

export const SIZES = { P: 32, M: 48, G: 64, E: 96 };

export const FAC = {
  5: { r: 6, up: 4, sz: 1 },
  // Polícia em 3 níveis
  6: { r: 7, up: 12, sz: 1 },        // Nível 1: Posto Policial
  17: { r: 14, up: 32, sz: 1 },      // Nível 2: Delegacia Regional
  18: { r: 24, up: 75, sz: 2 },      // Nível 3: Quartel Geral (2x2)
  // Bombeiros em 3 níveis
  7: { r: 7, up: 12, sz: 1 },        // Nível 1: Posto de Bombeiros
  19: { r: 14, up: 32, sz: 1 },      // Nível 2: Estação de Bombeiros
  20: { r: 24, up: 75, sz: 2 },      // Nível 3: Quartel Central (2x2)
  // Saúde em 3 níveis
  8: { r: 8, up: 18, sz: 1 },        // Nível 1: Posto de Saúde
  21: { r: 15, up: 55, sz: 1 },      // Nível 2: Pronto-Socorro Municipal
  22: { r: 26, up: 130, sz: 2 },     // Nível 3: Hospital Geral Metropolitano (2x2)
  // Educação em 3 níveis
  9: { r: 7, up: 15, sz: 1 },        // Nível 1: Escola Básica
  23: { r: 14, up: 40, sz: 1 },      // Nível 2: Colégio Integrado
  24: { r: 25, up: 95, sz: 2 },      // Nível 3: Campus Universitário (2x2)
  // Energia e Água
  10: { pow: 320, up: 80, sz: 1 },
  11: { pow: 85, up: 14, sz: 1 },
  12: { wat: 220, up: 25, sz: 1 },
  // Marcos
  13: { pop: 240, up: 35, sz: 2, pw: 14, wt: 14 },
  14: { jobs: 210, up: 45, sz: 2, pw: 18, wt: 14 },
  15: { jobs: 480, r: 16, up: 110, sz: 3, pw: 36, wt: 28 },
  16: { r: 18, jobs: 65, up: 40, sz: 2, pw: 10, wt: 6 }
};

export const CATS = [
  { id: 'info', icon: '🔍', name: 'Info', items: [{ id: 'inspect', name: 'Inspecionar', mode: 'inspect', cost: 0 }] },
  { id: 'road', icon: '🛣️', name: 'Vias', items: [
    { id: 'road', name: 'Rua', mode: 'line', cost: 10, k: K.ROAD }, { id: 'power', name: 'Fio elétrico', mode: 'line', cost: 5, flag: 'pw' },
    { id: 'pipe', name: 'Cano d’água', mode: 'line', cost: 5, flag: 'pipe' }] },
  { id: 'zone', icon: '🏘️', name: 'Zonas', items: [
    { id: 'res', name: 'Residencial', mode: 'area', cost: 20, k: K.RES }, { id: 'com', name: 'Comercial', mode: 'area', cost: 25, k: K.COM },
    { id: 'ind', name: 'Industrial', mode: 'area', cost: 25, k: K.IND }] },
  { id: 'sky', icon: '🏙️', name: 'Marcos', items: [
    { id: 'sky_res', name: 'Condomínio 2x2', mode: 'point', cost: 2400, k: K.SKY_RES, sz: 2, minRank: 2 },
    { id: 'sky_com', name: 'Torre Corp 2x2', mode: 'point', cost: 3200, k: K.SKY_COM, sz: 2, minRank: 3 },
    { id: 'landmark', name: 'Panorama 2x2', mode: 'point', cost: 3800, k: K.LANDMARK, sz: 2, minRank: 4 },
    { id: 'mega', name: 'Mega Center 3x3', mode: 'point', cost: 6800, k: K.MEGA, sz: 3, minRank: 5 }] },
  { id: 'power', icon: '⚡', name: 'Energia', items: [
    { id: 'coal', name: 'Usina a carvão', mode: 'point', cost: 3000, k: K.COAL },
    { id: 'solar', name: 'Usina solar', mode: 'point', cost: 1500, k: K.SOLAR, minRank: 1 }] },
  { id: 'water', icon: '💧', name: 'Água', items: [{ id: 'wtower', name: 'Torre de água', mode: 'point', cost: 1200, k: K.WTOWER }] },
  { id: 'serv', icon: '🚓', name: 'Serviços', items: [
    // Segurança em 3 níveis
    { id: 'police', name: 'Posto Policial (P)', mode: 'point', cost: 450, k: K.POLICE, rCol: [100, 180, 255] },
    { id: 'police_med', name: 'Delegacia Regional (M)', mode: 'point', cost: 1200, k: K.POLICE_MED, rCol: [60, 140, 255], minRank: 1 },
    { id: 'police_lg', name: 'Quartel Geral de Polícia (G)', mode: 'point', cost: 3200, k: K.POLICE_LG, sz: 2, rCol: [30, 90, 255], minRank: 3 },
    // Bombeiros em 3 níveis
    { id: 'fire', name: 'Posto de Brigada (P)', mode: 'point', cost: 450, k: K.FIRE, rCol: [255, 120, 100] },
    { id: 'fire_med', name: 'Estação de Bombeiros (M)', mode: 'point', cost: 1200, k: K.FIRE_MED, rCol: [255, 70, 50], minRank: 1 },
    { id: 'fire_lg', name: 'Quartel Central de Bombeiros (G)', mode: 'point', cost: 3200, k: K.FIRE_LG, sz: 2, rCol: [220, 30, 20], minRank: 3 },
    // Saúde em 3 níveis
    { id: 'hosp', name: 'Posto de Saúde (P)', mode: 'point', cost: 600, k: K.HOSP, rCol: [120, 240, 150] },
    { id: 'hosp_med', name: 'Pronto-Socorro Municipal (M)', mode: 'point', cost: 1800, k: K.HOSP_MED, rCol: [60, 220, 110], minRank: 1 },
    { id: 'hosp_lg', name: 'Hospital Geral Metropolitano (G)', mode: 'point', cost: 4500, k: K.HOSP_LG, sz: 2, rCol: [30, 180, 80], minRank: 3 },
    // Educação em 3 níveis
    { id: 'school', name: 'Escola Básica (P)', mode: 'point', cost: 500, k: K.SCHOOL, rCol: [255, 230, 110] },
    { id: 'school_med', name: 'Colégio Integrado (M)', mode: 'point', cost: 1400, k: K.SCHOOL_MED, rCol: [255, 210, 60], minRank: 1 },
    { id: 'school_lg', name: 'Campus Universitário (G)', mode: 'point', cost: 3800, k: K.SCHOOL_LG, sz: 2, rCol: [240, 180, 30], minRank: 3 }
  ] },
  { id: 'rec', icon: '🌳', name: 'Lazer', items: [
    { id: 'park', name: 'Parque', mode: 'point', cost: 200, k: K.PARK }, { id: 'tree', name: 'Plantar árvores', mode: 'area', cost: 4, tree: 1 }] },
  { id: 'bull', icon: '🚜', name: 'Demolir', items: [{ id: 'bulldoze', name: 'Demolir', mode: 'area', cost: 3, bull: 1 }] }
];

export const CITY_RANKS = [
  { rank: 0, name: 'Assentamento', minPop: 0, bonus: 0, unlocks: 'Vias básicas, Zonas R/C/I, Usina a carvão, Torre de água', desc: 'Fundação do território pioneiro.' },
  { rank: 1, name: 'Povoado', minPop: 500, bonus: 5000, unlocks: 'Usina Solar, Hospital Geral', desc: 'Primeira comunidade consolidada com saúde básica.' },
  { rank: 2, name: 'Vila', minPop: 2000, bonus: 15000, unlocks: 'Condomínio Residencial 2x2', desc: 'Verticalização residencial e densidade urbana.' },
  { rank: 3, name: 'Cidadezinha', minPop: 5000, bonus: 35000, unlocks: 'Torre Corporativa 2x2', desc: 'Centro de serviços executivos e comércio de porte.' },
  { rank: 4, name: 'Cidade', minPop: 15000, bonus: 80000, unlocks: 'Marco Panorama 2x2', desc: 'Reconhecimento regional com atrativos turísticos.' },
  { rank: 5, name: 'Grande Cidade', minPop: 50000, bonus: 200000, unlocks: 'Mega Center 3x3', desc: 'Complexo comercial integrado e grande metrópole.' },
  { rank: 6, name: 'Metrópole', minPop: 100000, bonus: 500000, unlocks: 'Título de Megalópole Global', desc: 'Ponto culminante de prosperidade e civilização urbana.' }
];

export const CAPM = [1.4, 1, 0.6];
export const TAXM = [0.6, 1, 2.2];
export const CLSN = ['Pobre', 'Média', 'Elite'];
export const DAY_MS = 5000;
export const SPEEDS = [0, 1, 2, 4, 8];
export const POPCAP = [8, 20, 48];
export const JOBC = [6, 15, 34];
export const JOBI = [10, 24, 50];

export const U8 = [
  'bio', 'kind', 'lvl', 'vr', 'built', 'pw', 'pipe', 'pwOn', 'wtOn', 'fire',
  'nd', 'ab', 'cr', 'roadAdj', 'cPol', 'cFir', 'cHea', 'cEdu', 'cPar', 'poll',
  'land', 'hap', 'cls', 'riot', 'riotT', 'bSize', 'moisture', 'slopeMask', 'untouchable'
];

export const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
