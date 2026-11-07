# PRD 01 delivery and release status

This repository implements **inkfx (PRD 01)** from the master suite. The OLED/ESP32 compiler and fx-skill-kit product are separate projects. The runtime has 126 registered effects across all six categories; the previous 48-effect progress report is superseded.

| Requirement | Current delivery | Evidence / remaining work |
| --- | --- | --- |
| Pigment/wetness, seeded paper, dry brush, diffusion/fringe | Implemented | Renderer tests exercise channel ranges, transport, paper, and PNG bytes |
| Four mineral palettes | Implemented | songyan, zhusha, shiqing, nijin; multi-seed/palette checks |
| Fixed 120 Hz Sim and Pure engines | Implemented | FPS independence, determinism guards, hit-stop, draw without advance |
| P1: ≥15 sword/transition FX | 45 | 26 swords + 19 transitions |
| P2: ≥80 distinct FX | 126 | 20 ink-burst, 26 sword, 21 talisman, 19 transitions, 19 UI, 21 zen |
| PoC sword action | Implemented | 28 droplets; five named poses; .04s hit/.15s freeze; 1.30s display clock |
| Agent creation and visual feedback loop | Implemented | `skills/inkfx-author/SKILL.md`, local plugin manifest, check/render/review tooling |
| Gallery controls and visible-only playback | Implemented | Palette, grain, slow motion, scrubbing, 120 Hz frame stepping, and loop resume verified. The practice dummy uses authored hit-stop, recoil, camera shake, and seeded ink splash |
| Copy Single-File JS | Implemented | Clipboard and download provide the same self-contained ES module. All 126 modules run independently and reproduce the authored output |
| Transparent/paper sprites and JSON atlas | Implemented | All-FX atlas checks plus real import and playback in Phaser 3.90.0 and Godot 4.6.3. Aseprite import steps are documented |
| Core gzip <4 KB / average FX source <1.8 KB | Measured within target | Renderer-only `src/runtime.js`: 3,952 gzip bytes with esbuild 0.25.12. Mean authored FX source: 937 bytes |
| Single effect <1.2ms at 320×180 on a reference laptop | Apple M1, reusable RGBA | The catalog averages were below 1.2ms in both modes. Transparent p95 was below target for the full run. Paper p95 and the slowest individual frames still varied above target |
| Browser gallery at 60fps | Verified on the reference browser | Chrome 156 measured 16.7ms p95 across desktop (12 cards), wide transitions (16 cards) and mobile (6 cards). Worst intervals were 33.3–50ms |
| Public gallery from private repo | Public site configured | Pages reports `public: true`; repository metadata reports `private: true`. Use the [deployment checks](PAGES.md) to verify the current release |
| Community demonstration video | Linked from the gallery | `examples/demo.mp4` shows 24 effects across four palettes, with 240 decoded H.264 frames over four seconds |

## Validation

The latest local run passed 37/37 tests and 126/126 effect checks. The standalone test loads every effect from a temporary directory and compares its rendered bytes with the original module. Chrome 156 passed against the staged site at the `/inkfx/gallery/` path. The copied effect drew into native ImageData, and the downloaded PNG's alpha matched the clean renderer with Act enabled in the preview. See [browser acceptance](BROWSER.md).

Contact rendering and transparent atlas export were run for `sword-qi-slash`, seed 42, zhusha, into ignored `artifacts/onboarding/`. PNG signatures/dimensions and JSON frame data were verified and the contact sheet visually inspected. These are CPU-generated artifacts, not browser screenshots. Historical optional fx-skill-kit results do not establish that an external kit is installed in a fresh environment.

## Reproduce measurements

The project has no runtime dependencies. The pinned development bundler builds the gallery's single-file downloads and also measures the core bundle.

```sh
mkdir -p artifacts/size
npm ci
npm exec -- esbuild src/runtime.js --bundle --minify --format=esm --outfile=artifacts/size/runtime.js
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {gzipSync} from 'node:zlib'; console.log(gzipSync(readFileSync('artifacts/size/runtime.js')).length)"
node tools/benchmark.mjs --out artifacts/benchmark.json
node tools/benchmark.mjs --width 320 --height 180 --buffer reuse --out artifacts/benchmark-320x180.json
node tools/benchmark.mjs --width 320 --height 180 --buffer reuse --background paper --out artifacts/benchmark-paper-320x180.json
```

The renderer entry includes Sim/Pure, frame, seed, brushes, compositor, timing, diffusion, and palettes. It excludes the FX registry, motif library, PNG encoder, and sprite exporter. `src/index.js` deliberately imports the complete catalog; use individual FX modules and `src/runtime.js` when bundle size matters. Source average is measured on the 126 registered effect files before minification. These figures were refreshed after the brush and geometry refinements.

The benchmark warms up each effect for 120 ticks, then measures 300 steps including draw and composite. Creation, PNG encoding, and file I/O are excluded. On an Apple M1 with Node 26.7.0 at 320×180, paired paper-mode runs lowered the mean for `enso-breath` from 1.25 to 1.10ms and for `mountain-mist` from 1.20 to 1.03ms. A 900-frame spot check measured p95 at 1.19ms for `petal-veil` with its compact bloom cache and 1.22ms for `enso-breath`. The round-sweep, paper-burn, and cloud-curtain geometry optimizations matched their original hashes at every 120 Hz tick across two seeds and three canvas sizes.

## Remote release

The Pages workflow checks both the private repository and the public site before staging the browser files, standalone modules, docs, and examples. See [Pages setup and verification](PAGES.md) for the URL and the checks for the deployed commit.

## Earlier performance refinement

`petal-veil` now precomputes its seed-independent flower geometry once per module and reuses immutable lookups across instances. A sequential same-machine comparison reduced p95 from 26.53ms to 1.81ms at 224×224, excluding creation as in the benchmark contract. The cache retains about 8.1MB and adds one-time initialization work; it trades memory/cold-start cost for lower playback latency. Three seeds × four palettes produced exactly the original full-animation channel/RGBA hashes; two contact sheets were rendered and visually inspected.

The shared dry-brush primitive uses direct squared distance at ordinary canvas scales, retaining `Math.hypot` for radii that could overflow/underflow. At seed 42, all 120 full-animation hashes matched the pre-change renderer. Dedicated tests protect extreme radii and cached petal output. These improvements do not certify the PRD's reference-laptop budget: the native-size `realm-breakthrough` measurement still exceeded it. The former command-line capture timeout is resolved by connecting directly to Chromium DevTools. Real gallery screenshots and functional checks now pass; command-line process termination is no longer used as browser readiness evidence.

## Presentation clip

`node tools/demo.mjs` optionally uses ffmpeg/libx264 to encode a 24-effect, four-palette 6×4 grid. Default output is ignored `artifacts/inkfx-demo.mp4`; the curated copy is `examples/demo.mp4`. ffprobe verified H.264, 946×720, 60/1 FPS, 240 decoded frames, and exactly 4 seconds. The entire video was decoded without errors and an extracted frame visually inspected. It is offline procedural animation, not a browser screen capture or evidence of interactive 60fps. Publishing it to a community account remains outside the completed release work.

## Earlier browser and compositor refinement

The compositor now handles empty pixels directly and computes RGB channels without the inner channel loop. Golden-byte tests preserve the original output across four palettes, paper/transparent modes, three grain settings, ramp knots, and clamped/invalid input. Shared brush bounds and row distances are computed once per dab/row. In a sequential native-size comparison, the slash p95 fell from 1.39ms to 0.91ms.

`realm-breakthrough` replaces overlapping broad petals with two ink rings and eight fine curved rays. Three visual review rounds plus an alternate palette/seed were inspected; its curated contact sheet was refreshed. On the requested 320×180 canvas, the final cloud run measured slash mean 0.82ms / p95 1.04ms, and realm mean 1.08ms / p95 1.34ms. Max timings were 3.18ms and 1.44ms respectively. These observations are progress, not a claim that every frame or the full catalog meets 1.2ms on the PRD reference laptop. That hardware-level acceptance remains open.

The gallery no longer throttles thumbnails to 24fps: visible cards follow requestAnimationFrame, while offscreen cards do not allocate or advance. The Chrome 156 harness checks real pixels, source clipboard content, decoded PNG transparency, matching JSON, a complete loop crossing, slow motion, and desktop/mobile layouts. The tested viewport was approximately 60fps, with p95 RAF intervals around 16.8ms; results are machine/viewport dependent. Browser CI saves screenshots and current-run download artifacts for review. The local server also now serves the brand SVG and ICO files with their correct MIME types.

## Six-study expansion: 126 effects

The new `scabbard-parry`, `red-thread-knot`, `tea-steam`, `meteor-crater`, `rain-pool-wipe`, and `jade-pendant` add one distinct study per category. They reuse the existing fixed-tick Pure renderer and mineral palettes without new runtime dependencies. Gallery headings, the browser harness, and demo headings now derive their count from the registry.

All six passed 72 combinations (three seeds × four palettes). Initial contact sheets were inspected at seed 42/zhusha, then alternate sheets at seed 0/shiqing. Refinement added actual over/under cord bridges with connected tassels, upward ballistic meteor debris and ground cracks, and seeded position/arrival differences for the rain pools. Final curated contact sheets are committed under `examples/out/<id>/`.

Behavior tests cover full-cycle seeded steam, meteor approach and hit-stop, and monotonic rain-pool coverage ending at a fully covered canvas. The real-Chrome harness additionally opens and verifies every registered canvas preview, instead of checking only the card count; all 126 previews and actual downloads passed. This run measured mean RAF interval 17.64ms / p95 33.2ms after scanning the whole catalog. It is functional acceptance, not a universal 60fps certification.
