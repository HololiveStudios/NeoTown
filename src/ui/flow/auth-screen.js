import { el } from '../dom.js';
import { loginUser } from '../../persistence/remote-storage.js';

export function createAuthScreen({ onSuccess }) {
  const overlay = el('div', 'flow-overlay');
  overlay.id = 'flow-auth-screen';

  overlay.innerHTML = `
    <div class="px flow-card">
      <div class="flow-header">
        <div class="flow-logo-container">
          <img src="/logo.png" alt="NeoTown Logo" class="flow-logo-img" />
          <div>
            <div class="flow-title">NeoTown Online</div>
            <div class="flow-subtitle">Autenticação e Acesso ao Gabinete do Prefeito • v1.0.0</div>
          </div>
        </div>
      </div>
      <form id="auth-form" class="flow-body">
        <div class="flow-field">
          <label class="flow-label" for="auth-username">Nome do Prefeito / Usuário:</label>
          <input class="flow-input" id="auth-username" type="text" placeholder="Ex: admin ou Carlos" required autocomplete="username" />
        </div>
        <div class="flow-field">
          <label class="flow-label" for="auth-password">Senha de Acesso:</label>
          <input class="flow-input" id="auth-password" type="password" placeholder="Digite sua senha" required autocomplete="current-password" />
        </div>
        <div id="auth-error" style="color: #ff8a7a; font-size: 12px; display: none;"></div>
        <div class="flow-row" style="margin-top: 6px;">
          <button type="button" class="pb sm" id="btn-fill-demo" title="Preenche as credenciais padrão de desenvolvimento">
            Preencher Demo (admin / admin)
          </button>
        </div>
        <div class="flow-actions">
          <button type="submit" class="pb ok" id="btn-auth-submit" style="min-width: 140px;">
            Entrar / Cadastrar
          </button>
        </div>
      </form>
    </div>
  `;

  const form = overlay.querySelector('#auth-form');
  const userInput = overlay.querySelector('#auth-username');
  const passInput = overlay.querySelector('#auth-password');
  const errorDiv = overlay.querySelector('#auth-error');
  const demoBtn = overlay.querySelector('#btn-fill-demo');
  const submitBtn = overlay.querySelector('#btn-auth-submit');

  demoBtn.onclick = () => {
    userInput.value = 'admin';
    passInput.value = 'admin';
    errorDiv.style.display = 'none';
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Autenticando...';

    try {
      const res = await loginUser(userInput.value, passInput.value);
      if (res && res.ok) {
        overlay.remove();
        if (onSuccess) onSuccess(res.user);
      } else {
        errorDiv.textContent = res.error || 'Erro ao autenticar.';
        errorDiv.style.display = 'block';
      }
    } catch (err) {
      errorDiv.textContent = err.message || 'Falha de conexão com o servidor.';
      errorDiv.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar / Cadastrar';
    }
  };

  return overlay;
}
