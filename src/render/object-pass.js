import { BIO, K } from '../core/constants.js';
import { make } from './buildings/registry.js';
import { fillPoly, put, erasePoly, line, setEraseMode, fillShadowMask } from './raster/pixel.js';
import { getSpriteCache } from './raster/caches.js';
import { flames, protest } from './effects.js';
import { pole, roadFG, car } from './roads.js';

export function renderObjectPass(ctx) {
  const { g, fb32, W, H, hw, hh, elevPx, ox, oy, T, X, kit, poly, vis, vb, out, A, night, nightOn, emb32, em, hi } = ctx;
  const N = g.N, N1 = N + 1;

  const SP = getSpriteCache();
  SP.t++;
  const sunQ = Math.round(X.sunX * 8), hasSh = X.shA > 0.05;
  const buildSpans = (px, w, h) => {
    const sp = new Int16Array(h * 3);
    for (let yy = 0; yy < h; yy++) {
      const row = yy * w; let s0 = w, s1 = 0, contig = 1;
      for (let xx = 0; xx < w; xx++) if (px[row + xx]) { if (xx < s0) s0 = xx; s1 = xx + 1; }
      if (s0 < s1) { for (let xx = s0; xx < s1; xx++) if ((px[row + xx] >>> 24) !== 255) { contig = 0; break; } } else contig = 0;
      sp[yy * 3] = s0; sp[yy * 3 + 1] = s1; sp[yy * 3 + 2] = contig;
    }
    return sp;
  };

  const bakeSprite = (t) => {
    const sz = t.sz || 1, SWd = hw * 4 * sz, SHt = hw * (7 + sz * 3) + 8, sax = SWd >> 1, say = SHt - hw * sz - 4;
    const animates = t.k === K.PARK || t.k === K.IND || t.k === K.COAL || t.k === K.FIRE || t.k === K.POLICE || t.k === K.MEGA || t.k === K.LANDMARK || (t.k === K.COM && t.lv === 3);
    const phases = animates ? 4 : 1, bufs = [], ems = [], shd = [];
    const ebAb = new ArrayBuffer(SWd * SHt * 4), eb8 = new Uint8ClampedArray(ebAb), eb32 = new Uint32Array(ebAb); eb8._u32 = eb32;
    const eraseLn = (a, b, c2, d) => { setEraseMode(true); line(eb8, SWd, SHt, a, b, c2, d, [0, 0, 0]); setEraseMode(false); };
    for (let ph = 0; ph < phases; ph++) {
      const ab = new ArrayBuffer(SWd * SHt * 4), b8 = new Uint8ClampedArray(ab);
      const Xb = {
        hw, hh, sz, A: ph, night: 0.5, cx: sax, cy: say, sunX: X.sunX, sunY: X.sunY, shA: X.shA || 0.2,
        poly: (q, c, j, a) => {
          if (a && a === Xb.shA) { if (ph === 0) shd.push(q); }
          else { fillPoly(b8, SWd, SHt, q, c, j, a); if (ph === 0 && !a) erasePoly(eb32, SWd, SHt, q); }
        },
        ln: (a, b, c2, d, e) => { line(b8, SWd, SHt, a, b, c2, d, e); if (ph === 0) eraseLn(a, b, c2, d); },
        pt: (x, y, c) => { put(b8, SWd, SHt, x, y, c); if (ph === 0) { setEraseMode(true); put(eb8, SWd, SHt, x, y, c); setEraseMode(false); } },
        emP: (x, y, c, gl) => { if (ph !== 0) return; if (gl) ems.push({ x: x - sax, y: y - say, c, f: 1 }); else put(eb8, SWd, SHt, x, y, c); },
        emQ: (q, c) => { if (ph === 0) fillPoly(eb8, SWd, SHt, q, c, 0, 0); },
        setClip: () => {}
      };
      make(Xb).drawAt(Object.assign({}, t, { cx: sax, cy: say }));
      bufs.push(new Uint32Array(ab));
    }
    let ex = null, ex0 = SWd, ex1 = -1, ey0 = SHt, ey1 = -1;
    for (let i = 0; i < SWd * SHt; i++) if (eb32[i]) { const x = i % SWd, y = (i / SWd) | 0; if (x < ex0) ex0 = x; if (x > ex1) ex1 = x; if (y < ey0) ey0 = y; if (y > ey1) ey1 = y; }
    if (ex1 >= 0) {
      const w = ex1 - ex0 + 1, h = ey1 - ey0 + 1, px = new Uint32Array(w * h);
      for (let yy = 0; yy < h; yy++) px.set(eb32.subarray((ey0 + yy) * SWd + ex0, (ey0 + yy) * SWd + ex0 + w), yy * w);
      ex = { px, w, h, ox: ex0 - sax, oy: ey0 - say };
    }
    const exBytes = ex ? ex.px.byteLength : 0;
    const n = SWd * SHt, u = bufs[0], dif = [];
    if (phases === 4) for (let i = 0; i < n; i++) if (u[i] !== bufs[1][i] || u[i] !== bufs[2][i] || u[i] !== bufs[3][i]) { if (dif.length < 1600) dif.push(i); }
    const dv = dif.map(i => [i, bufs[0][i], bufs[1][i], bufs[2][i], bufs[3][i]]);
    dif.forEach(i => { u[i] = 0; });
    shd.forEach(q => fillShadowMask(u, SWd, SHt, q));
    let x0 = SWd, x1 = -1, y0 = SHt, y1 = -1;
    const mk = (i) => { const x = i % SWd, y = (i / SWd) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    for (let i = 0; i < n; i++) if (u[i]) mk(i);
    dif.forEach(mk);
    if (x1 < 0) return { px: new Uint32Array(0), sp: new Int16Array(0), w: 0, h: 0, ox: 0, oy: 0, df: [], em: ems, ex: ex, bytes: exBytes };
    const w = x1 - x0 + 1, h = y1 - y0 + 1, px = new Uint32Array(w * h);
    for (let yy = 0; yy < h; yy++) px.set(u.subarray((y0 + yy) * SWd + x0, (y0 + yy) * SWd + x0 + w), yy * w);
    return { px, sp: buildSpans(px, w, h), w, h, ox: x0 - sax, oy: y0 - say, df: dv.map(d => ({ x: d[0] % SWd - x0, y: ((d[0] / SWd) | 0) - y0, v: d.slice(1) })), em: ems, ex: ex, bytes: px.byteLength + exBytes };
  };

  const blitSprite = (s, cx, cy) => {
    const dx = cx + s.ox, dy = cy + s.oy, xa0 = Math.max(0, -dx), xb0 = Math.min(s.w, W - dx), ya0 = Math.max(0, -dy), yb0 = Math.min(s.h, H - dy), px = s.px, sp = s.sp;
    for (let yy = ya0; yy < yb0; yy++) {
      const s0 = sp[yy * 3], s1 = sp[yy * 3 + 1]; if (s0 >= s1) continue;
      const xa = xa0 > s0 ? xa0 : s0, xb = xb0 < s1 ? xb0 : s1; if (xa >= xb) continue;
      const k = yy * s.w, dst = (dy + yy) * W + dx;
      if (sp[yy * 3 + 2]) fb32.set(px.subarray(k + xa, k + xb), dst + xa);
      else {
        let d = dst + xa;
        for (let xx = xa; xx < xb; xx++, d++) {
          const v = px[k + xx];
          if (v >>> 24 === 255) fb32[d] = v;
          else if (v && hasSh) fb32[d] = 0xff000000 | (((fb32[d] & 0xfcfcfc) * 3) >> 2);
        }
      }
    }
  };

  const drawB = (t) => {
    if (t.cons || t.riot) { X.sz = t.sz || 1; make(X).drawAt(t); X.sz = 1; return; }
    const key = [t.k, t.lv, t.vr, t.ab, t.cls, t.out ? 1 : 0, t.open ? 1 : 0, t.alarm ? 1 : 0, hw, sunQ, t.sz || 1].join('|');
    let s = SP.m.get(key);
    if (!s) { s = bakeSprite(t); SP.m.set(key, s); SP.bytes += s.bytes; SP.baked++; }
    s.t = SP.t;
    if (s.live) { X.sz = t.sz || 1; make(X).drawAt(t); X.sz = 1; return; }
    blitSprite(s, t.cx, t.cy);
    const dx = t.cx + s.ox, dy = t.cy + s.oy, ph = A & 3;
    for (const d of s.df) { const x = dx + d.x, y = dy + d.y, v = d.v[ph]; if (x >= 0 && y >= 0 && x < W && y < H && (v >>> 24)) fb32[y * W + x] = v; }
    if (nightOn) {
      const ox_ = t.cx + s.ox, oy_ = t.cy + s.oy, spx = s.px, ssp = s.sp;
      for (let yy = Math.max(0, -oy_); yy < Math.min(s.h, H - oy_); yy++) {
        const s0 = ssp[yy * 3], s1 = ssp[yy * 3 + 1]; if (s0 >= s1) continue;
        const k = yy * s.w, dst = (oy_ + yy) * W + ox_;
        for (let xx = Math.max(s0, -ox_); xx < Math.min(s1, W - ox_); xx++) if (spx[k + xx] >>> 24 === 255) emb32[dst + xx] = 0;
      }
      if (s.ex) {
        const e = s.ex, ex_ = t.cx + e.ox, ey_ = t.cy + e.oy;
        for (let yy = Math.max(0, -ey_); yy < Math.min(e.h, H - ey_); yy++) {
          for (let xx = Math.max(0, -ex_); xx < Math.min(e.w, W - ex_); xx++) {
            const v = e.px[yy * e.w + xx]; if (v) emb32[(ey_ + yy) * W + ex_ + xx] = v;
          }
        }
      }
    }
    if (night > 0.2) for (const e of s.em) { if (night <= 0.25 && e.f !== 1) continue; em.push({ x: e.x + t.cx, y: e.y + t.cy, c: e.c, f: e.f, lp: true }); }
  };

  while (SP.bytes > 48 * 1048576) {
    let ok = null, ot = 1e12;
    SP.m.forEach((v, k) => { if (v.t < SP.t && v.t < ot) { ot = v.t; ok = k; } });
    if (ok === null) break;
    SP.bytes -= SP.m.get(ok).bytes; SP.m.delete(ok);
  }

  const cornerH = g.cornerH;
  for (let s = 0; s <= 2 * N - 2; s++) for (let x = 0; x < N; x++) {
    const y = s - x; if (y < 0 || y >= N) continue;
    const i = y * N + x, k = g.kind[i], list = vb.get(i);
    if (!k && !list) continue;
    const sz = g.bSize[i] || 1, cx = ox + (x - y) * hw, cy = oy + (x + y + 1) * hh - cornerH[y * N1 + x] * elevPx;
    if (!vis(cx, cy, sz)) continue;
    const b = g.bio[i]; X.cx = cx; X.cy = cy;
    if (k && g.isOrigin(i)) {
      const t = { i, k, sz, lv: g.lvl[i], vr: g.vr[i], ab: g.ab[i], cls: g.cls[i], riot: g.riot[i], cons: g.cons.get(i) || null, cx, cy, out: false, open: false, alarm: false };
      if (k === K.POLICE) t.out = !!out.get(i);
      if (k === K.FIRE) { const o = out.get(i); t.open = !!(o && o.near); t.alarm = !!o; }
      if (g.built[i] || (k >= K.POLICE)) drawB(t);
      if (g.riot[i] && g.built[i]) protest(X, hw, hh, A, x, cx, cy, kit);
      if (g.pw[i] && k !== K.ROAD) pole(X, kit, hw, g, x, y, T, cx, cy);
    }
    if (k === K.ROAD && g.pw[i]) pole(X, kit, hw, g, x, y, T, cx, cy);
    if (g.fire[i] && g.isOrigin(i)) flames(X, g.fire[i], cx, cy, hw * sz, hh * sz, A, x);
    if (list) list.forEach(v => car(X, poly, T, v, hw, hh, night, A, hi));
    if (k === K.ROAD && hi && b !== BIO.WATER) roadFG(g, x, y, cx, cy, X, hw, hh, A);
    if (hw >= 12 && g.isOrigin(i) && (g.isZone(k) || g.isSky(k) || k === K.POLICE || k === K.FIRE || k === K.HOSP || k === K.SCHOOL) && g.built[i] && !g.cons.has(i)) {
      // Seção 3 do Planejamento: Sistema de Alertas em Duas Camadas
      // Camada 1: Utilidades Básicas (Condição física obrigatória)
      let ic = null;
      if (g.isZone(k) || g.isSky(k)) {
        if (!g.wtOn[i]) ic = 'drop';           // 1º Água
        else if (!g.pwOn[i]) ic = 'bolt';      // 2º Energia
        else if (!g.roadAdj[i]) ic = 'road';   // 3º Acesso viário
        // Camada 2: Serviços Públicos (Qualidade e Riscos para edifícios operacionais)
        else {
          if (g.cHea && g.cHea[i] < 15 && g.poll[i] > 30) ic = 'cross';     // Risco sanitário / Falta de hospital
          else if (g.cr && g.cr[i] > 50 && g.cPol[i] < 20) ic = 'cop';       // Vulnerabilidade a crimes
          else if (k === K.IND && g.cFir && g.cFir[i] < 20) ic = 'fire';     // Risco de incêndio industrial
          else if (k === K.RES && g.cEdu && g.cEdu[i] < 15) ic = 'grad';     // Déficit educacional
        }
      } else if (!g.pwOn[i]) {
        ic = 'bolt';
      }
      if (g.riot[i]) ic = 'riot';
      if (g.fire[i]) ic = 'fire';
      if (ic && (A + x) % 4 !== 3) em.push({ b: ic, x: cx, y: cy - hw * (1.2 + sz * 0.5) - 8 });
    }
  }
  g.fx.forEach(f => { X.cx = T(f.x, f.y)[0]; X.cy = T(f.x, f.y)[1] + hh; kit.fx(f); });
  g.crimes.forEach(c => { if (hw >= 8) { const p = T(c.i % N + 0.5, ((c.i / N) | 0) + 0.5); em.push({ b: 'cop', x: p[0], y: p[1] - hw * 1.1 }); } });
}
