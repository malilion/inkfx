import { createPureEffect, rhythm, clamp, TAU } from '../../core/motifs.js';
export const meta = { id: 'spiral-wash', name: '旋墨', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05), thickness = p * Math.PI, maxR = 12 + p * 168;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const dx = x - f.ox, dy = y - f.oy, r = Math.hypot(dx, dy);
      if (r > maxR) continue;
      let ang = Math.atan2(dy, dx);
      if (ang < 0) ang += TAU;
      const base = (r * .055 + p * 5.2) % TAU;
      const gap = target => { let d = Math.abs(ang - target); return d > Math.PI ? TAU - d : d; };
      const near = Math.min(gap(base), gap((base + Math.PI) % TAU));
      if (near > thickness && r > 10) continue;
      const i = y * f.w + x, lead = thickness > 0 && near > thickness * .72;
      f.pigment[i] = Math.min(.95, .36 + f.paperGrain[i] * .2 + (lead ? .18 : 0));
      f.wetness[i] = lead ? .1 : .04;
      f.tint[i] = lead ? 1 : 0;
    }
  }, { seed, ...options });
}
