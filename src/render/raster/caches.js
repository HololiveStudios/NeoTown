export const renderCaches = {
  _ttex: null,
  _chunks: { m: new Map(), bytes: 0, t: 0, baked: 0 },
  _spr: { m: new Map(), bytes: 0, t: 0, baked: 0 },
  _emb: null,
  _emb8: null,
  _lut: new Uint32Array(768)
};

export function getTerrainCache() {
  return renderCaches._ttex;
}

export function setTerrainCache(val) {
  renderCaches._ttex = val;
  if (typeof window !== 'undefined' && window.Delta) window.Delta._ttex = val;
}

export function getChunkCache() {
  return renderCaches._chunks;
}

export function getSpriteCache() {
  return renderCaches._spr;
}

export function getEmissiveBuffer(embN) {
  let emb32 = renderCaches._emb;
  if (!emb32 || emb32.length !== embN) {
    emb32 = renderCaches._emb = new Uint32Array(embN);
    renderCaches._emb8 = new Uint8ClampedArray(emb32.buffer);
    renderCaches._emb8._u32 = emb32;
    if (typeof window !== 'undefined' && window.Delta) {
      window.Delta._emb = emb32;
      window.Delta._emb8 = renderCaches._emb8;
    }
  }
  return { emb32, emb8: renderCaches._emb8 };
}

export function getNightLut() {
  return renderCaches._lut;
}
