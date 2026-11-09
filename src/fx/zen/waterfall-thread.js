import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'waterfall-thread', name: '飛瀑', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU, sway = Math.cos(q);
    path(f, [[-46, -58], [-16, -58], [-8, -44], [-38, -44], [-46, -58]], 2.1, .52);
    path(f, [[16, -58], [44, -58], [34, -44], [8, -44], [16, -58]], 2.1, .52);
    for (let k = 0; k < 6; k++) {
      const x = -28 + k * 11, lean = sway * (3 + k % 3);
      path(f, [[x, -42], [x + lean * .4, 2], [x + lean, 44]], 2, .4 + (k % 2) * .1, k === 2 ? 1 : 0);
    }
    path(f, [[-52, 52], [52, 52]], 2.2, .38);
    for (let k = 0; k < 5; k++) {
      const lift = (1 - Math.cos(q)) * 3.5;
      dot(f, -36 + k * 18 + sway * 2, 48 - lift, 1.45, .32 + .14 * sway, 2);
    }
  }, { seed, ...options });
}
