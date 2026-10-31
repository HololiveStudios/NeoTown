import { K } from '../../core/constants.js';
import { clamp, hash2 } from '../../core/math/util.js';
import { sh, mix, pick, mat, FONT } from './palettes.js';
import { makePrimitives } from './primitives.js';
import { createConstruction } from './construction.js';
import { createResidential } from './residential.js';
import { createCommercial } from './commercial.js';
import { createIndustrial } from './industrial.js';
import { createServices } from './services.js';
import { createSkyscrapers } from './skyscrapers.js';

export const HEIGHT = {
  2: [16, 32, 62], 3: [14, 32, 78], 4: [20, 34, 46], 6: [20], 7: [34],
  8: [32], 9: [26], 10: [56], 11: [8], 12: [44], 5: [14],
  13: [82], 14: [110], 15: [130], 16: [96]
};

const B0 = (u0, v0, u1, v1) => ({ u0, v0, u1, v1 });
export const BOX = {
  2: [B0(-.34, -.3, .24, .2), B0(-.36, -.34, .34, .3), B0(-.4, -.4, .4, .38)],
  3: [B0(-.4, -.34, .22, .2), B0(-.4, -.38, .38, .3), B0(-.42, -.4, .4, .36)],
  4: [B0(-.42, -.3, .36, .3), B0(-.42, -.36, .3, .32), B0(-.44, -.4, .4, .34)]
};

export function make(X) {
  const ctx = makePrimitives(X);
  const { hw, hh, U, hi, mid, A, P, Q, PT, B, tree, cyl, blk, hull, person, lampPost, minicar, txt, FP, fq } = ctx;
  const { constructionSite } = createConstruction(ctx);
  const { res1, res2, res3 } = createResidential(ctx);
  const { com1, com2, com3 } = createCommercial(ctx);
  const { ind1, ind2, ind3 } = createIndustrial(ctx);
  const { police, fire, hosp, school, coal, solar, wtower, park } = createServices(ctx);
  const { skyRes, skyCom, megaTower, landmark } = createSkyscrapers(ctx);

  const DRAW = {
    [K.RES]: [(t) => {
      res1(t);
      if (t.cls === 2 && !t.ab && mid && (t.vr % 4) !== 3) {
        Q([P(.0, .28, .2), P(.22, .28, .2), P(.22, .44, .2), P(.0, .44, .2)], [80, 170, 236], 0, 0);
        tree(-.4, -.4, 15, [58, 140, 66], 1, 1.2);
      }
    }, res2, res3],
    [K.COM]: [com1, com2, com3],
    [K.IND]: [ind1, ind2, ind3],
    [K.POLICE]: [police],
    [K.POLICE_MED]: [police],
    [K.POLICE_LG]: [skyCom],
    [K.FIRE]: [fire],
    [K.FIRE_MED]: [fire],
    [K.FIRE_LG]: [skyCom],
    [K.HOSP]: [hosp],
    [K.HOSP_MED]: [hosp],
    [K.HOSP_LG]: [skyRes],
    [K.SCHOOL]: [school],
    [K.SCHOOL_MED]: [school],
    [K.SCHOOL_LG]: [skyCom],
    [K.COAL]: [coal],
    [K.SOLAR]: [solar],
    [K.WTOWER]: [wtower],
    [K.PARK]: [park],
    [K.SKY_RES]: [skyRes],
    [K.SKY_COM]: [skyCom],
    [K.MEGA]: [megaTower],
    [K.LANDMARK]: [landmark]
  };

  function drawAt(t) {
    const set = DRAW[t.k]; if (!set) return;
    const lv = Math.min(set.length, Math.max(1, t.lv)) - 1, fn = set[lv];
    t.tn = (c) => {
      const cl = t.cls | 0;
      if (t.k === K.RES || t.k === K.COM) {
        if (cl === 0) c = mix(sh(c, 0.88), [130, 122, 114], 0.3);
        else if (cl === 2) c = mix(c, [255, 232, 176], 0.14);
      }
      return t.ab ? sh(c, 0.55) : c;
    };
    const cs = t.cons;
    if (!cs) {
      fn(t);
      if (t.ab && hi) {
        for (let i = 0; i < 6; i++) {
          const p = P(-.3 + hash2(i, t.vr, 3) * .006, -.2 + hash2(i, t.vr, 4) * .004, 2 + hash2(i, t.vr, 5) * .1);
          PT(p, [30, 26, 24]);
        }
      }
      return;
    }
    const H = (HEIGHT[t.k] || [20])[Math.min(lv, (HEIGHT[t.k] || [20]).length - 1)];
    const bx = (BOX[t.k] || [])[lv] || B(-.36, -.34, .34, .3), p = cs.p;
    if (cs.from > 0) {
      const old = set[Math.min(set.length, cs.from) - 1];
      if (old && p < 0.5) old(t);
    }
    constructionSite(bx, H, p, H >= 24 || t.k >= K.POLICE && t.k !== K.PARK);
    const pr = clamp((p - 0.12) / 0.88, 0, 1), clipY = X.cy + hh - pr * (H * U + hw * 1.3);
    if (p > 0.12) {
      X.setClip(clipY);
      fn(t);
      X.setClip(-1e9);
      if (mid && pr < 1) {
        for (let i = 0; i < 4; i++) {
          const sx = X.cx + (hash2(i, A, 7) / 100 - .5) * hw * .9;
          X.pt(sx, clipY + (hash2(i, A, 8) / 100) * 3, [255, 200 + (i * 17) % 55, 60]);
          X.emP(sx, clipY, [255, 190, 80], 1);
        }
      }
    }
  }

  function fx(f) {
    const k = f.t, cx = X.cx, cy = X.cy;
    if (f.kind === 'dust') {
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * 6.2832, r = k * hw * (.5 + hash2(i, 1, 2) / 160), y = cy - k * hw * .4 * (.5 + hash2(i, 2, 3) / 100);
        const c = mix([196, 176, 150], [120, 110, 100], k / 1.2);
        X.pt(cx + Math.cos(a) * r, y + Math.sin(a) * r * .5, c);
        X.pt(cx + Math.cos(a) * r + 1, y + Math.sin(a) * r * .5, c);
        if (hi) X.pt(cx + Math.cos(a) * r, y + Math.sin(a) * r * .5 - 1, c);
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * 6.2832 + k, r = k * hw * .7, y = cy - k * hw * .9 - hw * .3;
        const c = [255, 240 - i * 6, 120 + i * 9];
        X.pt(cx + Math.cos(a) * r, y + Math.sin(a) * r * .4, c);
        X.pt(cx + Math.cos(a) * r + 1, y + Math.sin(a) * r * .4, c);
        X.emP(cx + Math.cos(a) * r, y + Math.sin(a) * r * .4, c, 1);
      }
    }
  }

  return { drawAt, tree, fx, cyl, blk, P, Q, B, mat, hull, person, lampPost, minicar, txt, FP, fq };
}

export const buildings = { make, sh, mix, pick, FONT };
