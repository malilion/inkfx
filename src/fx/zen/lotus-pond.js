import { createPureEffect, rhythm, path, ring, TAU } from '../../core/motifs.js';
export const meta = { id: 'lotus-pond', name: '荷塘', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    for(let k=0;k<7;k++){const v=(k-3)*.35;path(f,Array.from({length:49},(_,i)=>{const u=i/48,s=Math.sin(u*Math.PI),b=Math.sin(u*TAU)*9;return [Math.sin(v)*s*55+Math.cos(v)*b,20-Math.cos(v)*s*48+Math.sin(v)*b+Math.cos(q)*2];}),2.8,.62,k%2);}path(f,[[0,20],[3,57]],2,.6);ring(f,65,1,.3,{y:49,squash:.18,start:0,end:Math.PI});
  }, { seed, ...options });
}
