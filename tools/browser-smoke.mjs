import assert from 'node:assert/strict';
import { effects, categoryCounts } from '../src/fx/index.js';
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
  const samplePlayback = async (width, height, mobile, category) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
    await evaluate(`(() => {
      const filter = document.querySelector('#category-filter');
      filter.value = ${JSON.stringify(category)};
      filter.dispatchEvent(new Event('change'));
      document.querySelector('.fx-card:not([hidden])').scrollIntoView({ behavior: 'instant' });
    })()`);
    await delay(300);
    const visible = await evaluate(`[...document.querySelectorAll('.fx-card:not([hidden])')].filter(card => {
      const bounds = card.getBoundingClientRect();
      return Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0) >= bounds.height * .05;
    }).length`);
    const deltas = await evaluate(`new Promise(resolve => {
      const times = []; let last;
      function frame(now) {
        if (last) times.push(now - last);
        last = now;
        if (times.length === 120) resolve(times); else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })`);
    deltas.sort((a, b) => a - b);
    return { width, height, category, visible, frames: deltas.length,
      p95Ms: deltas[Math.ceil(deltas.length * .95) - 1], maxMs: deltas.at(-1),
      meanMs: deltas.reduce((sum, n) => sum + n, 0) / deltas.length };
  };
  try {
    await send('Runtime.enable'); await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Browser.grantPermissions', { origin: new URL(url).origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
    await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await send('Page.navigate', { url }); await send('Page.bringToFront');
    await waitFor(`document.querySelectorAll(".fx-card").length === ${effects.length}`);
    await waitFor('[...document.images].every(image => image.complete && image.naturalWidth > 0)');
    await evaluate('document.fonts.ready');
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'desktop horizontal overflow');
    await waitFor(`document.querySelector('#opening-canvas').dataset.time === '3.000'`);
    await screenshot('desktop.png');
    await evaluate(`document.querySelector('#opening-play').click()`);
    await waitFor(`Number(document.querySelector('#opening-canvas').dataset.time) >= 1.20`);
    await evaluate(`document.querySelector('#opening-play').click()`);
    await screenshot('opening-strike.png');
    await evaluate(`document.querySelector('#opening-play').click()`);
    await waitFor(`document.querySelector('#opening-canvas').dataset.time === '3.000'`);
    await evaluate(`document.querySelector('#opening-try').click()`);
    assert.equal(await evaluate(`document.querySelector('#play').getAttribute('aria-label')`), '暫停特效', 'opening starts the real workshop effect');
    await evaluate(`document.querySelector('#timeline').value='.64';document.querySelector('#timeline').dispatchEvent(new Event('input'))`);
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
    const beforeImpactScrub = await evaluate(`(() => {
      const timeline = document.querySelector('#timeline');
      const previous = timeline.value;
      timeline.value = '.45';
      timeline.dispatchEvent(new Event('input'));
      return previous;
    })()`);
    assert.match(await evaluate(`document.querySelector('#canvas').style.transform`), /^translateX\(/, 'hit shakes the preview');
    const atImpact = await evaluate(pixels);
    await evaluate(`document.querySelector('.workbench').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await screenshot('act-hit.png');
    await evaluate(`const toggle = document.querySelector('#act-toggle'); toggle.checked = false; toggle.dispatchEvent(new Event('change'))`);
    assert.equal(await evaluate(`document.querySelector('#canvas').style.transform`), '', 'disabling act clears shake');
    assert.notEqual(await evaluate(pixels), atImpact, 'disabling act removes the hit overlay');
    await evaluate(`const timeline = document.querySelector('#timeline'); timeline.value = ${JSON.stringify(beforeImpactScrub)}; timeline.dispatchEvent(new Event('input'))`);
    await evaluate(`document.querySelector('#seed').value=42;document.querySelector('#seed').dispatchEvent(new Event('change'));document.querySelector('#copy-source').click()`);
    await waitFor(`document.querySelector('#status').dataset.state === 'copied'`);
    assert.equal(await evaluate(`(async () => {
      const source = await navigator.clipboard.readText();
      const response = await fetch(document.querySelector('#source-link').href);
      if (!response.ok || source !== await response.text()) return false;
      // Import the same-origin source link (verified identical to the clipboard above):
      // the gallery's strict CSP (script-src 'self') forbids blob: module imports.
      {
        const { create, meta, act } = await import(document.querySelector('#source-link').href);
        const instance = create({ seed: 42, palette: 'shiqing' });
        instance.step(act.windup + .24);
        const pixels = new ImageData(meta.w, meta.h);
        const rendered = instance.draw(pixels);
        return rendered === pixels && meta.id === 'sword-qi-slash' && pixels.data.some((n, i) => i % 4 === 3 && n > 0);
      }
    })()`), true, 'clipboard produces a standalone module with visible output');
    const frameTime = await evaluate(`(() => {
      document.querySelector('#next-frame').click();
      return Number(document.querySelector('#timeline').value);
    })()`);
    assert.ok(Math.abs(frameTime - 77 / 120) < .001, 'steps one fixed simulation frame');
    await evaluate(`document.querySelector('#act-toggle').click()`);
    let pngSize;
    for (const [id, suffix] of [['sheet-link', '.png'], ['atlas-link', '.json']]) {
      await evaluate(`document.querySelector('#${id}').click()`);
      await waitFor(`document.querySelector('#status').dataset.state === 'exported'`);
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
        const decoded = await evaluate(`(async () => {
          // Decode the downloaded bytes directly: strict CSP (connect-src 'self') blocks fetching blob: links.
          const raw = atob(${JSON.stringify(bytes.toString('base64'))});
          const png = new Blob([Uint8Array.from(raw, c => c.charCodeAt(0))], { type: 'image/png' });
          const bitmap = await createImageBitmap(png);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0);
          const decoded = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          const [{ buildSheet }, effect] = await Promise.all([
            import('../src/core/sheet.js'), import('../src/fx/sword/sword-qi-slash.js')
          ]);
          const { data: expected } = buildSheet(effect, { seed: 42, palette: 'shiqing', grain: 3 });
          let visible = 0, empty = 0, differentAlpha = 0;
          for (let i = 3; i < decoded.length; i += 4) {
            if (decoded[i]) visible++; else empty++;
            if (decoded[i] !== expected[i]) differentAlpha++;
          }
          return { w: canvas.width, h: canvas.height, visible, empty, differentAlpha };
        })()`);
        assert.ok(decoded.visible > 0 && decoded.empty > 0, 'decoded PNG has ink and transparency');
        assert.equal(decoded.differentAlpha, 0, 'downloaded PNG excludes the enabled actor overlay');
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
    assert.equal(await evaluate(`document.querySelector('#play').getAttribute('aria-label')`), '暫停特效', 'loop continues beyond one cycle');
    await evaluate(`document.querySelector('#play').click();document.querySelector('#act-toggle').checked=false;document.querySelector('#act-toggle').dispatchEvent(new Event('change'));document.querySelector('#grain').value=1;document.querySelector('#grain').dispatchEvent(new Event('input'))`);
    const previews = await evaluate(`(async()=>{
      document.querySelector('#grain').value=0;document.querySelector('#grain').dispatchEvent(new Event('input'));
      const {palettes}=await import('../src/palettes/index.js');
      const hex=palettes[document.querySelector('#toolbar-palette').value].stops[0];
      const paper=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),blank=[];
      const buttons=[...document.querySelectorAll('#effects button')];
      for(let n=0;n<buttons.length;n++){
        buttons[n].click();const c=document.querySelector('#canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let ink=false;for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-paper[0])+Math.abs(data[i+1]-paper[1])+Math.abs(data[i+2]-paper[2])>8){ink=true;break}
        if(!ink)blank.push(buttons[n].querySelector('small').textContent);
        if(n%12===0)await new Promise(requestAnimationFrame);
      }
      document.querySelector('#grain').value=1;document.querySelector('#grain').dispatchEvent(new Event('input'));
      return {count:buttons.length,blank};
    })()`);
    assert.equal(previews.count, effects.length); assert.deepEqual(previews.blank, [], 'every real canvas preview contains ink');
    await evaluate(`document.querySelector('#category-filter').value='zen';document.querySelector('#category-filter').dispatchEvent(new Event('change'));document.querySelector('.fx-card:not([hidden])').scrollIntoView({ behavior: 'instant' })`);
    assert.equal(await evaluate('document.querySelectorAll(".fx-card:not([hidden])").length'), categoryCounts.zen);
    await waitFor(`Number(document.querySelector('.fx-card:not([hidden])').dataset.time)>0`);
    await evaluate(`document.querySelector('#collection').scrollIntoView({ behavior: 'instant' })`);
    await screenshot('collection.png');
    await evaluate("scrollTo({ top: 0, behavior: 'instant' })"); await delay(200);
    const stopped = await evaluate(`document.querySelector('.fx-card:not([hidden])').dataset.time`);
    await delay(250);
    assert.equal(await evaluate(`document.querySelector('.fx-card:not([hidden])').dataset.time`), stopped, 'offscreen card pauses');
    const search = await evaluate(`(() => {
      const input = document.querySelector('#catalog-search');
      input.value = '竹葉';
      input.dispatchEvent(new Event('input'));
      const names = [...document.querySelectorAll('.fx-card:not([hidden]) h3')].map(card => card.textContent);
      input.value = 'inkfx-no-result';
      input.dispatchEvent(new Event('input'));
      const empty = !document.querySelector('#catalog-empty').hidden;
      document.querySelector('#catalog-reset').click();
      const resetFocus = document.activeElement === input;
      const start = document.querySelectorAll('.fx-card:not([hidden])').length;
      document.querySelector('#catalog-more-button').click();
      const more = document.querySelectorAll('.fx-card:not([hidden])').length;
      return { names, empty, resetFocus, start, more, moreFocus: document.activeElement.matches('.card-preview') };
    })()`);
    assert.deepEqual(search, { names: ['竹葉隨風'], empty: true, resetFocus: true, start: 12, more: 24, moreFocus: true });
    await evaluate(`document.querySelector('#catalog-reset').click();document.activeElement.blur();document.querySelector('#collection').scrollIntoView({ behavior: 'instant' })`);
    await delay(450);
    await screenshot('curated.png');
    await evaluate(`document.querySelector('#view-compact').click()`);
    assert.equal(await evaluate(`document.querySelector('#fx-grid').dataset.layout`), 'compact', 'switches catalog to compact index view');
    await evaluate(`document.querySelector('#view-curated').click()`);
    await evaluate(`document.querySelector('#anatomy').scrollIntoView({ behavior: 'instant' })`);
    await delay(300);
    await screenshot('anatomy.png');
    await evaluate(`document.querySelector('[data-cover="enso-breath"] .card-preview').click()`);
    assert.deepEqual(await evaluate(`[document.querySelector('#effect-title').textContent, document.activeElement.id]`),
      ['禪圓', 'workbench-title'], 'the catalog opens its exact effect and focuses the studio');
    await evaluate(`document.querySelectorAll('#filmstrip .kf-item')[2].click()`);
    assert.ok(await evaluate(`Number(document.querySelector('#timeline').value) > 0`), 'filmstrip keyframe seeks timeline');
    await evaluate(`document.querySelector('.surface-btn[data-surface="dark"]').click();document.querySelector('#onion-toggle').click()`);
    assert.equal(await evaluate(`document.querySelector('#stage').dataset.surface`), 'dark', 'switches studio stage to dark night mode');
    await delay(200);
    await screenshot('studio-dark.png');
    await evaluate(`document.querySelector('.surface-btn[data-surface="paper"]').click();document.querySelector('#onion-toggle').click();document.querySelector('#toolbar-palette').value='songyan';document.querySelector('#toolbar-palette').dispatchEvent(new Event('change'))`);
    const timing = await samplePlayback(1440, 1000, false, 'all');
    const transitionsTiming = await samplePlayback(1920, 1440, false, 'transitions');
    const mobileTiming = await samplePlayback(390, 844, true, 'all');
    await evaluate("scrollTo({ top: 0, behavior: 'instant' })"); await delay(200);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'mobile horizontal overflow');
    await screenshot('mobile.png');
    await evaluate(`document.querySelector('#workbench').scrollIntoView({ behavior: 'instant' })`);
    await screenshot('mobile-studio.png');
    for (const [width, height] of [[320, 720], [768, 1024]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `horizontal overflow at ${width}px`);
      await evaluate("scrollTo({ top: 0, behavior: 'instant' })");
      await screenshot(`viewport-${width}.png`);
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.reload');
    await waitFor(`document.querySelector('#opening-canvas')?.dataset.time === '3.000'`);
    assert.equal(await evaluate(`document.querySelector('#opening-play').getAttribute('aria-label')`), '重播開場', 'reduced motion loads a still');
    await send('Emulation.setEmulatedMedia', { features: [] });
    const exceptions = events.filter(event => event.method === 'Runtime.exceptionThrown');
    const failedResponses = events.filter(event => event.method === 'Network.responseReceived' && event.params.response.status >= 400)
      .map(event => ({ url: event.params.response.url, status: event.params.response.status }));
    assert.deepEqual(exceptions, [], 'uncaught browser errors'); assert.deepEqual(failedResponses, [], 'failed browser resources');
    const report = { browser: (await send('Browser.getVersion')).product, url,
      checks: [`${effects.length} cards and rendered previews`, 'live overture and studio handoff', 'reduced motion still', 'desktop/mobile layout', 'four palettes and grain', 'act impact overlay and camera shake', 'standalone module from clipboard', 'decoded PNG and matching JSON downloads', 'slow motion and 120 Hz stepping', 'continuous loop', 'search, empty state, category and progressive reveal', 'offscreen pause', 'no JS/resource errors'],
      timing, viewportTimings: [timing, transitionsTiming, mobileTiming],
      screenshots: ['desktop.png', 'opening-strike.png', 'act-hit.png', 'collection.png', 'curated.png', 'mobile.png', 'mobile-studio.png', 'viewport-320.png', 'viewport-768.png'] };
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
