import { createPureEffect, rhythm, envelope, ring, path, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'realm-breakthrough', name: '境界突破', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let k=0;k<2;k++)ring(f,28+k*38*g,2.4-k*.8,a,{start:-2.8+k,end:2.7+k,tint:k===0?2:0});
    // Fine outgoing brush rays leave space between the two expanding ink rings.
    for(let k=0;k<8;k++) {
      const angle=k*TAU/8, tip=75*g;
      path(f,[[0,0],[Math.cos(angle+.32)*tip*.55,Math.sin(angle+.32)*tip*.55],
        [Math.cos(angle)*tip,Math.sin(angle)*tip]],2.5,a*.6,2);
    }
  }, { seed, ...options });
}
