import { createInkFrame, clearInk } from './frame.js';
import { drawInto } from './compositor.js';
import { actionTime } from './act.js';

/** Stateless paint at a fixed 120 Hz time. Seeking and display FPS agree exactly. */
export function createPureEffect(meta, act, paint, { seed = 1, palette = 'songyan' } = {}) {
  const frame = createInkFrame(meta.w, meta.h, { ...meta, seed });
  let t = 0, paintedTick = -1, paintedTime;
  function render() {
    const tick = Math.floor((t + 1e-10) * 120);
    if (paintedTick !== tick) {
      const time = meta.loop ? (tick / 120) % meta.duration : Math.min(meta.duration, tick / 120);
      const action = actionTime(act, time - act.windup);
      if (paintedTime !== action) {
        clearInk(frame);
        paint(frame, action);
        paintedTime = action;
      }
      paintedTick = tick;
    }
    return frame;
  }
  return {
    get t() { return t; },
    get frame() { return render(); },
    step(dt = 1 / 120) {
      if (!Number.isFinite(dt) || dt < 0) throw new RangeError('dt must be finite and nonnegative');
      t += dt;
    },
    draw(target) {
      render();
      return target ? drawInto(frame, target, palette) : frame;
    },
  };
}
