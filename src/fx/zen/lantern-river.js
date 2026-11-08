import { createPureEffect, rhythm, path, ring, dot, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'lantern-river', name: '河燈夜渡', category: 'zen', duration: 4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const lanterns = [0, 1, 2].map(i => ({ phase: (i + random() * .6) / 3, lane: 4 + i * 20 + random() * 6, bob: random() * TAU }));
  const waves = [0, 1, 2, 3].map(() => random() * TAU);
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    ring(f, 13, 1.3, .38, { x: 54, y: -60 });
    path(f, [[-92, -26], [-60, -40], [-34, -30], [-6, -44], [26, -34]], 1.3, .28);
    for (let k = 0; k < 4; k++) path(f, Array.from({ length: 21 }, (_, i) => {
      const x = -90 + i * 9;
      return [x, 2 + k * 18 + Math.sin(x * .05 + q * (k % 2 ? 1 : -1) + waves[k]) * 2.2];
    }), 1.1, .2 + k * .05);
    for (const l of lanterns) {
      const u = (l.phase + t / meta.duration) % 1, alpha = Math.sin(Math.PI * u) ** .7;
      if (alpha < .02) continue;
      const x = -84 + 168 * u, y = l.lane + Math.sin(q * 2 + l.bob) * 1.6;
      path(f, [[x - 7, y], [x + 7, y], [x + 5, y - 11], [x - 5, y - 11], [x - 7, y]], 1.8, alpha * .75);
      dot(f, x, y - 6, 2, alpha * .9, 1);
      path(f, [[x - 10, y - 2], [x - 4, y + 2], [x + 4, y + 2], [x + 10, y - 2]], 1.3, alpha * .5);
      // Wavering reflection.
      path(f, Array.from({ length: 6 }, (_, i) => [x + Math.sin(q * 4 + i + l.bob) * 1.6, y + 4 + i * 3.4]), 1.2, alpha * .22, 1);
    }
  }, { seed, ...options });
}
