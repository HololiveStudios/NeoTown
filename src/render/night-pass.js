import { fillPoly, put, setClipY } from './raster/pixel.js';
import { getNightLut } from './raster/caches.js';
import { bubble } from './effects.js';

export function renderNightPass(ctx) {
  const { fb, fb32, W, H, hw, night, nightOn, embN, emb32, em } = ctx;

  if (night > 0.18) {
    const dusk = Math.max(0, 1 - Math.abs(night - 0.45) * 4) * 0.5;
    const ma = Math.round((1 - 0.64 * night) * (1 + 0.1 * dusk) * 240);
    const mb = Math.round((1 - 0.58 * night) * 238);
    const mc = Math.round((1 - 0.3 * night) * (1 - 0.12 * dusk) * 232);
    const add = (10 * night) | 0;
    const lut = getNightLut(), tot = W * H;
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.min(255, (i * ma) >> 8);
      lut[256 + i] = Math.min(255, (i * mb) >> 8) << 8;
      lut[512 + i] = (Math.min(255, ((i * mc) >> 8) + add) << 16) | 0xff000000;
    }
    for (let p = 0; p < tot; p++) {
      const px = fb32[p];
      fb32[p] = lut[px & 255] | lut[256 + ((px >>> 8) & 255)] | lut[512 + ((px >>> 16) & 255)];
    }
  }
  setClipY(-1e9);
  if (nightOn) {
    for (let p = 0; p < embN; p++) {
      const v = emb32[p];
      if (v) fb32[p] = v;
    }
  }
  for (const e of em) {
    if (e.b) { bubble(fb, W, H, e.x, e.y, e.b, hw >= 18 ? 2 : 1); continue; }
    if (e.lp && night <= 0.25) continue;
    if (e.q) { if (night > 0.25) fillPoly(fb, W, H, e.q, e.c, 0, 0); continue; }
    if (night < 0.25 && e.f !== 1) continue;
    put(fb, W, H, e.x, e.y, e.c);
    if (e.f === 1 && night > 0.2) {
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const px = Math.round(e.x + d[0]), py = Math.round(e.y + d[1]);
        if (px >= 0 && py >= 0 && px < W && py < H) {
          const k = (py * W + px) * 4;
          fb[k] = fb[k] * 0.6 + e.c[0] * 0.4;
          fb[k + 1] = fb[k + 1] * 0.6 + e.c[1] * 0.4;
          fb[k + 2] = fb[k + 2] * 0.6 + e.c[2] * 0.4;
        }
      }
    }
  }
}
