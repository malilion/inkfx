import { createPureEffect, rhythm, envelope, path, leaf, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'spirit-lantern', name: '魂燈', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[0, -74], [0, -50]], 1.3, a * .65);
    path(f, [[-30, -48], [0, -64], [30, -48], [-30, -48]], 2.6, a, 1);
    path(f, [[-22, -46], [22, -46], [16, 30], [-16, 30], [-22, -46]], 2.3, a);
    path(f, [[-8, -6], [8, -6], [0, 6], [-7, 16], [7, 18]], 1.7, a, 1);
    leaf(f, 0, -10, -Math.PI / 2, 18 * g, a * .85, 2);
    dot(f, 0, -4, 2.2, a, 2);
    path(f, [[0, 30], [0, 52]], 1.5, a * .7);
    path(f, [[0, 48], [-10, 62]], 1.3, a * .6);
    path(f, [[0, 48], [10, 62]], 1.3, a * .6);
  }, { seed, ...options });
}
