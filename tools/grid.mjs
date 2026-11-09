import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { effects, categoryCounts } from '../src/fx/index.js';
import { composite } from '../src/core/compositor.js';
import { encodePNG } from '../src/core/png.js';
import { drawText } from '../src/core/overlay.js';
import { isMain } from './cli.mjs';

export async function renderGrid(out = 'examples/grid.png', { all = false } = {}) {
  const selected = Object.keys(categoryCounts).flatMap(category => effects.filter(fx => fx.meta.category === category).slice(0, all ? Infinity : 4));
  const columns = 6, cw = 256, ch = 264, header = 64;
  const w = columns * cw, h = Math.ceil(selected.length / columns) * ch + header;
  const data = new Uint8ClampedArray(w * h * 4), surface = { w, h, data };
  for (let i = 0; i < w * h; i++) data.set([244, 239, 230, 255], i * 4);
  drawText(surface, `INKFX / ${effects.length} GESTURES / FOUR MINERAL PALETTES`, 24, 20, [40, 48, 38, 255], 2);
  const palettes = ['songyan', 'zhusha', 'shiqing', 'nijin'];
  for (const [index, fx] of selected.entries()) {
    const instance = fx.create({ seed: 42 });
    instance.step(fx.meta.loop ? .6 : fx.meta.category === 'transitions' ? .5 : fx.act.windup + .24);
    const pixels = composite(instance.frame, palettes[index % 4], { paper: true });
    const x = index % columns * cw, y = Math.floor(index / columns) * ch + header;
    for (let row = 0; row < fx.meta.h; row++) data.set(pixels.subarray(row * fx.meta.w * 4, (row + 1) * fx.meta.w * 4), ((y + row) * w + x) * 4);
    drawText(surface, fx.meta.id.toUpperCase(), x + 12, y + 231, [40, 48, 38, 255]);
    drawText(surface, fx.meta.category.toUpperCase(), x + 12, y + 246, [123, 128, 114, 255]);
  }
  const file = resolve(out); await mkdir(dirname(file), { recursive: true }); await writeFile(file, encodePNG(surface));
  return file;
}
if (isMain(import.meta.url)) renderGrid(process.argv[2], { all: process.argv.includes('--all') }).then(console.log).catch(error => { console.error(error.message); process.exitCode = 1; });
