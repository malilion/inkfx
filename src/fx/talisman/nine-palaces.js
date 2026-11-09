import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'nine-palaces', name: '九宮', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), n = 66 * g;
    const lines = [-n, -n / 3, n / 3, n], centers = [-n * 2 / 3, 0, n * 2 / 3];
    for (const x of lines) path(f, [[x, -n], [x, n]], 1.5, a * .75);
    for (const y of lines) path(f, [[-n, y], [n, y]], 1.5, a * .75);
    for (const y of centers) for (const x of centers) {
      if (x === 0 && y === 0) continue;
      const mark = (Math.abs(x) > 1 && Math.abs(y) > 1) ? 1 : 0;
      if (mark) path(f, [[x - 6, y - 6], [x + 6, y + 6]], 1.4, a, 1);
      else path(f, [[x - 7, y], [x + 7, y]], 1.5, a);
      dot(f, x, y, 1.6, a * .8, mark);
    }
    ring(f, 12, 2.4, a, { tint: 1 });
    dot(f, 0, 0, 3, a, 1);
  }, { seed, ...options });
}
