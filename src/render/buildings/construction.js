import { clamp } from '../../core/math/util.js';

export function createConstruction(ctx) {
  const { X, hw, U, hi, mid, A, night, jit, P, Q, LN, PT, fq, fence } = ctx;

  function crane(u, v, h, p) {
    const base = P(u, v, 0), top = P(u, v, h), ang = Math.sin(A * 0.12 + 1) * 0.9, L = hw * 1.1, tx = top[0], ty = top[1], e = [tx + Math.cos(ang) * L, ty + Math.sin(ang) * L * 0.5], c2 = [tx - Math.cos(ang) * L * 0.4, ty - Math.sin(ang) * L * 0.2];
    LN(base, top, [236, 176, 40]); LN([base[0] + 2, base[1]], [top[0] + 2, top[1]], [236, 176, 40]);
    if (hi) for (let z = 0; z < h - 4; z += 6) { LN([base[0], base[1] - z * U], [base[0] + 2, base[1] - (z + 6) * U], [190, 140, 30]); }
    LN([tx, ty], e, [250, 200, 50]); LN([tx, ty - 3], e, [250, 200, 50]); LN([tx, ty], c2, [250, 200, 50]); Q([[c2[0] - 2, c2[1]], [c2[0] + 3, c2[1]], [c2[0] + 3, c2[1] + 4], [c2[0] - 2, c2[1] + 4]], [90, 90, 96], 0, 0);
    const hk = [e[0] - (e[0] - tx) * 0.15, e[1] - (e[1] - ty) * 0.15 + 5 + Math.sin(A * 0.3) * 2 + (1 - p) * 4]; LN([hk[0], e[1] - (e[1] - ty) * 0.15], hk, [40, 40, 44]); Q([[hk[0] - 2, hk[1]], [hk[0] + 2, hk[1]], [hk[0] + 2, hk[1] + 3], [hk[0] - 2, hk[1] + 3]], [220, 80, 40], 0, 0);
    if (night > 0.3) X.emP(tx, ty - 2, A % 2 ? [255, 60, 60] : [90, 20, 20], 1);
  }

  // Seção 2: 5 Etapas de Construção Visíveis
  // 1. Terreno demarcado (p < 0.20)
  // 2. Fundação e início das obras (0.20 <= p < 0.40)
  // 3. Estrutura em construção com andaimes (0.40 <= p < 0.70)
  // 4. Acabamento e alvenaria (0.70 <= p < 0.95)
  // 5. Edificação concluída (p >= 0.95)
  function constructionSite(b, H, p, big) {
    const isDemarcated = p < 0.20;
    const isFoundation = p >= 0.20 && p < 0.42;
    const isScaffolding = p >= 0.42 && p < 0.72;
    const isFinishing = p >= 0.72;

    // Solo terraplanado com brita/areia do canteiro de obras
    Q([P(b.u0 - .06, b.v0 - .06, 0), P(b.u1 + .06, b.v0 - .06, 0), P(b.u1 + .06, b.v1 + .06, 0), P(b.u0 - .06, b.v1 + .06, 0)], [136, 110, 78], jit, 0);
    Q([P(b.u0 + .04, b.v0 + .04, 0), P(b.u1 - .04, b.v0 + .04, 0), P(b.u1 - .04, b.v1 - .04, 0), P(b.u0 + .04, b.v1 - .04, 0)], [114, 88, 62], jit, 0);

    // Fase 1: Estacas de demarcação de lote e fita zebrada/tapume
    if (isDemarcated) {
      if (hi) {
        for (const q of [[b.u0, b.v0], [b.u1, b.v0], [b.u1, b.v1], [b.u0, b.v1]]) {
          const a = P(q[0], q[1], 0), c = P(q[0], q[1], 4.5);
          LN(a, c, [255, 130, 20]);
          PT(c, [255, 230, 80]);
        }
      }
      fence(b.u0 - .1, b.v1 + .08, b.u1 + .1, b.v1 + .08, [240, 140, 30]);
      return 1;
    }

    // Fase 2: Fundação de concreto armado e vigas baldrames
    if (isFoundation) {
      const concreteH = 3;
      fq(b, 'L', 0.05, 0.95, 0, concreteH, [168, 172, 180], 0, 0);
      fq(b, 'R', 0.05, 0.95, 0, concreteH, [138, 142, 150], 0, 0);
      if (hi) {
        // Pilares de ferro da armação emergindo da fundação
        for (const q of [[b.u0 + .1, b.v0 + .1], [b.u1 - .1, b.v0 + .1], [b.u1 - .1, b.v1 - .1], [b.u0 + .1, b.v1 - .1]]) {
          LN(P(q[0], q[1], concreteH), P(q[0], q[1], concreteH + 5), [90, 86, 84]);
        }
      }
      fence(b.u0 - .1, b.v1 + .08, b.u1 + .1, b.v1 + .08, [240, 140, 30]);
      return concreteH;
    }

    // Fase 3 & 4: Estrutura com Andaimes Metálicos e Paredes em Elevação
    const cur = H * clamp((p - 0.35) / 0.65, 0.2, 0.96);
    if (cur > 1 && mid) {
      const cs = [[b.u0 - .05, b.v0 - .05], [b.u1 + .05, b.v0 - .05], [b.u1 + .05, b.v1 + .05], [b.u0 - .05, b.v1 + .05]], top = cur + 3.5;
      
      // Pilares de andaime amarelo/metálico nos 4 cantos
      for (const q of cs) LN(P(q[0], q[1], 0), P(q[0], q[1], top), [236, 176, 40]);
      
      // Travamento horizontal dos andaimes a cada 6 unidades verticais
      for (let z = 6; z < top; z += 6) {
        for (let i = 0; i < 4; i++) {
          const a = cs[i], c = cs[(i + 1) % 4];
          if ((i === 2 || i === 3) || hi) LN(P(a[0], a[1], z), P(c[0], c[1], z), [108, 112, 122]);
        }
      }

      // X de contraventamento nos andaimes frontais
      const q0 = cs[3], q1 = cs[2];
      if (hi) {
        for (let z = 0; z + 6 < top; z += 6) {
          LN(P(q0[0], q0[1], z), P(q1[0], q1[1], z + 6), [156, 120, 40]);
          LN(P(q1[0], q1[1], z), P(q0[0], q0[1], z + 6), [156, 120, 40]);
        }
      }

      // Alvenaria subindo por trás dos andaimes (tijolo ou concreto aparente)
      const wallCol = isFinishing ? [214, 186, 150] : [184, 106, 78];
      fq(b, 'L', 0.04, 0.96, 0, cur, wallCol, 0, 0);
      fq(b, 'R', 0.04, 0.96, 0, cur, [wallCol[0] * 0.75 | 0, wallCol[1] * 0.75 | 0, wallCol[2] * 0.75 | 0], 0, 0);

      // Tela de proteção verde em volta dos andaimes superiores
      if (isScaffolding && hi) {
        fq(b, 'L', -0.04, 1.04, cur * 0.4, cur + 2, [46, 134, 78], 0, 0.35);
      }
    }

    if (hi) fence(b.u0 - .12, b.v1 + .1, b.u1 + .12, b.v1 + .1, [255, 150, 40]);
    if ((big || H >= 28) && mid) crane(-.42, -.42, Math.max(H, 20) + 16, p);

    // Poeira e operários no canteiro
    if (mid) {
      for (let i = 0; i < 3; i++) {
        const t = ((A * 0.4 + i * 1.3) % 3) / 3, q = P(b.u1 - .1 + Math.sin(i * 2.1) * .2, b.v1 - .1, 0);
        X.pt(q[0] + Math.sin(A + i) * 2, q[1] - t * 8 * (1 + U * 0.3), [196, 180, 152]);
      }
    }
    return cur;
  }

  return { constructionSite, crane };
}
