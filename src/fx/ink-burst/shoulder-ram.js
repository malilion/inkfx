import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'shoulder-ram', name: '肩撞', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const hx = -22 + 46 * g, hy = 8 - 22 * g;
    path(f, [[-64, 34], [-28, 16], [hx, hy]], 5.6, a);
    path(f, [[-56, 26], [hx - 6, hy + 6]], 1.35, a * .38, 1);
    path(f, [[hx - 8, hy - 12], [hx + 16, hy], [hx - 4, hy + 14], [hx - 8, hy - 12]], 2.8, a, 1);
    for (let k = 0; k < 5; k++) {
      const q = -.75 + k * .32;
      path(f, [[hx + 14, hy], [hx + 14 + Math.cos(q) * 20 * g, hy + Math.sin(q) * 14 * g]], 1.4, a * .68, k === 2 ? 1 : 0);
    }
    dot(f, hx + 6, hy, 2.4, a, 1);
  }, { seed, ...options });
}
