import { createPureEffect, rhythm, envelope, path, leaf, easeOut } from '../../core/motifs.js';
export const meta = { id: 'falling-swallow', name: '落雁斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-72,-58],[-28,-31],[12,12],[65*g,54*g]],6,a);
    for(let k=0;k<5;k++) leaf(f,16+k*9,15+k*5,2.5,15,a*.6);
  }, { seed, ...options });
}
