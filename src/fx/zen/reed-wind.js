import { createPureEffect, rhythm, path, leaf, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'reed-wind', name: '蘆風', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    path(f, [[-78, 58], [78, 62]], 1.4, .28);
    for (let k = 0; k < 7; k++) {
      const x = -60 + k * 20, sway = Math.cos(q + k * .55) * (5 + k % 3 * 2);
      path(f, [[x, 64], [x + sway * .35, 10], [x + sway, -58]], 2.1, .58 + (k % 2) * .08);
      leaf(f, x + sway, -58, -1.05 + sway * .04, 13, .55, k % 3 === 0 ? 1 : 0);
      dot(f, x + sway * .4, 8 + Math.sin(q + k) * 2, 1.3, .35);
    }
  }, { seed, ...options });
}
