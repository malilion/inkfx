import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'speech-scroll', name: '言卷', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-48, -26], [36, -26], [50, -12], [50, 14], [36, 26], [-48, 26], [-60, 12], [-60, -12], [-48, -26]], 2.4, a);
    path(f, [[28, 16], [48, 36], [22, 20]], 2.2, a, 1);
    for (let k = 0; k < 3; k++) path(f, [[-40, -12 + k * 12], [(-40 + (28 + k * 8) * g), -12 + k * 12]], 1.8, a * .65);
  }, { seed, ...options });
}
