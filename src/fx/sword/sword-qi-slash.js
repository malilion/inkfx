import { mulberry32 } from '../../core/seed.js';
import { createEffect } from '../../core/effect.js';
import { clamp } from '../../core/brush.js';
import { stamp } from '../../core/feibai.js';
import { clearInk } from '../../core/frame.js';

// PoC action is .75s; the public display clock also includes .4s windup + .15s freeze.
export const meta = { id: 'sword-qi-slash', name: '劍氣斬', category: 'sword', duration: 1.3,
  actionDuration: .75, defaultPalette: 'zhusha', loop: false, w: 224, h: 224,
  ox: 112, oy: 112, droplets: 28, accentRatio: .15 };
export const act = { windup: .4,
  poses: [[-.4, 'SHEATH_CROUCH'], [-.08, 'EYE_GLINT', 'snap'], [0, 'DRAW_CUT', 'snap'],
    [.08, 'FOLLOW_HOLD'], [.65, 'STAND_RECOVER']],
  target: { x: -20, y: -4 },
  hits: [{ t: .04, freeze: .15, shakeAmp: 3, inkSplash: 24 }], recovery: .1 };
export function create({ seed = 1024, ...options } = {}) {
  const random = mulberry32(seed);
  const droplets = Array.from({ length: 28 }, (_, i) => {
    const angle = -.35 + (random() - .5) * .65, speed = 90 + random() * 180;
    return { x: -30 + random() * 20, y: 10 + (random() - .5) * 12,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      r: 1.2 + random() * 2.8, life: .25 + random() * .45, tint: i < 4 ? 1 : 0 };
  });
  return createEffect(meta, act, (f, t, previous) => {
    if (t < 0) {
      if (t >= -.08) for (const [x,y] of [[-43,16],[-42,15],[-44,15],[-43,14]])
        stamp(f, f.ox+x, f.oy+y, .8, {pigment:.3,wetness:.01,dryFactor:.3,tint:1});
      return;
    }
    const fade = clamp(1 - (t - .18) / .55);
    if (!fade) { clearInk(f); return; }
    if (t > .18) {
      const previousFade = clamp(1 - (previous - .18) / .55);
      const ratio = fade / previousFade;
      for (let i = 0; i < f.pigment.length; i++) { f.pigment[i] *= ratio; f.wetness[i] *= ratio; }
    }
    if (previous < .12) for (let i=0; i<=Math.floor(80*clamp(t/.12)); i++) {
      const u=i/80, radius=Math.sin(u*Math.PI)*7.5*(.4+.6*fade);
      stamp(f, f.ox-48+u*110, f.oy+22-Math.sin(u*Math.PI*.85)*38, radius,
        {pigment:fade*.72, wetness:.025, dryFactor:.8+u*.75, tint:u>.82?1:0});
    }
    if (t < .02 || t > .18) return;
    for (const d of droplets) {
      const age=t-.02, k=1-age/d.life;
      if(k<=0) continue;
      // Analytic 120Hz .91 damping trajectory; no dependence on display frame rate.
      const travel=(1-Math.pow(.91,age*120))/(120*(1-.91));
      stamp(f,f.ox+d.x+d.vx*travel,f.oy+d.y+d.vy*travel+9*age*age,d.r*(.7+.3*k),
        {pigment:k*.75,wetness:.35,dryFactor:.65,tint:d.tint});
    }
  }, { seed, ...options });
}
