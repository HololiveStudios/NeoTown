import { Runtime } from './runtime.js';
import { Script } from './script-lifecycle.js';

const PL = [];

export const Plugins = {
  list: PL,
  add(p) {
    const o = { id: p.id, err: 0, off: false, storage: () => Runtime.getStorage(p.id) };
    PL.push(o);
    Script.EV.forEach(ev => {
      if (typeof p[ev] === 'function') {
        Script.on(ev, function (g, x) { p[ev].call(o, g, x); }, o);
      }
    });
    return o;
  },
  setActive(id, on) {
    const o = PL.find(p => p.id === id);
    if (o) {
      o.off = !on;
      o.err = 0;
    }
  }
};
