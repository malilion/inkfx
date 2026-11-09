import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'bell-ward', name: '鐘符', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-8, -60], [8, -60]], 2.1, a, 1);
    path(f, [[0, -60], [0, -46]], 1.5, a);
    path(f, [[-34 * g, -38], [-26 * g, 26], [26 * g, 26], [34 * g, -38], [-34 * g, -38]], 3, a);
    path(f, [[-26 * g, 26], [26 * g, 26]], 3.8, a, 1);
    path(f, [[0, -28], [0, 6 * g]], 1.45, a);
    dot(f, 0, 10 * g, 2.8, a, 1);
    for (let k = 1; k <= 3; k++) ring(f, 16 + k * 13 * g, 1.25, a * (1 - k * .18), { y: 2, squash: .7 });
  }, { seed, ...options });
}
