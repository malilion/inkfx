import { createPureEffect, rhythm, envelope, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'ink-chains', name: '墨鎖', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let s of [-1,1]) for(let k=0;k<8;k++){const x=s*(74-k*9*g),y=Math.sin(k*.8)*18;ring(f,8,2,a,{x,y,squash:.5,start:k*.1,end:TAU+k*.1});}
  }, { seed, ...options });
}
