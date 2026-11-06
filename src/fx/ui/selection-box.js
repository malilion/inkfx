import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'selection-box', name: '選框', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), m = 42, n = 16;
    path(f, [[-m, -m], [m, -m], [m, m], [-m, m], [-m, -m]], 1.1, a * .35);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      path(f, [[sx * m, sy * (m - n)], [sx * m, sy * m], [sx * (m - n), sy * m]], 2.8, a, 1);
    }
    const x = -m + g * 2 * m;
    path(f, [[x, -m - 8], [x, -m + 8]], 2.2, a);
    dot(f, x, -m, 2.2, a, 2);
  }, { seed, ...options });
}
