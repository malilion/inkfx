import { createPureEffect, rhythm, envelope, path, dot, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'earth-cleaver', name: '刀罡碎地', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[0,-76],[2,40*g]],7,a);for(let s of [-1,1]) for(let k=0;k<3;k++) path(f,[[0,36],[s*22,34+k*8],[s*(52+k*10)*g,53+k*9]],2,a*.7);
    for(const p of particles) dot(f,p.x*g,35+Math.abs(p.y)*g*.6,p.r,a);
  }, { seed, ...options });
}
