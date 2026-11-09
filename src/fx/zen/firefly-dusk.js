import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'firefly-dusk', name: '流螢', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
const stems = [-52, -28, -6, 18, 42];
const flies = [
  { r: 30, n: 1, p: .4, cy: -6 }, { r: 18, n: 2, p: 2.2, cy: 10 }, { r: 42, n: 1, p: 4, cy: 16 },
  { r: 14, n: 2, p: 1.1, cy: -22 }, { r: 26, n: 1, p: 5.2, cy: -14 },
];
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    for (let k = 0; k < stems.length; k++) {
      const sway = Math.sin(q + k * .9) * 4, x = stems[k];
      path(f, [[x, 68], [x + sway * .35, 24], [x + sway, -18 - (k % 3) * 12]], 1.7, .58);
      if (k % 2 === 0) path(f, [[x + sway * .5, 8], [x + sway * .5 - 12, -2]], 1.1, .4);
    }
    for (const fly of flies) {
      const x = Math.cos(q * fly.n + fly.p) * fly.r;
      const y = fly.cy + Math.sin(q * fly.n + fly.p) * fly.r * .45;
      const glow = .55 + .25 * Math.sin(q * fly.n + fly.p);
      dot(f, x, y, 2.1, glow, 1);
      dot(f, x, y, 4.2, glow * .35, 2);
    }
  }, { seed, ...options });
}
