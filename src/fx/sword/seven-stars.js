import { createPureEffect, rhythm, envelope, path, dot, easeOut, clamp } from '../../core/motifs.js';
export const meta = { id: 'seven-stars', name: '七星連斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let k = 0; k < 7; k++) {
      const u = clamp((g * 7.5 - k) / 1.2);
      if (!u) continue;
      const x = -66 + k * 20, y = -36 + (k % 2) * 24;
      path(f, [[x, y - 6], [x + 16 * u, y + 22 * u]], 3.2, a, k % 3 === 2 ? 1 : 0);
      dot(f, x + 16 * u, y + 22 * u, 2.3, a * u, 1);
      path(f, [[x + 16 * u - 4, y + 22 * u], [x + 16 * u + 4, y + 22 * u - 7]], 1.1, a * .45, 2);
    }
  }, { seed, ...options });
}
