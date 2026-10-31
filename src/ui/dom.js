export const $ = (id) => document.getElementById(id);

export const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

export const cl = (s) =>
  String(s)
    .replace(/\u26A0\uFE0F?/g, '! ')
    .replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export const Q = (s, f) => Array.prototype.forEach.call(document.querySelectorAll(s), f);
