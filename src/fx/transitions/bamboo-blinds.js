import { createPureEffect, rhythm, envelope, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'bamboo-blinds', name: '竹簾落', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const p=clamp(t/.85);for(let x=0;x<f.w;x++)for(let y=0;y<f.h;y++){const i=y*f.w+x,delay=(Math.floor(x/16)%3)*.08;if(y/f.h<clamp((p-delay)*1.3))f.pigment[i]=x%16<2?.45:.9;}
  }, { seed, ...options });
}
