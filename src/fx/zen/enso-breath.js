import { createPureEffect, rhythm, ring, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'enso-breath', name: '禪圓', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const q=t/meta.duration*TAU, g=1, a=.7;
    const r=54+Math.cos(q)*3;ring(f,r,7,.65,{start:-1.25,end:4.72});ring(f,r+8,1,.3,{start:-.9,end:4.2});dot(f,15,4,3,.4,1);
  }, { seed, ...options });
}
