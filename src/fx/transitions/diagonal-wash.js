import { createPureEffect, rhythm, envelope, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'diagonal-wash', name: '斜雨刷幕', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const p=clamp(t/.8)*f.w*2.1;for(let x=0;x<f.w;x++)for(let y=0;y<f.h;y++){const i=y*f.w+x;if(x+y<p+Math.sin(y*.2)*5)f.pigment[i]=.72+f.paperGrain[i]*.25;}
  }, { seed, ...options });
}
