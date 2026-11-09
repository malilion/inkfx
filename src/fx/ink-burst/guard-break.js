import { createPureEffect, rhythm, envelope, path, ring, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'guard-break', name: '破防碎墨', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    ring(f,48*g,5,a,{start:-2.8,end:-.4});ring(f,48*g,4,a,{start:.3,end:2.4});for(const p of particles){const x=p.x*g,y=p.y*g;path(f,[[x,y],[x+5,y+9],[x-4,y+5],[x,y]],2,a,p.tint);}
  }, { seed, ...options });
}
