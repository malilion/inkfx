import { createPureEffect, rhythm, envelope, path, leaf, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'burning-charm', name: '符紙自燃', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-25,-64],[27,-61],[24,65],[-27,62],[-25,-64]],2,a*.6);
    path(f,[[-13,-40],[14,-40],[0,-26],[12,-13],[-13,1],[10,12],[-9,39]],3,a,1);
    for(const p of particles) leaf(f,p.x*.5,55-g*(45+p.y),-1.6,p.r*5,a*.7,2);
  }, { seed, ...options });
}
