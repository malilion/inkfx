import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { makeDroplets, splash, stroke, clamp } from '../../core/brush.js';
import { stamp } from '../../core/feibai.js';
export const meta = { id: 'ink-splash', name: '墨點濺射', category: 'ink-burst', duration: 0.8,
  loop: false, w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: 0.08, poses: [[-0.08, 'gather', 'snap'], [0, 'burst', 'snap'], [0.13, 'settle', 'easeOut']],
  hits: [{ t: 1 / 60, freeze: 0.12, shakeAmp: 5, inkSplash: 40 }], recovery: 0.45 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed), droplets = makeDroplets(random, 40);
  const rays = Array.from({ length: 14 }, () => ({ angle: random() * Math.PI * 2, length: 24 + random() * 52, width: 1 + random() * 2 }));
  return createEffect(meta, act, (frame, t, previous) => {
    if (t < 0 || previous > 0.1) return;
    const growth = clamp((t + 1 / 120) / 0.05);
    stamp(frame, frame.ox, frame.oy, 12 + growth * 9, { pigment: 0.84, wetness: 0.8, dryFactor: 0.5 });
    for (const ray of rays) {
      const r = growth * ray.length;
      stroke(frame, [[frame.ox, frame.oy], [frame.ox + Math.cos(ray.angle) * r, frame.oy + Math.sin(ray.angle) * r]],
        ray.width, { pigment: 0.65, wetness: 0.2, dryFactor: 1.3 });
    }
    splash(frame, droplets, t, { scale: 3.3 });
  }, { seed, ...options });
}
