import { createPureEffect, rhythm, envelope, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'vertical-brush', name: '縱筆遮幕', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const p=clamp(t/.8);for(let x=0;x<f.w;x++) for(let y=0;y<f.h;y++){const i=y*f.w+x;if(y<(f.h+8)*p+Math.sin(x*.13)*6){f.pigment[i]=.83+f.paperGrain[i]*.15;f.wetness[i]=.03;}}
  }, { seed, ...options });
}
