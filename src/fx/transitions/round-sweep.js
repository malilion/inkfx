import { createPureEffect, rhythm, clamp, TAU } from '../../core/motifs.js';
export const meta = { id: 'round-sweep', name: '圓揮', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const sweep = clamp((t + .04) / 1.02) * TAU;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const ang = Math.atan2(y - f.oy, x - f.ox) + Math.PI;
      if (ang > sweep && !(x === f.ox && y === f.oy)) continue;
      const i = y * f.w + x;
      const lead = sweep - ang < .42 && sweep - ang >= 0;
      f.pigment[i] = Math.min(.95, .42 + f.paperGrain[i] * .22 + (lead ? .22 : 0));
      f.wetness[i] = lead ? .12 : .04;
      f.tint[i] = lead ? 1 : 0;
    }
  }, { seed, ...options });
}
