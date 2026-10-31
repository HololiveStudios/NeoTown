const Q = [];
export const CMD = {};

export const Runtime = {
  storage: {},
  postpone(fn, delayMS) {
    Q.push({ fn, ms: Math.max(0, +delayMS || 0) });
  },
  flush(dtMS) {
    const dt = Math.max(1, +dtMS || 16.6), n = Q.length;
    for (let i = 0; i < n; i++) {
      const e = Q.shift();
      e.ms -= dt;
      if (e.ms > 0) Q.push(e);
      else {
        try { e.fn(); } catch (x) { console.warn('postpone', x); }
      }
    }
  },
  getStorage(id) {
    return this.storage[id] || (this.storage[id] = {});
  },
  registerCommand(n, f) {
    CMD[n] = f;
  },
  toJson(t) {
    return JSON.stringify(t);
  },
  fromJson(s) {
    return JSON.parse(s);
  },
  getTime() {
    return Math.round(performance.now());
  },
  getUuid() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
  }
};
