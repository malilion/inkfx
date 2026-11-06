import { composite } from './compositor.js';

/** Shared browser/CLI atlas builder. No guides, labels, paper, or act actors by default. */
export function buildSheet(fx, { seed = 1, palette = 'songyan', fps = 30, columns = 8, paper = false, grain = 1 } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('seed must be a uint32');
  if (!Number.isFinite(fps) || fps <= 0 || fps > 120) throw new RangeError('fps must be > 0 and <= 120');
  if (!Number.isInteger(columns) || columns < 1 || columns > 32) throw new RangeError('columns must be 1..32');
  if (!Number.isFinite(grain) || grain < 0 || grain > 3) throw new RangeError('grain must be 0..3');
  const { meta, act } = fx, count = Math.ceil(meta.duration * fps), dt = meta.duration / count;
  columns = Math.min(columns, count);
  const w = columns * meta.w, h = Math.ceil(count / columns) * meta.h;
  if (count > 4096 || w > 16384 || h > 16384 || w * h > 64 * 1024 * 1024) throw new RangeError('Sprite sheet exceeds size limit');
  const data = new Uint8ClampedArray(w * h * 4), frames = {}, effect = fx.create({ seed, palette });
  for (let i = 0; i < count; i++) {
    if (i) effect.step(dt);
    const pixels = composite(effect.draw(), palette, { paper, grain });
    const x = i % columns * meta.w, y = Math.floor(i / columns) * meta.h;
    for (let row = 0; row < meta.h; row++) data.set(pixels.subarray(row * meta.w * 4, (row + 1) * meta.w * 4), ((y + row) * w + x) * 4);
    frames[`${meta.id}-${String(i).padStart(4, '0')}`] = {
      frame: { x, y, w: meta.w, h: meta.h }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: meta.w, h: meta.h }, sourceSize: { w: meta.w, h: meta.h },
      duration: dt * 1000,
    };
  }
  const atlas = { frames, meta: { app: 'inkfx', version: '1', image: 'sheet.png', format: 'RGBA8888',
    size: { w, h }, scale: '1', frameTags: [{ name: meta.id, from: 0, to: count - 1, direction: 'forward' }],
    inkfx: { id: meta.id, seed, palette, paper, grain, fps: 1 / dt, duration: meta.duration, loop: meta.loop,
      origin: { x: meta.ox, y: meta.oy }, simulationHz: 120,
      act: { ...act, timeOrigin: 'impact-relative', hits: act.hits.map(hit => ({ ...hit,
        displayT: act.windup + hit.t, frame: Math.min(count - 1, Math.floor((act.windup + hit.t) / dt)),
        freezeFrames: Math.round(hit.freeze / dt) })) } } } };
  return { w, h, data, atlas };
}
