import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'fold-screen', name: '摺屏', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .05) / 1.0);
    const bands = 5, bw = f.w / bands;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const col = Math.min(bands - 1, Math.floor(x / bw));
      const local = (x - col * bw) / bw;
      const fold = Math.abs(local - .5) * 2;
      const gap = (1 - p) * .5;
      if (fold < gap) continue;
      const i = y * f.w + x;
      const crease = fold > .92;
      f.pigment[i] = Math.min(.94, .5 + (1 - fold) * .26 + f.paperGrain[i] * .1 + (crease ? .08 : 0));
      f.wetness[i] = .045;
      f.tint[i] = crease ? 1 : 0;
    }
  }, { seed, ...options });
}
