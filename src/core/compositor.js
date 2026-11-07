import { getPalette } from '../palettes/index.js';
const levels = [0, 0.07, 0.22, 0.45, 0.73, 1];
const cache = new WeakMap();
export const hexRGB = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Transparent output by default. Pass a same-size RGBA target to reuse its storage. */
export function composite(frame, palette = 'songyan', { paper = false, grain = 1 } = {}, target) {
  if (typeof palette === 'string') palette = getPalette(palette);
  let colors = cache.get(palette);
  if (!colors) {
    colors = { stops: palette.stops.map(hexRGB), accent: hexRGB(palette.accent), highlight: hexRGB(palette.highlight) };
    colors.clear = new Uint32Array(Uint8ClampedArray.of(...colors.stops[0], 0).buffer)[0];
    cache.set(palette, colors);
  }
  const size = frame.w * frame.h * 4;
  const data = target ?? new Uint8ClampedArray(size);
  if (target != null && (!(data instanceof Uint8ClampedArray) || data.length !== size)) throw new RangeError('RGBA target must match frame size');
  const packed = paper || data.byteOffset % 4 ? null : new Uint32Array(data.buffer, data.byteOffset, size / 4);
  const [paperR, paperG, paperB] = colors.stops[0];
  const finitePaper = Number.isFinite(paperR + paperG + paperB);
  for (let i = 0; i < frame.pigment.length; i++) {
    const raw = frame.pigment[i], tint = frame.tint[i];
    const offset = i * 4;
    if (raw <= 0 && tint === 0) {
      if (packed) packed[i] = colors.clear;
      else {
        const noise = paper ? (frame.paperGrain[i] - 0.5) * 7 * grain : 0;
        data[offset] = paperR - noise;
        data[offset + 1] = paperG - noise;
        data[offset + 2] = paperB - noise;
        data[offset + 3] = paper ? 255 : 0;
      }
      continue;
    }
    const p = Math.max(0, Math.min(1, raw));
    const stop = p > levels[4] ? 4 : p > levels[3] ? 3 : p > levels[2] ? 2 : p > levels[1] ? 1 : 0;
    const fraction = (p - levels[stop]) / (levels[stop + 1] - levels[stop]);
    const accent = tint === 1 ? colors.accent : tint === 2 ? colors.highlight : null;
    const alpha = p < 0.004 ? 0 : Math.min(1, p * 3.5);
    const low = colors.stops[stop], high = colors.stops[stop + 1];
    let r = low[0] + (high[0] - low[0]) * fraction;
    let g = low[1] + (high[1] - low[1]) * fraction;
    let b = low[2] + (high[2] - low[2]) * fraction;
    if (accent) {
      r = r * 0.15 + accent[0] * 0.85;
      g = g * 0.15 + accent[1] * 0.85;
      b = b * 0.15 + accent[2] * 0.85;
    }
    if (paper) {
      const noise = (frame.paperGrain[i] - 0.5) * 7 * grain;
      if (alpha !== 1 || !finitePaper || !Number.isFinite(noise)) {
        r = r * alpha + (paperR - noise) * (1 - alpha);
        g = g * alpha + (paperG - noise) * (1 - alpha);
        b = b * alpha + (paperB - noise) * (1 - alpha);
      }
    }
    data[offset] = r; data[offset + 1] = g; data[offset + 2] = b;
    data[offset + 3] = paper ? 255 : Math.round(alpha * 255);
  }
  return data;
}

/** Copy channels or render transparent RGBA into a caller-owned frame. */
export function drawInto(frame, target, palette) {
  if ((target.w ?? target.width) !== frame.w || (target.h ?? target.height) !== frame.h) {
    throw new Error('draw target dimensions must match meta');
  }
  if (target.pigment) {
    for (const key of ['pigment', 'wetness', 'tint', 'paperGrain']) target[key].set(frame[key]);
  } else if (target.data) {
    const data = target.data;
    if (data instanceof Uint8ClampedArray && data.length === frame.pigment.length * 4) composite(frame, palette, {}, data);
    else data.set(composite(frame, palette));
  } else throw new Error('draw expects InkFrame or RGBA frame');
  return target;
}
export { composite as compositeInk };
