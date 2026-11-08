import { create, meta } from '../src/fx/sword/sword-qi-slash.js';
import { composite } from '../src/core/compositor.js';
import { mulberry32 } from '../src/core/seed.js';

const canvas = document.getElementById('opening-canvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('opening-canvas-wrap');
const openingSection = document.getElementById('opening');
const button = document.getElementById('opening-play');
const label = document.getElementById('opening-play-label');
const icon = document.getElementById('opening-icon');
const phase = document.getElementById('opening-phase');
const brushHint = document.getElementById('opening-brush-hint');
const topbar = document.getElementById('topbar');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 3;
const random = mulberry32(6129);

// Internal render resolution — painted to the full canvas with cover-fit
const RW = 960, RH = 540;
const render = document.createElement('canvas');
render.width = RW; render.height = RH;
const rctx = render.getContext('2d');

// Backdrop: paper fibres, distant ridges, red moon
const backdrop = document.createElement('canvas');
backdrop.width = RW; backdrop.height = RH;
const land = backdrop.getContext('2d');

land.fillStyle = '#f0e9d8';
land.fillRect(0, 0, RW, RH);

const haze = land.createRadialGradient(RW * .67, RH * .3, 20, RW * .65, RH * .35, RW * .7);
haze.addColorStop(0, 'rgba(255, 250, 234, .55)');
haze.addColorStop(1, 'rgba(158, 142, 113, .14)');
land.fillStyle = haze;
land.fillRect(0, 0, RW, RH);

for (let i = 0; i < 16000; i++) {
  land.fillStyle = i % 2 ? '#342a1d' : '#fffdfa';
  land.globalAlpha = random() * .09;
  land.fillRect(random() * RW, random() * RH, random() * 1.8 + .3, .5);
}
land.globalAlpha = 1;

for (let ridge = 0; ridge < 9; ridge++) {
  const horizon = RH * .62 + ridge * RH * .032;
  const crest = land.createLinearGradient(0, horizon - 80, 0, RH);
  crest.addColorStop(0, `rgba(70, 65, 48, ${.08 + ridge * .013})`);
  crest.addColorStop(1, 'rgba(109, 99, 78, 0)');
  land.beginPath();
  land.moveTo(0, RH);
  for (let x = 0; x <= RW; x += 3) {
    const wave = Math.sin(x * .008 + ridge * 1.19) * (28 + ridge * 2);
    const saw = Math.abs(Math.sin(x * .016 - ridge * 2.03)) * 35;
    land.lineTo(x, horizon - wave - saw + random() * 3.5);
  }
  land.lineTo(RW, RH);
  land.fillStyle = crest;
  land.fill();
}

land.strokeStyle = 'rgba(194, 58, 46, .28)';
land.lineWidth = 1;
land.beginPath();
land.arc(RW * .73, RH * .28, 50, 0, Math.PI * 2);
land.stroke();

// Sword effect sub-canvas
const sword = document.createElement('canvas');
sword.width = meta.w; sword.height = meta.h;
const swordCtx = sword.getContext('2d');
const pixels = swordCtx.createImageData(meta.w, meta.h);

const clamp = v => Math.max(0, Math.min(1, v));
const taper = u => Math.sin(Math.PI * u) ** .77;
const sweepX = u => RW * .08 + u * RW * .84;
// On portrait screens the stroke is lowered so it sweeps past the actions,
// not through the headline. 0 on landscape, up to RH * .34 on phones.
let yShift = 0;
const sweepY = u => yShift + RH * .67 - RH * .92 * u + RH * .45 * u ** 2;

const hairs = Array.from({ length: 180 }, (_, i) => ({
  start: random() * .21,
  end: .73 + random() * .27,
  offset: (random() - .5) * 100,
  curl: (random() - .5) * 28,
  opacity: .06 + random() * .42,
  width: .46 + random() * (i % 8 === 0 ? 4.2 : 1.4),
  accent: i % 31 === 0,
}));
const flecks = Array.from({ length: 160 }, (_, i) => ({
  u: .12 + random() * .83,
  offset: (random() - .5) * 130,
  radius: .33 + random() ** 3 * 3.8,
  opacity: .18 + random() * .46,
  fall: 3 + random() * 20,
  accent: i % 14 === 0,
}));

const gaps = Array.from({ length: 90 }, () => ({
  start: .11 + random() * .78,
  length: .035 + random() * .28,
  offset: (random() - .43) * 75,
  width: .45 + random() ** 2 * 2.2,
  opacity: .15 + random() * .60,
}));
const wetCanvas = document.createElement('canvas');
wetCanvas.width = RW; wetCanvas.height = RH;
const wet = wetCanvas.getContext('2d');
let wetGradient;
function buildWetGradient() {
  wetGradient = wet.createLinearGradient(RW * .08, yShift + RH * .64, RW * .92, yShift + RH * .24);
  wetGradient.addColorStop(0, '#5e4130');
  wetGradient.addColorStop(.22, '#26221b');
  wetGradient.addColorStop(.61, '#29241c');
  wetGradient.addColorStop(1, '#665644');
}
buildWetGradient();

let instance = create({ seed: 42 });
let elapsed = reduced.matches ? duration : 0;
let running = !reduced.matches;
let last = null;
let inView = true;
let request = null;

// Interactive user sword-brush trail state ("揮劍留墨")
const trailNodes = [];
const trailSparks = [];
const TRAIL_LIFE = 2.1;
let pointerLast = null;

function edge(u, side, reveal) {
  const pressure = Math.sin(Math.PI * u ** .72) ** 1.28;
  const rag = Math.sin(u * 117) * 2.1 + Math.sin(u * 273) * .9;
  const breadth = side > 0 ? 25 : 32;
  const tip = Math.sqrt(clamp((reveal - u) / .09));
  return sweepY(u) + 7 * pressure + (side * breadth + rag) * pressure * tip;
}

function wetStroke(reveal) {
  wet.clearRect(0, 0, RW, RH);
  if (reveal <= .012) return;
  wet.beginPath();
  wet.moveTo(sweepX(0), sweepY(0));
  for (let i = 1; i <= 96; i++) {
    const u = i * reveal / 96;
    wet.lineTo(sweepX(u), edge(u, -1, reveal));
  }
  for (let i = 95; i >= 0; i--) {
    const u = i * reveal / 96;
    wet.lineTo(sweepX(u), edge(u, 1, reveal));
  }
  wet.closePath();
  wet.fillStyle = wetGradient;
  wet.fill();
  wet.globalCompositeOperation = 'destination-out';
  wet.lineCap = 'round';
  for (const gap of gaps) {
    const end = Math.min(reveal, gap.start + gap.length);
    if (end <= gap.start) continue;
    wet.globalAlpha = gap.opacity;
    wet.lineWidth = gap.width;
    wet.beginPath();
    for (let i = 0; i <= 8; i++) {
      const u = gap.start + (end - gap.start) * i / 8;
      const x = sweepX(u), y = sweepY(u) + taper(u) * gap.offset;
      if (i === 0) wet.moveTo(x, y); else wet.lineTo(x, y);
    }
    wet.stroke();
  }
  wet.globalCompositeOperation = 'source-over';
  wet.globalAlpha = 1;
}

function drawUserTrails() {
  if (!trailNodes.length && !trailSparks.length) return;
  rctx.save();
  rctx.lineCap = 'round';
  rctx.lineJoin = 'round';

  for (let i = 1; i < trailNodes.length; i++) {
    const a = trailNodes[i - 1], b = trailNodes[i];
    if (b.break) continue;
    const life = clamp(1 - b.age / TRAIL_LIFE);
    if (life <= 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist, ny = dx / dist;
    const spread = (1 - life) * 5.5;
    const w = b.width * (0.65 + 0.35 * life) + spread * .4;

    // Soft outer ink wash halo (水暈)
    rctx.globalAlpha = life * life * .16;
    rctx.strokeStyle = '#4e4233';
    rctx.lineWidth = w * 2.3 + spread;
    rctx.beginPath();
    rctx.moveTo(a.x, a.y);
    rctx.lineTo(b.x, b.y);
    rctx.stroke();

    // Core pine-soot stroke (中鋒松煙)
    rctx.globalAlpha = life ** 1.25 * .68;
    rctx.strokeStyle = '#1e1a15';
    rctx.lineWidth = w * .75;
    rctx.beginPath();
    rctx.moveTo(a.x, a.y);
    rctx.lineTo(b.x, b.y);
    rctx.stroke();

    // Flying-white bristles (飛白絲紋)
    for (let h = -2; h <= 2; h++) {
      if (h === 0) continue;
      const offset = h * (w * .36 + spread * .25);
      rctx.globalAlpha = life ** 1.4 * (Math.abs(h) === 2 ? .24 : .38);
      rctx.strokeStyle = h === 2 && b.fast ? '#b8372b' : '#2c251d';
      rctx.lineWidth = Math.max(.55, w * .15);
      rctx.beginPath();
      rctx.moveTo(a.x + nx * offset, a.y + ny * offset);
      rctx.lineTo(b.x + nx * offset, b.y + ny * offset);
      rctx.stroke();
    }
  }

  // Cinnabar & ink droplets (朱砂火星與墨滴)
  for (const s of trailSparks) {
    const life = clamp(1 - s.age / s.maxLife);
    if (life <= 0) continue;
    rctx.globalAlpha = life * s.alpha;
    rctx.fillStyle = s.cinnabar ? '#c23a2e' : '#2b241c';
    rctx.beginPath();
    rctx.ellipse(
      s.x + s.vx * s.age,
      s.y + s.vy * s.age + 24 * s.age * s.age,
      s.r * (.6 + .4 * life),
      s.r * .62 * (.6 + .4 * life),
      s.angle, 0, Math.PI * 2
    );
    rctx.fill();
  }
  rctx.restore();
}

function draw(time) {
  rctx.clearRect(0, 0, RW, RH);
  rctx.drawImage(backdrop, 0, 0);
  const strike = clamp((time - .85) / .55);
  const reveal = .15 * clamp(time / .85) + .85 * (1 - (1 - strike) ** 2);
  const settle = clamp((time - 1.48) / 1.52);
  const density = .82 - settle * .16;
  wetStroke(reveal);
  rctx.globalAlpha = .94 - settle * .16;
  rctx.drawImage(wetCanvas, 0, 0);

  for (const hair of hairs) {
    const end = Math.min(reveal, hair.end);
    if (end <= hair.start) continue;
    rctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = hair.start + (end - hair.start) * i / 24;
      const x = sweepX(u) + Math.sin(u * 7) * hair.curl * .22;
      const y = sweepY(u) + taper(u) * (hair.offset + Math.sin(u * 6) * hair.curl);
      if (i === 0) rctx.moveTo(x, y); else rctx.lineTo(x, y);
    }
    rctx.globalAlpha = hair.opacity * density;
    rctx.strokeStyle = hair.accent ? '#a34536' : '#251e17';
    rctx.lineWidth = hair.width;
    rctx.lineCap = 'round';
    rctx.stroke();
  }

  for (const fleck of flecks) {
    if (fleck.u > reveal) continue;
    rctx.globalAlpha = fleck.opacity * density;
    rctx.fillStyle = fleck.accent ? '#9c3d30' : '#392c20';
    rctx.beginPath();
    rctx.ellipse(
      sweepX(fleck.u) + settle * fleck.fall,
      sweepY(fleck.u) + fleck.offset + settle * fleck.fall,
      fleck.radius, fleck.radius * .54, -.34, 0, Math.PI * 2
    );
    rctx.fill();
  }

  // Sword-qi effect overlay
  const fxTime = .4 * clamp(time / .85) + .9 * clamp((time - .85) / 1.72);
  instance.step(Math.max(0, fxTime - instance.t));
  if (fxTime > .4 && fxTime < 1.3) {
    composite(instance.frame, 'zhusha', {}, pixels.data);
    swordCtx.putImageData(pixels, 0, 0);
    rctx.save();
    rctx.translate(RW * .49, yShift + RH * .39);
    rctx.rotate(-.37);
    rctx.globalAlpha = .65;
    const scale = RW * .68;
    rctx.drawImage(sword, -scale / 2, -scale / 2, scale, scale);
    rctx.restore();
  }
  rctx.globalAlpha = 1;

  // Interactive user sword trails on top of paper & overture
  drawUserTrails();

  // Paint to display canvas with cover-fit (uniform scale, centred crop)
  const cw = canvas.width, ch = canvas.height;
  const fit = Math.max(cw / RW, ch / RH);
  const dw = RW * fit, dh = RH * fit;
  ctx.fillStyle = '#f0e9d8';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(render, (cw - dw) / 2, (ch - dh) / 2, dw, dh);

  const chapter = time < .85 ? '聚墨' : time < 1.48 ? '出劍' : '餘墨';
  if (phase.textContent !== chapter) phase.textContent = chapter;
  canvas.dataset.time = time.toFixed(3);
  wrap.style.setProperty('--progress', time / duration);
}

function clientToRenderCoords(clientX, clientY) {
  const rect = wrap.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = rect.width * dpr, ch = rect.height * dpr;
  const fit = Math.max(cw / RW, ch / RH);
  const dw = RW * fit, dh = RH * fit;
  const ox = (cw - dw) / 2, oy = (ch - dh) / 2;
  const px = (clientX - rect.left) * dpr;
  const py = (clientY - rect.top) * dpr;
  return { x: (px - ox) / fit, y: (py - oy) / fit };
}

function addSwordPoint(clientX, clientY, isBreak = false) {
  if (reduced.matches) return;
  const pt = clientToRenderCoords(clientX, clientY);
  if (!pt) return;
  const now = performance.now();
  let speed = 0;
  if (!isBreak && pointerLast) {
    const dt = Math.max(4, now - pointerLast.time);
    const dist = Math.hypot(pt.x - pointerLast.x, pt.y - pointerLast.y);
    if (dist < 2.2) return;
    speed = dist / dt; // px per ms in render space
  }
  const fast = speed > 0.65;
  const width = clamp(1 - speed / 2.2) * 10 + 3.2;
  trailNodes.push({
    x: pt.x,
    y: pt.y,
    width,
    fast,
    age: 0,
    break: isBreak || !pointerLast || (now - pointerLast.time > 180),
  });
  if (trailNodes.length > 96) trailNodes.shift();

  // Spawn flecks / cinnabar sparks along the slash
  if (pointerLast && !isBreak) {
    const count = fast ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 8 + Math.random() * (fast ? 42 : 18);
      trailSparks.push({
        x: pt.x + (Math.random() - .5) * 10,
        y: pt.y + (Math.random() - .5) * 10,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 8,
        r: .7 + Math.random() * (fast ? 2.6 : 1.5),
        alpha: .35 + Math.random() * .45,
        angle: Math.random() * Math.PI,
        age: 0,
        maxLife: .65 + Math.random() * .95,
        cinnabar: fast && (i === 0 || Math.random() < .42),
      });
    }
    if (trailSparks.length > 140) trailSparks.splice(0, trailSparks.length - 140);
  }
  pointerLast = { x: pt.x, y: pt.y, time: now };
  if (brushHint) brushHint.dataset.active = 'true';
  schedule();
}

openingSection?.addEventListener('pointermove', event => {
  if (event.target.closest?.('a, button')) return;
  addSwordPoint(event.clientX, event.clientY, false);
}, { passive: true });

openingSection?.addEventListener('pointerdown', event => {
  if (event.target.closest?.('a, button')) return;
  pointerLast = null;
  addSwordPoint(event.clientX, event.clientY, true);
}, { passive: true });

openingSection?.addEventListener('pointerleave', () => { pointerLast = null; });

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = wrap.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  // aspect 1.0+ → no shift; 0.5 or narrower (phones) → full shift
  const aspect = rect.width / Math.max(1, rect.height);
  yShift = RH * .34 * clamp((1 - aspect) / .5);
  buildWetGradient();
  draw(elapsed);
}
window.addEventListener('resize', resize);
requestAnimationFrame(() => { resize(); });

function playback(active) {
  running = active;
  last = null;
  if (!active && !trailNodes.length && !trailSparks.length && request !== null) {
    cancelAnimationFrame(request);
    request = null;
  }
  button.setAttribute('aria-label', active ? '暫停開場' : elapsed >= duration ? '重播開場' : '繼續開場');
  label.textContent = active ? '暫停' : elapsed >= duration ? '重播' : '繼續';
  icon.textContent = active ? 'Ⅱ' : elapsed >= duration ? '↻' : '▶';
  schedule();
}

function schedule() {
  const hasTrails = trailNodes.length > 0 || trailSparks.length > 0;
  if ((running || hasTrails) && inView && !document.hidden && request === null) {
    request = requestAnimationFrame(tick);
  }
}

function tick(now) {
  request = null;
  if (inView && !document.hidden) {
    const dt = last !== null ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    if (running) {
      elapsed = Math.min(duration, elapsed + dt);
    }
    if (dt > 0 && (trailNodes.length || trailSparks.length)) {
      for (let i = trailNodes.length - 1; i >= 0; i--) {
        trailNodes[i].age += dt;
        if (trailNodes[i].age >= TRAIL_LIFE) trailNodes.splice(i, 1);
      }
      for (let i = trailSparks.length - 1; i >= 0; i--) {
        trailSparks[i].age += dt;
        if (trailSparks[i].age >= trailSparks[i].maxLife) trailSparks.splice(i, 1);
      }
    }
    draw(elapsed);
    if (running && elapsed >= duration) playback(false);
  }
  schedule();
}

button.addEventListener('click', () => {
  if (running) { playback(false); return; }
  if (elapsed >= duration) { elapsed = 0; instance = create({ seed: 42 }); draw(0); }
  playback(true);
});

reduced.addEventListener('change', () => {
  if (!reduced.matches) return;
  trailNodes.length = 0;
  trailSparks.length = 0;
  elapsed = duration;
  draw(elapsed);
  playback(false);
});

document.addEventListener('visibilitychange', () => { last = null; schedule(); });

if (typeof IntersectionObserver === 'function') {
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting; last = null; schedule();
  }).observe(canvas);
}

// Topbar scroll state + reading progress line
const progressLine = document.querySelector('.progress-line');
let scrollTick = false;
function onScroll() {
  scrollTick = false;
  topbar.classList.toggle('scrolled', window.scrollY > 60);
  const max = document.documentElement.scrollHeight - innerHeight;
  progressLine?.style.setProperty('--scroll-progress', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
}
window.addEventListener('scroll', () => {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(onScroll);
}, { passive: true });
onScroll();

// Card hover glow follows the pointer (delegated; cards are built by gallery.js)
document.addEventListener('pointermove', event => {
  const card = event.target.closest?.('.card-preview');
  if (!card || event.pointerType === 'touch') return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--mouse-x', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
  card.style.setProperty('--mouse-y', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
}, { passive: true });

// Scroll-reveal animations
if (typeof IntersectionObserver === 'function') {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
  for (const el of document.querySelectorAll('.reveal')) revealObserver.observe(el);
}

draw(elapsed);
playback(running);
