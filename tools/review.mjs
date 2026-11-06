import { join } from 'node:path';
import { checkFX } from './check.mjs';
import { renderFX } from './render.mjs';
import { examples, parseArgs, numberOption, isMain, listFX } from './cli.mjs';

export async function main(args = process.argv.slice(2)) {
  const { files, options } = parseArgs(args, ['seed', 'fps', 'palette', 'out']);
  if (options.help) return console.log('Usage: node tools/review.mjs [FX-ID ...] [--seed 42] [--fps 30] [--palette songyan] [--out directory]');
  if (options.list) return listFX();
  const settings = { seed: numberOption(options, 'seed', 42), fps: numberOption(options, 'fps', 30), palette: options.palette ?? 'songyan' };
  const targets = files.length ? files : examples;
  for (const [index, file] of targets.entries()) {
    const result = await checkFX(file, settings);
    if (!result.pass) throw new Error(`${file}: ${JSON.stringify(result.checks.filter(check => !check.pass))}`);
    const rendered = await renderFX(file, { ...settings, outDir: options.out && (targets.length === 1 ? options.out : join(options.out, String(index))) });
    console.log(`PASS ${file}\nLOOK ${rendered.png}`);
  }
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
