import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'victory-seal', name: '勝印', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    const r=43;path(f,[[-r,-r],[r,-r],[r,r],[-r,r],[-r,-r]],5,a,1);for(let s of [-1,1]){path(f,[[s*24,-25],[s*24,25]],3,a,1);path(f,[[s*33,-15],[s*10,-15],[s*17,2],[s*7,17]],2.8,a,1);}path(f,[[-6,-30],[8,30]],3,a,1);
  }, { seed, ...options });
}
