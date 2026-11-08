# InkFX 墨譜 — 使用與串接指南 / User & Integration Guide

<p align="center">
  <a href="https://malilion.github.io/inkfx/"><strong>進入線上展廳 / Live Exhibition ↗</strong></a>
  &nbsp;·&nbsp;
  <a href="https://malilion.github.io/inkfx/gallery/guide.html"><strong>網頁版使用指南 / Web Guide ↗</strong></a>
  &nbsp;·&nbsp;
  <a href="#繁體中文"><strong>繁體中文</strong></a>
  &nbsp;/&nbsp;
  <a href="#english"><strong>English</strong></a>
</p>

---

<a id="繁體中文"></a>

## 繁體中文

本指南說明如何在 **[InkFX 線上展廳與工作台](https://malilion.github.io/inkfx/)** 挑選、調校並匯出水墨特效，以及如何將匯出的 **單檔 JS 模組（`.mjs`）** 或 **PNG 序列圖集 + JSON Atlas** 串接至網頁（HTML5 Canvas、React、Vue）與主流遊戲引擎（Phaser 3、Godot 4、PixiJS、Unity、Aseprite）。

### 目錄
1. [線上工作台操作與匯出流程](#zh-studio)
2. [網頁與前端串接（單檔 JS · Canvas · React · Vue）](#zh-web)
3. [遊戲引擎串接（PNG 圖集 + JSON Atlas）](#zh-engine)
4. [招式時間軸、命中頓幀與參數規格（`meta` & `act`）](#zh-timing)
5. [進階：自訂筆觸與創作新招式](#zh-custom)

---

<a id="zh-studio"></a>

### 1. 線上工作台操作與匯出流程

進入 **[InkFX 線上展廳](https://malilion.github.io/inkfx/)** 後，可透過三步驟完成特效挑選、調墨與匯出：

#### 第一步：在「藏譜」挑選招式
- **分類與搜尋**：提供 **劍式（`sword`）**、**符陣（`talisman`）**、**禪境（`zen`）**、**墨擊（`ink-burst`）**、**轉場（`transitions`）**、**印記（`ui`）** 六大分類與關鍵字搜尋（支援中文招式名或英文 ID，如 `竹葉` 或 `sword-qi-slash`）。
- **策展 / 圖鑑雙視角**：右上角可切換「**策展**（大卡交錯畫廊）」與「**圖鑑**（高密度速覽）」。
- **出招節奏預覽**：滑鼠懸停於任一卡片，底部即浮現「**起勢 · 頓幀 · 收勢**」三段時間比例條。點選卡片即可載入至下方「工作台」。

#### 第二步：在「工作台」調墨與檢視細節
- **畫布底色切換**：
  - **宣紙（Rice Paper）**：預覽傳統宣紙纖維與四色礦物墨韻的完整融合效果。
  - **透明（Alpha 棋盤格）**：檢視直通透明度（Straight Alpha）邊緣與水暈漸層，確認無背景殘留。
  - **玄夜（Night Stage）**：模擬深色夜戰或暗色 UI 場景，搭配銀白與泥金墨韻測試對比度。
- **殘影（Onion Skin）與 5 格關鍵幀底片列**：
  - 開啟「**殘影**」可同時疊加前 `-45ms` 與 `-90ms` 的筆觸軌跡，檢視揮砍弧線與加速度。
  - 畫布下方的 **5 格底片列** 自動擷取「起勢 → 出鋒 → 破空 → 頓幀 → 收勢」五個關鍵瞬間，點選任一格即可精準跳幀；亦可開啟 `0.25× 慢動作` 或 `木人樁演出` 測試打擊回饋。
- **礦物墨色、宣紙紋理與固定種子（Seed）**：
  - **四款礦物色階**：`songyan`（松煙古墨）、`zhusha`（朱砂血墨）、`shiqing`（石青竹翠）、`nijin`（泥金佛光）。
  - **宣紙紋理（`0.0 – 3.0`）**：調整紙張纖維粗細與飛白對比。
  - **種子（Seed，`0 – 4294967295`）**：決定每一滴墨珠、飛白孔洞與紙張肌理的隨機序列。相同種子保證跨裝置百分百一致重現。

#### 第三步：一鍵匯出資產
| 匯出按鈕 | 產出格式 | 適用環境 |
| :--- | :--- | :--- |
| **下載 PNG 圖集 ↓** | `<id>-<palette>-seed<n>.png` | 透明背景、原生尺寸網格序列圖（Sprite Sheet），相容所有遊戲引擎與動畫軟體 |
| **JSON 圖集 ↓** | `<id>-<palette>-seed<n>.json` | 含每格座標、幀時長、原點（`ox, oy`）與命中頓幀（`hits`）的標準 Atlas 描述檔 |
| **複製單檔 JS ↗ / 單檔 JS ↓** | `<id>.mjs` | 零外部依賴的獨立 ES Module，可直接在瀏覽器、Canvas、React、Vue 即時演算 |
| **存目前一幀** | `<id>-<palette>-seed<n>.png` | 將畫布當下停留的時間點匯出為單張高解析 PNG 靜態素材 |

---

<a id="zh-web"></a>

### 2. 網頁與前端串接（單檔 JS · Canvas · React · Vue）

在工作台點選 **「複製單檔 JS」** 或 **「單檔 JS ↓」**，即可獲得完全獨立、零外部依賴的 `<effect-id>.mjs` 檔案（例如 `sword-qi-slash.mjs`）。

#### 2.1 核心模組介面
每個單檔 `.mjs` 皆匯出三個成員：
- `meta`：`{ id, name, category, duration, loop, w, h, ox, oy }`（畫布寬高、總時長秒數、是否循環、筆觸原點座標）。
- `act`：`{ windup, poses, hits, target }`（起勢秒數、動作姿勢表、命中頓幀與震動參數）。
- `create({ seed = 1, palette = 'songyan' })`：建立一個獨立的特效實例，回傳 `{ t, frame, step(dt), draw(target) }`。

| 實例方法 / 屬性 | 說明 |
| :--- | :--- |
| `effect.t` | 目前已推進的顯示時間（秒），初始為 `0`。 |
| `effect.step(dt)` | 以內部 **120Hz 固定步進**推進 `dt` 秒。若需倒退或重播，請重新呼叫 `create()` 建立新實例。 |
| `effect.draw(imageData)` | 將當前畫面合成為透明背景 RGBA 像素並寫入 `ImageData`（或 `{ width, height, data }`），回傳同一物件。 |

#### 2.2 原生 HTML5 Canvas 即時播放
```js
import { create, meta } from './sword-qi-slash.mjs';

const canvas = document.querySelector('#ink-canvas');
canvas.width = meta.w;
canvas.height = meta.h;
const ctx = canvas.getContext('2d');

const fx = create({ seed: 42, palette: 'zhusha' });
const pixels = new ImageData(meta.w, meta.h);

let lastTime;
function tick(now) {
  if (lastTime !== undefined) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    fx.step(meta.loop ? dt : Math.min(dt, meta.duration - fx.t));
  }
  lastTime = now;
  ctx.putImageData(fx.draw(pixels), 0, 0);

  if (meta.loop || fx.t < meta.duration) {
    requestAnimationFrame(tick);
  }
}
requestAnimationFrame(tick);
```

#### 2.3 定格擷取單一關鍵幀（例如拔刀破空瞬間）
```js
import { create, meta, act } from './sword-qi-slash.mjs';

const fx = create({ seed: 42, palette: 'songyan' });
// 直接推進至起勢結束後的出劍瞬間 (windup + 0.24s)
fx.step(act.windup + 0.24);

const pixels = new ImageData(meta.w, meta.h);
fx.draw(pixels);
document.querySelector('canvas').getContext('2d').putImageData(pixels, 0, 0);
```

#### 2.4 React 元件封裝（`InkEffect.jsx`）
```jsx
import { useEffect, useRef } from 'react';
import { create, meta } from './sword-qi-slash.mjs';

export default function InkEffect({ seed = 42, palette = 'songyan' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fx = create({ seed, palette });
    const pixels = new ImageData(meta.w, meta.h);
    let last, rafId;

    function render(now) {
      if (last !== undefined) {
        const dt = Math.min((now - last) / 1000, 0.05);
        fx.step(meta.loop ? dt : Math.min(dt, meta.duration - fx.t));
      }
      last = now;
      ctx.putImageData(fx.draw(pixels), 0, 0);
      if (meta.loop || fx.t < meta.duration) {
        rafId = requestAnimationFrame(render);
      }
    }
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [seed, palette]);

  return <canvas ref={canvasRef} width={meta.w} height={meta.h} />;
}
```

#### 2.5 Vue 3 元件封裝（`InkEffect.vue`）
```vue
<script setup>
import { ref, watchPostEffect } from 'vue';
import { create, meta } from './sword-qi-slash.mjs';

const props = defineProps({
  seed: { type: Number, default: 42 },
  palette: { type: String, default: 'songyan' },
});

const canvasRef = ref(null);

watchPostEffect((onCleanup) => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const fx = create({ seed: props.seed, palette: props.palette });
  const pixels = new ImageData(meta.w, meta.h);
  let last, rafId;

  function render(now) {
    if (last !== undefined) {
      const dt = Math.min((now - last) / 1000, 0.05);
      fx.step(meta.loop ? dt : Math.min(dt, meta.duration - fx.t));
    }
    last = now;
    ctx.putImageData(fx.draw(pixels), 0, 0);
    if (meta.loop || fx.t < meta.duration) {
      rafId = requestAnimationFrame(render);
    }
  }
  rafId = requestAnimationFrame(render);
  onCleanup(() => cancelAnimationFrame(rafId));
});
</script>

<template>
  <canvas ref="canvasRef" :width="meta.w" :height="meta.h" />
</template>
```

---

<a id="zh-engine"></a>

### 3. 遊戲引擎串接（PNG 圖集 + JSON Atlas）

工作台匯出的 **PNG 圖集** 與 **JSON Atlas** 採用業界通用的 Aseprite / Phaser Hash 結構，保留柔和的水暈直通 Alpha 邊緣，並於 `meta.inkfx` 內嵌完整的武術打擊時間點。

#### 3.1 Phaser 3 串接範例
在 Scene 的 `preload()` 載入 PNG 與 JSON，並於 `create()` 讀取內建的 `fps` 與 `loop` 設定建立動畫：

```js
// preload()
this.load.atlas(
  'sword-qi',
  'assets/sword-qi-slash-zhusha-seed42.png',
  'assets/sword-qi-slash-zhusha-seed42.json'
);

// create()
const texture = this.textures.get('sword-qi');
const ink = texture.customData.meta.inkfx;
const frames = texture
  .getFrameNames()
  .sort()
  .map((frame) => ({ key: 'sword-qi', frame }));

this.anims.create({
  key: ink.id,
  frames,
  frameRate: ink.fps,
  repeat: ink.loop ? -1 : 0,
});

// 依特效內建原點 (ox, oy) 對齊角色出招位置
const sprite = this.add.sprite(player.x, player.y, 'sword-qi', frames[0].frame);
sprite.setOrigin(ink.origin.x / sprite.width, ink.origin.y / sprite.height);
sprite.play(ink.id);
```

#### 3.2 Godot 4 串接範例
可直接使用隨附的載入腳本 [`examples/godot/inkfx_atlas.gd`](../examples/godot/inkfx_atlas.gd)，將 PNG 與 JSON 放入專案後自動轉為 `SpriteFrames`：

```gdscript
const InkFXAtlas = preload("res://inkfx_atlas.gd")

func _ready() -> void:
    var frames := InkFXAtlas.load_frames("res://fx/sword-qi-slash-zhusha-seed42.json")
    var meta: Dictionary = frames.get_meta(&"inkfx")
    $AnimatedSprite2D.sprite_frames = frames
    $AnimatedSprite2D.centered = false
    $AnimatedSprite2D.offset = -Vector2(meta["origin"]["x"], meta["origin"]["y"])
    $AnimatedSprite2D.play(meta["id"])
```

#### 3.3 PixiJS / Unity / Aseprite 串接要點
- **PixiJS (`Spritesheet`)**：直接將匯出的 JSON 與 `Texture.from('sheet.png')` 傳入 `new PIXI.Spritesheet(texture, atlasJson)`，呼叫 `await spritesheet.parse()` 後即可使用 `new PIXI.AnimatedSprite(Object.values(spritesheet.textures))` 播放。
- **Unity**：將 PNG 的 `Texture Type` 設為 `Sprite (2D and UI)`、`Sprite Mode` 設為 `Multiple`，在 Sprite Editor 選擇 **Grid By Cell Size**，輸入 JSON 中第一格的 `sourceSize.w` 與 `sourceSize.h` 即可自動切片。
- **Aseprite**：選擇 **File → Import Sprite Sheet**，類型設為 `Horizontal Strip`（勾選 By Rows），寬高填入特效原生尺寸（如 `224 × 224`）即可逐格檢視或二次加工。

---

<a id="zh-timing"></a>

### 4. 招式時間軸、命中頓幀與參數規格（`meta` & `act`）

每一式特效皆包含針對遊戲打擊感設計的結構化中繼資料（同時存在於 JS 模組的 `meta` / `act` 與 JSON Atlas 的 `meta.inkfx` 中）：

| 欄位路徑 | 型別 | 意義與遊戲邏輯搭配建議 |
| :--- | :--- | :--- |
| `meta.w`, `meta.h` | `number` | 畫布原生像素寬高（例如 `224 × 224`；部分全幅轉場為 `256 × 192`） |
| `meta.ox`, `meta.oy` | `number` | 招式在畫布內的局部原點座標（例如刀柄、掌心或陣眼中心），用於對齊角色座標 |
| `meta.duration` | `number` | 總顯示時長（秒），已完整包含「起勢 + 命中頓幀 + 收勢」 |
| `meta.loop` | `boolean` | `true` 表示無縫循環（如禪境 `zen` 系列）；`false` 表示單次施放招式 |
| `act.windup` | `number` | 起勢蓄墨秒數。顯示時間軸 `t === act.windup` 即為正式出招瞬間 |
| `act.hits[i].t` | `number` | 相對於出招瞬間的命中秒數；對應顯示時間軸為 `displayT = act.windup + hit.t` |
| `act.hits[i].freeze` | `number` | 命中頓幀秒數（Hit-Stop）。**注意：匯出的圖集與動畫本身已內含頓幀定格畫面，播放時無須額外暫停 Sprite**，可直接用此時間窗口同步鎖定受擊角色動作 |
| `act.hits[i].shakeAmp` | `number` | 建議鏡頭震動幅度（像素），可於命中期間驅動遊戲 Camera Shake |
| `act.hits[i].inkSplash` | `number` | 建議受擊飛濺墨點數量，可搭配遊戲受擊粒子或音效強度 |

#### 四款東方礦物色階代號一覽
| 代號 (`palette`) | 名稱 | 主墨色調（6 階：紙色 → 焦墨） | 點睛輔色 (`tint: 1`) | 亮部提色 (`tint: 2`) |
| :--- | :--- | :--- | :--- | :--- |
| `songyan` | **松煙古墨** | `#F4EFE6` → `#151E1B` | 朱砂 `#C83228` | 金 `#D4AF37` |
| `zhusha` | **朱砂血墨** | `#F6ECE0` → `#241E1E` | 朱砂 `#C83228` | 赭橙 `#DC9660` |
| `shiqing` | **石青竹翠** | `#EDF0E4` → `#172D2B` | 石青 `#2C6E7F` | 竹綠 `#A5B78C` |
| `nijin` | **泥金佛光** | `#F3EAD4` → `#20241F` | 泥金 `#D4AF37` | 淡金 `#F5DC88` |

---

<a id="zh-custom"></a>

### 5. 進階：自訂筆觸與創作新招式

若想在專案中直接操作底層水墨畫布或創作全新招式，可從 `src/runtime.js` 匯入輕量渲染核心（不含 126 式圖庫與匯出工具）：

```js
import {
  createEffect,
  createPureEffect,
  stamp,
  stroke,
  arc,
  composite,
  mulberry32,
} from './src/runtime.js';
```

#### 5.1 `InkFrame` 四通道水墨畫布結構
每個 `InkFrame` 儲存 `w × h` 的列優先（Row-major，`i = y * w + x`）型別陣列：
- `pigment` (`Float32Array`)：墨量濃度 `[0, 1]`，`0` 為空白。
- `wetness` (`Float32Array`)：水分含量 `[0, 1]`，驅動 120Hz 四鄰域毛細擴散與水漬濃邊。
- `tint` (`Uint8Array`)：`0` = 主墨色階、`1` = 礦物點睛色（如朱砂）、`2` = 亮部提色（如泥金）。
- `paperGrain` (`Float32Array`)：由固定種子生成的多尺度宣紙纖維噪聲 `[0, 1]`。當筆觸滿足 `pigment + wetness > paperGrain[i] * dryFactor` 時才會著墨；提高 `dryFactor` 或降低 `wetness` 即可產生蒼勁的**飛白（Feibai）**孔洞。

#### 5.2 撰寫一式自訂水墨斬擊
```js
import { createEffect, arc, stamp, mulberry32 } from './src/runtime.js';

export const meta = {
  id: 'custom-slash',
  name: '自訂一字斬',
  category: 'sword',
  duration: 1.1,
  loop: false,
  w: 224,
  h: 224,
  ox: 112,
  oy: 112,
};

export const act = {
  windup: 0.25,
  poses: [
    [-0.25, 'WINDUP', 'easeOut'],
    [0.0, 'STRIKE', 'snap'],
    [0.2, 'RECOVER', 'easeOut'],
  ],
  hits: [{ t: 0.03, freeze: 0.12, shakeAmp: 3, inkSplash: 18 }],
};

export function create({ seed = 1, palette = 'songyan' } = {}) {
  const rand = mulberry32(seed);
  const jitter = (rand() - 0.5) * 0.15;

  return createEffect(
    meta,
    act,
    (frame, actionTime, prevActionTime) => {
      // 1. 起勢蓄墨 (actionTime < 0)
      if (actionTime < 0) {
        stamp(frame, frame.ox - 48, frame.oy + 12, 4, {
          pigment: 0.35,
          wetness: 0.4,
          dryFactor: 1.1,
        });
        return;
      }
      // 2. 出鋒斬擊瞬間 (跨越 actionTime === 0)
      if (prevActionTime <= 0 && actionTime >= 0) {
        arc(frame, {
          start: -2.6 + jitter, end: -0.3 + jitter, radius: 72,
          width: 12,
          pigment: 0.92,
          wetness: 0.55,
          dryFactor: 1.45,
        });
        // 點綴朱砂火星 (tint: 1)
        for (let i = 0; i < 6; i++) {
          stamp(frame, frame.ox + 20 + i * 9, frame.oy - 18 - i * 4, 2.5, {
            pigment: 0.85,
            wetness: 0.2,
            tint: 1,
          });
        }
      }
      // 3. 攻擊後不再落筆，讓既有墨跡隨 120Hz stepWet 自然暈染並收乾
    },
    { seed, palette }
  );
}
```

---

<a id="english"></a>

## English

This guide covers how to browse, customize, and export procedural ink effects in the **[InkFX Live Exhibition & Studio](https://malilion.github.io/inkfx/)**, and how to integrate exported **Single-File ES Modules (`.mjs`)** or **PNG Sprite Sheets + JSON Atlases** into web apps (HTML5 Canvas, React, Vue) and game engines (Phaser 3, Godot 4, PixiJS, Unity, Aseprite).

### Contents
1. [Using the Live Studio & Exporting Assets](#en-studio)
2. [Web & Frontend Integration (Single-File JS · Canvas · React · Vue)](#en-web)
3. [Game Engine Integration (PNG Sprite Sheet + JSON Atlas)](#en-engine)
4. [Combat Timing, Hit-Stop & Metadata Reference (`meta` & `act`)](#en-timing)
5. [Advanced: Custom Brushwork & Authoring New Effects](#en-custom)

---

<a id="en-studio"></a>

### 1. Using the Live Studio & Exporting Assets

Open the **[InkFX Live Exhibition](https://malilion.github.io/inkfx/)** to explore and customize all 126 effects in three steps:

#### Step 1: Browse the Collection
- **Categories & Search**: Filter across **Sword (`sword`)**, **Talisman (`talisman`)**, **Zen (`zen`)**, **Ink Burst (`ink-burst`)**, **Transitions (`transitions`)**, and **UI & Seals (`ui`)**, or search by Chinese title or English ID (e.g. `sword-qi-slash`, `enso-breath`).
- **Curated vs. Index View**: Toggle between **策展 (Curated Gallery)** with featured editorial cards and **圖鑑 (Compact Index)** for rapid scanning.
- **Hover Rhythm Bars**: Hover any card to inspect its proportional **Windup · Hit-Stop · Settle** timing bar. Click any card to load it into the Studio Workbench.

#### Step 2: Inspect & Customize in the Studio Workbench
- **Stage Surface Modes**:
  - **宣紙 (Rice Paper)**: Previews the full blend of mineral pigments and seeded Xuan paper fibres.
  - **透明 (Alpha Checkerboard)**: Inspects straight-alpha wash edges to verify clean compositing.
  - **玄夜 (Night Stage)**: Simulates dark combat backdrops and dark-mode UIs.
- **Onion-Skin Ghosting (殘影) & 5-Frame Filmstrip**:
  - Enable **殘影 (Onion Skin)** to overlay `-45ms` and `-90ms` trailing silhouettes and study slash velocity.
  - Click any of the **5 Keyframe Thumbnails** (*Windup → Release → Apex → Hit-Stop → Settle*) below the stage to jump directly to that moment, or toggle `0.25× Slow Motion` and the reactive `Practice Dummy (木人樁)`.
- **Mineral Palette, Paper Grain & Deterministic Seed**:
  - **4 Mineral Palettes**: `songyan` (Pine Soot), `zhusha` (Cinnabar Seal), `shiqing` (Azurite Jade), and `nijin` (Burnished Gold).
  - **Paper Grain (`0.0 – 3.0`)**: Controls fibre contrast and flying-white bristle texture.
  - **Seed (`0 – 4294967295`)**: Guarantees 100% bit-identical droplets, bristles, and paper grain across runs.

#### Step 3: Export Production Assets
| Studio Action | Output Format | Target Workflow |
| :--- | :--- | :--- |
| **下載 PNG 圖集 ↓** (Download PNG Sheet) | `<id>-<palette>-seed<n>.png` | Straight-alpha sprite sheet grid for any 2D/3D game engine or editor |
| **JSON 圖集 ↓** (JSON Atlas) | `<id>-<palette>-seed<n>.json` | Aseprite/Phaser-compatible hash atlas with frame bounds, `ox/oy` origin, and `hits` |
| **複製單檔 JS ↗ / 單檔 JS ↓** (Single-File JS) | `<id>.mjs` | Self-contained, zero-dependency ES module for Canvas, React, Vue, or custom web engines |
| **存目前一幀** (Save Current Frame) | `<id>-<palette>-seed<n>.png` | Exports the exact paused frame on stage as a standalone PNG image |

---

<a id="en-web"></a>

### 2. Web & Frontend Integration (Single-File JS · Canvas · React · Vue)

Click **複製單檔 JS (Copy Single-File JS)** or **單檔 JS ↓ (Download Single-File JS)** in the workbench to get a self-contained, zero-dependency `<effect-id>.mjs` module.

#### 2.1 Module Contract
Every standalone `.mjs` module exports three bindings:
- `meta`: `{ id, name, category, duration, loop, w, h, ox, oy }` (native dimensions, display duration in seconds, loop flag, and local origin).
- `act`: `{ windup, poses, hits, target }` (windup duration, pose timeline, and hit-stop/camera-shake windows).
- `create({ seed = 1, palette = 'songyan' })`: Creates an isolated effect instance returning `{ t, frame, step(dt), draw(target) }`.

| Instance Member | Description |
| :--- | :--- |
| `effect.t` | Current display clock in seconds (starts at `0`). |
| `effect.step(dt)` | Advances the simulation by `dt` seconds on a fixed **120Hz internal grid**. Create a fresh instance via `create()` to rewind or replay. |
| `effect.draw(imageData)` | Composites straight-alpha RGBA pixels into an `ImageData` (or `{ width, height, data }`) buffer and returns it. |

#### 2.2 Vanilla HTML5 Canvas Playback
```js
import { create, meta } from './sword-qi-slash.mjs';

const canvas = document.querySelector('#ink-canvas');
canvas.width = meta.w;
canvas.height = meta.h;
const ctx = canvas.getContext('2d');

const fx = create({ seed: 42, palette: 'zhusha' });
const pixels = new ImageData(meta.w, meta.h);

let lastTime;
function tick(now) {
  if (lastTime !== undefined) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    fx.step(meta.loop ? dt : Math.min(dt, meta.duration - fx.t));
  }
  lastTime = now;
  ctx.putImageData(fx.draw(pixels), 0, 0);

  if (meta.loop || fx.t < meta.duration) {
    requestAnimationFrame(tick);
  }
}
requestAnimationFrame(tick);
```

#### 2.3 Rendering a Single Still Frame at Impact
```js
import { create, meta, act } from './sword-qi-slash.mjs';

const fx = create({ seed: 42, palette: 'songyan' });
fx.step(act.windup + 0.24);

const pixels = new ImageData(meta.w, meta.h);
fx.draw(pixels);
document.querySelector('canvas').getContext('2d').putImageData(pixels, 0, 0);
```

#### 2.4 React Component (`InkEffect.jsx`)
See section [2.4 above](#zh-web) for the complete drop-in React component using `useRef` and `useEffect`.

#### 2.5 Vue 3 Component (`InkEffect.vue`)
See section [2.5 above](#zh-web) for the complete drop-in Vue 3 `<script setup>` component.

---

<a id="en-engine"></a>

### 3. Game Engine Integration (PNG Sprite Sheet + JSON Atlas)

Exported PNG sheets and JSON atlases use the standard Aseprite / Phaser hash schema with straight-alpha transparency and embedded combat timing under `meta.inkfx`.

#### 3.1 Phaser 3
Load the PNG/JSON pair with `this.load.atlas(...)` in `preload()`, then read `texture.customData.meta.inkfx` in `create()`:

```js
// preload()
this.load.atlas(
  'sword-qi',
  'assets/sword-qi-slash-zhusha-seed42.png',
  'assets/sword-qi-slash-zhusha-seed42.json'
);

// create()
const texture = this.textures.get('sword-qi');
const ink = texture.customData.meta.inkfx;
const frames = texture
  .getFrameNames()
  .sort()
  .map((frame) => ({ key: 'sword-qi', frame }));

this.anims.create({
  key: ink.id,
  frames,
  frameRate: ink.fps,
  repeat: ink.loop ? -1 : 0,
});

const sprite = this.add.sprite(player.x, player.y, 'sword-qi', frames[0].frame);
sprite.setOrigin(ink.origin.x / sprite.width, ink.origin.y / sprite.height);
sprite.play(ink.id);
```

#### 3.2 Godot 4
Copy [`examples/godot/inkfx_atlas.gd`](../examples/godot/inkfx_atlas.gd) alongside your exported PNG and JSON files to build an `AnimatedSprite2D` resource at runtime:

```gdscript
const InkFXAtlas = preload("res://inkfx_atlas.gd")

func _ready() -> void:
    var frames := InkFXAtlas.load_frames("res://fx/sword-qi-slash-zhusha-seed42.json")
    var meta: Dictionary = frames.get_meta(&"inkfx")
    $AnimatedSprite2D.sprite_frames = frames
    $AnimatedSprite2D.centered = false
    $AnimatedSprite2D.offset = -Vector2(meta["origin"]["x"], meta["origin"]["y"])
    $AnimatedSprite2D.play(meta["id"])
```

#### 3.3 PixiJS, Unity & Aseprite
- **PixiJS (`Spritesheet`)**: Pass the PNG texture and JSON atlas into `new PIXI.Spritesheet(texture, atlasJson)`, call `await spritesheet.parse()`, and play with `PIXI.AnimatedSprite`.
- **Unity**: Import the PNG as `Sprite (2D and UI)` with `Sprite Mode: Multiple`, open Sprite Editor, and slice via **Grid By Cell Size** using the native `sourceSize.w` and `sourceSize.h` from the JSON.
- **Aseprite**: Use **File → Import Sprite Sheet** in row-major (`Horizontal Strip`, By Rows) order with the effect's native cell width and height.

---

<a id="en-timing"></a>

### 4. Combat Timing, Hit-Stop & Metadata Reference (`meta` & `act`)

Every effect includes combat choreography metadata (exported on both the JS module and `meta.inkfx` in the JSON atlas):

| Property | Type | Meaning & Gameplay Usage |
| :--- | :--- | :--- |
| `meta.w`, `meta.h` | `number` | Native canvas width and height in pixels (e.g. `224 × 224`, or `256 × 192` for some full-frame transitions) |
| `meta.ox`, `meta.oy` | `number` | Local origin coordinates inside the canvas for aligning the effect with an actor or socket |
| `meta.duration` | `number` | Total display duration in seconds (includes windup, hit-stop freezes, and settle recovery) |
| `meta.loop` | `boolean` | `true` for seamlessly looping studies (`zen`); `false` for one-shot combat/UI/transition effects |
| `act.windup` | `number` | Telegraph duration in seconds before the main release (`t === act.windup`) |
| `act.hits[i].t` | `number` | Impact-relative hit timestamp; display-clock timestamp is `displayT = act.windup + hit.t` |
| `act.hits[i].freeze` | `number` | Hit-stop freeze duration in seconds. **Note: exported sprite sheets already bake in the held freeze frames—do not pause sprite playback a second time.** Use this window to freeze target characters |
| `act.hits[i].shakeAmp` | `number` | Suggested camera-shake amplitude in pixels during the hit window |
| `act.hits[i].inkSplash` | `number` | Suggested hit-splatter droplet count or audio/haptic intensity |

---

<a id="en-custom"></a>

### 5. Advanced: Custom Brushwork & Authoring New Effects

To author custom procedural ink effects using the lightweight renderer entry (`src/runtime.js`, which excludes the 126-effect catalog and Node tooling):

- **`createInkFrame(w, h, { ox, oy, seed })`**: Allocates row-major (`i = y * w + x`) channels: `pigment` (`Float32Array` in `[0, 1]`), `wetness` (`Float32Array` in `[0, 1]`), `tint` (`Uint8Array`: `0` main ink, `1` mineral accent, `2` highlight), and seeded `paperGrain` (`Float32Array` in `[0, 1]`).
- **Brush Primitives (`src/core/brush.js`, `feibai.js`)**:
  - `stamp(frame, x, y, radius, { pigment, wetness, dryFactor, tint })`: Deposits a tapered round brush dab; ink lands where `pigment + wetness > paperGrain[i] * dryFactor`. Higher `dryFactor` or lower `wetness` carves natural flying-white (`feibai`) bristle gaps.
  - `stroke(frame, points, radius, options)` and `arc(frame, { start, end, radius, width, rotation, progress, ...brushOptions })` (centered on `frame.ox / oy`): Connect tapered brush trajectories and sword arcs.
- **Simulation Engines**:
  - `createEffect(meta, act, paint, options)`: Steps at a fixed **120Hz** grid with simultaneous four-neighbour wet pigment diffusion (`stepWet`), evaporation, and wet-boundary fringing, pausing automatically during `act.hits` freeze windows.
  - `createPureEffect(meta, act, paint, options)`: Repaints an `InkFrame` deterministically at each 120Hz tick without wet transport—ideal for seamlessly periodic loops (`meta.loop = true`).
