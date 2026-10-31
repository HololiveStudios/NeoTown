import { BIO, K, KN, FAC, CLSN, POPCAP, CAPM, JOBC, JOBI } from '../constants.js';
import { clamp } from '../math/util.js';

export const inspectMethods = {
  inspect(x, y) {
    const N = this.N, rawI = y * N + x, i = this.pivotOf(rawI), k = this.kind[i], sz = this.bSize[i] || 1, L = [];
    const nm = k ? KN[k] : ['Água', 'Planície', 'Floresta', 'Colinas'][this.bio[rawI]];
    const hAvg = this.getTerrainHeight(x, y).toFixed(1);
    L.push(nm + ' (' + x + ',' + y + ') | Alt ' + hAvg + 'm' + (sz > 1 ? ' [' + sz + 'x' + sz + ']' : ''));
    if (this.bText.has(i)) L.push('🏷️ ' + this.bText.get(i));
    if (this.cons.has(i)) L.push('🏗️ Em obra: ' + Math.round(this.cons.get(i).p * 100) + '%');
    const qol = this.qolAt ? this.qolAt(i) : (this.land[i] || 40);
    if (this.isZone(k) || k === K.SKY_RES || k === K.SKY_COM || k === K.MEGA) {
      if (!this.built[i]) L.push('Zona vazia');
      else {
        L.push('Nível ' + this.lvl[i] + (k !== K.IND ? ' [Classe ' + CLSN[this.cls[i]] + ']' : '') + (this.ab[i] ? ' ABANDONADO' : '') + ' | ' + ((k === K.RES || k === K.SKY_RES) ? 'Moradores ' + this.popAt(i) : 'Empregos ' + this.jobsAt(i)));
        L.push('Qualidade de Vida (QoL): ' + qol + '/100');
        if (this.untouchable && this.untouchable[i]) {
          L.push('🏛️ PATRIMÔNIO HISTÓRICO (Preservado)');
        }
      }
      const need = [];
      if (!this.roadAdj[i]) need.push('rua');
      if (!this.pwOn[i]) need.push('energia');
      if (!this.wtOn[i]) need.push('água');
      L.push(need.length ? 'Falta: ' + need.join(', ') : 'Necessidades OK');
      if (this.built[i]) L.push('Felicidade ' + this.hap[i] + '%');
      if (this.riot[i]) L.push(k === K.IND ? '⚠️ EM GREVE!' : '⚠️ EM PROTESTO!');
    } else if (FAC[k] && FAC[k].r) L.push('Raio ' + FAC[k].r + ' tiles' + (k !== K.PARK && !this.pwOn[i] ? ' | SEM ENERGIA' : ''));
    else if (FAC[k] && FAC[k].pow) L.push('Gera ' + FAC[k].pow + ' MW');
    else if (FAC[k] && FAC[k].wat) L.push('Fornece ' + FAC[k].wat + ' L');
    if (this.bio[rawI] !== BIO.WATER) L.push('Valor ' + this.land[i] + ' | Polui ' + this.poll[i] + ' | Pol ' + this.cPol[i] + ' Bomb ' + this.cFir[i] + ' Saúde ' + this.cHea[i] + ' Edu ' + this.cEdu[i]);
    if (this.fire[i]) L.push('🔥 EM CHAMAS ' + this.fire[i] + '%');
    return {
      title: nm,
      lines: L,
      tileIndex: i,
      isBuilt: !!this.built[i],
      isUntouchable: !!(this.untouchable && this.untouchable[i])
    };
  },
  popAt(i) {
    if (!this.isOrigin(i) || !this.built[i] || this.ab[i] || this.newCons(i)) return 0;
    const k = this.kind[i];
    if (k === K.SKY_RES) return Math.round(FAC[K.SKY_RES].pop * (0.6 + 0.4 * clamp(this.hap[i] / 100, 0, 1)));
    return k === K.RES ? Math.round(POPCAP[this.lvl[i] - 1] * CAPM[this.cls[i]] * (0.5 + 0.5 * clamp(this.hap[i] / 100, 0, 1))) : 0;
  },
  jobsAt(i) {
    if (!this.isOrigin(i) || !this.built[i] || this.ab[i] || this.riot[i] || this.newCons(i)) return 0;
    const k = this.kind[i];
    if (k === K.SKY_COM || k === K.MEGA || k === K.LANDMARK) return FAC[k].jobs || 0;
    return k === K.COM ? JOBC[this.lvl[i] - 1] : k === K.IND ? JOBI[this.lvl[i] - 1] : 0;
  },
  newCons(i) {
    const c = this.cons.get(this.pivotOf(i));
    return !!c && c.from === 0;
  },
  puff(i, kind) {
    if (this.fx.length < 60) this.fx.push({ x: i % this.N, y: (i / this.N) | 0, t: 0, kind });
  }
};
