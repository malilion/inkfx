import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, TAU } from '../../core/motifs.js';
export const meta = { id: 'cooldown-arc', name: '冷卻弧', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 58, 1.4, a * .4);
    for (let k = 0; k < 12; k++) {
      const q = -Math.PI / 2 + k * TAU / 12;
      path(f, [[Math.cos(q) * 50, Math.sin(q) * 50], [Math.cos(q) * 58, Math.sin(q) * 58]], 1.3, a * .55);
    }
    ring(f, 44, 5, a, { start: -Math.PI / 2, end: -Math.PI / 2 + TAU * g, tint: 1 });
    path(f, [[-8, -8], [8, -8], [8, 8], [-8, 8], [-8, -8]], 2, a, 1);
    dot(f, 0, 0, 2.2, a, 2);
  }, { seed, ...options });
}
