import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'sky-rift', name: '裂空斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-3, -76], [0, -10], [2, 70 * g]], 6.5, a);
    path(f, [[8, -70], [4, 64 * g]], 1.4, a * .4, 1);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const y = -48 + k * 28;
      path(f, [[0, y], [s * 14, y + 8], [s * (32 + k * 6) * g, y - 12]], 2, a * .7);
    }
  }, { seed, ...options });
}
