import { createPureEffect, rhythm, path, leaf, dot, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'pine-snow', name: '松雪', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const flakes = Array.from({ length: 16 }, (_, i) => ({
    x: -64 + random() * 128, drift: (random() - .5) * 8, phase: random(), r: .8 + random() * 1.1, tint: i % 5 === 0 ? 2 : 0,
  }));
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    path(f, [[-70, 40], [-24, 16], [8, -6], [58, -38]], 3.6, .72);
    path(f, [[-24, 16], [-46, -8]], 2, .55);
    for (let k = 0; k < 8; k++) {
      const u = k / 7, x = -58 + u * 108, y = 32 - u * 64;
      leaf(f, x, y, -1.15 - (k % 2) * .7, 14 + (k % 3) * 2, .6, k === 3 ? 1 : 0);
    }
    for (const flake of flakes) {
      const u = (flake.phase + q / TAU) % 1;
      dot(f, flake.x + Math.sin(q + flake.phase) * flake.drift, -74 + u * 142, flake.r, Math.sin(u * Math.PI) * .6, flake.tint);
    }
  }, { seed, ...options });
}
