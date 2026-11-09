import { createPureEffect, rhythm, envelope, path, dot, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'draw-cut', name: '一字拔刀', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const particles = Array.from({ length: 18 }, (_, i) => ({x:(random()-.5)*140,y:(random()-.5)*128,r:1+random()*2,phase:random()*TAU,tint:i%6===0?1:0}));
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let b=-3;b<=3;b++) path(f,[[-78,b*2],[72*g,b*2-4*g]],2.3,a*(1-Math.abs(b)*.1));
    for(const p of particles) dot(f,35+p.x*g*.7,p.y*g,p.r,a,p.tint);
  }, { seed, ...options });
}
