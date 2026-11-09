import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'compass-seal', name: '羅盤', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 56 * g, 2.5, a, { tint: 1 });
    ring(f, 38 * g, 1.25, a * .58);
    for (let k = 0; k < 8; k++) {
      const q = -Math.PI / 2 + k * TAU / 8, inner = k % 2 ? 44 : 38;
      path(f, [[Math.cos(q) * inner * g, Math.sin(q) * inner * g], [Math.cos(q) * 56 * g, Math.sin(q) * 56 * g]], 1.5, a, k % 2 ? 0 : 1);
    }
    path(f, [[0, 6], [0, -32 * g]], 2.3, a, 1);
    path(f, [[-7, -20 * g], [0, -34 * g], [7, -20 * g]], 1.45, a, 1);
    dot(f, 0, 0, 2.5, a, 2);
  }, { seed, ...options });
}
