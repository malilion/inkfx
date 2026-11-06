import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'twin-dragons', name: '雙龍出海', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (const s of [-1, 1]) {
      path(f, Array.from({ length: 40 }, (_, i) => {
        const u = i / 39 * g, q = u * 5.1;
        return [Math.cos(q) * (16 + u * 50) * s, Math.sin(q) * (12 + u * 34) - s * 4];
      }), 3.6, a, s < 0 ? 1 : 0);
      const q = g * 5.1, r = 16 + g * 50;
      path(f, [[Math.cos(q) * r * s, Math.sin(q) * (12 + g * 34) - s * 4],
        [Math.cos(q + .5) * (r + 10) * s, Math.sin(q + .5) * (18 + g * 28) - s * 4]], 1.5, a * .6, 1);
    }
  }, { seed, ...options });
}
