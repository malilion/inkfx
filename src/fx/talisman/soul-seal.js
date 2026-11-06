import { createPureEffect, rhythm, envelope, path, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'soul-seal', name: '鎮魂印', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const r=48*(1.3-.3*g);path(f,[[-r,-r],[r,-r],[r,r],[-r,r],[-r,-r]],4,a,1);
    for(let k=-1;k<=1;k++){path(f,[[k*23,-29],[k*23,28]],3,a,1);path(f,[[k*23-9,-8],[k*23+9,-8]],2,a,1);}ring(f,69,1,a*.35);
  }, { seed, ...options });
}
