import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'elbow-strike', name: '肘擊', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-56, -34], [-10, 8], [44 * g, -16]], 6, a);
    path(f, [[-50, -26], [-6, 14], [38 * g, -8]], 1.35, a * .35, 1);
    const hx = 44 * g, hy = -16;
    for (let k = 0; k < 6; k++) {
      const q = -1.15 + k * .42;
      path(f, [[hx, hy], [hx + Math.cos(q) * 16 * g, hy + Math.sin(q) * 16 * g]], 1.45, a * .7, k % 2 ? 1 : 0);
    }
    dot(f, hx, hy, 3.1, a, 1);
  }, { seed, ...options });
}
