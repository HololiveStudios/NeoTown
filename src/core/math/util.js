export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const hash2 = (x, y, s) => {
  let h = (s + Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) % 1000 / 10;
};

export const Util = {
  collectFullRectTiles(x, y, w, h) {
    const o = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) o.push([x + i, y + j]);
    return o;
  },
  collectRectTiles(x, y, w, h, noCorners) {
    const o = [];
    for (let i = 0; i < w; i++) {
      if (!noCorners || (i > 0 && i < w - 1)) o.push([x + i, y]);
    }
    for (let j = 1; j < h - 1; j++) {
      o.push([x + w - 1, y + j]);
    }
    if (h > 1) {
      for (let i = w - 1; i >= 0; i--) {
        if (!noCorners || (i > 0 && i < w - 1)) o.push([x + i, y + h - 1]);
      }
    }
    for (let j = h - 2; j >= 1; j--) {
      o.push([x, y + j]);
    }
    return o;
  },
  optStorage(src, name, ctor) {
    if (!src[name]) src[name] = typeof ctor === 'function' ? ctor() : {};
    return src[name];
  },
  color2hex(r, g, b) {
    return '#' + [r, g, b].map(v => clamp(v | 0, 0, 255).toString(16).padStart(2, '0')).join('');
  },
  hex2color(hex) {
    const m = String(hex).replace('#', '');
    const n = parseInt(m, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
};
