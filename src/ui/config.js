export const APP_VERSION = '1.0.0';
export const KEY = 'neotown_v1';
export const SET = 'neotown_v1_set';

// Chaves legadas para migração automática
const LEGACY_KEY = 'delta_city_v4';
const LEGACY_SET = 'delta_city_v4_set';

export const cfg = {
  confirm: !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:coarse)').matches)
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(SET) || localStorage.getItem(LEGACY_SET);
    if (raw) Object.assign(cfg, JSON.parse(raw));
  } catch (e) {}
  return cfg;
}
