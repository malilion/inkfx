import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'mountain-reveal', name: '山幕', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const nx = x / (f.w - 1);
      const peaks = Math.sin(nx * Math.PI * 3) * 26 + Math.sin(nx * Math.PI * 5.5 + .4) * 12 + Math.sin(nx * Math.PI * 11) * 5;
      const line = (1 - p) * (f.h + 90) - 48 + peaks;
      if (y < line) continue;
      const i = y * f.w + x, depth = clamp((y - line) / 22), ridge = y - line < 5;
      f.pigment[i] = Math.min(.95, .26 + depth * .55 + f.paperGrain[i] * .08 + (ridge ? .12 : 0));
      f.wetness[i] = .05;
      f.tint[i] = ridge ? 1 : 0;
    }
  }, { seed, ...options });
}
