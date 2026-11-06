import test from 'node:test';
import assert from 'node:assert/strict';

// Exercise the real browser entry and pixel pipeline with a minimal DOM adapter.
// This verifies control behavior without requiring a browser or local TCP port.
test('gallery selects every effect and palette, validates seed, scrubs and replays', async t => {
  const globals = ['document', 'ImageData', 'requestAnimationFrame'];
  const previous = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  t.after(() => globals.forEach((name, i) => {
    if (previous[i]) Object.defineProperty(globalThis, name, previous[i]);
    else delete globalThis[name];
  }));
  class Element {
    children = []; events = {}; attributes = {}; value = ''; textContent = ''; innerHTML = '';
    classList = { toggle: () => {} };
    style = { setProperty: () => {} };
    addEventListener(name, fn) { this.events[name] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(child) { this.children.push(child); }
    click() { this.events.click?.({ target: this }); }
    dispatch(name) { this.events[name]?.({ target: this }); }
  }
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  };
  let rendered, nextAnimation;
  get('canvas').getContext = () => ({ putImageData: image => { rendered = image; } });
  get('seed').value = '1';
  globalThis.document = { getElementById: get, createElement: () => new Element(), documentElement: new Element() };
  globalThis.ImageData = class { constructor(data, width, height) { Object.assign(this, { data, width, height }); } };
  globalThis.requestAnimationFrame = fn => { nextAnimation = fn; };
  await import('../gallery/gallery.js');
  assert.equal(get('effects').children.length, 5);
  assert.equal(get('palettes').children.length, 4);
  assert.equal(rendered.data.length, 224 * 224 * 4);
  const initial = rendered.data.slice();
  get('palettes').children[2].click();
  assert.notDeepEqual(rendered.data, initial);
  get('seed').value = '-1'; get('seed').dispatch('change');
  assert.match(get('status').textContent, /Seed must/);
  get('seed').value = '42'; get('seed').dispatch('change');
  assert.equal(get('status').textContent, 'Deterministic by nature.');
  for (const button of get('effects').children) {
    button.click();
    assert.equal(button.attributes['aria-pressed'], true);
    assert.ok(rendered.data.some((value, i) => i % 4 !== 3 && value < 100));
  }
  get('effects').children[0].click();
  get('play').click();
  assert.equal(get('timeline').value, 0, 'play starts the preview gesture at its windup');
  nextAnimation(1000); nextAnimation(1040);
  assert.ok(get('timeline').value > 0);
  get('play').click();
  assert.equal(get('play').attributes['aria-label'], 'Play effect');
  get('timeline').value = '0.625'; get('timeline').dispatch('input');
  assert.equal(get('timeline').value, .625);
  const scrubbed = rendered.data.slice();
  get('timeline').dispatch('input');
  assert.deepEqual(rendered.data, scrubbed, 'seeking is deterministic');
  get('replay').click();
  assert.equal(get('timeline').value, 0);
  assert.equal(get('play').attributes['aria-label'], 'Pause effect');
  get('next-seed').click();
  assert.equal(get('seed').value, 43);
  for (let now = 2000; now <= 4000; now += 50) nextAnimation(now);
  assert.equal(get('play').attributes['aria-label'], 'Play effect');
  assert.ok(Math.abs(get('timeline').value - .75) < 1e-8);
});
