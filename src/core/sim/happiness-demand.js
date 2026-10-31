import { BIO, K, CITY_RANKS, FAC } from '../constants.js';
import { clamp } from '../math/util.js';

export const happinessDemandMethods = {
  // Seção 7: Capacidade Habitacional Física Realista por Edifício
  // Nível 1: Casa pequena/térrea (2 a 4 hab)
  // Nível 2: Sobrado/casa familiar ou prédio baixo (6 a 14 hab)
  // Nível 3: Edifício residencial médio (24 a 48 hab)
  // Sky / Condomínio 2x2: 140 a 280 hab
  popCapacityAt(i) {
    const k = this.kind[i];
    if (k === K.SKY_RES) return FAC[k] && FAC[k].pop ? FAC[k].pop : 240;
    if (k !== K.RES) return 0;
    const lvl = this.lvl[i] || 1;
    const vr = this.vr[i] || 0;
    if (lvl === 1) return 3 + (vr % 2);          // 3 a 4 moradores
    if (lvl === 2) return 8 + (vr % 7);          // 8 a 14 moradores
    return 28 + ((vr % 6) * 4);                  // 28 a 48 moradores
  },

  // Capacidade de Postos de Trabalho Reais
  jobsCapacityAt(i) {
    const k = this.kind[i];
    if (this.isSky(k)) return FAC[k] && FAC[k].jobs ? FAC[k].jobs : 60;
    const lvl = this.lvl[i] || 1;
    const vr = this.vr[i] || 0;
    if (k === K.COM) {
      if (lvl === 1) return 2 + (vr % 3);        // 2 a 4 funcionários
      if (lvl === 2) return 8 + (vr % 5);        // 8 a 12 funcionários
      return 22 + (vr % 8);                      // 22 a 29 funcionários
    }
    if (k === K.IND) {
      if (lvl === 1) return 4 + (vr % 4);        // 4 a 7 operários
      if (lvl === 2) return 12 + (vr % 6);       // 12 a 17 operários
      return 26 + (vr % 10);                     // 26 a 35 operários
    }
    return 0;
  },

  recalc() {
    this._recalcNetworks();
    const N = this.N, n = N * N, kd = this.kind;
    const { nRes: nR, nCom: nC, nInd: nI, emR, emC, emI } = this;
    let hs = 0, hp = 0, pop = 0, jc = 0, ji = 0, totalJobCapacity = 0;
    const popC = [0, 0, 0];
    let aH = 0, aE = 0, aP = 0, aL = 0, nr = 0;

    for (let i = 0; i < n; i++) {
      if (this.bio[i] === BIO.WATER) { this.land[i] = 0; continue; }
      const x = i % N, y = (i / N) | 0; let nat = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) {
          const bb = this.bio[ny * N + nx];
          if (bb === BIO.WATER || bb === BIO.FOREST) nat++;
        }
      }
      const elevBonus = Math.min(8, Math.max(0, this.getTerrainHeight(x, y) - 1) * 2);
      this.land[i] = clamp(Math.round(36 + elevBonus + Math.min(5, nat) * 3 + this.cPar[i] * 0.22 + this.cEdu[i] * 0.12 + this.cPol[i] * 0.08 - this.poll[i] * 0.5 - this.cr[i] * 0.8 + (this.roadAdj[i] ? 6 : 0)), 5, 100);
      if (!this.isOrigin(i)) continue;
      const k = kd[i]; if ((!this.isZone(k) && !this.isSky(k)) || !this.built[i]) continue;
      if (this.isSky(k)) this.cls[i] = 2;
      else if (k === K.IND) this.cls[i] = 0;
      else {
        const sc = this.land[i] + this.cEdu[i] / 3 + this.cHea[i] / 5 - this.poll[i] / 2 - this.cr[i] / 3;
        this.cls[i] = sc >= 72 && this.poll[i] < 25 ? 2 : sc >= 42 && this.poll[i] < 55 ? 1 : 0;
      }

      // Verificação essencial: Água, Energia e Acesso Viário
      const hasInfra = this.wtOn[i] && this.pwOn[i] && this.roadAdj[i];
      const isUnderCons = this.cons && this.cons.has(i);

      const tx = (k === K.RES || k === K.SKY_RES) ? this.tax.r : k === K.IND ? this.tax.i : this.tax.c;
      let h = 60 + this.cPol[i] * 0.12 + this.cFir[i] * 0.08 + this.cHea[i] * 0.1 + this.cEdu[i] * 0.06 + this.cPar[i] * 0.14 - this.poll[i] * 0.4 - this.cr[i] * 1.2 - (tx - 10) * 1.3;
      if (!this.pwOn[i]) h -= 25; if (!this.wtOn[i]) h -= 25; if (!this.roadAdj[i]) h -= 30; if (this.fire[i]) h -= 25;
      this.hap[i] = clamp(Math.round(h), 0, 100);

      // Ocupação progressiva: se a obra terminou e tem infraestrutura, atrai população/empregos
      if (k === K.RES || k === K.SKY_RES) {
        let p = 0;
        if (!isUnderCons && hasInfra) {
          const cap = this.popCapacityAt(i);
          // Ocupação real baseada em qualidade de vida local e felicidade
          const occRate = clamp(0.45 + (this.hap[i] - 40) / 100 + (this.demand.r || 0) * 0.35, 0.2, 1.0);
          p = Math.max(1, Math.round(cap * occRate));
        }
        pop += p; hs += this.hap[i] * p; hp += p; popC[this.cls[i]] += p;
        aH += this.cHea[i]; aE += this.cEdu[i]; aP += this.cPar[i]; aL += this.land[i]; nr++;
      } else if (k === K.IND) {
        let j = 0;
        const cap = this.jobsCapacityAt(i);
        totalJobCapacity += cap;
        if (!isUnderCons && hasInfra) {
          const occRate = clamp(0.5 + (this.demand.i || 0) * 0.4, 0.25, 1.0);
          j = Math.max(1, Math.round(cap * occRate));
        }
        ji += j;
      } else {
        let j = 0;
        const cap = this.jobsCapacityAt(i);
        totalJobCapacity += cap;
        if (!isUnderCons && hasInfra) {
          const occRate = clamp(0.5 + (this.demand.c || 0) * 0.4, 0.25, 1.0);
          j = Math.max(1, Math.round(cap * occRate));
        }
        jc += j;
      }
    }

    // Seção 8: Mercado de Trabalho Realista
    // Força de trabalho (PEA): ~55% da população total é economicamente ativa
    const pea = Math.round(pop * 0.55);
    const jobsTotal = jc + ji;
    const employed = Math.min(pea, jobsTotal);
    const unempCount = Math.max(0, pea - employed);
    const unempRate = pea > 0 ? clamp(unempCount / pea, 0, 1) : 0;

    this.pop = pop;
    this.popRes = pop;
    this.pea = pea;
    this.employed = employed;
    this.unempCount = unempCount;
    this.jobs = jobsTotal;
    this.jobsAvail = Math.max(0, totalJobCapacity - jobsTotal);
    this.unemp = unempRate;
    this.happy = hp ? Math.round(hs / hp) : 65;

    const boot = pop < 60 ? 0.6 : 0, rt = (8 - this.interest) / 12, T = this.tax;
    const pen = (em, b) => clamp((em - 8 - b * 0.6) * 0.03, 0, 0.6);
    const tgt = {
      r: clamp((jobsTotal - pea) / Math.max(30, jobsTotal + pea) * 2.2 + boot + (this.happy - 55) / 120 - (T.r - 10) / 18 + rt * 0.3 - pen(emR, nR), -1, 1),
      c: clamp((pop * 0.35 - jc) / Math.max(30, pop * 0.35 + jc) * 2.2 + boot * 0.6 - (T.c - 10) / 18 + rt - pen(emC, nC), -1, 1),
      i: clamp((pea - jobsTotal) / Math.max(30, pea + jobsTotal) * 2.2 + 0.1 + boot * 0.8 - (T.i - 10) / 18 + rt - pen(emI, nI), -1, 1)
    };
    ['r', 'c', 'i'].forEach(k => { this.demand[k] += (tgt[k] - this.demand[k]) * 0.4; });
    this.popC = popC;
    const q = nr || 1, T2 = this.tax, inf = this.inflation;
    this.apP = clamp(Math.round(58 - (T2.r - 10) * 2 - Math.max(0, inf - 3) * 3 - this.unemp * 55 - this.crimeIdx * 0.3 + aH / q * 0.12 + aE / q * 0.12 + aP / q * 0.1), 0, 100);
    this.apR = clamp(Math.round(52 - ((T2.r + T2.c + T2.i) / 3 - 10) * 2.5 - this.strikes * 3 - this.crimeIdx * 0.25 + (this.interest - 8) * 1.2 + (nr ? (aL / q - 45) * 0.5 : 0) + (this.funds > 0 ? 3 : -6)), 0, 100);

    // Sistema de Pontuação da Cidade e Ranks (0 a 6)
    const points = Math.max(0, Math.round(pop * 1.5 + (this.happy || 50) * 20 + (this.funds > 0 ? Math.min(2000, this.funds / 100) : 0)));
    this.cityPoints = points;
    let rank = 0;
    if (pop >= 100000) rank = 6;      // Metrópole
    else if (pop >= 50000) rank = 5;  // Grande Cidade
    else if (pop >= 15000) rank = 4;  // Cidade
    else if (pop >= 5000) rank = 3;   // Cidadezinha
    else if (pop >= 2000) rank = 2;   // Vila
    else if (pop >= 500) rank = 1;    // Povoado
    else rank = 0;                    // Assentamento

    if (this.cityRank !== undefined && rank > this.cityRank) {
      const newRankData = CITY_RANKS[rank];
      if (newRankData.bonus > 0) {
        this.funds += newRankData.bonus;
      }
      this.say(`🎉 SUBIU DE NÍVEL! Sua cidade agora é: ${newRankData.name}! [+$${newRankData.bonus}]`);
      this.log(`🎉 Evolução de Rank: Atingiu o nível ${rank} (${newRankData.name}) com ${pop} habitantes! Bônus municipal: +$${newRankData.bonus}. Desbloqueou: ${newRankData.unlocks}`, 'good');
      if (typeof window !== 'undefined' && window.DeltaCelebrateLevelUp) {
        window.DeltaCelebrateLevelUp(newRankData);
      }
    }
    this.cityRank = rank;
  },
  qolAt(i) {
    if (this.bio[i] === BIO.WATER) return 0;
    const land = this.land[i] || 40;
    const hea = this.cHea[i] || 0;
    const edu = this.cEdu[i] || 0;
    const par = this.cPar[i] || 0;
    const pol = this.poll[i] || 0;
    const cr = this.cr[i] || 0;
    const sc = land * 0.4 + hea * 0.2 + edu * 0.2 + par * 0.2 - pol * 0.3 - cr * 0.3;
    return clamp(Math.round(sc), 0, 100);
  },
  riskAt(i) {
    return clamp(30 + this.unemp * 60 + (50 - this.land[i]) * 0.6 - this.cPol[i] * 0.55, 0, 100);
  }
};
