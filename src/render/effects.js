import { clamp } from '../core/math/util.js';
import { put, mix } from './raster/pixel.js';

export const ICON = {
  bolt: ['..XX.', '.XX..', 'XXXXX', '..XX.', '.XX..'],
  drop: ['..X..', '.XXX.', 'XXXXX', 'XXXXX', '.XXX.'],
  road: ['X...X', 'X.X.X', 'X...X', 'X.X.X', 'X...X'],
  fire: ['..X..', '.XXX.', 'XXXXX', 'XXXXX', '.XXX.'],
  cop: ['X...X', 'XXXXX', '.XXX.', '.XXX.', '..X..'],
  riot: ['.XXX.', 'XXXXX', 'XXXXX', '.XXX.', '..X..']
};

export const ICOLOR = {
  bolt: [250, 210, 40],
  drop: [60, 150, 240],
  road: [130, 130, 140],
  fire: [240, 70, 30],
  cop: [60, 90, 230],
  riot: [230, 50, 50]
};

export function bubble(fb, W, H, cx, cy, name, S) {
  S = S || 1;
  const ic = ICON[name], col = ICOLOR[name], x0 = Math.round(cx - 4 * S), y0 = Math.round(cy - 4 * S);
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(fb, W, H, x0 + x + i, y0 + y + j, c); };
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const edge = (x === 0 || x === 7) && (y === 0 || y === 7);
    if (!edge) R(x * S, y * S, S, S, [252, 252, 252]);
  }
  R(3 * S, 8 * S, 2 * S, S, [252, 252, 252]);
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (ic[y][x] === 'X') R((1 + x) * S, (1 + y) * S, S, S, col);
}

export function flames(X, f, cx, cy, hw, hh, A, x) {
  const q = clamp(f / 100, 0.25, 1.4), n = 6 + (q * 10) | 0;
  for (let m = 0; m < n; m++) {
    const ph = A * 0.9 + m * 1.7 + x, fx = cx + Math.sin(ph) * hw * 0.3, base = cy - hw * 0.1 - (m % 3) * hw * 0.12, h = (3 + (m % 4) * 2) * q * (hw / 16) * (0.7 + 0.3 * Math.sin(ph * 2));
    const c = m % 3 === 0 ? [255, 236, 100] : m % 3 === 1 ? [255, 150, 34] : [232, 60, 22];
    X.poly([fx - 2 * q, base, fx + 2 * q, base, fx + Math.sin(ph) * 1.2, base - h], c, 0, 0);
    X.emP(fx, base - h * 0.5, c, 1);
  }
  for (let m = 0; m < 5; m++) {
    const t = ((A * 0.4 + m * 0.7) % 3) / 3;
    X.pt(cx + Math.sin(A * 0.5 + m) * (2 + t * 4) + t * 3, cy - hw * 0.5 - t * hw * 0.9, mix([90, 90, 96], [40, 40, 46], t));
    X.pt(cx + 1 + Math.sin(A * 0.5 + m) * (2 + t * 4) + t * 3, cy - hw * 0.5 - t * hw * 0.9, mix([90, 90, 96], [40, 40, 46], t));
  }
}

export function protest(X, hw, hh, A, x, cx, cy, kit) {
  if (hw < 8) return;
  const cols = [[220, 70, 70], [240, 200, 60], [70, 130, 230], [240, 240, 240], [150, 80, 200]], s = Math.max(1, hw / 16);
  for (let m = 0; m < 5; m++) {
    const u = -.34 + m * .17, v = .34 + (m & 1) * .07, p = kit.P(u, v, 0), c = cols[m];
    X.ln(p[0], p[1] - s, p[0], p[1], [40, 36, 40]);
    X.poly([p[0] - s * .7, p[1] - 3 * s, p[0] + s * .7, p[1] - 3 * s, p[0] + s * .7, p[1] - s, p[0] - s * .7, p[1] - s], c, 0, 0);
    X.pt(p[0], p[1] - 3.8 * s, [238, 200, 168]);
    X.ln(p[0] + s * .7, p[1] - 2.6 * s, p[0] + s * 1.4, p[1] - (4 + ((A + m) % 2)) * s, c);
    if (hw >= 14) {
      const a = kit.P(u - .05, v, 4), b = kit.P(u - .05, v, 11);
      X.ln(a[0], a[1], b[0], b[1], [110, 80, 50]);
      kit.Q([kit.P(u - .12, v, 11), kit.P(u + .02, v, 11), kit.P(u + .02, v, 16), kit.P(u - .12, v, 16)], m % 2 ? [255, 255, 255] : [255, 230, 120], 0, 0);
    }
  }
  flames(X, 34, cx + hw * .42, cy + hh * .35, hw, hh, A, x);
}
