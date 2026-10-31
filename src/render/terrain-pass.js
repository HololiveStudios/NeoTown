import { BIO, K } from '../core/constants.js';
import { clamp, hash2 } from '../core/math/util.js';
import { Vector } from '../core/math/vector.js';
import { make } from './buildings/registry.js';
import { sh, mix, fillPoly, put, line } from './raster/pixel.js';
import { terrainTex, terrTri } from './raster/terrain-texture.js';
import { getChunkCache } from './raster/caches.js';
import { road } from './roads.js';

export function renderTerrainPass(ctx) {
  const { g, fb32, W, H, hw, hh, U, elevPx, ox, oy, X, sunVec, showPipe, nightOn, emb8, em, bio, hi, mid } = ctx;
  const N = g.N, N1 = N + 1;

  const ground = (Tc, X, poly, vis, A, night, x0, x1, y0, y1, GB) => {
    const TT = terrainTex(g.seed), FINE = Math.max(1.5, hw * 0.55), cm = new Map(), SX = sunVec.x, SY = sunVec.y, SZ = sunVec.z;
    const GRA = [77, 124, 62], GRB = [99, 153, 78], DRY = [124, 184, 98], SAND = [201, 172, 121], WET = [140, 115, 75];
    const tnz = (px, py) => {
      const x0_ = Math.floor(px), y0_ = Math.floor(py), fx = px - x0_, fy = py - y0_, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), xa = x0_ & 255, xb = (x0_ + 1) & 255, ra = (y0_ & 255) << 8, rb = ((y0_ + 1) & 255) << 8;
      return ((TT[ra + xa] * (1 - sx) + TT[ra + xb] * sx) * (1 - sy) + (TT[rb + xa] * (1 - sx) + TT[rb + xb] * sx) * sy) / 255;
    };
    const isCoastT = (tx, ty) => {
      if (bio(tx, ty) === BIO.WATER) return false;
      return bio(tx + 1, ty) === 0 || bio(tx - 1, ty) === 0 || bio(tx, ty + 1) === 0 || bio(tx, ty - 1) === 0 ||
             bio(tx + 2, ty) === 0 || bio(tx - 2, ty) === 0 || bio(tx, ty + 2) === 0 || bio(tx, ty - 2) === 0;
    };
    const landBase = (tx, ty, bb, ch, cx, cy) => {
      const tint = tnz(cx * 0.3 + 3, cy * 0.3 + 9);
      if (bb === BIO.FOREST) return mix([38, 75, 42], [55, 105, 58], tint).concat(0.035);
      if (isCoastT(tx, ty)) {
        const nearWat = bio(tx + 1, ty) === 0 || bio(tx - 1, ty) === 0 || bio(tx, ty + 1) === 0 || bio(tx, ty - 1) === 0;
        return nearWat ? mix(SAND, [222, 199, 151], tint).concat(0.02) : mix(GRA, SAND, 0.45 + tint * 0.25).concat(0.03);
      }
      const gr = tint < 0.5 ? mix(GRA, GRB, tint * 2) : mix(GRB, DRY, (tint - 0.5) * 1.1);
      return mix(gr, [110, 168, 78], clamp((ch - 1) * 0.05, 0, 0.25)).concat(0.04);
    };
    const hAt = (cx, cy) => g.cornerH[clamp(cy, 0, N) * N1 + clamp(cx, 0, N)];
    const cinfo = (cx, cy) => {
      const key = cy * N1 + cx; let o = cm.get(key); if (o) return o;
      const ch = hAt(cx, cy); let r = 0, gg = 0, bl = 0, ro = 0, n = 0, wat = 0;
      for (let q = 0; q < 4; q++) {
        const tx = cx - (q & 1), ty = cy - (q >> 1); if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
        const bb = g.bio[ty * N + tx]; if (bb === BIO.WATER) { wat++; continue; }
        const c = landBase(tx, ty, bb, ch, cx, cy); r += c[0]; gg += c[1]; bl += c[2]; ro += c[3]; n++;
      }
      let col;
      if (!n) { col = SAND; } else { col = [r / n, gg / n, bl / n]; if (wat) col = mix(col, WET, 0.18 + 0.1 * wat); }
      const a = (hAt(cx + 1, cy) - hAt(cx - 1, cy)) * 0.5 * 0.45, b2 = (hAt(cx, cy + 1) - hAt(cx, cy - 1)) * 0.5 * 0.45, il = 1 / Math.sqrt(a * a + b2 * b2 + 1);
      const shade = clamp(0.75 + 0.42 * ((-a * SX - b2 * SY + SZ) * il), 0.72, 1.20);
      o = { c: [col[0] * shade, col[1] * shade, col[2] * shade], shade }; cm.set(key, o); return o;
    };
    const WSH = [69, 155, 194], WMID = [38, 95, 125], WDP = [22, 50, 74], wcm = new Map();
    const winfo = (cx, cy) => {
      const key = cy * N1 + cx; let o = wcm.get(key); if (o) return o;
      let dist = 4;
      for (let dy = -3; dy <= 2; dy++) for (let dx = -3; dx <= 2; dx++) {
        const tx = cx + dx, ty = cy + dy; if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
        if (g.bio[ty * N + tx] !== BIO.WATER) { const d = Math.max(dx < 0 ? -dx - 1 : dx, dy < 0 ? -dy - 1 : dy); if (d < dist) dist = d; }
      }
      const dep = clamp((34 - g.elevF[key]) / 26, 0, 1), t = clamp(dist / 4, 0, 1) * 0.8 + dep * 0.2;
      const shore = clamp(1 - dist / 2.2, 0, 1);
      o = { c: t < 0.5 ? mix(WSH, WMID, t * 2) : mix(WMID, WDP, (t - 0.5) * 2), shade: 1.0 - t * 0.18, shore }; wcm.set(key, o); return o;
    };
    const waterTile = (x, y, p0, p1, p2, p3) => {
      const c0 = winfo(x, y), c1 = winfo(x + 1, y), c2 = winfo(x + 1, y + 1), c3 = winfo(x, y + 1);
      const V = (p, c) => [p[0], p[1], c.c[0], c.c[1], c.c[2], c.shade, c.shore, 0];
      const v0 = V(p0, c0), v1 = V(p1, c1), v2 = V(p2, c2), v3 = V(p3, c3);
      terrTri(GB.u32, GB.w, GB.h, v0, v1, v2, TT, FINE); terrTri(GB.u32, GB.w, GB.h, v0, v2, v3, TT, FINE);
      return c0.c;
    };
    const landTile = (x, y, p0, p1, p2, p3, h0, h1, h2, h3) => {
      const c0 = cinfo(x, y), c1 = cinfo(x + 1, y), c2 = cinfo(x + 1, y + 1), c3 = cinfo(x, y + 1);
      const bb = g.bio[y * N + x];
      const nearWat = bio(x + 1, y) === 0 || bio(x - 1, y) === 0 || bio(x, y + 1) === 0 || bio(x, y - 1) === 0 ||
                      bio(x + 1, y + 1) === 0 || bio(x - 1, y - 1) === 0 || bio(x + 1, y - 1) === 0 || bio(x - 1, y + 1) === 0;
      const hMax = Math.max(h0, h1, h2, h3);
      // Sem rocha cinza: matId 1=grama/colina verdejante, 2=floresta, 3=areia litorânea
      const matId = (nearWat && hMax <= 2) ? 3 : (bb === BIO.FOREST ? 2 : 1);
      const V = (p, c, wx) => [p[0], p[1], c.c[0], c.c[1], c.c[2], c.shade, wx, matId];
      const v0 = V(p0, c0, x), v1 = V(p1, c1, x + 1), v2 = V(p2, c2, x + 1), v3 = V(p3, c3, x);
      if (Math.abs(h0 - h2) <= Math.abs(h1 - h3)) { terrTri(GB.u32, GB.w, GB.h, v0, v1, v2, TT, FINE); terrTri(GB.u32, GB.w, GB.h, v0, v2, v3, TT, FINE); }
      else { terrTri(GB.u32, GB.w, GB.h, v0, v1, v3, TT, FINE); terrTri(GB.u32, GB.w, GB.h, v1, v2, v3, TT, FINE); }
      return [(c0.c[0] + c1.c[0] + c2.c[0] + c3.c[0]) / 4, (c0.c[1] + c1.c[1] + c2.c[1] + c3.c[1]) / 4, (c0.c[2] + c1.c[2] + c2.c[2] + c3.c[2]) / 4];
    };
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * N + x, i0 = y * N1 + x;
      const h0 = g.cornerH[i0], h1 = g.cornerH[i0 + 1], h2 = g.cornerH[i0 + N1 + 1], h3 = g.cornerH[i0 + N1];
      const p0 = Tc(x, y, h0), p1 = Tc(x + 1, y, h1), p2 = Tc(x + 1, y + 1, h2), p3 = Tc(x, y + 1, h3);
      const tx = p0[0], ty = p0[1]; if (!vis(tx, ty + hh, 1)) continue;
      const b = g.bio[i], k = g.kind[i], hv = hash2(x, y, g.seed);
      const dm = [p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]];

      const nVec = new Vector(1, 0, (h1 - h0) * 0.45).cross(new Vector(0, 1, (h3 - h0) * 0.45)).normalized();
      const shade = clamp(0.68 + 0.46 * nVec.dot(sunVec), 0.72, 1.22);

      let c, jit = hi ? 2 : 1;
      if (b === BIO.WATER) {
        c = waterTile(x, y, p0, p1, p2, p3);
      } else if (k === K.ROAD) {
        c = sh([72, 72, 74], shade);
        poly(dm, c, jit, 0);
      } else c = landTile(x, y, p0, p1, p2, p3, h0, h1, h2, h3);

      if (b !== BIO.WATER && (h1 > 0 || h2 > 0 || h3 > 0)) {
        const nhX = x + 1 < N ? g.cornerH[y * N1 + x + 2] : 0, nhY = y + 1 < N ? g.cornerH[(y + 2) * N1 + x] : 0;
        if (x === N - 1 || bio(x + 1, y) === BIO.WATER) {
          const b1 = Tc(x + 1, y, x === N - 1 || bio(x + 1, y) === BIO.WATER ? 0 : Math.min(h1, nhX));
          const b2 = Tc(x + 1, y + 1, x === N - 1 || bio(x + 1, y) === BIO.WATER ? 0 : Math.min(h2, nhX));
          poly([p1[0], p1[1], p2[0], p2[1], b2[0], b2[1], b1[0], b1[1]], [96, 76, 58], jit, 0);
          if (hi && (h1 >= 2 || h2 >= 2)) {
            const m1x = (p1[0] + b1[0]) * 0.5, m1y = (p1[1] + b1[1]) * 0.5;
            const m2x = (p2[0] + b2[0]) * 0.5, m2y = (p2[1] + b2[1]) * 0.5;
            X.ln(m1x, m1y, m2x, m2y, [64, 52, 42]);
          }
        }
        if (y === N - 1 || bio(x, y + 1) === BIO.WATER) {
          const b3 = Tc(x, y + 1, y === N - 1 || bio(x, y + 1) === BIO.WATER ? 0 : Math.min(h3, nhY));
          const b2 = Tc(x + 1, y + 1, y === N - 1 || bio(x, y + 1) === BIO.WATER ? 0 : Math.min(h2, nhY));
          poly([p3[0], p3[1], p2[0], p2[1], b2[0], b2[1], b3[0], b3[1]], [124, 100, 78], jit, 0);
          if (hi && (h3 >= 2 || h2 >= 2)) {
            const m3x = (p3[0] + b3[0]) * 0.5, m3y = (p3[1] + b3[1]) * 0.5;
            const m2x = (p2[0] + b2[0]) * 0.5, m2y = (p2[1] + b2[1]) * 0.5;
            X.ln(m3x, m3y, m2x, m2y, [86, 70, 56]);
          }
        }
      }

      if (b === BIO.WATER) {
        if (mid) for (let q = 0; q < 3; q++) {
          const ph = A * 0.35 + x * 1.7 + y * 2.3 + q * 2.1, wx = tx + Math.sin(ph) * hw * 0.55, wy = ty + hh + Math.cos(ph * 0.7) * hh * 0.45;
          X.ln(wx - 1 - U * 0.7, wy, wx + 1 + U * 0.7, wy, [236, 252, 255]);
          if (hi) { X.ln(wx - U * 0.4, wy + 1, wx + U * 0.4, wy + 1, [236, 252, 255]); }
        }
        const F = [255, 255, 255];
        if (mid) {
          if (bio(x, y - 1) && y > 0) { X.ln(p0[0], p0[1], p1[0], p1[1], F); if (hi) X.ln(p0[0], p0[1] + 1, p1[0] - 2, p1[1], [226, 246, 255]); }
          if (bio(x + 1, y) && x < N - 1) { X.ln(p1[0], p1[1], p2[0], p2[1], F); if (hi) X.ln(p1[0] - 2, p1[1], p2[0], p2[1] - 1, [226, 246, 255]); }
          if (bio(x, y + 1) && y < N - 1) { X.ln(p2[0], p2[1], p3[0], p3[1], F); if (hi) X.ln(p2[0], p2[1] - 1, p3[0] + 2, p3[1], [226, 246, 255]); }
          if (bio(x - 1, y) && x > 0) { X.ln(p3[0], p3[1], p0[0], p0[1], F); if (hi) X.ln(p3[0] + 2, p3[1], p0[0], p0[1] + 1, [226, 246, 255]); }
        }
      } else if (b === BIO.PLAIN && !k && mid && !isCoastT(x, y)) {
        const s = Math.max(1, Math.round(U * 0.75));
        for (let q = 0; q < 2; q++) {
          const a = hash2(x * 8 + q, y, 3) / 100, bb = hash2(x, y * 8 + q, 5) / 100, px = tx + (a - 0.5) * hw * 1.2, py = ty + hh + (bb - 0.5) * hh * 1.1;
          if (Math.abs(px - tx) / hw + Math.abs(py - ty - hh) / hh < 0.8) { const gc = [58, 150, 62]; X.ln(px, py, px - s, py - 2 * s, gc); X.ln(px, py, px, py - 3 * s, gc); X.ln(px, py, px + s, py - 2 * s, gc); }
        }
        if (hv > 68) {
          const px = tx + (hash2(x, y, 9) / 100 - 0.5) * hw, py = ty + hh + (hash2(y, x, 8) / 100 - 0.5) * hh * 0.8, fc = hv > 86 ? [255, 214, 64] : hv > 77 ? [255, 255, 255] : [255, 128, 170];
          X.ln(px, py + 1, px, py + 2 + s, [58, 150, 62]);
          for (const d of [[0, -1], [1, 0], [-1, 0], [0, 1]]) X.pt(px + d[0] * Math.max(1, s * 0.8), py + d[1] * Math.max(1, s * 0.8), fc);
          X.pt(px, py, [255, 230, 90]);
        }
      }
      const zc = k === K.RES ? [70, 210, 90] : k === K.COM ? [70, 130, 240] : k === K.IND ? [240, 200, 50] : null;
      if (zc) {
        poly(dm, zc, 0, g.built[i] ? 0.08 : 0.32);
        if (hw >= 6) {
          const gc = sh(zc, g.built[i] ? 0.9 : 0.75);
          X.ln(p3[0] + 1, p3[1], p0[0], p0[1] + 1, gc); X.ln(p0[0], p0[1] + 1, p1[0] - 1, p1[1], gc);
          X.ln(p1[0] - 1, p1[1], p2[0], p2[1] - 1, gc); X.ln(p2[0], p2[1] - 1, p3[0] + 1, p3[1], gc);
        }
        if (hi && !g.built[i]) for (let q = 0; q < 3; q++) X.pt(tx + (q - 1) * hw * 0.25, ty + hh, [255, 255, 255]);
      }
      if (k === K.ROAD) {
        const Ttile = (u, v) => {
          const fu = u - x, fv = v - y;
          const hz = (h0 * (1 - fu) + h1 * fu) * (1 - fv) + (h3 * (1 - fu) + h2 * fu) * fv;
          return Tc(u, v, hz);
        };
        road(g, x, y, Ttile, poly, X, hw, b === BIO.WATER, night, A, hi, mid);
      }
      if (showPipe && g.pipe[i]) {
        const m = Tc(x + 0.5, y + 0.5, (h0 + h1 + h2 + h3) * 0.25);
        poly([m[0], m[1] - 2, m[0] + 4, m[1], m[0], m[1] + 2, m[0] - 4, m[1]], [70, 160, 255], 0, 0.9);
      }
    }
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * N + x; if (g.kind[i]) continue;
      const b = g.bio[i]; if (b !== BIO.FOREST && b !== BIO.HILL) continue;
      const i0 = y * N1 + x, p0 = Tc(x, y, g.cornerH[i0]);
      X.cx = p0[0]; X.cy = p0[1] + hh;
      const kitc = make(X);
      if (b === BIO.FOREST) {
        const n = hi ? 7 : mid ? 4 : 2;
        for (let q = 0; q < n; q++) {
          const a = (hash2(x * 5 + q, y, g.seed) / 100 - 0.5) * 0.85, bb = (hash2(x, y * 5 + q, g.seed + 1) / 100 - 0.5) * 0.85, kind = (hash2(q, x + y, 2) / 100 * 3) | 0;
          kitc.tree(a, bb, 11 + (hash2(q, x, y) % 8), kind === 0 ? [44, 150, 84] : kind === 1 ? [66, 178, 78] : [112, 204, 80], kind === 0 ? 0 : 1, 1.5);
        }
      } else if (b === BIO.HILL && mid) {
        const hMax = Math.max(g.cornerH[i0], g.cornerH[i0 + 1], g.cornerH[i0 + N1 + 1], g.cornerH[i0 + N1]);
        if (hMax >= 5 && hash2(x, y, g.seed + 7) < 48) {
          const hA = (g.cornerH[i0] + g.cornerH[i0 + 1] + g.cornerH[i0 + N1 + 1] + g.cornerH[i0 + N1]) / 4;
          const rc = Tc(x + 0.5 + (hash2(x, y, 5) / 100 - 0.5) * 0.4, y + 0.5 + (hash2(y, x, 6) / 100 - 0.5) * 0.4, hA), rw = hw * (0.2 + hash2(x, y, 11) / 100 * 0.14), rh = rw * 0.62;
          const ell = (cx_, cy_, ax, ay) => { const o = []; for (let q = 0; q < 14; q++) { const th = q / 14 * 6.2832; o.push(cx_ + Math.cos(th) * ax, cy_ + Math.sin(th) * ay); } return o; };
          const snowy = hMax >= 7;
          X.poly(ell(rc[0], rc[1] + rh * 0.35, rw * 1.12, rh * 1.05), [58, 54, 66], 0, 0);
          X.poly(ell(rc[0], rc[1], rw, rh), snowy ? [226, 234, 246] : [168, 160, 150], 0, 0);
          X.poly(ell(rc[0] - rw * 0.2, rc[1] - rh * 0.25, rw * 0.55, rh * 0.5), snowy ? [255, 255, 255] : [214, 208, 198], 0, 0);
        } else if (hash2(x, y, g.seed + 3) < 35) kitc.tree(.05, .0, 11, [60, 166, 90], 0, 1);
      }
    }
  };

  const CS = 8, padY = elevPx * 10 + 8, F = getChunkCache(), cwn = Math.ceil(N / CS);
  const sigOf = (x0, x1, y0, y1) => {
    let h = hw * 131 + N * 7 + (showPipe ? 7 : 0) + g.seed + (g.terrainVer || 0) * 97;
    for (let y = Math.max(0, y0 - 1); y < Math.min(N, y1 + 1); y++) {
      for (let x = Math.max(0, x0 - 1); x < Math.min(N, x1 + 1); x++) {
        const i = y * N + x;
        h = (Math.imul(h, 31) + g.kind[i] * 5 + g.built[i] * 3 + g.bio[i] * 11 + g.slopeMask[i] * 17 + (showPipe ? g.pipe[i] : 0)) | 0;
      }
    }
    return h;
  };

  F.t++;
  for (let cy = 0; cy < cwn; cy++) for (let cx = 0; cx < cwn; cx++) {
    const x0 = cx * CS, x1 = Math.min(N, x0 + CS), y0 = cy * CS, y1 = Math.min(N, y0 + CS);
    const bx = (x0 - y1 + 1) * hw - hw, by = (x0 + y0) * hh - padY, cw = (x1 - 1 - y0 - (x0 - y1 + 1) + 2) * hw, ch = (x1 + y1 - 2 - x0 - y0) * hh + 2 * hh + padY + elevPx * 2, sx = ox + bx, sy = oy + by;
    if (sx > W || sx + cw < 0 || sy > H || sy + ch < 0) continue;
    const key = cy * cwn + cx, sig = sigOf(x0, x1, y0, y1);
    let c = F.m.get(key);
    if (!c || c.sig !== sig) {
      if (c) F.bytes -= c.ab.byteLength;
      const ab = new ArrayBuffer(cw * ch * 4), b8 = new Uint8ClampedArray(ab), emc = [];
      const Tc = (x, y, hz) => [(x - y) * hw - bx, (x + y) * hh - (hz || 0) * elevPx - by];
      const Xc = {
        hw, hh, sz: 1, A: 0, night: 0.5, cx: 0, cy: 0, sunX: X.sunX, sunY: X.sunY, shA: 0.2,
        poly: (q, cc, j, a) => fillPoly(b8, cw, ch, q, cc, j, a),
        ln: (a, b, c2, d, e) => line(b8, cw, ch, a, b, c2, d, e),
        pt: (x, y, cc) => put(b8, cw, ch, x, y, cc),
        emP: (x, y, cc, gl) => { emc.push({ x, y, c: cc, f: gl ? 1 : 0 }); },
        emQ: (q, cc) => { emc.push({ q, c: cc }); },
        setClip: () => {}
      };
      ground(Tc, Xc, Xc.poly, () => true, 0, 0.5, x0, x1, y0, y1, { u32: new Uint32Array(ab), w: cw, h: ch });
      const u = new Uint32Array(ab), sp = new Int16Array(ch * 3);
      for (let yy = 0; yy < ch; yy++) {
        const row = yy * cw; let s0 = cw, s1 = 0, holes = 0;
        for (let xx = 0; xx < cw; xx++) if (u[row + xx] >>> 24) { if (xx < s0) s0 = xx; s1 = xx + 1; }
        if (s0 < s1) {
          for (let xx = s0 + 1; xx < s1 - 1; xx++) if (!(u[row + xx] >>> 24) && (u[row + xx - 1] >>> 24) && (u[row + xx + 1] >>> 24)) u[row + xx] = u[row + xx - 1];
          for (let xx = s0; xx < s1; xx++) if (!(u[row + xx] >>> 24)) { holes = 1; break; }
        }
        sp[yy * 3] = s0; sp[yy * 3 + 1] = s1; sp[yy * 3 + 2] = s0 < s1 && !holes ? 1 : 0;
      }
      c = { sig, ab, w: cw, h: ch, em: emc, u, sp };
      F.m.set(key, c); F.bytes += ab.byteLength; F.baked++;
    }
    c.t = F.t;
    const u = c.u, sp = c.sp, xa0 = Math.max(0, -sx), xb0 = Math.min(cw, W - sx), ya0 = Math.max(0, -sy), yb0 = Math.min(ch, H - sy);
    for (let yy = ya0; yy < yb0; yy++) {
      const s0 = sp[yy * 3], s1 = sp[yy * 3 + 1]; if (s0 >= s1) continue;
      const xa = xa0 > s0 ? xa0 : s0, xb = xb0 < s1 ? xb0 : s1; if (xa >= xb) continue;
      const k = yy * cw, dst = (sy + yy) * W + sx;
      if (sp[yy * 3 + 2]) fb32.set(u.subarray(k + xa, k + xb), dst + xa);
      else { let d = dst + xa; for (let xx = xa; xx < xb; xx++, d++) { const v = u[k + xx]; if (v >>> 24) fb32[d] = v; } }
    }
    if (nightOn) for (const e of c.em) {
      if (e.f === 1) { em.push({ x: e.x + sx, y: e.y + sy, c: e.c, f: 1, lp: e.c[0] === 255 && e.c[1] === 226 && e.c[2] === 150 }); continue; }
      if (e.q) fillPoly(emb8, W, H, e.q.map((v, j) => v + (j & 1 ? sy : sx)), e.c, 0, 0);
      else put(emb8, W, H, e.x + sx, e.y + sy, e.c);
    }
  }
  while (F.bytes > 64 * 1048576) {
    let ok = null, ot = 1e12;
    F.m.forEach((v, k) => { if (v.t < F.t && v.t < ot) { ot = v.t; ok = k; } });
    if (ok === null) break;
    F.bytes -= F.m.get(ok).ab.byteLength; F.m.delete(ok);
  }
}
