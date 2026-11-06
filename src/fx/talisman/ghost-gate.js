import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'ghost-gate', name: '鬼門', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    for (const s of [-1, 1]) path(f, [[s * 30, 44], [s * 30, -26 * g]], 4, a);
    path(f, [[-46, -28 * g], [-16, -36 * g], [16, -36 * g], [46, -28 * g]], 3.2, a, 1);
    path(f, [[-34, -10 * g], [34, -10 * g]], 2.4, a);
    for (let k = -2; k <= 2; k++) path(f, [[k * 11, -10 * g], [k * 11, 2 * g]], 1.15, a * .55);
    ring(f, 8, 2.2, a, { y: 10, tint: 1 });
    dot(f, 0, 10, 2.1, a, 1);
  }, { seed, ...options });
}
