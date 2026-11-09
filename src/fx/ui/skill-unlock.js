import { createPureEffect, rhythm, envelope, ring, dot, path, easeOut, clamp, TAU } from '../../core/motifs.js';
export const meta = { id: 'skill-unlock', name: '心法頓悟', category: 'ui', duration: 1.3,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(.12, false);
// A lotus opens inside a written ring while gilded rays announce the newly learned art.
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const a = envelope(t, .09, 1.1), g = easeOut((t + 1 / 120) / .14), bloom = easeOut(clamp(t / .35));
    ring(f, 54, 2.4, a * .85, { start: -Math.PI / 2, end: -Math.PI / 2 + TAU * g });
    ring(f, 46, 1.2, a * .7, { tint: 2, start: Math.PI / 2, end: Math.PI / 2 + TAU * g });
    for (let k = 0; k < 8; k++) {
      const angle = -Math.PI / 2 + k * TAU / 8;
      const length = (k % 2 ? 20 : 30) * (.35 + .65 * bloom), c = Math.cos(angle), s = Math.sin(angle);
      path(f, [[c * 5, s * 5], [c * length, s * length]], k % 2 ? 4.5 : 6.5, a * (k % 2 ? .55 : .85), k % 2 ? 0 : 1);
    }
    dot(f, 0, 0, 4 + 2 * bloom, a, 1);
    const burst = easeOut(clamp(t / .45));
    for (let k = 0; k < 16; k++) {
      const angle = k * TAU / 16 + TAU / 32, r0 = 62 + 14 * burst, length = (k % 2 ? 6 : 11) * (1 - .5 * burst);
      path(f, [[Math.cos(angle) * r0, Math.sin(angle) * r0], [Math.cos(angle) * (r0 + length), Math.sin(angle) * (r0 + length)]],
        1.5, a * (1 - .55 * burst), 2);
    }
  }, { seed, ...options });
}
