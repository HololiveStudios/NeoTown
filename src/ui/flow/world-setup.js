import { el } from '../dom.js';
import { Delta } from '../../api/delta-api.js';
import { MC } from '../app-loop.js';

const CITY_NAMES = [
  'Nova Aurora', 'Porto Real', 'Vale Verde', 'Serra Azul', 'Bela Vista',
  'Vila Serena', 'Ponta do Sol', 'Monte Claro', 'Rio Bonito', 'Horizonte NeoTown'
];

export function createWorldSetupModal({ onCancel, onConfirm }) {
  const overlay = el('div', 'flow-overlay');
  overlay.id = 'flow-world-setup';

  let currentSeed = (Date.now() & 0xffffff) >>> 0;
  let currentSize = 48;
  let currentType = 'lake';
  let currentDifficulty = 'medium';
  let isStarter = false;

  overlay.innerHTML = `
    <div class="px flow-card wide">
      <div class="flow-header">
        <div>
          <div class="flow-title">Fundação de Novo Território</div>
          <div class="flow-subtitle">Configure os parâmetros geográficos e econômicos do seu mundo</div>
        </div>
      </div>

      <div class="flow-body" style="display: grid; grid-template-columns: 1fr 180px; gap: 16px;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Nome da Cidade -->
          <div class="flow-field">
            <label class="flow-label">Nome da Cidade:</label>
            <div class="flow-row">
              <input class="flow-input" id="setup-name" style="flex: 1;" value="${CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)]}" />
              <button class="pb sm" id="btn-rand-name" type="button" title="Gerar outro nome aleatório">🎲</button>
            </div>
          </div>

          <!-- Semente Procedural -->
          <div class="flow-field">
            <label class="flow-label">Semente Procedural (Seed Determinística):</label>
            <div class="flow-row">
              <input class="flow-input" id="setup-seed" type="number" style="flex: 1;" value="${currentSeed}" />
              <button class="pb sm" id="btn-rand-seed" type="button" title="Gerar nova semente aleatória">🎲</button>
            </div>
          </div>

          <!-- Tamanho e Topografia -->
          <div class="flow-row" style="gap: 12px;">
            <div class="flow-field" style="flex: 1;">
              <label class="flow-label">Tamanho do Mapa:</label>
              <select class="flow-input" id="setup-size">
                <option value="32">Pequeno (32x32)</option>
                <option value="48" selected>Médio (48x48) - Padrão</option>
                <option value="64">Grande (64x64)</option>
                <option value="96">Metrópole (96x96)</option>
              </select>
            </div>
            <div class="flow-field" style="flex: 1;">
              <label class="flow-label">Topografia / Relevo:</label>
              <select class="flow-input" id="setup-type">
                <option value="continent">Continente Amplo</option>
                <option value="lake" selected>Bacia com Lago Central</option>
                <option value="river">Vale com Rio Cortante</option>
                <option value="island">Ilha Costeira</option>
              </select>
            </div>
          </div>

          <!-- Modo de Jogo e Dificuldade -->
          <div class="flow-field">
            <label class="flow-label">Modo de Jogo / Capital Inicial Governamental:</label>
            <select class="flow-input" id="setup-diff">
              <option value="easy">Fácil (Aporte Governamental: $35.000 • Inflação moderada)</option>
              <option value="medium" selected>Médio (Aporte Governamental: $18.000 • Realista)</option>
              <option value="hard">Difícil (Aporte Governamental: $10.000 • Austeridade fiscal)</option>
              <option value="sandbox">Sandbox (Recursos Ilimitados: $999.999)</option>
            </select>
          </div>

          <!-- Opção de Ponto de Partida -->
          <div class="flow-field" style="margin-top: 4px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #bee3ff; cursor: pointer;">
              <input type="checkbox" id="setup-starter" style="width: 16px; height: 16px;" />
              <span>Construir <b>Cidade Pioneira</b> demonstrativa (starter com prédios prontos)</span>
            </label>
            <div style="font-size: 11px; color: #8bb3cf; margin-left: 24px;">
              Deixe desmarcado para começar em <b>Terreno Virgem</b> (experiência autêntica de fundação).
            </div>
          </div>
        </div>

        <!-- Coluna da Direita: Preview do Terreno -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
          <div class="flow-label" style="text-align: center;">Prévia do Relevo:</div>
          <canvas id="setup-preview-canvas" class="flow-preview-canvas" width="160" height="160"></canvas>
          <div id="setup-preview-desc" style="font-size: 11px; color: #8bb3cf; text-align: center;">
            Semente: <b id="lbl-preview-seed">${currentSeed}</b>
          </div>
        </div>
      </div>

      <div class="flow-actions">
        <button type="button" class="pb no" id="btn-cancel-setup">Cancelar</button>
        <button type="button" class="pb ok" id="btn-confirm-setup" style="min-width: 160px; font-size: 14px;">
          Fundar Cidade
        </button>
      </div>
    </div>
  `;

  const nameInput = overlay.querySelector('#setup-name');
  const seedInput = overlay.querySelector('#setup-seed');
  const sizeSelect = overlay.querySelector('#setup-size');
  const typeSelect = overlay.querySelector('#setup-type');
  const diffSelect = overlay.querySelector('#setup-diff');
  const starterCheck = overlay.querySelector('#setup-starter');
  const previewCanvas = overlay.querySelector('#setup-preview-canvas');
  const previewSeedLbl = overlay.querySelector('#lbl-preview-seed');

  const randNameBtn = overlay.querySelector('#btn-rand-name');
  const randSeedBtn = overlay.querySelector('#btn-rand-seed');
  const cancelBtn = overlay.querySelector('#btn-cancel-setup');
  const confirmBtn = overlay.querySelector('#btn-confirm-setup');

  randNameBtn.onclick = () => {
    nameInput.value = CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)];
  };

  randSeedBtn.onclick = () => {
    currentSeed = (Date.now() & 0xffffff) >>> 0;
    seedInput.value = currentSeed;
    updatePreview();
  };

  seedInput.oninput = () => {
    currentSeed = (parseInt(seedInput.value, 10) || 0) >>> 0;
    updatePreview();
  };

  sizeSelect.onchange = () => {
    currentSize = parseInt(sizeSelect.value, 10);
    updatePreview();
  };

  typeSelect.onchange = () => {
    currentType = typeSelect.value;
    updatePreview();
  };

  diffSelect.onchange = () => {
    currentDifficulty = diffSelect.value;
  };

  starterCheck.onchange = () => {
    isStarter = starterCheck.checked;
  };

  cancelBtn.onclick = () => {
    overlay.remove();
    if (onCancel) onCancel();
  };

  confirmBtn.onclick = () => {
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Gerando mundo...';

    const config = {
      name: nameInput.value.trim() || 'NeoTown',
      seed: currentSeed,
      size: currentSize,
      type: currentType,
      difficulty: currentDifficulty,
      starter: isStarter
    };

    overlay.remove();
    if (onConfirm) onConfirm(config);
  };

  function updatePreview() {
    previewSeedLbl.textContent = currentSeed;
    const ctx = previewCanvas.getContext('2d');
    const N = Math.min(48, currentSize);
    const img = ctx.createImageData(160, 160);
    const u32 = new Uint32Array(img.data.buffer);

    try {
      // Cria temporário leve apenas para terreno
      const tempGame = new Delta.Game({
        seed: currentSeed,
        size: N,
        type: currentType,
        starter: false
      });

      // Renderiza mapa topográfico 2D em 160x160
      const scale = 160 / N;
      for (let py = 0; py < 160; py++) {
        const ty = Math.floor(py / scale);
        for (let px = 0; px < 160; px++) {
          const tx = Math.floor(px / scale);
          const i = ty * N + tx;
          const bio = tempGame.bio[i];
          const baseCol = MC[bio] || [78, 120, 56];
          const elev = tempGame.elev[i] || 0;
          const factor = 0.8 + elev * 0.05;

          const r = Math.min(255, Math.floor(baseCol[0] * factor));
          const g = Math.min(255, Math.floor(baseCol[1] * factor));
          const b = Math.min(255, Math.floor(baseCol[2] * factor));

          u32[py * 160 + px] = 0xff000000 | (b << 16) | (g << 8) | r;
        }
      }
      ctx.putImageData(img, 0, 0);
    } catch (e) {
      ctx.fillStyle = '#0b2a46';
      ctx.fillRect(0, 0, 160, 160);
    }
  }

  // Desenha prévia inicial
  setTimeout(updatePreview, 10);

  return overlay;
}
