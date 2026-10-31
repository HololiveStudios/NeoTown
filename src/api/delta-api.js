import { BIO, K, KN, FAC, CATS, SIZES, CLSN } from '../core/constants.js';
import { clamp, hash2, Util } from '../core/math/util.js';
import { Vector } from '../core/math/vector.js';
import { fbm } from '../core/math/noise.js';
import { Draft } from '../core/entities/draft.js';
import { Building } from '../core/entities/building.js';
import { NeighborCity, DSA } from '../core/entities/stubs.js';
import { Game } from '../core/state/game.js';
import { buildings } from '../render/buildings/registry.js';
import { renderCaches } from '../render/raster/caches.js';
import { render } from '../render/renderer.js';
import { Debug, bindDebugDelta } from '../runtime/debug.js';
import { Runtime } from '../runtime/runtime.js';
import { Script, bindScriptDelta } from '../runtime/script-lifecycle.js';
import { Plugins } from '../runtime/plugins.js';
import { run, bindConsoleDelta, initDefaultCommandsAndPlugins } from '../runtime/console.js';

export const Delta = {
  BIO,
  K,
  KN,
  FAC,
  CATS,
  SIZES,
  CLSN,
  Game,
  Vector,
  Util,
  Draft,
  Building,
  NeighborCity,
  DSA,
  hash2,
  clamp,
  fbm,
  buildings,
  render,
  Debug,
  Runtime,
  Script,
  Plugins,
  run,
  game: null,
  _ttex: renderCaches._ttex,
  _chunks: renderCaches._chunks,
  _spr: renderCaches._spr,
  _emb: renderCaches._emb,
  _emb8: renderCaches._emb8,
  _lut: renderCaches._lut
};

bindDebugDelta(Delta);
bindScriptDelta(Delta);
bindConsoleDelta(Delta);
initDefaultCommandsAndPlugins();

export function installGlobalDelta(root) {
  const target = root || (typeof window !== 'undefined' ? window : globalThis);
  target.Delta = Delta;
  return Delta;
}
