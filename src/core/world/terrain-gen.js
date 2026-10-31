import { BIO } from '../constants.js';
import { clamp } from '../math/util.js';
import { fbm, ridgedFbm } from '../math/noise.js';

export const terrainGenMethods = {
  genTerrain(type) {
    const N = this.N, N1 = N + 1, s = this.seed, r = () => this.rand();
    const cell = Math.max(7, N / 3.2), c = N * 0.5;

    // Configuração hidrológica procedural: todo mapa possui rios sinuosos reais e naturais
    const horiz = (s & 1) === 1;
    const rvOffset = (r() - 0.5) * N * 0.22;
    const rvAmp1 = N * (0.12 + r() * 0.09);
    const rvAmp2 = N * (0.04 + r() * 0.04);
    const rvFreq1 = 1.15 + r() * 0.9;
    const rvFreq2 = 2.6 + r() * 1.2;
    const rvPh1 = r() * 6.283;
    const rvPh2 = r() * 6.283;
    const rvWidth = (type === 'river' ? 2.4 : 1.85) + N / 44;

    // Afluente secundário que deságua no rio principal
    const hasTrib = type !== 'island' || r() > 0.35;
    const joinT = 0.35 + r() * 0.3;
    const tribSide = r() > 0.5 ? 1 : -1;
    const tribPh = r() * 6.283;
    const tribWidth = Math.max(1.35, rvWidth * 0.72);

    // Lago orgânico (deformado por ruído, nunca um círculo perfeito) quando type === 'lake'
    const lk = type === 'lake'
      ? { x: c + (r() - 0.5) * N * 0.24, y: c + (r() - 0.5) * N * 0.24, rad: N * (0.18 + r() * 0.06) }
      : null;

    const riverCenterAt = (tNorm) => {
      return c + rvOffset
        + rvAmp1 * Math.sin(tNorm * rvFreq1 * Math.PI + rvPh1)
        + rvAmp2 * Math.cos(tNorm * rvFreq2 * Math.PI + rvPh2);
    };

    /* Fase 0: Altimetria E(x,y) por octavas de ruído + escavação orgânica de bacias hidrográficas */
    for (let cy = 0; cy <= N; cy++) for (let cx = 0; cx <= N; cx++) {
      const wx = cx + (fbm(cx, cy, s + 101, cell * 0.75, 3) - 50) * 0.18;
      const wy = cy + (fbm(cx + 31, cy + 17, s + 203, cell * 0.75, 3) - 50) * 0.18;

      // E(x, y) = 0.7 * Noise_baixa_freq + 0.3 * Noise_alta_freq
      const nLow = fbm(wx, wy, s, cell, 4);
      const nHigh = fbm(wx * 2.4, wy * 2.4, s + 313, cell, 2);
      const ridge = ridgedFbm(wx, wy, s + 409, cell * 0.95, 3);
      let e = (nLow * 0.7 + nHigh * 0.3) * 0.76 + ridge * 0.24;

      // Mantém planícies construíveis abundantes (~42..58) com colinas suaves nas bordas
      e = 38 + (e - 35) * 0.72;

      const dx = (cx - c) / (N * 0.5), dy = (cy - c) / (N * 0.5);
      const warpEdge = (fbm(cx, cy, s + 701, cell * 0.6, 2) - 50) * 0.008;
      const dNorm = Math.hypot(dx, dy) + warpEdge;

      if (type === 'island') {
        e -= Math.max(0, dNorm - 0.52) * 95;
      } else if (dNorm > 0.72) {
        e += (dNorm - 0.72) * 26;
      }

      // Escavação do Rio Principal com meandros e margens suaves de areia
      const tMain = (horiz ? cx : cy) / N;
      const ortho = horiz ? cy : cx;
      const rCenter = riverCenterAt(tMain) + (fbm(cx, cy, s + 555, 6.5, 2) - 50) * 0.08;
      let distRiver = Math.abs(ortho - rCenter);

      // Escavação do Afluente
      if (hasTrib) {
        const dt = tMain - joinT;
        if (dt * tribSide > -0.05) {
          const prog = Math.max(0, dt * tribSide);
          const tribTarget = rCenter + tribSide * prog * N * 0.75 + Math.sin(prog * 5.0 + tribPh) * (N * 0.06);
          const distTrib = Math.abs(ortho - tribTarget) / (0.72);
          if (prog > 0) distRiver = Math.min(distRiver, distTrib * (rvWidth / tribWidth));
        }
      }

      const bankSpan = rvWidth * 2.45;
      if (distRiver < bankSpan) {
        const rt = clamp(distRiver / bankSpan, 0, 1);
        const smoothBank = rt * rt * (3 - 2 * rt);
        const bedElev = distRiver < rvWidth ? 14 : 26;
        e = Math.min(e, bedElev * (1 - smoothBank) + Math.min(e, 44) * smoothBank);
      }

      // Se houver lago, deforma o contorno com FBM para formato de baía natural (sem círculo)
      if (lk) {
        const lWarp = 1 + (fbm(cx * 1.4, cy * 1.4, s + 887, 5.5, 3) - 50) * 0.012;
        const dl = Math.hypot(cx - lk.x, cy - lk.y) * lWarp;
        if (dl < lk.rad * 1.4) {
          const lt = clamp(dl / (lk.rad * 1.4), 0, 1);
          const ls = lt * lt * (3 - 2 * lt);
          e = Math.min(e, 12 * (1 - ls) + e * ls);
        }
      }

      e = clamp(e, 0, 100);
      this.elevF[cy * N1 + cx] = e;
      this.cornerH[cy * N1 + cx] = e < 34 ? 0 : Math.min(9, 1 + Math.floor((e - 34) / 8.5));
    }

    /* Fase 1: Classificação por Umidade M(x,y) e Elevação E(x,y) sem recortes circulares */
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, i0 = y * N1 + x;
      const h0 = this.cornerH[i0], h1 = this.cornerH[i0 + 1], h2 = this.cornerH[i0 + N1 + 1], h3 = this.cornerH[i0 + N1];
      const eAvg = (this.elevF[i0] + this.elevF[i0 + 1] + this.elevF[i0 + N1 + 1] + this.elevF[i0 + N1]) * 0.25;

      // M(x, y) = Noise((x + 500) * 0.12, (y + 500) * 0.12) com micro-variação para bosques orgânicos
      const mMacro = fbm(x + 500, y + 500, s ^ 0x9e37, 8.2, 3);
      const mMicro = fbm(x + 120, y - 80, s ^ 0x51ed, 3.2, 2);
      const m = clamp(mMacro * 0.75 + mMicro * 0.25 + (48 - eAvg) * 0.15, 0, 100);
      this.moisture[i] = m | 0;

      const isWater = (h0 === 0 && h1 === 0 && h2 === 0 && h3 === 0) || eAvg < 33.8;
      if (isWater) {
        this.bio[i] = BIO.WATER;
        this.cornerH[i0] = this.cornerH[i0 + 1] = this.cornerH[i0 + N1 + 1] = this.cornerH[i0 + N1] = 0;
      } else if (m > 54 && eAvg >= 36.5) {
        this.bio[i] = BIO.FOREST;
      } else {
        // Sem bioma de pedra cinza: colinas e elevações são pastagens e relevos verdejantes naturais
        this.bio[i] = BIO.PLAIN;
      }
    }
    this.updateSlopeMasks();
  }
};
