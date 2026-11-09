import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'crane-wing', name: '鶴翼斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (const s of [-1, 1]) {
      path(f, Array.from({ length: 22 }, (_, i) => {
        const u = i / 21 * g;
        return [s * (8 + u * 62), -4 - Math.sin(u * Math.PI) * 30];
      }), 4.2, a, s < 0 ? 1 : 0);
      for (let k = 0; k < 4; k++) {
        const u = .28 + k * .16;
        if (g < u) continue;
        const x = s * (8 + u * 62), y = -4 - Math.sin(u * Math.PI) * 30;
        path(f, [[x, y], [x + s * 5, y + 14]], 1.15, a * .55);
      }
    }
    path(f, [[0, -2], [0, 26]], 2.2, a);
    path(f, [[-10, 26], [10, 26]], 1.5, a * .45);
  }, { seed, ...options });
}
