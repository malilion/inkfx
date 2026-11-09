<!-- Language Selector / 語言切換分頁 -->
<p align="center">
  <b>English</b> &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="README.zh-TW.md"><b>繁體中文</b></a>
</p>

---

<p align="center">
  <img src="docs/brand/icon-512.png" alt="InkFX — Procedural Ink & Wuxia FX Library" width="160" height="160">
</p>

<h1 align="center">InkFX</h1>

<p align="center">
  <b>Ink in Motion · 墨起，意隨。</b>
</p>

<p align="center">
  <strong>132 Procedural Ink FX · 4 Mineral Palettes · 120Hz Brush Simulation · Zero Dependencies</strong>
</p>

<p align="center">
  <a href="https://malilion.github.io/inkfx/"><strong>Enter the Live Exhibition ↗</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/AUTHORING.md"><strong>User Guide ↗</strong></a>
  &nbsp;·&nbsp;
  <a href="examples/demo.mp4"><strong>Watch 60fps Demo ↗</strong></a>
</p>

![24 studies from the 132-effect library](examples/grid.png)

---

**InkFX (墨譜)** is a deterministic procedural ink and Wuxia visual effects library crafted for game developers, interactive designers, and digital storytellers.

Instead of relying on prerecorded video clips or heavy texture packs, every flying-white sword slash, talisman array, ink impact, and Zen ripple is simulated live on virtual Xuan rice paper at a fixed **120Hz timestep**. Every droplet and bristle is 100% reproducible from a 32-bit seed, and can be customized, previewed against light or dark game backdrops, and exported directly from the browser as engine-ready PNG sprite sheets, JSON atlases, or zero-dependency single-file ES modules.

### 1. One Stroke, One World — 132 Effects Across 6 Categories
Covering the full visual vocabulary of martial arts and classical East Asian brushwork:

| Category | ID | Count | Visual Focus & Use Cases |
| :--- | :--- | ---: | :--- |
| **Sword** | `sword` | **27** | Draw cuts, whirlwind spins, sword-qi arcs, meteor slashes, and returning blades with flying-white bristles and cinnabar sparks |
| **Talisman** | `talisman` | **22** | Bagua arrays, five-element wheels, thunder charms, red-thread knots, star charts, and warding seals |
| **Zen** | `zen` | **22** | Seamlessly looping ambient studies: Enso breath, river lanterns, bamboo wind, tea steam, boat ripples, and pine snow |
| **Ink Burst** | `ink-burst` | **21** | High-impact combat strikes, thunder palms, palm shockwaves, meteor craters, guard breaks, and stone shatters |
| **Transitions** | `transitions` | **20** | Full-screen scene wipes: ink-rain curtains, rain-pool diffusion, unfolding scrolls, folding screens, paper burns, and cloud curtains |
| **UI & Seals** | `ui` | **20** | Skill-unlock lotus seals, carved jade pendants, victory seals, combo tallies, health vessels, and compass waypoints |
| **Total** | | **132** | **Deterministic seeds, 4 mineral palettes, and instant sprite-sheet / JS export** |

### 2. Four Traditional Mineral Palettes
Each palette models six tonal stops of mineral pigment on Xuan paper plus a signature accent and highlight tint:

- **Pine Soot (`songyan` · 松煙古墨)**: Deep, classic sumi ink across six tonal gradations with a warm cinnabar seal accent.
- **Cinnabar Seal (`zhusha` · 朱砂血墨)**: Crimson vermilion strokes and fierce ember highlights built for critical strikes, talismans, and finishers.
- **Azurite Jade (`shiqing` · 石青竹翠)**: Cool azurite blue and bamboo-jade tones suited for frost blades, mountain mist, and water scenes.
- **Burnished Gold (`nijin` · 泥金佛光)**: Luminous gold-leaf ink designed for realm breakthroughs, sacred wards, and prestige emblems.

### 3. Choreographed for Combat — Built-in Windup, Hit-Stop & Settle
Beyond pigment diffusion and paper grain, every effect is authored with game-ready combat timing:

1. **Windup (起勢蓄墨)**: Ink gathers toward the origin as the stroke prepares, giving players a clear visual telegraph.
2. **Impact & Hit-Stop (破空頓幀)**: Peak brushwork and cinnabar splatter lock into a millisecond-accurate freeze frame (`hit.freeze`) with paired camera-shake metadata.
3. **Settle (餘墨歸紙)**: Flying-white filaments disperse and wet ink bleeds naturally into paper fibres with no abrupt cutoffs.

### 4. The Live Exhibition & Ink Studio
Explore the full collection at the **[InkFX Live Exhibition](https://malilion.github.io/inkfx/)**:

- **Live Overture & Interactive Sword Brush**: Opens with a 3-second real-time *"Gather Ink → Strike → Settle"* sequence; sweep your pointer or finger across the rice paper at any time to slash velocity-reactive flying-white ink trails and cinnabar sparks.
- **Curated & Index Views with Rhythm Bars**: Switch between an editorial **Curated Gallery** and a high-density **Index Grid**, preview all four mineral palettes inline, and hover any card to inspect its Windup / Hit-Stop / Settle timing bar.
- **Pine-Soot Dark Room ("Anatomy of a Stroke")**: A contrasting dark exhibition hall that dissects the currently selected technique into three live 120Hz frames (*Windup*, *Impact & Hit-Stop*, and *Settle*) alongside interactive mineral pigment cards.
- **Multi-Surface Stage, Onion Skin & 5-Frame Filmstrip**:
  - **Stage Surfaces**: Toggle between **Rice Paper (宣紙)**, **Alpha Checkerboard (透明)**, and **Night Stage (玄夜)** to verify readability in both bright scrolls and dark combat scenes.
  - **Onion-Skin Ghosting (殘影)**: Overlay trailing `-45ms` and `-90ms` silhouettes to study arc velocity and spacing.
  - **Keyframes Filmstrip**: Jump directly to *Windup*, *Release*, *Apex*, *Hit-Stop*, or *Settle* via five live thumbnail frames, complete with `0.25×` slow motion and a reactive wooden practice dummy.

### 5. Ready for Any Engine or Web Stack
Once you dial in your palette, paper grain, and seed in the studio, take the effect straight into production:

- **PNG Sprite Sheet + JSON Atlas**: Baked locally in your browser with clean alpha channels and Aseprite / Phaser / Godot / PixiJS / Unity-ready frame metadata (including origin coordinates and exact hit-stop timestamps).
- **Zero-Dependency Single-File JS (`<effect-id>.mjs`)**: Copy or download a self-contained ES module that renders directly to HTML5 Canvas, **React**, or **Vue** with no build step or external packages required.

![Six featured ink studies](examples/new-studies.png)
