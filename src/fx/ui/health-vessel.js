import { createPureEffect, rhythm, envelope, path, dot, easeOut } from '../../core/motifs.js';
export const meta = { id: 'health-vessel', name: '氣盞', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, true);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    path(f, [[-22, 40], [-26, 12], [-12, 0], [-10, -32], [10, -32], [12, 0], [26, 12], [22, 40], [-22, 40]], 2.6, a);
    path(f, [[-14, -40], [14, -40]], 2.2, a, 1);
    path(f, [[-8, -40], [-8, -48], [8, -48], [8, -40]], 1.6, a);
    const surface = 32 - g * 58;
    for (let i = 0; i < 7; i++) {
      const y = 30 - i * 8;
      if (y < surface) continue;
      const half = y > 8 ? 16 : y > -2 ? 10 : 7;
      path(f, [[-half, y], [half, y]], 2.4, a * .8, 1);
    }
    dot(f, 0, surface, 2, a, 2);
  }, { seed, ...options });
}
