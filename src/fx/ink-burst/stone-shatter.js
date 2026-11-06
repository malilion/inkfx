import { createPureEffect, rhythm, envelope, path, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'stone-shatter', name: '碎石', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(const p of particles){const x=p.x*g,y=p.y*g,r=p.r*3;path(f,[[x-r,y],[x,y-r],[x+r,y+r*.5],[x-r,y]],2,a*.8);}path(f,[[-65,53],[-20,44],[0,53],[40,43],[70,52]],2,a*.5);
  }, { seed, ...options });
}
