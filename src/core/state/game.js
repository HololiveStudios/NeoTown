import { U8 } from '../constants.js';
import { Building } from '../entities/building.js';
import { terrainQueriesMethods } from '../world/terrain-queries.js';
import { terrainGenMethods } from '../world/terrain-gen.js';
import { footprintMethods } from '../world/footprint.js';
import { starterMethods } from '../world/starter.js';
import { toolsMethods } from '../tools/tools.js';
import { selectionMethods } from '../tools/selection.js';
import { placementMethods } from '../tools/placement.js';
import { inspectMethods } from '../tools/inspect.js';
import { networkMethods } from '../sim/network.js';
import { happinessDemandMethods } from '../sim/happiness-demand.js';
import { clockMethods } from '../sim/clock.js';
import { economyMethods } from '../sim/economy.js';
import { growthMethods } from '../sim/growth.js';
import { eventsMethods } from '../sim/events.js';
import { vehiclesMethods } from '../sim/vehicles.js';
import { persistenceMethods, fromJSON } from './persistence.js';

export class Game {
  constructor(o) {
    o = o || {};
    const seed = (o.seed == null ? Date.now() & 0xffffff : o.seed) >>> 0, N = o.size || 48, n = N * N, cn = (N + 1) * (N + 1);
    const difficulty = o.difficulty || o.gameMode || 'medium';
    // Seção 5: Financiamento Governamental Inicial Realista ($18.000 padrão)
    const initialFunds = o.funds != null ? o.funds : (
      difficulty === 'easy' ? 35000 :
      difficulty === 'hard' ? 10000 :
      difficulty === 'sandbox' ? 999999 : 18000
    );
    Object.assign(this, {
      id: o.id || null, name: o.name || 'Delta City', N, seed, rs: seed, type: o.type || 'continent',
      gameMode: difficulty, mayorName: o.mayorName || 'Prefeito Delta', cityRank: o.cityRank || 0, cityPoints: o.cityPoints || 0,
      funds: initialFunds, debtTotal: o.debtTotal || 0, loansCount: o.loansCount || 0,
      day: 1, month: 1, year: 2026, tod: 0.32, speed: 0, acc: 0, anim: 0,
      tax: { r: 10, c: 10, i: 10 }, interest: difficulty === 'hard' ? 12 : 8, inflation: difficulty === 'easy' ? 2 : (difficulty === 'hard' ? 6 : 4),
      apP: 62, apR: 64, strikes: 0, nProt: 0, popC: [0, 0, 0], flight: 0, demand: { r: 0.4, c: 0.3, i: 0.3 },
      pop: 0, popRes: 0, pea: 0, employed: 0, unempCount: 0, jobs: 0, jobsAvail: 0,
      happy: 68, crimeIdx: 0, income: 0, expense: 0, unemp: 0,
      revTax: { r: 0, c: 0, i: 0 }, revCom: 0, revInd: 0, revExp: 0,
      expServ: { pow: 0, wat: 0, road: 0, city: 0, debtPay: 0 },
      last: { tr: 0, tc: 0, ti: 0, revCom: 0, revInd: 0, revExp: 0, up: 0, rent: 0, debt: 0, debtAmort: 0 },
      cx: N >> 1, cy: N >> 1, cat: 0, item: 0, sel: null, preview: null, msg: 'Bem-vindo ao seu novo território. Simulação em pausa.',
      logs: [], hist: { pop: [], funds: [], happy: [], inf: [] }, over: false, dirty: true, sinceCalc: 0, stats: { solved: 0, lost: 0, fires: 0 },
      pwS: 0, pwD: 0, wtS: 0, wtD: 0, builtCount: 0, nRes: 0, nCom: 0, nInd: 0, emR: 0, emC: 0, emI: 0, roads: 0, terrainVer: 1
    });
    U8.forEach(k => { this[k] = new Uint8Array(n); });
    this.pivot = new Int32Array(n).fill(-1);
    this.cornerH = new Uint8Array(cn);
    this.roadDist = new Uint8Array(n).fill(99);
    this.neglectDays = new Uint16Array(n); // Contador de dias de negligência por lote (sem água/luz/estrada)
    this.elevF = new Float32Array(cn);
    this.elev = new Float32Array(n);
    this.bText = new Map();
    this.busy = new Uint8Array(n); this.zl = []; this.bl = []; this.st = [];
    this.veh = []; this.crimes = []; this.assign = new Set(); this.noted = new Set(); this.cons = new Map(); this.fx = []; this.view = { ox: 0, oy: 0, hw: 8, hh: 4 };
    this.genTerrain(this.type);
    if (o.starter === true) this.starter();
    this.recalc();
  }
  rand() {
    let t = (this.rs = (this.rs + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  dateStr() {
    return String(this.day).padStart(2, '0') + '/' + String(this.month).padStart(2, '0') + '/' + this.year;
  }
  clock() {
    const m = Math.floor(this.tod * 1440);
    return String((m / 60) | 0).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  say(m) { this.msg = m; }
  log(m, lvl) {
    this.msg = m;
    this.logs.unshift({ t: this.dateStr(), m, lvl: lvl || 'info' });
    if (this.logs.length > 40) this.logs.pop();
  }
  ok(x, y) { return x >= 0 && y >= 0 && x < this.N && y < this.N; }
  pivotOf(i) { const p = this.pivot[i]; return p >= 0 ? p : i; }
  isOrigin(i) { const p = this.pivot[i]; return p < 0 || p === i; }
  getBuilding(x, y) {
    if (!this.ok(x, y)) return null;
    const i = this.pivotOf(y * this.N + x);
    return this.kind[i] >= 2 ? new Building(this, i) : null;
  }
  screenToTile(sx, sy) {
    const v = this.view, elevPx = v.elevPx || Math.round(v.hw * 0.34);
    let u = (sx - v.ox) / v.hw, w = (sy - v.oy) / v.hh, x = Math.floor((u + w) / 2), y = Math.floor((w - u) / 2);
    /* Refinamento iterativo por elevacao do terreno sob o cursor */
    for (let it = 0; it < 2; it++) {
      if (!this.ok(x, y)) break;
      const h = this.getTerrainHeight(x, y);
      const wAdj = (sy + h * elevPx - v.oy) / v.hh;
      x = Math.floor((u + wAdj) / 2); y = Math.floor((wAdj - u) / 2);
    }
    return this.ok(x, y) ? [x, y] : null;
  }
  static fromJSON(o) {
    return fromJSON(Game, o);
  }
}

Object.assign(
  Game.prototype,
  terrainQueriesMethods,
  terrainGenMethods,
  footprintMethods,
  starterMethods,
  toolsMethods,
  selectionMethods,
  placementMethods,
  inspectMethods,
  networkMethods,
  happinessDemandMethods,
  clockMethods,
  economyMethods,
  growthMethods,
  eventsMethods,
  vehiclesMethods,
  persistenceMethods
);
