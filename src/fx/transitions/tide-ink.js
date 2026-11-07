import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'tide-ink', name: '潮升', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  const waves = new Float64Array(meta.w);
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .06) / 1.02);
    const level = f.h * (1 - p);
    for (let x = 0; x < f.w; x++) waves[x] = Math.sin(x * .075 + p * 5.5) * 6 + Math.sin(x * .02) * 3;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const wave = waves[x];
      if (y + wave < level) continue;
      const i = y * f.w + x;
      const depth = clamp((y + wave - level) / 26);
      f.pigment[i] = Math.min(.96, .24 + depth * .58 + f.paperGrain[i] * .08);
      f.wetness[i] = .07;
      f.tint[i] = depth > .82 ? 1 : 0;
    }
  }, { seed, ...options });
}
