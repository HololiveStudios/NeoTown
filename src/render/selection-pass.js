import { BIO, FAC } from '../core/constants.js';
import { clamp } from '../core/math/util.js';

export function renderSelectionPass(ctx) {
  const { g, W, H, hw, hh, T, X, poly, tool, view } = ctx;
  const N = g.N, H_ = H;

  const pv = g.preview;
  if (pv) pv.tiles.forEach(t => {
    const x = t.i % N, y = (t.i / N) | 0, p0 = T(x, y), p1 = T(x + 1, y), p2 = T(x + 1, y + 1), p3 = T(x, y + 1), okc = t.c >= 0 && pv.ok;
    poly([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]], t.c < 0 ? [240, 60, 60] : okc ? [60, 240, 110] : [255, 170, 40], 0, 0.5);
  });

  const rad = tool.mode === 'point' && tool.k && FAC[tool.k] && FAC[tool.k].r ? FAC[tool.k].r : 0;
  if (rad) {
    const col = tool.rCol || [120, 230, 255];
    // Desenha anel e disco translúcido com a cor específica do serviço (Polícia=Azul, Fogo=Vermelho, Saúde=Verde, Escola=Amarelo)
    const pts = [];
    for (let a = 0; a <= 48; a++) {
      const t = a / 48 * 6.2832, q = T(g.cx + 0.5 + Math.cos(t) * rad, g.cy + 0.5 + Math.sin(t) * rad);
      pts.push(q[0], q[1]);
    }
    // Preenchimento translúcido do raio de atendimento
    poly(pts, col, 0, 0.22);

    let pr = null;
    for (let a = 0; a <= 48; a++) {
      const q = [pts[a * 2], pts[a * 2 + 1]];
      if (pr) X.ln(pr[0], pr[1], q[0], q[1], col);
      pr = q;
    }
  }

  const cp0 = T(g.cx, g.cy), cp1 = T(g.cx + 1, g.cy), cp2 = T(g.cx + 1, g.cy + 1), cp3 = T(g.cx, g.cy + 1), cc = [255, 232, 40];
  X.ln(cp3[0], cp3[1], cp0[0], cp0[1], cc);
  X.ln(cp0[0], cp0[1], cp1[0], cp1[1], cc);
  X.ln(cp1[0], cp1[1], cp2[0], cp2[1], cc);
  X.ln(cp2[0], cp2[1], cp3[0], cp3[1], cc);

  if (view.heat) {
    const Hh = view.heat;
    const v = (i) => Hh.id === 'cls' ? g.cls[i] * 50 : Hh.id === 'risk' ? g.riskAt(i) : Hh.id === 'poll' ? g.poll[i] : Hh.id === 'crime' ? g.cr[i] : Hh.id === 'land' ? g.land[i] : Hh.id === 'elev' ? (g.elev ? g.elev[i] : (g.getTerrainHeight ? g.getTerrainHeight(i % g.N, (i / g.N) | 0) : 0)) * 12.5 : g.cPol[i];
    const bad = Hh.id === 'poll' || Hh.id === 'crime' || Hh.id === 'risk';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x; if (g.bio[i] === BIO.WATER) continue;
      const p0 = T(x, y); if (p0[0] + hw < 0 || p0[0] - hw > W || p0[1] > H_ || p0[1] + 2 * hh < 0) continue;
      const p1 = T(x + 1, y), p2 = T(x + 1, y + 1), p3 = T(x, y + 1);
      let t = clamp(v(i) / 100, 0, 1); if (!bad) t = 1 - t;
      const c = t < 0.5 ? [60 + 190 * t * 2 | 0, 220, 60] : [250, 220 - 190 * (t - 0.5) * 2 | 0, 50];
      poly([p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]], c, 0, 0.45);
    }
  }
}
