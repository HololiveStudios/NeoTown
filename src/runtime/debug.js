let deltaRef = null;

export function bindDebugDelta(D) {
  deltaRef = D;
}

export const Debug = {
  _info: '',
  info(v) {
    this._info = v == null ? '' : String(v);
  },
  log(...args) {
    const s = args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' ');
    console.log('[Delta.Debug]', s);
    const g = deltaRef && deltaRef.game;
    if (g) g.log(s, 'i');
  },
  toast(v) {
    const g = deltaRef && deltaRef.game;
    if (g) g.say(String(v));
  }
};
