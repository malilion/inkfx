import { effects, effectPaths, categoryCounts } from '../src/fx/index.js';
import { palettes } from '../src/palettes/index.js';
import { composite } from '../src/core/compositor.js';
import { samplePose, actionTime } from '../src/core/act.js';
import { buildSheet } from '../src/core/sheet.js';
import { drawActor } from './actor.js';

const $ = id => document.getElementById(id);
const canvas = $('canvas'), context = canvas.getContext('2d');
let fx = effects[0], palette = 'songyan', seed = 1, effect, playing = false, last = 0, preview = true;
let grain = 1, actEnabled = false, speed = 1, gridLast = 0;
const categoryNames = { sword: ['劍式', 'SWORD'], talisman: ['符陣', 'TALISMAN'], zen: ['禪境', 'ZEN'],
  'ink-burst': ['墨擊', 'IMPACT'], transitions: ['轉場', 'TRANSITION'], ui: ['印記', 'UI'] };
const featured = ['sword-qi-slash', 'enso-breath', 'bagua-array', 'ink-iris', 'meteor-crater', 'jade-pendant'];
const catalogBatch = 12;
let catalogLimit = catalogBatch;
const cards = [], visible = new Set();
const cardByElement = new WeakMap();
const categoryButtons = new Map();
const previewBuffers = new Map();
const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
const swordIndex = effects.findIndex(entry => entry.meta.id === 'sword-qi-slash');
const standalonePath = entry => `./standalone/${entry.meta.id}.mjs`;

function notify(text, state = '') {
  $('status').textContent = text;
  $('status').dataset.state = state;
}

function feedback(button, message) {
  const original = button.dataset.originalLabel ?? button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = message;
  clearTimeout(button.feedbackTimer);
  button.feedbackTimer = setTimeout(() => { button.textContent = original; }, 1600);
}

function paint(ctx, entry, instance) {
  const { w, h } = entry.meta, size = `${w}x${h}`;
  let pixels = previewBuffers.get(size);
  if (!pixels) {
    pixels = new ImageData(new Uint8ClampedArray(w * h * 4), w, h);
    previewBuffers.set(size, pixels);
  }
  composite(instance.frame, palette, { paper: true, grain }, pixels.data);
  ctx.putImageData(pixels, 0, 0);
  const shake = actEnabled ? drawActor(ctx, entry, displayTime(entry, instance), seed) : 0;
  if (ctx === context) canvas.style.transform = shake ? `translateX(${shake}px)` : '';
}
function displayTime(entry = fx, instance = effect) {
  return entry.meta.loop ? instance.t % entry.meta.duration : Math.min(instance.t, entry.meta.duration);
}
function display() {
  paint(context, fx, effect);
  const time = displayTime();
  $('timeline').value = time;
  $('time').textContent = `${time.toFixed(3)} / ${fx.meta.duration.toFixed(3)}s`;
  $('pose').textContent = samplePose(fx.act, actionTime(fx.act, time - fx.act.windup)).poseId;
}
function seek(time) {
  effect = fx.create({ seed, palette }); effect.step(time); display();
}
function setPlaying(value) {
  playing = value; last = 0;
  $('play').innerHTML = value ? '<span aria-hidden="true">Ⅱ</span> 暫停' : '<span aria-hidden="true">▶</span> 播放';
  $('play').setAttribute('aria-label', value ? '暫停特效' : '播放特效');
}
function stepFrame(direction) {
  const time = displayTime();
  const tick = direction > 0 ? Math.floor(time * 120 + 1e-8) + 1 : Math.ceil(time * 120 - 1e-8) - 1;
  const count = Math.ceil(fx.meta.duration * 120);
  const next = (fx.meta.loop ? (tick + count) % count : Math.max(0, tick)) / 120;
  preview = false;
  setPlaying(false);
  seek(Math.min(fx.meta.duration, next));
}
function componentExamples() {
  const player = `import { create, meta } from './${fx.meta.id}.mjs';

function mountInk(canvas, seed) {
  const ctx = canvas.getContext('2d');
  const fx = create({ seed, palette: '${palette}' });
  const pixels = new ImageData(meta.w, meta.h);
  let last, raf;
  function draw(now) {
    if (last !== undefined) {
      const dt = Math.min((now - last) / 1000, .05);
      fx.step(meta.loop ? dt : Math.min(dt, meta.duration - fx.t));
    }
    last = now;
    ctx.putImageData(fx.draw(pixels), 0, 0);
    if (meta.loop || fx.t < meta.duration) raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(raf);
}`;
  return `// React / Ink.jsx
import { useEffect, useRef } from 'react';
${player}

export default function Ink({ seed = ${seed} }) {
  const canvas = useRef(null);
  useEffect(() => mountInk(canvas.current, seed), [seed]);
  return <canvas ref={canvas} width={meta.w} height={meta.h} />;
}

<!-- Vue 3 / Ink.vue -->
<script setup>
import { ref, watchPostEffect } from 'vue';
${player}

const props = defineProps({ seed: { type: Number, default: ${seed} } });
const canvas = ref(null);
watchPostEffect(onCleanup => {
  if (canvas.value) onCleanup(mountInk(canvas.value, props.seed));
});
</script>
<template>
  <canvas ref="canvas" :width="meta.w" :height="meta.h" />
</template>`;
}
function selectEffect(index) {
  fx = effects[index]; setPlaying(false);
  canvas.width = fx.meta.w; canvas.height = fx.meta.h;
  $('timeline').max = fx.meta.duration;
  $('dimensions').textContent = `${fx.meta.w} × ${fx.meta.h}`;
  $('category').textContent = categoryNames[fx.meta.category].join(' / ');
  $('effect-title').textContent = fx.meta.name;
  $('canvas').setAttribute('aria-label', `${fx.meta.name}特效試演`);
  $('figure').textContent = String(index + 1).padStart(2, '0');
  $('windup').textContent = `${fx.act.windup.toFixed(2)}s`;
  $('freeze').textContent = `${fx.act.hits.reduce((sum, hit) => sum + hit.freeze, 0).toFixed(2)}s`;
  $('source-link').href = standalonePath(fx);
  $('source-link').download = `${fx.meta.id}.mjs`;
  $('sheet-link').href = `../examples/out/${fx.meta.id}/sheet.png`;
  $('atlas-link').href = `../examples/out/${fx.meta.id}/sheet.json`;
  $('component-examples').textContent = componentExamples();
  for (const [i, button] of [...$('effects').children].entries()) {
    button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', i === index);
  }
  for (const card of cards) card.control.setAttribute('aria-current', card.entry === fx);
  seek(fx.meta.loop ? .5 : fx.act.windup + .24); preview = true;
}
function focusStudio() {
  $('workbench-title').focus?.({ preventScroll: true });
  $('workbench').scrollIntoView({ behavior: 'instant', block: 'start' });
}
async function copyPath(entry, button) {
  const path = effectPaths[entry.meta.id];
  try {
    await navigator.clipboard.writeText(path);
    notify(`已複製 ${path}`, 'copied');
    if (button) feedback(button, '已複製');
  } catch {
    notify(`模組路徑：${path}`, 'error');
    if (button) feedback(button, '複製失敗');
  }
}
async function copySource(entry, button) {
  async function load() {
    const response = await fetch(standalonePath(entry));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  }
  try {
    const clipboard = navigator.clipboard;
    if (clipboard?.write && typeof ClipboardItem === 'function') {
      const source = load().then(text => new Blob([text], { type: 'text/plain' }));
      await Promise.all([source, clipboard.write([new ClipboardItem({ 'text/plain': source })])]);
    } else await clipboard.writeText(await load());
    notify(`已複製「${entry.meta.name}」。請存成獨立 ES module：${entry.meta.id}.mjs。`, 'copied');
    if (button) feedback(button, '已複製');
  } catch (error) {
    notify(`複製失敗：${error.message}。可改用「單檔 JS ↓」下載。`, 'error');
    if (button) feedback(button, '複製失敗');
  }
}
const blobURLs = new Map();
function downloadBlob(blob, filename, link) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  const old = blobURLs.get(link); if (old) URL.revokeObjectURL(old);
  link.href = url; link.download = filename; blobURLs.set(link, url);
}
async function downloadSheet(event, entry, atlasOnly = false) {
  event.preventDefault();
  const link = event.currentTarget;
  if (link.dataset.busy) return;
  const options = { seed, palette, grain };
  const stem = `${entry.meta.id}-${options.palette}-seed${options.seed}`;
  link.dataset.busy = 'true'; link.setAttribute('aria-busy', 'true');
  notify(`正在烘焙「${entry.meta.name}」…`, 'busy');
  await new Promise(resolve => requestAnimationFrame(resolve));
  try {
    const sheet = buildSheet(entry, options);
    sheet.atlas.meta.image = `${stem}.png`;
    if (atlasOnly) downloadBlob(new Blob([JSON.stringify(sheet.atlas, null, 2)], { type: 'application/json' }), `${stem}.json`, link);
    else {
      const surface = document.createElement('canvas'); surface.width = sheet.w; surface.height = sheet.h;
      surface.getContext('2d').putImageData(new ImageData(sheet.data, sheet.w, sheet.h), 0, 0);
      const blob = await new Promise(resolve => surface.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      downloadBlob(blob, `${stem}.png`, link);
    }
    notify(`已匯出「${entry.meta.name}」。PNG 和 JSON 使用相同種子與墨色。`, 'exported');
    if (link.dataset.cardAction) feedback(link, '已匯出');
  } catch (error) {
    notify(`匯出失敗：${error.message}`, 'error');
    if (link.dataset.cardAction) feedback(link, '匯出失敗');
  }
  finally { delete link.dataset.busy; link.removeAttribute('aria-busy'); }
}
const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    const card = cardByElement.get(entry.target);
    if (!card) continue;
    if (entry.isIntersecting && !card.element.hidden) visible.add(card); else visible.delete(card);
  }
}, { threshold: .05 }) : null;

effects.forEach((entry, index) => {
  const button = document.createElement('button'); button.className = 'effect';
  button.innerHTML = `<span class="effect-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${entry.meta.name}</strong><small>${entry.meta.id}</small></span><span class="effect-arrow">↗</span>`;
  button.addEventListener('click', () => {
    selectEffect(index);
    $('effect-picker').removeAttribute('open');
    $('play').focus?.({ preventScroll: true });
  });
  $('effects').append(button);
  const element = document.createElement('article'); element.className = 'fx-card'; element.dataset.category = entry.meta.category;
  if (featured.slice(0, 2).includes(entry.meta.id)) element.dataset.cover = entry.meta.id;
  const open = document.createElement('button'); open.className = 'card-preview'; open.setAttribute('aria-label', `試演${entry.meta.name}`);
  const thumbnail = document.createElement('canvas'); thumbnail.width = entry.meta.w; thumbnail.height = entry.meta.h;
  thumbnail.setAttribute('aria-hidden', 'true');
  const number = document.createElement('span'); number.className = 'card-number'; number.textContent = String(index + 1).padStart(3, '0'); number.setAttribute('aria-hidden', 'true');
  const arrow = document.createElement('span'); arrow.className = 'card-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
  open.append(thumbnail, number, arrow);
  open.addEventListener('click', () => { selectEffect(index); focusStudio(); });
  const title = document.createElement('h3'); title.textContent = entry.meta.name;
  const caption = document.createElement('p'); caption.textContent = `${categoryNames[entry.meta.category][0]} / ${entry.meta.id}`;
  const actions = document.createElement('div'); actions.className = 'card-actions';
  const copy = document.createElement('button'); copy.textContent = '路徑'; copy.addEventListener('click', () => copyPath(entry, copy));
  const source = document.createElement('button'); source.textContent = '複製 JS'; source.addEventListener('click', () => copySource(entry, source));
  const sheet = document.createElement('a'); sheet.textContent = 'PNG ↓'; sheet.href = `../examples/out/${entry.meta.id}/sheet.png`; sheet.download = `${entry.meta.id}.png`; sheet.dataset.cardAction = 'true';
  sheet.addEventListener('click', event => downloadSheet(event, entry));
  const atlas = document.createElement('a'); atlas.textContent = 'JSON ↓'; atlas.href = `../examples/out/${entry.meta.id}/sheet.json`; atlas.download = `${entry.meta.id}.json`; atlas.dataset.cardAction = 'true';
  atlas.addEventListener('click', event => downloadSheet(event, entry, true));
  actions.append(source, sheet, atlas, copy); element.append(open, title, caption, actions);
  const card = { element, entry, control: open, context: thumbnail.getContext('2d'), instance: null, hold: 0 };
  cards.push(card); cardByElement.set(element, card);
});
const curated = featured.map(id => cards.find(card => card.entry.meta.id === id)).filter(Boolean);
const orderedCards = [...curated, ...cards.filter(card => !curated.includes(card))];
for (const card of orderedCards) {
  $('fx-grid').append(card.element);
  if (observer) observer.observe(card.element); else visible.add(card);
}
function resetCards() { for (const card of cards) { card.instance = null; card.hold = 0; } gridLast = 0; }
function setPalette(id) {
  palette = id;
  for (const button of $('palettes').children) { const active = button.dataset.palette === id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); }
  $('toolbar-palette').value = id;
  document.documentElement.style.setProperty('--paper', palettes[id].stops[0]);
  $('component-examples').textContent = componentExamples(); display();
  for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance);
}
for (const [id, entry] of Object.entries(palettes)) {
  const button = document.createElement('button'); button.className = `palette ${id === palette ? 'active' : ''}`; button.dataset.palette = id;
  button.setAttribute('aria-pressed', id === palette);
  button.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${entry.stops[5]} 55%,${entry.accent} 55%)"></span><span class="palette-name">${entry.name}</span><small>${id}</small>`;
  button.addEventListener('click', () => setPalette(id)); $('palettes').append(button);
  const option = document.createElement('option'); option.value = id; option.textContent = entry.name; $('toolbar-palette').append(option);
}
$('toolbar-palette').value = palette;
$('toolbar-palette').addEventListener('change', event => setPalette(event.target.value));
$('grain').addEventListener('input', event => { grain = Number(event.target.value); $('grain-value').textContent = grain.toFixed(1); display(); for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance); });
$('act-toggle').addEventListener('change', event => {
  actEnabled = event.target.checked;
  display();
  for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance);
});
$('slow-toggle').addEventListener('change', event => { speed = event.target.checked ? .25 : 1; last = gridLast = 0; });
for (const [category, count] of Object.entries(categoryCounts)) {
  const option = document.createElement('option'); option.value = category;
  option.textContent = `${categoryNames[category][0]}（${count}）`;
  $('category-filter').append(option);
}
for (const [id, name] of [['all', '全部'], ...Object.entries(categoryNames).map(([id, [name]]) => [id, name])]) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'category-tab'; button.textContent = name;
  button.setAttribute('aria-pressed', id === 'all');
  button.addEventListener('click', () => { $('category-filter').value = id; resetCatalogPage(); });
  categoryButtons.set(id, button); $('category-tabs').append(button);
}
for (const id of ['catalog-count', 'explore-count', 'collection-count']) $(id).textContent = effects.length;
$('catalog-edition').textContent = [...String(effects.length)].map(digit => '〇一二三四五六七八九'[Number(digit)]).join('') + '式';
$('category-filter').value = 'all';
function filterCatalog() {
  const category = $('category-filter').value;
  const query = $('catalog-search').value.trim().toLowerCase();
  const paginated = category === 'all' && !query;
  $('fx-grid').dataset.view = paginated ? 'curated' : 'filtered';
  for (const [id, button] of categoryButtons) button.setAttribute('aria-pressed', id === category);
  let count = 0, shown = 0;
  for (const card of orderedCards) {
    const meta = card.entry.meta;
    const matches = (category === 'all' || meta.category === category) &&
      (!query || `${meta.name} ${meta.id} ${categoryNames[meta.category].join(' ')}`.toLowerCase().includes(query));
    if (matches) count++;
    const show = matches && (!paginated || count <= catalogLimit);
    if (show) shown++;
    if (card.element.hidden === !show) continue;
    card.element.hidden = !show;
    if (show) {
      if (observer) observer.observe(card.element); else visible.add(card);
    } else {
      observer?.unobserve(card.element);
      visible.delete(card);
    }
  }
  $('visible-count').textContent = shown < count ? `展出 ${shown} / ${count} 式` : `${count} 式`;
  $('catalog-empty').hidden = count !== 0;
  $('catalog-more').hidden = shown >= count;
  $('catalog-more-button').textContent = `再展 ${Math.min(catalogBatch, count - shown)} 式 ↓`;
}
function resetCatalogPage() { catalogLimit = catalogBatch; filterCatalog(); }
filterCatalog();
$('category-filter').addEventListener('change', resetCatalogPage);
$('catalog-search').addEventListener('input', resetCatalogPage);
$('catalog-more-button').addEventListener('click', () => {
  const next = orderedCards[catalogLimit];
  catalogLimit += catalogBatch;
  filterCatalog();
  next?.control.focus?.();
});
$('catalog-reset').addEventListener('click', () => {
  $('catalog-search').value = '';
  $('category-filter').value = 'all';
  resetCatalogPage();
  $('catalog-search').focus?.();
});
$('opening-try').addEventListener('click', event => {
  event.preventDefault();
  selectEffect(swordIndex);
  if (!reduced?.matches) { preview = false; seek(0); setPlaying(true); }
  focusStudio();
});
$('copy-path').addEventListener('click', () => copyPath(fx));
$('copy-source').addEventListener('click', () => copySource(fx));
$('sheet-link').href = '../examples/out/sword-qi-slash/sheet.png';
$('atlas-link').href = '../examples/out/sword-qi-slash/sheet.json';
$('sheet-link').addEventListener('click', event => downloadSheet(event, fx));
$('atlas-link').addEventListener('click', event => downloadSheet(event, fx, true));
$('play').addEventListener('click', () => {
  if (!playing && (preview || (!fx.meta.loop && effect.t >= fx.meta.duration - .001))) { seek(0); preview = false; }
  setPlaying(!playing);
});
$('replay').addEventListener('click', () => { preview = false; seek(0); setPlaying(true); });
$('prev-frame').addEventListener('click', () => stepFrame(-1));
$('next-frame').addEventListener('click', () => stepFrame(1));
$('timeline').addEventListener('input', event => { preview = false; setPlaying(false); seek(Number(event.target.value)); });
function changeSeed() {
  const input = $('seed').value, next = Number(input);
  if (input === '' || !Number.isInteger(next) || next < 0 || next > 0xffffffff) {
    notify('種子必須是 0 到 4294967295 的整數。', 'error');
    return;
  }
  seed = next; notify('種子已更新，畫面可重現。');
  $('component-examples').textContent = componentExamples();
  seek(displayTime()); resetCards();
}
$('seed').addEventListener('change', changeSeed);
$('next-seed').addEventListener('click', () => { $('seed').value = (seed + 1) >>> 0; changeSeed(); });
$('download').addEventListener('click', () => {
  const filename = `inkfx-${fx.meta.id}-${palette}-seed${seed}.png`;
  canvas.toBlob(blob => {
    if (blob) { downloadBlob(blob, filename, $('download')); notify('已儲存目前一幀。', 'exported'); }
    else notify('無法儲存這一幀。', 'error');
  }, 'image/png');
});
function animate(now) {
  if (!document.hidden && playing) {
    if (last) effect.step(Math.min(Math.min((now - last) / 1000, .05) * speed, fx.meta.loop ? Infinity : Math.max(0, fx.meta.duration - effect.t)));
    last = now; display();
    if (!fx.meta.loop && effect.t >= fx.meta.duration - 1e-8) setPlaying(false);
  }
  if (!document.hidden) {
    const dt = gridLast ? Math.min((now - gridLast) / 1000, .1) * speed : 0; gridLast = now;
    for (const card of visible) {
      if (reduced?.matches) {
        if (!card.instance) {
          card.instance = card.entry.create({ seed, palette });
          card.instance.step(card.entry.meta.loop ? .5 : card.entry.act.windup + .24);
          paint(card.context, card.entry, card.instance);
        }
        continue;
      }
      if (!card.instance) {
        card.instance = card.entry.create({ seed, palette });
        if (card.element.dataset.cover) card.instance.step(card.entry.meta.loop ? .5 : card.entry.act.windup + .28);
      }
      if (card.entry.meta.loop) card.instance.step(dt);
      else if (card.instance.t >= card.entry.meta.duration) {
        card.hold += dt;
        if (card.hold <= .25) continue;
        card.instance = card.entry.create({ seed, palette }); card.hold = 0;
      } else card.instance.step(Math.min(dt, card.entry.meta.duration - card.instance.t));
      paint(card.context, card.entry, card.instance);
      card.element.dataset.time = card.instance.t.toFixed(3);
    }
  }
  requestAnimationFrame(animate);
}
document.addEventListener('visibilitychange', () => { last = gridLast = 0; });
reduced?.addEventListener('change', resetCards);
selectEffect(swordIndex); requestAnimationFrame(animate);
