import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'pagoda-seal', name: '塔印', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    [[44, 34], [32, 2], [20, -28]].forEach(([half, y], k) => {
      const u = Math.min(1, Math.max(0, g * 3 - k));
      if (!u) return;
      const hw = half * u;
      path(f, [[-hw, y + 10], [0, y], [hw, y + 10]], 2.7, a, k === 0 ? 1 : 0);
      path(f, [[-hw * .52, y + 12], [hw * .52, y + 12]], 1.35, a * .62);
    });
    path(f, [[0, -28], [0, -50 * g]], 1.5, a);
    dot(f, 0, -52 * g, 2.1, a, 1);
    path(f, [[-26, 50], [26, 50]], 2.3, a * .68);
    dot(f, 0, 44, 1.9, a, 1);
  }, { seed, ...options });
}
