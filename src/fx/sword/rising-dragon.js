import { createPureEffect, rhythm, envelope, path, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'rising-dragon', name: '昇龍劍', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,Array.from({length:65},(_,i)=>{const u=i/64*g;return [-38+Math.sin(u*4)*30,70-u*142];}),7,a);
    ring(f,32,1.6,a*.5,{y:38,start:Math.PI,end:Math.PI+g*4});
  }, { seed, ...options });
}
