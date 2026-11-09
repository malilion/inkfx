import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'break-seal', name: '破印', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-45,-44],[44,-42],[46,45],[-43,44],[-45,-44]],4,a,1);path(f,[[-29,-21],[-7,-21],[-25,4],[-25,24],[-9,24],[-9,2],[-25,2]],3,a,1);path(f,[[16,-30],[13,5],[34,29]],3,a,1);path(f,[[3,-9],[33,-9],[3,29]],3,a,1);
  }, { seed, ...options });
}
