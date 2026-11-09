import { stamp } from './feibai.js';
import { stroke, clamp, easeOut } from './brush.js';
export { stamp, stroke, clamp, easeOut };
export { mulberry32 } from './seed.js';
export { createPureEffect } from './pure.js';

export const TAU = Math.PI * 2;
export const rhythm = (windup = .12, hit = false) => ({ windup,
  poses: [[-windup, 'gather', 'easeOut'], [0, 'release', 'snap'], [.2, 'settle', 'easeOut']],
  hits: hit ? [{ t: .04, freeze: .14, shakeAmp: 3, inkSplash: 24 }] : [], recovery: .55 });
export function envelope(t, attack = .09, end = .95) {
  return t < 0 ? 0 : easeOut((t + 1 / 120) / attack) * clamp((end - t) / .5);
}
/** Local-coordinate calligraphic line with tapered ends and paper channels. */
export function path(f, points, width = 3, alpha = .7, tint = 0) {
  if (alpha <= 0) return;
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const strength = Math.min(1, alpha / .7);
  const brush = { pigment: alpha, wetness: .04 * strength, dryFactor: 1.1 * strength, tint };
  let traveled = 0;
  for (let i = 1; i < points.length; i++) {
    const start = points[i - 1], end = points[i], length = lengths[i - 1], steps = Math.max(1, Math.ceil(length * 1.8));
    for (let j = 0; j <= steps; j++) {
      const v = j / steps, u = (traveled + length * v) / total;
      stamp(f, f.ox + start[0] + (end[0] - start[0]) * v, f.oy + start[1] + (end[1] - start[1]) * v,
        width * (.18 + .82 * Math.sin(Math.PI * u)), brush);
    }
    traveled += length;
  }
}
export function ring(f, r, width, alpha, { x = 0, y = 0, start = 0, end = TAU, tint = 0, squash = 1 } = {}) {
  const points = Array.from({ length: 81 }, (_, i) => {
    const a = start + (end - start) * i / 80;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r * squash];
  });
  path(f, points, width, alpha, tint);
}
export function leaf(f, x, y, angle, size, alpha, tint = 0) {
  const points = Array.from({ length: 17 }, (_, i) => {
    const u = i / 16, a = angle + Math.sin(u * Math.PI) * .2;
    return [x + Math.cos(a) * size * u, y + Math.sin(a) * size * u];
  });
  path(f, points, size * .16, alpha, tint);
}
export function dot(f, x, y, r, alpha, tint = 0) {
  stamp(f, f.ox + x, f.oy + y, r, { pigment: alpha, wetness: .22, dryFactor: .5, tint });
}
