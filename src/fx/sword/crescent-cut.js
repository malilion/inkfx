import { createPureEffect, rhythm, envelope, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'crescent-cut', name: '半月斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    ring(f,67,8,a,{start:-2.7,end:-2.7+g*3.7,squash:.72});
    ring(f,76,1.5,a*.6,{start:-2.6,end:-2.6+g*3.5,squash:.72});
  }, { seed, ...options });
}
