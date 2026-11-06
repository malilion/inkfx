import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'silk-ribbon', name: '素練', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const wave = offset => Array.from({ length: 28 }, (_, i) => {
      const u = i / 27 * g;
      return [-72 + u * 144, Math.sin(u * Math.PI * 2) * 18 + offset];
    });
    path(f, wave(0), 4, a);
    path(f, wave(6), 1.3, a * .5, 1);
    dot(f, -72 + 144 * g, Math.sin(g * Math.PI * 2) * 18, 2.4, a, 1);
  }, { seed, ...options });
}
