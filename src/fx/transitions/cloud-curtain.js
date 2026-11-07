import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'cloud-curtain', name: '雲幕合攏', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  const pigment = new Float32Array(Math.ceil(meta.w / 2));
  const ripple = Float64Array.from({ length: meta.h }, (_, y) => Math.sin(y * .08) * 12);
  return createPureEffect(meta, act, (f, t) => {
    const reach = clamp(t / .85) * 150;
    for (let x = 0; x < pigment.length; x++) pigment[x] = clamp((reach - x) / 17 + .12) * .9;
    for (let y = 0; y < f.h; y++) {
      const row = y * f.w, end = Math.min(pigment.length, Math.ceil(reach + ripple[y]));
      for (let x = 0; x < end; x++) {
        f.pigment[row + x] = pigment[x];
        f.pigment[row + f.w - 1 - x] = pigment[x];
      }
    }
  }, { seed, ...options });
}
