import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'lattice-door', name: '格門', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .06) / 1), pitch = 28, thick = 2 + p * 20;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const vx = Math.abs((x % pitch) - pitch / 2), hy = Math.abs((y % pitch) - pitch / 2);
      const bar = vx < thick / 2 || hy < thick / 2;
      const fill = p > .72 && Math.max(vx, hy) < thick * .85;
      if (!bar && !fill) continue;
      const i = y * f.w + x, joint = vx < thick / 2 && hy < thick / 2;
      f.pigment[i] = Math.min(.96, .48 + f.paperGrain[i] * .14 + (joint ? .14 : 0) + (fill ? .2 : 0));
      f.wetness[i] = .05;
      f.tint[i] = joint ? 1 : 0;
    }
  }, { seed, ...options });
}
