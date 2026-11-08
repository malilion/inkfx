import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { stroke, stamp, clamp, easeOut } from '../../core/motifs.js';
export const meta = { id: 'ink-rain-curtain', name: '墨雨垂簾', category: 'transitions', duration: 1.2,
  loop: false, w: 256, h: 192, ox: 128, oy: 96 };
export const act = { windup: .1, poses: [[-.1, 'load', 'easeOut'], [0, 'pour', 'linear'], [.7, 'settle', 'easeOut']],
  hits: [], recovery: .4 };
// Overlapping vertical strands fall at staggered speeds until the canvas is fully curtained.
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const strands = Array.from({ length: 42 }, (_, i) => ({ x: 2 + i * 252 / 41 + (random() - .5) * 2,
    delay: random() * .28, span: .3 + random() * .18, radius: 5 + random() * 1.2,
    ink: .45 + random() * .3, sway: random() * Math.PI * 2 }));
  return createEffect(meta, act, (f, t, previous) => {
    if (t < 0 || previous > .8) return;
    for (const s of strands) {
      const from = easeOut(clamp((previous - s.delay) / s.span)), to = easeOut(clamp((t - s.delay) / s.span));
      if (to <= from) continue;
      const point = p => [s.x + Math.sin(p * 4 + s.sway) * 1.1, -8 + 208 * p];
      stroke(f, [point(from), point(to)], s.radius, { pigment: s.ink, wetness: .14, dryFactor: .55 + to * .45 });
      if (to >= 1 && from < 1) stamp(f, s.x, 188, s.radius * 1.4, { pigment: s.ink, wetness: .3, dryFactor: .4 });
    }
  }, { seed, ...options });
}
