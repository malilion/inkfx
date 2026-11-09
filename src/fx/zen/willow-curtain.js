import { createPureEffect, rhythm, path, leaf, TAU } from '../../core/motifs.js';
export const meta = { id: 'willow-curtain', name: '柳簾', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    // Shared cosine so every strand turns around at the seam.
    const q = t / meta.duration * TAU, sway = Math.cos(q);
    path(f, [[-66, -56], [66, -56]], 2.4, .52);
    for (let k = 0; k < 9; k++) {
      const x = -60 + k * 15, lean = sway * (6 + (k % 3) * 2.5);
      path(f, [[x, -56], [x + lean * .32, -6], [x + lean, 46]], 1.6, .48 + (k % 2) * .08);
      leaf(f, x + lean, 48, 1.15 + lean * .02, 10, .46, k % 4 === 0 ? 1 : 0);
    }
  }, { seed, ...options });
}
