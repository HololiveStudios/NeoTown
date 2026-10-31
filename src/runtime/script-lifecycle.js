const H = {};
let deltaRef = null;

export function bindScriptDelta(D) {
  deltaRef = D;
}

export const guard = (o, f, a) => {
  if (o.off) return;
  try {
    f.apply(o, a);
  } catch (x) {
    if (++o.err >= 5) {
      o.off = true;
      console.warn('plugin desativado:', o.id, x);
    }
  }
};

export const Script = {
  EV: [
    'earlyInit', 'init', 'lateInit', 'load', 'finishLoading',
    'enterCityGeneration', 'leaveCityGeneration', 'enterCity',
    'buildCityGUI', 'leaveCity', 'nextDay', 'nextMonth', 'nextYear',
    'update', 'build', 'remove', 'event'
  ],
  phase: 'boot',
  on(ev, fn, owner) {
    (H[ev] || (H[ev] = [])).push({ fn, o: owner || { id: 'anon', err: 0 } });
  },
  emit(ev, g, x) {
    (H[ev] || []).forEach(h => guard(h.o, h.fn, [g, x]));
  },
  /* Maquina de estados deterministica: ordem estrita de carregamento para evitar race conditions */
  bootEngine() {
    const seq = ['earlyInit', 'init', 'lateInit', 'load', 'finishLoading'];
    for (const s of seq) {
      this.phase = s;
      this.emit(s, (deltaRef && deltaRef.game) || null);
    }
  },
  bootCity(g, isNew) {
    if (deltaRef && deltaRef.game && deltaRef.game !== g) {
      this.phase = 'leaveCity';
      this.emit('leaveCity', deltaRef.game);
    }
    if (deltaRef) deltaRef.game = g;
    if (isNew) {
      this.phase = 'enterCityGeneration:0'; this.emit('enterCityGeneration', g, 0);
      this.phase = 'leaveCityGeneration:0'; this.emit('leaveCityGeneration', g, 0);
      this.phase = 'enterCityGeneration:1'; this.emit('enterCityGeneration', g, 1);
      this.phase = 'leaveCityGeneration:1'; this.emit('leaveCityGeneration', g, 1);
    }
    this.phase = 'enterCity'; this.emit('enterCity', g);
    this.phase = 'buildCityGUI'; this.emit('buildCityGUI', g);
    this.phase = 'running';
  }
};
