import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'moth-lantern', name: '燈蛾', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
const moths = [{ r: 26, phase: 0, cy: -4 }, { r: 38, phase: 2.1, cy: 6 }, { r: 16, phase: 4.2, cy: 14 }, { r: 32, phase: 1.05, cy: -18 }];
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU, breathe = Math.cos(q);
    // Angular speed is 1 - 0.45 cos(q), slowest at the phase wrap.
    const spin = q - .45 * Math.sin(q);
    path(f, [[-6, 60], [6, 60], [4, 26], [-4, 26], [-6, 60]], 2.1, .58);
    path(f, [[-20, 20], [0, 2], [20, 20], [-20, 20]], 2.3, .68);
    path(f, [[-9, 20], [9, 20], [7, 34], [-7, 34], [-9, 20]], 1.45, .48);
    dot(f, 0, 26, 3 + breathe * .45, .68, 1);
    for (const moth of moths) {
      const ang = spin + moth.phase, x = Math.cos(ang) * moth.r, y = moth.cy + Math.sin(ang) * moth.r * .36;
      dot(f, x, y, 1.7, .6 + breathe * .1, 2);
      path(f, [[x - 5, y], [x, y - 2], [x + 5, y]], 1, .38);
    }
  }, { seed, ...options });
}
