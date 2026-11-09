import { samplePose, hitStopAt, actionTime } from '../src/core/act.js';
import { hash2d } from '../src/core/seed.js';

function drawSplash(context, hit, display, seed, x, y) {
  if (display < hit.t) return;
  // Hit-stop holds the emerging ink, then the flecks fall and fade.
  const age = Math.max(0, display - (hit.t + hit.freeze));
  if (age >= .34) return;
  seed ^= Math.round(hit.t * 120);
  for (let i = 0; i < hit.inkSplash; i++) {
    const life = .16 + hash2d(i, 0, seed) * .18;
    if (age >= life) continue;
    const angle = -.18 - hash2d(i, 1, seed) * 2.8;
    const radius = .55 + hash2d(i, 2, seed) * 1.1;
    const distance = 5 + hash2d(i, 3, seed) * (9 + age * 135) + age * 28;
    context.globalAlpha = .66 * (1 - age / life);
    context.fillStyle = i % 6 === 0 ? '#a83e33' : '#42362b';
    context.beginPath();
    context.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance + 130 * age ** 2,
      radius * (1 - .45 * age / life), 0, 2 * Math.PI);
    context.fill();
  }
}

/** Draw the target over the gallery preview and return horizontal camera shake. */
export function drawActor(context, fx, time, seed = 1) {
  const display = time - fx.act.windup, t = actionTime(fx.act, display);
  const pose = samplePose(fx.act, t).poseId;
  const hit = hitStopAt(fx.act, display);
  const impact = fx.act.hits.findLast(item => display >= item.t);
  const since = impact ? display - impact.t : Infinity;
  const recoil = impact ? Math.max(0, 1 - Math.max(0, since - impact.freeze) / .22) : 0;
  const target = fx.act.target;
  const x = Math.max(20, Math.min(fx.meta.ox + (target?.x ?? fx.meta.w * .24), fx.meta.w - 20));
  const y = Math.max(49, Math.min(fx.meta.oy + (target?.y ?? 24) + 34, fx.meta.h - 20));
  context.save();
  context.globalAlpha = .55;
  context.lineWidth = 2;
  context.lineCap = context.lineJoin = 'round';
  context.strokeStyle = '#6b6556';
  context.beginPath();
  context.moveTo(x - 12, y); context.lineTo(x + 12, y);
  context.stroke();
  context.save();
  context.translate(x, y);
  context.rotate(.19 * recoil);
  context.strokeStyle = hit ? '#a83e33' : '#6b6556';
  context.beginPath();
  context.moveTo(-4, -1); context.lineTo(-4, -48); context.lineTo(4, -48); context.lineTo(4, -1);
  context.moveTo(-15, -34); context.lineTo(15, -34);
  context.moveTo(-10, -24); context.lineTo(11, -24);
  context.moveTo(-4, -38); context.lineTo(4, -35);
  context.moveTo(-4, -33); context.lineTo(4, -30);
  context.stroke();
  context.restore();
  for (const item of fx.act.hits) drawSplash(context, item, display, seed, x + 8, y - 32);
  context.globalAlpha = .8; context.font = '8px monospace'; context.fillStyle = '#6b6556';
  context.fillText(pose, 8, fx.meta.h - 8); context.restore();
  return since < .12 ? impact.shakeAmp * (1 - since / .12) * Math.cos(since * 128) : 0;
}
