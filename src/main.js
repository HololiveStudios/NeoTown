import { Delta, installGlobalDelta } from './api/delta-api.js';
import { loadConfig } from './ui/config.js';
import { $ } from './ui/dom.js';
import { initCanvasContext, resize, startLoop } from './ui/app-loop.js';
import { loadPluginStorage } from './persistence/storage.js';
import { initBuildMenu } from './ui/build-menu.js';
import { initHud } from './ui/hud.js';
import { initModals } from './ui/modals.js';
import { initInput } from './ui/input.js';
import { ScreenManager } from './ui/flow/screen-manager.js';
import { zoneEditorState, pushZoneSnapshot } from './ui/zone-editor.js';

window.DeltaZoneEditorState = zoneEditorState;
window.DeltaPushZoneSnapshot = pushZoneSnapshot;

installGlobalDelta();
loadConfig();
initCanvasContext();
initHud();
initBuildMenu();
initModals();
initInput();

loadPluginStorage();
Delta.Script.bootEngine();
resize();

window.addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe($('stage'));

startLoop();
window.DeltaScreenManager = ScreenManager;
ScreenManager.init();

// Registro do Service Worker PWA para instalação standalone e cache offline
if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      console.log('Delta City PWA Service Worker registrado:', reg.scope);
    }).catch((err) => {
      console.warn('Falha no registro do Service Worker:', err);
    });
  });
}
