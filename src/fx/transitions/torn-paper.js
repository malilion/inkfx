import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'torn-paper', name: '裂紙', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05), front = p * (f.w + 40) - 20;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const tear = Math.sin(y * .16) * 9 + Math.sin(y * .043 + .7) * 5 + Math.sin(y * .31) * 3;
      if (x > front + tear) continue;
      const i = y * f.w + x, edge = front + tear - x < 7;
      f.pigment[i] = Math.min(.93, .48 + f.paperGrain[i] * .18 + (edge ? .16 : 0));
      f.wetness[i] = edge ? .1 : .04;
      f.tint[i] = edge ? 1 : 0;
    }
  }, { seed, ...options });
}
