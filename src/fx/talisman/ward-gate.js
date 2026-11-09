import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'ward-gate', name: '結界門', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    for(let s of [-1,1]){path(f,[[s*48,60],[s*48,-43],[s*35,-61]],4,a);path(f,[[s*60,-35],[s*28,-43]],3,a,1);}path(f,[[-64,-51],[0,-64],[64,-51]],5,a);
    for(let k=0;k<5;k++) path(f,[[-31,-25+k*16],[31*g,-25+k*16]],1,a*.35);
  }, { seed, ...options });
}
