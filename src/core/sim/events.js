import { K, D4 } from '../constants.js';

export const eventsMethods = {
  riotDay() {
    const N = this.N; let np = 0, ns = 0, p;
    for (let i = 0; i < this.riot.length; i++) if (this.riot[i] && !this.built[i]) { this.riot[i] = 0; this.riotT[i] = 0; }
    for (const i of this.bl) {
      const k = this.kind[i]; if (k === K.COM || this.isSky(k)) continue;
      if (this.ab[i] || this.cons.has(i)) { this.riot[i] = 0; continue; }
      p = '(' + (i % N) + ',' + ((i / N) | 0) + ')';
      if (this.riot[i]) {
        const calm = k === K.RES ? (this.apP >= 40 && this.riskAt(i) <= 45) : this.apP >= 34;
        if (calm && this.rand() < 0.3) {
          this.riot[i] = 0; this.riotT[i] = 8; this.assign.delete('p' + i);
          this.log('A calma voltou em ' + p, 'good'); continue;
        }
        if (this.riotT[i] < 250) this.riotT[i]++;
        if (this.riotT[i] >= 12 && !this.fire[i] && this.rand() < 0.04) {
          this.fire[i] = 18; this.stats.fires++;
          this.log('🔥 Barricada em chamas em ' + p + '!', 'bad');
        }
        if (!this.assign.has('p' + i)) this.dispatch('police', i);
        if (k === K.RES) np++; else ns++;
        continue;
      }
      if (this.riotT[i] > 0) { this.riotT[i]--; continue; }
      const go = k === K.RES ? (this.cls[i] === 0 && this.apP < 35 && (this.riskAt(i) > 45 || (this.hap[i] < 25 && this.tax.r > 14))) : (k === K.IND && this.apP < 30);
      if (go && this.rand() < 0.12) {
        this.riot[i] = 1; this.riotT[i] = 1;
        if (k === K.RES) np++; else ns++;
        this.log((k === K.RES ? '✊ Protesto em ' : '✊ Greve operária em ') + p, 'bad');
      }
    }
    this.nProt = np; this.strikes = ns;
  },
  fireDay() {
    const N = this.N, n = N * N, fighting = new Set();
    this.veh.forEach(v => { if (v.kind === 'fire' && v.state === 'work') fighting.add(v.tgt); });

    // Seção 4 do Planejamento: Modelo Probabilístico Cumulativo P_dia = 1 - e^(-lambda)
    for (let a = 0, A = 1 + ((this.builtCount / 120) | 0); a < A; a++) {
      const i = this.pivotOf((this.rand() * n) | 0), k = this.kind[i];
      if (!this.built[i] || k === K.PARK || k === K.ROAD || this.fire[i]) continue;

      const typeMult = k === K.IND ? 2.8 : k === K.COAL ? 3.5 : (k === K.COM || this.isSky(k)) ? 1.4 : 1.0;
      const coverageRate = Math.min(1.0, (this.cFir[i] || 0) / 100);
      const neglectBonus = 1 + Math.min(3, (this.neglectDays[i] || 0) * 0.15); // Negligência temporal

      // Taxa lambda_fogo
      const lambdaFire = 0.007 * typeMult * (1.05 - coverageRate) * neglectBonus;
      const pFire = 1 - Math.exp(-lambdaFire);

      if (this.rand() < pFire) {
        this.fire[i] = 18; this.stats.fires++;
        this.log('🔥 Incêndio deflagrado em (' + (i % N) + ',' + ((i / N) | 0) + ')!', 'bad');
      }
    }
    for (let i = 0; i < n; i++) {
      if (!this.fire[i]) { this.assign.delete('f' + i); continue; }
      if (fighting.has(i)) this.fire[i] = Math.max(0, this.fire[i] - 45);
      else this.fire[i] = Math.min(255, this.fire[i] + 14 + (this.cFir[i] < 20 ? 6 : 0));
      if (!this.fire[i]) {
        this.log('🧯 Incêndio apagado em (' + (i % N) + ',' + ((i / N) | 0) + ')', 'good');
        this.assign.delete('f' + i); continue;
      }
      if (this.fire[i] >= 100) {
        this.log('🏚️ Prédio destruído pelo fogo em (' + (i % N) + ',' + ((i / N) | 0) + ')', 'bad');
        this.fire[i] = 0; this.assign.delete('f' + i); this.puff(i, 'dust');
        const wasZ = this.isZone(this.kind[i]), zK = this.kind[i];
        this.clearFootprint(i); if (wasZ) this.kind[i] = zK; this.dirty = true; continue;
      }
      if (this.fire[i] >= 45) {
        for (const d of D4) {
          const x = (i % N) + d[0], y = ((i / N) | 0) + d[1];
          if (this.ok(x, y)) {
            const j = this.pivotOf(y * N + x);
            if (this.built[j] && !this.fire[j] && this.kind[j] !== K.ROAD && this.kind[j] !== K.PARK && this.rand() < 0.2) this.fire[j] = 15;
          }
        }
      }
      if (!this.assign.has('f' + i)) this.dispatch('fire', i);
    }
  },
  crimeDay() {
    const N = this.N;
    if (this.bl.length) {
      for (let a = 0, A = 1 + ((this.builtCount / 70) | 0); a < A; a++) {
        const i = this.bl[(this.rand() * this.bl.length) | 0];
        if (this.ab[i] || this.crimes.some(c => c.i === i)) continue;

        // Modelo Probabilístico Cumulativo P_crime
        const policeCoverage = Math.min(1.0, (this.cPol[i] || 0) / 100);
        const unempRisk = 1 + (this.unemp || 0) * 2.2;
        const lambdaCrime = 0.009 * unempRisk * (1.1 - policeCoverage);
        const pCrime = 1 - Math.exp(-lambdaCrime);

        if (this.rand() < pCrime) {
          this.crimes.push({ i, age: 0, done: false });
          this.log('🚨 Crime em (' + (i % N) + ',' + ((i / N) | 0) + ')', 'bad');
          this.dispatch('police', i);
        }
      }
      let s = 0, c = 0;
      for (let t = 0; t < 40; t++) { s += this.riskAt(this.bl[(this.rand() * this.bl.length) | 0]); c++; }
      this.crimeIdx = Math.round(s / c);
    }
    this.crimes = this.crimes.filter(c => {
      if (c.done) { this.assign.delete('p' + c.i); return false; }
      if (++c.age >= 4) {
        this.funds -= 12 * (this.lvl[c.i] || 1);
        this.cr[c.i] = Math.min(40, this.cr[c.i] + 12);
        this.stats.lost++;
        this.log('💸 Criminoso escapou em (' + (c.i % N) + ',' + ((c.i / N) | 0) + ') — falta polícia!', 'bad');
        this.assign.delete('p' + c.i); this.dirty = true; return false;
      }
      if (!this.assign.has('p' + c.i)) this.dispatch('police', c.i);
      return true;
    });
  }
};
