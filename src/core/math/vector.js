export class Vector {
  constructor(x, y, z) {
    this.x = +x || 0;
    this.y = +y || 0;
    this.z = +z || 0;
    Object.freeze(this);
  }
  copy() { return new Vector(this.x, this.y, this.z); }
  add(v) { return new Vector(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vector(this.x - v.x, this.y - v.y, this.z - v.z); }
  scale(s) { return new Vector(this.x * s, this.y * s, this.z * s); }
  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v) {
    return new Vector(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalized() {
    const l = this.length() || 1;
    return new Vector(this.x / l, this.y / l, this.z / l);
  }
}
