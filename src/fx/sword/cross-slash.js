import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { stroke, makeDroplets, splash, clamp } from '../../core/brush.js';
export const meta = { id: 'cross-slash', name: '十字劍氣', category: 'sword', duration: 0.9,
  loop: false, w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: 0.3, poses: [[-0.3, 'gather', 'easeOut'], [0, 'cut', 'snap'], [0.06, 'cross', 'snap'], [0.22, 'settle', 'easeOut']],
  hits: [{ t: 0.08, freeze: 0.14, shakeAmp: 4, inkSplash: 24 }], recovery: 0.32 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed), droplets = makeDroplets(random, 24);
  const tilt = (random() - 0.5) * 6;
  return createEffect(meta, act, (frame, t) => {
    if (t < 0 || t > 0.085) return;
    for (let cut = 0; cut < 2; cut++) {
      const progress = clamp((t - cut * 0.055) / 0.017);
      if (!progress) continue;
      const sign = cut ? -1 : 1;
      // Separate bristles leave long parallel paper channels across both cuts.
      for (let bristle = -3; bristle <= 3; bristle++) {
        const x0 = 48 + bristle * 1.7, y0 = 112 - sign * 62 + tilt;
        stroke(frame, [[x0, y0], [x0 + 128 * progress, y0 + sign * 124 * progress]],
          1.25 + (3 - Math.abs(bristle)) * 0.6, { pigment: 0.78, wetness: 0.02, dryFactor: 1.25 });
      }
    }
    if (t > 0.06) splash(frame, droplets, t - 0.06, { scale: 2.3 });
  }, { seed, ...options });
}
