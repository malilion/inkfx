import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'pierce-cloud', name: '穿雲刺', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const tip = 64 - 128 * g;
    path(f, [[0, 68], [2, tip]], 5, a);
    path(f, [[-8, 60], [0, tip - 6], [8, 60]], 1.6, a * .55);
    path(f, [[-7, tip + 16], [0, tip], [7, tip + 16]], 2.2, a, 1);
    for (let k = 0; k < 3; k++) ring(f, 14 + k * 12, 2.1, a * (1 - k * .18),
      { y: 28 - k * 26 * g, squash: .34, start: k * .4, end: k * .4 + TAU * g });
  }, { seed, ...options });
}
