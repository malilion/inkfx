import { createPureEffect, rhythm, envelope, path, ring, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'heaven-net', name: '天羅地網', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let i = -3; i <= 3; i++) {
      path(f, [[-68 * g, i * 16], [68 * g, i * 16]], 1.35, a * .5);
      path(f, [[i * 16, -68 * g], [i * 16, 68 * g]], 1.35, a * .5);
    }
    ring(f, 46 * g, 3.2, a, { tint: 1 });
    path(f, [[-16, -20], [16, -20], [0, 18], [-16, -20]], 2.6, a, 1);
    for (let k = 0; k < 4; k++) {
      const q = k * TAU / 4 + Math.PI / 4;
      path(f, [[Math.cos(q) * 52 * g, Math.sin(q) * 52 * g], [Math.cos(q) * 66 * g, Math.sin(q) * 66 * g]], 2.2, a, 1);
    }
  }, { seed, ...options });
}
