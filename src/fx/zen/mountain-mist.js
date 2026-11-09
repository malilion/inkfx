import { createPureEffect, rhythm, path, TAU } from '../../core/motifs.js';
export const meta = { id: 'mountain-mist', name: '山嵐', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    for(let k=0;k<4;k++){const points=Array.from({length:55},(_,i)=>{const x=-77+i*2.8;return [x,18+k*13-Math.exp(-(((x+30-k*20)/26)**2))*(50-k*8)+Math.sin(q+x*.04+k)*5];});path(f,points,5-k*.6,.27+k*.1);}
  }, { seed, ...options });
}
