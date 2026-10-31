import { K, KN, FAC } from '../constants.js';

export const DRAFTS = new Map();

export const Draft = {
  append(d) {
    DRAFTS.set(d.id, Object.assign({ w: d.sz || 1, h: d.sz || 1, needsRoad: true }, d));
    return DRAFTS.get(d.id);
  },
  merge(d) {
    const cur = DRAFTS.get(d.id) || {};
    DRAFTS.set(d.id, Object.assign(cur, d));
    return DRAFTS.get(d.id);
  },
  getDraft(id) {
    return DRAFTS.get(id) || null;
  },
  getDrafts() {
    return Array.from(DRAFTS.values());
  }
};

export function initDefaultDrafts() {
  KN.forEach((nm, k) => {
    if (k > 0) {
      Draft.append({
        id: '$b_' + k,
        k,
        title: nm,
        sz: (FAC[k] && FAC[k].sz) || 1,
        needsRoad: k !== K.PARK && k !== K.COAL && k !== K.SOLAR && k !== K.WTOWER
      });
    }
  });
}

initDefaultDrafts();
