# inkfx

<p align="center"><img src="docs/brand/icon-512.png" alt="inkfx mark — mineral ink stroke" width="160" height="160"></p>


**120 procedural ink FX. Four mineral palettes. Zero runtime dependencies. Built-in Agent Skill.**

For web storytellers, 2D game developers, and creative coders building ink and wuxia scenes. 墨起，意隨。Seeded brushwork, flying-white sword trails, paper diffusion, talisman arrays, natural loops, impact bursts, transitions, and interface seals. Every effect is a small JavaScript module; no textures or prerecorded animation.

![24 studies from the 120-effect library](examples/grid.png)

[Watch the 6×4 demo — 4 seconds, 60fps](examples/demo.mp4). This is an offline render, not a browser performance recording.

| Category | FX |
| --- | ---: |
| sword | 25 |
| talisman | 20 |
| zen | 20 |
| ink-burst | 19 |
| transitions | 18 |
| ui | 18 |
| **Total** | **120** |

Node.js 20+; no package installation or build step.

```sh
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

The gallery plays cards only while visible. Its toolbar switches all four palettes, adjusts paper grain, shows an act practice dummy, and slows playback to 0.25×. Select a card to scrub its timeline, inspect React/Vue examples, copy its JavaScript source or module path, or download a PNG sheet and matching JSON atlas. Downloads are baked locally in the browser with the current seed and palette; they also work on ordinary static hosting.

```js
import { getFX, composite } from './src/index.js';

const fx = getFX('sword-qi-slash').create({ seed: 42 });
fx.step(0.65); // display seconds, including windup and hit-stop
const rgba = composite(fx.frame, 'zhusha'); // transparent Uint8ClampedArray
// composite(fx.frame, 'zhusha', { paper: true, grain: 1 }) bakes rice paper.
```

Effects support both InkFrame and straight-alpha RGBA draw targets. Single-file assets import shared helpers from `src/core`; copy those helpers too when moving an effect. Sim effects use a fixed 120 Hz pigment/wetness model; pure effects repaint a deterministic 120 Hz time sample. `draw` never advances time. Twenty zen studies loop seamlessly.

The slash follows the PRD PoC's five named poses, 28 forward droplets, 15% cinnabar accents, and hit at 0.04s with a 0.15s freeze. Its 0.75s action plus 0.40s windup and 0.15s hit-stop gives a **1.30s display timeline**.

Sprite sheets contain clean, untrimmed cells without guides or preview actors. JSON uses Aseprite/Phaser-style hash frames (`frame`, `spriteSourceSize`, `sourceSize`, `duration` in milliseconds), with origin, seed, palette, loop, and exact hit timing in `meta.inkfx.act`. Godot users can use the same rectangles to build AtlasTextures/SpriteFrames; see the [export guide](docs/EXPORTING.md).

Read [AUTHORING](docs/AUTHORING.md) for the check/render workflow and optional fx-skill-kit bridge, and [PRD gap tracking](docs/prd-gap.md) for the release notes behind the 120-effect catalog.

## Gallery hosting

The repository stays **private**; the GitHub Pages gallery is intended to be **public**. Public hosting exposes the JavaScript, docs, and examples needed by the gallery, not repository history or private repository access. The Pages workflow checks that the repository remains private and the site is public, then deploys only `gallery/`, `src/`, `docs/`, and `examples/`.

Expected Pages address: `https://malilion.github.io/inkfx/` (currently returns HTTP 404; public access has not been delivered). Enable **Settings → Pages → Build and deployment → GitHub Actions** and choose public site visibility if available. The deployment token cannot change site visibility (GitHub returns 403), so a repository administrator must configure public site access. Private-repository Pages requires an eligible GitHub plan; keep the repository private if the account cannot enable it. See [Pages setup and verification](docs/PAGES.md).

## Agent authoring

The [inkfx-author Skill](skills/inkfx-author/SKILL.md) covers catalog discovery, integration, deterministic authoring, visual review, and export. Claude Code can load the repository as a local plugin with `claude --plugin-dir /path/to/inkfx`; other agents can read the same Skill directly. No external fx-skill-kit checkout is required for the local check/render workflow.

## Validation and performance

`npm test` exercises renderer behavior, gallery controls, export bytes/timing, and all registered effects at multiple seed/palette combinations. `npm run check` validates the 120-effect catalog. The gallery's natural loops continue across cycles; one-shot gestures stop after recovery.

Run `node tools/benchmark.mjs --out artifacts/benchmark.json` for warmed-up native-size `step + draw + composite` timings. Creation and I/O are excluded. Measurements depend on the machine; they do not certify the PRD's 320×180 reference-laptop budget or 60fps browser playback. Full-frame procedural transitions can exceed the interactive frame budget; bake them into sprite sheets for constrained clients. See [PRD delivery status](docs/prd-gap.md) for verified scope and remaining release checks.

A shareable 60fps MP4 is included; community publication and a launch blog remain release work. Physical ESP32 flashing belongs to the separate oledfx PRD, not this ink renderer.

If a command fails, use Node.js 20+ and run it from the repository root. Unknown IDs can be listed with `node tools/render.mjs --list`. If port 8080 is in use, run `PORT=8081 npm run gallery` on macOS/Linux and open http://127.0.0.1:8081/gallery/ (PowerShell: `$env:PORT=8081; npm run gallery`).


To regenerate the presentation clip (optional development dependency: ffmpeg with libx264):

```sh
node tools/demo.mjs --out artifacts/inkfx-demo.mp4 --seconds 4 --fps 60
```

This renders 24 representative effects and four palettes into a 6×4 grid. It does not change the committed demo unless you explicitly replace that file.
