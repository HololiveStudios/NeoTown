import { K, KN, DAY_MS, SPEEDS } from '../constants.js';

export const clockMethods = {
  update(dt) {
    this.anim += dt / 250;
    for (const f of this.fx) f.t += dt / 1000;
    if (this.fx.length) this.fx = this.fx.filter(f => f.t < (f.kind === 'done' ? 1.6 : 1.2));
    const f = SPEEDS[this.speed];
    if (!f || this.over) return;
    this.tod = (this.tod + dt / 120000) % 1;
    const e = dt * f;
    this.acc += e;
    this.cons.forEach((c, i) => {
      c.p += e / (DAY_MS * c.dur);
      if (c.p >= 1) {
        this.cons.delete(i);
        this.puff(i, 'done');
        this.dirty = true;
        if (this.kind[i] >= K.POLICE) this.log('🏗️ Obra concluída: ' + KN[this.kind[i]], 'good');
      }
    });
    while (this.acc >= DAY_MS) {
      this.acc -= DAY_MS;
      this.dayTick();
    }
    this.moveVehicles(e / 1000);
  },
  dayTick() {
    // Seção 1 do Planejamento: Atualização de Negligência Diária nos Lotes
    const n = this.N * this.N;
    for (let i = 0; i < n; i++) {
      if (this.built[i] && (this.isZone(this.kind[i]) || this.isSky(this.kind[i]))) {
        const lacksUtil = !this.wtOn[i] || !this.pwOn[i] || !this.roadAdj[i];
        if (lacksUtil) {
          if (this.neglectDays[i] < 365) this.neglectDays[i]++;
        } else {
          this.neglectDays[i] = 0;
        }
      } else {
        this.neglectDays[i] = 0;
      }
    }

    if (++this.day > 30) {
      this.day = 1;
      this.monthTick();
      if (++this.month > 12) {
        this.month = 1;
        this.year++;
      }
    }
    if (this.dirty || ++this.sinceCalc >= 3) this.recalc();
    this.growth();
    this.riotDay();
    this.fireDay();
    this.crimeDay();
    for (let i = 0; i < this.cr.length; i++) if (this.cr[i] && this.rand() < 0.1) this.cr[i]--;
  }
};
