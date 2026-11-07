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
| Core gzip <4 KB / average FX source <1.8 KB | Measured within target | Renderer-only `src/runtime.js`: 3,607 gzip bytes with esbuild 0.25.12; mean FX source: 892.775 bytes |
| Single effect <1.2ms at 320×180 on a reference laptop | **Not accepted** | Cloud native-size benchmark identifies slower effects; no reference-laptop certification |
| Browser gallery at 60fps | **Not accepted** | HTTP and DOM integration pass; headless Chromium timed out without a DOM or screenshot; no browser frame-rate claim |
| Public gallery from private repo | Workflow prepared; remote verification pending | Owner permits public website, requires private repo; see [Pages setup](PAGES.md) |
| Community demonstration video/publication | Not delivered | Requires a verified browser capture and publication; do not substitute a contact-sheet image for a video |

## Validation

The onboarding baseline completed all **26 tests** with no failures or skips and all **120/120** local effect checks. Subsequent gallery copy/loop changes and renderer-entry/benchmark behavior are covered by focused tests. The full test suite exercises all effects at four seed/palette combinations and can take several minutes.

Contact rendering and transparent atlas export were run for `sword-qi-slash`, seed 42, zhusha, into ignored `artifacts/onboarding/`. PNG signatures/dimensions and JSON frame data were verified and the contact sheet visually inspected. These are CPU-generated artifacts, not browser screenshots. Historical optional fx-skill-kit results do not establish that an external kit is installed in a fresh environment.

## Reproduce measurements

The project has no runtime dependencies. esbuild below is an optional, pinned measurement tool, not a runtime or build prerequisite:

```sh
mkdir -p artifacts/size
npm exec --yes --package=esbuild@0.25.12 -- esbuild src/runtime.js --bundle --minify --format=esm --outfile=artifacts/size/runtime.js
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {gzipSync} from 'node:zlib'; console.log(gzipSync(readFileSync('artifacts/size/runtime.js')).length)"
node tools/benchmark.mjs --out artifacts/benchmark.json
```

The renderer entry includes Sim/Pure, frame, seed, brushes, compositor, timing, diffusion, and palettes. It excludes the FX registry, motif library, PNG encoder, and sprite exporter. `src/index.js` deliberately imports the complete catalog; use individual FX modules and `src/runtime.js` when bundle size matters. Source average is measured on the 120 registered effect files before minification.

The benchmark warms up each effect, then measures 300 fixed steps including draw/composite at its native dimensions, replaying finite effects. Creation, PNG encoding, and file I/O are excluded. The initial cloud run (with other validation running) recorded `petal-veil` p95 around 36ms and `realm-breakthrough` around 20ms at 224×224. These observations identify optimization work, not portable thresholds. Profile full-frame geometry and overlapping brush work, remeasure without concurrent workloads, and use baked sheets on constrained clients. Do not claim the PRD performance budget has passed.

## Remote release prerequisites

Git read access works through the platform proxy. The initial GitHub API calls were blocked by cloud destination policy. `api.github.com` and `malilion.github.io` were saved as additive custom domains in the environment draft; the running policy must apply those changes before API/website verification can resume. A saved draft does not itself apply runtime networking or publish a website.

The Pages workflow retains the private-repository guard and removes the obsolete requirement that the website itself be private. It ensures public site visibility through the Pages API, stages only browser assets, and uses GitHub's Pages actions. Enabling Pages and plan eligibility remain repository/account settings. Verify the exact deployed commit and public logged-out access before marking the public gallery delivered. Never change repository visibility to resolve a Pages restriction.
