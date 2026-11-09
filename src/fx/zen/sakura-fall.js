import { createPureEffect, rhythm, leaf, dot, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'sakura-fall', name: '殘櫻飄落', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    for(const p of particles){const v=(p.phase+q)%TAU,x=Math.sin(v)*48+p.x*.4,y=Math.cos(v)*64;leaf(f,x,y,v+Math.sin(q)*.2,9+p.r,.55,1);dot(f,x,y,1.5,.5);}
  }, { seed, ...options });
}
