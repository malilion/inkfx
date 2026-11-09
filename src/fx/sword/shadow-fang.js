import { createPureEffect, rhythm, envelope, path, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'shadow-fang', name: '影牙', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let k = 0; k < 3; k++) {
      const u = clamp(g * 3 - k * .45), x = -36 + k * 36, tip = -40 + 74 * u;
      if (!u) continue;
      path(f, [[x - 8, tip - 24], [x, tip], [x + 8, tip - 24]], 3.5, a, k === 1 ? 1 : 0);
      path(f, [[x, tip - 30], [x, tip - 6]], 1.2, a * .5, 2);
    }
  }, { seed, ...options });
}
