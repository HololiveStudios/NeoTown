import { getTerrainCache, setTerrainCache } from './caches.js';

export const BAYER_4X4 = [
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5
];

// Paletas Discretas de Pixel Art (Seção 1.1 - EXAMPLE_MODELS.md & VISUAL_IDENTITY.md)
const GRASS_PAL = [
  [46, 71, 38],   // 15%: #2e4726 (Sombra de tufo)
  [57, 87, 46],   // 30%: #39572e (Base escura)
  [70, 104, 56],  // 35%: #466838 (Base média)
  [85, 122, 68],  // 15%: #557a44 (Grama alta iluminada)
  [107, 142, 83]  //  5%: #6b8e53 (Brilho / Flor seca)
];

const FOREST_PAL = [
  [30, 50, 24],
  [39, 63, 31],
  [46, 74, 38],
  [57, 89, 46],
  [74, 110, 56]
];

const SAND_PAL = [
  [175, 152, 102], // Areia úmida escura
  [191, 169, 117], // #bfa975 (Areia úmida)
  [216, 200, 152], // #d8c898 (Areia base)
  [230, 216, 170], // #e6d8aa (Areia seca iluminada)
  [242, 230, 190]  // Brilho de concha/sílica
];

const ROCK_PAL = [
  [68, 72, 80],
  [84, 88, 98],
  [104, 108, 118],
  [126, 130, 140],
  [152, 156, 166]
];

const WATER_PAL = [
  [23, 54, 88],    // Profundo escuro
  [27, 63, 102],   // #1b3f66 (Água base)
  [34, 76, 120],   // Água média
  [46, 94, 144],   // Água rasa
  [138, 180, 214]  // #8ab4d6 (Brilho/espuma)
];

function pickGrassIdx(v) {
  if (v < 38) return 0;   // 15%
  if (v < 115) return 1;  // 30%
  if (v < 204) return 2;  // 35%
  if (v < 242) return 3;  // 15%
  return 4;               // 5%
}

export function terrainTex(seed) {
  const cached = getTerrainCache();
  if (cached && cached.seed === seed) return cached.t;
  const t = new Uint8Array(65536);
  let s = (seed * 2654435761 + 12345) >>> 0;
  for (let i = 0; i < 65536; i++) {
    s = (s + 0x6D2B79F5) | 0;
    let z = Math.imul(s ^ (s >>> 15), s | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    t[i] = ((z ^ (z >>> 14)) >>> 0) & 255;
  }
  setTerrainCache({ seed, t });
  return t;
}

export function terrTri(u32, W, H, a, b, c, T, fine) {
  const vs = [a, b, c], ymin = Math.min(a[1], b[1], c[1]), ymax = Math.max(a[1], b[1], c[1]);
  const ya = Math.max(0, Math.ceil(ymin - 0.5)), yb = Math.min(H - 1, Math.ceil(ymax - 0.5) - 1);
  const L = new Float64Array(8), R = new Float64Array(8);
  const matId = a[7] | 0; // 0=water, 1=grass, 2=forest, 3=sand, 4=rock
  const pal = matId === 0 ? WATER_PAL : matId === 2 ? FOREST_PAL : matId === 3 ? SAND_PAL : matId === 4 ? ROCK_PAL : GRASS_PAL;

  for (let y = ya; y <= yb; y++) {
    const yc = y + 0.5;
    let nl = 0, nr = 0, lo = 1e9, hi = -1e9;
    for (let i = 0; i < 3; i++) {
      const p = vs[i], q = vs[(i + 1) % 3];
      if ((p[1] <= yc && q[1] > yc) || (q[1] <= yc && p[1] > yc)) {
        const t = (yc - p[1]) / (q[1] - p[1]), x = p[0] + (q[0] - p[0]) * t;
        if (x < lo) {
          lo = x;
          for (let k = 0; k < 6; k++) L[k] = p[k + 2] + (q[k + 2] - p[k + 2]) * t;
          nl = 1;
        }
        if (x > hi) {
          hi = x;
          for (let k = 0; k < 6; k++) R[k] = p[k + 2] + (q[k + 2] - p[k + 2]) * t;
          nr = 1;
        }
      }
    }
    if (!nl || !nr) continue;

    const xa = Math.max(0, Math.round(lo)), xb = Math.min(W, Math.round(hi));
    const span = hi - lo || 1;
    const yBayer = (y & 3) << 2;
    const rowOffset = y * W;
    const r0 = (y & 255) << 8;
    const rCluster = ((y >> 1) & 255) << 8;

    for (let x = xa; x < xb; x++) {
      let s = (x + 0.5 - lo) / span;
      if (s < 0) s = 0; else if (s > 1) s = 1;

      // Dithering Estocástico Pixel a Pixel + Agrupamento de Tufos (1x1 e 2x2 px)
      const hPx = T[r0 | (x & 255)];
      const hCl = T[rCluster | ((x >> 1) & 255)];
      const bayer = BAYER_4X4[yBayer | (x & 3)];

      let idx;
      if (matId === 0) {
        // Água pixelada com ondulações horizontais discretas
        const shoreFactor = L[4] + (R[4] - L[4]) * s; // 0 = profundo, 1 = margem rasa
        const wave = ((x >> 2) + y * 3) & 7;
        if (shoreFactor > 0.65 && (bayer < 6 || hPx > 210)) idx = 4;
        else if (shoreFactor > 0.32) idx = wave < 2 ? 3 : 2;
        else idx = hCl > 180 && (y & 1) === 0 ? 2 : (hPx < 70 ? 0 : 1);
      } else {
        const hv = (hPx * 5 + hCl * 3 + bayer * 4) >> 3;
        idx = pickGrassIdx(hv);
      }

      const base = pal[idx];
      // Sombra de relevo quantizada em degraus discretos (sem gradiente liso)
      const shadeRaw = L[3] + (R[3] - L[3]) * s;
      const shade = Math.round(shadeRaw * 8) / 8;

      const r = Math.min(255, Math.max(0, (base[0] * shade) | 0));
      const g = Math.min(255, Math.max(0, (base[1] * shade) | 0));
      const bl = Math.min(255, Math.max(0, (base[2] * shade) | 0));

      u32[rowOffset + x] = 0xff000000 | (bl << 16) | (g << 8) | r;
    }
  }
}

