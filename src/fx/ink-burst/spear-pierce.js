import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'spear-pierce', name: '穿槍', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), tip = -20 + 78 * g;
    path(f, [[-76, 4], [tip - 16, -1]], 4.2, a);
    path(f, [[tip - 18, -14], [tip + 8, 0], [tip - 18, 14]], 2.8, a, 1);
    path(f, [[tip - 8, -5], [tip + 4, 0], [tip - 8, 5]], 1.2, a * .7, 2);
    ring(f, 8 + 14 * g, 1.8, a * .55, { x: tip - 12, squash: .75 });
    for (let k = 0; k < 5; k++) {
      const y = -16 + k * 8;
      path(f, [[tip - 10, y * .3], [tip - 28 - k * 4, y]], 1.3, a * .45);
    }
    dot(f, tip, 0, 2.4, a, 1);
  }, { seed, ...options });
}
