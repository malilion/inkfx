import { createPureEffect, rhythm, envelope, path, easeOut, clamp } from '../../core/motifs.js';
export const meta = { id: 'combo-tally', name: '連擊', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let k = 0; k < 4; k++) {
      const u = clamp(g * 4.2 - k);
      if (!u) continue;
      const x = -42 + k * 24;
      path(f, [[x, 28], [x - 4, 28 - 52 * u]], 4.2, a, k === 3 ? 1 : 0);
    }
    path(f, [[-52, 34], [52 * g, 34]], 2.2, a * .7);
    path(f, [[-36, -40], [40 * g, -46]], 3.4, a * .85, 1);
  }, { seed, ...options });
}
