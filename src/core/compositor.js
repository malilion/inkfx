import { getPalette } from '../palettes/index.js';
const levels = [0, 0.07, 0.22, 0.45, 0.73, 1];
const cache = new WeakMap();
export const hexRGB = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Transparent output by default; paper=true bakes in the seeded rice paper. */
export function composite(frame, palette = 'songyan', { paper = false, grain = 1 } = {}) {
  if (typeof palette === 'string') palette = getPalette(palette);
  let colors = cache.get(palette);
  if (!colors) {
    colors = { stops: palette.stops.map(hexRGB), accent: hexRGB(palette.accent), highlight: hexRGB(palette.highlight) };
    cache.set(palette, colors);
  }
  const data = new Uint8ClampedArray(frame.w * frame.h * 4);
  for (let i = 0; i < frame.pigment.length; i++) {
    const p = Math.max(0, Math.min(1, frame.pigment[i]));
    const offset = i * 4;
    if (p === 0 && frame.tint[i] === 0) {
      const noise = paper ? (frame.paperGrain[i] - 0.5) * 7 * grain : 0;
      data[offset] = colors.stops[0][0] - noise;
      data[offset + 1] = colors.stops[0][1] - noise;
      data[offset + 2] = colors.stops[0][2] - noise;
      data[offset + 3] = paper ? 255 : 0;
      continue;
    }
    let stop = 0;
    while (stop < 4 && p > levels[stop + 1]) stop++;
    const fraction = (p - levels[stop]) / (levels[stop + 1] - levels[stop]);
    const accent = frame.tint[i] === 1 ? colors.accent : frame.tint[i] === 2 ? colors.highlight : null;
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
      r = r * alpha + (colors.stops[0][0] - noise) * (1 - alpha);
      g = g * alpha + (colors.stops[0][1] - noise) * (1 - alpha);
      b = b * alpha + (colors.stops[0][2] - noise) * (1 - alpha);
    }
    data[offset] = r; data[offset + 1] = g; data[offset + 2] = b;
    data[offset + 3] = paper ? 255 : Math.round(alpha * 255);
  }
  return data;
}
export { composite as compositeInk };
