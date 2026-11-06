import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'petal-veil', name: '花帷', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const blooms = [[0, 0], [-76, -76], [76, -76], [-76, 76], [76, 76], [0, -84], [0, 84], [-84, 0], [84, 0]];
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05), radius = 16 + p * 150;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      let best = 1e9, vein = 0, hit = false;
      for (const [bx, by] of blooms) {
        const dx = x - f.ox - bx, dy = y - f.oy - by, d = Math.hypot(dx, dy);
        const reach = radius * (.78 + .22 * Math.cos(Math.atan2(dy, dx) * 5 + bx * .01));
        if (d < reach) { hit = true; if (d < best) { best = d; vein = .5 + .5 * Math.cos(Math.atan2(dy, dx) * 5); } }
      }
      const d0 = Math.hypot(x - f.ox, y - f.oy);
      if (!hit && d0 > radius) continue;
      const i = y * f.w + x, shade = clamp(1 - (hit ? best : d0) / radius);
      f.pigment[i] = Math.min(.94, .3 + shade * .48 + f.paperGrain[i] * .1 + (vein > .75 ? .08 : 0));
      f.wetness[i] = .05;
      f.tint[i] = vein > .8 ? 1 : 0;
    }
  }, { seed, ...options });
}
