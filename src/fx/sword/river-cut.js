import { createPureEffect, rhythm, envelope, path, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'river-cut', name: '斷流', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t), crest = -70 + 136 * g;
    path(f, [[-70, 16], [crest, 16]], 4.4, a);
    path(f, [[-60, 28], [60, 28]], 1.35, a * .4);
    path(f, [[crest - 16, 16], [crest - 4, 2], [crest + 6, -12], [crest + 14, -4]], 2.1, a, 1);
    ring(f, 9 * g, 1.25, a * .48, { x: crest * .28, y: 36, squash: .32 });
  }, { seed, ...options });
}
