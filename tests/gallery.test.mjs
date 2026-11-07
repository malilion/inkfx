import test from 'node:test';
import assert from 'node:assert/strict';
import { effects, categoryCounts } from '../src/fx/index.js';
import { drawActor } from '../gallery/actor.js';

test('practice dummy samples impact, hit-stop and recovery from the display clock', () => {
  const slash = effects.find(fx => fx.meta.id === 'sword-qi-slash');
  const [hit] = slash.act.hits, impact = slash.act.windup + hit.t;
  function frame(time, seed = 42) {
    const droplets = [], rotations = [];
    const context = {
      save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, translate() {}, fillText() {},
      arc(x, y, radius) { droplets.push([x, y, radius]); },
      rotate(angle) { rotations.push(angle); },
    };
    const shake = drawActor(context, slash, time, seed);
    return { droplets, angle: rotations[0], shake };
  }
  assert.deepEqual(frame(impact - .01), { droplets: [], angle: 0, shake: 0 });
  const first = frame(impact + .01), held = frame(impact + .06);
  assert.equal(first.droplets.length, hit.inkSplash);
  assert.deepEqual(held.droplets, first.droplets);
  assert.equal(held.angle, first.angle);
  assert.notEqual(held.shake, first.shake);
  assert.ok(first.angle > 0 && Math.abs(first.shake) <= hit.shakeAmp);
  assert.notDeepEqual(frame(impact + .01, 43).droplets, first.droplets);
  assert.notDeepEqual(frame(impact + hit.freeze + .08).droplets, first.droplets);
  assert.deepEqual(frame(impact + hit.freeze + .35), { droplets: [], angle: 0, shake: 0 });
});

// Run the real browser module and real pixel renderer, controlling only DOM and visibility.
test('gallery controls, visible-only playback, slow motion, actor, palette and filters', async t => {
  const globals = ['document', 'ImageData', 'requestAnimationFrame', 'IntersectionObserver', 'navigator', 'fetch'];
  const previous = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  t.after(() => globals.forEach((name, i) => {
    if (previous[i]) Object.defineProperty(globalThis, name, previous[i]); else delete globalThis[name];
  }));
  let rendered, nextAnimation, observed = [], onIntersection, actorCalls = 0, copied;
  const ctx = { putImageData(image) { rendered = image; }, save() { actorCalls++; }, restore() {}, beginPath() {},
    arc() {}, moveTo() {}, lineTo() {}, stroke() {}, fillText() {}, translate() {}, rotate() {}, fill() {} };
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
  for (const id of ['catalog-count', 'explore-count', 'collection-count']) assert.equal(get(id).textContent, effects.length);
  assert.equal(observed.length, effects.length);
  assert.equal(get('palettes').children.length, 4);
  assert.equal(get('fx-grid').children.filter(card => !card.hidden).length, 12);
  get('catalog-more-button').click();
  assert.equal(get('fx-grid').children.filter(card => !card.hidden).length, 24);
  const initial = rendered.data.slice();
  get('palettes').children[2].click(); assert.notDeepEqual(rendered.data, initial);
  assert.equal(get('toolbar-palette').value, 'shiqing');
  get('toolbar-palette').value = 'nijin'; get('toolbar-palette').dispatch('change');
  get('grain').value = '0'; get('grain').dispatch('input'); const noGrain = rendered.data.slice();
  get('grain').value = '3'; get('grain').dispatch('input'); assert.notDeepEqual(rendered.data, noGrain);
  get('act-toggle').checked = true; get('act-toggle').dispatch('change'); assert.ok(actorCalls > 0);
  get('seed').value = '-1'; get('seed').dispatch('change'); assert.match(get('status').textContent, /種子必須是/);
  get('seed').value = '42'; get('seed').dispatch('change'); assert.equal(get('status').textContent, '種子已更新，畫面可重現。');
  for (const button of get('effects').children) { button.click(); assert.equal(button.attributes['aria-pressed'], true); }
  const swordIndex = effects.findIndex(fx => fx.meta.id === 'sword-qi-slash');
  get('effects').children[swordIndex].click();
  await get('copy-path').click(); assert.equal(copied, 'src/fx/sword/sword-qi-slash.js');
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/fx/sword/sword-qi-slash.js', import.meta.url), 'utf8');
  globalThis.fetch = async path => {
    assert.equal(path, './standalone/sword-qi-slash.mjs');
    return { ok: true, text: async () => source };
  };
  await get('copy-source').click(); assert.equal(copied, source);
  assert.match(get('status').textContent, /獨立 ES module/);
  assert.equal(get('source-link').download, 'sword-qi-slash.mjs');
  globalThis.fetch = async () => ({ ok: false, status: 404 });
  await get('copy-source').click(); assert.match(get('status').textContent, /HTTP 404/);
  globalThis.fetch = async () => ({ ok: true, text: async () => source });
  navigator.clipboard.writeText = async () => { throw new Error('Clipboard permission denied'); };
  await get('copy-source').click(); assert.match(get('status').textContent, /單檔 JS/);
  get('play').click(); assert.equal(get('timeline').value, 0);
  nextAnimation(1000); nextAnimation(1040); assert.ok(get('timeline').value > 0);
  get('play').click(); assert.equal(get('play').attributes['aria-label'], '播放特效');
  get('timeline').value = '.625'; get('timeline').dispatch('input'); const scrubbed = rendered.data.slice();
  get('timeline').dispatch('input'); assert.deepEqual(rendered.data, scrubbed);
  get('next-frame').click(); assert.equal(get('timeline').value, 76 / 120);
  get('prev-frame').click(); assert.equal(get('timeline').value, .625);
  get('replay').click(); get('slow-toggle').checked = true; get('slow-toggle').dispatch('change');
  nextAnimation(1100); nextAnimation(1140); assert.ok(Math.abs(get('timeline').value - .01) < 1e-8);
  get('slow-toggle').checked = false; get('slow-toggle').dispatch('change');
  for (let now = 1200; now <= 3000; now += 50) nextAnimation(now);
  assert.equal(get('play').attributes['aria-label'], '播放特效');
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
  assert.equal(get('visible-count').textContent, `${categoryCounts.zen} 式`);
  get('catalog-search').value = 'enso'; get('catalog-search').dispatch('input');
  assert.equal(get('fx-grid').children.filter(card => !card.hidden).length, 1);
  get('catalog-search').value = 'none'; get('catalog-search').dispatch('input');
  assert.equal(get('catalog-empty').hidden, false);
  get('catalog-reset').click(); assert.equal(get('catalog-empty').hidden, true);
  get('next-seed').click(); assert.equal(get('seed').value, 43);
  const loopIndex = effects.findIndex(fx => fx.meta.id === 'enso-breath');
  get('effects').children[loopIndex].click(); get('replay').click();
  const loopCard = get('fx-grid').children.find(card => card.children[2].textContent.endsWith('/ enso-breath'));
  onIntersection([{ target: loopCard, isIntersecting: true }]);
  const duration = effects[loopIndex].meta.duration;
  for (let elapsed = 0; elapsed <= duration + .3; elapsed += .05) nextAnimation(4000 + elapsed * 1000);
  assert.equal(get('play').attributes['aria-label'], '暫停特效', 'loop preview keeps playing');
  assert.ok(Number(loopCard.dataset.time) > duration, 'loop thumbnails advance without a blank hold');
  assert.ok(Number(get('timeline').value) < duration, 'loop timeline wraps');
  const elapsed = get('timeline').value;
  get('play').click(); get('play').click();
  assert.equal(get('timeline').value, elapsed, 'resuming a later cycle preserves time');
  get('next-seed').click();
  assert.equal(get('timeline').value, elapsed, 'changing seed preserves the visible loop phase');
  get('timeline').value = 0; get('timeline').dispatch('input');
  get('prev-frame').click(); assert.equal(get('timeline').value, (duration * 120 - 1) / 120);
  get('next-frame').click(); assert.equal(get('timeline').value, 0);
});
