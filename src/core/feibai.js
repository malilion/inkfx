/** Deposit a round brush dab. Grain rejects dry pigment, leaving actual holes. */
export function stamp(frame, x, y, radius, { pigment = 0.7, wetness = 0.15, dryFactor = 1.4, tint = 0 } = {}) {
  if (!(radius > 0)) return;
  const { w, h, paperGrain } = frame;
  // Canvas-scale deltas need no hypot rescaling. Retain it for extreme radii
  // where squaring can underflow or overflow.
  const fastDistance = radius >= 1e-150 && radius <= 1e150;
  for (let py = Math.max(0, Math.floor(y - radius)); py <= Math.min(h - 1, Math.ceil(y + radius)); py++) {
    for (let px = Math.max(0, Math.floor(x - radius)); px <= Math.min(w - 1, Math.ceil(x + radius)); px++) {
      const dx = px - x, dy = py - y;
      const distance = (fastDistance ? Math.sqrt(dx * dx + dy * dy) : Math.hypot(dx, dy)) / radius;
      if (distance >= 1) continue;
      const i = py * w + px;
      const input = pigment * Math.min(1, (1 - distance) * 3);
      if (input + wetness <= paperGrain[i] * dryFactor) continue;
      frame.pigment[i] = Math.min(1, frame.pigment[i] + input * (1 - frame.pigment[i]));
      frame.wetness[i] = Math.min(1, Math.max(frame.wetness[i], wetness));
      if (tint || frame.pigment[i] === input) frame.tint[i] = tint;
    }
  }
}
export { stamp as dryBrushStamp };
