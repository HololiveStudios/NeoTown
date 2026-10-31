import { K } from '../core/constants.js';
import { sh } from './raster/pixel.js';

export const CARS = [[220, 50, 50], [240, 240, 245], [50, 90, 200], [240, 200, 40], [70, 70, 78], [50, 160, 90], [240, 130, 30], [150, 60, 170]];
const TL_G = [60, 230, 90], TL_R = [240, 60, 50];

export function pole(X, kit, hw, g, x, y, T, cx, cy) {
  if (hw < 8) return;
  const N = g.N, top = cy - hw * 0.62;
  const base = [cx + hw * 0.3, cy], tp = [base[0], top + hw * 0.08];
  // Poste vertical #2b2d30 com cruzeta e isolador
  X.ln(base[0], base[1] + hw * 0.08, tp[0], tp[1], [43, 45, 48]);
  X.ln(tp[0] - 2, tp[1] + 1, tp[0] + 2, tp[1] + 1, [96, 100, 108]);
  X.pt(tp[0] - 2, tp[1], [194, 200, 206]);
  X.pt(tp[0] + 2, tp[1], [194, 200, 206]);
  for (const d of [[1, 0], [0, 1]]) {
    const nx = x + d[0], ny = y + d[1];
    if (nx < N && ny < N && g.pw[ny * N + nx]) {
      const q = T(nx + 0.5, ny + 0.5);
      const tx2 = q[0] + hw * 0.3, ty2 = q[1] - hw * 0.62 + hw * 0.08;
      // Fio com curva catenária parabólica (queda de ~2.5px no meio) - Seção 2.2
      const mx = (tp[0] + tx2) * 0.5, my = (tp[1] + ty2) * 0.5 + Math.max(2, hw * 0.11);
      X.ln(tp[0], tp[1], mx, my, [26, 28, 30]);
      X.ln(mx, my, tx2, ty2, [26, 28, 30]);
    }
  }
}

export function road(g, x, y, T, poly, X, hw, bridge, night, A, hi, mid) {
  const N = g.N, R = (a, b) => a >= 0 && b >= 0 && a < N && b < N && g.kind[b * N + a] === K.ROAD;
  const nx = R(x + 1, y), px = R(x - 1, y), ny = R(x, y + 1), py = R(x, y - 1), none = !(nx || px || ny || py), w = 0.26;
  // 5 Camadas Transversais (Seção 2.1): Calçada #b0b5ba, Sarjeta #6c7075, Asfalto Granulado #454346/#3b393c
  const walk = bridge ? [132, 110, 82] : [176, 181, 186];
  const gutter = bridge ? [92, 74, 54] : [108, 112, 117];
  const asph = bridge ? [112, 96, 76] : [69, 67, 70];
  const rect = (u0, u1, v0, v1, c, j) => {
    const a = T(x + u0, y + v0), b = T(x + u1, y + v0), cc = T(x + u1, y + v1), d = T(x + u0, y + v1);
    poly([a[0], a[1], b[0], b[1], cc[0], cc[1], d[0], d[0] * 0 + d[1]], c, j, 0);
  };
  const arms = (ww, c, j) => {
    rect(0.5 - ww, 0.5 + ww, 0.5 - ww, 0.5 + ww, c, j);
    if (nx || none) rect(0.5, 1, 0.5 - ww, 0.5 + ww, c, j);
    if (px || none) rect(0, 0.5, 0.5 - ww, 0.5 + ww, c, j);
    if (ny) rect(0.5 - ww, 0.5 + ww, 0.5, 1, c, j);
    if (py) rect(0.5 - ww, 0.5 + ww, 0, 0.5, c, j);
  };
  if (bridge && mid) {
    for (const q of [0.2, 0.8]) {
      const a = T(x + q, y + 0.5);
      X.ln(a[0], a[1], a[0], a[1] + hw * 0.7, [80, 70, 64]);
      X.ln(a[0] + 1, a[1], a[0] + 1, a[1] + hw * 0.7, [60, 54, 50]);
    }
  }
  if (hw >= 6) arms(w + 0.095, walk, hi ? 1 : 0);
  if (hw >= 10) arms(w + 0.032, gutter, 0);
  arms(w, asph, hi ? 2 : 1);
  if (mid) {
    const dash = (u0, v0, u1, v1) => { const a = T(x + u0, y + v0), b = T(x + u1, y + v1); X.ln(a[0], a[1], b[0], b[1], [240, 244, 248]); };
    if (nx || none) { dash(0.62, 0.5, 0.74, 0.5); dash(0.82, 0.5, 0.94, 0.5); }
    if (px || none) { dash(0.06, 0.5, 0.18, 0.5); dash(0.26, 0.5, 0.38, 0.5); }
    if (ny) { dash(0.5, 0.62, 0.5, 0.74); dash(0.5, 0.82, 0.5, 0.94); }
    if (py) { dash(0.5, 0.06, 0.5, 0.18); dash(0.5, 0.26, 0.5, 0.38); }
    const arm = (nx ? 1 : 0) + (px ? 1 : 0) + (ny ? 1 : 0) + (py ? 1 : 0);
    if (hi && arm >= 3 && !bridge) {
      const cw = (u0, u1) => { for (let q = 0; q < 5; q++) { const v1 = 0.5 - w + 0.02 + q * (2 * w - 0.04) / 4.5; rect(u0, u1, v1, v1 + 0.05, [240, 244, 248], 0); } };
      const cw2 = (v0, v1) => { for (let q = 0; q < 5; q++) { const u1 = 0.5 - w + 0.02 + q * (2 * w - 0.04) / 4.5; rect(u1, u1 + 0.05, v0, v1, [240, 244, 248], 0); } };
      if (nx) cw(0.8, 0.86); if (px) cw(0.14, 0.2); if (ny) cw2(0.8, 0.86); if (py) cw2(0.14, 0.2);
      const a0 = T(x + 0.13, y + 0.13), a1 = T(x + 0.87, y + 0.87);
      X.ln(a0[0], a0[1], a0[0], a0[1] - hw * 0.4, [43, 45, 48]);
      X.ln(a1[0], a1[1], a1[0], a1[1] - hw * 0.4, [43, 45, 48]);
    } else if (hi && !bridge && (x * 7 + y * 3) % 5 === 0) {
      const m = T(x + 0.5, y + 0.5);
      poly([m[0] - 2, m[1], m[0], m[1] - 1, m[0] + 2, m[1], m[0], m[1] + 1], [40, 42, 48], 0, 0);
    }
  }
  if (bridge && hw >= 8) {
    if (nx || px || none) {
      const a = T(x, y + 0.5 - w - 0.04), b = T(x + 1, y + 0.5 - w - 0.04), c = T(x, y + 0.5 + w + 0.04), d = T(x + 1, y + 0.5 + w + 0.04);
      X.ln(a[0], a[1] - 3, b[0], b[1] - 3, [200, 196, 186]); X.ln(c[0], c[1] - 3, d[0], d[1] - 3, [200, 196, 186]);
    }
    if (ny || py) {
      const a = T(x + 0.5 - w - 0.04, y), b = T(x + 0.5 - w - 0.04, y + 1), c = T(x + 0.5 + w + 0.04, y), d = T(x + 0.5 + w + 0.04, y + 1);
      X.ln(a[0], a[1] - 3, b[0], b[1] - 3, [200, 196, 186]); X.ln(c[0], c[1] - 3, d[0], d[1] - 3, [200, 196, 186]);
    }
  }
  if (hi && !bridge && ((x + y) % 3 === 0)) {
    const l = T(x + 0.12, y + 0.12);
    X.ln(l[0], l[1], l[0], l[1] - hw * 0.5, [64, 66, 74]);
    X.pt(l[0], l[1] - hw * 0.5 - 1, night > 0.3 ? [255, 232, 160] : [230, 230, 210]);
    if (night > 0.25) X.emP(l[0], l[1] - hw * 0.5 - 1, [255, 226, 150], 1);
  } else if (mid && !bridge && night > 0.25 && ((x + y) % 3 === 0)) {
    const l = T(x + 0.15, y + 0.15);
    X.emP(l[0], l[1] - hw * 0.25, [255, 226, 150], 1);
  }
}

export function roadFG(g, x, y, cx, cy, X, hw, hh, A) {
  const N = g.N, k = g.kind, i = y * N + x;
  const arm = (x + 1 < N && k[i + 1] === K.ROAD ? 1 : 0) + (x > 0 && k[i - 1] === K.ROAD ? 1 : 0) + (y + 1 < N && k[i + N] === K.ROAD ? 1 : 0) + (y > 0 && k[i - N] === K.ROAD ? 1 : 0);
  if (arm < 3) return;
  const ph = ((A >> 2) + x + y) & 1, c0 = ph ? TL_G : TL_R, c1 = ph ? TL_R : TL_G;
  const y0 = cy - hh * 0.74 - hw * 0.4 - 1, y1 = cy + hh * 0.74 - hw * 0.4 - 1;
  X.pt(cx, y0, c0); X.pt(cx + 1, y0, c0); X.pt(cx, y1, c1); X.pt(cx + 1, y1, c1);
}

export function car(X, poly, T, v, hw, hh, night, A, hi) {
  const dx = v.nx - v.x, dy = v.ny - v.y, ox = -dy * 0.17, oy = dx * 0.17, fx = v.x + 0.5 + dx * v.p + ox, fy = v.y + 0.5 + dy * v.p + oy, c = T(fx, fy), em = v.kind !== 'car';
  const col = v.kind === 'fire' ? [226, 44, 40] : v.kind === 'police' ? [236, 240, 250] : CARS[v.col || 0];
  if (hw < 5) { X.pt(c[0], c[1], col); if (em && A % 2) X.emP(c[0], c[1], [255, 60, 60], 1); return; }
  const van = (v.col || 0) >= 6 && !em, L = em ? 0.3 : van ? 0.25 : 0.2, Wd = em ? 0.12 : 0.09, h = Math.max(2, hw * (em ? 0.28 : van ? 0.26 : 0.2));
  const ux = dx !== 0 ? Math.sign(dx) : 0, uy = dy !== 0 ? Math.sign(dy) : 0, vx = -uy, vy = ux;
  const corner = (a, b) => T(fx + ux * L * a + vx * Wd * b, fy + uy * L * a + vy * Wd * b);
  const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
  poly([pts[0][0], pts[0][1], pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]], [20, 20, 24], 0, 0.35);
  if (hi) for (const a of [-0.6, 0.6]) for (const b of [-1, 1]) { const w = corner(a, b); X.pt(w[0], w[1], [20, 20, 22]); X.pt(w[0], w[1] - 1, [20, 20, 22]); }
  const up = (q) => [q[0], q[1] - h], t0 = up(pts[0]), t1 = up(pts[1]), t2 = up(pts[2]), t3 = up(pts[3]);
  poly([pts[3][0], pts[3][1], pts[2][0], pts[2][1], t2[0], t2[1], t3[0], t3[1]], sh(col, 0.7), 0, 0);
  poly([pts[2][0], pts[2][1], pts[1][0], pts[1][1], t1[0], t1[1], t2[0], t2[1]], sh(col, 0.85), 0, 0);
  poly([t0[0], t0[1], t1[0], t1[1], t2[0], t2[1], t3[0], t3[1]], sh(col, 1.1), 0, 0);
  if (hi) {
    const r0 = corner(-0.35, -0.75), r1 = corner(0.5, -0.75), r2 = corner(0.5, 0.75), r3 = corner(-0.35, 0.75);
    poly([r0[0], r0[1] - h - 1, r1[0], r1[1] - h - 1, r2[0], r2[1] - h - 1, r3[0], r3[1] - h - 1], van ? sh(col, 0.9) : [44, 64, 94], 0, van ? 0 : 0.8);
  }
  if (night > 0.2) {
    const hl = corner(1, 0); X.emP(hl[0], hl[1] - h * 0.5, [255, 246, 190], 1);
    const tl = corner(-1, 0); X.emP(tl[0], tl[1] - h * 0.5, [255, 40, 30], 0);
  }
  if (em) {
    const fl = A % 2, lc = v.kind === 'fire' ? (fl ? [255, 50, 50] : [255, 255, 255]) : (fl ? [255, 40, 40] : [50, 70, 255]), m = corner(0, 0);
    X.pt(m[0], m[1] - h - 1, lc); X.pt(m[0] + 1, m[1] - h - 1, lc); X.emP(m[0], m[1] - h - 1, lc, 1);
  }
}
