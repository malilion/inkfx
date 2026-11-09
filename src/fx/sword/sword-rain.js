import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'sword-rain', name: '萬劍雨', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<9;k++){const x=(k-4)*17,y=-64+(k%3)*15;path(f,[[x,y],[x-14*g,y+95*g]],2.8,a);path(f,[[x-6,y+12],[x+5,y+14]],1,a*.7,1);}
  }, { seed, ...options });
}
