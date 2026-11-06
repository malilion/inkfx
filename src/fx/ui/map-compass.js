import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'map-compass', name: '輿圖', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-56, -44], [56, -44], [56, 44], [-56, 44], [-56, -44]], 2.3, a);
    path(f, [[-44, -6], [-18, -22], [2, -4], [26, -16], [40, 6]], 2.1, a * g, 1);
    path(f, [[-28, 14], [-6, 4], [10, 18], [34, 8]], 1.25, a * .52);
    dot(f, 40, 6, 2.5, a, 1);
    ring(f, 13, 1.7, a, { x: -34, y: 22 });
    path(f, [[-34, 11], [-34, 33]], 1.25, a * .68, 1);
    path(f, [[-42, 22], [-26, 22]], 1.25, a * .68, 1);
    dot(f, -34, 22, 1.7, a, 2);
  }, { seed, ...options });
}
