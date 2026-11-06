import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'lotus-seal', name: '蓮印', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 62 * Math.max(g, .15), 1.2, a * .4);
    for (let k = 0; k < 8; k++) {
      const q = -Math.PI / 2 + k * TAU / 8, c = Math.cos(q), s = Math.sin(q);
      const x = c * 28 * g, y = s * 28 * g;
      path(f, [[x * .4, y * .4], [x - s * 7, y + c * 7], [c * 38 * g, s * 38 * g], [x + s * 7, y - c * 7], [x * .4, y * .4]], 1.5, a, k % 2);
    }
    ring(f, 12, 3, a, { tint: 1 });
    dot(f, 0, 0, 2.8, a, 1);
  }, { seed, ...options });
}
