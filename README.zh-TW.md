[English](README.md) | **繁體中文**

<p align="center"><img src="docs/brand/icon-512.png" alt="InkFX" width="160" height="160"></p>
<h1 align="center">InkFX 墨譜</h1>
<p align="center"><b>墨起，意隨。</b></p>

![JavaScript (ES Modules)](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?style=flat&logo=javascript) ![Node.js >=20](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=flat&logo=nodedotjs) ![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?style=flat&logo=html5) ![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss) ![esbuild](https://img.shields.io/badge/esbuild-FFCF00?style=flat&logo=esbuild) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions) ![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat&logo=githubpages) [![License: Apache-2.0](https://img.shields.io/badge/License-Apache--2.0-blue?style=flat)](LICENSE)

**InkFX 墨譜** 是供遊戲與互動網頁使用的程序化水墨與武俠特效庫，提供 132 式特效與四款色盤。固定種子可重現墨跡，並可從線上展廳預覽及匯出 PNG 圖集、JSON Atlas 或獨立 ES 模組。

[線上展廳](https://malilion.github.io/inkfx/) · [使用指南](docs/AUTHORING.md) · [示範影片](examples/demo.mp4)

![水墨特效預覽](examples/grid.png)

## 特效

| 分類 | 代號 | 數量 | 說明 |
| :--- | :--- | ---: | :--- |
| 劍式 | `sword` | 27 | 飛白劍氣與刀劍軌跡。 |
| 符陣 | `talisman` | 22 | 符咒、陣法與護印。 |
| 禪境 | `zen` | 22 | 竹葉、煙霧與水波氛圍。 |
| 墨擊 | `ink-burst` | 21 | 掌擊、震波與潑墨爆發。 |
| 轉場 | `transitions` | 20 | 水墨遮罩與捲軸轉場。 |
| 印記 | `ui` | 20 | 介面印章、計數與路標。 |
| 合計 | | **132** | |

招式時間軸包含起勢、命中頓幀與收勢，方便搭配遊戲演出。

## 色盤

- `songyan` — 松煙古墨，深墨配朱砂點睛。
- `zhusha` — 朱砂血墨，赤紅筆觸與暖色亮部。
- `shiqing` — 石青竹翠，冷藍與青綠色調。
- `nijin` — 泥金佛光，溫潤金色筆墨。

## 安裝

需要 Node.js 20+。

```sh
git clone https://github.com/malilion/inkfx.git && cd inkfx && npm ci
npm run gallery
```

本機展廳預設位於 http://127.0.0.1:8080/gallery/ （可用 `PORT` 環境變數更改連接埠）。

## 使用方式

在儲存庫內的網頁中，以 `<script type="module">` 執行以下範例；頁面需有 `<canvas>`。`step(dt)` 以秒推進時間，此例擷取 0.6 秒的畫面。

```js
import { getFX } from './src/index.js';

const { meta, create } = getFX('sword-qi-slash');
const canvas = document.querySelector('canvas');
canvas.width = meta.w;
canvas.height = meta.h;
const ctx = canvas.getContext('2d');
const fx = create({ seed: 42, palette: 'zhusha' });
const pixels = ctx.createImageData(meta.w, meta.h);
fx.step(0.6);
fx.draw(pixels);
ctx.putImageData(pixels, 0, 0);
```

列出特效，或匯出透明 PNG 圖集與 JSON Atlas：

```sh
node tools/render.mjs --list
npm run export -- sword-qi-slash --seed 42 --palette zhusha --out artifacts/export/slash
```

## 授權

Copyright 2026 Malilion.

本專案採 [Apache-2.0](LICENSE) 授權。第三方歸屬見 [NOTICE](NOTICE)；隨附的 **Noto Serif TC** 字型採 [SIL Open Font License 1.1 (OFL-1.1)](gallery/fonts/OFL.txt)。
