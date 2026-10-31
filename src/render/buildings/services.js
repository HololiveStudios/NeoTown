import { hash2 } from '../../core/math/util.js';
import { mix, pick, mat } from './palettes.js';

export function createServices(ctx) {
  const { X, hw, U, hi, mid, A, night, P, Q, LN, PT, shadow, blk, B, FP, fq, wins, door, awning, gable, hip, flatRoof, cyl, cone, disk, txt, lampPost, fence, person, minicar, sign, tree } = ctx;

  function police(t) {
    const tn = t.tn, b = B(-.4, -.34, .34, .26), H = 15, out = t.out;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([204, 214, 232]))); fq(b, 'L', 0, 1, 7.5, 9.5, tn([50, 90, 190]), 0, 0); fq(b, 'R', 0, 1, 7.5, 9.5, tn([30, 56, 130]), 0, 0); flatRoof(b, H, [204, 214, 232], 1);
    wins(b, 'L', 4, 1, 10.5, 14, .08, t.ab); wins(b, 'L', 2, 1, 1.5, 6.5, .08, t.ab); wins(b, 'R', 3, 1, 10.5, 14, .12, t.ab); door(b, 'L', .6, .74, 6.5, tn([40, 60, 120]), t.ab); awning(b, 'L', .56, .78, 7.2, .08, tn([40, 70, 170]), tn([240, 240, 240]));
    sign(b, 'L', .08, 9.6, .34, 4.2, tn([24, 40, 100]), '190', [250, 250, 250]);
    const bar = P(-.1, 0, H + 2); blk(-.18, -.06, -.02, .06, H, H + 2, mat([60, 60, 70]), true); PT([bar[0] - 1, bar[1]], A % 2 ? [255, 40, 40] : [50, 70, 255]); PT([bar[0] + 1, bar[1]], A % 2 ? [50, 70, 255] : [255, 40, 40]); X.emP(bar[0], bar[1], A % 2 ? [255, 60, 60] : [70, 90, 255], 1);
    const fp = P(.3, -.28, 0), ft = P(.3, -.28, 26); LN(fp, ft, [210, 212, 220]); const w = Math.sin(A * .5) * 1.2; Q([[ft[0], ft[1]], [ft[0] + 7 * U / 1.6, ft[1] + 1 + w], [ft[0], ft[1] + 4]], [40, 90, 200], 0, 0);
    if (!out) minicar(-.1, .36, 'u', [236, 240, 250], true); fence(-.44, .46, .44, .46, [90, 100, 130]); tree(.42, .4, 12, [60, 146, 70], 1, 1);
    if (hi) { const e = P(.3, .0, 4); X.pt(e[0], e[1], [255, 220, 80]); }
  }

  function fire(t) {
    const tn = t.tn, b = B(-.42, -.34, .26, .28), H = 15, open = t.open;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([226, 70, 60]))); flatRoof(b, H, [226, 70, 60], 1); fq(b, 'L', 0, 1, 9.5, 11, tn([240, 240, 240]), 0, 0); fq(b, 'R', 0, 1, 9.5, 11, tn([200, 200, 200]), 0, 0);
    for (let d = 0; d < 2; d++) { const s0 = .08 + d * .46, s1 = s0 + .38; fq(b, 'L', s0, s1, 0, 8, tn([60, 62, 72]), 0, 0); const dh = open ? 2.5 : 8; fq(b, 'L', s0 + .02, s1 - .02, dh * 0 + 8 - dh + 0.01, 8, tn([210, 214, 222]), 0, 0); if (hi) for (let z = 8 - dh + 1; z < 8; z += 1.5) LN(FP(b, 'L', s0 + .02, z), FP(b, 'L', s1 - .02, z), [150, 154, 164]); if (open && hi && d === 0) { const a = FP(b, 'L', s0 + .1, 0), c = FP(b, 'L', s1 - .1, 0); Q([a, c, [c[0], c[1] - 5 * U], [a[0], a[1] - 5 * U]], [210, 40, 40], 0, 0); } }
    sign(b, 'L', .22, 11.5, .34, 3, tn([150, 30, 30]), '193', [255, 255, 255]); wins(b, 'R', 2, 1, 6, 9, .2, t.ab);
    const tw = B(.26, -.3, .42, -.14); blk(tw.u0, tw.v0, tw.u1, tw.v1, 0, 30, mat(tn([236, 236, 232]))); blk(tw.u0, tw.v0, tw.u1, tw.v1, 30, 32, mat(tn([200, 50, 44])), true); fq(tw, 'L', .2, .8, 24, 29, tn([60, 70, 90]), 0, 0); for (let z = 6; z < 22; z += 5) fq(tw, 'R', .15, .85, z, z + 1.2, tn([180, 180, 176]), 0, 0);
    const sp = P(.34, -.22, 33); PT(sp, t.alarm ? (A % 2 ? [255, 60, 60] : [255, 255, 255]) : [120, 40, 40]); if (t.alarm) X.emP(sp[0], sp[1], [255, 70, 60], 1);
    if (hi) { fence(-.44, .42, .44, .42, [236, 236, 236]); for (let i = 0; i < 3; i++) { const q = P(-.3 + i * .1, .36, 0); PT([q[0], q[1] - 1], [255, 200, 60]); } }
    lampPost(.44, .36, 10);
  }

  function hosp(t) {
    const tn = t.tn, b = B(-.4, -.36, .36, .28), H = 26, wing = B(-.4, .28, .0, .44);
    blk(wing.u0, wing.v0, wing.u1, wing.v1, 0, 9, mat(tn([240, 242, 248]))); fq(wing, 'L', .05, .95, 1, 5, tn([60, 100, 150]), 0, 0); awning(wing, 'L', .2, .8, 7, .08, tn([236, 236, 240]), tn([200, 40, 44]));
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([244, 246, 250]))); flatRoof(b, H, [244, 246, 250], 1);
    wins(b, 'L', 5, 3, 8, H - 1, .06, t.ab, [110, 170, 224]); wins(b, 'R', 4, 3, 8, H - 1, .08, t.ab, [90, 144, 196]); fq(b, 'L', 0, 1, 0, 7.5, tn([226, 232, 242]), 0, 0); wins(b, 'L', 5, 1, 1.5, 6, .08, t.ab, [90, 140, 190]); door(b, 'L', .44, .56, 6, tn([60, 110, 170]), t.ab);
    const rc = tn([220, 36, 46]), rx = P(.36, -.12, 15), cs = Math.max(2, Math.round(hw / 12)); for (let i = -cs; i <= cs; i++) { X.pt(rx[0] + i * .9, rx[1] - i * .45 * 0 - 0 + i * .45, rc); } for (let i = -cs; i <= cs; i++) { X.pt(rx[0] - i * 0, rx[1] + i, rc); X.pt(rx[0] + 1, rx[1] + i, rc); }
    fq(b, 'R', .35, .65, 12, 18, tn([220, 36, 46]), 0, 0); fq(b, 'R', .46, .54, 9.5, 20.5, tn([220, 36, 46]), 0, 0);
    disk(.0, -.04, .16, H + .4, tn([70, 76, 86]), 0); disk(.0, -.04, .13, H + .5, tn([236, 236, 240]), 0); txt(B(-.16, -.2, .16, .12), 'L', .38, H + .6, 'H', tn([220, 40, 50])); if (night > .3) for (let k = 0; k < 4; k++) { const th = k * 1.57 + A * .15, p = P(Math.cos(th) * .17, Math.sin(th) * .17 - .04, H + .8); X.emP(p[0], p[1], A % 2 ? [255, 255, 255] : [255, 70, 70], 1); }
    minicar(-.1, .34, 'u', [244, 244, 246], false); if (hi) { const p = P(-.1, .34, 5.4); PT(p, A % 2 ? [255, 40, 40] : [60, 80, 255]); } lampPost(.4, .36, 10);
  }

  function school(t) {
    const tn = t.tn, b = B(-.42, -.34, .3, .1), H = 14;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([214, 120, 70]))); fq(b, 'L', 0, 1, 0, 3, tn([230, 230, 222]), 0, 0); flatRoof(b, H, [214, 120, 70], 1);
    wins(b, 'L', 6, 2, 3.4, H - .8, .05, t.ab); wins(b, 'R', 3, 2, 3.4, H - .8, .12, t.ab);
    const ce = B(-.14, -.2, .06, .2); blk(ce.u0, ce.v0, ce.u1, ce.v1, 0, 18, mat(tn([228, 160, 100]))); gable(ce, 18, 6, tn([150, 60, 50]), false); door(ce, 'L', .38, .62, 7, tn([70, 50, 40]), t.ab); sign(ce, 'L', .1, 11, .8, 3, tn([30, 70, 130]), 'ESC', [255, 255, 255]);
    const tw = B(.1, -.3, .24, -.16); blk(tw.u0, tw.v0, tw.u1, tw.v1, 0, 24, mat(tn([232, 170, 110]))); hip(tw, 24, 8, tn([120, 50, 44]));
    const ck = FP(tw, 'L', .5, 17); disk(0, 0, 0, 0, [0, 0, 0], 0); Q([[ck[0] - 3, ck[1] - 3], [ck[0] + 3, ck[1] - 3], [ck[0] + 3, ck[1] + 3], [ck[0] - 3, ck[1] + 3]], [250, 250, 240], 0, 0); const ca = A * .1; LN(ck, [ck[0] + Math.cos(ca) * 2.5, ck[1] + Math.sin(ca) * 2.5], [30, 30, 40]); LN(ck, [ck[0] + Math.cos(ca * 12) * 1.8, ck[1] + Math.sin(ca * 12) * 1.8], [30, 30, 40]);
    const fp = P(-.4, .24, 0), ft = P(-.4, .24, 22); LN(fp, ft, [210, 212, 220]); const w = Math.sin(A * .45) * 1.4; Q([[ft[0], ft[1]], [ft[0] + 8 * U / 1.5, ft[1] + 1 + w], [ft[0], ft[1] + 5]], [230, 60, 50], 0, 0);
    Q([P(.04, .16, 0), P(.4, .16, 0), P(.4, .44, 0), P(.04, .44, 0)], tn([200, 110, 80]), 1, 0); if (hi) { LN(P(.04, .3, 0), P(.4, .3, 0), [250, 250, 250]); LN(P(.22, .16, 0), P(.22, .44, 0), [250, 250, 250]); LN(P(.08, .18, 0), P(.08, .18, 8), [60, 60, 70]); LN(P(.08, .18, 8), P(.0 + .08, .26, 8), [60, 60, 70]); }
    if (hi) { const sw = Math.sin(A * .3) * .05; LN(P(-.3 + sw, .3, 7), P(-.3, .26, 9), [80, 80, 90]); LN(P(-.3, .26, 9), P(-.2, .26, 9), [80, 80, 90]); const sx = P(-.25 + sw, .3, 7); PT(sx, [230, 80, 80]); }
    for (let i = 0; i < 4; i++) person(-.1 + i * .12, .3 + (i & 1) * .08, pick([[230, 80, 80], [70, 140, 230], [240, 200, 60], [90, 190, 110]], i), A * .07 + i * 2);
  }

  function coal(t) {
    const tn = t.tn, b = B(-.44, -.4, .1, .36), H = 24;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([128, 128, 136]))); for (const f of ['L']) { if (hi) for (let s = .06; s < .96; s += .1) LN(FP(b, f, s, 1), FP(b, f, s, H - 1), [100, 100, 108]); }
    wins(b, 'L', 3, 1, 12, 20, .1, t.ab, [250, 200, 120]); door(b, 'L', .42, .58, 8, tn([52, 56, 66]), t.ab); flatRoof(b, H, [128, 128, 136], 1);
    cyl(-.16, -.2, .08, H, H + 30, tn([186, 80, 66]), 8); for (let z = H + 6; z < H + 30; z += 9) cyl(-.16, -.2, .082, z, z + 3, tn([240, 240, 240]), 8);
    cyl(.0, -.2, .08, H, H + 26, tn([186, 80, 66]), 8); X.pt(P(-.16, -.2, H + 31)[0], P(-.16, -.2, H + 31)[1], A % 2 ? [255, 50, 50] : [110, 20, 20]); X.emP(P(-.16, -.2, H + 31)[0], P(-.16, -.2, H + 31)[1], [255, 60, 60], 1);
    if (!t.ab) for (const [uu, zz] of [[-.16, H + 30], [.0, H + 26]]) { const p = P(uu, -.2, zz); for (let i = 0; i < 7; i++) { const tt = ((A * .22 + i * .55) % 4) / 4; X.pt(p[0] + tt * 4 + Math.sin(A * .3 + i) * 2, p[1] - tt * 18, mix([120, 122, 130], [70, 72, 80], tt)); X.pt(p[0] + tt * 4 + 1 + Math.sin(A * .3 + i) * 2, p[1] - tt * 18, mix([120, 122, 130], [70, 72, 80], tt)); } }
    cyl(.3, -.2, .14, 0, 20, tn([196, 196, 202]), 10); cyl(.3, -.2, .11, 20, 24, tn([176, 176, 182]), 8); if (!t.ab) { const p = P(.3, -.2, 24); for (let i = 0; i < 6; i++) { const tt = ((A * .2 + i * .6) % 4) / 4; X.pt(p[0] + Math.sin(A * .5 + i) * (3 + tt * 3), p[1] - tt * 12, mix([250, 252, 255], [180, 186, 196], tt)); } }
    const pile = [P(.14, .1, 0), P(.34, .06, 0), P(.4, .3, 0), P(.2, .36, 0)]; Q(pile, [34, 34, 38], 1, 0); Q([P(.18, .14, 0), P(.3, .1, 0), P(.34, .26, 0), P(.22, .3, 0), P(.26, .2, 6)].slice(0, 4), [52, 52, 58], 1, 0); Q([P(.2, .16, 0), P(.3, .14, 0), P(.26, .2, 7)], [70, 70, 78], 0, 0);
    LN(P(.12, .18, 1), P(.0, .1, 9), [110, 112, 120]); LN(P(.12, .2, 1), P(.0, .12, 9), [110, 112, 120]); if (mid) for (let i = 0; i < 4; i++) { const k = ((A * .15 + i * .25) % 1); PT(P(.12 - k * .12, .18 - k * .08, 1 + k * 8 + 1), [20, 20, 24]); }
    fence(-.46, .44, .44, .44, [120, 120, 126]);
  }

  function solar(t) {
    const tn = t.tn; Q([P(-.44, -.44, 0), P(.44, -.44, 0), P(.44, .44, 0), P(-.44, .44, 0)], tn([150, 150, 142]), 1, 0);
    const sheen = (A * .08) % 3;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const u0 = -.4 + c * .28, v0 = -.4 + r * .28, u1 = u0 + .24, v1 = v0 + .2, z0 = 3, z1 = 6.5;
      LN(P(u0 + .02, v1 - .02, 0), P(u0 + .02, v1 - .02, z0), [100, 100, 108]); LN(P(u1 - .02, v1 - .02, 0), P(u1 - .02, v1 - .02, z0), [100, 100, 108]);
      const base = (c + r) % 2 ? [28, 56, 120] : [34, 66, 138], glint = Math.abs((c + r) - sheen) < .6 ? .5 : 0;
      Q([P(u0, v1, z0), P(u1, v1, z0), P(u1, v0, z1), P(u0, v0, z1)], mix(tn(base), [200, 230, 255], glint), 0, 0);
      if (hi) { for (let k = 1; k < 4; k++) { const a = k / 4; LN(P(u0 + (u1 - u0) * a, v1, z0), P(u0 + (u1 - u0) * a, v0, z1), tn([70, 110, 190])); } LN(P(u0, (v0 + v1) / 2, (z0 + z1) / 2), P(u1, (v0 + v1) / 2, (z0 + z1) / 2), tn([70, 110, 190])); }
    }
    blk(.3, .3, .44, .42, 0, 5, mat(tn([200, 202, 210])), true); if (hi) fq(B(.3, .3, .44, .42), 'L', .2, .8, 1.5, 3.5, tn([60, 70, 90]), 0, 0); fence(-.46, .46, .46, .46, [150, 150, 156]);
  }

  function wtower(t) {
    const tn = t.tn;
    // Caixa de base / gerador compacto
    blk(-.42, .22, -.18, .44, 0, 6, mat(tn([186, 190, 198])), true);
    fq(B(-.42, .22, -.18, .44), 'L', .3, .7, 0, 4.2, tn([70, 90, 120]), 0, 0);

    // Estrutura Treliçada Aberta em "X" (Seção 4 - EXAMPLE_MODELS.md):
    // Pernas metálicas cilíndricas/vigas cinza-claro (#c2c8ce) permitindo ver o solo/grama por trás
    const legCol = [194, 200, 206];
    const braceCol = [148, 154, 164];
    const ringCol = [170, 176, 184];
    const legs = [[-.24, -.24], [.24, -.24], [.24, .24], [-.24, .24]];
    
    // Pernas principais inclinadas em direção ao topo
    for (let i = 0; i < 4; i++) {
      const q = legs[i];
      LN(P(q[0], q[1], 0), P(q[0] * 0.72, q[1] * 0.72, 28), legCol);
      if (hi) LN(P(q[0] + 0.015, q[1] + 0.015, 0), P(q[0] * 0.72 + 0.015, q[1] * 0.72 + 0.015, 28), [112, 116, 126]);
    }

    // Treliças em "X" e anéis de amarração horizontal
    for (let i = 0; i < 4; i++) {
      const pA = legs[i], pB = legs[(i + 1) % 4];
      // Anel intermediário z = 14
      LN(P(pA[0] * 0.86, pA[1] * 0.86, 14), P(pB[0] * 0.86, pB[1] * 0.86, 14), ringCol);
      // Anel superior z = 28
      LN(P(pA[0] * 0.72, pA[1] * 0.72, 28), P(pB[0] * 0.72, pB[1] * 0.72, 28), ringCol);
      if (hi) {
        // "X" inferior (0 -> 14)
        LN(P(pA[0], pA[1], 0), P(pB[0] * 0.86, pB[1] * 0.86, 14), braceCol);
        LN(P(pB[0], pB[1], 0), P(pA[0] * 0.86, pA[1] * 0.86, 14), braceCol);
        // "X" superior (14 -> 28)
        LN(P(pA[0] * 0.86, pA[1] * 0.86, 14), P(pB[0] * 0.72, pB[1] * 0.72, 28), braceCol);
        LN(P(pB[0] * 0.86, pB[1] * 0.86, 14), P(pA[0] * 0.72, pA[1] * 0.72, 28), braceCol);
      }
    }

    // Escada de marinheiro vertical
    LN(P(0.2, 0.0, 0), P(0.16, 0.0, 28), [70, 74, 82]);
    if (hi) {
      for (let z = 2; z <= 26; z += 3) {
        LN(P(0.18, -0.03, z), P(0.18, 0.03, z), [120, 124, 134]);
      }
    }

    shadow(-.24, -.24, .24, .24, 42);

    // Cuba / Reservatório Esférico Metálico com sombreamento radial da esquerda para a direita:
    // Branco solar (#ffffff) -> Cinza metálico (#d0d7de) -> Sombra (#6e7885)
    cyl(0, 0, .26, 28, 41, tn([208, 215, 222]), 14);
    // Faixas horizontais estruturais do tanque
    for (let z = 31; z <= 39; z += 3.8) {
      cyl(0, 0, .264, z, z + 1.2, tn([245, 248, 252]), 14);
    }
    // Cúpula esférica no topo do reservatório
    cone(0, 0, .268, 41, 5, tn([220, 226, 234]));

    // Luz de topo de obstáculo aéreo piscante
    const topLight = P(0, 0, 46.5);
    PT(topLight, A % 2 ? [255, 40, 40] : [120, 20, 20]);
    if (night > 0.25) X.emP(topLight[0], topLight[1], [255, 60, 60], 1);
  }

  function park(t) {
    const v = t.vr, st = v % 3; Q([P(-.46, -.46, 0), P(.46, -.46, 0), P(.46, .46, 0), P(-.46, .46, 0)], [92, 184, 88], 2, 0);
    Q([P(-.46, -.05, 0), P(.46, -.05, 0), P(.46, .05, 0), P(-.46, .05, 0)], [226, 212, 168], 1, 0); Q([P(-.05, -.46, 0), P(.05, -.46, 0), P(.05, .46, 0), P(-.05, .46, 0)], [226, 212, 168], 1, 0);
    if (st !== 1) { disk(0, 0, .17, .3, [210, 210, 214], 0); disk(0, 0, .14, .5, [70, 160, 240], 0); cyl(0, 0, .03, .5, 5, [220, 222, 228], 6); if (mid) for (let i = 0; i < 6; i++) { const a = (A * .5 + i * 1.05) % 3, k = a / 3, th = i * 1.05, p = P(Math.cos(th) * k * .1, Math.sin(th) * k * .1, 5 + 7 * Math.sin(k * 3.14)); PT(p, [220, 240, 255]); } }
    else { disk(.12, .12, .24, .3, [210, 210, 214], 0); disk(.12, .12, .21, .5, [64, 150, 236], 0); for (let i = 0; i < 2; i++) { const dd = P(.12 + Math.sin(A * .12 + i * 3) * .1, .12 + Math.cos(A * .1 + i) * .08, 1); PT(dd, [250, 250, 250]); PT([dd[0] + 1, dd[1]], [250, 250, 250]); PT([dd[0] + 1, dd[1] - 1], [240, 200, 60]); } }
    for (const q of [[-.32, -.3, 0], [.32, -.3, 1], [-.32, .3, 1], [.32, .32, 0], [-.2, -.36, 1], [.34, .1, 0]]) tree(q[0], q[1], 14 + (q[2] * 3), q[2] ? [66, 150, 72] : [36, 118, 56], q[2] ? 1 : 0, 1.4);
    for (const q of [[-.24, .14], [.22, -.16]]) blk(q[0] - .06, q[1] - .02, q[0] + .06, q[1] + .02, 1, 3, mat([150, 110, 70]), true);
    if (hi) for (let i = 0; i < 6; i++) { PT(P(-.4 + hash2(i, v, 1) * .008, .2 + hash2(i, v, 2) * .004, .5), pick([[240, 90, 90], [250, 210, 70], [250, 250, 250], [190, 110, 230]], i)); }
    for (let i = 0; i < 3; i++) person(-.3 + i * .25, .1 + (i & 1) * .1, pick([[230, 80, 80], [70, 140, 230], [240, 200, 60]], i), A * .06 + i * 3);
  }

  return { police, fire, hosp, school, coal, solar, wtower, park };
}
