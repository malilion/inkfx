import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'yin-yang-seal', name: '陰陽印', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 58 * g, 3.6, a);
    path(f, Array.from({ length: 25 }, (_, i) => {
      const u = i / 24;
      return [Math.sin(u * Math.PI) * 26 * g * (u < .5 ? 1 : -1), (-.5 + u) * 112 * g];
    }), 2.5, a);
    dot(f, 0, -28 * g, 15 * Math.max(g, .15), a * .9);
    dot(f, 0, 28 * g, 15 * Math.max(g, .15), a * .4, 1);
    dot(f, 0, -28 * g, 3.2, a, 1);
    dot(f, 0, 28 * g, 3.2, a);
  }, { seed, ...options });
}
