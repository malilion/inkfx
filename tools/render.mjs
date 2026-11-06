import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { loadFX, sampleFX, withoutMathRandom } from '../src/core/run.js';
import { composite, hexRGB } from '../src/core/compositor.js';
import { createInkFrame } from '../src/core/frame.js';
import { encodePNG } from '../src/core/png.js';
import { drawText, line, rect, setPixel } from '../src/core/overlay.js';
import { getPalette } from '../src/palettes/index.js';
import { examples, isMain, parseArgs, numberOption, listFX, root } from './cli.mjs';

export async function renderFX(file, { seed = 1, fps = 30, count = 12, columns = 4, palette = 'songyan', outDir } = {}) {
  if (!Number.isInteger(count) || count < 2 || count > 256) throw new Error('frames must be 2..256');
  if (!Number.isInteger(columns) || columns < 1 || columns > 16) throw new Error('columns must be 1..16');
  const run = await withoutMathRandom(async () => sampleFX(await loadFX(file), { seed, fps, palette }));
  const { meta, frames } = run;
  const selectedCount = Math.min(count, frames.length);
  const selected = Array.from({ length: selectedCount }, (_, i) => Math.round(i * (frames.length - 1) / (selectedCount - 1)));
  columns = Math.min(columns, selectedCount);
  const cellW = meta.w + 28, cellH = meta.h + 66, headerH = 68;
  const w = columns * cellW + 32, h = Math.ceil(selectedCount / columns) * cellH + headerH + 16;
  const sheet = { w, h, data: new Uint8ClampedArray(w * h * 4) };
  for (let i = 0; i < w * h; i++) sheet.data.set([239, 233, 220, 255], i * 4);
  const ink = [37, 49, 43, 255], muted = [112, 115, 102, 255], accent = [...hexRGB(getPalette(palette).accent), 255];
  drawText(sheet, `INKFX / ${meta.id}`, 24, 17, ink);
  drawText(sheet, `${palette} / SEED ${seed} / 120HZ / ${meta.duration.toFixed(2)}S`, 24, 40, muted, 1);
  line(sheet, 24, 55, w - 24, 55, accent);
  const paperFrame = createInkFrame(meta.w, meta.h, { seed, ox: meta.ox, oy: meta.oy });
  const paper = composite(paperFrame, palette, { paper: true });
  selected.forEach((index, cell) => {
    const sample = frames[index], x = 16 + cell % columns * cellW, y = headerH + Math.floor(cell / columns) * cellH;
    const fx = x + 14, fy = y + 25;
    rect(sheet, x + 3, y, cellW - 6, cellH - 7, [196, 190, 175, 255]);
    drawText(sheet, `F${String(index).padStart(3, '0')}  T=${sample.time.toFixed(3)}S`, x + 14, y + 9, ink, 1);
    for (let py = 0; py < meta.h; py++) for (let px = 0; px < meta.w; px++) {
      const i = (py * meta.w + px) * 4;
      setPixel(sheet, fx + px, fy + py, paper.subarray(i, i + 4));
      setPixel(sheet, fx + px, fy + py, sample.data.subarray(i, i + 4));
    }
    rect(sheet, fx, fy, meta.w, meta.h, [94, 107, 91, 65]);
    const inset = 12;
    rect(sheet, fx + inset, fy + inset, meta.w - inset * 2, meta.h - inset * 2, [94, 107, 91, 26]);
    const cx = fx + meta.ox, cy = fy + meta.oy;
    line(sheet, cx - 5, cy, cx + 5, cy, [...accent.slice(0, 3), 155]);
    line(sheet, cx, cy - 5, cx, cy + 5, [...accent.slice(0, 3), 155]);
    drawText(sheet, `FILL=${(sample.fillRatio * 100).toFixed(2)}%`, x + 14, fy + meta.h + 8, ink, 1);
    drawText(sheet, `OX=${meta.ox} OY=${meta.oy}`, x + 14, fy + meta.h + 20, muted, 1);
  });
  const output = resolve(outDir ?? join(root, 'examples/out', meta.id));
  await mkdir(output, { recursive: true });
  const png = join(output, 'contact.png'), json = join(output, 'contact.json');
  const stats = { schemaVersion: 1, meta, seed, palette, fps, dt: run.dt, simulationHz: 120, hash: run.hash,
    frameCount: frames.length, sheet: { w, h, cellW, cellH, headerH, columns, selected },
    frames: frames.map(({ data, ...frame }) => frame) };
  await writeFile(png, encodePNG(sheet));
  await writeFile(json, JSON.stringify(stats, null, 2) + '\n');
  return { png, json, stats };
}
export async function main(args = process.argv.slice(2)) {
  const { files, options } = parseArgs(args, ['seed', 'fps', 'frames', 'columns', 'out', 'palette']);
  if (options.help) {
    console.log('Usage: node tools/render.mjs [FX-ID | file.js ...] [--palette songyan] [--seed 1] [--frames 12] [--fps 30] [--columns 4] [--out dir] [--list]');
    return;
  }
  if (options.list) return listFX();
  const targets = files.length ? files : examples;
  for (const file of targets) {
    const outDir = options.out && (targets.length === 1 ? options.out : join(options.out, String(targets.indexOf(file))));
    const result = await renderFX(file, { seed: numberOption(options, 'seed', 1), fps: numberOption(options, 'fps', 30),
      count: numberOption(options, 'frames', 12), columns: numberOption(options, 'columns', 4), palette: options.palette ?? 'songyan', outDir });
    console.log(`Rendered ${result.png}\n         ${result.json}`);
  }
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
