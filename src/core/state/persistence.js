import { U8 } from '../constants.js';

function encodeU8(u8) {
  let bin = '';
  const len = u8.length;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, Math.min(i + chunk, len)));
  }
  return typeof btoa === 'function' ? btoa(bin) : Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('base64');
}

function decodeU8(val, targetU8) {
  if (!val) return false;
  if (Array.isArray(val)) {
    if (val.length === targetU8.length) {
      targetU8.set(val);
      return true;
    }
    return false;
  }
  if (typeof val === 'string') {
    const bin = typeof atob === 'function' ? atob(val) : Buffer.from(val, 'base64').toString('binary');
    if (bin.length === targetU8.length) {
      for (let i = 0; i < bin.length; i++) targetU8[i] = bin.charCodeAt(i);
      return true;
    }
  }
  return false;
}

function encodeI32(i32) {
  const u8 = new Uint8Array(i32.buffer, i32.byteOffset, i32.byteLength);
  return encodeU8(u8);
}

function decodeI32(val, targetI32) {
  if (!val) return false;
  if (Array.isArray(val)) {
    if (val.length === targetI32.length) {
      targetI32.set(val);
      return true;
    }
    return false;
  }
  if (typeof val === 'string') {
    const u8View = new Uint8Array(targetI32.buffer, targetI32.byteOffset, targetI32.byteLength);
    return decodeU8(val, u8View);
  }
  return false;
}

export const persistenceMethods = {
  toJSON() {
    const o = {
      v: 6,
      id: this.id || null,
      version: this.version || 1,
      name: this.name || 'Delta City',
      gameMode: this.gameMode || 'medium',
      mayorName: this.mayorName || 'Prefeito Delta',
      cityRank: this.cityRank || 0,
      cityPoints: this.cityPoints || 0,
      pop: this.pop || 0,
      N: this.N,
      seed: this.seed,
      rs: this.rs,
      type: this.type
    };
    ['funds', 'day', 'month', 'year', 'tod', 'speed', 'tax', 'demand', 'hist', 'stats', 'last', 'cx', 'cy', 'interest', 'inflation'].forEach(k => { o[k] = this[k]; });
    U8.forEach(k => { o[k] = encodeU8(this[k]); });
    o.pivot = encodeI32(this.pivot);
    o.cornerH = encodeU8(this.cornerH);
    return o;
  }
};

export function fromJSON(GameClass, o) {
  const g = new GameClass({
    id: o.id,
    name: o.name,
    seed: o.seed,
    size: o.N,
    type: o.type,
    gameMode: o.gameMode,
    mayorName: o.mayorName,
    cityRank: o.cityRank,
    cityPoints: o.cityPoints,
    starter: false
  });
  g.version = o.version || 1;
  ['funds', 'day', 'month', 'year', 'tod', 'speed', 'tax', 'demand', 'hist', 'stats', 'last', 'cx', 'cy', 'rs', 'interest', 'inflation'].forEach(k => { if (o[k] !== undefined) g[k] = o[k]; });
  U8.forEach(k => { decodeU8(o[k], g[k]); });
  if (!decodeI32(o.pivot, g.pivot)) {
    /* Migracao v4 -> v5/v6: inicializa pivo e bSize de predios 1x1 existentes */
    for (let i = 0; i < g.kind.length; i++) {
      if (g.built[i] && g.kind[i] >= 2) { g.pivot[i] = i; g.bSize[i] = 1; }
      else { g.pivot[i] = -1; g.bSize[i] = 0; }
    }
  }
  if (decodeU8(o.cornerH, g.cornerH)) { g.updateSlopeMasks(); }
  g.hist.inf = g.hist.inf || []; g.last.rent = g.last.rent || 0; g.recalc(); return g;
}
