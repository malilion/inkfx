import { createPureEffect, rhythm, envelope, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'cloud-curtain', name: '雲幕合攏', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const r=clamp(t/.85)*150;for(let x=0;x<f.w;x++)for(let y=0;y<f.h;y++){const i=y*f.w+x,d=Math.min(x,f.w-1-x);if(d<r+Math.sin(y*.08)*12)f.pigment[i]=clamp((r-d)/17+.12)*.9;}
  }, { seed, ...options });
}
