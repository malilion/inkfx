import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { stroke, easeOut } from '../../core/brush.js';
import { clearInk } from '../../core/frame.js';
export const meta = { id: 'scroll-open', name: '卷軸展開', category: 'transitions', duration: 1.2,
  loop: false, w: 256, h: 192, ox: 128, oy: 96 };
export const act = { windup: 0.08, poses: [[-0.08, 'sealed', 'snap'], [0, 'unroll', 'easeOut'], [0.85, 'open', 'easeOut']],
  hits: [], recovery: 0.27 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const waviness = 1 + random() * 1.5;
  return createEffect(meta, act, (frame, t, previous) => {
    if (t < 0 || previous >= 0.85) return;
    clearInk(frame);
    const end = easeOut(t / 0.85) * 100;
    for (let x = 0; x <= end + 0.5; x += 0.8) {
      for (const side of [-1, 1]) {
        const px = frame.ox + side * x;
        const edge = Math.sin(x * 0.11) * waviness;
        // Horizontal ruled edges unroll outwards; the centre keeps its negative space.
        for (const y of [41 + edge, 151 - edge]) stroke(frame, [[px, y], [px + side * 1.2, y]], 2.1,
          { pigment: 0.58, wetness: 0.08, dryFactor: 1.1 });
      }
    }
    // Repaint travelling rollers so their old positions do not stain the scroll.
    for (const side of [-1, 1]) {
      const px = frame.ox + side * end;
      stroke(frame, [[px, 34], [px, 158]], 3.2,
        { pigment: 0.72, wetness: 0.06, dryFactor: 1.1 });
      for (const y of [34, 158]) stroke(frame, [[px - 4, y], [px + 4, y]], 2,
        { pigment: 0.65, wetness: 0.03, dryFactor: 0.7, tint: 2 });
    }
  }, { seed, ...options });
}
