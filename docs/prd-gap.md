# PRD 01 delivery and release status

This repository implements **inkfx (PRD 01)** from the master suite. The OLED/ESP32 compiler and fx-skill-kit product are separate projects. The runtime has 120 registered effects across all six categories; the previous 48-effect progress report is superseded.

| Requirement | Current delivery | Evidence / remaining work |
| --- | --- | --- |
| Pigment/wetness, seeded paper, dry brush, diffusion/fringe | Implemented | Renderer tests exercise channel ranges, transport, paper, and PNG bytes |
| Four mineral palettes | Implemented | songyan, zhusha, shiqing, nijin; multi-seed/palette checks |
| Fixed 120 Hz Sim and Pure engines | Implemented | FPS independence, determinism guards, hit-stop, draw without advance |
| P1: ≥15 sword/transition FX | 43 | 25 swords + 18 transitions |
| P2: ≥80 distinct FX | 120 | 19 ink-burst, 25 sword, 20 talisman, 18 transitions, 18 UI, 20 zen |
| PoC sword action | Implemented | 28 droplets; five named poses; .04s hit/.15s freeze; 1.30s display clock |
| Agent creation and visual feedback loop | Implemented | `skills/inkfx-author/SKILL.md`, local plugin manifest, check/render/review tooling |
| Gallery controls and visible-only playback | Implemented | Palette/grain/actor/slow-motion/scrubbing/copy controls tested with real renderer and DOM fixture; loops continue without the one-shot hold |
| Copy Single-File JS | Implemented | Fetches actual module source; clipboard and HTTP failures show a fallback; shared imports are still required |
| Transparent/paper sprites and JSON atlas | Implemented | Shared browser/CLI builder; all-FX atlas test; hit timing, transparency, PNG CRC and scanlines tested |
| Core gzip <4 KB / average FX source <1.8 KB | Measured within target | Renderer-only `src/runtime.js`: 3,769 gzip bytes with esbuild 0.25.12; mean FX source: 904.083 bytes |
| Single effect <1.2ms at 320×180 on a reference laptop | **Not accepted** | Cloud native-size benchmark identifies slower effects; no reference-laptop certification |
| Browser gallery at 60fps | Real-browser functionality verified; viewport timing measured | Chrome 156: desktop/mobile screenshots, all controls, clipboard, real decoded downloads, loops, and visibility tests pass; ~60fps observed in the tested desktop viewport, not a universal device guarantee |
| Public gallery from private repo | Blocked by GitHub site-visibility permissions | Owner permits public website, requires private repo; see [Pages setup](PAGES.md) |
| Community demonstration video/publication | Offline MP4 delivered; community publication pending | `examples/demo.mp4`: 6×4 effects, four palettes, H.264, 60fps, 240 decoded frames / 4 seconds; not a browser performance recording |

## Validation

The latest full run completed all **32 tests** with no failures or skips and all **120/120** local effect checks. This includes gallery copy/loop behavior, the renderer-only entry, benchmarks, extreme brush radii, cached animation regression tests, original compositor-byte preservation, and isolated canvas-size benchmark overrides. A separate real-Chrome harness verifies the gallery end to end; see [browser acceptance](BROWSER.md). The full test suite exercises all effects at four seed/palette combinations and can take several minutes.

Contact rendering and transparent atlas export were run for `sword-qi-slash`, seed 42, zhusha, into ignored `artifacts/onboarding/`. PNG signatures/dimensions and JSON frame data were verified and the contact sheet visually inspected. These are CPU-generated artifacts, not browser screenshots. Historical optional fx-skill-kit results do not establish that an external kit is installed in a fresh environment.

## Reproduce measurements

The project has no runtime dependencies. esbuild below is an optional, pinned measurement tool, not a runtime or build prerequisite:

```sh
mkdir -p artifacts/size
npm exec --yes --package=esbuild@0.25.12 -- esbuild src/runtime.js --bundle --minify --format=esm --outfile=artifacts/size/runtime.js
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {gzipSync} from 'node:zlib'; console.log(gzipSync(readFileSync('artifacts/size/runtime.js')).length)"
node tools/benchmark.mjs --out artifacts/benchmark.json
node tools/benchmark.mjs sword-qi-slash --width 320 --height 180 --out artifacts/benchmark-320x180.json
```

The renderer entry includes Sim/Pure, frame, seed, brushes, compositor, timing, diffusion, and palettes. It excludes the FX registry, motif library, PNG encoder, and sprite exporter. `src/index.js` deliberately imports the complete catalog; use individual FX modules and `src/runtime.js` when bundle size matters. Source average is measured on the 120 registered effect files before minification. These figures were refreshed after the brush and geometry refinements.

The benchmark warms up each effect, then measures 300 fixed steps including draw/composite at its native dimensions, replaying finite effects. Creation, PNG encoding, and file I/O are excluded. The initial cloud run (with other validation running) recorded `petal-veil` p95 around 36ms and `realm-breakthrough` around 20ms at 224×224. These observations identify optimization work, not portable thresholds. Profile full-frame geometry and overlapping brush work, remeasure without concurrent workloads, and use baked sheets on constrained clients. Do not claim the PRD performance budget has passed.

## Remote release prerequisites

Git and repository/Actions API access work through the platform proxy after the network policy update. The repo is confirmed private and remote CI passes. Both the agent's Pages-settings read and the workflow's site-visibility update return GitHub integration-permission errors (403). The public URL currently returns 404. See [Pages diagnostics and administrator action](PAGES.md); publishing the cloud environment does not fix GitHub account permissions.

The Pages workflow retains the private-repository guard and removes the obsolete requirement that the website itself be private. It verifies public site visibility through the Pages API, stages only browser assets, and uses GitHub's Pages actions. Site visibility must be configured by an administrator because the workflow token cannot change it (403). Enabling Pages and plan eligibility remain repository/account settings. Verify the exact deployed commit and public logged-out access before marking the public gallery delivered. Never change repository visibility to resolve a Pages restriction.

## Performance refinement

`petal-veil` now precomputes its seed-independent flower geometry once per module and reuses immutable lookups across instances. A sequential same-machine comparison reduced p95 from 26.53ms to 1.81ms at 224×224, excluding creation as in the benchmark contract. The cache retains about 8.1MB and adds one-time initialization work; it trades memory/cold-start cost for lower playback latency. Three seeds × four palettes produced exactly the original full-animation channel/RGBA hashes; two contact sheets were rendered and visually inspected.

The shared dry-brush primitive uses direct squared distance at ordinary canvas scales, retaining `Math.hypot` for radii that could overflow/underflow. At seed 42, all 120 full-animation hashes matched the pre-change renderer. Dedicated tests protect extreme radii and cached petal output. These improvements do not certify the PRD's reference-laptop budget: the native-size `realm-breakthrough` measurement still exceeded it. The former command-line capture timeout is resolved by connecting directly to Chromium DevTools. Real gallery screenshots and functional checks now pass; command-line process termination is no longer used as browser readiness evidence.

## Presentation clip

`node tools/demo.mjs` optionally uses ffmpeg/libx264 to encode a 24-effect, four-palette 6×4 grid. Default output is ignored `artifacts/inkfx-demo.mp4`; the curated copy is `examples/demo.mp4`. ffprobe verified H.264, 946×720, 60/1 FPS, 240 decoded frames, and exactly 4 seconds. The entire video was decoded without errors and an extracted frame visually inspected. It is offline procedural animation, not a browser screen capture or evidence of interactive 60fps. Publishing it to a community account remains outside the completed release work.

## Final browser and compositor refinement

The compositor now handles empty pixels directly and computes RGB channels without the inner channel loop. Golden-byte tests preserve the original output across four palettes, paper/transparent modes, three grain settings, ramp knots, and clamped/invalid input. Shared brush bounds and row distances are computed once per dab/row. In a sequential native-size comparison, the slash p95 fell from 1.39ms to 0.91ms.

`realm-breakthrough` replaces overlapping broad petals with two ink rings and eight fine curved rays. Three visual review rounds plus an alternate palette/seed were inspected; its curated contact sheet was refreshed. On the requested 320×180 canvas, the final cloud run measured slash mean 0.82ms / p95 1.04ms, and realm mean 1.08ms / p95 1.34ms. Max timings were 3.18ms and 1.44ms respectively. These observations are progress, not a claim that every frame or the full catalog meets 1.2ms on the PRD reference laptop. That hardware-level acceptance remains open.

The gallery no longer throttles thumbnails to 24fps: visible cards follow requestAnimationFrame, while offscreen cards do not allocate or advance. The Chrome 156 harness checks real pixels, source clipboard content, decoded PNG transparency, matching JSON, a complete loop crossing, slow motion, and desktop/mobile layouts. The tested viewport was approximately 60fps, with p95 RAF intervals around 16.8ms; results are machine/viewport dependent. Browser CI saves screenshots and current-run download artifacts for review. The local server also now serves the brand SVG and ICO files with their correct MIME types.
