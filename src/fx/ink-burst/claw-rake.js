import { createPureEffect, rhythm, envelope, ring, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'claw-rake', name: '爪裂', category: 'ink-burst', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (let k = 0; k < 3; k++) {
      const y = -30 + k * 28;
      ring(f, 62, 4.2 - k * .5, a, { y, start: -2.55, end: -2.55 + g * 2.15, squash: .32 });
      path(f, [[-52, y - 4], [-20, y + 2], [18 * g, y - 2]], 1.2, a * .35, 1);
    }
  }, { seed, ...options });
}
