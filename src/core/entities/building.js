import { K } from '../constants.js';
import { Draft } from './draft.js';

export class Building {
  constructor(g, pivotIdx) {
    this.g = g;
    this.i = pivotIdx;
  }
  getX() { return this.i % this.g.N; }
  getY() { return (this.i / this.g.N) | 0; }
  getXY() { return [this.getX(), this.getY()]; }
  getDrawXY() { return [this.getX(), this.getY()]; }
  getWidth() { return this.g.bSize[this.i] || 1; }
  getHeight() { return this.g.bSize[this.i] || 1; }
  getDraft() { return Draft.getDraft('$b_' + this.g.kind[this.i]); }
  getText() { return this.g.bText.get(this.i) || ''; }
  setText(t) {
    if (t) this.g.bText.set(this.i, String(t));
    else this.g.bText.delete(this.i);
  }
  hasRoad() { return !!this.g.roadAdj[this.i]; }
  hasNeededRoad() {
    const d = this.getDraft();
    return !d || !d.needsRoad || !!this.g.roadAdj[this.i];
  }
  isWorking() {
    const i = this.i, g = this.g;
    return !!g.built[i] && !g.ab[i] && !g.newCons(i) && this.hasNeededRoad() && (!!g.pwOn[i] || g.kind[i] === K.PARK);
  }
  isUpgradeInConstruction() { return this.g.cons.has(this.i); }
}
