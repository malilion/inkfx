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
const categoryNames = { sword: 'SWORD / 劍', transitions: 'TRANSITION / 卷', 'ink-burst': 'IMPACT / 墨',
  talisman: 'TALISMAN / 符', zen: 'ZEN / 禪', ui: 'UI / 印' };
const cards = [], visible = new Set();

function paint(ctx, entry, instance) {
  ctx.putImageData(new ImageData(composite(instance.frame, palette, { paper: true, grain }), entry.meta.w, entry.meta.h), 0, 0);
  if (actEnabled) drawActor(ctx, entry, instance.t);
}
function display() {
  paint(context, fx, effect);
  const time = fx.meta.loop ? effect.t % fx.meta.duration : Math.min(effect.t, fx.meta.duration);
  $('timeline').value = time;
  $('time').textContent = `${time.toFixed(3)} / ${fx.meta.duration.toFixed(3)}s`;
  $('pose').textContent = samplePose(fx.act, actionTime(fx.act, effect.t - fx.act.windup)).poseId;
}
function seek(time) {
  effect = fx.create({ seed, palette }); effect.step(time); display();
}
function setPlaying(value) {
  playing = value; last = 0;
  $('play').innerHTML = value ? 'Ⅱ <span>Pause gesture</span>' : '▶ <span>Play gesture</span>';
  $('play').setAttribute('aria-label', value ? 'Pause effect' : 'Play effect');
}
function componentExamples() {
  return `// React (useEffect cleanup stops playback)\nimport React from 'react';\nimport { create } from '../${effectPaths[fx.meta.id]}';\nimport { composite } from '../src/core/compositor.js';\nfunction Ink({ seed = 1 }) {\n  const ref = React.useRef(null);\n  React.useEffect(() => {\n    const fx = create({ seed }); let raf, last;\n    const draw = now => {\n      if (last) fx.step(Math.min((now-last)/1000, .05));\n      last = now; const f = fx.frame;\n      ref.current.getContext('2d').putImageData(\n        new ImageData(composite(f, '${palette}'), f.w, f.h), 0, 0);\n      raf = requestAnimationFrame(draw);\n    };\n    raf = requestAnimationFrame(draw);\n    return () => cancelAnimationFrame(raf);\n  }, [seed]);\n  return <canvas ref={ref} width={${fx.meta.w}} height={${fx.meta.h}} />;\n}\n\n<!-- Vue 3: use the same create/composite imports and draw loop. -->\n<script setup>\nimport { ref, onMounted, onUnmounted } from 'vue';\nimport { create } from '../${effectPaths[fx.meta.id]}';\nimport { composite } from '../src/core/compositor.js';\nconst canvas = ref(null); let raf;\nonMounted(() => {\n  const fx = create({ seed: 1 }); let last;\n  const draw = now => {\n    if (last) fx.step(Math.min((now-last)/1000, .05));\n    last = now; const f = fx.frame;\n    canvas.value.getContext('2d').putImageData(\n      new ImageData(composite(f, '${palette}'), f.w, f.h), 0, 0);\n    raf = requestAnimationFrame(draw);\n  };\n  raf = requestAnimationFrame(draw);\n});\nonUnmounted(() => cancelAnimationFrame(raf));\n</script>\n<template><canvas ref="canvas" width="${fx.meta.w}" height="${fx.meta.h}" /></template>`;
}
function selectEffect(index) {
  fx = effects[index]; setPlaying(false);
  canvas.width = fx.meta.w; canvas.height = fx.meta.h;
  $('timeline').max = fx.meta.duration;
  $('dimensions').textContent = `${fx.meta.w} × ${fx.meta.h}`;
  $('category').textContent = categoryNames[fx.meta.category];
  $('figure').textContent = String(index + 1).padStart(2, '0');
  $('windup').textContent = `${fx.act.windup.toFixed(2)}s`;
  $('freeze').textContent = `${fx.act.hits.reduce((sum, hit) => sum + hit.freeze, 0).toFixed(2)}s`;
  $('source-link').href = `../${effectPaths[fx.meta.id]}`;
  $('sheet-link').href = `../examples/out/${fx.meta.id}/sheet.png`;
  $('atlas-link').href = `../examples/out/${fx.meta.id}/sheet.json`;
  $('component-examples').textContent = componentExamples();
  for (const [i, button] of [...$('effects').children].entries()) {
    button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', i === index);
  }
  seek(fx.meta.loop ? .5 : fx.act.windup + .24); preview = true;
}
async function copyPath(entry) {
  const path = effectPaths[entry.meta.id];
  try { await navigator.clipboard.writeText(path); $('status').textContent = `Copied ${path}`; }
  catch { $('status').textContent = `Copy path: ${path}`; }
}
async function copySource(entry) {
  try {
    const response = await fetch(`../${effectPaths[entry.meta.id]}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const source = await response.text();
    await navigator.clipboard.writeText(source);
    $('status').textContent = `Copied ${entry.meta.name} JS; keep imports alongside src/core and src/palettes.`;
  } catch (error) {
    $('status').textContent = `Copy failed: ${error.message}. Use View single-file JS to copy the source.`;
  }
}
const blobURLs = new Map();
function downloadBlob(blob, filename, link) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  // Keep the actual card link usable after the first download.
  const old = blobURLs.get(link); if (old) URL.revokeObjectURL(old);
  link.href = url; link.download = filename; blobURLs.set(link, url);
}
async function downloadSheet(event, entry, atlasOnly = false) {
  event.preventDefault();
  const link = event.currentTarget;
  if (link.dataset.busy) return;
  link.dataset.busy = 'true'; link.setAttribute('aria-busy', 'true');
  $('status').textContent = `Baking ${entry.meta.name}…`;
  // Yield so the busy state paints before baking a large atlas.
  await new Promise(resolve => requestAnimationFrame(resolve));
  try {
    const sheet = buildSheet(entry, { seed, palette, grain });
    const stem = `${entry.meta.id}-${palette}-seed${seed}`;
    sheet.atlas.meta.image = `${stem}.png`;
    if (atlasOnly) downloadBlob(new Blob([JSON.stringify(sheet.atlas, null, 2)], { type: 'application/json' }), `${stem}.json`, link);
    else {
      const surface = document.createElement('canvas'); surface.width = sheet.w; surface.height = sheet.h;
      surface.getContext('2d').putImageData(new ImageData(sheet.data, sheet.w, sheet.h), 0, 0);
      const blob = await new Promise(resolve => surface.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      downloadBlob(blob, `${stem}.png`, link);
    }
    $('status').textContent = `Exported ${entry.meta.name}; PNG and JSON use the same seed and palette.`;
  } catch (error) { $('status').textContent = `Export failed: ${error.message}`; }
  finally { delete link.dataset.busy; link.removeAttribute('aria-busy'); }
}
const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    const card = cards.find(card => card.element === entry.target);
    if (!card) continue;
    if (entry.isIntersecting && !card.element.hidden) visible.add(card); else visible.delete(card);
  }
}, { threshold: .05 }) : null;

effects.forEach((entry, index) => {
  const button = document.createElement('button'); button.className = 'effect';
  button.innerHTML = `<span class="effect-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${entry.meta.name}</strong><small>${entry.meta.id}</small></span><span class="effect-arrow">↗</span>`;
  button.addEventListener('click', () => selectEffect(index)); $('effects').append(button);
  const element = document.createElement('article'); element.className = 'fx-card'; element.dataset.category = entry.meta.category;
  const open = document.createElement('button'); open.className = 'card-preview'; open.setAttribute('aria-label', `Inspect ${entry.meta.name}`);
  const thumbnail = document.createElement('canvas'); thumbnail.width = entry.meta.w; thumbnail.height = entry.meta.h;
  thumbnail.setAttribute('aria-label', entry.meta.name); open.append(thumbnail); open.addEventListener('click', () => { selectEffect(index); $('canvas').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  const title = document.createElement('h3'); title.textContent = entry.meta.name;
  const caption = document.createElement('p'); caption.textContent = `${entry.meta.category} / ${entry.meta.id}`;
  const actions = document.createElement('div'); actions.className = 'card-actions';
  const copy = document.createElement('button'); copy.textContent = 'Copy path'; copy.addEventListener('click', () => copyPath(entry));
  const source = document.createElement('button'); source.textContent = 'Copy JS'; source.addEventListener('click', () => copySource(entry));
  const sheet = document.createElement('a'); sheet.textContent = 'PNG sheet ↓'; sheet.href = `../examples/out/${entry.meta.id}/sheet.png`; sheet.download = `${entry.meta.id}.png`;
  sheet.addEventListener('click', event => downloadSheet(event, entry));
  const atlas = document.createElement('a'); atlas.textContent = 'JSON ↓'; atlas.href = `../examples/out/${entry.meta.id}/sheet.json`; atlas.download = `${entry.meta.id}.json`;
  atlas.addEventListener('click', event => downloadSheet(event, entry, true));
  actions.append(copy, source, sheet, atlas); element.append(open, title, caption, actions); $('fx-grid').append(element);
  const card = { element, entry, context: thumbnail.getContext('2d'), instance: null, hold: 0 };
  cards.push(card); if (observer) observer.observe(element); else visible.add(card);
});
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
$('act-toggle').addEventListener('change', event => { actEnabled = event.target.checked; display(); });
$('slow-toggle').addEventListener('change', event => { speed = event.target.checked ? .25 : 1; last = gridLast = 0; });
for (const [category, count] of Object.entries(categoryCounts)) {
  const option = document.createElement('option'); option.value = category; option.textContent = `${category} (${count})`; $('category-filter').append(option);
}
for (const id of ['catalog-count', 'explore-count', 'collection-count']) $(id).textContent = effects.length;
$('catalog-edition').textContent = [...String(effects.length)].map(digit => '〇一二三四五六七八九'[Number(digit)]).join('') + '式';
$('visible-count').textContent = `${effects.length} effects`;
$('category-filter').addEventListener('change', event => {
  let count = 0;
  for (const card of cards) {
    card.element.hidden = event.target.value !== 'all' && card.entry.meta.category !== event.target.value;
    if (card.element.hidden) visible.delete(card);
    else { count++; if (observer) { observer.unobserve(card.element); observer.observe(card.element); } else visible.add(card); }
  }
  $('visible-count').textContent = `${count} effects`;
});
$('copy-path').addEventListener('click', () => copyPath(fx));
$('copy-source').addEventListener('click', () => copySource(fx));
$('sheet-link').href = '../examples/out/sword-qi-slash/sheet.png';
$('atlas-link').href = '../examples/out/sword-qi-slash/sheet.json';
$('sheet-link').addEventListener('click', event => downloadSheet(event, fx));
$('atlas-link').addEventListener('click', event => downloadSheet(event, fx, true));
$('play').addEventListener('click', () => {
  if (!playing && (preview || effect.t >= fx.meta.duration - .001)) { seek(0); preview = false; }
  setPlaying(!playing);
});
$('replay').addEventListener('click', () => { preview = false; seek(0); setPlaying(true); });
$('timeline').addEventListener('input', event => { preview = false; setPlaying(false); seek(Number(event.target.value)); });
function changeSeed() {
  const next = Number($('seed').value);
  if (!Number.isInteger(next) || next < 0 || next > 0xffffffff) { $('status').textContent = 'Seed must be an integer from 0 to 4294967295.'; return; }
  seed = next; $('status').textContent = 'Deterministic by nature.';
  seek(Math.min(effect.t, fx.meta.duration)); resetCards();
}
$('seed').addEventListener('change', changeSeed);
$('next-seed').addEventListener('click', () => { $('seed').value = (seed + 1) >>> 0; changeSeed(); });
$('download').addEventListener('click', () => {
  canvas.toBlob(blob => { if (blob) downloadBlob(blob, `inkfx-${fx.meta.id}-${palette}-seed${seed}.png`, $('download')); }, 'image/png');
});
function animate(now) {
  if (!document.hidden && playing) {
    if (last) effect.step(Math.min(Math.min((now - last) / 1000, .05) * speed, fx.meta.loop ? Infinity : Math.max(0, fx.meta.duration - effect.t)));
    last = now; display();
    if (!fx.meta.loop && effect.t >= fx.meta.duration - 1e-8) setPlaying(false);
  }
  // Follow the display's animation frames; offscreen cards never allocate or
  // advance an effect. Fixed 120Hz simulation keeps timing independent of RAF.
  if (!document.hidden) {
    const dt = gridLast ? Math.min((now - gridLast) / 1000, .1) * speed : 0; gridLast = now;
    for (const card of visible) {
      if (!card.instance) card.instance = card.entry.create({ seed, palette });
      if (card.entry.meta.loop) card.instance.step(dt);
      else if (card.instance.t >= card.entry.meta.duration) {
        card.hold += dt;
        if (card.hold > .25) { card.instance = card.entry.create({ seed, palette }); card.hold = 0; }
      } else card.instance.step(Math.min(dt, card.entry.meta.duration - card.instance.t));
      paint(card.context, card.entry, card.instance);
      card.element.dataset.time = card.instance.t.toFixed(3);
    }
  }
  requestAnimationFrame(animate);
}
document.addEventListener('visibilitychange', () => { last = gridLast = 0; });
selectEffect(effects.findIndex(entry => entry.meta.id === 'sword-qi-slash')); requestAnimationFrame(animate);
