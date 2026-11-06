# PRD 01 delivery and remaining work

This session implements the requested P1–P3 feature scope with **48 FX**, exceeding the session's ≥40 target. The longer-term P2 release target remains 80; 32 additional polished assets are still open. No git commands or external writes were used. Runtime and CLI tooling use only browser APIs and Node built-ins.

| Phase | Delivery | Status |
| --- | --- | --- |
| P1 | Pigment/wetness core, paper grain, dry brush, diffusion/fringe, four mineral palettes, 120Hz Sim + Pure engines | Implemented |
| P1 | At least 15 sword/transition FX | **20 implemented**: 12 sword + 8 transitions |
| P1 | PoC sword action/poses/directional droplets and hit timing | Implemented; .75s action + .4s windup + .15s freeze = 1.30s display duration |
| P2 | Draft → Check → Render → Look → Refine docs and wrappers | Implemented; local review wrapper and optional fx-skill-kit clock adapter |
| P2 | Library across all six categories | **48 implemented**; 32 remain toward 80 |
| P3 | Visible-only gallery playback, palette, grain, act dummy, 0.25× | Implemented; real rendering/control/IntersectionObserver behavior covered by DOM tests |
| P3 | Card copy path, source link, PNG/JSON downloads, React/Vue examples | Implemented; exports baked locally, compatible with static hosting |
| P3 | Transparent/paper PNG sheets and hash JSON atlas with meta.inkfx.act | Implemented; PNG bytes, transparency, bounds and exact hit timing tested |
| Also | Public entry, comprehensive catalog, README count, multi-FX shots | Implemented |

## Catalog

### ink-burst — 7

`cinnabar-burst`, `guard-break`, `heavy-shockwave`, `ink-splash`, `needle-impact`, `palm-impact`, `stone-shatter`.

### sword — 12

`crescent-cut`, `cross-slash`, `draw-cut`, `earth-cleaver`, `falling-swallow`, `lotus-blades`, `returning-blade`, `rising-dragon`, `sword-qi-slash`, `sword-rain`, `thunder-thrust`, `whirlwind-slash`.

### talisman — 7

`bagua-array`, `binding-runes`, `burning-charm`, `five-elements`, `ink-chains`, `soul-seal`, `ward-gate`.

### transitions — 8

`bamboo-blinds`, `cloud-curtain`, `diagonal-wash`, `ink-iris`, `ink-wipe`, `paper-burn`, `scroll-open`, `vertical-brush`.

### ui — 7

`break-seal`, `coin-scatter`, `focus-reticle`, `quest-scroll`, `realm-breakthrough`, `ultimate-seal`, `victory-seal`.

### zen — 7

`bamboo-leaves`, `boat-ripples`, `enso-breath`, `lotus-pond`, `mountain-mist`, `plum-blossom`, `sakura-fall`.

## Quality evidence and practical limits

Every module is registered exactly once. Tests enforce ≥40 total and ≥15 combined sword/transition modules and compare the filesystem against the catalog. All FX run the determinism, finite/range, visibility and boundary checks at four seed/palette combinations. FPS-independent buffers and the seven seamless zen loops are checked. Non-transition artwork has zero observed outer-edge occupancy; transition masks intentionally cover edges.

`examples/grid.png` shows 24 representative FX; `/workspace/fx-projects/shots/inkfx-all-48-grid.png` contains all 48. Each FX has an annotated contact sheet under `examples/out/<id>/`. The grid and representative action contact sheets were visually inspected, with a second refinement pass on brush taper, lotus contour, and periodic motion. These are CPU-rendered artifacts, not browser screenshots.

The sandbox blocks socket operations, which prevented the gallery server from binding and Chromium from starting. Browser playback, layout and downloads therefore could not receive an end-to-end browser pass in this environment. DOM integration tests exercise the actual gallery module and pixel renderer, including visibility pausing, category filters, paper grain, palettes, actor toggling, scrubbing, slow motion and copying. The shared atlas builder is tested on every FX.

The optional fx-skill-kit bridge was run against the actual sibling kit on the slash. Determinism, edges and dead-frame checks pass; `--perf-soft` reports occasional max-frame budget overruns on this sandbox. PRD latency/bundle budgets remain release targets rather than a claim that every environment meets them. Mean individual FX source is under 1KB; assets import shared helpers. No automatic publishing or video release is included.

## Expansion toward 80

Add 32 distinct motifs, retaining all current checks and the visual feedback loop: six swords (double draw, moon gate, swallow return, spear rain, scabbard wave, dragon fang); five talismans (nine-palace, thunder writ, mountain ward, mirror seal, ghost gate); six zen (pine snow, crane flight, falling ginkgo, reed wind, rain pond, moon reflection); five impacts (elbow strike, deflect spray, counter pulse, heel drop, dust ring); five transitions (torn paper, spiral wash, reverse scroll, petal veil, mountain reveal); five UI (rank seal, selection stroke, health drain, inventory reveal, achievement flourish). This gives 80 total without substituting palette or angle variants for new FX.
