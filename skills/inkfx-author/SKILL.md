---
name: inkfx-author
description: Find, integrate, export, or create deterministic ink and wuxia effects. Use for sword trails, paper transitions, talismans, natural loops, mineral palettes, or action timing in inkfx.
---

# Inkfx author

Work from the repository root with Node.js 20+. No dependency installation or build is needed. Read `docs/AUTHORING.md` for the rendering contract and `docs/EXPORTING.md` for atlas timing. This skill authorizes local authoring and validation, not remote publication.

## Find and use an effect

Run `node tools/render.mjs --list` before creating a new motif. Import an individual module from `src/fx/<category>/<id>.js` when bundle size matters; `src/index.js` imports the whole catalog. Copy its shared `src/core` and `src/palettes` imports too. Gallery **Copy JS** copies the actual module; **Copy path** copies its repository location.

Use `create({ seed, palette })`, advance with `step(dt)`, and composite `instance.frame`. Drawing must never advance time. Sim effects use fixed 120 Hz ticks; Pure effects repaint fixed samples. Use seeded randomness only: no Math.random, Date.now, performance.now, or shared mutable animation state.

## Draft → Check → Render → Look → Refine

1. Create a distinct motif in one module exporting `meta`, `act`, and `create`. Register it exactly once in `src/fx/index.js`. Follow a neighboring effect and the shared brush primitives, with a 12px safe margin except for intentional full-frame transitions.
2. Run `node tools/check.mjs <id> --seed 42`. Investigate every failing determinism, boundary, loop, visibility, or channel check; do not weaken checks to pass an asset.
3. Run `node tools/render.mjs <id> --seed 42 --out artifacts/review/<id>/round-1`. Open the resulting `contact.png` with an image tool and read `contact.json`. A passing hash is not a visual review.
4. Identify the weakest frames by their time labels. Inspect burst timing, dry-brush negative space, pale washes around dense ink, origin placement, and gradual fading. For attacks, the silhouette should emerge within the first 15% of action time after windup. Check zen loops across the seam. Improve a specific weakness, rerun check/render into `round-2`, and inspect again. Perform at least two visual review rounds for new artwork; if the first is already satisfactory, compare another seed/palette rather than make a cosmetic edit merely to count a round.
5. Test seed 0, 42, and 4294967295 and the four palettes. Use `--fps 120` for one-tick glitches. Run `npm test` and `npm run check` before delivery (several minutes for the full catalog).

Never overwrite committed examples during exploration: always set `--out artifacts/...` or a temporary directory. Update curated examples deliberately only after inspection.

## Act and export

`act.poses` and `act.hits` use impact-relative time, with negative windup. The public display clock begins at zero and includes windup and hit-stop. Keep freeze windows ordered and nonoverlapping. The exported sheet already contains the freeze; consumers should not add it again.

Use `node tools/export-sheet.mjs <id> --seed 42 --palette zhusha --out artifacts/export/<id>` for transparent PNG and JSON, or `--background paper` for baked paper. Verify actual output and timing, not file existence alone. Do not promise a self-contained single file: effects import shared helpers.

The optional `tools/skill-kit.mjs` bridge requires a separately available fx-skill-kit checkout. Local CHK-01–04 do not enforce its performance or domain budgets. Do not claim 60fps, bundle budgets, engine integration, public hosting, or publication without measured evidence. See `docs/prd-gap.md` for the current release status.
