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
    let stop = 0;
    while (stop < 4 && p > levels[stop + 1]) stop++;
    const fraction = (p - levels[stop]) / (levels[stop + 1] - levels[stop]);
    const accent = frame.tint[i] === 1 ? colors.accent : frame.tint[i] === 2 ? colors.highlight : null;
    const alpha = p < 0.004 ? 0 : Math.min(1, p * 3.5);
    for (let channel = 0; channel < 3; channel++) {
      const ramp = colors.stops[stop][channel] + (colors.stops[stop + 1][channel] - colors.stops[stop][channel]) * fraction;
      const ink = accent ? ramp * 0.15 + accent[channel] * 0.85 : ramp;
      const background = colors.stops[0][channel] - (frame.paperGrain[i] - 0.5) * 7 * grain;
      data[offset + channel] = paper ? ink * alpha + background * (1 - alpha) : ink;
    }
    data[offset + 3] = paper ? 255 : Math.round(alpha * 255);
  }
  return data;
}
export { composite as compositeInk };
