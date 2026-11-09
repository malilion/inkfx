import { createPureEffect, path, dot, envelope, easeOut, mulberry32 } from '../../core/motifs.js';
export const meta = { id: 'scabbard-parry', name: '鞘返', category: 'sword', duration: 1.4,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: .24, poses: [[-.24, 'GUARD'], [0, 'PARRY', 'snap'], [.12, 'REDIRECT'], [.7, 'RECOVER']],
  hits: [{ t: .035, freeze: .14, shakeAmp: 2, inkSplash: 12 }], recovery: .22 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const sparks = Array.from({ length: 12 }, () => [random(), random()]);
  return createPureEffect(meta, act, (f, t) => {
    const a = t < 0 ? .32 : envelope(t, .045, .98), g = easeOut(t / .1);
    path(f, [[-42, 47], [23, -17]], 5, a);
    path(f, [[10, -29], [35, -5]], 2, a, 1);
    if (t < 0) return;
    path(f, Array.from({ length: 25 }, (_, i) => {
      const u = i / 24 * g;
      return [6 + 74 * u, -12 - Math.sin(u * Math.PI * .8) * 52];
    }), 3.8, a * .8, 1);
    for (const [u, v] of sparks) dot(f, 22 + g * (30 + u * 32), -15 - g * (8 + v * 51),
      1 + u * 1.5, a * .6, u > .7 ? 1 : 0);
  }, { seed, ...options });
}
