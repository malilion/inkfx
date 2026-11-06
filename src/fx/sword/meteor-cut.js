import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'meteor-cut', name: '流星斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-66, -40], [-18, -6], [22, 8], [68 * g, 34]], 5.2, a);
    path(f, [[-58, -30], [60 * g, 42]], 1.3, a * .4, 1);
    for (let k = 0; k < 6; k++) {
      const u = (k + 1) / 7 * g, x = -66 + u * 134, y = -40 + u * 74;
      path(f, [[x, y], [x - 8, y - 10]], 1.2, a * .55, k % 3 === 0 ? 2 : 0);
      dot(f, x + 4, y + 3, 1.7, a, 1);
    }
  }, { seed, ...options });
}
