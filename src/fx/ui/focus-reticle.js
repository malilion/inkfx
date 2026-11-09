import { createPureEffect, rhythm, envelope, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'focus-reticle', name: '凝神', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<4;k++){const v=k*Math.PI/2;ring(f,45*(1.4-.4*g),3,a,{start:v+.15,end:v+1.1});}ring(f,14,2,a*.6);dot(f,0,0,3,a,1);
  }, { seed, ...options });
}
