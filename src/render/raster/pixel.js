export const sh = (c, f) => [Math.min(255, c[0] * f) | 0, Math.min(255, c[1] * f) | 0, Math.min(255, c[2] * f) | 0];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];

let CLIP = -1e9;
let ERASE = false;

export function setClipY(v) {
  CLIP = v;
}

export function getClipY() {
  return CLIP;
}

export function setEraseMode(v) {
  ERASE = !!v;
}

export function fillPoly(fb, W, H, p, c, jit, al) {
  const n = p.length / 2; let y0 = 1e9, y1 = -1e9;
  for (let i = 1; i < p.length; i += 2) { if (p[i] < y0) y0 = p[i]; if (p[i] > y1) y1 = p[i]; }
  const ya = Math.max(0, Math.ceil(y0 - 0.5), Math.ceil(CLIP - 0.5)), yb = Math.min(H - 1, Math.ceil(y1 - 0.5) - 1), r = c[0], g = c[1], b = c[2];
  const u32 = (!jit && !al) ? (fb._u32 || (fb._u32 = new Uint32Array(fb.buffer, fb.byteOffset, fb.byteLength >> 2))) : null;
  const col32 = u32 ? (0xff000000 | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) : 0;
  for (let y = ya; y <= yb; y++) {
    const yc = y + 0.5; let lo = 1e9, hi = -1e9;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = p[i * 2], ay = p[i * 2 + 1], bx = p[j * 2], by = p[j * 2 + 1];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) { const x = ax + (yc - ay) * (bx - ax) / (by - ay); if (x < lo) lo = x; if (x > hi) hi = x; }
    }
    if (lo > hi) continue;
    const xa = Math.max(0, Math.round(lo)), xb = Math.min(W, Math.round(hi));
    if (u32) { if (xa < xb) u32.fill(col32, y * W + xa, y * W + xb); continue; }
    let k = (y * W + xa) * 4;
    for (let x = xa; x < xb; x++, k += 4) {
      let n2 = 0;
      if (jit === -1) {
        // Padrão Xadrez de Telhas de Barro (Seção 3.1 / Seção 5: (px + py) % 2)
        n2 = ((x + y) & 1) ? -28 : 8;
      } else if (jit === -2) {
        // Padrão de Alvenaria / Tijolos 2x1 px
        n2 = (((x >> 1) + y) & 1) ? -14 : 6;
      } else if (jit) {
        n2 = (((((x * 73856093) ^ (y * 19349663)) >>> 7) & 7) - 3) * jit * 1.6;
      }
      if (al) {
        fb[k] += (r + n2 - fb[k]) * al;
        fb[k + 1] += (g + n2 - fb[k + 1]) * al;
        fb[k + 2] += (b + n2 - fb[k + 2]) * al;
      } else {
        fb[k] = r + n2;
        fb[k + 1] = g + n2;
        fb[k + 2] = b + n2;
      }
      fb[k + 3] = 255;
    }
  }
}

export function put(fb, W, H, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H || y < CLIP) return;
  const k = (y * W + x) * 4;
  if (ERASE) { fb[k] = fb[k + 1] = fb[k + 2] = fb[k + 3] = 0; return; }
  fb[k] = c[0]; fb[k + 1] = c[1]; fb[k + 2] = c[2]; fb[k + 3] = 255;
}

export function erasePoly(u, W, H, p) {
  const n = p.length / 2; let y0 = 1e9, y1 = -1e9;
  for (let i = 1; i < p.length; i += 2) { if (p[i] < y0) y0 = p[i]; if (p[i] > y1) y1 = p[i]; }
  const ya = Math.max(0, Math.ceil(y0 - 0.5)), yb = Math.min(H - 1, Math.ceil(y1 - 0.5) - 1);
  for (let y = ya; y <= yb; y++) {
    const yc = y + 0.5; let lo = 1e9, hi = -1e9;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = p[i * 2], ay = p[i * 2 + 1], bx = p[j * 2], by = p[j * 2 + 1];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) { const x = ax + (yc - ay) * (bx - ax) / (by - ay); if (x < lo) lo = x; if (x > hi) hi = x; }
    }
    if (lo > hi) continue;
    const xa = Math.max(0, Math.round(lo)), xb = Math.min(W, Math.round(hi));
    if (xa < xb) u.fill(0, y * W + xa, y * W + xb);
  }
}

export function line(fb, W, H, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(fb, W, H, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
}

export function fillShadowMask(u, Wd, Ht, p) {
  const n = p.length / 2; let y0 = 1e9, y1 = -1e9;
  for (let i = 1; i < p.length; i += 2) { if (p[i] < y0) y0 = p[i]; if (p[i] > y1) y1 = p[i]; }
  const ya = Math.max(0, Math.ceil(y0 - 0.5)), yb = Math.min(Ht - 1, Math.ceil(y1 - 0.5) - 1);
  for (let y = ya; y <= yb; y++) {
    const yc = y + 0.5; let lo = 1e9, hi = -1e9;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ax = p[i * 2], ay = p[i * 2 + 1], bx = p[j * 2], by = p[j * 2 + 1];
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) { const x = ax + (yc - ay) * (bx - ax) / (by - ay); if (x < lo) lo = x; if (x > hi) hi = x; }
    }
    if (lo > hi) continue;
    const xa = Math.max(0, Math.round(lo)), xb = Math.min(Wd, Math.round(hi)), row = y * Wd;
    for (let x = xa; x < xb; x++) if (!u[row + x]) u[row + x] = 0x01000000;
  }
}
