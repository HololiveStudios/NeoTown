import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function createApiHandler(rootDir) {
  const dataDir = path.join(rootDir, 'data');
  const savesDir = path.join(dataDir, 'saves');
  const usersFile = path.join(dataDir, 'users.json');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(savesDir)) fs.mkdirSync(savesDir, { recursive: true });

  function loadUsers() {
    try {
      if (fs.existsSync(usersFile)) {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      }
    } catch (e) {}
    const defaultUsers = {
      admin: {
        id: 'usr_admin',
        username: 'admin',
        passwordHash: hashPassword('admin'),
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    };
    saveUsers(defaultUsers);
    return defaultUsers;
  }

  function saveUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  }

  function hashPassword(pwd) {
    return crypto.createHash('sha256').update(String(pwd)).digest('hex');
  }

  const sessions = new Map(); // token -> { userId, username, role, expiresAt }

  function authenticateRequest(req) {
    const authHeader = req.headers['authorization'] || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    const token = match[1];
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return session;
  }

  function getUserSavesDir(userId) {
    const dir = path.join(savesDir, userId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  function getUserIndexFile(userId) {
    return path.join(getUserSavesDir(userId), 'index.json');
  }

  function loadUserCities(userId) {
    const file = getUserIndexFile(userId);
    try {
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
    return [];
  }

  function saveUserCities(userId, list) {
    fs.writeFileSync(getUserIndexFile(userId), JSON.stringify(list, null, 2), 'utf8');
  }

  function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    });
    res.end(JSON.stringify(data));
  }

  function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > 25 * 1024 * 1024) { // 25MB limit
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }

  return async function handleApi(req, res, pathname) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      });
      res.end();
      return true;
    }

    if (!pathname.startsWith('/api/')) return false;

    try {
      // POST /api/auth/login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const username = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!username || !password) {
          sendJson(res, 400, { ok: false, error: 'Usuário e senha são obrigatórios.' });
          return true;
        }

        const users = loadUsers();
        let user = users[username];

        if (!user) {
          // Auto-registro para novos prefeitos
          user = {
            id: 'usr_' + crypto.randomUUID().slice(0, 8),
            username,
            passwordHash: hashPassword(password),
            role: username === 'admin' ? 'admin' : 'player',
            createdAt: new Date().toISOString()
          };
          users[username] = user;
          saveUsers(users);
        } else {
          // Validação de senha
          if (user.passwordHash !== hashPassword(password)) {
            sendJson(res, 401, { ok: false, error: 'Credenciais inválidas.' });
            return true;
          }
        }

        const token = 'tok_' + crypto.randomBytes(24).toString('hex');
        const session = {
          userId: user.id,
          username: user.username,
          role: user.role,
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 dias
        };
        sessions.set(token, session);

        sendJson(res, 200, {
          ok: true,
          token,
          user: { id: user.id, username: user.username, role: user.role }
        });
        return true;
      }

      // GET /api/auth/session
      if (pathname === '/api/auth/session' && req.method === 'GET') {
        const session = authenticateRequest(req);
        if (!session) {
          sendJson(res, 401, { ok: false, error: 'Sessão inválida ou expirada.' });
          return true;
        }
        sendJson(res, 200, {
          ok: true,
          user: { id: session.userId, username: session.username, role: session.role }
        });
        return true;
      }

      // Protected City Routes
      const session = authenticateRequest(req);
      if (!session) {
        sendJson(res, 401, { ok: false, error: 'Autenticação necessária para acessar cidades.' });
        return true;
      }

      // GET /api/cities
      if (pathname === '/api/cities' && req.method === 'GET') {
        const cities = loadUserCities(session.userId);
        sendJson(res, 200, { ok: true, cities });
        return true;
      }

      // GET /api/cities/:id
      const cityIdMatch = pathname.match(/^\/api\/cities\/([a-zA-Z0-9_-]+)$/);
      if (cityIdMatch && req.method === 'GET') {
        const cityId = cityIdMatch[1];
        const cityFile = path.join(getUserSavesDir(session.userId), `${cityId}.json`);
        if (!fs.existsSync(cityFile)) {
          sendJson(res, 404, { ok: false, error: 'Cidade não encontrada.' });
          return true;
        }
        const data = JSON.parse(fs.readFileSync(cityFile, 'utf8'));
        sendJson(res, 200, { ok: true, city: data });
        return true;
      }

      // POST /api/cities (Cria ou salva nova cidade)
      if (pathname === '/api/cities' && req.method === 'POST') {
        const body = await parseBody(req);
        const cityId = body.id || 'city_' + crypto.randomUUID().slice(0, 8);
        const cityData = body.data || body;
        cityData.id = cityId;
        cityData.updatedAt = new Date().toISOString();

        const cityFile = path.join(getUserSavesDir(session.userId), `${cityId}.json`);
        fs.writeFileSync(cityFile, JSON.stringify(cityData), 'utf8');

        // Atualiza index
        const list = loadUserCities(session.userId);
        const meta = {
          id: cityId,
          name: cityData.name || 'Nova Cidade',
          pop: cityData.pop || 0,
          funds: cityData.funds ?? 28000,
          year: cityData.year || 2026,
          seed: cityData.seed,
          size: cityData.N || 48,
          type: cityData.type || 'lake',
          difficulty: cityData.gameMode || 'medium',
          updatedAt: cityData.updatedAt
        };
        const existingIdx = list.findIndex(c => c.id === cityId);
        if (existingIdx >= 0) list[existingIdx] = meta;
        else list.unshift(meta);
        saveUserCities(session.userId, list);

        sendJson(res, 201, { ok: true, id: cityId, meta });
        return true;
      }

      // PUT /api/cities/:id (Atualiza cidade existente)
      if (cityIdMatch && req.method === 'PUT') {
        const cityId = cityIdMatch[1];
        const body = await parseBody(req);
        const cityData = body.data || body;
        cityData.id = cityId;
        cityData.updatedAt = new Date().toISOString();

        const cityFile = path.join(getUserSavesDir(session.userId), `${cityId}.json`);
        fs.writeFileSync(cityFile, JSON.stringify(cityData), 'utf8');

        // Atualiza index
        const list = loadUserCities(session.userId);
        const meta = {
          id: cityId,
          name: cityData.name || 'Cidade',
          pop: cityData.pop || 0,
          funds: cityData.funds ?? 28000,
          year: cityData.year || 2026,
          seed: cityData.seed,
          size: cityData.N || 48,
          type: cityData.type || 'lake',
          difficulty: cityData.gameMode || 'medium',
          updatedAt: cityData.updatedAt
        };
        const existingIdx = list.findIndex(c => c.id === cityId);
        if (existingIdx >= 0) list[existingIdx] = meta;
        else list.unshift(meta);
        saveUserCities(session.userId, list);

        sendJson(res, 200, { ok: true, id: cityId, meta });
        return true;
      }

      // DELETE /api/cities/:id
      if (cityIdMatch && req.method === 'DELETE') {
        const cityId = cityIdMatch[1];
        const cityFile = path.join(getUserSavesDir(session.userId), `${cityId}.json`);
        if (fs.existsSync(cityFile)) fs.unlinkSync(cityFile);

        const list = loadUserCities(session.userId).filter(c => c.id !== cityId);
        saveUserCities(session.userId, list);

        sendJson(res, 200, { ok: true });
        return true;
      }

      sendJson(res, 404, { ok: false, error: 'Endpoint não encontrado.' });
      return true;
    } catch (err) {
      console.error('API Error:', err);
      sendJson(res, 500, { ok: false, error: 'Erro interno no servidor de dados.' });
      return true;
    }
  };
}
