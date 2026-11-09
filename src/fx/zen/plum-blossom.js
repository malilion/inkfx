import { createPureEffect, rhythm, path, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'plum-blossom', name: '寒梅', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    path(f,[[-70,60],[-25,22],[2,-9],[51,-59]],4,.7);path(f,[[-25,22],[-43,-24]],2,.6);for(let k=0;k<6;k++){const x=-43+k*18,y=12-k*12;for(let j=0;j<5;j++){const v=j*TAU/5;dot(f,x+Math.cos(v)*6,y+Math.sin(v)*6,4+Math.sin(q+k)*.5,.6,1);}dot(f,x,y,2,.8);}
  }, { seed, ...options });
}
