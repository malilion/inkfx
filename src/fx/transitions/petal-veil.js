import { createPureEffect, rhythm, clamp } from '../../core/motifs.js';
export const meta = { id: 'petal-veil', name: '花帷', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(0.12, false);
const blooms = [[0, 0], [-76, -76], [76, -76], [-76, 76], [76, 76], [0, -84], [0, 84], [-84, 0], [84, 0]];
const minRadius = 16, radiusSpan = 150;
// Geometry is independent of time and seed. Share immutable lookup data across
// instances instead of doing nine atan2/cos/hypot calls per pixel every frame.
let geometry;
function geometryForPaper() {
  const key = `${meta.w}:${meta.h}:${meta.ox}:${meta.oy}`;
  if (geometry?.key === key) return geometry;
  const size = meta.w * meta.h, count = blooms.length;
  const distances = new Float64Array(size * count), reaches = new Float64Array(size * count);
  const veins = new Uint8Array(size * count), centers = new Float64Array(size);
  const offsets = new Uint32Array(size + 1);
  let end = 0;
  for (let y = 0; y < meta.h; y++) for (let x = 0; x < meta.w; x++) {
    const i = y * meta.w + x;
    centers[i] = Math.hypot(x - meta.ox, y - meta.oy);
    const candidates = blooms.map(([bx, by]) => {
      const dx = x - meta.ox - bx, dy = y - meta.oy - by;
      const angle = Math.atan2(dy, dx) * 5, vein = .5 + .5 * Math.cos(angle);
      return { d: Math.hypot(dx, dy), reach: .78 + .22 * Math.cos(angle + bx * .01),
        flags: (vein > .75 ? 1 : 0) | (vein > .8 ? 2 : 0) };
    }).sort((a, b) => a.d - b.d);
    let reach = 0;
    for (const c of candidates) {
      if (c.d >= minRadius + radiusSpan) break;
      // A nearer bloom with at least this reach always wins first.
      if (c.reach <= reach) continue;
      reach = c.reach;
      distances[end] = c.d; reaches[end] = c.reach; veins[end] = c.flags;
      end++;
    }
    offsets[i + 1] = end;
  }
  geometry = { key, distances: distances.slice(0, end), reaches: reaches.slice(0, end), veins: veins.slice(0, end), centers, offsets };
  return geometry;
}
export function create({ seed = 1, ...options } = {}) {
  const { distances, reaches, veins, centers, offsets } = geometryForPaper();
  return createPureEffect(meta, act, (f, t) => {
    const p = clamp((t + .1) / 1.05), radius = minRadius + p * radiusSpan;
    for (let i = 0; i < centers.length; i++) {
      let best = centers[i], flags = 0, hit = false;
      for (let j = offsets[i], end = offsets[i + 1]; j < end; j++) {
        if (distances[j] >= radius) break;
        if (distances[j] < radius * reaches[j]) {
          hit = true; best = distances[j]; flags = veins[j]; break;
        }
      }
      if (!hit && best > radius) continue;
      const shade = clamp(1 - best / radius);
      f.pigment[i] = Math.min(.94, .3 + shade * .48 + f.paperGrain[i] * .1 + (flags & 1 ? .08 : 0));
      f.wetness[i] = .05;
      f.tint[i] = flags & 2 ? 1 : 0;
    }
  }, { seed, ...options });
}
