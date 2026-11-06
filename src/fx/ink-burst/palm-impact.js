import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'palm-impact', name: '掌風', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    dot(f,0,20,24*g,a);for(let k=0;k<5;k++) path(f,[[k*12-25,15],[k*14-30,-31-Math.sin(k*.65)*20]],4,a);ring(f,73*g,2,a*.6,{start:0,end:Math.PI});
  }, { seed, ...options });
}
