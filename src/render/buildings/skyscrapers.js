import { hash2 } from '../../core/math/util.js';
import { sh, pick, mat } from './palettes.js';

export function createSkyscrapers(ctx) {
  const { X, hi, mid, A, night, P, Q, LN, blk, B, FP, fq, wins, door, awning, flatRoof, cyl, disk, sign, tree } = ctx;

  function skyRes(t) {
    const v = t.vr, tn = t.tn, gl = tn(pick([[96, 168, 224], [218, 192, 138], [132, 204, 198]], v)), pod = B(-.45, -.45, .45, .45);
    /* Podio paisagistico 2x2 com piscina no terraco */
    blk(pod.u0, pod.v0, pod.u1, pod.v1, 0, 10, mat(tn([226, 222, 214])));
    wins(pod, 'L', 6, 1, 2, 8, .05, t.ab, [80, 126, 170]); wins(pod, 'R', 6, 1, 2, 8, .05, t.ab, [70, 110, 150]);
    door(pod, 'L', .42, .58, 7, tn([44, 62, 92]), t.ab); awning(pod, 'L', .34, .66, 8.2, .08, tn([200, 160, 70]), tn([245, 245, 240]));
    Q([P(-.12, .12, 10.2), P(.36, .12, 10.2), P(.36, .38, 10.2), P(-.12, .38, 10.2)], [64, 178, 242], 0, 0);
    /* Torres gemeas residenciais escalonadas + passarela aerea */
    const t1 = B(-.38, -.38, -.04, .04), t2 = B(.04, -.38, .38, .04);
    for (const [tb, H, off] of [[t1, 68, 0], [t2, 60, 1]]) {
      blk(tb.u0, tb.v0, tb.u1, tb.v1, 10, H, { t: sh(gl, 1.18), l: gl, r: sh(gl, .64) });
      if (mid) for (const f of ['L', 'R']) for (let z = 14; z < H - 2; z += 5) {
        fq(tb, f, .05, .95, z, z + 3, f === 'L' ? sh(gl, .8) : sh(gl, .52), 0, 0);
        if (night > .3 && !t.ab && hash2(z, off, v) < 64) X.emQ(FP(tb, f, .08, z).concat(FP(tb, f, .92, z), FP(tb, f, .92, z + 2.8), FP(tb, f, .08, z + 2.8)), [255, 228, 148]);
      }
      flatRoof(tb, H, gl, 1);
      const top = P((tb.u0 + tb.u1) / 2, (tb.v0 + tb.v1) / 2, H), sp = P((tb.u0 + tb.u1) / 2, (tb.v0 + tb.v1) / 2, H + 14);
      LN(top, sp, [216, 220, 228]); X.pt(sp[0], sp[1] - 1, (A + off) % 2 ? [255, 55, 55] : [110, 20, 20]); X.emP(sp[0], sp[1] - 1, [255, 60, 60], 1);
    }
    /* Skybridge conectando as duas torres */
    blk(-.04, -.26, .04, -.1, 38, 43, mat(tn([210, 218, 230])), true);
    for (const q of [[-.42, .42], [.42, .42], [.42, -.42]]) tree(q[0], q[1], 13, [56, 144, 68], 1, 1);
  }

  function skyCom(t) {
    const v = t.vr, tn = t.tn, gl = tn(pick([[88, 166, 238], [76, 198, 214], [116, 144, 232]], v));
    const b0 = B(-.45, -.45, .45, .45), b1 = B(-.34, -.34, .34, .34), b2 = B(-.24, -.24, .24, .24), b3 = B(-.14, -.14, .14, .14);
    blk(b0.u0, b0.v0, b0.u1, b0.v1, 0, 14, mat(tn([46, 54, 70])));
    wins(b0, 'L', 6, 2, 2, 12, .05, t.ab, [130, 196, 245]); wins(b0, 'R', 6, 2, 2, 12, .05, t.ab, [96, 152, 204]);
    sign(b0, 'L', .18, 10.5, .64, 3, tn([22, 30, 46]), 'CORP', [90, 225, 255]);
    for (const [bb, z0, z1] of [[b1, 14, 48], [b2, 48, 74], [b3, 74, 90]]) {
      blk(bb.u0, bb.v0, bb.u1, bb.v1, z0, z1, { t: sh(gl, 1.22), l: gl, r: sh(gl, .6) });
      if (mid) for (const f of ['L', 'R']) {
        for (let z = z0 + 2; z < z1 - 1; z += 4.5) {
          fq(bb, f, .04, .96, z, z + 2.6, f === 'L' ? sh(gl, .82) : sh(gl, .5), 0, 0);
          if (night > .3 && !t.ab && hash2(z | 0, v, z0) < 62) X.emQ(FP(bb, f, .08, z).concat(FP(bb, f, .92, z), FP(bb, f, .92, z + 2.4), FP(bb, f, .08, z + 2.4)), [255, 234, 168]);
        }
        if (hi) { LN(FP(bb, f, 0, z0), FP(bb, f, 1, z1), sh(gl, 1.25)); LN(FP(bb, f, 1, z0), FP(bb, f, 0, z1), sh(gl, 1.25)); }
      }
    }
    const tp = P(0, 0, 90), tp2 = P(0, 0, 112); LN(tp, tp2, [225, 230, 240]); LN([tp[0] + 1, tp[1]], [tp2[0] + 1, tp2[1]], [160, 168, 180]);
    X.pt(tp2[0], tp2[1] - 1, A % 2 ? [255, 50, 50] : [120, 20, 20]); X.emP(tp2[0], tp2[1] - 1, [255, 60, 60], 1);
  }

  function megaTower(t) {
    const v = t.vr, tn = t.tn, gl = tn([92, 184, 246]), gold = tn([236, 196, 96]);
    /* Esplanada civica 3x3 com espelhos d'agua e podio de vidro */
    Q([P(-.48, -.48, 0), P(.48, -.48, 0), P(.48, .48, 0), P(-.48, .48, 0)], tn([188, 192, 200]), 1, 0);
    const pod = B(-.42, -.42, .42, .38); blk(pod.u0, pod.v0, pod.u1, pod.v1, 0, 16, mat(tn([52, 62, 82])));
    wins(pod, 'L', 8, 2, 2, 13, .04, t.ab, [140, 210, 255]); wins(pod, 'R', 8, 2, 2, 13, .04, t.ab, [100, 164, 216]);
    sign(pod, 'L', .22, 12.2, .56, 3.2, tn([24, 32, 48]), 'DELTA', [255, 216, 90]);
    /* Torres laterais de apoio */
    for (const [u0, v0, u1, v1, H] of [[-.36, -.36, -.12, -.08, 62], [-.08, -.36, .34, -.12, 56]]) {
      const wB = B(u0, v0, u1, v1); blk(u0, v0, u1, v1, 16, H, { t: sh(gl, 1.18), l: sh(gl, .94), r: sh(gl, .58) });
      if (mid) for (const f of ['L', 'R']) for (let z = 19; z < H - 2; z += 5) fq(wB, f, .06, .94, z, z + 3, f === 'L' ? sh(gl, .78) : sh(gl, .48), 0, 0);
    }
    /* Torre Supertall Central escalonada */
    for (const [s, z0, z1] of [[.26, 16, 58], [.2, 58, 88], [.13, 88, 108]]) {
      const cb = B(-s, -s, s, s);
      blk(cb.u0, cb.v0, cb.u1, cb.v1, z0, z1, { t: sh(gl, 1.25), l: gl, r: sh(gl, .62) });
      fq(cb, 'L', 0, 1, z1 - 1.8, z1, gold, 0, 0); fq(cb, 'R', 0, 1, z1 - 1.8, z1, sh(gold, .78), 0, 0);
      if (mid) for (const f of ['L', 'R']) for (let z = z0 + 2.5; z < z1 - 2.5; z += 4.5) {
        fq(cb, f, .04, .96, z, z + 2.6, f === 'L' ? sh(gl, .84) : sh(gl, .52), 0, 0);
        if (night > .3 && !t.ab && hash2(z | 0, z0, v) < 68) X.emQ(FP(cb, f, .08, z).concat(FP(cb, f, .92, z), FP(cb, f, .92, z + 2.4), FP(cb, f, .08, z + 2.4)), [255, 236, 176]);
      }
    }
    /* Heliponto no topo e antena mestra */
    disk(0, 0, .1, 108.4, tn([70, 78, 92]), 0); disk(0, 0, .07, 108.6, tn([245, 245, 248]), 0);
    const sp0 = P(0, 0, 108), sp1 = P(0, 0, 132); LN(sp0, sp1, [240, 220, 140]); LN([sp0[0] + 1, sp0[1]], [sp1[0] + 1, sp1[1]], [180, 160, 90]);
    X.pt(sp1[0], sp1[1] - 1, A % 2 ? [255, 60, 60] : [255, 240, 150]); X.emP(sp1[0], sp1[1] - 1, [255, 80, 60], 1);
    for (const q of [[-.44, .44], [.44, .44], [-.18, .44], [.18, .44]]) tree(q[0], q[1], 14, [58, 148, 72], 1, 1.2);
  }

  function landmark(t) {
    const tn = t.tn;
    Q([P(-.46, -.46, 0), P(.46, -.46, 0), P(.46, .46, 0), P(-.46, .46, 0)], tn([212, 208, 198]), 1, 0);
    disk(0, 0, .36, .4, [66, 166, 238], 0); disk(0, 0, .22, 1.2, tn([228, 226, 220]), 0);
    cyl(0, 0, .14, 1, 12, tn([210, 214, 224]), 10);
    cyl(0, 0, .055, 12, 74, tn([226, 230, 238]), 10);
    /* Disco panoramico giratorio */
    disk(0, 0, .2, 62, tn([50, 74, 112]), 0);
    cyl(0, 0, .21, 62, 68, tn([110, 196, 248]), 12);
    disk(0, 0, .17, 68.2, tn([238, 240, 246]), 0);
    cyl(0, 0, .11, 68, 74, tn([214, 68, 60]), 10);
    if (night > .3) for (let k = 0; k < 6; k++) {
      const th = k * 1.047 + A * .15, p = P(Math.cos(th) * .21, Math.sin(th) * .21, 65);
      X.emP(p[0], p[1], [255, 234, 150], 1);
    }
    const a0 = P(0, 0, 74), a1 = P(0, 0, 96); LN(a0, a1, [230, 232, 240]);
    X.pt(a1[0], a1[1] - 1, A % 2 ? [255, 50, 50] : [120, 20, 20]); X.emP(a1[0], a1[1] - 1, [255, 60, 60], 1);
    for (const q of [[-.38, -.38], [.38, -.38], [-.38, .38], [.38, .38]]) tree(q[0], q[1], 13, [62, 150, 72], 1, 1);
  }

  return { skyRes, skyCom, megaTower, landmark };
}
