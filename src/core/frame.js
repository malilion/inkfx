import { valueNoise } from './seed.js';

/** @typedef {{w:number,h:number,ox:number,oy:number,pigment:Float32Array,tint:Uint8Array,wetness:Float32Array,paperGrain:Float32Array}} InkFrame */
export function createInkFrame(w = 224, h = w, { ox = w / 2, oy = h / 2, seed = 1 } = {}) {
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 2 || h < 2 ||
      !Number.isFinite(ox) || !Number.isFinite(oy) || ox < 0 || ox >= w || oy < 0 || oy >= h) {
    throw new RangeError('Invalid InkFrame dimensions or origin');
  }
  const size = w * h;
  const frame = { w, h, ox, oy, pigment: new Float32Array(size), tint: new Uint8Array(size),
    wetness: new Float32Array(size), paperGrain: new Float32Array(size) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // Stretched fine noise produces paper fibres; coarse noise produces uneven sizing.
    frame.paperGrain[y * w + x] = 0.08 + 0.92 * (
      0.65 * valueNoise(x / 1.8, y / 0.65, seed) + 0.35 * valueNoise(x / 11, y / 9, seed ^ 0x93));
  }
  return frame;
}

export function clearInk(frame) {
  frame.pigment.fill(0);
  frame.tint.fill(0);
  frame.wetness.fill(0);
  return frame;
}
