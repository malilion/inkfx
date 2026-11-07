# Browser acceptance checks

The runtime requires Node.js 20+. The optional browser harness requires Node.js **22+** (native WebSocket) and an isolated Chrome/Chromium with the DevTools protocol. No npm packages or browser driver are needed. Use a fresh browser profile, not a signed-in personal browser.

From the repository root, start the gallery in one terminal:

```sh
npm run gallery
```

In another terminal, start Chromium. The following flags are for an isolated CI/container environment; on a desktop that supports Chrome's sandbox, omit `--no-sandbox`:

```sh
chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --remote-debugging-address=127.0.0.1 --remote-debugging-port=9223 \
  --user-data-dir="$(mktemp -d /tmp/inkfx-chrome.XXXXXX)" about:blank
```

Use `google-chrome` if that is the installed executable. The process stays running. From a third terminal:

```sh
node tools/browser-smoke.mjs --out artifacts/browser
```

The tool connects directly to DevTools rather than waiting for a `--dump-dom` or command-line screenshot process to exit. It tests:

- All registered cards, each real canvas preview, and successful loading of images/modules.
- Desktop (1440×1000) and mobile (390×844) layout without page overflow.
- All four palettes, paper grain, and the actor toggle changing real canvas pixels.
- The actual JS module copied to the browser clipboard.
- Real downloaded PNG and JSON files, decoded ink/transparency, matching atlas dimensions, seed, and palette.
- Slow playback, a natural loop crossing its timeline boundary, category filtering, and actual offscreen pausing.
- Uncaught JavaScript errors and failed page resources.

Every run uses a new download directory, so old files cannot make a failed export pass. A successful run writes `report.json` and desktop/collection/mobile screenshots. On failure it exits nonzero; a prior report is removed before the new run. Keep the screenshot artifacts for visual inspection.

The report also samples 120 real animation-frame intervals while the gallery is visible. This records the current viewport and machine, not a promise of 60fps on every device. Thumbnails now advance on requestAnimationFrame; the old 24fps throttle has been removed. Simulation remains fixed at 120Hz. Do not compare reports while running CPU-heavy tests or exports.

## CI

The `browser` job in `.github/workflows/ci.yml` uses Node 22 and the Chrome installed on the GitHub runner. It starts its own gallery/browser processes, waits for real HTTP readiness, runs this harness, stops only those processes, and uploads screenshots/report/downloads as `browser-validation`. Renderer tests and full catalog checks still run separately on Node 20 and 22.

Public Pages acceptance is separate. Local browser success does not establish site visibility, account-plan eligibility, or a successful remote deployment; see [PAGES](PAGES.md).
