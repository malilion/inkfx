import { createPureEffect, rhythm, envelope, path, ring, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'tally-banner', name: '幡號', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), drop = -52 + 86 * g;
    path(f, [[-4, -60], [4, -60]], 1.9, a, 1);
    path(f, [[0, -60], [0, -48]], 1.35, a);
    path(f, [[-20, -48], [20, -48], [16, drop], [-16, drop], [-20, -48]], 2.5, a);
    for (let k = 0; k < 3; k++) {
      const u = clamp(g * 3 - k), y = -34 + k * 14;
      if (y > drop - 6) continue;
      path(f, [[-9, y], [-9 + 18 * u, y]], 2.1, a, k === 1 ? 1 : 0);
    }
    ring(f, 6.5, 1.5, a, { y: Math.min(drop - 10, 26), tint: 1 });
    for (const s of [-1, 1]) path(f, [[s * 14, drop], [s * 20, drop + 14], [s * 11, drop + 26]], 1.3, a * .68);
  }, { seed, ...options });
}
