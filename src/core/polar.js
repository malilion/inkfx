/** Cache one seed-independent polar grid per effect, shared by replay instances. */
export function polarLookup(angleOf, withRadius = true) {
  let dimensions, grid;
  return (w, h, ox, oy) => {
    if (dimensions && w === dimensions.w && h === dimensions.h && ox === dimensions.ox && oy === dimensions.oy) return grid;
    const radius = withRadius && new Float64Array(w * h), angle = angleOf && new Float64Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - ox, dy = y - oy, i = y * w + x;
      if (radius) radius[i] = Math.hypot(dx, dy);
      if (angle) angle[i] = angleOf(dy, dx);
    }
    dimensions = { w, h, ox, oy };
    return grid = { radius, angle };
  };
}
