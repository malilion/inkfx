import { createPureEffect, rhythm, path, ring, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'moon-well', name: '月井', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU, wobble = Math.cos(q) * 2;
    ring(f, 16 + Math.cos(q) * .8, 5.2, .78, { y: -46 });
    dot(f, -5, -50, 2, .32);
    path(f, [[-8, -46], [-2, -40]], 1.1, .28);
    ring(f, 30, 3.2, .72, { y: 22, squash: .46 });
    ring(f, 18, 1.3, .4, { y: 22, squash: .46 });
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU;
      dot(f, Math.cos(a) * 30, 22 + Math.sin(a) * 14, 1.5, .45);
    }
    ring(f, 7 + Math.cos(q) * 1.1, 2.3, .42 + Math.cos(q * 2) * .08, { x: wobble, y: 22, squash: .4, tint: 1 });
    dot(f, wobble, 22, 1.8, .55, 1);
    path(f, [[-36, 48], [36, 48]], 1.3, .3);
  }, { seed, ...options });
}
