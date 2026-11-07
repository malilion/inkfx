import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'diagonal-wash', name: '斜雨刷幕', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const progress = clamp(t / .8) * f.w * 2.1;
    for (let y = 0; y < f.h; y++) {
      const start = y * f.w;
      const end = start + Math.min(f.w, Math.ceil(progress + Math.sin(y * .2) * 5) - y);
      for (let i = start; i < end; i++) f.pigment[i] = .72 + f.paperGrain[i] * .25;
    }
  }, { seed, ...options });
}
