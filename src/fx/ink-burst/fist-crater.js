import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'fist-crater', name: '拳坑', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    dot(f, 0, 6, 18 * g, a * .85, 1);
    ring(f, 28 * g, 3, a * .7, { y: 8, squash: .72 });
    for (let k = 0; k < 3; k++) ring(f, (22 + k * 16) * g, 2.2 - k * .3, a * (1 - k * .18), { y: 10, squash: .42 });
    for (let k = 0; k < 7; k++) {
      const q = -Math.PI / 2 + k * TAU / 7;
      path(f, [[Math.cos(q) * 16, 8 + Math.sin(q) * 10], [Math.cos(q) * (36 + k % 3 * 8) * g, 10 + Math.sin(q) * (28 + k % 3 * 6) * g]], 1.8, a * .75);
    }
  }, { seed, ...options });
}
