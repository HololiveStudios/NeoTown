import { clamp } from '../core/math/util.js';
import { Vector } from '../core/math/vector.js';
import { make } from './buildings/registry.js';
import { fillPoly, put, line, setClipY } from './raster/pixel.js';
import { getEmissiveBuffer } from './raster/caches.js';
import { computeView } from './camera.js';
import { renderTerrainPass } from './terrain-pass.js';
import { renderObjectPass } from './object-pass.js';
import { renderSelectionPass } from './selection-pass.js';
import { renderNightPass } from './night-pass.js';

export function render(g, fb, W, H, view) {
  view = view || {};
  setClipY(-1e9);
  const N = g.N, tool = g.tool();
  const { hw, hh, U, elevPx, ox, oy, T } = computeView(g, W, H, view);
  const A = Math.floor(g.anim), day0 = clamp(0.5 + 0.8 * Math.cos((g.tod - 0.5) * 6.2832), 0, 1);
  const night = view.qn ? Math.round((1 - day0) * view.qn) / view.qn : 1 - day0, day = 1 - night, hi = hw >= 20, mid = hw >= 12;
  const st = clamp((g.tod - 0.25) / 0.5, 0, 1);

  const fb32 = fb._u32 || (fb._u32 = new Uint32Array(fb.buffer, fb.byteOffset, W * H));
  for (let y = 0; y < H; y++) {
    const f = y / H, r = 10 + 8 * f | 0, gg = 16 + 12 * f | 0, b = 28 + 22 * f | 0;
    fb32.fill(0xff000000 | (b << 16) | (gg << 8) | r, y * W, (y + 1) * W);
  }

  const em = [], sunVec = new Vector(-0.55, -0.35, 0.75).normalized();
  const embN = W * H;
  const { emb32, emb8 } = getEmissiveBuffer(embN);
  const nightOn = night > 0.25;
  if (nightOn) emb32.fill(0);

  const X = {
    hw, hh, sz: 1, A, night, cx: 0, cy: 0, sunX: (0.9 - 1.8 * st) * 0.55, sunY: 0.1, shA: 0.26 * day,
    poly: (p, c, j, a) => fillPoly(fb, W, H, p, c, j, a),
    ln: (a, b, c, d, e) => line(fb, W, H, a, b, c, d, e),
    pt: (x, y, c) => put(fb, W, H, x, y, c),
    emP: (x, y, c, gl) => { if (gl) em.push({ x, y, c, f: 1 }); else if (nightOn) put(emb8, W, H, x, y, c); },
    emQ: (pts, c) => { if (nightOn) fillPoly(emb8, W, H, pts, c, 0, 0); },
    setClip: (v) => { setClipY(v); }
  };

  const kit = make(X), poly = X.poly;
  const bio = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : g.bio[y * N + x]);
  const vis = (cx, cy, sz) => { const m = (sz || 1) * hw * 3.5; return cx + m > 0 && cx - m < W && cy + hw * 3 > 0 && cy - hw * 9 < H; };
  const showPipe = tool.flag === 'pipe' || tool.id === 'wtower';

  const vb = new Map(), out = new Map();
  g.veh.forEach(v => {
    const fx = v.x + 0.5 + (v.nx - v.x) * v.p, fy = v.y + 0.5 + (v.ny - v.y) * v.p, key = Math.floor(fy) * N + Math.floor(fx);
    (vb.get(key) || vb.set(key, []).get(key)).push(v);
    if (v.kind !== 'car') {
      const o = out.get(v.st) || { n: 0, near: false };
      o.n++;
      if (v.ri <= 2 && v.state !== 'work') o.near = true;
      out.set(v.st, o);
    }
  });

  const passCtx = {
    g, fb, fb32, W, H, view, tool,
    hw, hh, U, elevPx, ox, oy, T,
    A, night, day, nightOn, hi, mid,
    X, kit, poly, bio, vis, showPipe,
    sunVec, embN, emb32, emb8, em, vb, out
  };

  renderTerrainPass(passCtx);
  renderObjectPass(passCtx);
  renderSelectionPass(passCtx);
  renderNightPass(passCtx);
}
