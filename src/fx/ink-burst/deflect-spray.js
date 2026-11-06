import { createPureEffect, rhythm, envelope, path, dot, easeOut, mulberry32 } from '../../core/motifs.js';
export const meta = { id: 'deflect-spray', name: '卸勁', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const drops = Array.from({ length: 9 }, (_, i) => ({
    q: -.9 + random() * 1.8, len: 16 + random() * 30, tint: i % 3 === 0 ? 1 : 0,
  }));
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-46, 32], [-8, 4], [18, -36]], 5.2, a);
    path(f, [[-40, 24], [10, -28]], 1.3, a * .4, 2);
    for (const drop of drops) {
      const x = 6 + Math.cos(drop.q) * drop.len * g, y = -8 + Math.sin(drop.q) * drop.len * g;
      path(f, [[6, -8], [x, y]], 1.35, a * .75, drop.tint);
      dot(f, x, y, 1.6, a, drop.tint);
    }
  }, { seed, ...options });
}
