import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'mountain-ward', name: '山鎮', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), n = 50 * g;
    path(f, [[-n, -n], [n, -n], [n, n], [-n, n], [-n, -n]], 2.4, a, 1);
    path(f, [[-36 * g, 18 * g], [-18 * g, -6 * g], [0, 18 * g]], 2.6, a);
    path(f, [[-8 * g, 18 * g], [10 * g, -22 * g], [28 * g, 18 * g]], 3, a);
    path(f, [[20 * g, 18 * g], [34 * g, 2 * g], [42 * g, 18 * g]], 2, a);
    path(f, [[-36 * g, 18 * g], [42 * g, 18 * g]], 1.4, a * .65);
    ring(f, 7, 1.5, a, { y: 30 * g });
    dot(f, 0, 30 * g, 2.2, a, 1);
  }, { seed, ...options });
}
