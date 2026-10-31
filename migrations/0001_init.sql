-- Schema SQL para Cloudflare D1 (Delta City Edge)
-- Tabelas isoladas com prefixo delta_ para coexistência segura e indexação de alta performance

CREATE TABLE IF NOT EXISTS delta_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_delta_users_username ON delta_users(username);

CREATE TABLE IF NOT EXISTS delta_cities (
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
);

CREATE INDEX IF NOT EXISTS idx_delta_cities_owner ON delta_cities(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delta_cities_leaderboard ON delta_cities(city_points DESC, pop DESC);

CREATE TABLE IF NOT EXISTS delta_city_blobs (
    city_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    payload_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
