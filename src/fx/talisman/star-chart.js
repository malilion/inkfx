import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'star-chart', name: '星斗', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
const bowl = [[-28, -16], [-6, -28], [14, -12], [-4, 4]];
const handle = [[-4, 4], [-18, 20], [-6, 36], [16, 42]];
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const at = points => points.map(([x, y]) => [x * g, y * g]);
    path(f, at([...bowl, bowl[0]]), 1.6, a);
    path(f, at(handle), 1.6, a, 1);
    for (const [x, y] of [...bowl, ...handle.slice(1)]) dot(f, x * g, y * g, 2.3, a, 1);
    ring(f, 66 * g, 1.15, a * .35);
  }, { seed, ...options });
}
