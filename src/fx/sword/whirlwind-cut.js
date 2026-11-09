import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { clamp } from '../../core/brush.js';
import { stamp } from '../../core/feibai.js';
import { clearInk } from '../../core/frame.js';

// A spinning cut: the blade coils inward, then unwinds one and a quarter turns outward.
export const meta = { id: 'whirlwind-cut', name: '回風旋斬', category: 'sword', duration: 1.25,
  loop: false, w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: .3,
  poses: [[-.3, 'COIL', 'easeOut'], [0, 'SPIN_CUT', 'snap'], [.16, 'FOLLOW_HOLD'], [.6, 'RECOVER', 'easeOut']],
  hits: [{ t: .08, freeze: .12, shakeAmp: 3, inkSplash: 20 }], recovery: .2 };
const TAU = Math.PI * 2, SWEEP = .16;
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const tilt = (random() - .5) * .35, start = -.6 + (random() - .5) * .4;
  const spiral = (f, u, offset = 0) => {
    const a = start + u * TAU * 1.25, r = 18 + u * 58 + offset;
    const x = Math.cos(a) * r, y = Math.sin(a) * r * .6;
    return [f.ox + x * Math.cos(tilt) - y * Math.sin(tilt), f.oy + 6 + x * Math.sin(tilt) + y * Math.cos(tilt)];
  };
  const droplets = Array.from({ length: 22 }, (_, i) => ({
    u: .55 + random() * .45, speed: 60 + random() * 140, spread: (random() - .5) * .7,
    r: .9 + random() * 2.2, life: .2 + random() * .4, tint: i < 4 ? 1 : 0 }));
  return createEffect(meta, act, (f, t, previous) => {
    if (t < 0) {
      // Windup: faint qi gathering in a tight coil around the hilt.
      const k = clamp(1 + t / .3);
      if (Math.floor(previous * 60) !== Math.floor(t * 60)) for (let i = 0; i < 3; i++) {
        const a = start - k * 5 + i * TAU / 3, r = 26 * (1 - k) + 6;
        stamp(f, f.ox + Math.cos(a) * r, f.oy + 6 + Math.sin(a) * r * .6, .9,
          { pigment: .12 + k * .14, wetness: .02, dryFactor: .7, tint: i === 0 ? 1 : 0 });
      }
      return;
    }
    const fade = clamp(1 - (t - .2) / .55);
    if (!fade) { clearInk(f); return; }
    if (t > .2) {
      const ratio = fade / clamp(1 - (previous - .2) / .55);
      for (let i = 0; i < f.pigment.length; i++) { f.pigment[i] *= ratio; f.wetness[i] *= ratio; }
    }
    if (previous < SWEEP) {
      const from = clamp(previous / SWEEP), to = clamp(t / SWEEP), n = Math.max(1, Math.ceil((to - from) * 320));
      for (let i = 0; i <= n; i++) {
        const u = from + (to - from) * i / n, taper = Math.sin(Math.PI * u) ** .55;
        const [x, y] = spiral(f, u);
        stamp(f, x, y, .8 + 8.5 * taper, { pigment: .8, wetness: .03, dryFactor: .8 + u * .85, tint: u > .88 ? 1 : 0 });
        if (u > .3) {
          const [ex, ey] = spiral(f, u, 10);
          stamp(f, ex, ey, 1.1, { pigment: .45, wetness: .01, dryFactor: 1.2 });
        }
      }
    }
    if (t < .1 || t > .4) return;
    for (const d of droplets) {
      const age = t - .1, k = 1 - age / d.life;
      if (k <= 0) continue;
      const [x0, y0] = spiral(f, d.u), [x1, y1] = spiral(f, Math.min(1, d.u + .01));
      const heading = Math.atan2(y1 - y0, x1 - x0) + d.spread;
      const travel = (1 - Math.pow(.9, age * 120)) / (120 * .1);
      stamp(f, x0 + Math.cos(heading) * d.speed * travel, y0 + Math.sin(heading) * d.speed * travel + 10 * age * age,
        d.r * (.6 + .4 * k), { pigment: k * .7, wetness: .3, dryFactor: .6, tint: d.tint });
    }
  }, { seed, ...options });
}
