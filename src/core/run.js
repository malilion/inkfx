import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createInkFrame } from './frame.js';
import { composite } from './compositor.js';
import { WET_DT } from './diffusion.js';

let imports = 0;
export async function loadFX(file) {
  const url = pathToFileURL(resolve(file));
  url.searchParams.set('run', String(++imports));
  const fx = await import(url.href);
  const m = fx.meta;
  if (!m || !/^[a-z][a-z0-9-]*$/.test(m.id) || typeof m.loop !== 'boolean' ||
      !Number.isFinite(m.duration) || m.duration <= 0 || m.duration > 60 ||
      !Number.isInteger(m.w) || !Number.isInteger(m.h) || m.w < 2 || m.h < 2 ||
      !Number.isFinite(m.ox) || !Number.isFinite(m.oy) || m.ox < 0 || m.ox >= m.w || m.oy < 0 || m.oy >= m.h ||
      typeof fx.create !== 'function') throw new Error('FX must export valid meta and create(opts)');
  return fx;
}

export function pixelStats({ w, h, data }) {
  let filled = 0, edge = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!data[(y * w + x) * 4 + 3]) continue;
    filled++;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge++;
  }
  return { fillRatio: filled / (w * h), edgeRatio: edge / (2 * w + 2 * h - 4) };
}

export function sampleFX(fx, { seed = 1, fps = 30, palette = 'songyan' } = {}) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('seed must be a uint32');
  if (!Number.isFinite(fps) || fps <= 0 || fps > 240) throw new RangeError('fps must be > 0 and <= 240');
  const { meta } = fx;
  const effect = fx.create({ seed, palette });
  if (effect.t !== 0 || typeof effect.step !== 'function' || typeof effect.draw !== 'function') {
    throw new Error('create must return {t:0, step(dt), draw(InkFrame)}');
  }
  const frame = createInkFrame(meta.w, meta.h, { ox: meta.ox, oy: meta.oy, seed });
  const hash = createHash('sha256');
  const frames = [];
  const steps = Math.ceil(meta.duration * fps), dt = meta.duration / steps;
  let maxPigment = 0, allOne = false, invalid = false;
  for (let index = 0; index <= steps; index++) {
    if (index) effect.step(dt);
    const time = index === steps ? meta.duration : index * dt;
    if (!Number.isFinite(effect.t) || Math.abs(effect.t - time) > 1e-8) throw new Error('step(dt) must advance t by dt');
    effect.draw(frame);
    let ones = 0;
    for (let i = 0; i < frame.pigment.length; i++) {
      const p = frame.pigment[i], wet = frame.wetness[i], grain = frame.paperGrain[i];
      invalid ||= !Number.isFinite(p) || p < 0 || p > 1 || !Number.isFinite(wet) || wet < 0 || wet > 1 ||
        !Number.isFinite(grain) || grain < 0 || grain > 1 || frame.tint[i] > 2;
      maxPigment = Math.max(maxPigment, p);
      if (p === 1) ones++;
    }
    allOne ||= ones === frame.pigment.length;
    const data = composite(frame, palette);
    for (const field of [frame.pigment, frame.wetness, frame.tint, frame.paperGrain, data]) {
      hash.update(new Uint8Array(field.buffer, field.byteOffset, field.byteLength));
    }
    frames.push({ index, time, ...pixelStats({ ...meta, data }), data });
  }
  return { meta, seed, fps, dt, simulationHz: 1 / WET_DT, frames, hash: hash.digest('hex'), maxPigment, allOne, invalid };
}

export async function withoutMathRandom(fn) {
  const original = Math.random;
  Math.random = () => { throw new Error('Math.random is forbidden; use mulberry32(seed)'); };
  try { return await fn(); } finally { Math.random = original; }
}
