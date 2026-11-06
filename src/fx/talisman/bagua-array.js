import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'bagua-array', name: '八卦陣', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    ring(f,65*g,2,a);ring(f,44*g,1.4,a*.7);
    for(let k=0;k<8;k++) for(let j=0;j<3;j++){const q=k*TAU/8,r=49+j*5;const pt=v=>[Math.cos(q)*r-Math.sin(q)*v,Math.sin(q)*r+Math.cos(q)*v];if((k>>j)&1){path(f,[pt(-8),pt(-2)],1.5,a,1);path(f,[pt(2),pt(8)],1.5,a,1);}else path(f,[pt(-8),pt(8)],1.5,a,1);}
    ring(f,16,3,a,{start:t,end:t+Math.PI});dot(f,0,-8,3,a,1);dot(f,0,8,3,a);
  }, { seed, ...options });
}
