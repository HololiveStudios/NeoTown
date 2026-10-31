import { CATS, CITY_RANKS, K } from '../core/constants.js';
import { $, el } from './dom.js';
import { ic, CATI, itIc } from './icons.js';
import { uiState } from './app-loop.js';
import { openZoneEditor, zoneEditorState } from './zone-editor.js';

export function showConf() {
  $('conf').style.display = 'flex';
}

export function hideConf() {
  $('conf').style.display = 'none';
}

export function buildItems() {
  const g = uiState.g;
  const its = $('its');
  its.innerHTML = '';
  its.style.display = uiState.menuOpen && uiState.openCat >= 0 ? 'flex' : 'none';
  $('cats').style.display = uiState.menuOpen ? 'flex' : 'none';
  if (uiState.openCat >= 0) {
    CATS[uiState.openCat].items.forEach((it, ii) => {
      const curRank = g ? (g.cityRank || 0) : 0;
      const isLocked = it.minRank && it.minRank > curRank;
      const rankName = isLocked && CITY_RANKS[it.minRank] ? CITY_RANKS[it.minRank].name : '';

      const costText = isLocked
        ? `🔒 ${rankName}`
        : (it.cost ? '$' + it.cost + (it.mode !== 'point' ? '/tile' : '') : 'grátis');

      const b = el(
        'button',
        'pb item' + (isLocked ? ' locked' : ''),
        itIc(it.id, 3) + '<b>' + it.name + '</b><small>' + costText + '</small>'
      );

      b.onclick = () => {
        if (isLocked) {
          g.say(`🔒 Bloqueado! Requer a evolução para: ${rankName} (Nível ${it.minRank})`);
          return;
        }
        g.setTool(uiState.openCat, ii);
        uiState.menuOpen = false;
        buildItems();
        hideConf();
        uiState.dirty = true;

        // Se o usuário selecionou uma zona (Residencial, Comercial ou Industrial), abre o Estúdio de Zoneamento
        if (it.k === K.RES || it.k === K.COM || it.k === K.IND) {
          openZoneEditor(it.k, it.name);
        }
      };
      its.appendChild(b);
    });
  }
}

export function toggleMenu() {
  const g = uiState.g;
  uiState.menuOpen = !uiState.menuOpen;
  if (uiState.menuOpen && uiState.openCat < 0 && CATS[g.cat].items.length > 1) {
    uiState.openCat = g.cat;
  }
  buildItems();
  hideConf();
}

export function pickCat(ci) {
  const g = uiState.g;
  uiState.menuOpen = true;
  if (CATS[ci].items.length === 1) {
    g.setTool(ci, 0);
    uiState.openCat = -1;
    uiState.menuOpen = false;
  } else {
    uiState.openCat = ci;
    if (g.cat !== ci) g.setTool(ci, 0);
  }
  buildItems();
  hideConf();
  uiState.dirty = true;
}

export function initBuildMenu() {
  const catsEl = $('cats');
  catsEl.innerHTML = '';
  CATS.forEach((c, ci) => {
    const b = el('button', 'pb cat', ic(CATI[c.id], 3) + '<small>' + c.name + '</small>');
    b.onclick = () => pickCat(ci);
    catsEl.appendChild(b);
  });
  $('bOk').onclick = () => {
    uiState.g.selEnd();
    hideConf();
    uiState.dirty = true;
  };
  $('bNo').onclick = () => {
    uiState.g.selCancel();
    hideConf();
    uiState.dirty = true;
  };
}
