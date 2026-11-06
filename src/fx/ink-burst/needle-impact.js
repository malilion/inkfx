import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'needle-impact', name: '點穴', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<12;k++){const v=k*TAU/12,r=22+g*47;path(f,[[Math.cos(v)*15,Math.sin(v)*15],[Math.cos(v)*r,Math.sin(v)*r]],k%3?1:2.8,a,k%4===0?1:0);}ring(f,13,3,a);
  }, { seed, ...options });
}
