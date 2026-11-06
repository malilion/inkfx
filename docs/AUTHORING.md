# Authoring inkfx

inkfx is pure ESM. Browser modules use no Node APIs; PNG encoding and tooling use Node built-ins. Every effect is one module importing only inkfx core helpers. Copy those helpers with an effect when using it outside this repository.

## InkFrame contract

`createInkFrame(w, h, { ox, oy, seed })` allocates these row-major channels at `i = y * w + x`:

| Field | Type | Meaning |
| --- | --- | --- |
| w, h | integer | Canvas dimensions, at least 2 |
| ox, oy | number | Local origin inside the canvas |
| pigment | Float32Array | Ink deposit in [0, 1]; zero is empty |
| tint | Uint8Array | 0 main ink, 1 mineral accent, 2 highlight |
| wetness | Float32Array | Water in [0, 1] |
| paperGrain | Float32Array | Seeded, multi-scale value noise in [0, 1] |

`clearInk(frame)` clears pigment, tint and water while preserving the paper and origin. Drawing coordinates are canvas pixels; add `frame.ox` / `frame.oy` to local positions. Leave a safety margin of at least 12 pixels for diffusion.

`stamp(frame, x, y, radius, options)` deposits a round, tapered brush dab. Options are `pigment`, `wetness`, `dryFactor`, and `tint`. Ink lands only when `pigment_input + wetness > paperGrain[i] * dryFactor`. Increase dryFactor or reduce water for flying-white holes. `stroke` connects points; `arc` draws a tapered sword curve. These helpers live in `src/core/brush.js` and `feibai.js`.

`stepWet(frame)` advances one **1/120-second** step with simultaneous four-neighbour transport, water evaporation, and pigment collection at wet/dry boundaries. Its scratch buffers belong to the frame and are reused. Do not scale it by display FPS.

## Palette and compositing

Palette IDs: `songyan`, `zhusha`, `shiqing`, `nijin`. Each exports `id`, `name`, six light-to-dark hex `stops`, `accent`, `accentRGB`, and `highlight`. The compositor uses nonlinear pigment knots `[0, .07, .22, .45, .73, 1]`. Tint 1 selects the mineral accent; tint 2 selects the highlight.

`composite(frame, paletteId, { paper: false })` returns straight-alpha `Uint8ClampedArray` RGBA. Pigment below .004 is invisible; alpha rises with deposit. `{ paper: true }` bakes in seeded paper and always returns opaque pixels. Checks and fill statistics use the transparent output, so paper does not count as spill. PNG: `encodePNG({ w, h, data: rgba })` from `src/core/png.js`.

## Act timing

Every module exports `meta`, `act`, and `create({ seed, palette })`. `meta` contains `id`, `name`, `category`, `duration`, `loop`, `w`, `h`, `ox`, `oy`. Duration includes windup, hit-stop, and recovery; the Phase 1 effects are one-shot gestures.

`act.windup` is a positive duration. Pose and hit times use an impact-relative clock, starting at `-act.windup`. A pose is `[time, poseId, easing]`, where easing is `snap`, `linear`, or `easeOut`. `samplePose(act, t)` returns `poseId`, `nextPoseId`, and eased `progress`. A hit is `{ t, freeze, shakeAmp, inkSplash }`; `hitStopAt(act, t)` uses half-open windows `[t, t + freeze)`. `actionTime` subtracts elapsed freeze windows. Keep windows ordered and nonoverlapping. Shake and splash are choreography metadata; shake belongs to the consuming scene's camera.

The default sword lasts .75 seconds: .4 windup, an attack in two 120Hz steps, .15 hit-stop starting 1/60 after impact, then residual ink. It emits 28 droplets, with four (approximately 15%) using tint 1, which is cinnabar in the default palette.

`createEffect` owns an InkFrame and exposes `{ t, frame, step(dt), draw(target) }`. `t` starts at 0. The paint callback receives `(frame, actionTime, previousActionTime)`. It runs on a fixed 120Hz grid independent of render FPS. Hit-stop pauses painting, water, and fading. `draw()` returns the InkFrame; `draw(InkFrame)` copies all channels; `draw({ w, h, data })` composites transparent RGBA, allowing fx-skill-kit-style consumers. Calling draw never advances simulation. Create a fresh instance to replay or seek backwards.

## Add a sword effect

1. Create `src/fx/sword/my-slash.js` exporting meta, act and create. Use `mulberry32(seed)` for variation and `createEffect` for fixed stepping. Keep instance state inside create.
2. Paint the windup at negative action times; deposit the blade near zero. Stop stamping after the attack so the existing ink can diffuse and settle. Use `previousActionTime` to detect a crossed timing boundary.
3. Add the module to `src/fx/index.js`; the gallery and CLI discover the registry automatically.
4. Run `node tools/check.mjs my-slash`, then `node tools/render.mjs my-slash --seed 42`. Inspect `examples/out/my-slash/contact.png` and its JSON statistics. Try multiple seeds and palettes.
5. Add a node:test case covering the effect's meaningful behavior and run `npm test`.

CHK-01 blocks Math.random during fresh imports, creation, stepping, and drawing, and compares two SHA-256 runs over all channels and RGBA. CHK-02 measures maximum outer-edge alpha occupancy over sampled composited frames (default .5%). CHK-04 rejects an entirely empty animation, any solid all-one frame, or invalid channel values; intentional blank anticipation frames are allowed. Use `--fps 120` to inspect every simulation tick; the default tools sample 30 FPS, including exact start and end times.

Contact sheets include a safe-area guide, the `(ox, oy)` crosshair, sampled frame number, exact seconds, and alpha fill percentage. Diagnostic overlays are added after measurement. `--frames`, `--columns`, `--palette`, `--seed`, `--fps`, and `--out` control rendering. `--list` prints IDs and module paths. CI runs on Node 20 and 22; no build or package installation is needed.
