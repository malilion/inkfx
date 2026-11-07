# inkfx

<p align="center"><img src="docs/brand/icon-512.png" alt="inkfx mark — mineral ink stroke" width="160" height="160"></p>


**126 procedural ink FX. Four mineral palettes. Zero runtime dependencies. Built-in Agent Skill.**

For web storytellers, 2D game developers, and creative coders building ink and wuxia scenes. 墨起，意隨。Seeded brushwork, flying-white sword trails, paper diffusion, talisman arrays, natural loops, impact bursts, transitions, and interface seals. Every effect is a small JavaScript module; no textures or prerecorded animation.

![24 studies from the 126-effect library](examples/grid.png)

[Watch the 6×4 demo — 4 seconds, 60fps](examples/demo.mp4). This is an offline render, not a browser performance recording.

| Category | FX |
| --- | ---: |
| sword | 26 |
| talisman | 21 |
| zen | 21 |
| ink-burst | 20 |
| transitions | 19 |
| ui | 19 |
| **Total** | **126** |

Use Node.js 20+. Install the pinned development bundler for the gallery's standalone downloads and the full test suite. The runtime, CLI checks, render, and sprite export work without package installation.

```sh
npm ci
npm test
npm run check
node tools/check.mjs sword-qi-slash --seed 42
node tools/render.mjs sword-qi-slash --seed 42 --palette zhusha --out artifacts/slash
# Open artifacts/slash/contact.png; inspect it before refining.

npm run gallery
# http://127.0.0.1:8080/gallery/

node tools/render.mjs --list
node tools/review.mjs sword-qi-slash --seed 42 --palette zhusha --out artifacts/review
# Check → annotated contact.png + contact.json → inspect → refine

node tools/export-sheet.mjs sword-qi-slash --seed 42 --palette zhusha
# examples/out/sword-qi-slash/sheet.png + sheet.json (transparent)
node tools/export-sheet.mjs bagua-array --background paper --fps 24 --columns 6
```

The gallery plays cards only while visible. Its toolbar switches all four palettes, adjusts paper grain, shows an act practice dummy, and slows playback to 0.25×. Select a card to scrub or step through its 120 Hz timeline, inspect React/Vue examples, copy a standalone ES module or the original module path, or download a PNG sheet and matching JSON atlas. PNG and JSON downloads are baked locally in the browser with the current seed and palette.

Save **Copy Single-File JS** as `<effect-id>.mjs` or use **Download standalone JS**. It includes the runtime helpers it uses and can be imported into another project by itself.

```js
import { getFX, composite } from './src/index.js';

const fx = getFX('sword-qi-slash').create({ seed: 42 });
fx.step(0.65); // display seconds, including windup and hit-stop
const rgba = composite(fx.frame, 'zhusha'); // transparent Uint8ClampedArray
// composite(fx.frame, 'zhusha', { paper: true, grain: 1 }) bakes rice paper.
```

Effects draw into InkFrame, browser ImageData, or a straight-alpha RGBA target. Authored modules in `src/fx` import shared helpers. The gallery's standalone downloads bundle those imports. Sim effects use a fixed 120 Hz pigment/wetness model, and Pure effects repaint a deterministic 120 Hz sample. `draw` leaves the playback clock at its current time. Twenty-one zen studies loop seamlessly.

The slash follows the PRD PoC's five named poses, 28 forward droplets, 15% cinnabar accents, and hit at 0.04s with a 0.15s freeze. Its 0.75s action plus 0.40s windup and 0.15s hit-stop gives a **1.30s display timeline**.

Sprite sheets contain clean, untrimmed cells without guides or preview actors. JSON uses Aseprite/Phaser-style hash frames (`frame`, `spriteSourceSize`, `sourceSize`, `duration` in milliseconds), with origin, seed, palette, loop, and exact hit timing in `meta.inkfx.act`. Godot users can use the same rectangles to build AtlasTextures/SpriteFrames; see the [export guide](docs/EXPORTING.md).

Read [AUTHORING](docs/AUTHORING.md) for the check/render workflow and optional fx-skill-kit bridge, and [PRD gap tracking](docs/prd-gap.md) for the release notes behind the 126-effect catalog.

## Gallery hosting

The repository stays **private**, and the Gallery has its own public GitHub Pages URL. The Pages workflow checks both visibility settings, builds the standalone modules, and deploys the browser code, docs, and examples.

Open the [InkFX Gallery](https://malilion.github.io/inkfx/) or watch the demonstration clip from the Gallery footer. See [Pages setup and verification](docs/PAGES.md) for deployment checks.

## Agent authoring

The [inkfx-author Skill](skills/inkfx-author/SKILL.md) covers catalog discovery, integration, deterministic authoring, visual review, and export. Claude Code can load the repository as a local plugin with `claude --plugin-dir /path/to/inkfx`; other agents can read the same Skill directly. No external fx-skill-kit checkout is required for the local check/render workflow.

## Validation and performance

`npm test` exercises renderer behavior, gallery controls, export bytes/timing, and all registered effects at multiple seed/palette combinations. `npm run check` validates the 126-effect catalog. The [real-browser harness](docs/BROWSER.md) verifies desktop/mobile layout, controls, clipboard, downloads, loops, and visibility pausing; CI includes this browser check. Visible thumbnails now advance on every animation frame, with offscreen cards paused. The gallery's natural loops continue across cycles; one-shot gestures stop after recovery.

Run `node tools/benchmark.mjs --out artifacts/benchmark.json` for warmed-up native-size `step + draw + composite` timings. Add `--width 320 --height 180` to measure a centered effect on the PRD canvas size without editing its source. Creation and I/O are excluded. Measurements depend on the machine; they do not certify the PRD's 320×180 reference-laptop budget or 60fps browser playback. Full-frame procedural transitions can exceed the interactive frame budget; bake them into sprite sheets for constrained clients. See [PRD delivery status](docs/prd-gap.md) for verified scope and remaining release checks.

The Gallery links to the shareable 60 FPS demonstration clip in `examples/demo.mp4`.

If a command fails, use Node.js 20+ and run it from the repository root. Unknown IDs can be listed with `node tools/render.mjs --list`. If port 8080 is in use, run `PORT=8081 npm run gallery` on macOS/Linux and open http://127.0.0.1:8081/gallery/ (PowerShell: `$env:PORT=8081; npm run gallery`).


To regenerate the presentation clip (optional development dependency: ffmpeg with libx264):

```sh
node tools/demo.mjs --out artifacts/inkfx-demo.mp4 --seconds 4 --fps 60
```

This renders 24 representative effects and four palettes into a 6×4 grid. It does not change the committed demo unless you explicitly replace that file.


## New studies: 120 → 126

![Six new ink studies](examples/new-studies.png)

| ID | Category | Gesture |
| --- | --- | --- |
| `scabbard-parry` | sword | 鞘返 — guarded scabbard, deflected arc, seeded sparks |
| `red-thread-knot` | talisman | 結界繩結 — interlaced cords, over/under bridges, attached tassels |
| `tea-steam` | zen | 茶煙 — seeded, seamlessly looping steam above a teacup |
| `meteor-crater` | ink-burst | 隕墨墜 — incoming meteor, hit-stop, ejecta and ground cracks |
| `rain-pool-wipe` | transitions | 雨池暈場 — staggered ink pools growing to full coverage |
| `jade-pendant` | ui | 玉佩呈印 — suspended carved jade with a swinging cord and tassels |

Each study has an inspected contact sheet under `examples/out/<id>/`. All six work with the four mineral palettes and the existing gallery/export tools:

```sh
node tools/review.mjs scabbard-parry --seed 42 --palette nijin --out artifacts/parry
node tools/export-sheet.mjs jade-pendant --seed 42 --palette shiqing --out artifacts/jade
```
