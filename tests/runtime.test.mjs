import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { benchmarkFX, main as benchmarkMain } from '../tools/benchmark.mjs';
import { getFX } from '../src/fx/index.js';
import { createEffect, createPureEffect, composite } from '../src/runtime.js';

test('renderer-only entry runs both engines without importing catalog or Node modules', async () => {
  const visited = new Set();
  async function visit(url) {
    if (visited.has(url.href)) return;
    visited.add(url.href);
    const source = await readFile(url, 'utf8');
    for (const [, specifier] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      assert.ok(specifier.startsWith('.'), `browser-only import: ${specifier}`);
      assert.ok(!specifier.includes('/fx/'), `catalog-free import: ${specifier}`);
      await visit(new URL(specifier, url));
    }
  }
  await visit(new URL('../src/runtime.js', import.meta.url));
  const meta = { w: 8, h: 8, ox: 4, oy: 4, duration: .1, loop: false };
  const act = { windup: 0, poses: [], hits: [] };
  for (const create of [createEffect, createPureEffect]) {
    const instance = create(meta, act, frame => { frame.pigment[36] = .8; });
    instance.step(1 / 120);
    const nativeDimensions = { width: 8, height: 8, data: new Uint8ClampedArray(8 * 8 * 4) };
    assert.equal(instance.draw(nativeDimensions), nativeDimensions);
    const expected = composite(instance.draw());
    assert.ok(expected[36 * 4 + 3] > 0);
    assert.deepEqual(nativeDimensions.data, expected);
  }
});

test('benchmark replays short effects and measures step, draw and composite', () => {
  let draws = 0, steps = 0, creations = 0;
  const entry = { meta: { id: 'short', w: 2, h: 2, duration: 1 / 120 }, create() {
    creations++;
    return { t: 0, step(dt) { this.t += dt; steps++; }, draw() {
      draws++; return { w: 2, h: 2, pigment: new Float32Array([0, .5, 0, 0]),
        tint: new Uint8Array(4), paperGrain: new Float32Array(4) };
    } };
  } };
  const report = benchmarkFX(entry, { steps: 4, warmup: 2 });
  assert.equal(steps, 6); assert.equal(draws, 6); assert.equal(creations, 6);
  assert.equal(report.steps, 4);
  assert.ok(Number.isFinite(report.p95Ms) && report.p95Ms >= 0);
  assert.ok(report.maxMs >= report.p95Ms);
  assert.throws(() => benchmarkFX(entry, { steps: 0 }), /steps/);
  assert.throws(() => benchmarkFX(entry, { warmup: -1 }), /warmup/);
});

test('canvas benchmark overrides stay isolated from the runtime catalog', async () => {
  const entry = getFX('sword-qi-slash'), before = { ...entry.meta };
  let report;
  await benchmarkMain(['sword-qi-slash', '--width', '320', '--height', '180', '--steps', '60', '--warmup', '0'], {
    log: text => { report = JSON.parse(text); },
  });
  assert.equal(report.results[0].w, 320); assert.equal(report.results[0].h, 180);
  assert.equal(report.results[0].steps, 60);
  assert.deepEqual(entry.meta, before);
  assert.equal(entry.create().frame.w, before.w);
  await assert.rejects(benchmarkMain(['--width', '320']), /both width and height/);
});
