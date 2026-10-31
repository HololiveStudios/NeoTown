export const selectionMethods = {
  tilesOf(s, it) {
    const N = this.N, out = [], sz = it.sz || 1;
    if (it.mode === 'point') {
      for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) {
        const x = s.x1 + dx, y = s.y1 + dy;
        if (this.ok(x, y)) out.push(y * N + x);
      }
      return out;
    }
    if (it.mode === 'line') {
      const dx = s.x1 - s.x0, dy = s.y1 - s.y0;
      if (Math.abs(dx) >= Math.abs(dy)) {
        for (let x = Math.min(s.x0, s.x1); x <= Math.max(s.x0, s.x1); x++) out.push(s.y0 * N + x);
      } else {
        for (let y = Math.min(s.y0, s.y1); y <= Math.max(s.y0, s.y1); y++) out.push(y * N + s.x0);
      }
      return out;
    }
    for (let y = Math.min(s.y0, s.y1); y <= Math.max(s.y0, s.y1); y++) {
      for (let x = Math.min(s.x0, s.x1); x <= Math.max(s.x0, s.x1); x++) out.push(y * N + x);
    }
    return out;
  },
  selBegin(x, y) {
    if (!this.ok(x, y)) return;
    this.cx = x; this.cy = y;
    const it = this.tool();
    if (it.mode === 'inspect') {
      this.say(this.inspect(x, y).lines.join(' | '));
      return;
    }
    this.sel = { x0: x, y0: y, x1: x, y1: y };
    this.buildPreview();
  },
  selMove(x, y) {
    if (!this.ok(x, y)) return;
    this.cx = x; this.cy = y;
    if (this.sel) { this.sel.x1 = x; this.sel.y1 = y; }
    this.buildPreview();
  },
  selCancel() {
    this.sel = null;
    this.buildPreview();
  }
};
