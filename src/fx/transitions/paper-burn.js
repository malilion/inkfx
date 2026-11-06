import { createPureEffect, rhythm, envelope, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'paper-burn', name: '宣紙燒穿', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const r=clamp(t/.8)*165;for(let x=0;x<f.w;x++) for(let y=0;y<f.h;y++){const i=y*f.w+x,d=Math.hypot(x-f.ox,y-f.oy)+Math.sin(x*.2)*3;if(d<r){f.pigment[i]=clamp((r-d)/9+.1);f.tint[i]=r-d<9?1:0;}}
  }, { seed, ...options });
}
