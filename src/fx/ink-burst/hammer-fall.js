import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, mulberry32 } from '../../core/motifs.js';
export const meta = { id: 'hammer-fall', name: '落錘', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const chips = Array.from({ length: 10 }, (_, i) => ({
    x: (random() - .5) * 90, y: 20 + random() * 28, r: 1 + random() * 1.6, tint: i % 4 === 0 ? 1 : 0,
  }));
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), head = -68 + 108 * g;
    path(f, [[-7, head - 36], [0, head]], 3.2, a * .8);
    path(f, [[-26, head - 8], [26, head - 8], [22, head + 10], [-22, head + 10], [-26, head - 8]], 3.4, a, 1);
    ring(f, 18 + 48 * g, 2.6, a * .65, { y: 52, squash: .26, start: Math.PI * .15, end: Math.PI * .85 });
    path(f, [[-70, 56], [70, 56]], 2, a * .4);
    for (const chip of chips) dot(f, chip.x * g, 52 - chip.y * (1 - g), chip.r, a * .8, chip.tint);
  }, { seed, ...options });
}
