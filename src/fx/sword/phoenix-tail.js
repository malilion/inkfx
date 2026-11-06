import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'phoenix-tail', name: '鳳尾', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const spine = Array.from({ length: 24 }, (_, i) => {
      const u = i / 23 * g;
      return [-68 + u * 136, Math.sin(u * Math.PI) * 26 - 6];
    });
    path(f, spine, 4.2, a, 1);
    path(f, spine.map(([x, y]) => [x, y + 5]), 1.25, a * .42);
    for (let k = 0; k < 7; k++) {
      const u = (k + 1) / 8;
      if (g < u) continue;
      const x = -68 + u * 136, y = Math.sin(u * Math.PI) * 26 - 6, s = u < .5 ? -1 : 1;
      path(f, [[x, y], [x + s * 9, y - 15]], 1.2, a * .58);
    }
  }, { seed, ...options });
}
