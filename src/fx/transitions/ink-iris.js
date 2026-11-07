import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
import { polarLookup } from '../../core/polar.js';
export const meta = { id: 'ink-iris', name: '墨滴入水', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const polar = polarLookup();
export function create({ seed = 1, ...options } = {}) {
  const { radius } = polar(meta.w, meta.h, meta.ox, meta.oy);
  return createPureEffect(meta, act, (f, t) => {
    const reach = clamp(t / .85) * 170;
    for (let i = 0; i < radius.length; i++) {
      if (radius[i] < reach + f.paperGrain[i] * 8) f.pigment[i] = clamp((reach - radius[i]) / 12 + .15);
    }
  }, { seed, ...options });
}
