import test from 'node:test';
import assert from 'node:assert/strict';
import { createInkFrame } from '../src/core/frame.js';
import { stamp } from '../src/core/feibai.js';

test('brush distance keeps tiny outside dabs empty and huge intersecting dabs visible', () => {
  const frame = createInkFrame(4, 4);
  stamp(frame, -1e-200, -1e-200, 1e-200, { wetness: 1, dryFactor: 0 });
  assert.ok(frame.pigment.every(p => p === 0), 'squared distance must not underflow to zero');
  stamp(frame, -1e200, -1e200, 1.5e200, { wetness: 1, dryFactor: 0 });
  assert.ok(frame.pigment.every(p => p > 0 && Number.isFinite(p)), 'squared distance must not overflow');
});
