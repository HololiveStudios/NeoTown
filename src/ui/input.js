import { clamp } from '../core/math/util.js';
import { cfg } from './config.js';
import { $, cl } from './dom.js';
import { uiState } from './app-loop.js';
import { pickCat, buildItems, showConf, hideConf } from './build-menu.js';
import { togPerf } from './hud.js';
import { openModal, closeModal } from './modals.js';

const ptr = new Map();
let mode = null, pan = null, pinch = null;

export function camClamp() {
  const g = uiState.g;
  uiState.u0 = clamp(uiState.u0, -g.N, g.N);
  uiState.v0 = clamp(uiState.v0, 0, 2 * g.N);
}

export function panBy(dx, dy) {
  const v = uiState.g.view;
  uiState.u0 -= dx / v.hw;
  uiState.v0 -= dy / v.hh;
  camClamp();
  uiState.dirty = true;
}

export function showInfo(x, y) {
  const r = uiState.g.inspect(x, y), b = $('card');
  const actionBtn = r.isBuilt
    ? `<button id="btn-toggle-historic" style="margin-top:6px;width:100%;padding:4px 8px;font-size:11px;font-weight:700;background:#133d63;border:1px solid #1c6b9e;color:#ffd24a;border-radius:4px;cursor:pointer;">${r.isUntouchable ? '🏛️ Desproteger Edifício' : '🏛️ Declarar Patrimônio Histórico'}</button>`
    : '';

  b.innerHTML =
    '<b style="color:#ffd24a">' + cl(r.title) + '</b>' +
    r.lines.slice(1).map(l => '<div' + (/PROTESTO|GREVE|CHAMAS/.test(l) ? ' style="color:#ff8a7a"' : '') + '>' + cl(l) + '</div>').join('') +
    actionBtn +
    '<div class="dim">toque em outro lugar para fechar</div>';
  b.style.display = 'block';

  const btn = b.querySelector('#btn-toggle-historic');
  if (btn) {
    btn.onclick = (e) => {
      e.stopPropagation();
      const g = uiState.g;
      if (g.untouchable) {
        g.untouchable[r.tileIndex] = g.untouchable[r.tileIndex] ? 0 : 1;
        g.say(g.untouchable[r.tileIndex] ? '🏛️ Edifício tombado como patrimônio histórico!' : 'Edifício liberado para modernização.');
        showInfo(x, y);
      }
    };
  }
}

export function initInput() {
  const cv = uiState.cv, mmc = uiState.mmc;
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) * uiState.W / r.width, (e.clientY - r.top) * uiState.H / r.height];
  };
  const pts = () => Array.from(ptr.values());
  const dist = () => { const a = pts(); return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1; };
  const mid = () => { const a = pts(); return [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2]; };

  $('mm').addEventListener('pointerdown', (e) => {
    const g = uiState.g;
    const r = mmc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * g.N, y = (e.clientY - r.top) / r.height * g.N;
    uiState.u0 = x - y;
    uiState.v0 = x + y + 1;
    camClamp();
    uiState.mmT = 0;
    uiState.dirty = true;
    e.preventDefault();
  });

  cv.addEventListener('pointerdown', (e) => {
    const g = uiState.g;
    if (!g) return;
    cv.setPointerCapture(e.pointerId);
    const p = pos(e);
    ptr.set(e.pointerId, p);
    $('card').style.display = 'none';
    if (uiState.menuOpen) { uiState.menuOpen = false; buildItems(); }
    if (ptr.size === 2) { g.selCancel(); mode = 'pinch'; pinch = { d: dist(), m: mid() }; return; }
    if (g.tool().mode === 'inspect' || e.button === 1 || e.button === 2) {
      mode = 'pan';
      pan = { sx: p[0], sy: p[1], moved: false, px: p[0], py: p[1] };
      return;
    }
    const t = g.screenToTile(p[0], p[1]);
    if (!t) return;
    mode = 'sel';
    hideConf();
    g.selBegin(t[0], t[1]);
    uiState.dirty = true;
  });

  cv.addEventListener('pointermove', (e) => {
    const g = uiState.g;
    if (!g) return;
    const p = pos(e);
    if (!ptr.has(e.pointerId)) {
      if (g.tool().mode === 'point') {
        const t = g.screenToTile(p[0], p[1]);
        if (t) { g.setCursor(t[0], t[1]); uiState.dirty = true; }
      }
      return;
    }
    ptr.set(e.pointerId, p);
    if (mode === 'pinch' && ptr.size === 2) {
      const d = dist(), m = mid();
      uiState.hwF = clamp(uiState.hwF * d / pinch.d, 8, 64);
      panBy(m[0] - pinch.m[0], m[1] - pinch.m[1]);
      pinch = { d, m };
      return;
    }
    if (mode === 'pan') {
      if (Math.abs(p[0] - pan.sx) + Math.abs(p[1] - pan.sy) > 5) pan.moved = true;
      if (pan.moved) panBy(p[0] - pan.px, p[1] - pan.py);
      pan.px = p[0]; pan.py = p[1];
      return;
    }
    if (mode === 'sel') {
      const t = g.screenToTile(p[0], p[1]);
      if (t) { g.selMove(t[0], t[1]); uiState.dirty = true; }
    }
  });

  const up = (e) => {
    const g = uiState.g;
    if (mode === 'pan' && pan && !pan.moved && g.tool().mode === 'inspect') {
      const t = g.screenToTile(pan.sx, pan.sy);
      if (t) { g.setCursor(t[0], t[1]); showInfo(t[0], t[1]); uiState.dirty = true; }
    }
    if (mode === 'sel' && ptr.size === 1) {
      if (cfg.confirm) showConf();
      else g.selEnd();
      uiState.dirty = true;
    }
    ptr.delete(e.pointerId);
    if (ptr.size < 2 && mode === 'pinch') mode = null;
    if (!ptr.size) mode = null;
  };

  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    uiState.hwF = clamp(uiState.hwF * Math.exp(-e.deltaY * 0.0012), 8, 64);
    uiState.dirty = true;
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    const g = uiState.g;
    if (!g) return;
    if ($('win').style.display === 'flex') {
      if (e.key === 'Escape') closeModal();
      return;
    }
    const k = e.key;
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    const pw = { a: [40, 0], d: [-40, 0], w: [0, 40], s: [0, -40] }[k];
    if (mv) { g.setCursor(g.cx + mv[0], g.cy + mv[1]); if (g.sel) g.selMove(g.cx, g.cy); }
    else if (pw) panBy(pw[0], pw[1]);
    else if (k >= '1' && k <= '9') pickCat(+k - 1);
    else if (k === ' ' || k === 'Enter') { if (!g.sel) g.selBegin(g.cx, g.cy); else g.selEnd(); }
    else if (k === 'Escape') { g.selCancel(); hideConf(); uiState.menuOpen = false; buildItems(); }
    else if (k === '+' || k === '=') uiState.hwF = clamp(uiState.hwF * 1.15, 8, 64);
    else if (k === '-') uiState.hwF = clamp(uiState.hwF / 1.15, 8, 64);
    else if (k === 'f') togPerf();
    else if (k === 'h' && uiState.bH) uiState.bH.click();
    else if (k === 'p') { g.speed = g.speed ? 0 : 1; }
    else if (k === 'b') openModal('budget');
    else return;
    e.preventDefault();
    uiState.dirty = true;
  });
}
