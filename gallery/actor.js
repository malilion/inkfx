import { samplePose, hitStopAt, actionTime } from '../src/core/act.js';
/** A lightweight wooden practice dummy, drawn only in previews. Exported pixels stay clean. */
export function drawActor(context, fx, time) {
  const display = time - fx.act.windup, t = actionTime(fx.act, display);
  const pose = samplePose(fx.act, t).poseId;
  const hit = hitStopAt(fx.act, display);
  const x = fx.meta.ox, y = fx.meta.h - 28;
  context.save(); context.globalAlpha = .45; context.strokeStyle = hit ? '#b82921' : '#6b6556'; context.lineWidth = 2;
  context.beginPath(); context.arc(x, y - 43, 6, 0, Math.PI * 2);
  context.moveTo(x, y - 37); context.lineTo(x, y - 13);
  context.moveTo(x - 17, y - 30); context.lineTo(x + 17, y - 30);
  context.moveTo(x - 13, y); context.lineTo(x, y - 13); context.lineTo(x + 13, y); context.stroke();
  context.globalAlpha = .8; context.font = '8px monospace'; context.fillStyle = '#6b6556';
  context.fillText(pose, 8, fx.meta.h - 8); context.restore();
}
