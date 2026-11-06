import { createInkFrame, clearInk } from './frame.js';
import { composite } from './compositor.js';
import { actionTime } from './act.js';

/** Stateless paint at a fixed 120 Hz time. Seeking and display FPS agree exactly. */
export function createPureEffect(meta, act, paint, { seed = 1, palette = 'songyan' } = {}) {
  const frame = createInkFrame(meta.w, meta.h, { ...meta, seed });
  let t = 0, painted = -1;
  function render() {
    const tick = Math.floor((t + 1e-10) * 120);
    if (painted !== tick) {
      clearInk(frame);
      const time = meta.loop ? (tick / 120) % meta.duration : Math.min(meta.duration, tick / 120);
      paint(frame, actionTime(act, time - act.windup));
      painted = tick;
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
      if (!target) return frame;
      if (target.w !== meta.w || target.h !== meta.h) throw new Error('draw target dimensions must match meta');
      if (target.pigment) for (const key of ['pigment', 'wetness', 'tint', 'paperGrain']) target[key].set(frame[key]);
      else if (target.data) target.data.set(composite(frame, palette));
      else throw new Error('draw expects InkFrame or RGBA frame');
      return target;
    },
  };
}
