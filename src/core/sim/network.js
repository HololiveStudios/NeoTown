import { K, FAC, D4 } from '../constants.js';
import { hash2 } from '../math/util.js';

export const networkMethods = {
  isZone(k) {
    return k === K.RES || k === K.COM || k === K.IND;
  },
  isPolice(k) {
    return k === K.POLICE || k === K.POLICE_MED || k === K.POLICE_LG;
  },
  isFire(k) {
    return k === K.FIRE || k === K.FIRE_MED || k === K.FIRE_LG;
  },
  isHosp(k) {
    return k === K.HOSP || k === K.HOSP_MED || k === K.HOSP_LG;
  },
  isSchool(k) {
    return k === K.SCHOOL || k === K.SCHOOL_MED || k === K.SCHOOL_LG;
  },
  isService(k) {
    return this.isPolice(k) || this.isFire(k) || this.isHosp(k) || this.isSchool(k);
  },
  isSky(k) {
    return k === K.SKY_RES || k === K.SKY_COM || k === K.MEGA || k === K.LANDMARK;
  },
  spread(i, r, arr, w) {
    const N = this.N, x0 = i % N, y0 = (i / N) | 0, ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) {
      const x = x0 + dx, y = y0 + dy; if (x < 0 || y < 0 || x >= N || y >= N) continue;
      const d = Math.hypot(dx, dy); if (d > r) continue;
      const j = y * N + x; arr[j] = Math.min(100, arr[j] + w * (1 - 0.7 * d / r));
    }
  },
  net(isSrc, flag, isConductiveBuilding) {
    const N = this.N, n = N * N, pc = new Uint8Array(n), q = [];
    for (let i = 0; i < n; i++) if (isSrc(i)) { pc[i] = 1; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % N, y = (i / N) | 0;
      // Salto ortogonal e diagonal em raio 2 para construções condutoras (ou adjacência 1 para fios puros)
      const maxJump = isConductiveBuilding ? 2 : 1;
      for (let dy = -maxJump; dy <= maxJump; dy++) for (let dx = -maxJump; dx <= maxJump; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        const j = ny * N + nx;
        if (!pc[j]) {
          // Conduz se tiver fio elétrico OU se for uma construção condutora de energia
          const canConduct = flag && flag[j];
          const isBuildingConductive = isConductiveBuilding && (this.built[j] || this.kind[j] >= 2);
          if (canConduct || isBuildingConductive) {
            pc[j] = 1;
            q.push(j);
          }
        }
      }
    }
    return pc;
  },
  near3(pc, i) {
    const N = this.N, x = i % N, y = (i / N) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < N && ny < N && pc[ny * N + nx]) return true;
    }
    return false;
  },
  _recalcNetworks() {
    const N = this.N, n = N * N, kd = this.kind;
    this.dirty = false; this.sinceCalc = 0;
    this.zl = []; this.bl = []; this.st = [];
    let bc = 0, roads = 0, nR = 0, nC = 0, nI = 0, emR = 0, emC = 0, emI = 0;
    for (let i = 0; i < n; i++) {
      const k = kd[i], x = i % N, y = (i / N) | 0;
      let ra = 0, nearDist = 99;
      // Adjacência direta D4
      for (const d of D4) {
        const nx = x + d[0], ny = y + d[1];
        if (nx >= 0 && ny >= 0 && nx < N && ny < N && kd[ny * N + nx] === K.ROAD) { ra = 1; nearDist = 1; break; }
      }
      // Seção 2: Profundidade Máxima de Zona (Faixa Viária de até 2 ladrilhos)
      if (!ra) {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist <= 2) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < N && ny < N && kd[ny * N + nx] === K.ROAD) {
                if (dist < nearDist) nearDist = dist;
              }
            }
          }
        }
      }
      this.roadAdj[i] = ra;
      if (this.roadDist) this.roadDist[i] = nearDist;
      if (k === K.ROAD) roads++;
      if (!this.isOrigin(i)) continue;
      if (this.isZone(k)) {
        this.zl.push(i);
        if (this.built[i]) { this.bl.push(i); bc++; if (k === K.RES) nR++; else if (k === K.COM) nC++; else nI++; }
        else if (k === K.RES) emR++; else if (k === K.COM) emC++; else emI++;
      } else if (this.isSky(k) && this.built[i]) {
        this.bl.push(i); bc++; if (k === K.SKY_RES) nR++; else nC++;
      } else if (this.built[i] && k !== K.ROAD) bc++;
      if (k === K.POLICE || k === K.FIRE) this.st.push(i);
    }
    /* Propaga roadAdj da borda da pegada multi-tile para o pivo */
    for (let i = 0; i < n; i++) if (this.bSize[i] > 1) {
      const sz = this.bSize[i], x0 = i % N, y0 = (i / N) | 0; let hasR = 0;
      for (let dy = 0; dy < sz && !hasR; dy++) for (let dx = 0; dx < sz; dx++) if (this.roadAdj[(y0 + dy) * N + (x0 + dx)]) { hasR = 1; break; }
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) this.roadAdj[(y0 + dy) * N + (x0 + dx)] = hasR;
    }
    Object.assign(this, { builtCount: bc, roads, nRes: nR, nCom: nC, nInd: nI, emR, emC, emI });
    // 2. Condução Estrutural de Energia (Fios + Edificações Condutoras em raio de 2 blocos)
    const pcP = this.net(i => (kd[i] === K.COAL || kd[i] === K.SOLAR) && !this.cons.has(i), this.pw, true);
    // 2.2 Transmissão de Água: Canos subterrâneos físicos
    const pcW = this.net(i => kd[i] === K.WTOWER && !this.cons.has(i), this.pipe, false);
    let pS = 0, wS = 0, pD = 0, wD = 0; const needP = [], needW = [];
    for (let i = 0; i < n; i++) {
      if (!this.isOrigin(i)) continue;
      const k = kd[i], sz = this.bSize[i] || 1, x0 = i % N, y0 = (i / N) | 0;
      if (!this.cons.has(i)) { if (k === K.COAL || k === K.SOLAR) pS += FAC[k].pow; else if (k === K.WTOWER) wS += FAC[k].wat; }
      const z = this.isZone(k), sk = this.isSky(k), lv = this.lvl[i], b = this.built[i];
      let nrP = false, nrW = false;
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
        const j = (y0 + dy) * N + (x0 + dx);
        if (this.near3(pcP, j)) nrP = true;
        if (this.near3(pcW, j)) nrW = true;
      }
      if (z || sk || this.isService(k)) {
        needP.push([i, nrP]);
        if (nrP && b) pD += sk ? (FAC[k].pw || 16) : z ? (k === K.IND ? 2 : 1) * lv * 2 : 3;
      }
      if (z || sk || this.isHosp(k) || this.isFire(k)) {
        needW.push([i, nrW]);
        if (nrW && b) wD += sk ? (FAC[k].wt || 12) : z ? (k === K.IND ? 3 : 1) * lv * 2 : 3;
      }
    }
    const rP = pD <= pS ? 1 : pS / pD, rW = wD <= wS ? 1 : wS / wD;
    this.pwOn.fill(0); this.wtOn.fill(0);
    needP.forEach(a => {
      const i = a[0], sz = this.bSize[i] || 1, x0 = i % N, y0 = (i / N) | 0;
      if (a[1] && (rP >= 1 || hash2(i, 1, 5) < rP * 100)) {
        for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) this.pwOn[(y0 + dy) * N + (x0 + dx)] = 1;
      }
    });
    needW.forEach(a => {
      const i = a[0], sz = this.bSize[i] || 1, x0 = i % N, y0 = (i / N) | 0;
      if (a[1] && (rW >= 1 || hash2(i, 2, 9) < rW * 100)) {
        for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) this.wtOn[(y0 + dy) * N + (x0 + dx)] = 1;
      }
    });
    for (let i = 0; i < n; i++) if (kd[i] === K.COAL || kd[i] === K.SOLAR) this.pwOn[i] = 1;
    Object.assign(this, { pwS: pS, pwD: pD, wtS: wS, wtD: wD });
    ['cPol', 'cFir', 'cHea', 'cEdu', 'cPar', 'poll'].forEach(k => this[k].fill(0));
    for (let i = 0; i < n; i++) {
      if (!this.isOrigin(i)) continue;
      const k = kd[i]; if (!this.built[i] || this.cons.has(i)) continue;
      if (k === K.PARK || k === K.LANDMARK || k === K.MEGA) this.spread(i, FAC[k].r, this.cPar, k === K.PARK ? 100 : 120);
      else if (this.isPolice(k) && this.pwOn[i]) this.spread(i, FAC[k].r, this.cPol, 100);
      else if (this.isFire(k) && this.pwOn[i]) this.spread(i, FAC[k].r, this.cFir, 100);
      else if (this.isHosp(k) && this.pwOn[i]) this.spread(i, FAC[k].r, this.cHea, 100);
      else if (this.isSchool(k) && this.pwOn[i]) this.spread(i, FAC[k].r, this.cEdu, 100);
      else if (k === K.IND && !this.ab[i]) this.spread(i, 4 + this.lvl[i], this.poll, 18 * this.lvl[i]);
      else if (k === K.COAL) this.spread(i, 8, this.poll, 55);
    }
  }
};
