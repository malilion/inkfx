import { createPureEffect, rhythm, envelope, ring, leaf, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'realm-breakthrough', name: '境界突破', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<3;k++)ring(f,30+k*18*g,3-k*.5,a,{start:-2.8+k,end:2.7+k,tint:k%2?2:0});for(let k=0;k<8;k++)leaf(f,0,0,k*TAU/8,75*g,a*.6,2);
  }, { seed, ...options });
}
