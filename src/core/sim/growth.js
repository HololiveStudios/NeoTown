import { K } from '../constants.js';

export const growthMethods = {
  // Pilar 3: Algoritmo de Entropia Visual (Anti-Monotonia)
  // Aplica peso inversamente proporcional aos modelos já instanciados na vizinhança 7x7 e global
  pickEntropyVariant(i, k, lvl, numStyles = 4) {
    const N = this.N, x0 = i % N, y0 = (i / N) | 0;
    const localCounts = new Array(numStyles).fill(0);

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const nx = x0 + dx, ny = y0 + dy;
        if (nx >= 0 && ny >= 0 && nx < N && ny < N) {
          const j = ny * N + nx;
          if (this.built[j] && this.kind[j] === k && this.lvl[j] === lvl) {
            const st = this.vr[j] % numStyles;
            localCounts[st]++;
          }
        }
      }
    }

    // Calcula pesos inversamente proporcionais: W(s) = 1 / (1 + 3 * C_local)^1.5
    let totalWeight = 0;
    const weights = new Array(numStyles);
    for (let s = 0; s < numStyles; s++) {
      const w = 1.0 / Math.pow(1 + 3.0 * localCounts[s], 1.5);
      weights[s] = w;
      totalWeight += w;
    }

    let rnd = this.rand() * totalWeight;
    let chosenStyle = 0;
    for (let s = 0; s < numStyles; s++) {
      if (rnd <= weights[s]) {
        chosenStyle = s;
        break;
      }
      rnd -= weights[s];
    }

    const upperTint = (this.rand() * 64) | 0;
    return (upperTint * numStyles) + chosenStyle;
  },

  tryCoalesceSkyscraper(i) {
    const N = this.N, x0 = i % N, y0 = (i / N) | 0, k = this.kind[i];
    if ((k !== K.RES && k !== K.COM) || x0 + 1 >= N || y0 + 1 >= N) return false;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const j = (y0 + dy) * N + (x0 + dx);
      if (this.kind[j] !== k || !this.built[j] || this.lvl[j] < 3 || this.ab[j] || this.cons.has(j) || (this.bSize[j] || 1) !== 1) return false;
      // Respeita edifícios históricos
      if (this.untouchable && this.untouchable[j]) return false;
    }
    this.placeFootprint(x0, y0, k === K.RES ? K.SKY_RES : K.SKY_COM, 2, false, 3);
    return true;
  },

  growth() {
    const zl = this.zl;
    if (!zl.length) return;
    const d = this.demand, m = Math.max(3, Math.ceil(zl.length * 0.12));
    for (let t = 0; t < m; t++) {
      const i = zl[(this.rand() * zl.length) | 0], k = this.kind[i];
      if (!this.isZone(k)) continue;
      const dm = k === K.RES ? d.r : k === K.COM ? d.c : d.i;
      const ok = this.roadAdj[i] && this.pwOn[i] && this.wtOn[i];
      const piv = this.pivotOf ? this.pivotOf(i) : i;

      // Respeita edifícios tombados pelo jogador como patrimônio histórico/intocável
      const isHistorical = this.untouchable && this.untouchable[piv];

      if (!this.built[i]) {
        // Seção 2: Constrói imediatamente com canteiro de obras se houver zoneamento
        this.built[i] = 1; this.lvl[i] = 1; this.nd[i] = 0; this.ab[i] = 0;
        this.vr[i] = this.pickEntropyVariant(i, k, 1, 4);
        this.pivot[i] = i; this.bSize[i] = 1;
        this.cons.set(i, { p: 0, from: 0, dur: k === K.RES ? 2.2 : k === K.COM ? 2.6 : 3.0 });
        this.dirty = true;
        continue;
      }

      if (isHistorical) continue;

      if (k === K.RES && this.cls[i] === 2 && this.tax.r > 18 && this.rand() < 0.25) {
        this.built[i] = 0; this.lvl[i] = 0; this.nd[i] = 0; this.pivot[i] = -1; this.bSize[i] = 0;
        this.dirty = true; this.flight++; continue;
      }
      if (this.ab[i]) {
        if (ok) this.ab[i] = 0;
        else if (this.rand() < 0.35) {
          this.built[i] = 0; this.lvl[i] = 0; this.ab[i] = 0; this.nd[i] = 0; this.pivot[i] = -1; this.bSize[i] = 0;
          this.dirty = true;
        }
        continue;
      }
      if (!ok) {
        if (++this.nd[i] >= 4) { this.ab[i] = 1; this.dirty = true; }
        continue;
      }
      this.nd[i] = 0;

      // Pilar 2: Upgrade condicionado à Qualidade de Vida (QoL) e Demanda
      const qol = this.qolAt ? this.qolAt(i) : (this.land[i] || 40);

      if (this.lvl[i] < 3 && this.hap[i] >= 60 && dm > 0.12) {
        const requiredQoL = this.lvl[i] === 1 ? 40 : 68;
        if (qol >= requiredQoL && this.rand() < 0.3) {
          this.cons.set(i, { p: 0, from: this.lvl[i], dur: 1 });
          this.lvl[i]++;
          this.vr[i] = this.pickEntropyVariant(i, k, this.lvl[i], 3);
          this.dirty = true;
        }
      } else if (this.lvl[i] === 3 && this.hap[i] >= 74 && qol >= 76 && dm > 0.2 && this.rand() < 0.18 && this.tryCoalesceSkyscraper(i)) {
        this.dirty = true;
      } else if ((this.hap[i] < 28 || qol < 22 || dm < -0.35) && this.rand() < 0.25) {
        if (this.lvl[i] > 1) {
          this.lvl[i]--;
          this.vr[i] = this.pickEntropyVariant(i, k, this.lvl[i], 3);
        } else {
          this.built[i] = 0; this.lvl[i] = 0; this.pivot[i] = -1; this.bSize[i] = 0;
        }
        this.dirty = true;
      }
    }
  }
};
