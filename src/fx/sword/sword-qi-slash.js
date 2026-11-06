import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { arc, makeDroplets, splash, clamp } from '../../core/brush.js';
import { stamp } from '../../core/feibai.js';

export const meta = { id: 'sword-qi-slash', name: '劍氣斬', category: 'sword', duration: 0.75,
  loop: false, w: 224, h: 224, ox: 112, oy: 124, droplets: 28, accentRatio: 0.15 };
export const act = { windup: 0.4,
  poses: [[-0.4, 'gather', 'easeOut'], [-0.04, 'draw', 'snap'], [0, 'slash', 'snap'], [0.017, 'impact', 'snap'], [0.17, 'settle', 'easeOut']],
  hits: [{ t: 1 / 60, freeze: 0.15, shakeAmp: 3, inkSplash: 28 }], recovery: 0.18 };

export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const droplets = makeDroplets(random, meta.droplets, meta.accentRatio);
  const rotation = -0.55 + (random() - 0.5) * 0.12;
  for (const drop of droplets) {
    const angle = -2.7 + random() * 2.8;
    const x = Math.cos(angle) * (59 + random() * 19);
    const y = Math.sin(angle) * 43;
    drop.x = x * Math.cos(rotation) - y * Math.sin(rotation);
    drop.y = x * Math.sin(rotation) + y * Math.cos(rotation);
    drop.vx = drop.x * (0.7 + random());
    drop.vy = drop.y * (0.7 + random());
    drop.radius *= 0.65;
  }
  return createEffect(meta, act, (frame, t, previous) => {
    if (t < 0) {
      const strength = clamp((t + act.windup) / act.windup);
      // A fine gathering thread anticipates the large, dry blade.
      if (strength > 0.25) stamp(frame, frame.ox - 53 + strength * 8, frame.oy + 26 - strength * 8,
        0.65 + strength * 1.3, { pigment: 0.12, wetness: 0.02, dryFactor: 0.4 });
      return;
    }
    if (previous < 1 / 60) {
      const progress = clamp((t + 1 / 120) * 60);
      arc(frame, { progress, rotation, radius: 83, width: 9 });
      arc(frame, { progress, rotation: rotation + 0.04, radius: 89, width: 1.5, pigment: 0.42, dryFactor: 1.9 });
    }
    if (t <= 0.09) splash(frame, droplets, t, { scale: 1.0 });
  }, { seed, ...options });
}
