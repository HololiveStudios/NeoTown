import { Delta } from '../api/delta-api.js';
import { KEY, SET, cfg } from '../ui/config.js';
import { uiState } from '../ui/app-loop.js';

export function newGame(o) {
  const g = new Delta.Game(o);
  uiState.g = g;
  Delta.Script.bootCity(g, true);
  uiState.hwF = 28;
  uiState.u0 = 0;
  uiState.v0 = g.N;
  uiState.dirty = true;
  return g;
}

export function load() {
  try {
    const s = localStorage.getItem(KEY) || localStorage.getItem('delta_city_v4');
    if (s) {
      const g = Delta.Game.fromJSON(JSON.parse(s));
      uiState.g = g;
      Delta.Script.bootCity(g, false);
      g.msg = 'Jogo carregado.';
      uiState.u0 = 0;
      uiState.v0 = g.N;
      return g;
    }
  } catch (e) {}
  return newGame({ size: 48, type: 'lake' });
}

export function save() {
  try {
    localStorage.setItem(KEY + '_st', JSON.stringify(Delta.Runtime.storage));
    if (uiState.g) localStorage.setItem(KEY, JSON.stringify(uiState.g.toJSON()));
    localStorage.setItem(SET, JSON.stringify(cfg));
  } catch (e) {}
}

export function loadPluginStorage() {
  try {
    Object.assign(Delta.Runtime.storage, JSON.parse(localStorage.getItem(KEY + '_st') || '{}'));
  } catch (e) {}
}

export function initAutoSave() {
  setInterval(save, 15000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
}
