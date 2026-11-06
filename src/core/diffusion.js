export const WET_DT = 1 / 120;
const scratch = new WeakMap();

/** One simultaneous 120 Hz four-neighbour transport step; no directional bias. */
export function stepWet(frame, { threshold = 0.12, bleed = 0.11, fringe = 0.045, evaporation = 0.992 } = {}) {
  let buffers = scratch.get(frame);
  if (!buffers) {
    buffers = [new Float32Array(frame.w * frame.h), new Float32Array(frame.w * frame.h), new Uint8Array(frame.w * frame.h)];
    scratch.set(frame, buffers);
  }
  const [nextP, nextW, nextT] = buffers;
  const { w, h, pigment: p, wetness: wet, tint } = frame;
  nextP.set(p); nextW.set(wet); nextT.set(tint);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (wet[i] <= threshold) continue;
    const neighbors = [x > 0 ? i - 1 : -1, x + 1 < w ? i + 1 : -1,
      y > 0 ? i - w : -1, y + 1 < h ? i + w : -1];
    for (const j of neighbors) {
      if (j < 0) continue;
      const flux = Math.max(0, p[i] - p[j]) * wet[i] * bleed * 0.25;
      // A wet/dry boundary traps a fraction of transported pigment at the rim.
      const boundary = wet[j] < threshold ? fringe : 0;
      const transfer = flux * (1 + boundary);
      nextP[i] -= transfer; nextP[j] += transfer;
      nextW[j] += Math.max(0, wet[i] - wet[j]) * 0.045;
      nextW[i] -= Math.max(0, wet[i] - wet[j]) * 0.045;
      if (transfer > p[j] * 0.1) nextT[j] = tint[i];
    }
  }
  for (let i = 0; i < p.length; i++) {
    p[i] = Math.max(0, Math.min(1, nextP[i]));
    wet[i] = Math.max(0, Math.min(1, nextW[i] * evaporation));
    tint[i] = nextT[i];
  }
  return frame;
}
export { stepWet as diffuse };
