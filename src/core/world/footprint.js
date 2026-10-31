import { BIO, FAC } from '../constants.js';
import { hash2 } from '../math/util.js';

export const footprintMethods = {
  placeFootprint(x0, y0, k, sz, instant, lvl) {
    const N = this.N; sz = sz || (FAC[k] && FAC[k].sz) || 1;
    if (x0 < 0 || y0 < 0 || x0 + sz > N || y0 + sz > N) return false;
    this.flattenArea(x0, y0, sz, sz);
    const piv = y0 * N + x0, vr = (hash2(x0, y0, this.seed + k * 13) * 2.55) | 0;
    for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
      const i = (y0 + dy) * N + (x0 + dx);
      if (this.bio[i] === BIO.FOREST) this.bio[i] = BIO.PLAIN;
      this.kind[i] = k; this.built[i] = 1; this.lvl[i] = lvl || 3; this.cls[i] = 2;
      this.vr[i] = vr; this.nd[i] = 0; this.ab[i] = 0; this.pivot[i] = piv;
      this.bSize[i] = (dx === 0 && dy === 0) ? sz : 0;
    }
    if (!instant) this.cons.set(piv, { p: 0, from: 0, dur: sz === 3 ? 4 : 2.5 });
    return true;
  },
  clearFootprint(i) {
    const N = this.N, piv = this.pivotOf(i), sz = this.bSize[piv] || 1, x0 = piv % N, y0 = (piv / N) | 0;
    this.cons.delete(piv); this.bText.delete(piv);
    for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
      const x = x0 + dx, y = y0 + dy; if (!this.ok(x, y)) continue;
      const j = y * N + x;
      this.kind[j] = 0; this.built[j] = 0; this.lvl[j] = 0; this.ab[j] = 0; this.fire[j] = 0;
      this.pivot[j] = -1; this.bSize[j] = 0;
    }
  }
};
