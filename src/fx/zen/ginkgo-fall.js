import { createPureEffect, rhythm, path, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'ginkgo-fall', name: '銀杏', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  const leaves = Array.from({ length: 8 }, (_, i) => ({
    x: -56 + random() * 112, phase: random(), spin: (random() - .5) * 1.2, tint: i % 4 === 0 ? 1 : 0,
  }));
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    for (const leaf of leaves) {
      // Fade out at the phase wrap so the seam step matches any other step.
      const u = (leaf.phase + q / TAU) % 1, fade = Math.sin(u * Math.PI);
      if (fade < .02) continue;
      const x = leaf.x + Math.sin(q + leaf.phase) * 6, y = -66 + u * 124, spin = leaf.spin + Math.sin(q) * .25;
      for (let i = 0; i < 5; i++) {
        const ang = spin - .7 + i * .35;
        path(f, [[x, y], [x + Math.cos(ang) * 11, y + Math.sin(ang) * 11]], 1.45, fade * .7, i === 2 ? leaf.tint : 0);
      }
      path(f, [[x, y], [x, y + 7]], 1.15, fade * .55);
    }
  }, { seed, ...options });
}
