import { createPureEffect, rhythm, path, ring, TAU } from '../../core/motifs.js';
export const meta = { id: 'boat-ripples', name: '孤舟水波', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    path(f,[[-33,-3],[0,8],[35,-3]],4,.8);path(f,[[0,4],[0,-29],[19,-6],[0,-6]],2,.65);for(let k=0;k<5;k++){const u=(k/5+q/TAU)%1;ring(f,24+u*54,1.5,Math.sin(u*Math.PI)*.45,{y:12,squash:.24});}
  }, { seed, ...options });
}
