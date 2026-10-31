import { hash2 } from '../../core/math/util.js';
import { sh, mix, mat, FONT } from './palettes.js';

export function makePrimitives(X) {
  const sz = X.sz || 1, hw = X.hw * sz, hh = X.hh * sz, U = X.hw / 13.5, hi = X.hw >= 20, vhi = X.hw >= 36, mid = X.hw >= 12, A = X.A, night = X.night;
  const cy0 = X.cy + (sz - 1) * X.hh;
  const P = (u, v, z) => [X.cx + (u - v) * hw, cy0 + (u + v) * hh - (z || 0) * U];
  const Q = (ps, c, j, a) => { const f = []; for (let i = 0; i < ps.length; i++) f.push(ps[i][0], ps[i][1]); X.poly(f, c, j, a); };
  const LN = (a, b, c) => X.ln(a[0], a[1], b[0], b[1], c);
  const PT = (p, c) => X.pt(p[0], p[1], c);
  const jit = hi ? 2 : 1;

  function hull(pts) {
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }

  function shadow(u0, v0, u1, v1, h) {
    if (!mid || X.shA < 0.03 || h <= 0) return;
    const sx = X.sunX * h * U, sy = X.sunY * h * U, g = [P(u0, v0, 0), P(u1, v0, 0), P(u1, v1, 0), P(u0, v1, 0)];
    Q(hull(g.concat(g.map(p => [p[0] + sx, p[1] + sy]))), [0, 0, 20], 0, X.shA);
  }

  function blk(u0, v0, u1, v1, z0, z1, c, nosh) {
    if (!nosh) shadow(u0, v0, u1, v1, z1);
    const p01_0 = P(u0, v1, z0), p11_0 = P(u1, v1, z0), p10_0 = P(u1, v0, z0);
    const p00_1 = P(u0, v0, z1), p10_1 = P(u1, v0, z1), p11_1 = P(u1, v1, z1), p01_1 = P(u0, v1, z1);
    Q([p01_0, p11_0, p11_1, p01_1], c.l, jit, 0);
    Q([p11_0, p10_0, p10_1, p11_1], c.r, jit, 0);
    Q([p00_1, p10_1, p11_1, p01_1], c.t, jit, 0);
    if (mid) {
      // Contorno externo escuro seletivo (#10141d / sh(0.38)) + quina interna iluminada (VISUAL_IDENTITY.md Seção 1.2)
      const outCol = [22, 26, 34];
      LN(p01_0, p01_1, sh(c.l, 0.42));
      LN(p10_0, p10_1, outCol);
      LN(p01_0, p11_0, sh(c.l, 0.45));
      LN(p11_0, p10_0, outCol);
      LN(p11_0, p11_1, sh(c.r, 0.72));
      if (hi) {
        LN(p01_1, p11_1, sh(c.t, 1.15));
        LN(p11_1, p10_1, sh(c.t, 1.06));
      }
    }
  }

  const B = (u0, v0, u1, v1) => ({ u0, v0, u1, v1 });
  const FP = (b, f, s, z) => (f === 'L' ? P(b.u0 + (b.u1 - b.u0) * s, b.v1, z) : P(b.u1, b.v1 + (b.v0 - b.v1) * s, z));
  const fq = (b, f, s0, s1, z0, z1, c, j, a) => Q([FP(b, f, s0, z0), FP(b, f, s1, z0), FP(b, f, s1, z1), FP(b, f, s0, z1)], c, j, a);
  const fw = (b, f) => (f === 'L' ? (b.u1 - b.u0) : (b.v1 - b.v0)) * hw;

  function wins(b, f, cols, rows, z0, z1, m, ab, tint) {
    if (!mid) return;
    const wpx = fw(b, f) * (1 - 2 * m) / cols; if (wpx < 2.2) return;
    const sw = (1 - 2 * m) / cols, fh = (z1 - z0) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const s0 = m + c * sw + sw * 0.18, s1 = m + (c + 1) * sw - sw * 0.18, a = z0 + r * fh + fh * 0.2, bz = z0 + (r + 1) * fh - fh * 0.2;
      const lit = !ab && hash2(c * 7 + r, (X.cx | 0) + (f === 'L' ? 1 : 2), r + 3) < 62;
      // Profundidade de janela com batente branco de 1px (#ffffff) e vidro escuro profundo (#2b241f / #1a2634) - Print 4
      if (hi && !ab) {
        const frameCol = f === 'L' ? [248, 246, 240] : [205, 204, 198];
        fq(b, f, s0 - sw * 0.04, s1 + sw * 0.02, a - fh * 0.06, bz + fh * 0.03, frameCol, 0, 0);
      }
      const dayc = tint ? sh(tint, 0.55) : (f === 'L' ? [38, 48, 62] : [26, 34, 46]);
      const col = night > 0.3 ? (lit ? [254, 240, 138] : [22, 28, 38]) : (ab ? [36, 30, 28] : dayc);
      fq(b, f, s0 + (hi ? sw * 0.03 : 0), s1, a, bz, col, 0, 0);
      if (night > 0.3 && lit) X.emQ([FP(b, f, s0, a), FP(b, f, s1, a), FP(b, f, s1, bz), FP(b, f, s0, bz)].reduce((q, p) => q.concat(p), []), [254, 240, 138]);
    }
  }

  function door(b, f, s0, s1, h, c, ab) {
    if (hi) fq(b, f, s0 - 0.03, s1 + 0.03, 0, h + 0.8, [238, 234, 226], 0, 0);
    fq(b, f, s0, s1, 0, h, ab ? [32, 26, 24] : [36, 28, 24], 0, 0);
  }

  function awning(b, f, s0, s1, z, d, c1, c2) {
    const n = Math.max(2, Math.min(5, Math.round((s1 - s0) * 5)));
    const edgeCol = [32, 24, 22];
    for (let i = 0; i < n; i++) {
      const a = s0 + (s1 - s0) * i / n, e = s0 + (s1 - s0) * (i + 1) / n, col = i & 1 ? c1 : c2; let q;
      if (f === 'L') {
        const u0 = b.u0 + (b.u1 - b.u0) * a, u1 = b.u0 + (b.u1 - b.u0) * e;
        const pA = P(u0, b.v1, z), pB = P(u1, b.v1, z), pC = P(u1, b.v1 + d, z - 3), pD = P(u0, b.v1 + d, z - 3);
        q = [pA, pB, pC, pD];
        Q(q, col, 0, 0);
        LN(pD, pC, edgeCol);
      } else {
        const v0 = b.v1 + (b.v0 - b.v1) * a, v1 = b.v1 + (b.v0 - b.v1) * e;
        const pA = P(b.u1, v0, z), pB = P(b.u1, v1, z), pC = P(b.u1 + d, v1, z - 3), pD = P(b.u1 + d, v0, z - 3);
        q = [pA, pB, pC, pD];
        Q(q, col, 0, 0);
        LN(pD, pC, edgeCol);
      }
    }
  }

  function gable(b, z, rh, c, alongU, wallCol) {
    const um = (b.u0 + b.u1) / 2, vm = (b.v0 + b.v1) / 2, e = 0.045;
    const roofJit = mid ? -1 : 0; // Telhas em padrão xadrez (px + py) % 2
    if (alongU !== false) {
      // Oitão triangular na face direita (R) + janela do sótão
      const gCol = wallCol ? sh(wallCol, 0.72) : sh(c, 0.66);
      Q([P(b.u1, b.v0, z), P(b.u1, b.v1, z), P(b.u1, vm, z + rh)], gCol, jit, 0);
      if (hi && rh >= 4.5) {
        const aw0 = P(b.u1, vm - 0.06, z + rh * 0.25), aw1 = P(b.u1, vm + 0.06, z + rh * 0.25), aw2 = P(b.u1, vm + 0.06, z + rh * 0.58), aw3 = P(b.u1, vm - 0.06, z + rh * 0.58);
        Q([aw0, aw1, aw2, aw3], [36, 30, 28], 0, 0);
        LN(aw0, aw1, [235, 232, 224]);
      }
      // Água frontal iluminada com telhas em xadrez
      Q([P(b.u0 - e, b.v1 + e, z), P(b.u1 + e, b.v1 + e, z), P(b.u1 + e, vm, z + rh), P(b.u0 - e, vm, z + rh)], c, roofJit, 0);
      // Borda da telha no oitão e cumeeira
      LN(P(b.u1 + e, b.v1 + e, z), P(b.u1 + e, vm, z + rh), sh(c, 0.45));
      LN(P(b.u1 + e, vm, z + rh), P(b.u1 + e, b.v0 - e, z), sh(c, 0.45));
      LN(P(b.u0 - e, b.v1 + e, z), P(b.u1 + e, b.v1 + e, z), sh(c, 0.48));
      LN(P(b.u0, vm, z + rh), P(b.u1, vm, z + rh), sh(c, 1.25));
    } else {
      // Oitão triangular na face esquerda (L) + janela do sótão
      const gCol = wallCol ? wallCol : sh(c, 0.94);
      Q([P(b.u0, b.v1, z), P(b.u1, b.v1, z), P(um, b.v1, z + rh)], gCol, jit, 0);
      if (hi && rh >= 4.5) {
        const aw0 = P(um - 0.06, b.v1, z + rh * 0.25), aw1 = P(um + 0.06, b.v1, z + rh * 0.25), aw2 = P(um + 0.06, b.v1, z + rh * 0.58), aw3 = P(um - 0.06, b.v1, z + rh * 0.58);
        Q([aw0, aw1, aw2, aw3], [36, 30, 28], 0, 0);
        LN(aw0, aw3, [248, 246, 240]);
      }
      // Água lateral com telhas em xadrez
      Q([P(b.u1 + e, b.v0 - e, z), P(b.u1 + e, b.v1 + e, z), P(um, b.v1 + e, z + rh), P(um, b.v0 - e, z + rh)], sh(c, 0.78), roofJit, 0);
      LN(P(b.u0 - e, b.v1 + e, z), P(um, b.v1 + e, z + rh), sh(c, 1.2));
      LN(P(um, b.v1 + e, z + rh), P(b.u1 + e, b.v1 + e, z), sh(c, 0.45));
      LN(P(um, b.v0, z + rh), P(um, b.v1, z + rh), sh(c, 1.2));
    }
  }

  function hip(b, z, rh, c) {
    const um = (b.u0 + b.u1) / 2, vm = (b.v0 + b.v1) / 2, e = 0.04;
    const roofJit = mid ? -1 : 0;
    Q([P(b.u0 - e, b.v1 + e, z), P(b.u1 + e, b.v1 + e, z), P(um, vm, z + rh)], c, roofJit, 0);
    Q([P(b.u1 + e, b.v1 + e, z), P(b.u1 + e, b.v0 - e, z), P(um, vm, z + rh)], sh(c, 0.72), roofJit, 0);
    LN(P(b.u0 - e, b.v1 + e, z), P(b.u1 + e, b.v1 + e, z), sh(c, 0.45));
    LN(P(b.u1 + e, b.v1 + e, z), P(b.u1 + e, b.v0 - e, z), sh(c, 0.4));
    LN(P(b.u1 + e, b.v1 + e, z), P(um, vm, z + rh), sh(c, 1.18));
  }

  function flatRoof(b, z, c, par) {
    if (!hi || !par) return;
    const p = 0.03, h = 1.2, cc = sh(c, 1.1);
    blk(b.u0, b.v1 - p, b.u1, b.v1, z, z + h, mat(cc), true);
    blk(b.u1 - p, b.v0, b.u1, b.v1, z, z + h, mat(cc), true);
  }

  function cyl(u, v, r, z0, z1, c, seg, stripe) {
    const ax = r * hw * 1.4142, ay = r * hh * 1.4142, c0 = P(u, v, z0), c1 = P(u, v, z1), n = seg || (hi ? 12 : 6);
    for (let i = 0; i < n; i++) {
      const t0 = -1 + 2 * i / n, t1 = -1 + 2 * (i + 1) / n, x0 = c0[0] + t0 * ax, x1 = c0[0] + t1 * ax, f0 = Math.sqrt(1 - t0 * t0) * ay, f1 = Math.sqrt(1 - t1 * t1) * ay, tm = (t0 + t1) / 2;
      let col = sh(c, 1.22 - 0.62 * (tm + 1) / 2); if (stripe) { const k = Math.floor(i / n * 2); }
      Q([[x0, c1[1] + f0], [x1, c1[1] + f1], [x1, c0[1] + f1], [x0, c0[1] + f0]], col, 0, 0);
    }
    const pts = []; for (let a = 0; a < 18; a++) { const th = a / 18 * 6.2832; pts.push([c1[0] + Math.cos(th) * ax, c1[1] + Math.sin(th) * ay]); } Q(pts, sh(c, 1.3), 0, 0);
  }

  function cone(u, v, r, z, h, c) {
    const ax = r * hw * 1.4142, ay = r * hh * 1.4142, c0 = P(u, v, z), ap = P(u, v, z + h), pts = [[c0[0] - ax, c0[1]]];
    for (let a = 0; a <= 8; a++) { const th = Math.PI * a / 8; pts.push([c0[0] - ax * Math.cos(th), c0[1] + Math.sin(th) * ay]); }
    pts.push([ap[0], ap[1]]); Q(pts, c, 0, 0); Q([[c0[0], c0[1] + ay], [c0[0] + ax, c0[1]], [ap[0], ap[1]]], sh(c, 0.7), 0, 0);
  }

  function disk(u, v, r, z, c, a) {
    const ax = r * hw * 1.4142, ay = r * hh * 1.4142, c0 = P(u, v, z), pts = [];
    for (let k = 0; k < 16; k++) { const th = k / 16 * 6.2832; pts.push([c0[0] + Math.cos(th) * ax, c0[1] + Math.sin(th) * ay]); }
    Q(pts, c, 0, a || 0);
  }

  function txt(b, f, s0, z, str, col, glowCol) {
    if (!hi) return;
    const ps = Math.max(1, Math.round(hw / 28)), pitch = 4 * ps, w = str.length * pitch; if (w > fw(b, f) * 0.92) return;
    const o = FP(b, f, s0, z), sl = f === 'L' ? 0.5 : -0.5;
    for (let k = 0; k < str.length; k++) {
      const g = FONT[str[k]]; if (!g) continue;
      const bx = o[0] + k * pitch, by = o[1] + k * pitch * sl;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r * 3 + c] === '1') {
        for (let a = 0; a < ps; a++) for (let d = 0; d < ps; d++) {
          const x = bx + c * ps + a, y = by + r * ps + d;
          X.pt(x, y, col);
          if (glowCol && night > 0.3) X.emP(x, y, glowCol, 0);
        }
      }
    }
  }

  function lampPost(u, v, h) {
    if (!hi) return;
    const a = P(u, v, 0), b = P(u, v, h); LN(a, b, [60, 62, 70]);
    if (night > 0.3) { X.emP(b[0], b[1] - 1, [255, 226, 150], 1); } else PT(b, [240, 240, 200]);
  }

  function fence(u0, v0, u1, v1, c) {
    if (!mid) return;
    const a = P(u0, v0, 2), b = P(u1, v1, 2); LN(a, b, c || [236, 232, 220]);
    if (hi) {
      const n = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
      for (let i = 0; i <= n; i++) {
        const p = [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n];
        LN([p[0], p[1]], [p[0], p[1] + 2 * U], c || [236, 232, 220]);
      }
    }
  }

  function person(u, v, col, ph) {
    if (!hi) return;
    const p = P(u + Math.sin(ph) * 0.06, v + Math.cos(ph * 0.8) * 0.05, 0);
    PT([p[0], p[1]], [40, 36, 40]); PT([p[0], p[1] - 1], col); PT([p[0], p[1] - 2], [238, 200, 168]);
    if (vhi) { PT([p[0] + 1, p[1] - 1], col); PT([p[0] + 1, p[1]], [40, 36, 40]); }
  }

  function smoke(u, v, z, n, col) {
    if (!mid) return;
    const p = P(u, v, z);
    for (let i = 0; i < n; i++) {
      const t = ((A * 0.3 + i * 1.7 + (X.cx | 0) * 0.13) % 4) / 4;
      X.pt(p[0] + Math.sin(A * 0.5 + i * 2) * (1 + t * 2) + t * 2, p[1] - t * (6 + 5 * U), mix(col || [210, 214, 220], [120, 124, 130], t));
      if (vhi) X.pt(p[0] + Math.sin(A * 0.5 + i * 2) * (1 + t * 2) + t * 2 + 1, p[1] - t * (6 + 5 * U), mix(col || [210, 214, 220], [120, 124, 130], t));
    }
  }

  function minicar(u, v, along, c, flash) {
    const L = along === 'u' ? [0.12, 0.06] : [0.06, 0.12], h = 3.2;
    blk(u - L[0], v - L[1], u + L[0], v + L[1], 0, h, mat(c), true);
    if (hi) blk(u - L[0] * 0.5, v - L[1] * 0.5, u + L[0] * 0.5, v + L[1] * 0.5, h, h + 2, mat([60, 80, 110]), true);
    if (flash) {
      const p = P(u, v, h + 2.5);
      PT(p, A % 2 ? [255, 40, 40] : [60, 80, 255]);
      X.emP(p[0], p[1], A % 2 ? [255, 60, 60] : [70, 90, 255], 1);
    }
  }

  function sign(b, f, s, z, w, h, c, label, lc) {
    fq(b, f, s, s + w, z, z + h, c, 0, 0);
    if (label) txt(b, f, s + 0.04, z + h - 1, label, lc || [255, 255, 255], lc);
  }

  function tree(u, v, h, c1, kind, sway) {
    const base = P(u, v, 0), top = P(u, v, h * 0.78);
    const sx = Math.sin(A * 0.35 + u * 9 + v * 7) * (sway || 0) * 0.45;
    const r = Math.max(2.5, Math.round(h * U * 0.34));
    const bx = Math.round(base[0]), by = Math.round(base[1]);

    // Sombra projetada no solo na base do tronco (#172b0b)
    const shR = Math.max(2, Math.round(r * 0.65));
    Q([
      [bx - shR * 0.5, by],
      [bx + shR * 1.2, by - shR * 0.35],
      [bx + shR * 1.4, by + shR * 0.35],
      [bx - shR * 0.2, by + shR * 0.55]
    ], [23, 43, 11], 0, 0);

    // Tronco Pixel Art (2x4 px proporcionais): Coluna esquerda iluminada (#cbb18b / #8c6239), direita em sombra (#4a341e)
    const cyCanopy = Math.round(top[1] + r * 0.25);
    const cxCanopy = Math.round(top[0] + sx);
    const trunkLeft = kind === 1 ? [203, 177, 139] : [140, 98, 57];
    const trunkRight = [74, 52, 30];
    LN([bx, by], [cxCanopy, cyCanopy + Math.round(r * 0.35)], trunkLeft);
    LN([bx + 1, by], [cxCanopy + 1, cyCanopy + Math.round(r * 0.35)], trunkRight);
    if (vhi) LN([bx - 1, by], [cxCanopy - 1, cyCanopy + Math.round(r * 0.35)], trunkLeft);

    // Paleta de 4 quadrantes por árvore (Seção 1.2 - Clusters de Folhagem Empilhados)
    const isLightSp = c1 && c1[0] > 90;
    const colHighlight = isLightSp ? [124, 179, 66] : [111, 163, 56]; // #7cb342 / #6fa338
    const colMid       = isLightSp ? [73, 120, 36]  : [51, 105, 30];  // #497824 / #33691e
    const colShadow    = [43, 76, 22];                                // #2b4c16
    const colRim       = [23, 43, 11];                                // #172b0b

    // Geração determinística de 20 micro-blocos (clusters 2x2 / 3x2 px) dentro da elipse da copa
    const seedTree = (((u * 100) | 0) * 73 ^ ((v * 100) | 0) * 151 ^ (h | 0) * 31) & 255;
    const rx = Math.max(2, Math.round(r * (kind === 0 ? 0.92 : 1.15)));
    const ry = Math.max(2, Math.round(r * (kind === 0 ? 1.25 : 0.98)));
    const nClusters = hi ? 24 : mid ? 16 : 9;
    const clSz = Math.max(1, Math.round(U * 0.85));

    // Passada 1: Sombra profunda de borda inferior-direita (Rim Shadow)
    for (let k = 0; k < nClusters; k++) {
      const ang = (k * 2.39996) + (seedTree & 7) * 0.4; // Ângulo áureo para distribuição orgânica uniforme
      const rad = Math.sqrt((k + 0.5) / nClusters);
      const dx = Math.round(Math.cos(ang) * rx * rad);
      const dy = Math.round(Math.sin(ang) * ry * rad);
      let col;
      if (dx + dy > (rx + ry) * 0.24) col = colRim;
      else if (dx + dy > -0.05 * (rx + ry)) col = colShadow;
      else if (dx < 0 && dy < 0) col = colHighlight;
      else col = colMid;

      const px = cxCanopy + dx, py = cyCanopy + dy;
      if (clSz <= 1) {
        PT([px, py], col);
        PT([px + 1, py], col);
        PT([px, py + 1], col === colHighlight ? colMid : col);
        PT([px + 1, py + 1], col === colHighlight ? colMid : colRim);
      } else {
        Q([
          [px - clSz, py - clSz * 0.8],
          [px + clSz, py - clSz * 0.8],
          [px + clSz, py + clSz * 0.8],
          [px - clSz, py + clSz * 0.8]
        ], col, 0, 0);
      }
    }
  }

  return {
    X, sz, hw, hh, U, hi, vhi, mid, A, night, cy0, jit,
    P, Q, LN, PT, hull, shadow, blk, B, FP, fq, fw,
    wins, door, awning, gable, hip, flatRoof, cyl, cone, disk,
    txt, lampPost, fence, person, smoke, minicar, sign, tree
  };
}
