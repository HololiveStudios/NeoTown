import { Delta } from '../../api/delta-api.js';
import { uiState } from '../app-loop.js';
import { setHudVisible, hud } from '../hud.js';
import { buildItems } from '../build-menu.js';
import { remoteAuth, verifySession, saveRemoteCity } from '../../persistence/remote-storage.js';
import { createAuthScreen } from './auth-screen.js';
import { createTitleScreen } from './title-screen.js';
import { createWorldSetupModal } from './world-setup.js';

function findBestPlainCenter(g) {
  const N = g.N;
  let bestX = Math.floor(N / 2), bestY = Math.floor(N / 2);
  let maxScore = -999;
  for (let y = 6; y < N - 6; y += 3) {
    for (let x = 6; x < N - 6; x += 3) {
      let score = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (y + dy) * N + (x + dx);
          const b = g.bio[idx];
          if (b === 1) score += 3; // Plain
          else if (b === 2) score += 1; // Forest
          else if (b === 0) score -= 4; // Water
          else if (b === 3) score -= 2; // Hill
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestX = x;
        bestY = y;
      }
    }
  }
  return { x: bestX, y: bestY };
}

function showOnboardingToast(g) {
  const old = document.getElementById('mission-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'mission-toast';
  toast.className = 'mission-toast';
  toast.innerHTML = `
    <div class="mission-toast-header">
      <div class="mission-toast-title">🏛️ Bem-vindo, Prefeito!</div>
      <button class="mission-toast-close" id="close-toast">&times;</button>
    </div>
    <div class="mission-toast-body">
      <div>Seu novo território virgem está pronto para ser fundado:</div>
      <div class="mission-step"><span>1.</span> Trace uma primeira <b>Estrada</b>.</div>
      <div class="mission-step"><span>2.</span> Forneça <b>Energia</b> e <b>Água</b>.</div>
      <div class="mission-step"><span>3.</span> Zoneie lotes <b>Residenciais</b> e <b>Comerciais</b>.</div>
      <div style="margin-top: 4px; font-size: 11px; color: #ffd24a;">
        💡 Pressione <b>▶</b> na barra de velocidade quando quiser iniciar a vida da cidade!
      </div>
    </div>
  `;
  document.body.appendChild(toast);

  const closeBtn = toast.querySelector('#close-toast');
  if (closeBtn) closeBtn.onclick = () => toast.remove();

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 20000);
}

export function celebrateLevelUp(rankData) {
  const existing = document.getElementById('levelup-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'levelup-modal';
  overlay.className = 'levelup-overlay';
  overlay.innerHTML = `
    <div class="levelup-card">
      <div class="levelup-badge">🏆</div>
      <div class="levelup-title">PARABÉNS, PREFEITO!</div>
      <div class="levelup-subtitle">Sua cidade evoluiu para o Rank ${rankData.rank}: <b>${rankData.name}</b>!</div>
      <div class="levelup-details">
        <div><span>👥 População:</span> ${rankData.minPop.toLocaleString()}+ cidadãos</div>
        <div><span>💰 Bônus Municipal:</span> <b style="color:#7be08a">+$${rankData.bonus.toLocaleString()}</b> creditados</div>
        <div><span>🔓 Desbloqueios:</span> <b style="color:#ffd24a">${rankData.unlocks}</b></div>
      </div>
      <button class="pb ok" id="close-levelup" style="padding: 10px 24px; font-size: 14px; font-weight: 700; cursor: pointer;">
        🎉 CONTINUAR GOVERNANDO
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  const btn = overlay.querySelector('#close-levelup');
  if (btn) btn.onclick = () => overlay.remove();
}

if (typeof window !== 'undefined') {
  window.DeltaCelebrateLevelUp = celebrateLevelUp;
}

export const ScreenManager = {
  state: 'BOOT', // 'BOOT' | 'AUTH' | 'TITLE' | 'WORLD_CONFIG' | 'IN_GAME'
  currentOverlay: null,
  autoSaveTimer: null,

  async init() {
    setHudVisible(false);

    // Valida sessão existente
    const user = await verifySession();
    if (user) {
      this.showTitleScreen();
    } else {
      this.showAuthScreen();
    }
  },

  clearOverlay() {
    if (this.currentOverlay) {
      this.currentOverlay.remove();
      this.currentOverlay = null;
    }
    const existing = document.querySelectorAll('.flow-overlay');
    existing.forEach(el => el.remove());
  },

  showAuthScreen() {
    this.state = 'AUTH';
    this.clearOverlay();
    setHudVisible(false);

    this.currentOverlay = createAuthScreen({
      onSuccess: (user) => {
        this.showTitleScreen();
      }
    });
    document.body.appendChild(this.currentOverlay);
  },

  showTitleScreen() {
    this.state = 'TITLE';
    this.clearOverlay();
    setHudVisible(false);

    this.currentOverlay = createTitleScreen({
      onNewWorld: () => {
        this.showWorldSetup();
      },
      onLoadCity: (cityData) => {
        this.loadAndEnterCity(cityData);
      },
      onLogout: () => {
        this.showAuthScreen();
      }
    });
    document.body.appendChild(this.currentOverlay);
  },

  showWorldSetup() {
    this.state = 'WORLD_CONFIG';
    this.clearOverlay();

    this.currentOverlay = createWorldSetupModal({
      onCancel: () => {
        this.showTitleScreen();
      },
      onConfirm: async (config) => {
        await this.createNewCity(config);
      }
    });
    document.body.appendChild(this.currentOverlay);
  },

  async createNewCity(config) {
    const mayor = remoteAuth.user ? remoteAuth.user.username : 'Prefeito';
    const g = new Delta.Game({
      name: config.name,
      seed: config.seed,
      size: config.size,
      type: config.type,
      difficulty: config.difficulty,
      mayorName: mayor,
      starter: config.starter === true
    });

    // Salva imediatamente no servidor para registrar o ID remoto
    try {
      const res = await saveRemoteCity(null, g.toJSON(), { force: true });
      if (res && res.id) {
        g.id = res.id;
        g.version = res.version || 1;
      }
    } catch (e) {
      console.warn('Aviso: Falha ao registrar save inicial no servidor:', e);
    }

    this.enterGame(g, true);
  },

  loadAndEnterCity(cityData) {
    const g = Delta.Game.fromJSON(cityData);
    this.enterGame(g, false);
  },

  enterGame(g, isNew) {
    this.state = 'IN_GAME';
    this.clearOverlay();

    uiState.g = g;
    Delta.game = g;
    Delta.Script.bootCity(g, isNew);

    uiState.hwF = 28;
    // Centralização inteligente da câmera na melhor planície
    const center = findBestPlainCenter(g);
    uiState.u0 = center.x - center.y;
    uiState.v0 = center.x + center.y + 1;
    uiState.dirty = true;

    setHudVisible(true);
    buildItems();
    hud();

    // Início obrigatoriamente pausado
    g.speed = 0;
    if (isNew) {
      g.say('Bem-vindo, Prefeito! Território virgem pronto. Pressione ▶ para iniciar o tempo.');
      showOnboardingToast(g);
    } else {
      g.say('Cidade carregada do servidor. Simulação em pausa.');
    }

    this.initAutoSave(g);
  },

  initAutoSave(g) {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    this.autoSaveTimer = setInterval(async () => {
      if (this.state === 'IN_GAME' && uiState.g && uiState.g.id) {
        try {
          await saveRemoteCity(uiState.g.id, uiState.g.toJSON());
        } catch (e) {
          console.warn('Erro no auto-save remoto:', e);
        }
      }
    }, 25000); // A cada 25 segundos

    if (!this._unloadBound && typeof document !== 'undefined') {
      this._unloadBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.state === 'IN_GAME' && uiState.g && uiState.g.id) {
          saveRemoteCity(uiState.g.id, uiState.g.toJSON(), { keepalive: true }).catch(() => {});
        }
      });
    }
  }
};
