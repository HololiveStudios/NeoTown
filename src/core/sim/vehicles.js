import { K, D4 } from '../constants.js';

export const vehiclesMethods = {
  dispatch(type, tgt) {
    const N = this.N, n = N * N, key = type[0] + tgt, kS = type === 'fire' ? K.FIRE : K.POLICE;
    if (this.assign.has(key)) return true;
    const dist = new Int16Array(n).fill(-1), par = new Int32Array(n).fill(-1), q = [], tx = tgt % N, ty = (tgt / N) | 0, sz = this.bSize[tgt] || 1;
    for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) for (const d of D4) {
      const x = tx + dx + d[0], y = ty + dy + d[1];
      if (this.ok(x, y) && this.kind[y * N + x] === K.ROAD && dist[y * N + x] < 0) { dist[y * N + x] = 0; q.push(y * N + x); }
    }
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % N, y = (i / N) | 0;
      for (const d of D4) {
        const nx = x + d[0], ny = y + d[1]; if (!this.ok(nx, ny)) continue;
        const j = ny * N + nx;
        if (dist[j] < 0 && this.kind[j] === K.ROAD) { dist[j] = dist[i] + 1; par[j] = i; q.push(j); }
      }
    }
    let best = null, bd = 1e9;
    this.st.forEach(s => {
      if (this.kind[s] !== kS || !this.pwOn[s] || this.busy[s] >= 2) return;
      const sx = s % N, sy = (s / N) | 0;
      for (const d of D4) {
        const x = sx + d[0], y = sy + d[1]; if (!this.ok(x, y)) continue;
        const r = y * N + x;
        if (dist[r] >= 0 && dist[r] < bd) { bd = dist[r]; best = { s, r }; }
      }
    });
    if (!best) {
      if (!this.noted.has(key)) {
        this.noted.add(key);
        this.log('⚠️ ' + (type === 'fire' ? 'Nenhum caminhão disponível/alcançável' : 'Nenhuma viatura disponível/alcançável') + ' para (' + tx + ',' + ty + ')', 'bad');
      }
      return false;
    }
    const path = [];
    for (let p = best.r; p !== -1; p = par[p]) path.push(p);
    this.assign.add(key); this.busy[best.s]++;
    this.veh.push({ kind: type, st: best.s, tgt, route: path, ri: 0, x: best.s % N, y: (best.s / N) | 0, nx: path[0] % N, ny: (path[0] / N) | 0, px: -1, py: -1, p: 0, sp: 1.6, cur: 1.6, state: 'go', timer: 0, path, life: 999 });
    this.log((type === 'fire' ? '🚒 Caminhão' : '🚓 Viatura') + ' a caminho: ' + (bd + 1) + ' tiles (~' + ((bd + 1) / 8).toFixed(1) + ' dias)', 'info');
    return true;
  },
  nextNode(v) {
    const N = this.N, here = v.y * N + v.x;
    if (v.kind === 'car') {
      if (this.kind[here] !== K.ROAD || --v.life <= 0) return false;
      const opts = [];
      for (const d of D4) {
        const x = v.x + d[0], y = v.y + d[1];
        if (this.ok(x, y) && this.kind[y * N + x] === K.ROAD) opts.push([x, y]);
      }
      if (!opts.length) return false;
      const fw = opts.filter(o => !(o[0] === v.px && o[1] === v.py)), l = fw.length ? fw : opts, c = l[(this.rand() * l.length) | 0];
      v.px = v.x; v.py = v.y; v.nx = c[0]; v.ny = c[1]; return true;
    }
    v.px = v.x; v.py = v.y;
    if (++v.ri < v.route.length) {
      const t = v.route[v.ri]; v.nx = t % N; v.ny = (t / N) | 0;
      if (this.kind[t] !== K.ROAD && t !== v.st) { this.endVeh(v); return false; }
      return true;
    }
    if (v.state === 'go') { v.state = 'work'; v.timer = 0; return false; }
    this.endVeh(v); return false;
  },
  endVeh(v) {
    if (v.kind !== 'car') {
      this.busy[v.st] = Math.max(0, this.busy[v.st] - 1);
      if (v.state === 'go') this.assign.delete((v.kind === 'fire' ? 'f' : 'p') + v.tgt);
    }
    v.dead = true;
  },
  retreat(v) {
    const N = this.N, back = v.path.slice().reverse().concat([v.st]);
    v.route = back; v.state = 'back'; v.px = v.x; v.py = v.y; v.ri = 1; v.p = 0; v.cur = v.sp;
    if (back.length < 2) { this.endVeh(v); return; }
    v.nx = back[1] % N; v.ny = (back[1] / N) | 0;
  },
  moveVehicles(dt) {
    const N = this.N, e = new Map();
    this.veh.forEach(v => {
      if (v.state === 'work') return;
      const k = (v.y * N + v.x) * N * N + v.ny * N + v.nx;
      (e.get(k) || e.set(k, []).get(k)).push(v);
    });
    e.forEach(a => {
      a.sort((p, q) => q.p - p.p);
      a[0].cur = a[0].sp;
      for (let j = 1; j < a.length; j++) a[j].cur = a[j - 1].p - a[j].p < 0.3 ? Math.min(a[j].sp, a[j - 1].cur * 0.85) : a[j].sp;
    });
    for (const v of this.veh) {
      if (v.dead) continue;
      if (v.state === 'work') {
        v.timer += dt;
        if (v.kind === 'fire') {
          if (!this.fire[v.tgt] || v.timer > 12) this.retreat(v);
        } else if (v.timer > 1.5) {
          const c = this.crimes.find(c => c.i === v.tgt);
          if (this.riot[v.tgt]) {
            this.riot[v.tgt] = 0; this.riotT[v.tgt] = 15; this.assign.delete('p' + v.tgt);
            this.log('👮 Tumulto contido em (' + (v.tgt % N) + ',' + ((v.tgt / N) | 0) + ')', 'good');
          }
          if (c && !c.done) {
            c.done = true; this.stats.solved++;
            this.log('👮 Crime resolvido em (' + (v.tgt % N) + ',' + ((v.tgt / N) | 0) + ')', 'good');
          }
          this.retreat(v);
        }
        continue;
      }
      let d = (v.cur || v.sp) * dt;
      while (d > 0 && !v.dead) {
        const rem = 1 - v.p;
        if (d < rem) { v.p += d; break; }
        d -= rem; v.x = v.nx; v.y = v.ny; v.p = 0;
        if (!this.nextNode(v)) { if (v.state !== 'work') v.dead = true; break; }
      }
    }
    this.veh = this.veh.filter(v => !v.dead);
    this.spawnCars();
  },
  spawnCars() {
    const N = this.N, day = 0.5 + 0.5 * Math.cos((this.tod - 0.5) * 6.2832);
    const want = Math.min(260, Math.floor((this.roads * 0.22 + this.pop / 14) * (0.35 + 0.65 * day)));
    let cars = 0;
    this.veh.forEach(v => { if (v.kind === 'car') cars++; });
    for (let t = 0; t < 2 && cars < want; t++) {
      const i = (this.rand() * N * N) | 0; if (this.kind[i] !== K.ROAD) continue;
      const x = i % N, y = (i / N) | 0, opts = [];
      for (const d of D4) {
        const a = x + d[0], b = y + d[1];
        if (this.ok(a, b) && this.kind[b * N + a] === K.ROAD) opts.push([a, b]);
      }
      if (!opts.length) continue;
      const c = opts[(this.rand() * opts.length) | 0];
      this.veh.push({ kind: 'car', x, y, nx: c[0], ny: c[1], px: -1, py: -1, p: this.rand() * 0.5, sp: 0.8 + this.rand() * 0.7, cur: 1, state: 'go', life: 40 + ((this.rand() * 120) | 0), col: (this.rand() * 8) | 0 });
      cars++;
    }
  }
};
