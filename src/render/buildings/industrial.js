import { sh, mix, pick, mat, C } from './palettes.js';

export function createIndustrial(ctx) {
  const { X, hi, mid, A, P, Q, LN, PT, blk, B, FP, fq, wins, door, gable, flatRoof, cyl, cone, lampPost, smoke, minicar } = ctx;

  function ind1(t) {
    const v = t.vr, tn = t.tn, ic = tn(pick(C.ind, v)), b = B(-.42, -.3, .36, .3), H = 11; Q([P(-.46, -.34, 0), P(.44, -.34, 0), P(.44, .46, 0), P(-.46, .46, 0)], tn([128, 128, 132]), 1, .5);
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(ic)); gable(b, H, 5, tn(sh(ic, .7)), true);
    if (hi) for (let s = .1; s < .95; s += .09) LN(FP(b, 'L', s, 1), FP(b, 'L', s, H - 1), sh(ic, .86));
    for (let d = 0; d < 2; d++) { const s0 = .12 + d * .42; fq(b, 'L', s0, s0 + .26, 0, 7.4, tn([196, 200, 208]), 0, 0); if (hi) for (let z = 1; z < 7.4; z += 1.4) LN(FP(b, 'L', s0, z), FP(b, 'L', s0 + .26, z), [150, 154, 164]); }
    wins(b, 'R', 2, 1, 6, 9.4, .2, t.ab); blk(.38, -.1, .46, .14, 0, 3, mat([110, 112, 120]), true);
    for (const q of [[-.3, .38, 0], [-.18, .38, 1], [-.24, .38, 2]]) { blk(q[0] - .05, q[1] - .05, q[0] + .05, q[1] + .05, q[2] * 4, q[2] * 4 + 4, mat(pick([[200, 120, 60], [60, 120, 190], [190, 190, 60]], q[0] * 20 | 0)), true); }
    minicar(.2, .42, 'u', [236, 236, 238]); blk(.26, .38, .4, .46, 3.2, 8.2, mat(tn([236, 236, 238])), true);
    cyl(.2, -.2, .05, H + 3, H + 7, [150, 154, 164], 6); smoke(.2, -.2, H + 7, 2);
  }

  function ind2(t) {
    const v = t.vr, tn = t.tn, ic = tn(pick(C.ind, v)), b = B(-.42, -.36, .12, .32), H = 14;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(ic)); flatRoof(b, H, ic, 1); if (hi) { for (let s = .08; s < .95; s += .07) LN(FP(b, 'L', s, 1), FP(b, 'L', s, H - 1), sh(ic, .85)); for (let s = .1; s < .95; s += .12) LN(FP(b, 'R', s, 1), FP(b, 'R', s, H - 1), sh(ic, .6)); }
    wins(b, 'L', 4, 1, 8, 12, .08, t.ab); door(b, 'L', .42, .62, 6, tn([70, 74, 84]), t.ab);
    for (let q = 0; q < 2; q++) { const u = -.3 + q * .18; blk(u, -.3, u + .09, -.21, H, H + 24 - q * 4, mat(tn([200, 90, 70])), true); for (let z = H + 4; z < H + 20; z += 8) fq(B(u, -.3, u + .09, -.21), 'L', 0, 1, z, z + 3, tn([240, 240, 240]), 0, 0); smoke(u + .045, -.255, H + 24 - q * 4, 4); X.pt(P(u + .045, -.255, H + 25 - q * 4)[0], P(u + .045, -.255, H + 25 - q * 4)[1], A % 2 ? [255, 60, 60] : [100, 20, 20]); }
    cyl(.3, -.04, .14, 0, 16, tn([190, 194, 204]), 10); cone(.3, -.04, .14, 16, 3, tn([160, 164, 174])); if (hi) { LN(P(.3 + .13, -.04, 0), P(.3 + .13, -.04, 16), [60, 60, 66]); }
    LN(P(.12, .02, 8), P(.2, .02, 8), [90, 94, 104]); LN(P(.12, .04, 8), P(.2, .04, 8), [90, 94, 104]);
    if (mid) for (let i = 0; i < 4; i++) { const k = ((A * .15 + i * .25) % 1); PT(P(-.4 + k * .8, .4, 1.2), [40, 40, 44]); } if (hi) Q([P(-.42, .38, 0), P(.38, .38, 0), P(.38, .42, 0), P(-.42, .42, 0)], [70, 70, 78], 0, 0);
    lampPost(-.44, .44, 10);
  }

  function ind3(t) {
    const v = t.vr, tn = t.tn, ic = tn(pick(C.ind, v)), b = B(-.44, -.4, .1, .34), H = 18;
    blk(b.u0, b.v0, b.u1, b.v1, 0, H, mat(ic)); if (hi) for (let s = .06; s < .95; s += .06) LN(FP(b, 'L', s, 1), FP(b, 'L', s, H - 1), sh(ic, .85));
    for (let d = 0; d < 3; d++) { const bb = B(b.u0 + .09 + d * .17, b.v0 + .04, b.u0 + .22 + d * .17, b.v1 - .04); blk(bb.u0, bb.v0, bb.u1, bb.v1, H, H + 5, mat(sh(ic, .8)), true); fq(bb, 'R', .1, .9, H + 1, H + 4, tn([150, 200, 235]), 0, 0); }
    wins(b, 'L', 4, 1, 9, 15, .08, t.ab); door(b, 'L', .42, .58, 7, tn([60, 64, 74]), t.ab);
    cyl(.26, -.24, .13, 0, 34, tn([204, 204, 208]), 10); cyl(.26, -.24, .1, 34, 40, tn([186, 186, 190]), 8); if (!t.ab) { for (let i = 0; i < 6; i++) { const tt = ((A * .25 + i * .6) % 4) / 4, p = P(.26, -.24, 40); X.pt(p[0] + Math.sin(A * .4 + i) * (2 + tt * 3), p[1] - tt * 14, mix([240, 244, 250], [150, 156, 166], tt)); X.pt(p[0] + 1 + Math.sin(A * .4 + i) * (2 + tt * 3), p[1] - tt * 14, mix([240, 244, 250], [150, 156, 166], tt)); } }
    blk(.3, .0, .4, .1, 0, 44, mat(tn([180, 182, 190])), true); for (let z = 8; z < 44; z += 10) fq(B(.3, .0, .4, .1), 'L', 0, 1, z, z + 3, tn([236, 236, 240]), 0, 0); X.pt(P(.35, .05, 45)[0], P(.35, .05, 45)[1], A % 2 ? [255, 50, 50] : [100, 20, 20]); X.emP(P(.35, .05, 45)[0], P(.35, .05, 45)[1], [255, 60, 60], 1);
    const fl = P(.3, .3, 20); LN(P(.3, .3, 0), fl, [150, 150, 158]); if (!t.ab) for (let i = 0; i < 5; i++) { const q = [fl[0] + Math.sin(A * .8 + i * 2) * 1.5, fl[1] - 1 - ((A * .5 + i) % 3) * 2]; X.pt(q[0], q[1], i % 2 ? [255, 200, 60] : [255, 110, 30]); X.emP(q[0], q[1], [255, 150, 40], 1); }
    for (let i = 0; i < 3; i++) blk(-.3 + i * .12, .38, -.2 + i * .12, .46, 0, 3.2, mat(pick([[200, 70, 60], [60, 110, 190], [220, 180, 50]], v + i)), true);
    if (mid) { const k = (A * .2) % 1; PT(P(-.4 + k * .6, .36, 11), [40, 40, 44]); }
  }

  return { ind1, ind2, ind3 };
}
