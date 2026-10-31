import { Runtime, CMD } from './runtime.js';
import { Plugins } from './plugins.js';

let deltaRef = null;
let initialized = false;

export function bindConsoleDelta(D) {
  deltaRef = D;
}

export function run(line) {
  const a = String(line).trim().split(/\s+/), f = CMD[a[0]];
  if (!f) return 'comando desconhecido';
  return f(deltaRef ? deltaRef.game : null, a.slice(1));
}

export function initDefaultCommandsAndPlugins() {
  if (initialized) return;
  initialized = true;
  Runtime.registerCommand('speed', (g, a) => { g.speed = Math.max(0, Math.min(3, +a[0] || 0)); return 'ok'; });
  Runtime.registerCommand('funds', (g, a) => { g.funds += +a[0] || 0; g.recalc(); return g.funds; });
  Runtime.registerCommand('interest', (g, a) => { g.interest = Math.max(1, Math.min(25, +a[0] || g.interest)); return g.interest; });
  Runtime.registerCommand('plugins', () => Plugins.list.map(p => p.id + (p.off ? ' (off)' : '')).join(', ') || '-');
  Plugins.add({
    id: '$diario00',
    nextMonth(g) {
      const s = this.storage();
      s.meses = (s.meses || 0) + 1;
    }
  });
}
