import { createPureEffect, rhythm, envelope, leaf, dot, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'cinnabar-burst', name: '朱砂氣湧', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(const p of particles){leaf(f,p.x*g,p.y*g,Math.atan2(p.y,p.x),10+p.r*4,a,p.tint?0:1);}dot(f,0,0,17,a*.7,1);
  }, { seed, ...options });
}
