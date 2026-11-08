import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inflateSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { effects, effectPaths, categoryCounts, getFX } from '../src/fx/index.js';
import { buildSheet } from '../src/core/sheet.js';
import { exportSheet, main as exportMain } from '../tools/export-sheet.mjs';
import { adapterSource } from '../tools/skill-kit.mjs';
import { root } from '../tools/cli.mjs';
import { checkFX } from '../tools/check.mjs';

async function temporary(t) { const dir = await mkdtemp(join(tmpdir(), 'inkfx-export-')); t.after(() => rm(dir, { recursive: true, force: true })); return dir; }
function decode(buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137,80,78,71,13,10,26,10], 'PNG magic');
  let w, h, chunks=[];
  for(let i=8;i<buffer.length;){const n=buffer.readUInt32BE(i), type=buffer.toString('ascii',i+4,i+8), bytes=buffer.subarray(i+8,i+8+n);if(type==='IHDR'){w=bytes.readUInt32BE(0);h=bytes.readUInt32BE(4);}if(type==='IDAT')chunks.push(bytes);i+=12+n;}
  const rows=inflateSync(Buffer.concat(chunks)), rgba=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++){assert.equal(rows[y*(w*4+1)],0);rows.copy(rgba,y*w*4,y*(w*4+1)+1,(y+1)*(w*4+1));}
  return {w,h,rgba};
}

test('catalog contains >=100 unique single-file FX, >=15 sword/transitions, and every module', async () => {
  assert.ok(effects.length >= 100); assert.ok(categoryCounts.sword + categoryCounts.transitions >= 15);
  assert.deepEqual(categoryCounts, {'ink-burst':21,sword:27,talisman:22,transitions:20,ui:20,zen:22});
  assert.equal(new Set(effects.map(fx=>fx.meta.id)).size,effects.length);
  const files=(await readdir(join(root,'src/fx'),{withFileTypes:true})).filter(e=>e.isDirectory());
  const discovered=[]; for(const category of files) for(const name of await readdir(join(root,'src/fx',category.name))) if(name.endsWith('.js'))discovered.push(`src/fx/${category.name}/${name}`);
  assert.deepEqual(Object.values(effectPaths).sort(),discovered.sort());
  for(const fx of effects) { assert.equal(getFX(`${fx.meta.category}/${fx.meta.id}`),fx); assert.ok(fx.act); }
  const pkg=JSON.parse(await readFile(join(root,'package.json')));
  assert.equal(Object.keys(pkg.dependencies??{}).length,0);
});

test('export-sheet writes real transparent and paper PNGs and timing-aware atlas', async t => {
  const out=await temporary(t), fx=getFX('sword-qi-slash');
  for(const paper of [false,true]) {
    const result=await exportSheet(join(root,effectPaths[fx.meta.id]),{outDir:join(out,String(paper)),seed:42,palette:'zhusha',fps:10,columns:1,paper});
    const png=decode(await readFile(result.png)), atlas=JSON.parse(await readFile(result.json,'utf8'));
    assert.deepEqual(atlas.meta.size,{w:png.w,h:png.h}); assert.equal(atlas.meta.image,'sheet.png');
    const frames=Object.values(atlas.frames); assert.equal(frames.length,13);
    assert.ok(Math.abs(frames.reduce((sum,f)=>sum+f.duration,0)-1300)<1e-8);
    for(const f of frames){assert.ok(f.frame.x+f.frame.w<=png.w);assert.ok(f.frame.y+f.frame.h<=png.h);assert.equal(f.trimmed,false);}
    const timing=atlas.meta.inkfx.act; assert.equal(timing.windup,.4);assert.equal(timing.hits[0].t,.04);assert.equal(timing.hits[0].freeze,.15);assert.equal(timing.hits[0].frame,4);assert.equal(timing.hits[0].inkSplash,24);
    if(paper) assert.ok(png.rgba.every((v,i)=>i%4!==3||v===255));
    else {assert.ok(png.rgba.some((v,i)=>i%4===3&&v===0));assert.ok(png.rgba.some((v,i)=>i%4===3&&v>0&&v<255));}
  }
});

test('shared sheet builder covers all FX and reproduces identical atlas bytes', () => {
  for(const fx of effects) {
    const a=buildSheet(fx,{fps:4,seed:0,columns:3}), b=buildSheet(fx,{fps:4,seed:0,columns:3});
    assert.deepEqual(a.data,b.data,fx.meta.id); assert.deepEqual(a.atlas,b.atlas);
    assert.ok(a.data.some((v,i)=>i%4===3&&v>0),fx.meta.id);
  }
});

test('sheet options reject malformed and oversized requests', async () => {
  const fx=getFX('draw-cut');
  for(const options of [{fps:0},{fps:121},{fps:NaN},{columns:0},{columns:1.5},{seed:-1},{grain:4}])assert.throws(()=>buildSheet(fx,options));
  assert.throws(()=>buildSheet({...fx,meta:{...fx.meta,duration:60,w:1000,h:1000}},{fps:120}),/size limit/);
  await assert.rejects(()=>exportMain(['draw-cut','--background','invalid']),/background/);
});

test('fx-skill-kit bridge maps negative windup to the same display pixels', async t => {
  const dir=await temporary(t), source=getFX('sword-qi-slash'), file=join(dir,'bridge.mjs');
  await writeFile(file,adapterSource(join(root,effectPaths[source.meta.id])));
  const bridge=await import(pathToFileURL(file)); const wrapper=bridge.create({seed:42});
  assert.ok(Math.abs(bridge.meta.duration-.9)<1e-10);
  const target={w:224,h:224,data:new Uint8ClampedArray(224*224*4)};
  wrapper.t=-.4; wrapper.draw(target); assert.ok(target.data.every((v,i)=>i%4!==3||v===0));
  wrapper.step(.9); wrapper.draw(target);
  const original=source.create({seed:42}); original.step(.9);
  const direct={...target,data:new Uint8ClampedArray(target.data.length)}; original.draw(direct);
  assert.deepEqual(target.data,direct.data);
});

test('determinism guard blocks wall clocks and restores Date.now', async t => {
  const now=Date.now, dir=await temporary(t), file=join(dir,'clock.mjs');
  await writeFile(file,`Date.now(); export const meta={};`);
  const result=await checkFX(file); assert.equal(result.pass,false);assert.match(result.checks[0].detail,/Date.now is forbidden/); assert.equal(Date.now,now);
});

test('quality check rejects a brief visible intro followed by a long dead tail', async t => {
  const dir=await temporary(t), file=join(dir,'dead-tail.mjs');
  await writeFile(file,`export const meta={id:'dead-tail',duration:1,loop:false,w:16,h:16,ox:8,oy:8};
    export function create(){return{t:0,step(dt){this.t+=dt},draw(f){f.pigment.fill(0);f.wetness.fill(0);if(this.t<.1)f.pigment[136]=.8}}}`);
  const result=await checkFX(file); assert.equal(result.pass,false); assert.equal(result.checks.find(c=>c.id==='CHK-04').pass,false);
});
