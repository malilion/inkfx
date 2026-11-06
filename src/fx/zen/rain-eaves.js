import { createPureEffect, rhythm, path, ring, TAU } from '../../core/motifs.js';
export const meta = { id: 'rain-eaves', name: '檐雨', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    path(f, [[-76, -22], [0, -46], [76, -22]], 3.4, .78);
    path(f, [[-68, -18], [68, -18]], 1.2, .4);
    path(f, [[-70, 62], [70, 62]], 1.6, .35);
    for (let k = 0; k < 10; k++) {
      const u = (k / 10 + q / TAU) % 1, x = -63 + k * 14;
      // Wide quiet zone around the phase wrap, so the seam step matches any other step.
      const fall = u > .22 && u < .78 ? Math.sin((u - .22) / .56 * Math.PI) : 0;
      if (fall) path(f, [[x, -18 + u * 64], [x - 1, -8 + u * 64]], 1.15, fall * .72);
      const ripple = u > .42 && u < .64 ? Math.sin((u - .42) / .22 * Math.PI) : 0;
      if (ripple) ring(f, 6 + (u - .42) * 40, 1.15, ripple * .3, { x, y: 62, squash: .22 });
    }
  }, { seed, ...options });
}
