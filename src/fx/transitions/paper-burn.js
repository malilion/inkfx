import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
import { polarLookup } from '../../core/polar.js';
export const meta = { id: 'paper-burn', name: '宣紙燒穿', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const polar = polarLookup();
export function create({ seed = 1, ...options } = {}) {
  const { radius } = polar(meta.w, meta.h, meta.ox, meta.oy);
  const ripple = Float64Array.from({ length: meta.w }, (_, x) => Math.sin(x * .2) * 3);
  return createPureEffect(meta, act, (f, t) => {
    const reach = clamp(t / .8) * 165;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const i = y * f.w + x;
      const depth = reach - (radius[i] + ripple[x]);
      if (depth <= 0) continue;
      f.pigment[i] = clamp(depth / 9 + .1);
      f.tint[i] = depth < 9 ? 1 : 0;
    }
  }, { seed, ...options });
}
