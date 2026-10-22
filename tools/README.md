# Validation harnesses

Every script here opens the built `../index.html` in headless Chromium, drives
the interactive module through `window.__cin(beat)` / real pointer input, and
asserts something about what the page actually does. They are the reason a
change can be made to this project without re-watching the whole film.

```bash
cd tools
npm install                 # playwright, once
npx playwright install chromium
node fit.js                 # or any other harness
TARGET=file:///abs/path/to/index.html node fit.js   # point at another build
PW_CHROMIUM=/path/to/chrome node fit.js             # use a specific browser binary
```

Playwright is pinned to 1.61.1, the newest release that still runs on
Node 18 (1.62 and later need Node 20). The harnesses launch Playwright's own
Chromium through `launch()` in `drive.js`; there is no machine-specific path.

| script | what it asserts |
|---|---|
| `smoke.js` | the deployment smoke suite: `hands`, `touch`, `walk`, `fit`, `validate44`, `labels` in parallel, each finding sorted against `baseline.json` as known, worse or new; exits 1 on a regression. `ship.sh` runs it. |
| `shoot.js` | not a test: screenshots of the named beats (default all 22) at 393 and 1440 into `shots/`; `WIDTHS=` overrides |
| `labels.js` | every beat (and the timed states inside `mixAout` and `exchange`) and every café state shows the storyboard label from `drive.js` `LABELS`; one label at a time, absolutely positioned, inert, overlapping nothing |
| `fit.js` | nothing overflows or overlaps, at 1440, 1024, 393, 360 and 320 |
| `hands.js` | all five gates complete with a mouse, every beat in order, Bob reads the message back |
| `touch.js` | the same five gates complete with `pointerType: "touch"` |
| `walk.js` | the happy path, opening scene to decrypted message, at mobile and desktop |
| `validate44.js` | the nine frame tests: random entry, action, consequence, no-copy, grayscale, squint, cramming, continuity, aesthetic budget — plus character scales and ratios. A turn's control may sit in the stage or, on a phone, in the action dock (`.flm-act`) |
| `silent3.js` | the whole story still reads with every word hidden |
| `locked.js` | every phone holds 71.9 : 150 on every frame |
| `paint.js` | the colour analogy is real arithmetic: both finals compute from the same three ingredients |
| `real.js` | every claim the picture makes is backed by the bytes the browser computed |
| `a11y2.js` | 44px targets, colour-free reading, reduced motion |
| `six.js` | per-beat requirements: a referent, evidence, a connector, a dominant object |
| `consist.js`, `scale.js`, `ask.js`, `stagecraft.js` | older passes' checks, still useful, less load-bearing |

`drive.js` is shared: it exports `KEYS` (the beat order), `reach(page)`,
which gets a page to the point where the interactive module is mounted, and
`launch()`, which every harness uses to start Chromium. **If you add, remove
or rename a beat, update `KEYS` in `drive.js`** — the harnesses read their
running order from it.

Every page opened through `launch()` has `window.__cin` guarded: the film
falls back to its first frame for a name it does not know, so a stale beat
name used to test `problem` silently. Now `__cin("crossA")` throws
`"crossA" is not a beat in tools/drive.js KEYS` and the harness stops.

## Baseline

The machine-readable copy is `baseline.json`, which `smoke.js` compares
against; change both together. Recorded 2026-10-22 after pass 53, with
Playwright 1.61.1 / Chromium 149, Node 18.15, macOS. A result listed here is
known; anything else is a regression.

| harness | result |
|---|---|
| `fit.js` | pass at every width. The old 320×700 `chain` overflow was fixed in pass 53 (the mobile recap holds two by two). |
| `six.js` | **advisory, not a failure** — the wide network shots (`base`, `exchange`, `xland`, `pubvals`, `journey`) report "biggest object under 5% of stage" (2.3–4.4%). Pass 48 made the characters much larger in those shots, so the objects are a smaller share of the frame; whether the 5% threshold still describes the intended design is unresolved pending a visual review. |
| `hands.js`, `touch.js`, `walk.js`, `validate44.js`, `labels.js`, `silent3.js`, `locked.js`, `paint.js`, `real.js`, `a11y2.js` | pass (pass 48 removed the old `exchange` 88>82 clip) |

`fit`, `validate44`, `silent3`, `locked` and `six` step through all 22 beats;
`hands` and `touch` play all 22 in order through the five gates. `paint`,
`a11y2` and `real` visit the beats their claims are about.
