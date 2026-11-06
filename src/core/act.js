/** Pose times are relative to impact: windup starts at negative time. */
export function samplePose(act, t) {
  const poses = act.poses;
  if (!poses.length) return { poseId: 'idle', nextPoseId: 'idle', progress: 0 };
  let index = 0;
  while (index + 1 < poses.length && t >= poses[index + 1][0]) index++;
  const current = poses[index], next = poses[index + 1] ?? current;
  let progress = current === next ? 1 : Math.max(0, Math.min(1, (t - current[0]) / (next[0] - current[0])));
  if (current[2] === 'snap') progress = 0;
  if (current[2] === 'easeOut') progress = 1 - (1 - progress) ** 3;
  return { poseId: current[1], nextPoseId: next[1], progress };
}
export function hitStopAt(act, t) {
  return act.hits.find(hit => t >= hit.t && t < hit.t + hit.freeze) ?? null;
}
/** Remove elapsed hit-stop windows from the action clock. */
export function actionTime(act, t) {
  return t - act.hits.reduce((sum, hit) => sum + Math.max(0, Math.min(hit.freeze, t - hit.t)), 0);
}
