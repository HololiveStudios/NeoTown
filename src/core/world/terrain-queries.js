import { BIO, D4 } from '../constants.js';
import { clamp } from '../math/util.js';

export const terrainQueriesMethods = {
  getCornerTerrainHeight(cx, cy) {
    const N1 = this.N + 1;
    cx = clamp(cx, 0, this.N); cy = clamp(cy, 0, this.N);
    return this.cornerH[cy * N1 + cx];
  },
  getTileCorners(x, y) {
    const N1 = this.N + 1, i0 = y * N1 + x;
    return [this.cornerH[i0], this.cornerH[i0 + 1], this.cornerH[i0 + N1 + 1], this.cornerH[i0 + N1]];
  },
  getTerrainHeight(x, y) {
    if (!this.ok(x, y)) return 0;
    const c = this.getTileCorners(x, y);
    return (c[0] + c[1] + c[2] + c[3]) * 0.25;
  },
  isFlat(x, y) {
    if (!this.ok(x, y)) return true;
    const c = this.getTileCorners(x, y);
    return c[0] === c[1] && c[1] === c[2] && c[2] === c[3];
  },
  isSlope(x, y) {
    return !this.isFlat(x, y);
  },
  isCoast(x, y) {
    if (!this.ok(x, y) || this.bio[y * this.N + x] === BIO.WATER) return false;
    for (const d of D4) {
      const nx = x + d[0], ny = y + d[1];
      if (this.ok(nx, ny) && this.bio[ny * this.N + nx] === BIO.WATER) return true;
    }
    return false;
  },
  updateSlopeMasks() {
    const N = this.N, N1 = N + 1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i0 = y * N1 + x, h0 = this.cornerH[i0], h1 = this.cornerH[i0 + 1], h2 = this.cornerH[i0 + N1 + 1], h3 = this.cornerH[i0 + N1];
      const mn = Math.min(h0, h1, h2, h3), mx = Math.max(h0, h1, h2, h3);
      const mask = (h0 > mn ? 1 : 0) | (h1 > mn ? 2 : 0) | (h2 > mn ? 4 : 0) | (h3 > mn ? 8 : 0);
      this.slopeMask[y * N + x] = mask | (Math.min(15, mx - mn) << 4);
      if (this.elev) this.elev[y * N + x] = (h0 + h1 + h2 + h3) * 0.25;
    }
    this.terrainVer++;
  },
  flattenArea(x0, y0, w, h, targetH) {
    const N1 = this.N + 1;
    if (targetH == null) {
      let sum = 0, cnt = 0;
      for (let y = y0; y <= y0 + h; y++) for (let x = x0; x <= x0 + w; x++) if (x >= 0 && y >= 0 && x <= this.N && y <= this.N) { sum += this.cornerH[y * N1 + x]; cnt++; }
      targetH = Math.max(1, Math.round(sum / (cnt || 1)));
    }
    for (let y = y0; y <= y0 + h; y++) for (let x = x0; x <= x0 + w; x++) if (x >= 0 && y >= 0 && x <= this.N && y <= this.N) {
      this.cornerH[y * N1 + x] = targetH;
      this.elevF[y * N1 + x] = Math.max(36, targetH * 11);
    }
    this.updateSlopeMasks();
  }
};
