import { hash2 } from '../../core/math/util.js';
import { sh, pick, mat, C } from './palettes.js';

export function createCommercial(ctx) {
  const { X, hi, mid, A, night, P, Q, LN, blk, B, FP, fq, wins, door, awning, flatRoof, cone, lampPost, person, minicar, sign, tree } = ctx;

  function com1(t) {
    const v = t.vr, tn = t.tn, sc = tn(pick(C.shop, v)), sc2 = tn([244, 244, 240]), nm = ['LOJA', 'CAFE', 'PAO', 'BAR', 'ARTE', 'LUA'][v % 6];
    const b = B(-.4, -.34, .22, .2); blk(b.u0, b.v0, b.u1, b.v1, 0, 11, mat(tn(sh(sc, 1.12)))); flatRoof(b, 11, sc, 1);
    fq(b, 'L', .06, .7, 1.2, 6.8, tn([36, 52, 74]), 0, 0); fq(b, 'L', .06, .7, 1.2, 6.8, [170, 220, 255], 0, t.ab ? 0 : (night > .3 ? .0 : .28));
    if (night > .3 && !t.ab) X.emQ(FP(b, 'L', .06, 1.2).concat(FP(b, 'L', .7, 1.2), FP(b, 'L', .7, 6.8), FP(b, 'L', .06, 6.8)), [255, 236, 170]);
    door(b, 'L', .76, .9, 6.5, tn([60, 70, 90]), t.ab); awning(b, 'L', .03, .93, 8, .13, sc2, sc); wins(b, 'R', 2, 1, 4, 9, .12, t.ab);
    sign(b, 'L', .1, 8.8, .55, 2.2, tn([30, 32, 40]), nm, [255, 210, 80]);
    if (nm === 'CAFE' || nm === 'BAR') for (const q of [[.3, .36], [.12, .38]]) { LN(P(q[0], q[1], 0), P(q[0], q[1], 7), [90, 70, 50]); cone(q[0], q[1], .09, 7, 3.4, tn(v & 1 ? [220, 70, 70] : [70, 140, 220])); if (hi) { blk(q[0] - .035, q[1] - .035, q[0] + .035, q[1] + .035, 2.4, 2.9, mat([236, 236, 230]), true); } }
    person(.36, .26, [220, 80, 80], A * .06 + v); person(.3, .4, [70, 120, 220], A * .05); lampPost(.42, .42, 11);
    if (v % 6 === 2) { const q = P(.3, -.3, 11); for (let i = 0; i < 3; i++) X.pt(q[0] + i, q[1] - 2 - i % 2, [250, 240, 220]); }
  }

  function com2(t) {
    const v = t.vr, tn = t.tn, sc = tn(pick(C.shop, v)), mall = v % 3 === 2;
    if (!mall) {
      const b = B(-.4, -.38, .38, .3), H = 28; blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn(sh(sc, 1.05))));
      for (const f of ['L', 'R']) { for (let z = 9; z < H - 1; z += 4.6) fq(b, f, .03, .97, z, z + 2.8, f === 'L' ? tn([150, 200, 236]) : tn([84, 128, 176]), 0, 0); }
      fq(b, 'L', 0, 1, 0, 8, tn([228, 228, 224]), 0, 0); wins(b, 'L', 5, 1, 1.5, 7, .05, t.ab, [60, 90, 120]); awning(b, 'L', .02, .98, 8.4, .12, tn([240, 240, 240]), sc); door(b, 'L', .46, .56, 6, tn([36, 50, 70]), t.ab);
      flatRoof(b, H, sc, 1); sign(b, 'L', .15, H - 6, .7, 4, tn([28, 30, 38]), 'SHOP', [255, 150, 60]); blk(.14, -.1, .3, .06, H, H + 3, mat([170, 174, 180]), true);
      if (night > .3 && !t.ab) for (let z = 9; z < H - 1; z += 4.6) { X.emQ(FP(b, 'L', .1, z).concat(FP(b, 'L', .9, z), FP(b, 'L', .9, z + 2.8), FP(b, 'L', .1, z + 2.8)), [255, 232, 170]); }
      lampPost(-.44, .36, 11); tree(.42, .4, 11, [60, 146, 70], 1, 1);
    } else {
      const b = B(-.44, -.4, .4, .2), H = 16; blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(tn([232, 226, 214]))); fq(b, 'L', .08, .92, 2, 11, tn([70, 120, 170]), 0, .0); fq(b, 'L', .08, .92, 2, 11, [190, 230, 255], 0, .22); door(b, 'L', .42, .58, 8, tn([40, 40, 52]), t.ab);
      sign(b, 'L', .15, H - 4.4, .7, 3.4, tn([36, 36, 48]), 'SHOP', [255, 120, 140]); flatRoof(b, H, [232, 226, 214], 1);
      Q([P(-.44, .2, 0), P(.4, .2, 0), P(.4, .46, 0), P(-.44, .46, 0)], tn([76, 78, 84]), 1, 0); for (let i = 0; i < 6; i++) LN(P(-.4 + i * .15, .24, 0), P(-.4 + i * .15, .42, 0), [230, 230, 230]);
      minicar(-.3, .33, 'v', [220, 60, 60]); minicar(.0, .33, 'v', [240, 240, 240]); minicar(.3, .33, 'v', [60, 100, 220]); lampPost(.42, .22, 10);
    }
  }

  function com3(t) {
    const v = t.vr, tn = t.tn, gl = tn(pick(C.glass, v)), b0 = B(-.42, -.4, .4, .36), b1 = B(-.32, -.3, .3, .26), b2 = B(-.22, -.2, .2, .16);
    blk(b0.u0, b0.v0, b0.u1, b0.v1, 0, 14, mat(tn([220, 222, 226]))); wins(b0, 'L', 5, 1, 1.5, 7, .05, t.ab, [70, 110, 150]); awning(b0, 'L', .36, .64, 8, .1, tn([40, 44, 56]), tn([60, 64, 78])); door(b0, 'L', .44, .56, 6.5, tn([30, 40, 60]), t.ab);
    for (const [bb, z0, z1] of [[b1, 14, 38], [b2, 38, 56]]) {
      blk(bb.u0, bb.v0, bb.u1, bb.v1, z0, z1, { t: sh(gl, 1.2), l: gl, r: sh(gl, .62) });
      if (mid) for (const f of ['L', 'R']) { for (let z = z0 + 2; z < z1 - 1; z += 4) fq(bb, f, .03, .97, z, z + 2.4, f === 'L' ? sh(gl, .8) : sh(gl, .5), 0, 0); if (hi) for (let s = 0; s <= 1; s += .2) LN(FP(bb, f, s, z0), FP(bb, f, s, z1), sh(gl, f === 'L' ? .66 : .4)); }
      if (night > .3 && !t.ab) for (let z = z0 + 2; z < z1 - 1; z += 4) for (const f of ['L', 'R']) for (let c = 0; c < 4; c++) if (hash2(c, z, v + (f === 'L' ? 3 : 4)) < 60) { const s0 = .05 + c * .24; X.emQ(FP(bb, f, s0, z).concat(FP(bb, f, s0 + .16, z), FP(bb, f, s0 + .16, z + 2.4), FP(bb, f, s0, z + 2.4)), [255, 226, 150]); }
    }
    if (mid) { const k = (A % 12) / 12, zz = 14 + k * 42; for (const f of ['L', 'R']) { const bb = zz > 38 ? b2 : b1; if (zz < 55) fq(bb, f, .03, .97, zz, zz + 1.2, [190, 240, 255], 0, 0); if (night > .3) X.emQ(FP(bb, f, .03, zz).concat(FP(bb, f, .97, zz), FP(bb, f, .97, zz + 1.2), FP(bb, f, .03, zz + 1.2)), [160, 235, 255]); } }
    const tp = P(0, 0, 56), tp2 = P(0, 0, 76); LN(tp, tp2, [220, 224, 232]); LN([tp[0] + 1, tp[1]], [tp2[0] + 1, tp2[1]], [150, 154, 164]); X.pt(tp2[0], tp2[1] - 1, A % 2 ? [255, 50, 50] : [110, 20, 20]); X.emP(tp2[0], tp2[1] - 1, [255, 60, 60], 1);
    if (v & 1) { sign(b0, 'R', .12, 3, .7, 5, tn([30, 34, 44]), 'LUA', [90, 220, 255]); }
    lampPost(.44, .38, 11); tree(-.44, .4, 11, [60, 146, 70], 1, 1);
  }

  return { com1, com2, com3 };
}
