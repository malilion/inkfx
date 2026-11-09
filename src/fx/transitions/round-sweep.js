import { createPureEffect, rhythm, clamp, TAU } from '../../core/motifs.js';
import { polarLookup } from '../../core/polar.js';
export const meta = { id: 'round-sweep', name: '圓揮', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const polar = polarLookup((dy, dx) => Math.atan2(dy, dx) + Math.PI, false);
export function create({ seed = 1, ...options } = {}) {
  const { w, h, ox, oy } = meta;
  const { angle } = polar(w, h, ox, oy);
  const center = Number.isInteger(ox) && Number.isInteger(oy) ? oy * w + ox : -1;
  return createPureEffect(meta, act, (f, t) => {
    const sweep = clamp((t + .04) / 1.02) * TAU;
    for (let i = 0; i < angle.length; i++) {
      const delta = sweep - angle[i];
      if (delta < 0 && i !== center) continue;
      const lead = delta >= 0 && delta < .42;
      f.pigment[i] = Math.min(.95, .42 + f.paperGrain[i] * .22 + (lead ? .22 : 0));
      f.wetness[i] = lead ? .12 : .04;
      f.tint[i] = lead ? 1 : 0;
    }
  }, { seed, ...options });
}
