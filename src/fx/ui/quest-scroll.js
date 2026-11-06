import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'quest-scroll', name: '任務卷', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-49,-37],[49,-37],[49,37],[-49,37],[-49,-37]],2,a);for(let s of [-1,1]){path(f,[[s*51,-47],[s*51,47]],5,a,2);}for(let k=0;k<4;k++)path(f,[[-29,-22+k*15],[28,-22+k*15]],2,a*.6);
  }, { seed, ...options });
}
