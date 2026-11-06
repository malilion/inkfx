import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'axe-kick', name: '斧踢', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, Array.from({ length: 18 }, (_, i) => {
      const u = i / 17 * g;
      return [-44 + u * 66, -16 - Math.sin(u * Math.PI) * 40];
    }), 4.2, a);
    const tipx = -44 + 66 * g, tipy = -16 - Math.sin(g * Math.PI) * 40;
    path(f, [[tipx - 9, tipy], [tipx + 11, tipy + 3], [tipx + 3, tipy + 12]], 2.5, a, 1);
    path(f, [[-54, 38], [54, 38]], 1.45, a * .42);
    ring(f, 12 + 24 * g, 1.5, a * .48, { x: 22, y: 38, squash: .22 });
    dot(f, tipx + 3, tipy + 3, 2.1, a, 1);
  }, { seed, ...options });
}
