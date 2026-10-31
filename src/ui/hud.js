import { CATS } from '../core/constants.js';
import { clamp } from '../core/math/util.js';
import { $, el, cl } from './dom.js';
import { ic, itIc } from './icons.js';
import { HEATS, RC, SPD, SIDE, MC, uiState } from './app-loop.js';
import { toggleMenu, pickCat, buildItems, hideConf } from './build-menu.js';
import { openModal } from './modals.js';

export function selectItem(id) {
  const g = uiState.g;
  for (let ci = 0; ci < CATS.length; ci++) {
    const ii = CATS[ci].items.findIndex(it => it.id === id);
    if (ii >= 0) {
      g.setTool(ci, ii);
      uiState.openCat = -1;
      uiState.menuOpen = false;
      buildItems();
      hideConf();
      uiState.dirty = true;
      return;
    }
  }
}

export function togPerf() {
  uiState.perf.on = !uiState.perf.on;
  if (uiState.pf) uiState.pf.style.display = uiState.perf.on ? 'block' : 'none';
}

export function hudExtra() {
  const g = uiState.g;
  const t = g.tool(), dk = { res: 'r', com: 'c', ind: 'i' }[t.id];
  let val, f, col;
  if (dk) {
    const v = g.demand[dk];
    val = Math.round(v * 100);
    f = Math.min(1, Math.abs(v));
    col = v < 0 ? '#e55' : RC[dk === 'r' ? 0 : dk === 'c' ? 1 : 2];
  } else {
    val = t.cost || 0;
    f = Math.min(1, val / 500);
    col = '#ffd24a';
  }
  const key = t.id + '|' + val + '|' + col, dl = $('dial');
  if (dl._k !== key) {
    dl._k = key;
    dl.innerHTML =
      '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#0b2a46" fill-opacity=".8" stroke="#06182a" stroke-width="13" stroke-dasharray="179 239" transform="rotate(135 50 50)"/><circle cx="50" cy="50" r="38" fill="none" stroke="' + col + '" stroke-width="7" stroke-dasharray="' + (179 * f).toFixed(1) + ' 239" transform="rotate(135 50 50)"/><text x="50" y="60" text-anchor="middle" font-size="28" font-family="Verdana,sans-serif" font-weight="700" fill="#fff" stroke="#031422" stroke-width="1">' + val + '</text></svg><div class="lbl">' + cl(t.name) + '</div>';
  }
  Array.prototype.forEach.call($('side').children, b => {
    if (b.dataset.id) {
      b.classList.toggle('sel', b.dataset.id === 'zone' ? ['res', 'com', 'ind'].indexOf(t.id) >= 0 : t.id === b.dataset.id);
    }
  });
  $('bB').classList.toggle('sel', uiState.menuOpen);
  const now = performance.now();
  if (now - uiState.mmT < 400) return;
  uiState.mmT = now;
  const N = g.N;
  if (uiState.mmN !== N) {
    uiState.mmN = N;
    uiState.mmc.width = uiState.mmc.height = N;
    uiState.mmImg = uiState.mx.createImageData(N, N);
  }
  const d = uiState.mmImg.data;
  for (let i = 0; i < N * N; i++) {
    const k = g.kind[i], elv = (g.elev ? g.elev[i] : (g.getTerrainHeight ? g.getTerrainHeight(i % g.N, (i / g.N) | 0) : 0)), shd = 0.86 + elv * 0.04;
    let c = MC[g.bio[i]] || MC[1];
    c = [clamp((c[0] * shd) | 0, 0, 255), clamp((c[1] * shd) | 0, 0, 255), clamp((c[2] * shd) | 0, 0, 255)];
    if (k === 1) c = [150, 150, 150];
    else if (k === 2) c = [120, 226, 120];
    else if (k === 3) c = [90, 150, 255];
    else if (k === 4) c = [250, 210, 70];
    else if (g.isSky(k)) c = [255, 218, 92];
    else if (k >= 5) c = [236, 236, 236];
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
  }
  uiState.mx.putImageData(uiState.mmImg, 0, 0);
  const sz = clamp(uiState.W / uiState.hwF * 0.7, 3, N), cx = (uiState.u0 + uiState.v0 - 1) / 2, cy = (uiState.v0 - uiState.u0 - 1) / 2;
  uiState.mx.strokeStyle = '#ffe828';
  uiState.mx.lineWidth = Math.max(1, N / 48);
  uiState.mx.strokeRect(cx - sz / 2, cy - sz / 2, sz, sz);
}

export function setHudVisible(visible) {
  const ids = ['top', 'side', 'sub', 'dial', 'gift', 'bot', 'clk', 'money', 'mm', 'card', 'cost'];
  ids.forEach(id => {
    const el = $(id);
    if (el) el.style.display = visible ? '' : 'none';
  });
}

export function hud() {
  const g = uiState.g;
  if (!g) return;
  const set = (id, h, bad) => {
    const e = $(id), k = h + (bad ? '!' : '');
    if (e._k !== k) {
      e._k = k;
      e.innerHTML = h;
      e.classList.toggle('bad', !!bad);
    }
  };
  const f = g.funds, hp = g.happy;
  {
    const L = g.last || {}, net = (L.tr || 0) + (L.tc || 0) + (L.ti || 0) + (L.rent || 0) - (L.up || 0);
    const fm = (v) => Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'K' : v;
    set('cF', ic('coin', 3) + '<b>' + (f < 0 ? '-' : '') + '$' + fm(Math.abs(f)) + '</b><span class="net' + (net < 0 ? ' neg' : '') + '">' + (net >= 0 ? '+' : '-') + fm(Math.abs(net)) + '</span>', f < 0);
  }
  set('cN', cl(g.name || 'Delta City'));
  set('cP', ic('pop') + '<b>' + g.pop + '</b>');
  set('cH', ic(hp >= 60 ? 'smile' : hp >= 40 ? 'flat' : 'sad') + '<b>' + hp + '%</b>', hp < 30);
  set('cD', g.dateStr());
  set('cE', ic('bolt') + Math.min(999, g.pwS) + '/' + g.pwD, g.pwD > g.pwS);
  set('cW', ic('drop') + g.wtS + '/' + g.wtD, g.wtD > g.wtS);
  set('cC', ic('shield') + g.crimeIdx + '%', g.crimeIdx > 60);
  set('cI', 'INF ' + g.inflation.toFixed(1) + '%', g.inflation > 9);
  set('cJ', ic('bank') + 'JUR ' + g.interest + '%');
  set('cG', ic('fist') + (g.nProt + g.strikes), g.nProt + g.strikes > 0);
  Array.prototype.forEach.call($('spd').children, (b, i) => {
    b.classList.toggle('sel', i === g.speed);
    if (i === 1) {
      // Botão Play (speed 1): pulsa convidando o jogador a dar play quando em pausa com pop < 50
      b.classList.toggle('pulse-play', g.speed === 0 && g.pop < 50);
    }
  });
  hudExtra();
  ['r', 'c', 'i'].forEach((k, i) => {
    const b = $('rci').children[i].firstChild, v = g.demand[k], h = Math.abs(v) * 15;
    b.style.height = h + 'px';
    b.style.top = v >= 0 ? 15 - h + 'px' : '15px';
    b.style.background = v < 0 ? '#d55' : RC[i];
  });
  const t = g.tool();
  const tk = itIc(t.id, 2) + '<span>' + t.name + '</span>';
  if ($('tool')._k !== tk) { $('tool')._k = tk; $('tool').innerHTML = tk; }
  $('toast').textContent = cl(g.msg);
  const c = $('cost'), pv = g.preview;
  if (g.sel && pv && pv.cost) {
    c.style.display = 'block';
    c.className = 'px' + (pv.cost > g.funds ? ' bad' : '');
    c.textContent = '$' + pv.cost + ' / ' + pv.tiles.filter(x => x.c >= 0).length + ' tile(s)';
  } else c.style.display = 'none';
  Array.prototype.forEach.call($('cats').children, (b, i) => b.classList.toggle('sel', i === g.cat));
  Array.prototype.forEach.call($('its').children, (b, i) => b.classList.toggle('sel', uiState.openCat === g.cat && i === g.item));
}

export function initHud() {
  uiState.hudFn = hud;
  $('top').innerHTML = '<button class="pb big" id="bB">' + ic('hammer', 4) + '</button><div class="chip in" id="cN"></div><div class="chip in" id="cP"></div><div class="chip in" id="cH"></div>';
  $('sub').innerHTML = '<div id="rci"></div><div class="chip in" id="cE"></div><div class="chip in" id="cW"></div><div class="chip in" id="cC"></div><div class="chip in" id="cI"></div><div class="chip in" id="cJ"></div><div class="chip in" id="cG"></div>';
  $('clk').innerHTML = ic('clock', 4) + '<div id="cD"></div><div id="spd"></div>';
  $('money').innerHTML = '<div class="chip in" id="cF"></div>';
  $('gift').innerHTML = ic('gift', 3);

  ['R', 'C', 'I'].forEach((l, i) => {
    const b = el('div', 'bar in', '<i></i><b>' + l + '</b>');
    b.firstChild.style.background = RC[i];
    $('rci').appendChild(b);
  });

  SPD.forEach((t, i) => {
    const b = el('button', 'pb', t);
    b.onclick = () => {
      uiState.g.speed = i;
      uiState.g.say(i ? 'Velocidade ' + i + 'x' : 'Pausado');
      uiState.dirty = true;
    };
    $('spd').appendChild(b);
  });

  $('bB').onclick = $('tool').onclick = () => toggleMenu();
  $('toast').onclick = () => openModal('log');

  $('side').innerHTML = '';
  SIDE.forEach(a => {
    const b = el('button', 'pb', ic(a[1], 3));
    b.dataset.id = a[0];
    b.onclick = () => {
      if (a[0] === 'zone') {
        const z = CATS.findIndex(c => c.id === 'zone');
        if (z >= 0) pickCat(z);
      } else selectItem(a[0]);
    };
    $('side').appendChild(b);
  });

  const bH = el('button', 'pb', ic('flame', 3));
  bH.onclick = () => {
    uiState.heatI = (uiState.heatI + 1) % HEATS.length;
    uiState.g.say(uiState.heatI ? 'Mapa: ' + HEATS[uiState.heatI].n : 'Mapa desligado');
    uiState.dirty = true;
  };
  uiState.bH = bH;
  $('side').appendChild(bH);

  let pf = $('perf');
  if (!pf) {
    pf = el('div', 'px', '');
    pf.id = 'perf';
    pf.style.cssText = 'position:absolute;left:68px;top:calc(150px + env(safe-area-inset-top));padding:3px 8px;font-size:11px;display:none;pointer-events:none';
    document.body.appendChild(pf);
  }
  uiState.pf = pf;

  $('top').addEventListener('click', (e) => {
    if (e.target.closest('#cN')) togPerf();
  });

  $('side').appendChild(el('span', 'sp'));
  const bG = el('button', 'pb', ic('globe', 3));
  bG.onclick = () => openModal('stats');
  $('side').appendChild(bG);

  const bM = el('button', 'pb', ic('gear', 3));
  bM.id = 'bM';
  bM.onclick = () => openModal(uiState.tab);
  $('side').appendChild(bM);

  $('gift').onclick = () => openModal('log');
  $('money').onclick = () => openModal('budget');
}
