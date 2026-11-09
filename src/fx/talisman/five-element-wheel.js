import { createPureEffect, rhythm, envelope, path, ring, dot, easeOut, clamp, TAU } from '../../core/motifs.js';
export const meta = { id: 'five-element-wheel', name: '五行輪轉', category: 'talisman', duration: 1.25,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(.14, true);
// Draws a prefix of a polyline by arc length, so the star is written in one continuous stroke.
function partial(points, p) {
  const lengths = points.slice(1).map((q, i) => Math.hypot(q[0] - points[i][0], q[1] - points[i][1]));
  let budget = lengths.reduce((a, b) => a + b, 0) * clamp(p);
  const out = [points[0]];
  for (let i = 1; i < points.length && budget > 0; i++) {
    const k = Math.min(1, budget / lengths[i - 1]), a = points[i - 1], b = points[i];
    out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    budget -= lengths[i - 1];
  }
  return out;
}
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const a = envelope(t), g = easeOut((t + 1 / 120) / .16), spin = -Math.PI / 2 + Math.max(0, t) * .35;
    const vertex = (k, r) => [Math.cos(spin + k * TAU / 5) * r, Math.sin(spin + k * TAU / 5) * r];
    ring(f, 70, 2.6, a * .85, { start: spin, end: spin + TAU * g });
    ring(f, 78, 1.1, a * .5, { start: spin + 1, end: spin + 1 - TAU * g });
    const star = [0, 2, 4, 1, 3, 0].map(k => vertex(k, 58));
    const drawn = partial(star, g);
    if (drawn.length > 1) path(f, drawn, 3.2, a, 1);
    // One small seal per element, stamped as the star passes its vertex.
    for (let k = 0; k < 5; k++) {
      const order = [0, 3, 1, 4, 2][k], shown = clamp((g * 5 - order) * 1.5);
      if (!shown) continue;
      const [x, y] = vertex(k, 70);
      ring(f, 9 * shown, 1.6, a * .9, { x, y });
      dot(f, x, y, 2.2 * shown, a * .8, k === 0 ? 1 : 0);
    }
    ring(f, 18 * g, 1.4, a * .6, { start: -spin, end: -spin + TAU * g });
  }, { seed, ...options });
}
