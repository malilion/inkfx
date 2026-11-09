import { createPureEffect, rhythm, path, ring, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'tea-steam', name: '茶煙', category: 'zen', duration: 3,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed), phases = [random()*TAU, random()*TAU, random()*TAU];
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    ring(f, 32, 2, .7, {y:12,squash:.22});
    path(f,[[-32,12],[-26,42],[22,42],[32,12]],2.5,.65);
    ring(f, 12, 2, .55, {x:34,y:24,start:-1.6,end:1.6,squash:.8});
    path(f,[[-40,49],[39,49]],1.4,.4);
    for (let k=0;k<3;k++) path(f,Array.from({length:25},(_,i)=>{
      const u=i/24;
      return [(k-1)*14+Math.sin(q+phases[k]+u*5)*(4+u*8),3-u*78];
    }),1.7,.22+k*.045,k===1?1:0);
  }, { seed, ...options });
}
