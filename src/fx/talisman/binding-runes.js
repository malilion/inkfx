import { createPureEffect, rhythm, envelope, path, ring, leaf, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'binding-runes', name: '敕令縛', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    ring(f,63*g,3,a,{start:-Math.PI/2,end:-Math.PI/2+TAU*g});for(let k=0;k<6;k++){const q=k*TAU/6;leaf(f,Math.cos(q)*44,Math.sin(q)*44,q+1,19,a,1);}path(f,[[-15,-22],[17,-22],[-11,0],[15,0],[0,25]],4,a,1);
  }, { seed, ...options });
}
