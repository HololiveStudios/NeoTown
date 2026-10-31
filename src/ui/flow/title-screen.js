import { el } from '../dom.js';
import { remoteAuth, logoutUser, fetchRemoteCities, loadRemoteCity, deleteRemoteCity } from '../../persistence/remote-storage.js';

export function createTitleScreen({ onNewWorld, onLoadCity, onLogout }) {
  const overlay = el('div', 'flow-overlay');
  overlay.id = 'flow-title-screen';

  const username = remoteAuth.user ? remoteAuth.user.username : 'Prefeito';
  const role = remoteAuth.user ? remoteAuth.user.role : 'player';

  overlay.innerHTML = `
    <div class="px flow-card wide">
      <div class="flow-header">
        <div>
          <div class="flow-title">Delta City</div>
          <div class="flow-subtitle">Gabinete de Gestão Urbana Online • v4.0.0</div>
        </div>
        <div style="font-size: 12px; color: #bee3ff; text-align: right;">
          <div>Prefeito(a): <b style="color: #ffd24a;">${username}</b></div>
          <div style="color: #8bb3cf; font-size: 11px;">Acesso: ${role.toUpperCase()}</div>
        </div>
      </div>

      <div class="flow-body">
        <div style="display: flex; gap: 10px; align-items: center; justify-content: space-between;">
          <button class="pb ok" id="btn-create-world" style="min-width: 170px; font-size: 14px;">
            + Fundar Novo Mundo
          </button>
          <button class="pb sm no" id="btn-logout" title="Desconectar do servidor">
            Trocar Prefeito / Sair
          </button>
        </div>

        <div style="border-top: 1px solid #1c6b9e; padding-top: 10px;">
          <div class="flow-label" style="margin-bottom: 6px;">Cidades Salvas no Servidor:</div>
          <div class="flow-city-list" id="city-list-container">
            <div style="color: #8bb3cf; font-size: 12px; padding: 12px; text-align: center;">Carregando cidades do servidor...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const newWorldBtn = overlay.querySelector('#btn-create-world');
  const logoutBtn = overlay.querySelector('#btn-logout');
  const listContainer = overlay.querySelector('#city-list-container');

  newWorldBtn.onclick = () => {
    if (onNewWorld) onNewWorld();
  };

  logoutBtn.onclick = () => {
    logoutUser();
    overlay.remove();
    if (onLogout) onLogout();
  };

  async function refreshCities() {
    try {
      const cities = await fetchRemoteCities();
      if (!cities || cities.length === 0) {
        listContainer.innerHTML = `
          <div style="color: #a4c8e0; font-size: 13px; padding: 24px; text-align: center; border: 1px dashed #1c6b9e; border-radius: 8px;">
            Nenhuma cidade encontrada neste gabinete.<br/>
            Clique em <b>"+ Fundar Novo Mundo"</b> para colonizar seu primeiro território!
          </div>
        `;
        return;
      }

      listContainer.innerHTML = '';
      cities.forEach(city => {
        const item = el('div', 'flow-city-item');
        const updatedDate = city.updatedAt ? new Date(city.updatedAt).toLocaleString('pt-BR') : 'Recentemente';
        const fundsStr = city.funds != null ? '$' + (Math.abs(city.funds) >= 1000 ? (city.funds / 1000).toFixed(1) + 'K' : city.funds) : '$28.0K';

        item.innerHTML = `
          <div class="flow-city-meta">
            <div class="flow-city-name">${city.name || 'Delta City'}</div>
            <div class="flow-city-details">
              População: <b style="color: #7be08a;">${city.pop || 0}</b> • Caixa: <b style="color: #ffd24a;">${fundsStr}</b> • Ano: ${city.year || 2026}
            </div>
            <div class="flow-city-details" style="color: #6a9ab8;">
              Tamanho: ${city.size}x${city.size} • Bioma: ${city.type} • Modo: ${city.difficulty} • Salvo em: ${updatedDate}
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="pb ok sm btn-play-city">Jogar</button>
            <button class="pb no sm btn-del-city" title="Excluir cidade">X</button>
          </div>
        `;

        item.querySelector('.btn-play-city').onclick = async () => {
          const btn = item.querySelector('.btn-play-city');
          btn.disabled = true;
          btn.textContent = 'Carregando...';
          try {
            const fullCityData = await loadRemoteCity(city.id);
            overlay.remove();
            if (onLoadCity) onLoadCity(fullCityData);
          } catch (err) {
            alert('Falha ao carregar cidade: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Jogar';
          }
        };

        item.querySelector('.btn-del-city').onclick = async () => {
          if (!confirm(`Deseja realmente excluir a cidade "${city.name}" permanentemente?`)) return;
          try {
            await deleteRemoteCity(city.id);
            refreshCities();
          } catch (err) {
            alert('Falha ao excluir cidade: ' + err.message);
          }
        };

        listContainer.appendChild(item);
      });
    } catch (err) {
      listContainer.innerHTML = `<div style="color: #ff8a7a; padding: 12px;">Erro ao carregar cidades: ${err.message}</div>`;
    }
  }

  refreshCities();

  return overlay;
}
