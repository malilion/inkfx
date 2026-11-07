import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createInkFrame } from '../src/core/frame.js';
import { mulberry32 } from '../src/core/seed.js';
import { composite } from '../src/core/compositor.js';

test('compositor optimization preserves original palette, alpha and paper bytes', () => {
  // Golden bytes from the original channel-loop compositor, including clamp
  // edges, nonlinear ramp knots, transparent colored pixels, and invalid input.
  for (const [seed, expected] of [
    [0, '4d22f85f610943e85f8deb6a53a22ce5e3c040d8b24b3c9f08bd498e3b95ad41'],
    [42, '0b48d4c665da79fdff76799e21dee1c881d23baa59477f94e09e15b56ed72cd3'],
  ]) {
    const frame = createInkFrame(997, 2, { seed }), random = mulberry32(seed);
    const special = [0, .004, .003999, .07, .22, .45, .73, 1, NaN, Infinity, -Infinity];
    for (let i = 0; i < frame.pigment.length; i++) {
      frame.pigment[i] = i < special.length ? special[i] : random() * 1.2 - .1;
      frame.tint[i] = i % 3;
    }
    const hash = createHash('sha256');
    for (const palette of ['songyan', 'zhusha', 'shiqing', 'nijin']) {
      for (const paper of [false, true]) for (const grain of [0, 1, 3]) hash.update(composite(frame, palette, { paper, grain }));
    }
    assert.equal(hash.digest('hex'), expected);
  }
});
