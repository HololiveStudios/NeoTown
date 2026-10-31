import { BIO, K } from '../constants.js';
import { hash2 } from '../math/util.js';

export const starterMethods = {
  starter() {
    const N = this.N, c = N >> 1, I = (x, y) => y * N + x;
    this.flattenArea(c - 8, c - 8, 16, 16, 2);
    const road = (x, y) => {
      if (!this.ok(x, y)) return;
      const i = I(x, y); if (this.bio[i] === BIO.WATER) return;
      this.kind[i] = K.ROAD; this.built[i] = 1; this.pw[i] = 1; this.pipe[i] = 1; this.pivot[i] = -1; this.bSize[i] = 1;
    };
    /* Malha viaria de avenidas centrais */
    for (let d = -8; d <= 8; d++) {
      road(c + d, c - 4); road(c + d, c); road(c + d, c + 4);
      road(c - 4, c + d); road(c, c + d); road(c + 4, c + d);
    }
    /* Marcos Visuais e Arranha-Ceus de Grande Porte (3x3 e 2x2) ja construidos */
    this.placeFootprint(c + 1, c + 1, K.MEGA, 3, true, 3);
    this.bText.set(I(c + 1, c + 1), 'MEGA CENTER DELTA');
    this.placeFootprint(c - 3, c + 1, K.SKY_COM, 2, true, 3);
    this.placeFootprint(c + 1, c - 3, K.SKY_COM, 2, true, 3);
    this.placeFootprint(c - 3, c - 3, K.SKY_RES, 2, true, 3);
    this.placeFootprint(c - 6, c + 1, K.SKY_RES, 2, true, 3);
    this.placeFootprint(c + 5, c + 1, K.LANDMARK, 2, true, 3);

    /* Infraestrutura e Servicos Essenciais */
    const fac = (x, y, k) => { if (!this.ok(x, y) || this.bio[I(x, y)] === BIO.WATER) return; this.placeFootprint(x, y, k, 1, true, 1); this.pw[I(x, y)] = 1; this.pipe[I(x, y)] = 1; };
    fac(c - 8, c, K.COAL); fac(c - 8, c - 4, K.SOLAR); fac(c + 8, c, K.WTOWER);
    fac(c - 3, c + 3, K.POLICE); fac(c + 3, c - 3, K.FIRE); fac(c + 5, c - 3, K.HOSP); fac(c - 6, c - 3, K.SCHOOL);
    fac(c - 1, c + 3, K.PARK); fac(c + 3, c - 1, K.PARK);

    /* Edificios RCI 1x1 de media e alta densidade ao redor do centro */
    const rci = (x, y, k, lv) => {
      if (!this.ok(x, y)) return; const i = I(x, y);
      if (this.kind[i] || this.bio[i] === BIO.WATER) return;
      this.kind[i] = k; this.built[i] = lv > 0 ? 1 : 0; this.lvl[i] = lv; this.cls[i] = lv >= 3 ? 2 : 1;
      this.vr[i] = (hash2(x, y, this.seed + 9) * 2.5) | 0; this.pivot[i] = lv > 0 ? i : -1; this.bSize[i] = lv > 0 ? 1 : 0;
    };
    for (let d = 5; d <= 7; d++) {
      rci(c - d, c - 1, K.RES, d === 5 ? 3 : 2); rci(c - d, c - 2, K.RES, 2);
      rci(c + d, c - 1, K.COM, d === 5 ? 3 : 2); rci(c + d, c + 3, K.IND, 2);
      rci(c - 1, c - d, K.RES, d === 5 ? 3 : 2); rci(c + 1, c + d, K.COM, 2);
      rci(c - 2, c + d, K.RES, 1); rci(c + 2, c + d, K.IND, 1);
    }
  }
};
