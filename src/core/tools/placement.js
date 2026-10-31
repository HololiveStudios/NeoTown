import { BIO, K } from '../constants.js';
import { hash2 } from '../math/util.js';

export const placementMethods = {
  cost1(i, it) {
    if (it.minRank && it.minRank > (this.cityRank || 0)) return -1;
    const k = this.kind[i], b = this.bio[i], x = i % this.N, y = (i / this.N) | 0, slopeCost = this.isSlope(x, y) ? 6 : 0;
    if (it.bull) return k || this.pw[i] || this.pipe[i] || b === BIO.FOREST ? it.cost : -1;
    if (it.tree) return b === BIO.PLAIN && !k ? it.cost : -1;
    // Canos subterrâneos e cabos aéreos: livres para passar sob estradas, casas e terrenos secos
    if (it.flag) return b !== BIO.WATER && !this[it.flag][i] ? it.cost : -1;
    if (k) return -1;
    if (it.id === 'road') return b === BIO.WATER ? it.cost * 4 : (b === BIO.HILL ? it.cost * 2 : it.cost) + slopeCost;
    if (b === BIO.WATER) return -1;

    // Pilar 1: Inflação de Zoneamento baseada no total de zonas já criadas
    let baseCost = it.cost;
    const isZoning = it.id === 'res' || it.id === 'com' || it.id === 'ind' || it.k === K.RES || it.k === K.COM || it.k === K.IND;
    if (isZoning) {
      const totalZones = (this.nRes || 0) + (this.nCom || 0) + (this.nInd || 0);
      baseCost = Math.round(it.cost * Math.pow(1.008, totalZones));
    }

    // Seção 2 do Planejamento: Trava Espacial Obrigatória de Vias
    // Aplicada apenas para zonas e edifícios (não para fios nem canos)
    if (it.k && it.k !== K.ROAD && it.k !== K.PARK && !it.bull && !it.tree && !it.flag) {
      let hasRoadNear = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 2) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < this.N && ny < this.N && this.kind[ny * this.N + nx] === K.ROAD) {
              hasRoadNear = true;
              break;
            }
          }
        }
        if (hasRoadNear) break;
      }
      if (!hasRoadNear) return -1; // Fora da faixa de atendimento viário
    }

    return (it.sz > 1 ? Math.round(baseCost / (it.sz * it.sz)) : baseCost) + (b === BIO.FOREST ? 5 : 0) + slopeCost;
  },
  buildPreview() {
    const it = this.tool();
    if (it.mode === 'inspect') { this.preview = null; return; }
    const s = this.sel || { x0: this.cx, y0: this.cy, x1: this.cx, y1: this.cy }, sz = it.sz || 1;
    const raw = this.tilesOf(s, it), tiles = raw.map(i => ({ i, c: this.cost1(i, it) }));
    const allFit = it.mode === 'point' ? (raw.length === sz * sz && tiles.every(t => t.c >= 0)) : true;
    let cost = 0;
    if (it.mode === 'point' && sz > 1) {
      cost = allFit ? it.cost : 0;
      if (!allFit) tiles.forEach(t => { t.c = -1; });
    } else {
      tiles.forEach(t => { if (t.c >= 0) cost += t.c; });
    }
    this.preview = { tiles, cost, ok: allFit && cost <= this.funds && cost > 0 };
  },
  selEnd() {
    const it = this.tool();
    if (!this.sel) {
      if (it.mode === 'point') this.sel = { x0: this.cx, y0: this.cy, x1: this.cx, y1: this.cy };
      else return 0;
    }
    this.buildPreview();
    const pv = this.preview, s = this.sel;
    this.sel = null;
    if (!pv) return 0;
    if (!pv.cost || !pv.ok) {
      const isRoadLock = pv.tiles && pv.tiles.some(t => t.c === -1) && it.k && it.k !== K.ROAD;
      if (isRoadLock) {
        this.say('⚠️ Fora do alcance viário: trace uma rua a no máximo 2 quadras.');
      } else {
        this.say(pv.cost > this.funds ? 'Caixa insuficiente: precisa de $' + pv.cost : 'Não dá para construir aqui.');
      }
      this.buildPreview();
      return 0;
    }
    let n = 0;
    const isZoning = it.k === K.RES || it.k === K.COM || it.k === K.IND;
    
    // Captura snapshot pré-execução para possibilitar Desfazer (Undo) no Editor de Zoneamento
    const undoTiles = [];
    pv.tiles.forEach(t => {
      if (t.c >= 0) {
        undoTiles.push({
          i: t.i,
          k: this.kind[t.i],
          built: this.built[t.i],
          lvl: this.lvl[t.i],
          vr: this.vr[t.i],
          pw: this.pw[t.i],
          pipe: this.pipe[t.i]
        });
      }
    });

    if (it.mode === 'point' && (it.sz || 1) > 1) {
      this.placeFootprint(s.x1, s.y1, it.k, it.sz, false, 3);
      n = it.sz * it.sz;
    } else {
      pv.tiles.forEach(t => { if (t.c >= 0) { this.place(t.i, it); n++; } });
    }

    // Seção 3: Auto-circundar com Estradas e Infraestrutura Básica se o editor estiver com opção ativa
    if (isZoning && typeof window !== 'undefined' && window.DeltaZoneEditorState && window.DeltaZoneEditorState.autoRoads) {
      const minX = Math.min(s.x0, s.x1) - 1;
      const maxX = Math.max(s.x0, s.x1) + 1;
      const minY = Math.min(s.y0, s.y1) - 1;
      const maxY = Math.max(s.y0, s.y1) + 1;
      const autoUtils = window.DeltaZoneEditorState.autoUtilities;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (x === minX || x === maxX || y === minY || y === maxY) {
            if (this.ok(x, y)) {
              const rIdx = y * this.N + x;
              if (!this.kind[rIdx] && this.bio[rIdx] !== BIO.WATER) {
                undoTiles.push({
                  i: rIdx, k: this.kind[rIdx], built: this.built[rIdx], lvl: this.lvl[rIdx],
                  vr: this.vr[rIdx], pw: this.pw[rIdx], pipe: this.pipe[rIdx]
                });
                this.kind[rIdx] = K.ROAD;
                this.built[rIdx] = 1;
                if (autoUtils) {
                  this.pw[rIdx] = 1;
                  this.pipe[rIdx] = 1;
                }
              }
            }
          }
        }
      }
    }

    // Registra no histórico do Editor de Zoneamento para botão Desfazer
    if (typeof window !== 'undefined' && window.DeltaPushZoneSnapshot) {
      window.DeltaPushZoneSnapshot({
        revert: (game) => {
          undoTiles.forEach(ut => {
            game.kind[ut.i] = ut.k;
            game.built[ut.i] = ut.built;
            game.lvl[ut.i] = ut.lvl;
            game.vr[ut.i] = ut.vr;
            game.pw[ut.i] = ut.pw;
            game.pipe[ut.i] = ut.pipe;
            game.cons.delete(ut.i);
          });
          game.funds += pv.cost;
        }
      });
    }

    this.funds -= pv.cost;
    this.recalc();
    this.say(it.name + ': ' + n + ' tile(s) [-$' + pv.cost + ']');
    if ((it.k === K.POLICE || it.k === K.FIRE) && !this.roadAdj[this.cy * this.N + this.cx]) {
      this.log('⚠️ ' + it.name + ' sem rua encostada: as viaturas não conseguem sair!', 'bad');
    }
    this.buildPreview();
    return n;
  },
  place(i, it) {
    const b = this.bio[i], x = i % this.N, y = (i / this.N) | 0;
    if (it.bull) {
      if (this.kind[i] || this.built[i]) { this.puff(i, 'dust'); this.clearFootprint(i); }
      this.pw[i] = 0; this.pipe[i] = 0;
      if (b === BIO.FOREST) this.bio[i] = BIO.PLAIN;
      return;
    }
    if (it.tree) { this.bio[i] = BIO.FOREST; return; }
    if (it.flag) { this[it.flag][i] = 1; return; }
    if (b === BIO.FOREST) this.bio[i] = BIO.PLAIN;
    this.kind[i] = it.k; this.vr[i] = (hash2(x, y, this.seed) * 2.55) | 0; this.nd[i] = 0; this.ab[i] = 0;
    this.pivot[i] = i; this.bSize[i] = 1;
    if (it.k === K.ROAD) { this.built[i] = 1; this.pivot[i] = -1; return; }
    this.flattenArea(x, y, 1, 1);
    if (it.k === K.RES || it.k === K.COM || it.k === K.IND) {
      // Seção 2: Construção Imediata com 5 Fases de Obras
      // Obras iniciam instantaneamente no lote demarcado (dur: 2.2 a 3.5 dias)
      this.built[i] = 1;
      this.lvl[i] = 1;
      this.pivot[i] = i;
      this.bSize[i] = 1;
      this.vr[i] = this.pickEntropyVariant ? this.pickEntropyVariant(i, it.k, 1, 4) : ((hash2(x, y, this.seed) * 2.55) | 0);
      this.cons.set(i, { p: 0, from: 0, dur: it.k === K.RES ? 2.2 : it.k === K.COM ? 2.6 : 3.0 });
    } else {
      this.built[i] = 1; this.lvl[i] = 1;
      this.cons.set(i, { p: 0, from: 0, dur: it.k === K.PARK ? 1.5 : 3.2 });
    }
  }
};
