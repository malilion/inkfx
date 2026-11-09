import { createPureEffect, rhythm, envelope, ring, dot, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'qi-burst', name: '氣爆', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const sparks = Array.from({ length: 14 }, (_, i) => ({
    q: random() * TAU, dist: 24 + random() * 40, r: .8 + random() * 1.8, tint: i % 5 === 0 ? 1 : 0,
  }));
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    dot(f, 0, 0, 12 * g, a, 1);
    for (let k = 0; k < 4; k++) ring(f, (14 + k * 14) * g, 2.8 - k * .4, a * (1 - k * .12));
    for (const spark of sparks) dot(f, Math.cos(spark.q) * spark.dist * g, Math.sin(spark.q) * spark.dist * g, spark.r, a, spark.tint);
  }, { seed, ...options });
}
