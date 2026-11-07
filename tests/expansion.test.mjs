import test from 'node:test';
import assert from 'node:assert/strict';
import { getFX } from '../src/fx/index.js';

test('tea steam repeats after a full cycle and keeps seeded motion', () => {
  const entry = getFX('tea-steam');
  const starts = [];
  for (const seed of [0, 42, 4294967295]) {
    const fx = entry.create({ seed }), first = fx.frame.pigment.slice();
    starts.push(first);
    fx.step(entry.meta.duration); assert.deepEqual(fx.frame.pigment, first);
    fx.step(.5); assert.notDeepEqual(fx.frame.pigment, first, 'steam must animate within the loop');
  }
  assert.notDeepEqual(starts[0], starts[1], 'seed changes the steam curves');
});

test('meteor approaches the impact point and holds its ink through hit-stop', () => {
  const entry = getFX('meteor-crater'), fx = entry.create({ seed: 42 });
  const center = frame => {
    let x = 0, y = 0, mass = 0;
    for (let i = 0; i < frame.pigment.length; i++) {
      const p = frame.pigment[i]; mass += p; x += i % frame.w * p; y += Math.floor(i / frame.w) * p;
    }
    assert.ok(mass > 0); return { x: x / mass, y: y / mass };
  };
  const start = center(fx.frame); fx.step(.25); const incoming = center(fx.frame);
  assert.ok(incoming.x > start.x + 30 && incoming.y > start.y + 40);
  const frozen = entry.create({ seed: 42 }); frozen.step(.325);
  const first = frozen.frame.pigment.slice(); frozen.step(.05);
  assert.deepEqual(frozen.frame.pigment, first);
});

test('rain-pool wipe grows monotonically to a fully covered canvas', () => {
  const entry = getFX('rain-pool-wipe'), patterns = [];
  for (const seed of [0, 42, 4294967295]) {
    const fx = entry.create({ seed }); let previous = 0;
    for (const time of [0, .2, .4, .6, .8, 1.2]) {
      fx.step(time - fx.t);
      const frame = fx.frame, occupied = frame.pigment.reduce((n, p) => n + (p > .004), 0);
      assert.ok(occupied >= previous, `coverage regressed at ${time}`); previous = occupied;
      if (time === .4) patterns.push(frame.pigment.map(p => p > .004 ? 1 : 0));
    }
    assert.equal(previous, entry.meta.w * entry.meta.h);
  }
  assert.notDeepEqual(patterns[0], patterns[1], 'seed changes the rain fronts');
});
