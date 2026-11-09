import { createPureEffect, rhythm, envelope, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'whirlwind-slash', name: '迴風斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<3;k++) ring(f,32+k*18,4-k*.6,a,{start:k*2.1+t,end:k*2.1+t+g*3.3,squash:.8});
  }, { seed, ...options });
}
