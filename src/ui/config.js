export const KEY = 'delta_city_v4';
export const SET = 'delta_city_v4_set';

export const cfg = {
  confirm: !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer:coarse)').matches)
};

export function loadConfig() {
  try {
    Object.assign(cfg, JSON.parse(localStorage.getItem(SET) || '{}'));
  } catch (e) {}
  return cfg;
}
