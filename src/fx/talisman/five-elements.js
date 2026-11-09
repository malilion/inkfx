import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'five-elements', name: '五行輪', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<5;k++){const q=k*TAU/5-Math.PI/2,n=(k+2)*TAU/5-Math.PI/2;const x=Math.cos(q)*58*g,y=Math.sin(q)*58*g;path(f,[[x,y],[Math.cos(n)*58*g,Math.sin(n)*58*g]],1.5,a*.6);ring(f,12,3,a,{x,y,tint:k%2});}ring(f,76,1.2,a*.5);
  }, { seed, ...options });
}
