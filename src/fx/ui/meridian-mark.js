import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'meridian-mark', name: '經脈印', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 60 * g, 2.6, a);
    path(f, [[0, -52 * g], [0, 52 * g]], 2.4, a, 1);
    for (let k = 0; k < 5; k++) {
      const y = -36 + k * 18, w = 14 + (k % 2) * 8;
      path(f, [[-w * g, y], [w * g, y]], 1.5, a * .75);
      dot(f, 0, y, 2.4, a, k === 2 ? 1 : 0);
    }
    path(f, [[-28, -8], [-46 * g, -24]], 1.4, a * .6);
    path(f, [[28, 10], [46 * g, 26]], 1.4, a * .6);
  }, { seed, ...options });
}
