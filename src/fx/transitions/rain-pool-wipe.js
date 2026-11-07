import { createPureEffect, rhythm, clamp, mulberry32 } from '../../core/motifs.js';
export const meta = { id: 'rain-pool-wipe', name: '雨池暈場', category: 'transitions', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(.1, false);
export function create({ seed = 1, ...options } = {}) {
  const random=mulberry32(seed), centers=Array.from({length:9},(_,i)=>[
    (i%3+.5)*meta.w/3+(random()-.5)*meta.w*.14,
    (Math.floor(i/3)+.5)*meta.h/3+(random()-.5)*meta.h*.14,random()*Math.min(meta.w,meta.h)*.07]);
  // Seed-specific distances are computed once; playback has no nested geometry search.
  const distance=new Float32Array(meta.w*meta.h);
  for(let y=0;y<meta.h;y++)for(let x=0;x<meta.w;x++) {
    let best=Infinity;
    for(const [cx,cy,delay] of centers)best=Math.min(best,(x-cx)**2+(y-cy)**2+delay*delay);
    distance[y*meta.w+x]=Math.sqrt(best);
  }
  return createPureEffect(meta,act,(f,t)=>{
    const radius=clamp((t+.06)/.9)*Math.hypot(f.w/3,f.h/3)*.8;
    for(let i=0;i<distance.length;i++) {
      if(distance[i]>radius)continue;
      const edge=clamp((radius-distance[i])/6);
      f.pigment[i]=.12+edge*.72+f.paperGrain[i]*.08;
      f.wetness[i]=.12;f.tint[i]=edge<.4?1:0;
    }
  },{seed,...options});
}
