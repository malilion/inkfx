# inkfx

**80 procedural ink FX. Four mineral palettes. Zero runtime dependencies.**

墨起，意隨。Seeded brushwork, flying-white sword trails, paper diffusion, talisman arrays, natural loops, impact bursts, transitions, and interface seals. Every effect is a small JavaScript module; no textures or prerecorded animation.

![24 studies from the 80-effect library](examples/grid.png)

| Category | FX |
| --- | ---: |
| sword | 18 |
| talisman | 13 |
| zen | 13 |
| ink-burst | 12 |
| transitions | 12 |
| ui | 12 |
| **Total** | **80** |

Node.js 20+; no package installation or build step.

```sh
npm run gallery
# http://127.0.0.1:8080/gallery/

node tools/render.mjs --list
node tools/review.mjs sword-qi-slash --seed 42 --palette zhusha
# Check → annotated contact.png + contact.json → inspect → refine

node tools/export-sheet.mjs sword-qi-slash --seed 42 --palette zhusha
# examples/out/sword-qi-slash/sheet.png + sheet.json (transparent)
node tools/export-sheet.mjs bagua-array --background paper --fps 24 --columns 6

npm test
node tools/check.mjs --all
```

The gallery plays cards only while visible. Its toolbar switches all four palettes, adjusts paper grain, shows an act practice dummy, and slows playback to 0.25×. Select a card to scrub its timeline, inspect React/Vue examples, copy its module path, or download a PNG sheet and matching JSON atlas. Downloads are baked locally in the browser with the current seed and palette; they also work on ordinary static hosting.

```js
import { getFX, composite } from './src/index.js';

const fx = getFX('sword-qi-slash').create({ seed: 42 });
fx.step(0.65); // display seconds, including windup and hit-stop
const rgba = composite(fx.frame, 'zhusha'); // transparent Uint8ClampedArray
// composite(fx.frame, 'zhusha', { paper: true, grain: 1 }) bakes rice paper.
```

Effects support both InkFrame and straight-alpha RGBA draw targets. Single-file assets import shared helpers from `src/core`; copy those helpers too when moving an effect. Sim effects use a fixed 120 Hz pigment/wetness model; pure effects repaint a deterministic 120 Hz time sample. `draw` never advances time. Thirteen zen studies loop seamlessly.

The slash follows the PRD PoC's five named poses, 28 forward droplets, 15% cinnabar accents, and hit at 0.04s with a 0.15s freeze. Its 0.75s action plus 0.40s windup and 0.15s hit-stop gives a **1.30s display timeline**.

Sprite sheets contain clean, untrimmed cells without guides or preview actors. JSON uses Aseprite/Phaser-style hash frames (`frame`, `spriteSourceSize`, `sourceSize`, `duration` in milliseconds), with origin, seed, palette, loop, and exact hit timing in `meta.inkfx.act`. Godot users can use the same rectangles to build AtlasTextures/SpriteFrames; see the [export guide](docs/EXPORTING.md).

Read [AUTHORING](docs/AUTHORING.md) for the check/render workflow and optional fx-skill-kit bridge, and [PRD gap tracking](docs/prd-gap.md) for the release notes behind the 80-effect catalog.
