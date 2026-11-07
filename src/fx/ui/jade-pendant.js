import { createPureEffect, rhythm, envelope, path, ring, easeOut } from '../../core/motifs.js';
export const meta = { id: 'jade-pendant', name: '玉佩呈印', category: 'ui', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(.12, false);
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta,act,(f,t)=>{
    const a=envelope(t),g=easeOut((t+1/120)/.13),s=Math.sin(t*7)*3*g;
    const draw=(points,width,alpha,tint=0)=>path(f,points.map(([x,y])=>[x*g+s,y*g]),width,alpha,tint);
    draw([[0,-80],[-12,-57],[0,-36],[12,-57],[0,-80]],1.4,a*.65);
    draw([[-19,-43],[19,-43],[28,-30],[28,24],[18,37],[-18,37],[-28,24],[-28,-30],[-19,-43]],3.2,a,1);
    ring(f,5*g,1.5,a,{x:s,y:-28*g});
    draw([[-12,-6],[12,-6],[2,4],[11,16],[-11,16]],2,a*.7);
    for(const x of [-10,0,10])draw([[0,38],[x,56],[x*.7,77]],1.4,a*.6,1);
  },{seed,...options});
}
