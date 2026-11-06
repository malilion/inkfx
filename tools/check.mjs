import { loadFX, sampleFX, withoutMathRandom } from '../src/core/run.js';
import { examples, isMain, parseArgs, numberOption, listFX } from './cli.mjs';

export async function checkFX(file, { seed = 1, fps = 30, palette = 'songyan', edgeThreshold = 0.005 } = {}) {
  if (!Number.isFinite(edgeThreshold) || edgeThreshold < 0 || edgeThreshold > 1) throw new Error('Invalid edge threshold');
  const checks = [];
  let a, b;
  try {
    await withoutMathRandom(async () => {
      a = sampleFX(await loadFX(file), { seed, fps, palette });
      b = sampleFX(await loadFX(file), { seed, fps, palette });
    });
    checks.push({ id: 'CHK-01', pass: a.hash === b.hash, detail: `Determinism SHA-256 ${a.hash}` });
  } catch (error) {
    return { file, pass: false, checks: [{ id: 'CHK-01', pass: false, detail: error.message }] };
  }
  const edge = Math.max(...a.frames.map(f => f.edgeRatio), ...b.frames.map(f => f.edgeRatio));
  checks.push({ id: 'CHK-02', pass: edge <= edgeThreshold, detail: `Composited RGBA edge spill ${(edge * 100).toFixed(3)}% <= ${(edgeThreshold * 100).toFixed(3)}%` });
  checks.push({ id: 'CHK-04', pass: a.maxPigment > 0 && b.maxPigment > 0 && !a.allOne && !b.allOne && !a.invalid && !b.invalid,
    detail: 'Pigment: visible during act, never all-one; all InkFrame channels finite and in range' });
  return { file, pass: checks.every(check => check.pass), checks, hash: a.hash };
}
export async function main(args = process.argv.slice(2), { log = console.log } = {}) {
  const { files, options } = parseArgs(args, ['seed', 'fps', 'palette', 'edge-threshold']);
  if (options.help) {
    log('Usage: node tools/check.mjs [FX-ID | file.js ...] [--seed 1] [--fps 30] [--palette songyan] [--edge-threshold 0.005] [--list]');
    return;
  }
  if (options.list) return listFX();
  let failed = false;
  for (const file of files.length ? files : examples) {
    const result = await checkFX(file, { seed: numberOption(options, 'seed', 1), fps: numberOption(options, 'fps', 30),
      palette: options.palette ?? 'songyan', edgeThreshold: numberOption(options, 'edge-threshold', 0.005) });
    log(file);
    for (const check of result.checks) log(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.detail}`);
    failed ||= !result.pass;
  }
  if (failed) process.exitCode = 1;
}
if (isMain(import.meta.url)) main().catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1; });
