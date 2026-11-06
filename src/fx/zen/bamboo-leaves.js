import { createPureEffect, rhythm, path, leaf, TAU } from '../../core/motifs.js';
export const meta = { id: 'bamboo-leaves', name: '竹葉隨風', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    const sway=Math.cos(q)*5;path(f,[[-48,72],[-28+sway,15],[-16+sway,-66]],3,.7);for(let k=0;k<9;k++){const y=45-k*12,x=-38+k*2+sway;leaf(f,x,y,k%2?-.55:-2.65,25+k%3*5,.65,k===4?1:0);}
  }, { seed, ...options });
}
