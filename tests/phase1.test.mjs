import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inflateSync } from 'node:zlib';
import { createInkFrame, clearInk } from '../src/core/frame.js';
import { mulberry32, hash2d } from '../src/core/seed.js';
import { stamp } from '../src/core/feibai.js';
import { stepWet, WET_DT } from '../src/core/diffusion.js';
import { composite } from '../src/core/compositor.js';
import { encodePNG, crc32 } from '../src/core/png.js';
import { samplePose, actionTime, hitStopAt } from '../src/core/act.js';
import { effects, effectPaths, getFX } from '../src/fx/index.js';
import { palettes } from '../src/palettes/index.js';
import { sampleFX, loadFX, withoutMathRandom } from '../src/core/run.js';
import { checkFX, main as checkMain } from '../tools/check.mjs';
import { renderFX } from '../tools/render.mjs';
import { parseArgs, numberOption, root } from '../tools/cli.mjs';

function decodePNG(buffer) {
  assert.deepEqual(buffer.subarray(0, 8), Buffer.from([137,80,78,71,13,10,26,10]));
  let w, h;
  const idat = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    assert.equal(buffer.readUInt32BE(offset + 8 + length), crc32(buffer.subarray(offset + 4, offset + 8 + length)), `${type} CRC`);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      assert.deepEqual([...data.subarray(8)], [8,6,0,0,0]);
    }
    if (type === 'IDAT') idat.push(data);
    offset += length + 12;
    if (type === 'IEND') assert.equal(offset, buffer.length);
  }
  const rows = inflateSync(Buffer.concat(idat)), pixels = Buffer.alloc(w * h * 4);
  assert.equal(rows.length, h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    assert.equal(rows[y * (w * 4 + 1)], 0);
    rows.copy(pixels, y * w * 4, y * (w * 4 + 1) + 1, (y + 1) * (w * 4 + 1));
  }
  return { w, h, pixels };
}
async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), 'inkfx-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}
async function fixture(t, { paint = '', prelude = '', create = '', step = '' } = {}) {
  const file = join(await temporary(t), 'fixture.mjs');
  await writeFile(file, `${prelude}
    export const meta = {id:'fixture',duration:.08,loop:false,w:16,h:16,ox:8,oy:8};
    export function create() { ${create} return {t:0,step(dt){this.t+=dt;${step}},draw(frame){${paint}}}; }`);
  return file;
}
const centerMark = 'frame.pigment[8*16+8]=.8;';

test('mulberry32, hash2d and paper grain repeat with seed zero and vary by seed', () => {
  const sequence = seed => { const random = mulberry32(seed); return Array.from({ length: 20 }, random); };
  assert.deepEqual(sequence(0), sequence(0));
  assert.notDeepEqual(sequence(0), sequence(1));
  assert.ok(sequence(0).every(x => x >= 0 && x < 1));
  assert.equal(hash2d(-9, 42, 0), hash2d(-9, 42, 0));
  assert.notEqual(hash2d(-9, 42, 0), hash2d(42, -9, 0));
  const a = createInkFrame(32, 24, { seed: 0 }), b = createInkFrame(32, 24, { seed: 0 });
  assert.deepEqual(a.paperGrain, b.paperGrain);
  assert.notDeepEqual(a.paperGrain, createInkFrame(32, 24, { seed: 1 }).paperGrain);
  assert.ok(a.paperGrain.every(x => x >= 0 && x <= 1));
});

test('InkFrame uses the specified channels; clear preserves seeded paper and origin', () => {
  const frame = createInkFrame(20, 30, { ox: 4, oy: 7 });
  assert.ok(frame.pigment instanceof Float32Array);
  assert.ok(frame.wetness instanceof Float32Array);
  assert.ok(frame.tint instanceof Uint8Array);
  const grain = frame.paperGrain.slice();
  frame.pigment.fill(.8); frame.wetness.fill(.6); frame.tint.fill(1);
  clearInk(frame);
  for (const key of ['pigment', 'wetness', 'tint']) assert.ok(frame[key].every(x => x === 0));
  assert.deepEqual(frame.paperGrain, grain);
  assert.deepEqual([frame.ox, frame.oy], [4,7]);
  assert.throws(() => createInkFrame(1, 2), /Invalid/);
  assert.throws(() => createInkFrame(20, 20, { ox: NaN }), /Invalid/);
});

test('dry feibai leaves paper holes inside a stroke; adding water fills them', () => {
  const dry = createInkFrame(64, 64, { seed: 42 }), wet = createInkFrame(64, 64, { seed: 42 });
  stamp(dry, 32, 32, 25, { pigment: .5, wetness: 0, dryFactor: 1.8 });
  stamp(wet, 32, 32, 25, { pigment: .5, wetness: 1, dryFactor: 1.8 });
  let holes = 0, marks = 0, wetMarks = 0;
  for (let y = 20; y < 44; y++) for (let x = 20; x < 44; x++) {
    const i = y * 64 + x;
    if (dry.pigment[i] === 0) holes++; else marks++;
    if (wet.pigment[i] > 0) wetMarks++;
  }
  assert.ok(holes > 20 && marks > 10, `${holes} holes / ${marks} marks`);
  assert.ok(wetMarks > marks);
  stamp(dry, -5, -5, 10);
  assert.ok(dry.pigment.every(x => Number.isFinite(x) && x >= 0 && x <= 1));
});

test('four-neighbour diffusion spreads symmetrically and conserves pigment', () => {
  const frame = createInkFrame(9, 9), i = 4 * 9 + 4;
  frame.pigment[i] = .8; frame.wetness[i] = 1; frame.tint[i] = 1;
  stepWet(frame);
  const neighbors = [i - 1, i + 1, i - 9, i + 9];
  assert.ok(neighbors.every(j => frame.pigment[j] > 0 && frame.tint[j] === 1));
  for (const j of neighbors) assert.equal(frame.pigment[j], frame.pigment[i - 1]);
  assert.ok(frame.pigment[i] < .8 && frame.wetness[i] < 1);
  assert.ok(Math.abs(frame.pigment.reduce((a, b) => a + b) - .8) < 1e-6);
  const dry = createInkFrame(9, 9); dry.pigment[i] = .8;
  stepWet(dry); assert.equal(dry.pigment[i + 1], 0);
});

test('wet boundary accumulates a darker fringe than transport without fringe', () => {
  const a = createInkFrame(9, 9), b = createInkFrame(9, 9), i = 40;
  for (const frame of [a, b]) { frame.pigment[i] = .8; frame.wetness[i] = 1; }
  stepWet(a, { fringe: .25 }); stepWet(b, { fringe: 0 });
  assert.ok(a.pigment[i + 1] > b.pigment[i + 1]);
  for (let n = 0; n < 100; n++) stepWet(a);
  assert.ok(a.pigment.every(x => x >= 0 && x <= 1 && Number.isFinite(x)));
});

test('compositor supports all six stops, tint accents, paper and transparent emptiness', () => {
  const frame = createInkFrame(6, 2);
  frame.pigment.set([0,.07,.22,.45,.73,1, .7,.7,.7,0,0,0]);
  frame.tint[7] = 1; frame.tint[8] = 2;
  for (const [id, palette] of Object.entries(palettes)) {
    const rgba = composite(frame, id), paper = composite(frame, id, { paper: true });
    assert.ok(rgba instanceof Uint8ClampedArray);
    assert.equal(rgba[3], 0); assert.equal(rgba[5 * 4 + 3], 255);
    assert.ok(Array.from({ length: 12 }, (_, i) => paper[i * 4 + 3]).every(x => x === 255));
    const dark = palette.stops[5].slice(1).match(/../g).map(x => parseInt(x, 16));
    assert.deepEqual([...rgba.slice(20, 23)], dark);
    assert.notDeepEqual(rgba.slice(24, 27), rgba.slice(28, 31));
    assert.notDeepEqual(rgba.slice(28, 31), rgba.slice(32, 35));
    assert.ok(palette.stops.length === 6 && palette.accentRGB.length === 3);
  }
  assert.throws(() => composite(frame, 'missing'), /Unknown palette/);
});

test('zero-dependency PNG has correct magic, chunk CRCs and lossless RGBA scanlines', () => {
  const data = Uint8ClampedArray.from([255,0,0,255,0,255,0,127,0,0,255,0,4,5,6,7]);
  const decoded = decodePNG(encodePNG({ w: 2, h: 2, data }));
  assert.deepEqual(decoded.pixels, Buffer.from(data));
  assert.equal(decoded.w, 2); assert.equal(decoded.h, 2);
  assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926);
  assert.throws(() => encodePNG({ w: 3, h: 3, data }), /RGBA/);
});

test('act samples negative windup, easing and exact hit-stop boundaries', () => {
  const act = { windup: .4, poses: [[-.4,'gather','easeOut'],[0,'slash','snap'],[.2,'settle','linear']],
    hits: [{ t: .02, freeze: .15 }] };
  assert.equal(samplePose(act, -.4).poseId, 'gather');
  assert.equal(samplePose(act, -.2).progress, .875);
  assert.equal(samplePose(act, .1).poseId, 'slash');
  assert.equal(samplePose(act, .1).progress, 0);
  assert.equal(hitStopAt(act, .019), null);
  assert.ok(hitStopAt(act, .02));
  assert.equal(hitStopAt(act, .17), null);
  assert.ok(Math.abs(actionTime(act, .12) - .02) < 1e-12);
  assert.ok(Math.abs(actionTime(act, .3) - .15) < 1e-12);
});

test('sword qi completes N fixed steps, obeys hit-stop and draws without advancing', () => {
  const fx = getFX('sword-qi-slash'), a = fx.create({ seed: 7 });
  assert.equal(fx.meta.duration, 1.3); assert.equal(fx.meta.actionDuration, .75); assert.equal(fx.act.windup, .4); assert.equal(fx.meta.droplets, 28);
  const n = Math.round(fx.meta.duration / WET_DT);
  for (let i = 0; i < n; i++) a.step();
  assert.ok(Math.abs(a.t - 1.3) < 1e-10);
  const visible = fx.create({ seed: 7 }); visible.step(.75);
  assert.ok(visible.frame.pigment.some(x => x > .5));
  assert.ok(visible.frame.tint.some(x => x === 1));
  assert.ok(a.frame.pigment.every(x => x === 0), 'PoC residual ink fades out by action .73s');
  const b = fx.create({ seed: 7 }); b.step(1.3);
  for (const key of ['pigment', 'tint', 'wetness']) assert.deepEqual(a.frame[key], b.frame[key], key);
  const frozen = fx.create({ seed: 7 }); frozen.step(.45);
  const p = frozen.frame.pigment.slice(), wet = frozen.frame.wetness.slice();
  frozen.step(.1);
  assert.deepEqual(frozen.frame.pigment, p); assert.deepEqual(frozen.frame.wetness, wet);
  const target = createInkFrame(224, 224);
  const time = a.t; a.draw(target); a.draw(target);
  assert.equal(a.t, time); assert.deepEqual(target.pigment, a.frame.pigment);
  const rgba = { w: 224, h: 224, data: new Uint8ClampedArray(224 * 224 * 4) };
  a.draw(rgba); assert.deepEqual(rgba.data, composite(a.frame));
  assert.throws(() => a.step(-1), /nonnegative/);
});

test('display FPS changes do not change the fixed-tick final image', () => {
  for (const fx of effects) {
    const a = fx.create({ seed: 42 }), b = fx.create({ seed: 42 });
    for (let i = 0; i < 30; i++) a.step(fx.meta.duration / 30);
    for (let i = 0; i < 72; i++) b.step(fx.meta.duration / 72);
    assert.deepEqual(a.frame.pigment, b.frame.pigment, fx.meta.id);
  }
});

test('all Phase 1 effects pass checks; alternate seeds and palettes remain deterministic', async () => {
  for (const fx of effects) {
    const file = join(root, effectPaths[fx.meta.id]);
    for (const options of [{}, { seed: 0, palette: 'zhusha' }, { seed: 0xffffffff, palette: 'nijin' }, { seed: 42, palette: 'shiqing' }]) {
      const checked = await checkFX(file, options);
      assert.equal(checked.pass, true, `${fx.meta.id}: ${JSON.stringify(checked.checks)}`);
      assert.equal(checked.checks.find(c => c.id === 'CHK-02').pass, true);
    }
    assert.notEqual(sampleFX(fx, { seed: 1 }).hash, sampleFX(fx, { seed: 2 }).hash);
  }
});

test('CHK-01 blocks Math.random at import, creation, step and draw, restoring the guard', async t => {
  const original = Math.random;
  for (const options of [{ prelude: 'Math.random();' }, { create: 'Math.random();' },
    { step: 'Math.random();' }, { paint: 'Math.random();' }]) {
    const checked = await checkFX(await fixture(t, options));
    assert.equal(checked.pass, false); assert.match(checked.checks[0].detail, /Math.random is forbidden/);
    assert.equal(Math.random, original);
  }
});

test('CHK-01 catches nondeterministic bytes without Math.random', async t => {
  globalThis.__inkfxTestCounter = 0;
  t.after(() => { delete globalThis.__inkfxTestCounter; });
  const file = await fixture(t, { prelude: 'const p = ++globalThis.__inkfxTestCounter / 10;', paint: 'frame.pigment[136]=p;' });
  const checked = await checkFX(file);
  assert.equal(checked.checks[0].pass, false);
});

test('CHK-02 checks composited alpha, not the opaque paper, and rejects spill', async t => {
  const good = await fixture(t, { paint: centerMark });
  const bad = await fixture(t, { paint: 'frame.pigment.fill(.8,0,16);' });
  assert.equal((await checkFX(good)).checks.find(c => c.id === 'CHK-02').pass, true);
  const checked = await checkFX(bad);
  assert.equal(checked.checks.find(c => c.id === 'CHK-02').pass, false);
  assert.equal((await checkFX(bad, { edgeThreshold: .3 })).pass, true);
  const invisible = await fixture(t, { paint: 'frame.pigment.fill(.001,0,16);' + centerMark });
  assert.equal((await checkFX(invisible)).checks.find(c => c.id === 'CHK-02').pass, true);
});

test('CHK-04 rejects blank, all-one and invalid channels', async t => {
  for (const paint of ['', 'frame.pigment.fill(1);', 'frame.pigment[136]=NaN;',
    centerMark + 'frame.wetness[136]=Infinity;', centerMark + 'frame.tint[136]=3;']) {
    const checked = await checkFX(await fixture(t, { paint }));
    assert.equal(checked.checks.find(c => c.id === 'CHK-04').pass, false, paint);
  }
});

test('CLI check exits nonzero for invalid effects and prints all default examples', async t => {
  const originalExit = process.exitCode;
  const lines = [];
  const log = line => lines.push(line);
  t.after(() => { process.exitCode = originalExit; });
  process.exitCode = 0;
  await checkMain([], { log });
  assert.equal(process.exitCode, 0);
  assert.equal(lines.filter(line => line.includes('PASS CHK-01')).length, effects.length);
  await checkMain([await fixture(t)], { log });
  assert.equal(process.exitCode, 1);
});

test('contact sheet includes endpoints, origin overlays and measured fill in JSON', async t => {
  const dir = await temporary(t), file = join(root, effectPaths['sword-qi-slash']);
  const result = await renderFX(file, { seed: 42, count: 4, columns: 2, outDir: dir });
  const png = decodePNG(await readFile(result.png));
  const stats = JSON.parse(await readFile(result.json, 'utf8'));
  assert.equal(png.w, stats.sheet.w); assert.equal(png.h, stats.sheet.h);
  assert.equal(stats.sheet.selected[0], 0);
  assert.equal(stats.sheet.selected.at(-1), stats.frames.length - 1);
  assert.equal(stats.frames[0].time, 0); assert.equal(stats.frames.at(-1).time, 1.3);
  assert.equal(stats.frames[0].fillRatio, 0, 'diagnostic overlays are excluded');
  assert.equal(stats.simulationHz, 120);
  const sampled = sampleFX(await loadFX(file), { seed: 42 });
  assert.equal(stats.hash, sampled.hash);
  const x = 16 + 14 + stats.meta.ox, y = stats.sheet.headerH + 25 + stats.meta.oy;
  const pixel = (x, y) => [...png.pixels.subarray((y * png.w + x) * 4, (y * png.w + x) * 4 + 3)];
  assert.notDeepEqual(pixel(x, y), pixel(x + 7, y), 'crosshair is visible on blank frame');
});

test('invalid options, unknown effects, missing modules and bad metadata fail clearly', async t => {
  assert.throws(() => parseArgs(['--unknown','1'], []), /Unknown option/);
  assert.throws(() => parseArgs(['--seed'], ['seed']), /Missing value/);
  assert.throws(() => numberOption({ seed: 'oops' }, 'seed', 1), /numeric/);
  assert.throws(() => getFX('missing'), /Unknown FX/);
  assert.throws(() => sampleFX(effects[0], { seed: -1 }), /uint32/);
  assert.throws(() => sampleFX(effects[0], { fps: 0 }), /fps/);
  await assert.rejects(() => checkFX('missing.mjs', { edgeThreshold: 2 }), /threshold/);
  assert.equal((await checkFX('missing.mjs')).pass, false);
  const file = join(await temporary(t), 'invalid.mjs'); await writeFile(file, 'export const meta = {};');
  assert.equal((await checkFX(file)).pass, false);
  await assert.rejects(() => renderFX(effectPaths['sword-qi-slash'], { count: 1 }), /frames/);
  await assert.rejects(() => withoutMathRandom(() => { throw new Error('fixture'); }), /fixture/);
});
