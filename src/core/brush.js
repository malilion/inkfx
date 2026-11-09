import { stamp } from './feibai.js';
export const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
export const easeOut = x => 1 - (1 - clamp(x)) ** 3;

export function stroke(frame, points, radius, options = {}) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.8));
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      stamp(frame, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, radius, options);
    }
  }
}

export function arc(frame, { start = -2.8, end = 0.25, progress = 1, rotation = -0.5, radius = 72, width = 7, ...options } = {}) {
  const points = 220;
  for (let i = 0; i < points * clamp(progress); i++) {
    const u = i / points;
    const angle = start + (end - start) * u;
    const r = radius * (0.78 + 0.22 * Math.sin(u * Math.PI));
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r * 0.58;
    const px = frame.ox + x * Math.cos(rotation) - y * Math.sin(rotation);
    const py = frame.oy + x * Math.sin(rotation) + y * Math.cos(rotation);
    const taper = Math.sin(Math.PI * u) ** 0.6;
    stamp(frame, px, py, 0.7 + width * taper, {
      pigment: 0.62 + taper * 0.23, wetness: 0.015, dryFactor: 1.15 + u * 0.65, ...options,
    });
  }
}

export function makeDroplets(random, count = 28, accentRatio = 0.15) {
  return Array.from({ length: count }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const speed = 55 + random() * 150;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      x: (random() - 0.5) * 38, y: (random() - 0.5) * 22,
      radius: 0.7 + random() * 2.8, tint: i < Math.round(count * accentRatio) ? 1 : 0 };
  });
}

export function splash(frame, droplets, age, { scale = 1, wetness = 0.65 } = {}) {
  if (age < 0) return;
  for (const drop of droplets) {
    const travel = (1 - Math.exp(-age * 9)) / 9;
    const x = frame.ox + drop.x + drop.vx * travel * scale;
    const y = frame.oy + drop.y + drop.vy * travel * scale + age * age * 40;
    stamp(frame, x, y, drop.radius * Math.max(0.5, 1 - age),
      { pigment: 0.65, wetness, dryFactor: 0.6, tint: drop.tint });
  }
}
