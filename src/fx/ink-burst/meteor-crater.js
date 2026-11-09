import { createPureEffect, path, ring, dot, envelope, clamp, easeOut, mulberry32, TAU } from '../../core/motifs.js';
export const meta = { id: 'meteor-crater', name: '隕墨墜', category: 'ink-burst', duration: 1.5,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = { windup: .3, poses: [[-.3,'APPROACH'],[0,'IMPACT','snap'],[.2,'CRATER'],[.8,'SETTLE']],
  hits: [{t:.02,freeze:.12,shakeAmp:4,inkSplash:16}], recovery:.2 };
export function create({ seed = 1, ...options } = {}) {
  const random=mulberry32(seed);
  const debris=Array.from({length:16},()=>[random()*TAU,28+random()*42,1+random()*2]);
  return createPureEffect(meta,act,(f,t)=>{
    if(t<0){const p=clamp(1+t/.3),x=-68*(1-p),y=-74+92*p;
      path(f,[[x-14,y-20],[x,y]],3.8,.65,1);dot(f,x,y,4,.8);return;}
    const a=envelope(t,.04,1.02),g=easeOut(t/.2);
    ring(f,12+58*g,2.8,a,{y:24,squash:.25});
    ring(f,10+30*g,1.3,a*.5,{y:24,squash:.25,tint:1});
    path(f,[[-68,28],[-24,30],[0,21],[30,30],[76,27]],2,a*.7);
    path(f,[[0,25],[-14,40],[-31,36],[-43,47]],1.2,a*.55);
    path(f,[[4,27],[25,43],[40,38],[57,52]],1.2,a*.55);
    for(const [q,r,s] of debris)dot(f,Math.cos(q)*r*g,18-(18+Math.abs(Math.sin(q))*r*.65)*g+50*t*t,s,a*.75,q>5?1:0);
  },{seed,...options});
}
