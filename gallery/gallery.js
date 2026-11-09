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
let stageSurface = 'paper', onionEnabled = false, layoutMode = 'curated';
const categoryNames = { sword: ['劍式', 'SWORD'], talisman: ['符陣', 'TALISMAN'], zen: ['禪境', 'ZEN'],
  'ink-burst': ['墨擊', 'IMPACT'], transitions: ['轉場', 'TRANSITION'], ui: ['印記', 'UI'] };
const paletteSubtitles = {
  songyan: '松煙入紙 · 濃淡六階',
  zhusha: '朱砂點睛 · 丹印破陣',
  shiqing: '石青寒玉 · 碧落山嵐',
  nijin: '泥金佛光 · 鎏金古韻',
};
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

// Nocturnal palettes for Dark Game Stage ("玄夜") preview
function getDarkPalette(id) {
  const base = palettes[id] ?? palettes.songyan;
  return {
    id: `${id}-dark`,
    name: base.name,
    stops: ['#161512', '#2b2923', '#545046', '#8d8677', '#c8c0b0', '#f4efe4'],
    accent: base.accent,
    highlight: base.highlight,
  };
}

function notify(text, state = '') {
  $('status').textContent = text;
  $('status').dataset.state = state;
}

function escapeHTML(str) {
  return String(str ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function feedback(button, message) {
  const original = button.dataset.originalLabel ?? button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = message;
  clearTimeout(button.feedbackTimer);
  button.feedbackTimer = setTimeout(() => { button.textContent = original; }, 1600);
}

function paint(ctx, entry, instance, surfaceMode = 'paper', withOnion = false) {
  const { w, h } = entry.meta, size = `${w}x${h}`;
  let pixels = previewBuffers.get(size);
  if (!pixels) {
    pixels = new ImageData(new Uint8ClampedArray(w * h * 4), w, h);
    previewBuffers.set(size, pixels);
  }
  const activePalette = surfaceMode === 'dark' ? getDarkPalette(palette) : palette;
  const usePaper = surfaceMode !== 'alpha';
  composite(instance.frame, activePalette, { paper: usePaper, grain }, pixels.data);

  // Optional onion-skin ghost frames (-45ms and -90ms) on the studio canvas
  if (withOnion && instance.t > 0.02) {
    const data = pixels.data;
    for (const [lag, weight, tintR, tintG, tintB] of [[0.09, 0.14, 108, 100, 89], [0.045, 0.26, 194, 58, 46]]) {
      const ghostTime = Math.max(0, displayTime(entry, instance) - lag);
      if (ghostTime <= 0) continue;
      const ghost = entry.create({ seed, palette });
      ghost.step(ghostTime);
      const pig = ghost.frame.pigment;
      for (let i = 0; i < pig.length; i++) {
        const gp = pig[i];
        if (gp <= 0.04 || instance.frame.pigment[i] > 0.25) continue;
        const mix = Math.min(0.45, gp * weight);
        const o = i * 4;
        data[o] = data[o] * (1 - mix) + tintR * mix;
        data[o + 1] = data[o + 1] * (1 - mix) + tintG * mix;
        data[o + 2] = data[o + 2] * (1 - mix) + tintB * mix;
        if (!usePaper) data[o + 3] = Math.max(data[o + 3], Math.round(mix * 255));
      }
    }
  }

  ctx.putImageData(pixels, 0, 0);
  const shake = actEnabled ? drawActor(ctx, entry, displayTime(entry, instance), seed) : 0;
  if (ctx === context) canvas.style.transform = shake ? `translateX(${shake}px)` : '';
}

function displayTime(entry = fx, instance = effect) {
  return entry.meta.loop ? instance.t % entry.meta.duration : Math.min(instance.t, entry.meta.duration);
}

// Keyframe filmstrip & Anatomy breakdown elements
const keyframeLabels = ['起勢', '出鋒', '破空', '頓幀', '收勢'];
const keyframeItems = [];
const filmstripEl = $('filmstrip');
if (filmstripEl) {
  for (let i = 0; i < 5; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kf-item';
    const thumb = document.createElement('canvas');
    thumb.width = 96;
    thumb.height = 96;
    thumb.setAttribute('aria-hidden', 'true');
    const metaRow = document.createElement('span');
    metaRow.className = 'kf-meta';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'kf-name';
    nameSpan.textContent = keyframeLabels[i];
    const timeSpan = document.createElement('span');
    timeSpan.className = 'kf-time en';
    timeSpan.textContent = '0.00s';
    metaRow.append(nameSpan, timeSpan);
    btn.append(thumb, metaRow);
    const item = { button: btn, canvas: thumb, ctx: thumb.getContext('2d'), timeSpan, time: 0 };
    btn.addEventListener('click', () => {
      preview = false;
      setPlaying(false);
      seek(item.time);
    });
    keyframeItems.push(item);
    filmstripEl.append(btn);
  }
}

function computeKeyframeTimes(entry) {
  const dur = entry.meta.duration;
  if (entry.meta.loop) {
    return [0.08, 0.26, 0.50, 0.72, 0.90].map(r => +(dur * r).toFixed(3));
  }
  const w = entry.act.windup;
  const span = Math.max(0.15, dur - w);
  const hit0 = entry.act.hits[0]?.t ?? span * 0.25;
  const freeze = entry.act.hits[0]?.freeze ?? 0.12;
  const t0 = Math.min(dur * 0.9, w + Math.max(0.03, span * 0.06));
  const t1 = Math.min(dur * 0.92, Math.max(t0 + 0.04, w + span * 0.20));
  const t2 = Math.min(dur * 0.94, Math.max(t1 + 0.05, w + Math.min(span * 0.44, hit0 + freeze * 0.5 + 0.04)));
  const t3 = Math.min(dur * 0.96, Math.max(t2 + 0.06, w + Math.min(span * 0.66, hit0 + freeze + 0.16)));
  const t4 = Math.min(dur - 0.02, Math.max(t3 + 0.06, w + span * 0.84));
  return [t0, t1, t2, t3, t4];
}

function highlightActiveKeyframe(time) {
  if (!keyframeItems.length) return;
  let closest = 0, bestDiff = Infinity;
  for (let i = 0; i < keyframeItems.length; i++) {
    const diff = Math.abs(keyframeItems[i].time - time);
    if (diff < bestDiff) { bestDiff = diff; closest = i; }
  }
  for (let i = 0; i < keyframeItems.length; i++) {
    const active = i === closest;
    keyframeItems[i].button.classList.toggle('active', active);
    keyframeItems[i].button.setAttribute('aria-pressed', active);
  }
}

// Coalesced async update for filmstrip & anatomy canvases so rapid effect switching stays 60fps
// and never interferes with synchronous unit test canvas assertions.
let auxScheduled = false;
function scheduleAuxRender() {
  if (auxScheduled) return;
  auxScheduled = true;
  const run = () => {
    auxScheduled = false;
    renderFilmstripAndAnatomy();
  };
  if (typeof globalThis.window !== 'undefined' && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(run);
  }
}

function renderSmallPreview(targetCanvas, entry, time, surfaceMode = 'paper') {
  if (!targetCanvas || typeof targetCanvas.getContext !== 'function') return;
  const tctx = targetCanvas.getContext('2d');
  if (!tctx || typeof tctx.drawImage !== 'function') return;
  const { w, h } = entry.meta;
  const sim = entry.create({ seed, palette });
  sim.step(time);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const octx = off.getContext('2d');
  if (!octx || typeof octx.putImageData !== 'function') return;
  const buf = new ImageData(new Uint8ClampedArray(w * h * 4), w, h);
  const activePal = surfaceMode === 'dark' ? getDarkPalette(palette) : palette;
  composite(sim.frame, activePal, { paper: true, grain }, buf.data);
  octx.putImageData(buf, 0, 0);
  tctx.clearRect?.(0, 0, targetCanvas.width, targetCanvas.height);
  tctx.drawImage(off, 0, 0, targetCanvas.width, targetCanvas.height);
}

function renderFilmstripAndAnatomy() {
  const times = computeKeyframeTimes(fx);
  for (let i = 0; i < keyframeItems.length; i++) {
    const item = keyframeItems[i];
    item.time = times[i];
    item.timeSpan.textContent = `${times[i].toFixed(2)}s`;
    item.button.setAttribute('aria-label', `${keyframeLabels[i]} ${times[i].toFixed(2)}秒`);
    renderSmallPreview(item.canvas, fx, times[i], stageSurface === 'dark' ? 'dark' : 'paper');
  }
  highlightActiveKeyframe(displayTime());

  // Update Anatomy of a Stroke 3-stage breakdown
  const nameEl = $('anatomy-effect-name');
  if (nameEl) nameEl.textContent = fx.meta.name;
  const [tWindup, , tImpact, , tSettle] = times;
  const stages = [
    ['anatomy-windup', 'anatomy-windup-time', tWindup],
    ['anatomy-impact', 'anatomy-impact-time', tImpact],
    ['anatomy-settle', 'anatomy-settle-time', tSettle],
  ];
  for (const [canvasId, timeId, tVal] of stages) {
    const c = $(canvasId), label = $(timeId);
    if (label) label.textContent = `${tVal.toFixed(2)}s · F${String(Math.round(tVal * 120)).padStart(3, '0')}`;
    if (c) {
      c.width = fx.meta.w;
      c.height = fx.meta.h;
      renderSmallPreview(c, fx, tVal, 'paper');
    }
  }
}

function display() {
  const time = displayTime();
  $('timeline').value = time;
  $('time').textContent = `${time.toFixed(3)} / ${fx.meta.duration.toFixed(3)}s`;
  $('pose').textContent = samplePose(fx.act, actionTime(fx.act, time - fx.act.windup)).poseId;
  highlightActiveKeyframe(time);
  // Paint main studio canvas last so `rendered` in unit tests always captures `#canvas`
  paint(context, fx, effect, stageSurface, onionEnabled);
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
  const times = computeKeyframeTimes(fx);
  for (let i = 0; i < keyframeItems.length; i++) {
    keyframeItems[i].time = times[i];
    keyframeItems[i].timeSpan.textContent = `${times[i].toFixed(2)}s`;
  }
  seek(fx.meta.loop ? .5 : fx.act.windup + .24); preview = true;
  scheduleAuxRender();
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
  button.innerHTML = `<span class="effect-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHTML(entry.meta.name)}</strong><small>${escapeHTML(entry.meta.id)}</small></span><span class="effect-arrow">↗</span>`;
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

  // Hover Rhythm Bar (Windup / Hit-stop / Settle proportion + duration)
  const dur = entry.meta.duration;
  const windupRatio = Math.min(65, Math.max(12, Math.round((entry.act.windup / dur) * 100)));
  const freezeTotal = entry.act.hits.reduce((sum, h) => sum + h.freeze, 0);
  const freezeRatio = Math.min(35, Math.max(8, Math.round((freezeTotal / dur) * 100)));
  const settleRatio = Math.max(10, 100 - windupRatio - freezeRatio);
  const rhythm = document.createElement('div');
  rhythm.className = 'card-rhythm';
  rhythm.setAttribute('aria-hidden', 'true');
  rhythm.innerHTML = `<div class="rhythm-track"><span class="rt-windup" style="width:${windupRatio}%"></span><span class="rt-freeze" style="width:${freezeRatio}%"></span><span class="rt-settle" style="width:${settleRatio}%"></span></div><div class="rhythm-legend"><span>起 ${entry.act.windup.toFixed(2)}s</span><span>頓 ${freezeTotal.toFixed(2)}s</span><span>全 ${dur.toFixed(2)}s${entry.meta.loop ? ' ↻' : ''}</span></div>`;

  const actions = document.createElement('div'); actions.className = 'card-actions';
  const copy = document.createElement('button'); copy.textContent = '路徑'; copy.addEventListener('click', () => copyPath(entry, copy));
  const source = document.createElement('button'); source.textContent = '複製 JS'; source.addEventListener('click', () => copySource(entry, source));
  const sheet = document.createElement('a'); sheet.textContent = 'PNG ↓'; sheet.href = `../examples/out/${entry.meta.id}/sheet.png`; sheet.download = `${entry.meta.id}.png`; sheet.dataset.cardAction = 'true';
  sheet.addEventListener('click', event => downloadSheet(event, entry));
  const atlas = document.createElement('a'); atlas.textContent = 'JSON ↓'; atlas.href = `../examples/out/${entry.meta.id}/sheet.json`; atlas.download = `${entry.meta.id}.json`; atlas.dataset.cardAction = 'true';
  atlas.addEventListener('click', event => downloadSheet(event, entry, true));
  // Keep `caption` at element.children[2] so unit tests indexing children[2] succeed
  actions.append(source, sheet, atlas, copy); element.append(open, title, caption, rhythm, actions);
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

const catalogPaletteButtons = [];
const anatomyPaletteButtons = [];

function setPalette(id) {
  palette = id;
  for (const button of $('palettes').children) { const active = button.dataset.palette === id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); }
  for (const button of catalogPaletteButtons) { const active = button.dataset.palette === id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); }
  for (const button of anatomyPaletteButtons) { const active = button.dataset.palette === id; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); }
  $('toolbar-palette').value = id;
  document.documentElement.style.setProperty('--paper', palettes[id].stops[0]);
  $('component-examples').textContent = componentExamples(); display();
  for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance);
  scheduleAuxRender();
}

for (const [id, entry] of Object.entries(palettes)) {
  const button = document.createElement('button'); button.className = `palette ${id === palette ? 'active' : ''}`; button.dataset.palette = id;
  button.setAttribute('aria-pressed', id === palette);
  button.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${entry.stops[5]} 55%,${entry.accent} 55%)"></span><span class="palette-name">${escapeHTML(entry.name)}</span><small>${escapeHTML(id)}</small>`;
  button.addEventListener('click', () => setPalette(id)); $('palettes').append(button);
  const option = document.createElement('option'); option.value = id; option.textContent = entry.name; $('toolbar-palette').append(option);

  // Quick palette dot in Collection toolbar
  const catPal = $('catalog-palettes');
  if (catPal) {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `catalog-palette-dot ${id === palette ? 'active' : ''}`;
    dot.dataset.palette = id;
    dot.setAttribute('aria-label', `切換至${entry.name}`);
    dot.setAttribute('aria-pressed', id === palette);
    dot.title = entry.name;
    dot.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${entry.stops[5]} 55%,${entry.accent} 55%)"></span><span class="dot-label">${escapeHTML(entry.name.slice(0, 2))}</span>`;
    dot.addEventListener('click', () => setPalette(id));
    catalogPaletteButtons.push(dot);
    catPal.append(dot);
  }

  // Mineral Pigment card in Anatomy dark section
  const anatPal = $('anatomy-palettes');
  if (anatPal) {
    const cardBtn = document.createElement('button');
    cardBtn.type = 'button';
    cardBtn.className = `anatomy-pigment-card ${id === palette ? 'active' : ''}`;
    cardBtn.dataset.palette = id;
    cardBtn.setAttribute('aria-pressed', id === palette);
    const stopsHtml = entry.stops.map(hex => `<span style="background:${hex}"></span>`).join('');
    cardBtn.innerHTML = `<div class="pigment-head"><strong>${escapeHTML(entry.name)}</strong><span class="en">${escapeHTML(id.toUpperCase())}</span></div><p class="pigment-sub">${escapeHTML(paletteSubtitles[id] ?? '')}</p><div class="pigment-stops" aria-hidden="true">${stopsHtml}<i class="pigment-accent" style="background:${entry.accent}"></i></div>`;
    cardBtn.addEventListener('click', () => setPalette(id));
    anatomyPaletteButtons.push(cardBtn);
    anatPal.append(cardBtn);
  }
}
$('toolbar-palette').value = palette;
$('toolbar-palette').addEventListener('change', event => setPalette(event.target.value));
$('grain').addEventListener('input', event => {
  grain = Math.max(0, Math.min(3, Number(event.target.value) || 0));
  $('grain-value').textContent = grain.toFixed(1);
  display();
  for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance);
  scheduleAuxRender();
});
$('act-toggle').addEventListener('change', event => {
  actEnabled = event.target.checked;
  display();
  for (const card of visible) if (card.instance) paint(card.context, card.entry, card.instance);
});
$('slow-toggle').addEventListener('change', event => { speed = event.target.checked ? .25 : 1; last = gridLast = 0; });

// Stage surface switcher ("宣紙 / 透明 / 玄夜") & Onion skin ("殘影")
const surfaceLabels = {
  paper: '宣紙 <span class="en">/ RICE PAPER</span>',
  alpha: '透明 <span class="en">/ ALPHA CHANNEL</span>',
  dark: '玄夜 <span class="en">/ NIGHT STAGE</span>',
};
const stageEl = $('stage');
const surfaceLabelEl = $('surface-label');
if (stageEl && typeof stageEl.parentElement?.querySelectorAll === 'function') {
  const surfaceBtns = [...stageEl.parentElement.querySelectorAll('.surface-btn[data-surface]')];
  for (const btn of surfaceBtns) {
    btn.addEventListener('click', () => {
      stageSurface = btn.dataset.surface;
      stageEl.dataset.surface = stageSurface;
      if (surfaceLabelEl) surfaceLabelEl.innerHTML = surfaceLabels[stageSurface] ?? surfaceLabels.paper;
      for (const b of surfaceBtns) {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', active);
      }
      display();
      scheduleAuxRender();
    });
  }
}
const onionBtn = $('onion-toggle');
if (onionBtn) {
  onionBtn.addEventListener('click', () => {
    onionEnabled = !onionEnabled;
    onionBtn.classList.toggle('active', onionEnabled);
    onionBtn.setAttribute('aria-pressed', onionEnabled);
    display();
  });
}

// Collection Dual-View Mode ("策展" vs "圖鑑")
const viewCuratedBtn = $('view-curated');
const viewCompactBtn = $('view-compact');
function setCollectionLayout(mode) {
  layoutMode = mode;
  $('fx-grid').dataset.layout = mode;
  viewCuratedBtn?.classList.toggle('active', mode === 'curated');
  viewCuratedBtn?.setAttribute('aria-pressed', mode === 'curated');
  viewCompactBtn?.classList.toggle('active', mode === 'compact');
  viewCompactBtn?.setAttribute('aria-pressed', mode === 'compact');
  filterCatalog();
}
viewCuratedBtn?.addEventListener('click', () => setCollectionLayout('curated'));
viewCompactBtn?.addEventListener('click', () => setCollectionLayout('compact'));

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
  $('fx-grid').dataset.view = paginated && layoutMode === 'curated' ? 'curated' : 'filtered';
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
  scheduleAuxRender();
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
