import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'frost-edge', name: '霜刃', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-78, 6], [-30, -2], [20, 4], [76 * g, -6]], 5.5, a);
    path(f, [[-78, 12], [70 * g, 2]], 1.3, a * .45, 2);
    for (let k = 0; k < 8; k++) {
      const x = -58 + k * 16 * g, h = 10 + (k % 3) * 7;
      path(f, [[x, -4], [x + 3, -4 - h], [x + 8, -4]], 1.3, a * .7, 2);
      if (k % 2 === 0) dot(f, x + 4, -6 - h, 1.6, a * .8, 2);
    }
  }, { seed, ...options });
}
