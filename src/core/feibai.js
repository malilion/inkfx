/** Deposit a round brush dab. Grain rejects dry pigment, leaving actual holes. */
export function stamp(frame, x, y, radius, { pigment = 0.7, wetness = 0.15, dryFactor = 1.4, tint = 0 } = {}) {
  if (!(radius > 0)) return;
  const { w, h, paperGrain, pigment: values, wetness: water, tint: types } = frame;
  // Canvas-scale deltas need no hypot rescaling. Retain it for extreme radii
  // where squaring can underflow or overflow.
  const fastDistance = radius >= 1e-150 && radius <= 1e150;
  const x0 = Math.max(0, Math.floor(x - radius)), x1 = Math.min(w - 1, Math.ceil(x + radius));
  const y0 = Math.max(0, Math.floor(y - radius)), y1 = Math.min(h - 1, Math.ceil(y + radius));
  for (let py = y0; py <= y1; py++) {
    const dy = py - y, dy2 = dy * dy;
    for (let px = x0; px <= x1; px++) {
      const dx = px - x;
      const distance = (fastDistance ? Math.sqrt(dx * dx + dy2) : Math.hypot(dx, dy)) / radius;
      if (distance >= 1) continue;
      const i = py * w + px;
      const input = pigment * Math.min(1, (1 - distance) * 3);
      if (input + wetness <= paperGrain[i] * dryFactor) continue;
      values[i] = Math.min(1, values[i] + input * (1 - values[i]));
      water[i] = Math.min(1, Math.max(water[i], wetness));
      if (tint || values[i] === input) types[i] = tint;
    }
  }
}
export { stamp as dryBrushStamp };
