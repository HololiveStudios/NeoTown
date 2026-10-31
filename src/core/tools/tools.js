import { CATS } from '../constants.js';
import { clamp } from '../math/util.js';

export const toolsMethods = {
  tool() {
    return CATS[this.cat].items[this.item];
  },
  setTool(cat, it) {
    this.cat = clamp(cat, 0, CATS.length - 1);
    this.item = clamp(it || 0, 0, CATS[this.cat].items.length - 1);
    this.sel = null;
    const t = this.tool();
    this.say(t.name + (t.cost ? ' — $' + t.cost + (t.mode === 'area' || t.mode === 'line' ? '/tile' : '') : ''));
    this.buildPreview();
  },
  setCursor(x, y) {
    this.cx = clamp(x, 0, this.N - 1);
    this.cy = clamp(y, 0, this.N - 1);
    if (this.tool().mode === 'point') this.buildPreview();
  }
};
