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

Every module exports `meta`, `act`, and `create({ seed, palette })`. `meta` contains `id`, `name`, `category`, `duration`, `loop`, `w`, `h`, `ox`, `oy`. Duration includes windup, hit-stop, and recovery; sword, talisman, impact, UI and transition effects are one-shot gestures; the seven zen studies are periodic Pure effects.

`act.windup` is a positive duration. Pose and hit times use an impact-relative clock, starting at `-act.windup`. A pose is `[time, poseId, easing]`, where easing is `snap`, `linear`, or `easeOut`. `samplePose(act, t)` returns `poseId`, `nextPoseId`, and eased `progress`. A hit is `{ t, freeze, shakeAmp, inkSplash }`; `hitStopAt(act, t)` uses half-open windows `[t, t + freeze)`. `actionTime` subtracts elapsed freeze windows. Keep windows ordered and nonoverlapping. Shake and splash are choreography metadata; shake belongs to the consuming scene's camera.

The PoC sword has a .75-second action, .4-second windup and .15-second hit-stop, for a 1.30-second display duration. Its arc sweeps over .12 action seconds, with a hit at .04s, freeze .15s, shakeAmp 3 and inkSplash 24. It emits 28 directional droplets, with four (approximately 15%) using tint 1. Named poses match PRD 01: SHEATH_CROUCH, EYE_GLINT, DRAW_CUT, FOLLOW_HOLD and STAND_RECOVER.

`createEffect` owns an InkFrame and exposes `{ t, frame, step(dt), draw(target) }`. `t` starts at 0. The paint callback receives `(frame, actionTime, previousActionTime)`. It runs on a fixed 120Hz grid independent of render FPS. Hit-stop pauses painting, water, and fading. `draw()` returns the InkFrame; `draw(InkFrame)` copies all channels; `draw({ w, h, data })` composites transparent RGBA, allowing fx-skill-kit-style consumers. Calling draw never advances simulation. Create a fresh instance to replay or seek backwards.

## Add a sword effect

1. Create `src/fx/sword/my-slash.js` exporting meta, act and create. Use `mulberry32(seed)` for variation and `createEffect` for fixed stepping. Keep instance state inside create.
2. Paint the windup at negative action times; deposit the blade near zero. Stop stamping after the attack so the existing ink can diffuse and settle. Use `previousActionTime` to detect a crossed timing boundary.
3. Add the module to `src/fx/index.js`; the gallery and CLI discover the registry automatically.
4. Run `node tools/check.mjs my-slash`, then `node tools/render.mjs my-slash --seed 42`. Inspect `examples/out/my-slash/contact.png` and its JSON statistics. Try multiple seeds and palettes.
5. Add a node:test case covering the effect's meaningful behavior and run `npm test`.

CHK-01 blocks Math.random, Date.now and performance.now during fresh imports, creation, stepping, and drawing, and compares two SHA-256 runs over all channels and RGBA. CHK-02 measures maximum outer-edge alpha occupancy over sampled composited frames (default .5%); transition masks are exempt. CHK-03 compares the last playback sample to the first against adjacent-frame MSE for loops. CHK-04 rejects an entirely empty animation, any solid all-one non-transition frame, or invalid channel values; intentional blank anticipation frames are allowed; blank tails may occupy at most 15% of the declared duration. Use `--fps 120` to inspect every simulation tick; the default tools sample 30 FPS, including exact start and end times.

Contact sheets include a safe-area guide, the `(ox, oy)` crosshair, sampled frame number, exact seconds, and alpha fill percentage. Diagnostic overlays are added after measurement. `--frames`, `--columns`, `--palette`, `--seed`, `--fps`, and `--out` control rendering. `--list` prints IDs and module paths. No build or package installation is needed.


## Pure FX and shared brushes

`createPureEffect(meta, act, paint, options)` clears and repaints an InkFrame at the current 120Hz tick, caching repeated draws at that tick. It has the same `t`, `step`, `frame` and `draw` contract as the Sim engine. Loops wrap exactly at `meta.duration`; write periodic positions and orientations, including particle angles. Use cosine motion where a loop should slow at the seam. Pure effects do not run wet diffusion; their soft stamps approximate a wash. Use Sim when actual pigment transport is the subject.

`src/core/motifs.js` provides tapered local-coordinate `path`, `ring`, `leaf`, `dot`, `envelope`, and `rhythm` helpers. Each FX owns its geometry in a single file. Use seed-derived particles only when needed. Keep strokes and debris inside a 12px margin; full-frame masks belong to `transitions`. Average asset source is below 1KB; modules import core helpers.

## Check → Render → Look → Refine

```sh
# One wrapper, matching seed / palette for both tools
node tools/review.mjs sword-qi-slash bagua-array lotus-pond --seed 42
# Or individual steps
node tools/check.mjs draw-cut --seed 42 --fps 120
node tools/render.mjs draw-cut --seed 42 --frames 16
# Open examples/out/draw-cut/contact.png and read contact.json
# Revise the weakest frames, repeat check/render, and inspect again.

# Whole library; the registry is the single discovery source
node tools/check.mjs --all
node tools/render.mjs --all --seed 42 --frames 8
node tools/grid.mjs examples/grid.png
node tools/grid.mjs /tmp/inkfx-all.png --all
```

Look for a readable attack in the first 15% after windup, fine dry channels inside strong strokes, gradual fading, and an intentional origin. Inspect every effect in the grid, then contact sheets for timing, rather than relying on a hash alone. Check at 120 FPS when investigating a 1–2-tick event. `tools/review` stops on a failing check; visual inspection remains a human/agent step.

## Optional fx-skill-kit integration

The sibling fx-skill-kit tools are optional and are **not** runtime dependencies. The bridge uses only Node built-ins. inkfx stores windup inside its nonnegative display clock; the kit's action inspector expects writable, impact-relative time with negative windup. `tools/skill-kit.mjs` creates a temporary adapter, translates the clock, forwards RGBA draw targets, runs the requested tool, and removes the adapter even on failure.

```sh
node tools/skill-kit.mjs check sword-qi-slash --kit ../fx-skill-kit --seed 42 --perf-soft
node tools/skill-kit.mjs render sword-qi-slash --kit ../fx-skill-kit --seed 42 --out examples/kit-slash
node tools/skill-kit.mjs act sword-qi-slash --kit ../fx-skill-kit --seed 42 --out examples/kit-slash
```

`check`, `render` and `act` are the supported bridge commands; remaining options are passed to the kit unchanged. Use the same seed and a supported inkfx palette (`songyan`, `zhusha`, `shiqing`, `nijin`). The bridge's adapter exposes the original choreography with `recovery: 0`, because inkfx's display duration already contains recovery. Use the local render/export tools to retain inkfx's canonical display-clock JSON and atlas timings.

The kit adds dense action strips, dead-frame, performance and optional domain checks. A strict performance check is machine-sensitive; `--perf-soft` reports measurements while retaining all structural failures. Local checks cover determinism, boundaries, loop seams, visibility, blank tails and valid channels; they do not claim to enforce the kit's performance/domain budgets. The bridge is exercised against the actual sibling kit for the slash. Other motifs should be reviewed with the appropriate kit thresholds before release.
