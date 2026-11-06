import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { stroke, easeOut } from '../../core/brush.js';
export const meta = { id: 'ink-wipe', name: '大筆橫掃', category: 'transitions', duration: 1.1,
  loop: false, w: 256, h: 192, ox: 128, oy: 96 };
export const act = { windup: 0.12, poses: [[-0.12, 'load', 'easeOut'], [0, 'sweep', 'linear'], [0.55, 'settle', 'easeOut']],
  hits: [], recovery: 0.43 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const bristles = Array.from({ length: 27 }, (_, i) => ({ y: 46 + i * 3.8, width: 1.2 + random() * 1.8,
    end: 210 + random() * 23, ink: 0.6 + random() * 0.25 }));
  return createEffect(meta, act, (frame, t, previous) => {
    if (t < 0 || previous >= 0.55) return;
    const from = easeOut(previous / 0.55), to = easeOut(t / 0.55);
    for (const b of bristles) {
      const point = p => [24 + (b.end - 24) * p, b.y + Math.sin(p * 3.6) * 8 - p * 7];
      stroke(frame, [point(from), point(to)], b.width,
        { pigment: b.ink, wetness: 0.065, dryFactor: 0.9 + to * 0.65 });
    }
  }, { seed, ...options });
}
