const TOKEN_KEY = 'neotown_token';
const USER_KEY = 'neotown_user';
const LEGACY_TOKEN_KEY = 'delta_city_token';
const LEGACY_USER_KEY = 'delta_city_user';

export const remoteAuth = {
  token: localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY) || null,
  user: null,

  init() {
    try {
      const u = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
      if (u) this.user = JSON.parse(u);
    } catch (e) {}
  },

  isAuthenticated() {
    return !!this.token;
  },

  setSession(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
    }
  },

  clear() {
    this.setSession(null, null);
  }
};

remoteAuth.init();

// Controle de fila Single-Flight e Dirty Check para evitar colisões e tráfego redundante na nuvem
const saveLocks = new Map();       // cityId -> boolean (isSaving)
const pendingPayloads = new Map(); // cityId -> { cityData, force, keepalive, resolve, reject }
const lastSignatures = new Map();  // cityId -> string (quick signature)
const cityVersions = new Map();    // cityId -> number (OCC version)

function computeQuickSignature(d) {
  if (!d) return '';
  return `${d.day}|${d.month}|${d.year}|${d.funds}|${d.pop}|${d.cityPoints}|${(d.kind || '').slice(0, 64)}|${(d.built || '').slice(0, 64)}`;
}

const EDGE_WORKER_ORIGIN = 'https://neotown.ca88321499.workers.dev';

function resolveApiUrl(endpoint) {
  if (typeof window !== 'undefined' && window.location) {
    const hn = window.location.hostname;
    if (hn.endsWith('.pages.dev') || hn === 'localhost' || hn === '127.0.0.1') {
      return EDGE_WORKER_ORIGIN + endpoint;
    }
  }
  return endpoint;
}

async function apiRequest(endpoint, method = 'GET', body = null, keepalive = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (remoteAuth.token) {
    headers['Authorization'] = `Bearer ${remoteAuth.token}`;
  }

  const opt = { method, headers };
  if (keepalive) opt.keepalive = true;
  if (body) opt.body = JSON.stringify(body);

  const res = await fetch(resolveApiUrl(endpoint), opt);
  if (!res.ok) {
    let errMessage = `Erro HTTP ${res.status}`;
    try {
      const errData = await res.json();
      if (errData && errData.error) errMessage = errData.error;
    } catch (e) {}
    const err = new Error(errMessage);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

export async function loginUser(username, password) {
  const data = await apiRequest('/api/auth/login', 'POST', { username, password });
  if (data && data.token) {
    remoteAuth.setSession(data.token, data.user);
  }
  return data;
}

export async function verifySession() {
  if (!remoteAuth.token) return null;
  try {
    const data = await apiRequest('/api/auth/session', 'GET');
    if (data && data.user) {
      remoteAuth.user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
  } catch (e) {
    remoteAuth.clear();
  }
  return null;
}

export function logoutUser() {
  remoteAuth.clear();
}

export async function fetchRemoteCities() {
  const data = await apiRequest('/api/cities', 'GET');
  return data.cities || [];
}

export async function loadRemoteCity(cityId) {
  const data = await apiRequest(`/api/cities/${cityId}`, 'GET');
  if (data && data.city) {
    const v = data.version || data.city.version || 1;
    cityVersions.set(cityId, v);
    data.city.version = v;
    lastSignatures.set(cityId, computeQuickSignature(data.city));
  }
  return data.city;
}

export async function saveRemoteCity(cityId, cityData, options = {}) {
  const { force = false, keepalive = false } = options;

  // Criação inicial da cidade (POST)
  if (!cityId) {
    const res = await apiRequest('/api/cities', 'POST', { data: cityData }, keepalive);
    if (res && res.id) {
      const v = res.version || (res.meta && res.meta.version) || 1;
      cityVersions.set(res.id, v);
      cityData.version = v;
      lastSignatures.set(res.id, computeQuickSignature(cityData));
    }
    return res;
  }

  // Dirty check: se não for forçado e nada mudou, evita tráfego redundante na borda
  const sig = computeQuickSignature(cityData);
  if (!force && lastSignatures.get(cityId) === sig) {
    return { ok: true, id: cityId, skipped: true };
  }

  // Single-Flight Lock: se já existe um PUT em andamento para esta cidade, enfileira o mais recente
  if (saveLocks.get(cityId)) {
    return new Promise((resolve, reject) => {
      pendingPayloads.set(cityId, { cityData, force, keepalive, resolve, reject });
    });
  }

  saveLocks.set(cityId, true);
  try {
    const currentVersion = cityVersions.get(cityId) || cityData.version || 1;
    cityData.version = currentVersion;
    const res = await apiRequest(
      `/api/cities/${cityId}`,
      'PUT',
      { data: cityData, expectedVersion: currentVersion },
      keepalive
    );
    const nextVersion = (res && (res.version || (res.meta && res.meta.version))) || (currentVersion + 1);
    cityVersions.set(cityId, nextVersion);
    cityData.version = nextVersion;
    lastSignatures.set(cityId, sig);
    return res;
  } catch (err) {
    if (err && err.status === 409) {
      console.warn('Conflito de versão detectado (409). Sincronizando versão com a borda Cloudflare.');
    }
    throw err;
  } finally {
    saveLocks.set(cityId, false);
    const next = pendingPayloads.get(cityId);
    if (next) {
      pendingPayloads.delete(cityId);
      saveRemoteCity(cityId, next.cityData, { force: next.force, keepalive: next.keepalive })
        .then(next.resolve)
        .catch(next.reject);
    }
  }
}

export async function deleteRemoteCity(cityId) {
  saveLocks.delete(cityId);
  pendingPayloads.delete(cityId);
  lastSignatures.delete(cityId);
  cityVersions.delete(cityId);
  return await apiRequest(`/api/cities/${cityId}`, 'DELETE');
}

export async function fetchLeaderboard() {
  const data = await apiRequest('/api/leaderboard', 'GET');
  return data.leaderboard || [];
}

export async function sendCityAction(cityId, action) {
  if (!cityId) return null;
  return await apiRequest(`/api/city/${cityId}/action`, 'POST', action);
}


