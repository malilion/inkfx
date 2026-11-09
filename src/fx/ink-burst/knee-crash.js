import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'knee-crash', name: '膝撞', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), y = 34 - 54 * g;
    path(f, [[-6, 46], [-2, y + 16], [4, y]], 4, a);
    path(f, [[-15, y], [13, y - 4], [9, y + 9], [-13, y + 7], [-15, y]], 3, a, 1);
    path(f, [[-58, 44], [58, 44]], 1.5, a * .48);
    for (let k = 0; k < 5; k++) {
      const x = -26 + k * 13;
      path(f, [[x, 44], [x + (k - 2) * 5, 56]], 1.3, a * g);
    }
    ring(f, 14 + 26 * g, 1.6, a * .5, { y: 44, squash: .2 });
    dot(f, 4, y + 2, 2.1, a, 1);
  }, { seed, ...options });
}
