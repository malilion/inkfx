import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'thunder-talisman', name: '雷符', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 62 * g, 3.2, a, { tint: 1 });
    ring(f, 48 * g, 1.3, a * .55);
    path(f, Array.from({ length: 8 }, (_, k) => [(k % 2 ? 1 : -1) * 18 * g, -52 * g + k * 15 * g]), 3.4, a, 1);
    for (let k = 0; k < 4; k++) {
      const q = k * TAU / 4;
      path(f, [[Math.cos(q) * 40, Math.sin(q) * 40], [Math.cos(q) * 40, Math.sin(q) * 28]], 1.5, a * .7);
    }
  }, { seed, ...options });
}
