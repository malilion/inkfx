import { createPureEffect, rhythm, envelope, path, leaf, easeOut } from '../../core/motifs.js';
export const meta = { id: 'startled-swan', name: '驚鴻照影', category: 'sword', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, Array.from({ length: 36 }, (_, i) => {
      const u = i / 35 * g;
      return [-72 + u * 144, 34 - Math.sin(u * Math.PI) * 64];
    }), 4.6, a);
    const crest = Math.min(1, g * 1.4);
    path(f, [[-8, -22 * crest], [22 * crest, -48 * crest], [48 * crest, -16]], 2.4, a * .8, 1);
    path(f, [[6, -18], [30 * crest, -8], [42 * crest, -28]], 1.5, a * .45);
    for (let k = 0; k < 4; k++) leaf(f, -40 + k * 22 * g, 18 - k * 6, .8 + k * .15, 12, a * .5);
  }, { seed, ...options });
}
