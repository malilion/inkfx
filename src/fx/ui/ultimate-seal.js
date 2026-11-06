import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'ultimate-seal', name: '極印', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f,t) => {
    const g=easeOut((t+1/120)/.12), a=envelope(t);
    path(f,[[-45,-45],[45,-45],[45,45],[-45,45],[-45,-45]],4,a,1);path(f,[[-24,-29],[-24,29]],3,a,1);path(f,[[-36,-8],[-8,-8],[-35,18]],3,a,1);path(f,[[0,-28],[30,-28],[5,-10],[27,12],[1,29],[32,29]],3,a,1);
  }, { seed, ...options });
}
