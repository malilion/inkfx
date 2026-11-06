import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'crane-flight', name: '鶴影', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU, bob = Math.cos(q) * 3.5, flap = Math.cos(q);
    path(f, [[-16, 6 + bob], [14, 2 + bob]], 3.6, .75);
    path(f, [[12, 2 + bob], [22, -12 + bob], [16, -28 + bob]], 2.2, .7);
    dot(f, 16, -30 + bob, 2.2, .8);
    path(f, [[16, -30 + bob], [24, -32 + bob]], 1.3, .65);
    for (const s of [-1, 1]) {
      path(f, [[0, 2 + bob], [s * 22, -8 * flap + bob], [s * 48, 8 - flap * 20 + bob]], 2.6, .68);
      path(f, [[s * 16, -2 * flap + bob], [s * 34, 4 - flap * 12 + bob]], 1.2, .4);
    }
    path(f, [[-16, 6 + bob], [-32, 14 + Math.cos(q) * 3], [-28, 2 + bob]], 1.6, .55);
    path(f, [[-2, 8 + bob], [-6, 36]], 1.3, .5);
    path(f, [[6, 6 + bob], [8, 34]], 1.3, .5);
  }, { seed, ...options });
}
