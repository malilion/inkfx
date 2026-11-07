import test from 'node:test';
import assert from 'node:assert/strict';
import { effects, categoryCounts } from '../src/fx/index.js';

// Run the real browser module and real pixel renderer, controlling only DOM and visibility.
test('gallery controls, visible-only playback, slow motion, actor, palette and filters', async t => {
  const globals = ['document', 'ImageData', 'requestAnimationFrame', 'IntersectionObserver', 'navigator', 'fetch'];
  const previous = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  t.after(() => globals.forEach((name, i) => {
    if (previous[i]) Object.defineProperty(globalThis, name, previous[i]); else delete globalThis[name];
  }));
  let rendered, nextAnimation, observed = [], onIntersection, actorCalls = 0, copied;
  const ctx = { putImageData(image) { rendered = image; }, save() { actorCalls++; }, restore() {}, beginPath() {},
    arc() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {} };
  class Element {
    children = []; events = {}; attributes = {}; dataset = {}; value = ''; textContent = ''; innerHTML = ''; checked = false; hidden = false;
    classList = { toggle() {} }; style = { setProperty() {} };
    addEventListener(name, fn) { this.events[name] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    append(...children) { this.children.push(...children); }
    click() { return this.events.click?.({ target: this, currentTarget: this, preventDefault() {} }); }
    dispatch(name) { return this.events[name]?.({ target: this, currentTarget: this }); }
    getContext() { return ctx; }
    scrollIntoView() {}
  }
  const elements = new Map(), get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  get('seed').value = '1';
  globalThis.document = { getElementById: get, createElement: () => new Element(), documentElement: new Element(), addEventListener() {} };
  globalThis.ImageData = class { constructor(data, width, height) { Object.assign(this, { data, width, height }); } };
  globalThis.requestAnimationFrame = fn => { nextAnimation = fn; };
  globalThis.IntersectionObserver = class {
    constructor(fn) { onIntersection = fn; }
    observe(element) { observed.push(element); }
    unobserve() {}
  };
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async text => { copied = text; } } } });
  await import('../gallery/gallery.js');
  assert.equal(get('effects').children.length, effects.length);
  assert.equal(get('fx-grid').children.length, effects.length);
  assert.equal(observed.length, effects.length);
  assert.equal(get('palettes').children.length, 4);
  const initial = rendered.data.slice();
  get('palettes').children[2].click(); assert.notDeepEqual(rendered.data, initial);
  assert.equal(get('toolbar-palette').value, 'shiqing');
  get('toolbar-palette').value = 'nijin'; get('toolbar-palette').dispatch('change');
  get('grain').value = '0'; get('grain').dispatch('input'); const noGrain = rendered.data.slice();
  get('grain').value = '3'; get('grain').dispatch('input'); assert.notDeepEqual(rendered.data, noGrain);
  get('act-toggle').checked = true; get('act-toggle').dispatch('change'); assert.ok(actorCalls > 0);
  get('seed').value = '-1'; get('seed').dispatch('change'); assert.match(get('status').textContent, /Seed must/);
  get('seed').value = '42'; get('seed').dispatch('change'); assert.equal(get('status').textContent, 'Deterministic by nature.');
  for (const button of get('effects').children) { button.click(); assert.equal(button.attributes['aria-pressed'], true); }
  const swordIndex = effects.findIndex(fx => fx.meta.id === 'sword-qi-slash');
  get('effects').children[swordIndex].click();
  await get('copy-path').click(); assert.equal(copied, 'src/fx/sword/sword-qi-slash.js');
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/fx/sword/sword-qi-slash.js', import.meta.url), 'utf8');
  globalThis.fetch = async path => {
    assert.equal(path, '../src/fx/sword/sword-qi-slash.js');
    return { ok: true, text: async () => source };
  };
  await get('copy-source').click(); assert.equal(copied, source);
  assert.match(get('status').textContent, /keep imports/);
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await get('copy-source').click(); assert.match(get('status').textContent, /HTTP 404/);
  globalThis.fetch = async () => ({ ok: true, text: async () => source });
  navigator.clipboard.writeText = async () => { throw new Error('Clipboard permission denied'); };
  await get('copy-source').click(); assert.match(get('status').textContent, /View single-file JS/);
  get('play').click(); assert.equal(get('timeline').value, 0);
  nextAnimation(1000); nextAnimation(1040); assert.ok(get('timeline').value > 0);
  get('play').click(); assert.equal(get('play').attributes['aria-label'], 'Play effect');
  get('timeline').value = '.625'; get('timeline').dispatch('input'); const scrubbed = rendered.data.slice();
  get('timeline').dispatch('input'); assert.deepEqual(rendered.data, scrubbed);
  get('replay').click(); get('slow-toggle').checked = true; get('slow-toggle').dispatch('change');
  nextAnimation(1100); nextAnimation(1140); assert.ok(Math.abs(get('timeline').value - .01) < 1e-8);
  get('slow-toggle').checked = false; get('slow-toggle').dispatch('change');
  for (let now = 1200; now <= 3000; now += 50) nextAnimation(now);
  assert.equal(get('play').attributes['aria-label'], 'Play effect');
  assert.ok(Math.abs(get('timeline').value - 1.3) < 1e-8);
  // No effect state exists until a card enters the viewport.
  const first = observed[0], second = observed[1];
  assert.equal(first.dataset.time, undefined);
  onIntersection([{ target: first, isIntersecting: true }]); nextAnimation(3100); nextAnimation(3150);
  assert.ok(Number(first.dataset.time) > 0); assert.equal(second.dataset.time, undefined);
  const stopped = first.dataset.time;
  onIntersection([{ target: first, isIntersecting: false }]); nextAnimation(3200); nextAnimation(3250);
  assert.equal(first.dataset.time, stopped, 'offscreen playback pauses');
  get('category-filter').value = 'zen'; get('category-filter').dispatch('change');
  assert.equal(get('fx-grid').children.filter(card => !card.hidden).length, categoryCounts.zen);
  assert.equal(get('visible-count').textContent, `${categoryCounts.zen} effects`);
  get('next-seed').click(); assert.equal(get('seed').value, 43);
  const loopIndex = effects.findIndex(fx => fx.meta.id === 'enso-breath');
  get('effects').children[loopIndex].click(); get('replay').click();
  const loopCard = observed[loopIndex];
  onIntersection([{ target: loopCard, isIntersecting: true }]);
  const duration = effects[loopIndex].meta.duration;
  for (let elapsed = 0; elapsed <= duration + .3; elapsed += .05) nextAnimation(4000 + elapsed * 1000);
  assert.equal(get('play').attributes['aria-label'], 'Pause effect', 'loop preview keeps playing');
  assert.ok(Number(loopCard.dataset.time) > duration, 'loop thumbnails advance without a blank hold');
  assert.ok(Number(get('timeline').value) < duration, 'loop timeline wraps');
});
