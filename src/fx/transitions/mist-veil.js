import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'mist-veil', name: '霧合', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .08) / 1.02);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const i = y * f.w + x;
      const d = Math.hypot(x - f.ox, y - f.oy) / 150;
      const thresh = p * (1.08 - d * .22);
      if (f.paperGrain[i] > thresh) continue;
      f.pigment[i] = Math.min(.93, .32 + p * .4 + f.paperGrain[i] * .16);
      f.wetness[i] = .06;
      f.tint[i] = d < .2 && p > .45 ? 1 : 0;
    }
  }, { seed, ...options });
}
