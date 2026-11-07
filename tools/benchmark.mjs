import { performance } from 'node:perf_hooks';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { cpus } from 'node:os';
import { composite } from '../src/core/compositor.js';
import { loadFX } from '../src/core/run.js';
import { examples, parseArgs, numberOption, isMain, listFX } from './cli.mjs';

/** Measure real step + draw + composite; creation and file I/O are excluded. */
export function benchmarkFX(entry, { steps = 300, warmup = 120, seed = 42 } = {}) {
  if (!Number.isInteger(steps) || steps < 1 || steps > 100000 ||
      !Number.isInteger(warmup) || warmup < 0 || warmup > 100000) {
    throw new RangeError('steps must be 1..100000 and warmup 0..100000');
  }
  let instance = entry.create({ seed });
  const advance = () => { instance.step(1 / 120); composite(instance.draw()); };
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

export async function main(args = process.argv.slice(2)) {
  const { files, options } = parseArgs(args, ['steps', 'warmup', 'seed', 'out']);
  if (options.help) return console.log('Usage: node tools/benchmark.mjs [FX-ID ...] [--steps 300] [--warmup 120] [--seed 42] [--out report.json]');
  if (options.list) return listFX();
  const results = [];
  for (const file of files.length ? files : examples) results.push(benchmarkFX(await loadFX(file), {
    steps: numberOption(options, 'steps', 300), warmup: numberOption(options, 'warmup', 120), seed: numberOption(options, 'seed', 42) }));
  const report = { schemaVersion: 1, node: process.version, cpu: cpus()[0]?.model,
    clock: 'performance.now', simulationHz: 120, paper: false,
    scope: 'Native FX dimensions, not the PRD 320x180 reference laptop. Creation and I/O excluded; no portable performance guarantee.',
    results };
  if (options.out) {
    const out = resolve(options.out); await mkdir(dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
