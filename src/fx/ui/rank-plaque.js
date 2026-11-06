import { createPureEffect, rhythm, envelope, path, ring, dot, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'rank-plaque', name: '階牌', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-34, -52], [34, -52], [34, 52], [-34, 52], [-34, -52]], 2.8, a, 1);
    path(f, [[-24, -40], [24, -40], [24, 28], [-24, 28], [-24, -40]], 1.3, a * .6);
    path(f, [[-12, -32], [12, -32]], 2, a, 1);
    for (let k = 0; k < 3; k++) {
      const u = clamp(g * 3 - k);
      path(f, [[-16, -20 + k * 14], [-16 + 32 * u, -20 + k * 14]], 3.2, a, k === 2 ? 1 : 0);
    }
    ring(f, 8, 2.2, a, { y: 40, tint: 1 });
    dot(f, 0, 40, 2.4, a, 1);
  }, { seed, ...options });
}
