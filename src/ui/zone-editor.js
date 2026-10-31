import { el } from './dom.js';
import { uiState } from './app-loop.js';
import { K } from '../core/constants.js';

export const zoneEditorState = {
  isOpen: false,
  zoneType: K.RES,
  zoneName: 'Residencial',
  autoRoads: true,
  autoUtilities: true,
  history: [], // Histórico de snapshots para desfazer
  pendingTiles: []
};

export function openZoneEditor(k, name) {
  zoneEditorState.isOpen = true;
  zoneEditorState.zoneType = k;
  zoneEditorState.zoneName = name || 'Zona';
  zoneEditorState.history = [];
  
  let editor = document.getElementById('zone-editor-modal');
  if (editor) editor.remove();

  editor = el('div', 'zone-editor-modal');
  editor.id = 'zone-editor-modal';
  editor.innerHTML = `
    <div class="zone-editor-card">
      <div class="zone-editor-header">
        <div class="zone-editor-title">📐 Planejador & Estúdio de Zoneamento</div>
        <button class="pb sm no" id="close-zone-editor">&times;</button>
      </div>

      <div class="zone-editor-body">
        <div class="zone-editor-field">
          <label><b>Categoria Ativa:</b> <span id="zone-active-name" style="color:#7be08a">${zoneEditorState.zoneName}</span></label>
        </div>

        <div class="zone-editor-field">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="chk-auto-roads" ${zoneEditorState.autoRoads ? 'checked' : ''} />
            <span>🛣️ <b>Auto-circundar com Estradas</b> (Traça vias no perímetro do lote)</span>
          </label>
        </div>

        <div class="zone-editor-field">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="chk-auto-utils" ${zoneEditorState.autoUtilities ? 'checked' : ''} />
            <span>💧⚡ <b>Embutir Infraestrutura Básica</b> (Canos e fiação nas vias)</span>
          </label>
        </div>

        <div class="zone-editor-info" id="zone-editor-summary">
          <div>Selecione a área no mapa com o cursor para projetar.</div>
          <div style="font-size:11px;color:#8bb3cf;margin-top:4px;">
            O custo é calculado antes da execução. Use <b>Desfazer</b> para retroceder passos.
          </div>
        </div>
      </div>

      <div class="zone-editor-actions">
        <button class="pb sm" id="btn-zone-undo" style="min-width:90px;">↩️ Desfazer</button>
        <div style="flex:1"></div>
        <button class="pb sm no" id="btn-zone-cancel">Cancelar</button>
        <button class="pb sm ok" id="btn-zone-apply" style="font-weight:700;">✓ Confirmar Projeto</button>
      </div>
    </div>
  `;

  document.body.appendChild(editor);

  editor.querySelector('#close-zone-editor').onclick = closeZoneEditor;
  editor.querySelector('#btn-zone-cancel').onclick = closeZoneEditor;

  const chkRoads = editor.querySelector('#chk-auto-roads');
  chkRoads.onchange = () => { zoneEditorState.autoRoads = chkRoads.checked; };

  const chkUtils = editor.querySelector('#chk-auto-utils');
  chkUtils.onchange = () => { zoneEditorState.autoUtilities = chkUtils.checked; };

  const btnUndo = editor.querySelector('#btn-zone-undo');
  btnUndo.onclick = () => {
    undoZoneStep();
  };

  const btnApply = editor.querySelector('#btn-zone-apply');
  btnApply.onclick = () => {
    applyZoneProject();
  };
}

export function closeZoneEditor() {
  zoneEditorState.isOpen = false;
  const editor = document.getElementById('zone-editor-modal');
  if (editor) editor.remove();
}

export function pushZoneSnapshot(action) {
  zoneEditorState.history.push(action);
}

export function undoZoneStep() {
  const g = uiState.g;
  if (!g || !zoneEditorState.history.length) {
    if (g) g.say('Nenhum passo para desfazer.');
    return;
  }
  const lastAction = zoneEditorState.history.pop();
  if (lastAction && lastAction.revert) {
    lastAction.revert(g);
    g.recalc();
    uiState.dirty = true;
    g.say('↩️ Projeto desfeito com sucesso.');
  }
}

export function applyZoneProject() {
  const g = uiState.g;
  if (!g) return;
  closeZoneEditor();
  g.recalc();
  uiState.dirty = true;
  g.say('✓ Obras de zoneamento e infraestrutura confirmadas!');
}
