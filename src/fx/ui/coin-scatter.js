import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'coin-scatter', name: '銅錢散落', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<7;k++){const v=k*TAU/7,x=Math.cos(v)*55*g,y=Math.sin(v)*48*g;ring(f,13,4,a,{x,y,tint:2});path(f,[[x-4,y-4],[x+4,y-4],[x+4,y+4],[x-4,y+4],[x-4,y-4]],1.6,a);}
  }, { seed, ...options });
}
