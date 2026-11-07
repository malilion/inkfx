/** Deposit a round brush dab. Grain rejects dry pigment, leaving actual holes. */
export function stamp(frame, x, y, radius, { pigment = 0.7, wetness = 0.15, dryFactor = 1.4, tint = 0 } = {}) {
  if (!(radius > 0)) return;
  const { w, h, paperGrain, pigment: values, wetness: water, tint: types } = frame;
  // Canvas-scale deltas need no hypot rescaling. Retain it for extreme radii
  // where squaring can underflow or overflow.
  const fastDistance = radius >= 1e-150 && radius <= 1e150;
  const outer = radius * radius, flat = outer * .43;
  const x0 = Math.max(0, Math.ceil(x - radius)), x1 = Math.min(w - 1, Math.floor(x + radius));
  const y0 = Math.max(0, Math.ceil(y - radius)), y1 = Math.min(h - 1, Math.floor(y + radius));
  for (let py = y0; py <= y1; py++) {
    const dy = py - y, dy2 = dy * dy, row = py * w;
    for (let px = x0; px <= x1; px++) {
      const dx = px - x;
      const squared = dx * dx + dy2;
      if (fastDistance && squared > outer) continue;
      let falloff = 1;
      // Falloff is already saturated well inside the dab.
      if (!fastDistance || squared > flat) {
        const distance = (fastDistance ? Math.sqrt(squared) : Math.hypot(dx, dy)) / radius;
        if (distance >= 1) continue;
        falloff = Math.min(1, (1 - distance) * 3);
      }
      const i = row + px;
      const input = pigment * falloff;
      if (input + wetness <= paperGrain[i] * dryFactor) continue;
      values[i] = Math.min(1, values[i] + input * (1 - values[i]));
      water[i] = Math.min(1, Math.max(water[i], wetness));
      if (tint || values[i] === input) types[i] = tint;
    }
  }
}
export { stamp as dryBrushStamp };
