import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { effects, categoryCounts } from '../src/fx/index.js';
import { composite } from '../src/core/compositor.js';
import { drawText } from '../src/core/overlay.js';
import { isMain, parseArgs, numberOption } from './cli.mjs';

/** Optional offline presentation encoder. ffmpeg is a development tool only. */
export async function renderDemo({ out = 'artifacts/inkfx-demo.mp4', fps = 60, seconds = 4, seed = 42 } = {}) {
  if (!Number.isInteger(fps) || fps < 1 || fps > 60 || !Number.isFinite(seconds) || seconds < 1 || seconds > 30 ||
      !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new RangeError('fps: 1..60; seconds: 1..30; seed: uint32');
  const selected = Object.keys(categoryCounts).flatMap(category => {
    const group = effects.filter(fx => fx.meta.category === category);
    if (category === 'sword') group.unshift(group.splice(group.findIndex(fx => fx.meta.id === 'sword-qi-slash'), 1)[0]);
    return group.slice(0, 4);
  });
  const columns = 6, cellW = 224, cellH = 246, header = 40;
  const w = columns * cellW, h = Math.ceil(selected.length / columns) * cellH + header;
  const count = Math.ceil(seconds * fps), palettes = ['songyan', 'zhusha', 'shiqing', 'nijin'];
  const instances = selected.map(entry => entry.create({ seed }));
  const output = resolve(out); await mkdir(dirname(output), { recursive: true });
  const encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pixel_format', 'rgba',
    '-video_size', `${w}x${h}`, '-framerate', String(fps), '-i', 'pipe:0', '-an', '-vf', 'scale=-2:720',
    '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '22', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);
  let errors = '';
  encoder.stderr.on('data', chunk => { errors = (errors + chunk).slice(-8192); });
  const closed = new Promise((resolve, reject) => {
    encoder.once('error', error => reject(new Error(`ffmpeg is required for demo export: ${error.message}`)));
    encoder.once('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${errors}`)));
  });
  async function* frames() {
    for (let index = 0; index < count; index++) {
      const data = new Uint8ClampedArray(w * h * 4), surface = { w, h, data };
      for (let i = 0; i < w * h; i++) data.set([244, 239, 230, 255], i * 4);
      drawText(surface, 'INKFX / 120 GESTURES / FOUR MINERAL PALETTES', 18, 14, [40, 48, 38, 255], 2);
      for (const [cell, entry] of selected.entries()) {
        let instance = instances[cell];
        if (index) {
          if (!entry.meta.loop && instance.t >= entry.meta.duration + .25) instance = instances[cell] = entry.create({ seed });
          instance.step(1 / fps);
        }
        const pixels = composite(instance.frame, palettes[cell % palettes.length], { paper: true });
        const x = cell % columns * cellW, y = Math.floor(cell / columns) * cellH + header;
        for (let row = 0; row < entry.meta.h; row++) data.set(pixels.subarray(row * entry.meta.w * 4, (row + 1) * entry.meta.w * 4), ((y + row) * w + x) * 4);
        drawText(surface, entry.meta.id.toUpperCase(), x + 8, y + 230, [40, 48, 38, 255]);
      }
      yield Buffer.from(data.buffer);
    }
  }
  try { await Promise.all([pipeline(Readable.from(frames()), encoder.stdin), closed]); }
  catch (error) { encoder.kill(); throw error; }
  return { output, fps, frames: count, seconds: count / fps, effects: selected.length };
}

export async function main(args = process.argv.slice(2)) {
  const { files, options } = parseArgs(args, ['out', 'fps', 'seconds', 'seed']);
  if (options.help) return console.log('Usage: node tools/demo.mjs [--out artifacts/inkfx-demo.mp4] [--fps 60] [--seconds 4] [--seed 42]\nRequires ffmpeg with libx264; renders a fixed 6x4 selection offline.');
  if (files.length || options.all || options.list) throw new Error('Demo uses a fixed 24-effect selection; use --help for options');
  console.log(JSON.stringify(await renderDemo({ out: options.out, fps: numberOption(options, 'fps', 60),
    seconds: numberOption(options, 'seconds', 4), seed: numberOption(options, 'seed', 42) }), null, 2));
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
