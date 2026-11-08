import { createPureEffect, path, ring, dot, envelope, clamp, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'thunder-palm', name: '驚雷掌', category: 'ink-burst', duration: 1.3,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: .22, poses: [[-.22, 'GATHER', 'easeOut'], [0, 'PALM_STRIKE', 'snap'], [.18, 'DISCHARGE'], [.7, 'SETTLE']],
  hits: [{ t: .02, freeze: .12, shakeAmp: 4, inkSplash: 20 }], recovery: .2 };
export function create({ seed = 1, ...options } = {}) {
  const random = mulberry32(seed);
  // Each lightning bolt is a seeded zigzag with jittered joints and one fork.
  const bolts = Array.from({ length: 6 }, (_, k) => {
    const angle = k * TAU / 6 + (random() - .5) * .5, normal = angle + Math.PI / 2;
    const count = 5 + Math.floor(random() * 3), step = 9 + random() * 4;
    const joints = Array.from({ length: count }, (_, j) => {
      const r = 12 + j * step, side = j ? (j % 2 ? 1 : -1) * (3 + random() * 8) : 0;
      return [Math.cos(angle) * r + Math.cos(normal) * side, Math.sin(angle) * r + Math.sin(normal) * side];
    });
    const fork = 2 + Math.floor(random() * 3), forkAngle = angle + (random() < .5 ? -.6 : .6);
    return { joints, fork, forkEnd: [joints[fork][0] + Math.cos(forkAngle) * 22, joints[fork][1] + Math.sin(forkAngle) * 22] };
  });
  const sparks = Array.from({ length: 14 }, () => [random() * TAU, 40 + random() * 40, .8 + random() * 1.6]);
  return createPureEffect(meta, act, (f, t) => {
    if (t < 0) {
      const p = clamp(1 + t / .22);
      ring(f, 48 - 40 * p, 1.4 + p, .35 + p * .4, { tint: 1, start: p * 4, end: p * 4 + TAU * .8 });
      dot(f, 0, 0, 2 + 3 * p, .4 + .4 * p);
      return;
    }
    const a = envelope(t, .04, .95), g = easeOut((t + 1 / 120) / .1);
    dot(f, 0, 0, 9 * (1 - .4 * g), a);
    ring(f, 12 + 10 * g, 1.8, a * .7);
    ring(f, 20 + 50 * easeOut(t / .35), 1.2, a * .4 * (1 - easeOut(t / .5)), { tint: 1 });
    for (const [k, bolt] of bolts.entries()) {
      const count = Math.max(2, Math.ceil(bolt.joints.length * g));
      path(f, bolt.joints.slice(0, count), 1.7, a * .85, k % 3 === 0 ? 1 : 0);
      if (count > bolt.fork + 1) path(f, [bolt.joints[bolt.fork], bolt.forkEnd], 1.1, a * .55);
    }
    const drift = easeOut(t / .5);
    for (const [q, r, s] of sparks) dot(f, Math.cos(q) * r * (.6 + .4 * drift), Math.sin(q) * r * (.6 + .4 * drift) + 20 * t * t, s, a * .7, q > 5 ? 1 : 0);
  }, { seed, ...options });
}
