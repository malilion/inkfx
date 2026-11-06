import { createPureEffect, rhythm, path, ring, dot, TAU } from '../../core/motifs.js';
export const meta = { id: 'koi-circle', name: '錦鯉', category: 'zen', duration: 2.4,
  loop: true, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const q = t / meta.duration * TAU;
    ring(f, 64, 1.2, .26 + Math.cos(q) * .04, { squash: .7 });
    for (let k = 0; k < 2; k++) {
      const phase = q * (k ? -1 : 1) + k * 1.2, orbit = 40 - k * 8;
      const body = Array.from({ length: 14 }, (_, i) => {
        const u = i / 13, a = phase - u * .65;
        return [Math.cos(a) * (orbit - u * 6), Math.sin(a) * (orbit - u * 6) * .7];
      });
      path(f, body, 3.8 - k * .6, .74, k);
      const tailA = phase - .65, tx = Math.cos(tailA) * (orbit - 6), ty = Math.sin(tailA) * (orbit - 6) * .7;
      const flick = Math.sin(q * 2 + k) * .4;
      path(f, [[tx, ty],
        [tx - Math.cos(tailA + flick) * 11, ty - Math.sin(tailA + flick) * 8],
        [tx - Math.cos(tailA - flick) * 11, ty - Math.sin(tailA - flick) * 8]], 1.5, .55, k);
      dot(f, Math.cos(phase) * orbit, Math.sin(phase) * orbit * .7, 1.5, .85, 1);
    }
  }, { seed, ...options });
}
