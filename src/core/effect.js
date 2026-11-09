import { createInkFrame } from './frame.js';
import { stepWet, WET_DT } from './diffusion.js';
import { drawInto } from './compositor.js';
import { actionTime, hitStopAt } from './act.js';

/** Fixed-tick state shared by browser previews, CLI sampling, and direct consumers. */
export function createEffect(meta, act, paint, { seed = 1, palette = 'songyan' } = {}) {
  const frame = createInkFrame(meta.w, meta.h, { ox: meta.ox, oy: meta.oy, seed });
  let t = 0, tick = 0;
  paint(frame, -act.windup, -act.windup - WET_DT);
  return {
    frame,
    get t() { return t; },
    step(dt = WET_DT) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
      const target = Math.floor((t + 1e-10) / WET_DT);
      while (tick < target) {
        const display = ++tick * WET_DT - act.windup;
        if (hitStopAt(act, display)) continue;
        const time = actionTime(act, display);
        const previous = actionTime(act, display - WET_DT);
        // Residual pigment settles after the gesture. Wet ink continues to bleed.
        if (time > 0.035) for (let i = 0; i < frame.pigment.length; i++) frame.pigment[i] *= 0.993;
        paint(frame, time, previous);
        stepWet(frame);
      }
      return frame;
    },
    draw(target) {
      return target ? drawInto(frame, target, palette) : frame;
    },
  };
}
