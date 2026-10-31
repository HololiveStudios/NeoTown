import { clamp, hash2 } from './util.js';

export function qnoise(x, y, s, cell) {
  const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * tx * (tx * (tx * 6 - 15) + 10), sy = ty * ty * ty * (ty * (ty * 6 - 15) + 10);
  const a = hash2(x0, y0, s), b = hash2(x0 + 1, y0, s), c = hash2(x0, y0 + 1, s), d = hash2(x0 + 1, y0 + 1, s);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

export function fbm(x, y, s, baseCell, octaves) {
  let val = 0, amp = 0.5, freq = 1, norm = 0;
  for (let o = 0; o < (octaves || 4); o++) {
    val += amp * qnoise(x * freq, y * freq, s + o * 37, baseCell);
    norm += amp; amp *= 0.5; freq *= 2.02;
  }
  return val / norm;
}

export function ridgedFbm(x, y, s, baseCell, octaves) {
  let val = 0, amp = 0.5, freq = 1, weight = 1, norm = 0;
  for (let o = 0; o < (octaves || 3); o++) {
    let n = 1 - Math.abs(qnoise(x * freq, y * freq, s + o * 53, baseCell) / 50 - 1);
    n = n * n * weight; weight = clamp(n * 1.6, 0, 1);
    val += n * amp; norm += amp; amp *= 0.5; freq *= 2.1;
  }
  return (val / norm) * 100;
}
