import { clamp } from '../core/math/util.js';

export const ZL = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48, 52, 56, 60, 64];

export function computeView(g, W, H, view) {
  view = view || {};
  const N = g.N, N1 = N + 1;
  const want = view.hw || 24;
  let hw = ZL[0];
  for (const z of ZL) if (Math.abs(z - want) < Math.abs(hw - want)) hw = z;
  const hh = Math.max(3, Math.round(hw * 0.42)), U = hw / 13.5, elevPx = Math.round(hw * 0.34);
  let u0 = view.u0 === undefined ? 0 : view.u0, v0 = view.v0 === undefined ? N : view.v0;
  if (view.follow) { u0 = g.cx - g.cy; v0 = g.cx + g.cy + 1; }
  const ox = Math.round(W / 2 - u0 * hw), oy = Math.round(H / 2 - v0 * hh);
  g.view = { ox, oy, hw, hh, elevPx };
  const T = (x, y) => {
    const ix = clamp(Math.round(x), 0, N), iy = clamp(Math.round(y), 0, N), hz = g.cornerH ? g.cornerH[iy * N1 + ix] : 0;
    return [ox + (x - y) * hw, oy + (x + y) * hh - hz * elevPx];
  };
  return { hw, hh, U, elevPx, ox, oy, T };
}

export function screenToTile(g, sx, sy) {
  return g.screenToTile(sx, sy);
}
