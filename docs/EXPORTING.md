# Sprite sheets and engine integration

```sh
node tools/export-sheet.mjs sword-qi-slash --seed 42 --palette zhusha --fps 30 --columns 8
node tools/export-sheet.mjs enso-breath --background paper --grain 1.5 --out /tmp/enso
node tools/export-sheet.mjs --all --out /tmp/inkfx-sheets
```

Defaults: transparent background, songyan palette, seed 1, 30 FPS, eight columns. `--background paper` bakes the palette's paper and seeded grain. `--grain 0..3` adjusts paper contrast. Outputs are `sheet.png` and `sheet.json`; multiple FX under `--out` use ID subdirectories. Allocation is limited to 4096 frames, 16384 pixels on either axis, and 64 megapixels. CLI input must be a registered ID or a trusted JS module path.

Frames are native-size, untrimmed, with no diagnostic overlays. Transparent sheets use straight alpha and retain soft wash edges. Aseprite/Phaser-style hash atlas entries provide `{frame:{x,y,w,h}, rotated:false, trimmed:false, spriteSourceSize, sourceSize, duration}`. Durations are milliseconds. With `n = ceil(duration * fps)`, samples are at `i * duration/n` for `i=0..n-1`, so cell durations sum to exactly the declared display duration. The terminal endpoint is omitted to avoid an extra held or duplicate frame. Unused grid cells remain transparent, including on paper sheets.

`meta.inkfx` stores `id`, seed, palette, paper/grain choices, effective FPS, display duration, loop, origin, and 120Hz simulation rate. `meta.inkfx.act` contains the exported windup, poses, hits and recovery. Pose/hit `t` is **impact-relative**; `hit.displayT = windup + hit.t` is the timestamp on the exported sheet timeline. `hit.frame` identifies the containing sprite cell; `freezeFrames` is a rounded convenience estimate. Prefer exact `freeze` seconds when scheduling gameplay. The art already contains hit-stop: do not apply another freeze to sprite playback. A camera can use `shakeAmp`, and gameplay can use `inkSplash` independently.

- **Phaser:** load with `this.load.atlas('slash', 'sheet.png', 'sheet.json')`. Use the JSON frame durations when creating the animation; a global `frameRate` is also suitable because this exporter uses equal frame durations.
- **Godot:** create one AtlasTexture per `frames[*].frame` rectangle and add them to SpriteFrames with the exported FPS. Set the loop flag from `meta.inkfx.loop`. Keep PNG filtering disabled for crisp dry-brush detail, or enable it deliberately when scaling.
- **Aseprite-compatible atlas consumers:** use the hash-frame coordinates and untrimmed source size directly. This is an atlas export, not a native `.aseprite` project file.
- **Unity:** import the PNG as multiple sprites and slice by the exported native cell dimensions. A short importer can read the JSON rectangles and timing metadata; no Unity package is bundled.

In the gallery each card offers PNG and JSON downloads. Both bake the current seed, palette and paper grain (the PNG remains transparent); the filename records seed and palette. Download both before changing those settings. The same `src/core/sheet.js` builder powers browser and CLI exports. Browser preview actors, labels and guides never enter a sheet.
