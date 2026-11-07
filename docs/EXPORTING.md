# Sprite sheets and engine integration

```sh
node tools/export-sheet.mjs sword-qi-slash --seed 42 --palette zhusha --fps 30 --columns 8
node tools/export-sheet.mjs enso-breath --background paper --grain 1.5 --out /tmp/enso
node tools/export-sheet.mjs --all --out /tmp/inkfx-sheets
```

Defaults: transparent background, songyan palette, seed 1, 30 FPS, eight columns. `--background paper` bakes the palette's paper and seeded grain. `--grain 0..3` adjusts paper contrast. Outputs are `sheet.png` and `sheet.json`; multiple FX under `--out` use ID subdirectories. Allocation is limited to 4096 frames, 16384 pixels on either axis, and 64 megapixels. CLI input must be a registered ID or a trusted JS module path.

Frames are native-size, untrimmed, with no diagnostic overlays. Transparent sheets use straight alpha and retain soft wash edges. Aseprite/Phaser-style hash atlas entries provide `{frame:{x,y,w,h}, rotated:false, trimmed:false, spriteSourceSize, sourceSize, duration}`. Durations are milliseconds. With `n = ceil(duration * fps)`, samples are at `i * duration/n` for `i=0..n-1`, so cell durations sum to exactly the declared display duration. The terminal endpoint is omitted to avoid an extra held or duplicate frame. Unused grid cells remain transparent, including on paper sheets.

`meta.inkfx` stores `id`, seed, palette, paper/grain choices, effective FPS, display duration, loop, origin, and 120Hz simulation rate. `meta.inkfx.act` contains the exported windup, poses, hits and recovery. Pose/hit `t` is **impact-relative**; `hit.displayT = windup + hit.t` is the timestamp on the exported sheet timeline. `hit.frame` identifies the containing sprite cell; `freezeFrames` is a rounded convenience estimate. Prefer exact `freeze` seconds when scheduling gameplay. The art already contains hit-stop: do not apply another freeze to sprite playback. A camera can use `shakeAmp`, and gameplay can use `inkSplash` independently.

- **Phaser:** load the pair with `this.load.atlas('ink', 'sheet.png', 'sheet.json')` in the scene's `preload()`. In `create()`, use the atlas's effective FPS and loop flag:

  ```js
  const texture = this.textures.get('ink');
  const ink = texture.customData.meta.inkfx;
  const frames = texture.getFrameNames().sort().map(frame => ({ key: 'ink', frame }));
  this.anims.create({ key: ink.id, frames, frameRate: ink.fps, repeat: ink.loop ? -1 : 0 });
  this.add.sprite(160, 90, 'ink', frames[0].frame).play(ink.id);
  ```

  All cells in an InkFX sheet have the same duration. The exported `ink.fps` alone reproduces their timing.
- **Godot 4:** copy [the atlas loader](../examples/godot/inkfx_atlas.gd) and the PNG/JSON pair into the project. After Godot imports the PNG, use the resource from `preload("res://inkfx_atlas.gd").load_frames("res://fx/sheet.json")` as an AnimatedSprite2D's `sprite_frames`. Play the animation named by `frames.get_meta(&"inkfx")["id"]`. Keep the JSON in the export preset's non-resource include filter if loading it in the exported game. Use nearest texture filtering for crisp dry-brush pixels.
- **Aseprite:** open the PNG using **File → Import Sprite Sheet** with row-major order and the cell width and height from the first JSON frame. Use the frame count in the atlas to identify unused trailing cells. The JSON follows the hash-frame layout used by Aseprite-compatible consumers. Act timing stays in the JSON sidecar.
- **Unity:** import the PNG as multiple sprites and slice by the exported native cell dimensions. A short importer can read the JSON rectangles and timing metadata; no Unity package is bundled.

The Phaser 3.90.0 and Godot 4.6.3 import checks played a 32-cell transparent sword animation and a 58-cell looping paper animation. Both engines read the atlas bounds, timing, and loop setting from the emitted files.

In the gallery each card offers PNG and JSON downloads. Both use the current seed and palette, which are recorded in the filename. The atlas also records the grain setting, which only changes the baked backdrop for paper exports. Download the pair before changing settings. The same `src/core/sheet.js` builder powers browser and CLI exports. Browser preview actors, labels and guides stay in the preview.
