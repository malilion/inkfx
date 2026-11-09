import { createPureEffect, rhythm, envelope, path, dot, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'well-slash', name: '井字斬', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const cuts = [
      [[-46, -16], [46, -16]],
      [[-46, 18], [46, 18]],
      [[-16, -46], [-16, 46]],
      [[18, -46], [18, 46]],
    ];
    cuts.forEach((cut, k) => {
      const u = clamp(g * 4 - k);
      if (!u) return;
      const [p, q] = cut;
      path(f, [p, [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]], 3.4, a, k % 2 ? 1 : 0);
    });
    dot(f, 0, 1, 2.3, a * g, 2);
  }, { seed, ...options });
}
