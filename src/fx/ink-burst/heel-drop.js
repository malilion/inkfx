import { createPureEffect, rhythm, envelope, path, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'heel-drop', name: '踵落', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), y = -34 + 64 * g;
    path(f, [[-5, y - 32], [-1, y]], 3.3, a);
    path(f, [[-16, y], [14, y - 3], [18, y + 6], [-14, y + 7], [-16, y]], 3.4, a, 1);
    path(f, [[-60, 40], [60, 40]], 1.5, a * .45);
    for (let k = 0; k < 5; k++) {
      const x = -28 + k * 14;
      path(f, [[x, 40], [x + (k - 2) * 5, 52]], 1.35, a * g);
    }
    ring(f, 18 + 32 * g, 1.8, a * .55, { y: 40, squash: .22 });
  }, { seed, ...options });
}
