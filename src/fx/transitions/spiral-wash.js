import { createPureEffect, rhythm, clamp, TAU } from '../../core/motifs.js';
import { polarLookup } from '../../core/polar.js';
export const meta = { id: 'spiral-wash', name: '旋墨', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const polar = polarLookup(Math.atan2);
export function create({ seed = 1, ...options } = {}) {
  const { radius, angle } = polar(meta.w, meta.h, meta.ox, meta.oy);
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05), thickness = p * Math.PI, maxR = 12 + p * 168;
    const rotation = p * 5.2;
    for (let i = 0; i < radius.length; i++) {
      const r = radius[i];
      if (r > maxR) continue;
      const ang = angle[i] < 0 ? angle[i] + TAU : angle[i];
      // r is at most 180, so this phase crosses at most two full turns.
      const phase = r * .055 + rotation;
      const base = phase >= 2 * TAU ? phase - 2 * TAU : phase >= TAU ? phase - TAU : phase;
      const opposite = base + Math.PI;
      const gap = Math.abs(ang - base), oppositeGap = Math.abs(ang - (opposite >= TAU ? opposite - TAU : opposite));
      const near = Math.min(gap, TAU - gap, oppositeGap, TAU - oppositeGap);
      if (near > thickness && r > 10) continue;
      const lead = thickness > 0 && near > thickness * .72;
      f.pigment[i] = Math.min(.95, .36 + f.paperGrain[i] * .2 + (lead ? .18 : 0));
      f.wetness[i] = lead ? .1 : .04;
      f.tint[i] = lead ? 1 : 0;
    }
  }, { seed, ...options });
}
