import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'incense-smoke', name: '一縷香', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    path(f, [[-16, 70], [16, 70], [10, 58], [-10, 58], [-16, 70]], 2.2, .55);
    path(f, [[0, 58], [0, 36]], 2.6, .78);
    dot(f, 0, 34, 2.2 + Math.cos(q) * .35, .75, 1);
    for (let k = 0; k < 3; k++) {
      path(f, Array.from({ length: 26 }, (_, i) => {
        const u = i / 25;
        return [(k - 1) * 9 + Math.sin(q + u * 4.5 + k * 1.8) * (4 + u * 16), 30 - u * 96];
      }), 2.4 - k * .35, .28 + k * .1);
    }
  }, { seed, ...options });
}
