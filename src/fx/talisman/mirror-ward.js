import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'mirror-ward', name: '鏡壁', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const hex = n => Array.from({ length: 7 }, (_, i) => {
      const q = -Math.PI / 2 + i * TAU / 6;
      return [Math.cos(q) * n, Math.sin(q) * n];
    });
    path(f, hex(64 * g), 3.4, a, 1);
    path(f, hex(40 * g), 1.6, a * .65);
    for (let k = 0; k < 3; k++) {
      const q = -Math.PI / 2 + k * TAU / 3;
      path(f, [[0, 0], [Math.cos(q) * 40 * g, Math.sin(q) * 40 * g]], 1.4, a * .5);
    }
    ring(f, 10, 3, a, { tint: 2 });
  }, { seed, ...options });
}
