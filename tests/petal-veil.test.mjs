import test from 'node:test';
import assert from 'node:assert/strict';
import * as petal from '../src/fx/transitions/petal-veil.js';
import { sampleFX } from '../src/core/run.js';

test('cached petal geometry preserves original animation bytes across seeds and palettes', () => {
  // Captured from the original per-pixel trigonometric renderer before caching.
  // Hashes cover every channel and RGBA at 30fps across the entire animation.
  assert.equal(sampleFX(petal, { seed: 42, palette: 'songyan' }).hash,
    'afb9131267dd56cf4f866ced66f65842d3fa15d33d0dfc604ef0965f42039a46');
  assert.equal(sampleFX(petal, { seed: 0, palette: 'shiqing' }).hash,
    '223a95310cc71fc1cd7a8cac97ca2e1c67b90e5969ebc5799a5deaa34624ff1a');
});
