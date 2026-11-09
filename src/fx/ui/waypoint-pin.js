import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'waypoint-pin', name: '地標', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    ring(f, 16 * Math.max(g, .2), 3.4, a, { y: -24 });
    path(f, [[-12, -12], [0, 18], [12, -12]], 2.6, a, 1);
    dot(f, 0, -24, 4, a, 2);
    path(f, [[-22, -46], [22, -46], [22, -32], [-22, -32], [-22, -46]], 1.6, a * .8);
    path(f, [[-14, -42], [12, -42]], 1.2, a * .5);
    for (let k = 0; k < 2; k++) ring(f, (10 + k * 16) * g, 1.5, a * (1 - k * .3), { y: 36, squash: .35 });
  }, { seed, ...options });
}
