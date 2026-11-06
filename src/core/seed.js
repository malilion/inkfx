export function mulberry32(seed = 1) {
  let state = seed >>> 0;
  return () => {
    let t = state = (state + 0x6d2b79f5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2d(x, y, seed = 1) {
  let h = Math.imul(x | 0, 0x1f123bb5) ^ Math.imul(y | 0, 0x5f356495) ^ (seed >>> 0);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function valueNoise(x, y, seed = 1) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const smooth = t => t * t * (3 - 2 * t);
  const u = smooth(x - ix), v = smooth(y - iy);
  const mix = (a, b, t) => a + (b - a) * t;
  return mix(mix(hash2d(ix, iy, seed), hash2d(ix + 1, iy, seed), u),
    mix(hash2d(ix, iy + 1, seed), hash2d(ix + 1, iy + 1, seed), u), v);
}
