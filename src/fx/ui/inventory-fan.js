import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'inventory-fan', name: '行囊', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let k = 0; k < 5; k++) {
      const ang = (-1 + k * .5) * g, len = 52;
      const x = Math.sin(ang) * len, y = 24 - Math.cos(ang) * len;
      const px = Math.cos(ang) * 7, py = Math.sin(ang) * 7;
      path(f, [[0, 24], [x, y]], 3.1, a, k === 2 ? 1 : 0);
      path(f, [[6, 26], [x * .9 + 6, y * .9 + 4]], 1.15, a * .45);
      path(f, [[x - px, y - py], [x + px, y + py]], 1.35, a * .75);
    }
    path(f, [[-14, 28], [14, 28]], 2.8, a, 1);
    dot(f, 0, 26, 2.4, a, 1);
  }, { seed, ...options });
}
