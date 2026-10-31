// Delta City — Cloudflare Worker + Durable Objects (CitySession) + D1 + KV Edge Backend

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders
    }
  });
}

// --- Web Crypto Helpers (SHA-256 & Stateless HMAC-SHA256 Token) ---

async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return atob(b64);
}

async function signToken(payload, secret) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sig = toBase64Url(String.fromCharCode(...new Uint8Array(sigBuf)));
  return `${data}.${sig}`;
}

async function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const data = `${header}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(fromBase64Url(sig), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    const payload = JSON.parse(fromBase64Url(body));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const secret = env.JWT_SECRET || 'delta-city-edge-secret-key-2026';
  return await verifyToken(m[1], secret);
}

// --- Auto-Ensure D1 Schema ---
let schemaInitialized = false;
async function ensureSchema(db) {
  if (schemaInitialized || !db) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS delta_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_delta_users_username ON delta_users(username)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS delta_cities (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      pop INTEGER NOT NULL DEFAULT 0,
      funds INTEGER NOT NULL DEFAULT 28000,
      city_rank INTEGER NOT NULL DEFAULT 0,
      city_points INTEGER NOT NULL DEFAULT 0,
      year INTEGER NOT NULL DEFAULT 2026,
      seed INTEGER NOT NULL DEFAULT 1,
      size INTEGER NOT NULL DEFAULT 48,
      type TEXT NOT NULL DEFAULT 'lake',
      difficulty TEXT NOT NULL DEFAULT 'medium',
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_delta_cities_owner ON delta_cities(owner_id, updated_at DESC)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_delta_cities_leaderboard ON delta_cities(city_points DESC, pop DESC)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS delta_city_blobs (
      city_id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`)
  ]);
  schemaInitialized = true;
}

// --- Durable Object: CitySession (Single-Threaded Atomic Coordination per City) ---

export class CitySession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;
    this.grid = null;
    this.cityData = null;
    this.version = 1;
    this.clients = new Set();
  }

  async ensureLoaded() {
    if (!this.cityData) {
      const saved = await this.storage.get('cityData');
      if (saved) {
        this.cityData = saved;
        this.version = saved.version || 1;
      }
    }
    if (!this.grid) {
      this.grid = (await this.storage.get('grid')) || this.initGrid(32);
    }
  }

  initGrid(size = 32) {
    const grid = [];
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        row.push({ biome: 1, zone: 'none', level: 0 });
      }
      grid.push(row);
    }
    return grid;
  }

  applyAction(action) {
    const { x, y, zone, level } = action;
    const N = this.grid.length;
    if (x >= 0 && x < N && y >= 0 && y < N) {
      this.grid[y][x].zone = zone || 'none';
      this.grid[y][x].level = level !== undefined ? level : (zone && zone !== 'none' ? 1 : 0);
      this.version++;
      return { x, y, tile: this.grid[y][x], version: this.version };
    }
    return null;
  }

  broadcast(msgObj) {
    const str = JSON.stringify(msgObj);
    for (const ws of this.clients) {
      try {
        ws.send(str);
      } catch (e) {
        this.clients.delete(ws);
      }
    }
  }

  async fetch(request) {
    await this.ensureLoaded();
    const url = new URL(request.url);

    // WebSocket Upgrade for Real-Time Multiplayer / Co-op Diffs
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      server.accept();
      this.clients.add(server);
      server.addEventListener('message', async (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'action') {
            const diff = this.applyAction(msg);
            if (diff) {
              await this.storage.put('grid', this.grid);
              this.broadcast({ type: 'diff', diff });
            }
          }
        } catch (e) {}
      });
      server.addEventListener('close', () => this.clients.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }

    // POST /action — Atomic Tile Mutation
    if (url.pathname.endsWith('/action') && request.method === 'POST') {
      const data = await request.json();
      const diff = this.applyAction(data);
      await this.storage.put('grid', this.grid);
      if (diff) this.broadcast({ type: 'diff', diff });
      return jsonResponse({ status: 'success', diff, version: this.version });
    }

    // GET /state — Retrieve Full In-Memory State
    if (url.pathname.endsWith('/state') && request.method === 'GET') {
      return jsonResponse({
        ok: true,
        city: this.cityData,
        grid: this.grid,
        version: this.version
      });
    }

    // PUT /state — Atomic Save with Optimistic Concurrency Control
    if (url.pathname.endsWith('/state') && request.method === 'PUT') {
      const body = await request.json();
      const incoming = body.data || body;
      const expectedVersion = body.expectedVersion;

      if (expectedVersion !== undefined && this.cityData && expectedVersion < this.version) {
        return jsonResponse(
          { ok: false, error: 'Conflito de versão (409): estado mais recente já existe.', version: this.version },
          409
        );
      }

      this.version = (this.version || 0) + 1;
      incoming.version = this.version;
      this.cityData = incoming;
      await this.storage.put('cityData', this.cityData);
      this.broadcast({ type: 'sync', version: this.version, updatedAt: incoming.updatedAt });

      return jsonResponse({ ok: true, version: this.version });
    }

    return jsonResponse({ ok: true, status: 'Delta City Edge DO Active', version: this.version });
  }
}

// --- Main Worker Fetch Handler ---

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    // Serve Static Frontend Assets for non-API routes
    if (!pathname.startsWith('/api/')) {
      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }
      return new Response('Delta City Edge Worker Active', { status: 200 });
    }

    try {
      const db = env.DB;
      if (db) await ensureSchema(db);
      const jwtSecret = env.JWT_SECRET || 'delta-city-edge-secret-key-2026';

      // 1. Direct Durable Object City Session Route: /api/city/:cityId/*
      if (pathname.startsWith('/api/city/')) {
        const parts = pathname.split('/');
        const cityId = parts[3] || 'default';
        if (env.CITY_SESSION) {
          const id = env.CITY_SESSION.idFromName(cityId);
          const stub = env.CITY_SESSION.get(id);
          return stub.fetch(request);
        }
        return jsonResponse({ ok: false, error: 'Durable Object binding ausente.' }, 503);
      }

      // 2. Global Static Configs via KV: GET /api/config
      if (pathname === '/api/config' && request.method === 'GET') {
        if (env.DELTA_KV) {
          const cached = await env.DELTA_KV.get('global_config', 'json');
          if (cached) return jsonResponse({ ok: true, config: cached, source: 'kv-edge' });
        }
        const defaultConfig = {
          version: '4.0.0-edge',
          maxCitiesPerUser: Number(env.MAX_CITIES_PER_USER || 10),
          zoningInflationRate: 0.008,
          ranks: ['Assentamento', 'Povoado', 'Vila', 'Cidadezinha', 'Cidade', 'Grande Cidade', 'Metrópole']
        };
        if (env.DELTA_KV) {
          ctx.waitUntil(env.DELTA_KV.put('global_config', JSON.stringify(defaultConfig), { expirationTtl: 3600 }));
        }
        return jsonResponse({ ok: true, config: defaultConfig, source: 'worker' });
      }

      // 3. Global Leaderboard: GET /api/leaderboard
      if (pathname === '/api/leaderboard' && request.method === 'GET') {
        if (env.DELTA_KV) {
          const cachedLb = await env.DELTA_KV.get('leaderboard_top20', 'json');
          if (cachedLb) return jsonResponse({ ok: true, leaderboard: cachedLb, cached: true });
        }
        const { results } = await db
          .prepare(
            `SELECT id, name, owner_id, pop, funds, city_rank AS cityRank, city_points AS cityPoints, year, updated_at AS updatedAt
             FROM delta_cities
             ORDER BY city_points DESC, pop DESC
             LIMIT 20`
          )
          .all();
        if (env.DELTA_KV) {
          ctx.waitUntil(env.DELTA_KV.put('leaderboard_top20', JSON.stringify(results || []), { expirationTtl: 60 }));
        }
        return jsonResponse({ ok: true, leaderboard: results || [] });
      }

      // 4. Authentication: POST /api/auth/login
      if (pathname === '/api/auth/login' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const username = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!username || !password) {
          return jsonResponse({ ok: false, error: 'Usuário e senha são obrigatórios.' }, 400);
        }

        const pwdHash = await sha256Hex(password);
        let user = await db
          .prepare('SELECT id, username, password_hash, role FROM delta_users WHERE username = ?')
          .bind(username)
          .first();

        if (!user) {
          const newId = 'usr_' + crypto.randomUUID().slice(0, 8);
          const role = username === 'admin' ? 'admin' : 'player';
          const now = new Date().toISOString();
          await db
            .prepare('INSERT INTO delta_users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
            .bind(newId, username, pwdHash, role, now)
            .run();
          user = { id: newId, username, password_hash: pwdHash, role };
        } else if (user.password_hash !== pwdHash) {
          return jsonResponse({ ok: false, error: 'Credenciais inválidas.' }, 401);
        }

        const token = await signToken(
          {
            userId: user.id,
            username: user.username,
            role: user.role,
            exp: Date.now() + 14 * 24 * 60 * 60 * 1000
          },
          jwtSecret
        );

        return jsonResponse({
          ok: true,
          token,
          user: { id: user.id, username: user.username, role: user.role }
        });
      }

      // 5. Session Validation: GET /api/auth/session
      if (pathname === '/api/auth/session' && request.method === 'GET') {
        const session = await authenticate(request, env);
        if (!session) {
          return jsonResponse({ ok: false, error: 'Sessão inválida ou expirada.' }, 401);
        }
        return jsonResponse({
          ok: true,
          user: { id: session.userId, username: session.username, role: session.role }
        });
      }

      // --- Protected City Routes ---
      const session = await authenticate(request, env);
      if (!session) {
        return jsonResponse({ ok: false, error: 'Autenticação necessária para acessar cidades.' }, 401);
      }

      // 6. List User Cities (Lightweight Metadata Query): GET /api/cities
      if (pathname === '/api/cities' && request.method === 'GET') {
        const { results } = await db
          .prepare(
            `SELECT id, name, pop, funds, city_rank AS cityRank, city_points AS cityPoints,
                    year, seed, size, type, difficulty, version, updated_at AS updatedAt
             FROM delta_cities
             WHERE owner_id = ?
             ORDER BY updated_at DESC`
          )
          .bind(session.userId)
          .all();

        return jsonResponse({ ok: true, cities: results || [] });
      }

      // 7. Create City: POST /api/cities
      if (pathname === '/api/cities' && request.method === 'POST') {
        const body = await request.json();
        const cityData = body.data || body;
        const cityId = body.id || cityData.id || 'city_' + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        cityData.id = cityId;
        cityData.version = 1;
        cityData.updatedAt = now;

        const meta = {
          id: cityId,
          name: String(cityData.name || 'Nova Cidade').slice(0, 40),
          pop: Number(cityData.pop || 0),
          funds: Number(cityData.funds ?? 28000),
          cityRank: Number(cityData.cityRank || 0),
          cityPoints: Number(cityData.cityPoints || 0),
          year: Number(cityData.year || 2026),
          seed: Number(cityData.seed || 1),
          size: Number(cityData.N || cityData.size || 48),
          type: String(cityData.type || 'lake'),
          difficulty: String(cityData.gameMode || cityData.difficulty || 'medium'),
          version: 1,
          updatedAt: now
        };

        const payloadStr = JSON.stringify(cityData);

        await db.batch([
          db
            .prepare(
              `INSERT OR REPLACE INTO delta_cities
               (id, owner_id, name, pop, funds, city_rank, city_points, year, seed, size, type, difficulty, version, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
            )
            .bind(
              cityId,
              session.userId,
              meta.name,
              meta.pop,
              meta.funds,
              meta.cityRank,
              meta.cityPoints,
              meta.year,
              meta.seed,
              meta.size,
              meta.type,
              meta.difficulty,
              now,
              now
            ),
          db
            .prepare(
              `INSERT OR REPLACE INTO delta_city_blobs (city_id, owner_id, version, payload_json, updated_at)
               VALUES (?, ?, 1, ?, ?)`
            )
            .bind(cityId, session.userId, payloadStr, now)
        ]);

        // Warm KV Cache & Sync Durable Object in background
        if (env.DELTA_KV) {
          ctx.waitUntil(env.DELTA_KV.put(`city:${cityId}`, payloadStr, { expirationTtl: 3600 }));
        }
        if (env.CITY_SESSION) {
          ctx.waitUntil(
            (async () => {
              const stub = env.CITY_SESSION.get(env.CITY_SESSION.idFromName(cityId));
              await stub.fetch('https://do/state', {
                method: 'PUT',
                body: JSON.stringify({ data: cityData })
              });
            })()
          );
        }

        return jsonResponse({ ok: true, id: cityId, version: 1, meta }, 201);
      }

      // Match /api/cities/:id
      const cityMatch = pathname.match(/^\/api\/cities\/([a-zA-Z0-9_-]+)$/);
      if (cityMatch) {
        const cityId = cityMatch[1];

        // 8. Load Single City: GET /api/cities/:id
        if (request.method === 'GET') {
          const row = await db
            .prepare('SELECT owner_id, version, payload_json FROM delta_city_blobs WHERE city_id = ? AND owner_id = ?')
            .bind(cityId, session.userId)
            .first();

          if (!row) {
            return jsonResponse({ ok: false, error: 'Cidade não encontrada.' }, 404);
          }

          const city = JSON.parse(row.payload_json);
          city.version = row.version;
          return jsonResponse({ ok: true, city, version: row.version });
        }

        // 9. Update City (Optimistic Concurrency Control): PUT /api/cities/:id
        if (request.method === 'PUT') {
          const body = await request.json();
          const cityData = body.data || body;
          const expectedVersion = body.expectedVersion ? Number(body.expectedVersion) : null;
          const now = new Date().toISOString();

          const currentMeta = await db
            .prepare('SELECT version FROM delta_cities WHERE id = ? AND owner_id = ?')
            .bind(cityId, session.userId)
            .first();

          if (!currentMeta) {
            return jsonResponse({ ok: false, error: 'Cidade não encontrada ou acesso negado.' }, 404);
          }

          if (expectedVersion !== null && expectedVersion < currentMeta.version) {
            return jsonResponse(
              {
                ok: false,
                error: 'Conflito de versão detectado: esta cidade foi salva mais recentemente em outra sessão.',
                version: currentMeta.version
              },
              409
            );
          }

          const nextVersion = currentMeta.version + 1;
          cityData.id = cityId;
          cityData.version = nextVersion;
          cityData.updatedAt = now;

          const meta = {
            id: cityId,
            name: String(cityData.name || 'Cidade').slice(0, 40),
            pop: Number(cityData.pop || 0),
            funds: Number(cityData.funds ?? 28000),
            cityRank: Number(cityData.cityRank || 0),
            cityPoints: Number(cityData.cityPoints || 0),
            year: Number(cityData.year || 2026),
            seed: Number(cityData.seed || 1),
            size: Number(cityData.N || cityData.size || 48),
            type: String(cityData.type || 'lake'),
            difficulty: String(cityData.gameMode || cityData.difficulty || 'medium'),
            version: nextVersion,
            updatedAt: now
          };

          const payloadStr = JSON.stringify(cityData);

          await db.batch([
            db
              .prepare(
                `UPDATE delta_cities
                 SET name = ?, pop = ?, funds = ?, city_rank = ?, city_points = ?, year = ?, version = ?, updated_at = ?
                 WHERE id = ? AND owner_id = ?`
              )
              .bind(
                meta.name,
                meta.pop,
                meta.funds,
                meta.cityRank,
                meta.cityPoints,
                meta.year,
                nextVersion,
                now,
                cityId,
                session.userId
              ),
            db
              .prepare(
                `UPDATE delta_city_blobs
                 SET version = ?, payload_json = ?, updated_at = ?
                 WHERE city_id = ? AND owner_id = ?`
              )
              .bind(nextVersion, payloadStr, now, cityId, session.userId)
          ]);

          if (env.DELTA_KV) {
            ctx.waitUntil(env.DELTA_KV.put(`city:${cityId}`, payloadStr, { expirationTtl: 3600 }));
          }
          if (env.CITY_SESSION) {
            ctx.waitUntil(
              (async () => {
                const stub = env.CITY_SESSION.get(env.CITY_SESSION.idFromName(cityId));
                await stub.fetch('https://do/state', {
                  method: 'PUT',
                  body: JSON.stringify({ data: cityData })
                });
              })()
            );
          }

          return jsonResponse({ ok: true, id: cityId, version: nextVersion, meta });
        }

        // 10. Delete City: DELETE /api/cities/:id
        if (request.method === 'DELETE') {
          await db.batch([
            db.prepare('DELETE FROM delta_city_blobs WHERE city_id = ? AND owner_id = ?').bind(cityId, session.userId),
            db.prepare('DELETE FROM delta_cities WHERE id = ? AND owner_id = ?').bind(cityId, session.userId)
          ]);
          if (env.DELTA_KV) {
            ctx.waitUntil(env.DELTA_KV.delete(`city:${cityId}`));
          }
          return jsonResponse({ ok: true });
        }
      }

      return jsonResponse({ ok: false, error: 'Endpoint não encontrado.' }, 404);
    } catch (err) {
      console.error('Edge Worker Error:', err);
      return jsonResponse({ ok: false, error: 'Erro interno no Worker: ' + (err.message || String(err)) }, 500);
    }
  }
};
