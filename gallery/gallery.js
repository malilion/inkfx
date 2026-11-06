import { effects } from '../src/fx/index.js';
import { palettes } from '../src/palettes/index.js';
import { composite } from '../src/core/compositor.js';
import { samplePose } from '../src/core/act.js';

const $ = id => document.getElementById(id);
const canvas = $('canvas'), context = canvas.getContext('2d');
let fx = effects[0], palette = 'songyan', seed = 1, effect, playing = false, last = 0, preview = true;
const names = ['Sword qi slash', 'Cross slash', 'Ink wipe', 'Scroll open', 'Ink splash'];
const categoryNames = { sword: 'SWORD / 劍', transitions: 'TRANSITION / 卷', 'ink-burst': 'IMPACT / 墨' };

function display() {
  context.putImageData(new ImageData(composite(effect.frame, palette, { paper: true }), fx.meta.w, fx.meta.h), 0, 0);
  $('timeline').value = Math.min(effect.t, fx.meta.duration);
  $('time').textContent = `${Math.min(effect.t, fx.meta.duration).toFixed(3)} / ${fx.meta.duration.toFixed(3)}s`;
  $('pose').textContent = samplePose(fx.act, effect.t - fx.act.windup).poseId;
}
function seek(time) {
  effect = fx.create({ seed, palette });
  effect.step(time);
  display();
}
function setPlaying(value) {
  playing = value; last = 0;
  $('play').innerHTML = value ? 'Ⅱ <span>Pause gesture</span>' : '▶ <span>Play gesture</span>';
  $('play').setAttribute('aria-label', value ? 'Pause effect' : 'Play effect');
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
  for (const [i, button] of [...$('effects').children].entries()) {
    button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', i === index);
  }
  seek(fx.meta.duration * 0.82);
  preview = true;
}
effects.forEach((entry, index) => {
  const button = document.createElement('button'); button.className = 'effect';
  button.innerHTML = `<span class="effect-index">0${index + 1}</span><span><strong>${entry.meta.name}</strong><small>${names[index]}</small></span><span class="effect-arrow">↗</span>`;
  button.addEventListener('click', () => selectEffect(index)); $('effects').append(button);
});
for (const [id, entry] of Object.entries(palettes)) {
  const button = document.createElement('button'); button.className = `palette ${id === palette ? 'active' : ''}`;
  button.setAttribute('aria-pressed', id === palette);
  button.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${entry.stops[5]} 55%,${entry.accent} 55%)"></span><span class="palette-name">${entry.name}</span><small>${id}</small>`;
  button.addEventListener('click', () => {
    palette = id;
    for (const item of $('palettes').children) { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', item === button); }
    document.documentElement.style.setProperty('--paper', entry.stops[0]); display();
  }); $('palettes').append(button);
}
$('play').addEventListener('click', () => {
  if (!playing && (preview || effect.t >= fx.meta.duration - 0.001)) { seek(0); preview = false; }
  setPlaying(!playing);
});
$('replay').addEventListener('click', () => { preview = false; seek(0); setPlaying(true); });
$('timeline').addEventListener('input', event => { preview = false; setPlaying(false); seek(Number(event.target.value)); });
function changeSeed() {
  const next = Number($('seed').value);
  if (!Number.isInteger(next) || next < 0 || next > 0xffffffff) {
    $('status').textContent = 'Seed must be an integer from 0 to 4294967295.'; return;
  }
  seed = next; $('status').textContent = 'Deterministic by nature.';
  seek(Math.min(effect.t, fx.meta.duration));
}
$('seed').addEventListener('change', changeSeed);
$('next-seed').addEventListener('click', () => { $('seed').value = (seed + 1) >>> 0; changeSeed(); });
$('download').addEventListener('click', () => {
  canvas.toBlob(blob => {
    if (!blob) return;
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `inkfx-${fx.meta.id}-${palette}-seed${seed}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }, 'image/png');
});
function animate(now) {
  if (playing) {
    if (last) effect.step(Math.min((now - last) / 1000, 0.05, Math.max(0, fx.meta.duration - effect.t)));
    last = now; display();
    if (effect.t >= fx.meta.duration - 1e-8) setPlaying(false);
  }
  requestAnimationFrame(animate);
}
selectEffect(0); requestAnimationFrame(animate);
