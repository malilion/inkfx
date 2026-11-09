import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { effects } from '../src/fx/index.js';
import { buildStandalone } from '../tools/build-standalone.mjs';

test('every standalone module works outside the repository and preserves effect output', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'inkfx-standalone-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await buildStandalone(dir);
  assert.equal((await readdir(dir)).length, effects.length);
  for (const original of effects) {
    const file = join(dir, `${original.meta.id}.mjs`);
    const portable = await import(pathToFileURL(file));
    assert.deepEqual(portable.meta, original.meta);
    assert.deepEqual(portable.act, original.act);
    const { w, h } = original.meta;
    function draw(entry) {
      const instance = entry.create({ seed: 42, palette: 'shiqing' });
      instance.step(entry.act.windup + .24);
      return instance.draw({ w, h, data: new Uint8ClampedArray(w * h * 4) }).data;
    }
    assert.deepEqual(draw(portable), draw(original), original.meta.id);
  }
});
