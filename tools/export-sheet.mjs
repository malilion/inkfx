import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildSheet } from '../src/core/sheet.js';
import { encodePNG } from '../src/core/png.js';
import { loadFX, withoutMathRandom } from '../src/core/run.js';
import { examples, isMain, parseArgs, numberOption, listFX, root } from './cli.mjs';

export async function exportSheet(file, { outDir, ...options } = {}) {
  const sheet = await withoutMathRandom(async () => buildSheet(await loadFX(file), options));
  const output = resolve(outDir ?? join(root, 'examples/out', sheet.atlas.meta.inkfx.id));
  await mkdir(output, { recursive: true });
  const png = join(output, 'sheet.png'), json = join(output, 'sheet.json');
  await writeFile(png, encodePNG(sheet));
  await writeFile(json, JSON.stringify(sheet.atlas, null, 2) + '\n');
  return { png, json, atlas: sheet.atlas };
}
export async function main(args = process.argv.slice(2)) {
  const { files, options } = parseArgs(args, ['seed', 'fps', 'columns', 'palette', 'background', 'grain', 'out']);
  if (options.help) return console.log('Usage: node tools/export-sheet.mjs [FX-ID | file.js ...] [--background transparent|paper] [--seed 1] [--fps 30] [--columns 8] [--palette songyan] [--grain 1] [--out dir] [--list]');
  if (options.list) return listFX();
  if (options.background && !['transparent', 'paper'].includes(options.background)) throw new Error('background must be transparent or paper');
  const targets = files.length ? files : examples;
  for (const file of targets) {
    const fx = await loadFX(file);
    const result = await exportSheet(file, { seed: numberOption(options, 'seed', 1), fps: numberOption(options, 'fps', 30),
      columns: numberOption(options, 'columns', 8), grain: numberOption(options, 'grain', 1), palette: options.palette ?? 'songyan',
      paper: options.background === 'paper', outDir: options.out && (targets.length === 1 ? options.out : join(options.out, fx.meta.id)) });
    console.log(`Exported ${result.png}\n         ${result.json}`);
  }
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
