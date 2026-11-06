import { createPureEffect, rhythm, envelope, path, leaf, easeOut } from '../../core/motifs.js';
export const meta = { id: 'returning-blade', name: '回鞘劍意', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,Array.from({length:70},(_,i)=>{const u=i/69*g,q=u*5.7;return [Math.cos(q)*(74-u*48),Math.sin(q)*(52-u*32)];}),4,a);
    leaf(f,-10,5,-.3,38,a,1);
  }, { seed, ...options });
}
