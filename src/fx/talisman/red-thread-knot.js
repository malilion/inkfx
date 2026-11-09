import { createPureEffect, rhythm, envelope, path, easeOut } from '../../core/motifs.js';
export const meta = { id: 'red-thread-knot', name: '結界繩結', category: 'talisman', duration: 1.2,
  loop: false, mode: 'pure', w: 224, h: 224, ox: 112, oy: 112 };
export const act = rhythm(.12, true);
const cords = [[[-42,-24],[42,-24],[42,24],[-42,24],[-42,-24]],
  [[-24,-42],[24,-42],[24,42],[-24,42],[-24,-42]]];
export function create({ seed = 1, ...options } = {}) {
  return createPureEffect(meta, act, (f, t) => {
    const g = easeOut((t + 1 / 120) / .12), a = envelope(t);
    const turn=([x,y])=>[(x-y)*Math.SQRT1_2*g,(x+y)*Math.SQRT1_2*g-8*g];
    for(const cord of cords)path(f,cord.map(turn),3,a,1);
    // Alternate over/under bridges: clear only the crossing, then repaint the
    // upper cord. Paper grain remains intact beneath the gap.
    for(const [k,[x,y]] of [[-24,-24],[24,-24],[-24,24],[24,24]].entries()) {
      const [localX,localY]=turn([x,y]),cx=localX+f.ox,cy=localY+f.oy,r=5*g;
      for(let py=Math.max(0,Math.floor(cy-r));py<=Math.min(f.h-1,Math.ceil(cy+r));py++)for(let px=Math.max(0,Math.floor(cx-r));px<=Math.min(f.w-1,Math.ceil(cx+r));px++) {
        if((px-cx)**2+(py-cy)**2>r*r)continue;
        const i=py*f.w+px;
        f.pigment[i]=0;f.wetness[i]=0;f.tint[i]=0;
      }
      const horizontal=k===0||k===3;
      path(f,[turn([x-(horizontal?9:0),y-(horizontal?0:9)]),turn([x+(horizontal?9:0),y+(horizontal?0:9)])],3,a,1);
    }
    path(f,[[0,26*g],[0,52*g]],1.8,a*.8,1);
    path(f,[[0,46*g],[-4,51*g],[0,56*g],[4,51*g],[0,46*g]],1.7,a,1);
    for (const x of [-16, -5, 5, 16]) path(f, [[0,52*g],[x,68*g],[x*.75,84*g]], 1.4, a*.65);
  }, { seed, ...options });
}
