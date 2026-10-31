import { Delta } from '../api/delta-api.js';
import { $ } from './dom.js';

export const HEATS = [
  null,
  { id: 'elev', n: 'Topografia / Elevação' },
  { id: 'cls', n: 'Classe social' },
  { id: 'land', n: 'Valor do solo' },
  { id: 'poll', n: 'Poluição' },
  { id: 'crime', n: 'Crime' },
  { id: 'risk', n: 'Risco de protesto' },
  { id: 'cPol', n: 'Cobertura policial' }
];

export const RC = ['#3fcf5a', '#3f86f0', '#f0c640'];
export const SPD = ['II', '>', '>>', '>>>'];
export const SIDE = [['bulldoze', 'dozer'], ['inspect', 'mag'], ['zone', 'zone'], ['road', 'road']];
export const MC = [[44, 92, 150], [78, 120, 56], [40, 82, 42], [110, 112, 96]];

export const uiState = {
  cv: null,
  ctx: null,
  mmc: null,
  mx: null,
  pf: null,
  bH: null,
  g: null,
  heatI: 0,
  perf: { s: 0, r: 0, u: 0, on: false },
  pd: null,
  ld: null,
  hwF: 28,
  u0: 0,
  v0: 0,
  W: 64,
  H: 64,
  img: null,
  last: 0,
  lastDraw: 0,
  dirty: true,
  hudT: 0,
  openCat: -1,
  menuOpen: false,
  tab: 'budget',
  mmN: 0,
  mmImg: null,
  mmT: 0,
  hudFn: null
};

export function initCanvasContext() {
  uiState.cv = $('c');
  uiState.ctx = uiState.cv.getContext('2d', { alpha: false });
  uiState.mmc = $('mmc');
  uiState.mx = uiState.mmc.getContext('2d');
  uiState.last = performance.now();
}

export function resize() {
  if (!uiState.cv) initCanvasContext();
  const r = $('stage').getBoundingClientRect(), s = Math.max(1, Math.ceil(r.width / 640));
  uiState.W = Math.max(64, Math.floor(r.width / s));
  uiState.H = Math.max(64, Math.floor(r.height / s));
  uiState.cv.width = uiState.W;
  uiState.cv.height = uiState.H;
  uiState.cv.style.width = r.width + 'px';
  uiState.cv.style.height = r.height + 'px';
  uiState.img = uiState.ctx.createImageData(uiState.W, uiState.H);
  uiState.dirty = true;
}

export function loop(t) {
  const g = uiState.g;
  Delta.game = g;
  const dt = Math.min(100, t - uiState.last), t0 = performance.now();
  uiState.last = t;

  if (g) {
    g.update(dt);
    const ds = g.day + '/' + g.month + '/' + g.year;
    if (uiState.ld && ds !== uiState.ld.s) {
      Delta.Script.emit('nextDay', g);
      if (g.month !== uiState.ld.m) Delta.Script.emit('nextMonth', g);
      if (g.year !== uiState.ld.y) Delta.Script.emit('nextYear', g);
    }
    uiState.ld = { s: ds, m: g.month, y: g.year };
    Delta.Script.emit('update', g);
  }

  Delta.Runtime.flush(dt);
  const t1 = performance.now();
  let t2 = t1;
  if ((t - uiState.lastDraw > 60 || uiState.dirty) && g) {
    uiState.lastDraw = t;
    uiState.dirty = false;
    if (uiState.img) {
      Delta.render(g, uiState.img.data, uiState.W, uiState.H, {
        hw: uiState.hwF,
        u0: uiState.u0,
        v0: uiState.v0,
        heat: HEATS[uiState.heatI]
      });
      uiState.ctx.putImageData(uiState.img, 0, 0);
    }
    t2 = performance.now();
  }
  if (t - uiState.hudT > 200) {
    uiState.hudT = t;
    if (uiState.hudFn && g) uiState.hudFn();
    if (uiState.perf.on && uiState.pf && g) {
      const e = (a, b) => a * 0.8 + b * 0.2;
      uiState.perf.s = e(uiState.perf.s, t1 - t0);
      uiState.perf.r = e(uiState.perf.r, t2 - t1);
      uiState.perf.u = e(uiState.perf.u, performance.now() - t2);
      const dbg = Delta.Debug && Delta.Debug._info ? ' | ' + Delta.Debug._info : '';
      uiState.pf.textContent =
        'sim ' + uiState.perf.s.toFixed(1) +
        ' | render ' + uiState.perf.r.toFixed(1) +
        ' | ui ' + uiState.perf.u.toFixed(1) +
        ' ms | chunks ' + Delta._chunks.baked + ' (' + (Delta._chunks.bytes / 1048576).toFixed(1) + ' MB)' +
        ' | sprites ' + (Delta._spr ? Delta._spr.baked : 0) + dbg;
    }
  }
  requestAnimationFrame(loop);
}

export function startLoop() {
  requestAnimationFrame(loop);
}
