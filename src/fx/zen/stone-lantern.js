import { createPureEffect, rhythm, path, leaf, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'stone-lantern', name: '石燈', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU, glow = .62 + Math.cos(q) * .16;
    path(f, [[-26, 66], [26, 66], [16, 44], [-16, 44], [-26, 66]], 2.8, .72);
    path(f, [[-5, 44], [-5, 8], [5, 8], [5, 44]], 2.2, .64);
    path(f, [[-34, 6], [0, -16], [34, 6], [-34, 6]], 2.8, .76);
    path(f, [[-14, 6], [14, 6], [14, 28], [-14, 28], [-14, 6]], 1.8, .58);
    dot(f, 0, 16, 4.2 + Math.cos(q) * .6, glow, 1);
    path(f, [[0, -16], [0, -28]], 1.6, .5);
    for (let k = 0; k < 3; k++) {
      const a = q + k * TAU / 3;
      leaf(f, Math.cos(a) * 26, Math.sin(a) * 12 + 16, a + Math.PI / 2, 8, .55, 2);
    }
  }, { seed, ...options });
}
