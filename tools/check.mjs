import { loadFX, sampleFX, withoutMathRandom } from '../src/core/run.js';
import { examples, isMain, parseArgs, numberOption, listFX } from './cli.mjs';
import { categoryCounts } from '../src/fx/index.js';

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
  const transition = a.meta.category === 'transitions';
  checks.push({ id: 'CHK-02', pass: transition || edge <= edgeThreshold, detail: transition
    ? `Transition mask: intentional edge coverage (${(edge * 100).toFixed(3)}%)`
    : `Composited RGBA edge spill ${(edge * 100).toFixed(3)}% <= ${(edgeThreshold * 100).toFixed(3)}%` });
  if (a.meta.loop) {
    const mse = (x, y) => x.data.reduce((sum, value, i) => sum + (value - y.data[i]) ** 2, 0) / x.data.length;
    const seam = mse(a.frames[0], a.frames.at(-2));
    const adjacent = a.frames.slice(1, -1).reduce((sum, frame, i) => sum + mse(frame, a.frames[i]), 0) / (a.frames.length - 2);
    checks.push({ id: 'CHK-03', pass: seam <= Math.max(1, adjacent * 1.5), detail: `Loop seam MSE ${seam.toFixed(2)}, adjacent ${adjacent.toFixed(2)}` });
  }
  const tail = run => run.meta.duration - (run.frames.findLast(frame => frame.fillRatio > 0)?.time ?? 0);
  const maxTail = Math.max(tail(a), tail(b));
  checks.push({ id: 'CHK-04', pass: a.maxPigment > 0 && b.maxPigment > 0 && (transition || (!a.allOne && !b.allOne)) && !a.invalid && !b.invalid &&
    (a.meta.loop || maxTail <= a.meta.duration * .15 + 1e-8),
    detail: `Visible pigment; valid channels; blank tail ${(maxTail * 1000).toFixed(0)}ms <= 15% duration; full coverage allowed for transitions` });
  return { file, pass: checks.every(check => check.pass), checks, hash: a.hash };
}
export async function main(args = process.argv.slice(2), { log = console.log } = {}) {
  const { files, options } = parseArgs(args, ['seed', 'fps', 'palette', 'edge-threshold']);
  if (options.help) {
    log('Usage: node tools/check.mjs [FX-ID | file.js ...] [--seed 1] [--fps 30] [--palette songyan] [--edge-threshold 0.005] [--list]');
    return;
  }
  if (options.list) return listFX();
  let failed = false, passed = 0;
  const targets = files.length ? files : examples;
  for (const file of targets) {
    const result = await checkFX(file, { seed: numberOption(options, 'seed', 1), fps: numberOption(options, 'fps', 30),
      palette: options.palette ?? 'songyan', edgeThreshold: numberOption(options, 'edge-threshold', 0.005) });
    log(file);
    for (const check of result.checks) log(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.id} ${check.detail}`);
    failed ||= !result.pass;
    if (result.pass) passed++;
  }
  log(`FX checks: ${passed}/${targets.length} passed`);
  if (!files.length) log(`Category counts: ${JSON.stringify(categoryCounts)}`);
  if (failed) process.exitCode = 1;
}
if (isMain(import.meta.url)) main().catch(error => { console.error(`FAIL ${error.message}`); process.exitCode = 1; });
