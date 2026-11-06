import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'thunder-thrust', name: '驚雷刺', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-78,15],[-20,8],[5,-4],[31,3],[80*g,-12]],5,a);
    for(let k=-2;k<=2;k++) path(f,[[20,k*8],[80*g,-12]],1.2,a*.5);
  }, { seed, ...options });
}
