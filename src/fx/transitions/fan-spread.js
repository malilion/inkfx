import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
import { polarLookup } from '../../core/polar.js';
export const meta = { id: 'fan-spread', name: '扇展', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const polar = polarLookup((dy, dx) => Math.atan2(dx, -dy));
export function create({ seed = 1, ...options } = {}) {
  const originY = meta.h + 8;
  const { radius, angle } = polar(meta.w, meta.h, meta.ox, originY);
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .08) / 1.02), half = .15 + p * 2.2, reach = p * 340;
    for (let i = 0; i < radius.length; i++) {
      if (radius[i] > reach) continue;
      const ang = angle[i];
      if (Math.abs(ang) > half) continue;
      const rib = ang >= 0 && Math.abs(((ang / half) * 6 % 2) - 1) < .14;
      f.pigment[i] = Math.min(.95, .4 + f.paperGrain[i] * .16 + (rib ? .16 : 0));
      f.wetness[i] = rib ? .08 : .04;
      f.tint[i] = rib ? 1 : 0;
    }
  }, { seed, ...options });
}
