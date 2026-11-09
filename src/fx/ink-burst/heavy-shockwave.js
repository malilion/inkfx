import { createPureEffect, rhythm, envelope, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'heavy-shockwave', name: '重擊震波', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<3;k++) ring(f,(25+k*20)*g,4-k,a*(1-k*.2),{squash:.65});dot(f,0,0,12,a);
  }, { seed, ...options });
}
