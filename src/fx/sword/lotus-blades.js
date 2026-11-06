import { createPureEffect, rhythm, envelope, path, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'lotus-blades', name: '蓮華劍', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<8;k++){const q=k*TAU/8;path(f,Array.from({length:25},(_,i)=>{const u=i/24*g,r=Math.sin(u*Math.PI)*34+u*30;return [Math.cos(q+u)*r,Math.sin(q+u)*r];}),3,a,k%4===0?1:0);}
  }, { seed, ...options });
}
