import { performance } from 'node:perf_hooks';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { cpus } from 'node:os';
import { composite } from '../src/core/compositor.js';
import { loadFX } from '../src/core/run.js';
import { examples, parseArgs, numberOption, isMain, listFX } from './cli.mjs';

/** Measure real step + draw + composite; creation and file I/O are excluded. */
export function benchmarkFX(entry, { steps = 300, warmup = 120, seed = 42, reuse = false, paper = false } = {}) {
  if (!Number.isInteger(steps) || steps < 1 || steps > 100000 ||
      !Number.isInteger(warmup) || warmup < 0 || warmup > 100000) {
    throw new RangeError('steps must be 1..100000 and warmup 0..100000');
  }
  const target = reuse ? new Uint8ClampedArray(entry.meta.w * entry.meta.h * 4) : undefined;
  const options = { paper };
  let instance = entry.create({ seed });
  const advance = () => { instance.step(1 / 120); composite(instance.draw(), 'songyan', options, target); };
  const reset = () => { if (instance.t >= entry.meta.duration) instance = entry.create({ seed }); };
  for (let i = 0; i < warmup; i++) { reset(); advance(); }
  // Begin at windup again, including the burst instead of timing only a faded tail.
  instance = entry.create({ seed });
  const samples = [];
  for (let i = 0; i < steps; i++) {
    reset();
    const start = performance.now(); advance(); samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return { id: entry.meta.id, w: entry.meta.w, h: entry.meta.h, steps, warmup,
    meanMs: samples.reduce((sum, n) => sum + n, 0) / steps,
    p95Ms: samples[Math.ceil(steps * .95) - 1], maxMs: samples.at(-1) };
}

export async function main(args = process.argv.slice(2), { log = console.log } = {}) {
  const { files, options } = parseArgs(args, ['steps', 'warmup', 'seed', 'out', 'width', 'height', 'buffer', 'background']);
  if (options.help) return console.log('Usage: node tools/benchmark.mjs [FX-ID ...] [--steps 300] [--warmup 120] [--seed 42] [--width 320 --height 180] [--buffer allocate|reuse] [--background transparent|paper] [--out report.json]');
  if (options.list) return listFX();
  const buffer = options.buffer ?? 'allocate', background = options.background ?? 'transparent';
  if (!['allocate', 'reuse'].includes(buffer)) throw new RangeError('buffer must be allocate or reuse');
  if (!['transparent', 'paper'].includes(background)) throw new RangeError('background must be transparent or paper');
  const paper = background === 'paper';
  const resized = options.width !== undefined || options.height !== undefined;
  const width = numberOption(options, 'width', NaN), height = numberOption(options, 'height', NaN);
  if (resized && (![width, height].every(n => Number.isInteger(n) && n >= 2 && n <= 1024))) {
    throw new RangeError('Provide both width and height as integers in 2..1024');
  }
  const results = [];
  for (const file of files.length ? files : examples) {
    // loadFX imports a fresh module URL. Dimension changes are confined to this
    // benchmark instance; the public catalog and authored files stay unchanged.
    const entry = await loadFX(file);
    if (resized) Object.assign(entry.meta, { w: width, h: height, ox: width / 2, oy: height / 2 });
    results.push(benchmarkFX(entry, { steps: numberOption(options, 'steps', 300),
      warmup: numberOption(options, 'warmup', 120), seed: numberOption(options, 'seed', 42), reuse: buffer === 'reuse', paper }));
  }
  const report = { schemaVersion: 1, node: process.version, cpu: cpus()[0]?.model,
    clock: 'performance.now', simulationHz: 120, paper, buffer,
    scope: `${resized ? 'Requested canvas; artwork retains authored coordinates around the new center' : 'Native FX dimensions'}. Creation and I/O excluded. Results are specific to this CPU and runtime.`,
    results };
  if (options.out) {
    const out = resolve(options.out); await mkdir(dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  }
  log(JSON.stringify(report, null, 2));
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
