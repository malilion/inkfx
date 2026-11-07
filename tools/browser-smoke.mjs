import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { isMain, parseArgs, numberOption } from './cli.mjs';

// Use an isolated Chromium profile, not a signed-in user's debugging session.
async function connect(port) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(target => target.type === 'page');
  assert.ok(target, 'Start Chromium with a page and --remote-debugging-port');
  const socket = new WebSocket(target.webSocketDebuggerUrl), pending = new Map(), events = [];
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.close(); reject(new Error('Browser connection timed out')); }, 10000);
    socket.onopen = () => { clearTimeout(timer); resolve(); };
    socket.onerror = () => { clearTimeout(timer); reject(new Error('Browser connection failed')); };
  });
  let id = 0;
  socket.onmessage = event => {
    const message = JSON.parse(event.data), request = pending.get(message.id);
    if (request) {
      clearTimeout(request.timer); pending.delete(message.id);
      message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result);
    } else events.push(message);
  };
  socket.onclose = () => {
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('Browser disconnected')); }
    pending.clear();
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const request = ++id, timer = setTimeout(() => { pending.delete(request); reject(new Error(`${method} timed out`)); }, 20000);
    pending.set(request, { resolve, reject, timer }); socket.send(JSON.stringify({ id: request, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  return { send, evaluate, events, close: () => socket.close() };
}

export async function browserSmoke({ port = 9223, url = 'http://127.0.0.1:8080/gallery/', out = 'artifacts/browser' } = {}) {
  assert.ok(Number.isInteger(port) && port > 0 && port < 65536, 'Invalid CDP port');
  const output = resolve(out);
  await mkdir(output, { recursive: true });
  const downloads = await mkdtemp(join(output, 'downloads-'));
  await rm(join(output, 'report.json'), { force: true });
  const browser = await connect(port), { send, evaluate, events } = browser;
  const waitFor = async expression => {
    const end = Date.now() + 15000;
    while (Date.now() < end) { if (await evaluate(expression)) return; await delay(100); }
    throw new Error(`Browser readiness timed out: ${expression}`);
  };
  const screenshot = async name => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    await writeFile(join(output, name), Buffer.from(data, 'base64'));
  };
  try {
    await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Browser.grantPermissions', { origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await send('Page.navigate', { url }); await send('Page.bringToFront');
    await waitFor('document.querySelectorAll(".fx-card").length === 120');
    await waitFor('[...document.images].every(image => image.complete && image.naturalWidth > 0)');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'desktop horizontal overflow');
    await screenshot('desktop.png');
    const pixels = `(()=>{const c=document.querySelector('#canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=2166136261;for(const n of d)h=Math.imul(h^n,16777619);return h>>>0})()`;
    const palettePixels = new Set();
    for (const palette of ['songyan', 'zhusha', 'shiqing', 'nijin']) {
      await evaluate(`document.querySelector('#toolbar-palette').value='${palette}';document.querySelector('#toolbar-palette').dispatchEvent(new Event('change'))`);
      palettePixels.add(await evaluate(pixels));
    }
    assert.equal(palettePixels.size, 4, 'all four palettes render distinct pixels');
    await evaluate(`document.querySelector('#toolbar-palette').value='shiqing';document.querySelector('#toolbar-palette').dispatchEvent(new Event('change'))`);
    const before = await evaluate(pixels);
    await evaluate(`document.querySelector('#grain').value=3;document.querySelector('#grain').dispatchEvent(new Event('input'))`);
    assert.notEqual(await evaluate(pixels), before, 'grain updates actual pixels');
    const withoutActor = await evaluate(pixels);
    await evaluate(`document.querySelector('#act-toggle').checked=true;document.querySelector('#act-toggle').dispatchEvent(new Event('change'))`);
    assert.notEqual(await evaluate(pixels), withoutActor, 'actor renders on canvas');
    await evaluate(`document.querySelector('#seed').value=42;document.querySelector('#seed').dispatchEvent(new Event('change'));document.querySelector('#copy-source').click()`);
    await waitFor(`document.querySelector('#status').textContent.startsWith('Copied')`);
    assert.equal(await evaluate('navigator.clipboard.readText()'),
      await readFile(new URL('../src/fx/sword/sword-qi-slash.js', import.meta.url), 'utf8'));
    let pngSize;
    for (const [id, suffix] of [['sheet-link', '.png'], ['atlas-link', '.json']]) {
      await evaluate(`document.querySelector('#${id}').click()`);
      await waitFor(`document.querySelector('#status').textContent.startsWith('Exported')`);
      const filename = `sword-qi-slash-shiqing-seed42${suffix}`;
      let bytes;
      for (let attempt = 0; attempt < 50; attempt++) {
        try { bytes = await readFile(join(downloads, filename)); if (bytes.length) break; } catch {}
        await delay(100);
      }
      assert.ok(bytes?.length, `browser download missing: ${filename}`);
      if (suffix === '.png') {
        assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        pngSize = { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) };
        const decoded = await evaluate(`(async()=>{const bitmap=await createImageBitmap(await(await fetch(document.querySelector('#sheet-link').href)).blob());const c=document.createElement('canvas');c.width=bitmap.width;c.height=bitmap.height;const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let visible=0,empty=0;for(let i=3;i<d.length;i+=4){if(d[i])visible++;else empty++}return {w:c.width,h:c.height,visible,empty}})()`);
        assert.ok(decoded.visible > 0 && decoded.empty > 0, 'decoded PNG has ink and transparency');
        assert.deepEqual({ w: decoded.w, h: decoded.h }, pngSize);
      }
      else {
        const atlas = JSON.parse(bytes); assert.ok(Object.keys(atlas.frames).length > 1);
        assert.equal(atlas.meta.image, 'sword-qi-slash-shiqing-seed42.png');
        assert.equal(atlas.meta.inkfx.seed, 42); assert.equal(atlas.meta.inkfx.palette, 'shiqing');
        assert.deepEqual(atlas.meta.size, pngSize);
      }
    }
    // Compare displayed progress with the same real-time interval at both speeds.
    const progress = async slow => {
      await evaluate(`document.querySelector('#slow-toggle').checked=${slow};document.querySelector('#slow-toggle').dispatchEvent(new Event('change'));document.querySelector('#replay').click()`);
      await delay(300);
      const time = await evaluate(`Number(document.querySelector('#timeline').value)`);
      await evaluate(`document.querySelector('#play').click()`);
      return time;
    };
    const normal = await progress(false), slow = await progress(true);
    assert.ok(normal > .1 && slow > 0 && slow / normal < .5, '0.25x slows real playback');
    await evaluate(`document.querySelector('#slow-toggle').checked=false;document.querySelector('#slow-toggle').dispatchEvent(new Event('change'));[...document.querySelectorAll('#effects button')].find(b=>b.querySelector('small').textContent==='enso-breath').click();document.querySelector('#replay').click()`);
    await evaluate(`new Promise((resolve,reject)=>{let previous=0,peak=0;const duration=Number(document.querySelector('#timeline').max),deadline=performance.now()+8000;function frame(){const time=Number(document.querySelector('#timeline').value);peak=Math.max(peak,time);if(peak>duration*.75&&time<previous-.5)return resolve(true);if(performance.now()>deadline)return reject(new Error('Loop did not wrap'));previous=time;requestAnimationFrame(frame)}requestAnimationFrame(frame)})`);
    assert.equal(await evaluate(`document.querySelector('#play').getAttribute('aria-label')`), 'Pause effect', 'loop continues beyond one cycle');
    await evaluate(`document.querySelector('#play').click();document.querySelector('#act-toggle').checked=false;document.querySelector('#act-toggle').dispatchEvent(new Event('change'));document.querySelector('#grain').value=1;document.querySelector('#grain').dispatchEvent(new Event('input'))`);
    await evaluate(`document.querySelector('#category-filter').value='zen';document.querySelector('#category-filter').dispatchEvent(new Event('change'));document.querySelector('.fx-card:not([hidden])').scrollIntoView()`);
    assert.equal(await evaluate('document.querySelectorAll(".fx-card:not([hidden])").length'), 20);
    await waitFor(`Number(document.querySelector('.fx-card:not([hidden])').dataset.time)>0`);
    await screenshot('collection.png');
    await evaluate('scrollTo(0,0)'); await delay(200);
    const stopped = await evaluate(`document.querySelector('.fx-card:not([hidden])').dataset.time`);
    await delay(250);
    assert.equal(await evaluate(`document.querySelector('.fx-card:not([hidden])').dataset.time`), stopped, 'offscreen card pauses');
    await evaluate(`document.querySelector('#category-filter').value='all';document.querySelector('#category-filter').dispatchEvent(new Event('change'));document.querySelector('.fx-card').scrollIntoView()`);
    await delay(300);
    const deltas = await evaluate(`new Promise(resolve=>{const times=[];let last;function frame(now){if(last)times.push(now-last);last=now;if(times.length===120)resolve(times);else requestAnimationFrame(frame)}requestAnimationFrame(frame)})`);
    deltas.sort((a, b) => a - b);
    const timing = { frames: deltas.length, p95Ms: deltas[Math.ceil(deltas.length * .95) - 1], maxMs: deltas.at(-1),
      meanMs: deltas.reduce((sum, n) => sum + n, 0) / deltas.length };
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await evaluate('scrollTo(0,0)'); await delay(200);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'mobile horizontal overflow');
    await screenshot('mobile.png');
    const exceptions = events.filter(event => event.method === 'Runtime.exceptionThrown');
    const failedResponses = events.filter(event => event.method === 'Network.responseReceived' && event.params.response.status >= 400)
      .map(event => ({ url: event.params.response.url, status: event.params.response.status }));
    assert.deepEqual(exceptions, [], 'uncaught browser errors'); assert.deepEqual(failedResponses, [], 'failed browser resources');
    const report = { browser: (await send('Browser.getVersion')).product, url,
      checks: ['120 cards', 'desktop/mobile layout', 'four palettes/grain/actor pixels', 'source clipboard', 'decoded PNG and matching JSON downloads', 'slow motion', 'continuous loop', 'category filter', 'offscreen pause', 'no JS/resource errors'],
      timing, screenshots: ['desktop.png', 'collection.png', 'mobile.png'] };
    await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    return report;
  } finally { browser.close(); }
}
if (isMain(import.meta.url)) {
  const { files, options } = parseArgs(process.argv.slice(2), ['port', 'url', 'out']);
  if (options.help) console.log('Usage: node tools/browser-smoke.mjs [--port 9223] [--url http://127.0.0.1:8080/gallery/] [--out artifacts/browser]\nRequires an isolated Chromium instance with remote debugging enabled.');
  else if (files.length) { console.error('Unexpected effect arguments'); process.exitCode = 1; }
  else browserSmoke({ port: numberOption(options, 'port', 9223), url: options.url, out: options.out })
    .then(report => console.log(JSON.stringify(report, null, 2))).catch(error => { console.error(error); process.exitCode = 1; });
}
