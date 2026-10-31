import { hash2 } from '../../core/math/util.js';
import { sh, pick, mat, C } from './palettes.js';

export function createResidential(ctx) {
  const { X, hi, mid, A, night, P, Q, LN, PT, blk, B, FP, fq, wins, door, awning, gable, hip, flatRoof, cyl, disk, txt, lampPost, fence, smoke, minicar, tree } = ctx;

  function res1(t) {
    const v = t.vr, tn = t.tn, wc = tn(pick(C.wall, v)), rc = tn(pick(C.roof, v >> 3)), st = v % 4;
    Q([P(-.44, -.44, 0), P(.44, -.44, 0), P(.44, .44, 0), P(-.44, .44, 0)], [112, 176, 84], 1, 0.55);
    if (st === 0) {
      const b = B(-.28, -.26, .16, .18); blk(b.u0, b.v0, b.u1, b.v1, 0, 9, mat(wc)); gable(b, 9, 6.5, rc, true);
      blk(-.1, -.18, -.03, -.11, 9, 17, mat(C.brick), true); smoke(-.065, -.145, 17, 3);
      door(b, 'L', .42, .56, 6, tn([120, 74, 44]), t.ab); wins(b, 'L', 2, 1, 2.5, 7, .08, t.ab); wins(b, 'R', 1, 1, 2.5, 7, .22, t.ab);
      Q([P(.0, .18, 0), P(.1, .18, 0), P(.2, .42, 0), P(.1, .42, 0)], [206, 196, 170], 0, 0); fence(-.4, .4, .4, .4); fence(.4, -.4, .4, .4);
      tree(.32, -.32, 15, [58, 140, 66], 1, 1.2);
    } else if (st === 1) {
      const b1 = B(-.34, -.3, .06, .16), b2 = B(.06, -.1, .34, .16);
      blk(b1.u0, b1.v0, b1.u1, b1.v1, 0, 9, mat(wc)); hip(b1, 9, 7, rc); blk(b2.u0, b2.v0, b2.u1, b2.v1, 0, 6, mat(sh(wc, .92))); flatRoof(b2, 6, sh(rc, 1.1), 1);
      Q([P(.06, .16, 0), P(.34, .16, 0), P(.34, .46, 0), P(.06, .46, 0)], [150, 150, 154], 1, 0); fq(b2, 'L', .12, .88, 0, 4.6, tn([220, 222, 226]), 0, 0); if (hi) for (let z = 1; z < 4.6; z += 1.3) { const a = FP(b2, 'L', .12, z), c = FP(b2, 'L', .88, z); LN(a, c, [160, 162, 170]); }
      door(b1, 'L', .55, .7, 6, tn([150, 60, 50]), t.ab); wins(b1, 'L', 2, 1, 3, 7, .06, t.ab); wins(b1, 'R', 1, 1, 3, 7, .25, t.ab);
      if (!t.garageOut) minicar(.2, .34, 'v', pick(C.shop, v), false); tree(-.36, .34, 13, [70, 146, 70], 1, 1);
    } else if (st === 2) {
      const b = B(-.3, -.28, .2, .2); blk(b.u0, b.v0, b.u1, b.v1, 0, 16, mat(wc)); hip(b, 16, 8, rc);
      wins(b, 'L', 2, 2, 2.5, 15, .1, t.ab); wins(b, 'R', 2, 2, 2.5, 15, .12, t.ab); door(b, 'L', .42, .56, 6, tn([110, 68, 40]), t.ab);
      blk(-.1, .2, .1, .27, 7.5, 8.3, mat([150, 120, 90]), true); if (hi) { LN(P(-.1, .27, 8.3), P(-.1, .27, 11), [90, 70, 50]); LN(P(.1, .27, 8.3), P(.1, .27, 11), [90, 70, 50]); LN(P(-.1, .27, 11), P(.1, .27, 11), [90, 70, 50]); }
      fence(-.42, .38, .38, .38); tree(.34, -.34, 17, [60, 134, 62], 1, 1.3); lampPost(-.4, .3, 10);
    } else {
      const b = B(-.34, -.22, .24, .14); blk(b.u0, b.v0, b.u1, b.v1, 0, 7, mat(wc)); gable(b, 7, 6, rc, true);
      wins(b, 'L', 3, 1, 2.2, 6, .06, t.ab); door(b, 'L', .62, .72, 5.2, tn([100, 70, 46]), t.ab);
      for (let i = 0; i < 4; i++) { const u = -.3 + i * .2; LN(P(u, .22, 0), P(u, .22, 7), [236, 230, 214]); } blk(b.u0, .14, b.u1, .24, 7, 7.7, mat(rc), true);
      if (mid && t.cls !== 0) { Q([P(-.22, .26, .2), P(.1, .26, .2), P(.1, .44, .2), P(-.22, .44, .2)], [80, 170, 236], 0, 0); if (hi) for (let i = 0; i < 3; i++) { const a = P(-.2 + ((A * .02 + i * .1) % .3), .3 + i * .05, .2); PT(a, [200, 236, 255]); } }
    }
  }

  function res2(t) {
    const v = t.vr, tn = t.tn, wc = tn(pick(C.apt, v)), st = v % 3;
    if (st !== 2) {
      const b = B(-.36, -.34, .34, .3), H = st === 0 ? 22 : 26;
      // Prédio vertical de alvenaria com embasamento de pedra escura térrea (#5a5d64)
      blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(wc));
      fq(b, 'L', 0, 1, 0, 6.5, tn([90, 93, 100]), 0, 0); // Térreo escuro
      fq(b, 'R', 0, 1, 0, 6.5, tn([65, 68, 75]), 0, 0);

      // Frisos horizontais entre pavimentos a cada ~5px de altura (#b59252 sobre ocre)
      if (hi) {
        for (let z = 6.5; z < H; z += 5.2) {
          LN(FP(b, 'L', 0, z), FP(b, 'L', 1, z), sh(wc, 0.82));
          LN(FP(b, 'R', 0, z), FP(b, 'R', 1, z), sh(wc, 0.6));
        }
      }

      // Telhado mansarda/platibanda ou 4 águas escuras (#4a4d52)
      if (st === 0) {
        hip(b, H, 5.5, tn([74, 77, 82]));
      } else {
        flatRoof(b, H, wc, 1);
      }

      wins(b, 'L', 4, 3, 7.5, H - 1.5, .07, t.ab);
      wins(b, 'R', 4, 3, 7.5, H - 1.5, .07, t.ab);
      // Entrada recuada escura (#1c1e21)
      door(b, 'L', .42, .58, 5.2, tn([28, 30, 33]), t.ab);
      awning(b, 'L', .36, .64, 6.5, .09, tn([200, 70, 70]), tn([240, 240, 240]));

      if (hi) for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        if (hash2(r, c, v) < 45) {
          const s0 = .07 + c * .215 + .02;
          blk(b.u0 + (b.u1 - b.u0) * s0, b.v1, b.u0 + (b.u1 - b.u0) * (s0 + .13), b.v1 + .05, 7.5 + r * 5.2, 8.3 + r * 5.2, mat([90, 96, 104]), true);
        }
      }
      cyl(.18, -.16, .09, H, H + 5, tn([150, 156, 164]), 8);
      blk(-.28, -.2, -.14, -.08, H, H + 2.5, mat([170, 172, 178]), true);
      LN(P(.0, .0, H), P(.0, .0, H + 9), [190, 190, 200]);
      if (night > .3) X.emP(P(.0, .0, H + 9)[0], P(.0, .0, H + 9)[1], A % 2 ? [255, 60, 60] : [90, 20, 20], 1);
      if (st === 1) {
        const b2 = B(-.2, -.2, .18, .16);
        blk(b2.u0, b2.v0, b2.u1, b2.v1, H, H + 8, mat(sh(wc, .94)));
        wins(b2, 'L', 2, 1, H + 2, H + 7, .1, t.ab);
      }
      lampPost(-.42, .36, 11);
      tree(.4, .38, 12, [60, 140, 66], 1, 1);
    } else {
      const b1 = B(-.36, -.36, .0, .3), b2 = B(.0, -.36, .34, .3);
      blk(b1.u0, b1.v0, b1.u1, b1.v1, 0, 30, mat(wc));
      blk(b2.u0, b2.v0, b2.u1, b2.v1, 0, 20, mat(sh(wc, 1.06)));
      // Embasamento escuro
      fq(b1, 'L', 0, 1, 0, 6.5, tn([90, 93, 100]), 0, 0);
      fq(b2, 'L', 0, 1, 0, 6.5, tn([90, 93, 100]), 0, 0);
      hip(b2, 20, 5, tn([74, 77, 82]));

      wins(b1, 'L', 2, 4, 7.5, 29, .1, t.ab);
      wins(b2, 'L', 2, 2, 7.5, 19, .1, t.ab);
      wins(b2, 'R', 4, 2, 7.5, 19, .07, t.ab);
      wins(b1, 'R', 4, 4, 7.5, 29, .07, t.ab);
      door(b2, 'L', .38, .6, 5.5, tn([28, 30, 33]), t.ab);
      awning(b2, 'L', .3, .7, 6, .1, tn([60, 130, 200]), tn([240, 240, 240]));
      lampPost(.4, .36, 11);
      tree(-.4, .38, 12, [60, 140, 66], 1, 1);
      if (hi) for (let i = 0; i < 4; i++) PT(P(-.3 + i * .08, .1, 30.5), [120, 190, 100]);
    }
  }

  function res3(t) {
    const v = t.vr, tn = t.tn, gl = tn(t.cls === 2 ? pick([[84, 128, 206], [214, 176, 84]], v) : t.cls === 0 ? [160, 164, 166] : pick(C.glass, v)), g2 = sh(gl, .62), b0 = B(-.4, -.4, .4, .38), b = B(-.3, -.3, .28, .26);
    blk(b0.u0, b0.v0, b0.u1, b0.v1, 0, 8, mat(tn([210, 206, 200]))); wins(b0, 'L', 5, 1, 1.5, 6.5, .06, t.ab, [90, 130, 170]); awning(b0, 'L', .38, .62, 7, .1, tn([40, 40, 48]), tn([60, 62, 70])); door(b0, 'L', .43, .57, 5.5, tn([40, 60, 90]), t.ab);
    const H = 52; blk(b.u0, b.v0, b.u1, b.v1, 8, H, { t: sh(gl, 1.2), l: gl, r: g2 });
    if (mid) for (const f of ['L', 'R']) { for (let z = 11; z < H - 2; z += 5) { fq(b, f, .03, .97, z, z + 3, f === 'L' ? sh(gl, .78) : sh(gl, .5), 0, 0); } if (hi) for (let s = 0; s <= 1; s += .25) LN(FP(b, f, s, 8), FP(b, f, s, H), sh(g2, .8)); }
    if (night > .3) for (let z = 11; z < H - 2; z += 5) for (const f of ['L', 'R']) for (let c = 0; c < 4; c++) if (hash2(c, z, v + (f === 'L' ? 1 : 2)) < 55 && !t.ab) { const s0 = .06 + c * .23, s1 = s0 + .15; X.emQ([FP(b, f, s0, z).concat(FP(b, f, s1, z), FP(b, f, s1, z + 3), FP(b, f, s0, z + 3))][0], [255, 224, 140]); }
    const b3 = B(-.2, -.2, .18, .16); blk(b3.u0, b3.v0, b3.u1, b3.v1, H, H + 6, mat(tn([200, 204, 210]))); flatRoof(b3, H + 6, [200, 204, 210], 1);
    if ((v & 1) || t.cls === 2) { disk(.0, -.02, .12, H + 6.3, tn([70, 76, 86]), 0); disk(.0, -.02, .09, H + 6.4, tn([240, 240, 240]), 0); if (hi) { txt(B(-.1, -.1, .1, .1), 'L', .1, H + 6.6, 'H', [60, 60, 70]); } if (night > .3) for (let k = 0; k < 4; k++) { const th = k * 1.57 + A * .2, p = P(Math.cos(th) * .12, Math.sin(th) * .12 - .02, H + 6.6); X.emP(p[0], p[1], A % 2 ? [255, 255, 255] : [255, 80, 80], 1); } }
    else { const tp = P(.0, .0, H + 6), tp2 = P(.0, .0, H + 22); LN(tp, tp2, [210, 212, 220]); LN([tp[0] + 1, tp[1]], [tp2[0] + 1, tp2[1]], [160, 162, 172]); X.pt(tp2[0], tp2[1] - 1, A % 2 ? [255, 50, 50] : [110, 20, 20]); X.emP(tp2[0], tp2[1] - 1, [255, 60, 60], 1); }
    for (const q of [[-.44, .3], [.44, .3]]) tree(q[0], q[1], 11, [60, 146, 70], 1, 1);
  }

  return { res1, res2, res3 };
}
