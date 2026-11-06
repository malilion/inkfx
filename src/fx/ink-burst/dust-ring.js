import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'dust-ring', name: '塵環', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[0, -50], [0, 6 + 12 * g]], 4.2, a);
    dot(f, 0, 16, 3.6, a, 1);
    for (let k = 0; k < 3; k++) ring(f, (14 + k * 16) * g, 2.3 - k * .3, a * (1 - k * .18), { y: 28, squash: .3 });
    for (let k = -3; k <= 3; k++) dot(f, k * 14 * g, 28 - Math.abs(k) * 2, 1.6, a * .65, k === 0 ? 1 : 0);
  }, { seed, ...options });
}
