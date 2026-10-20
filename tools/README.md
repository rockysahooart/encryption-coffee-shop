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
```

| script | what it asserts |
|---|---|
| `fit.js` | nothing overflows or overlaps, at 1440, 1024, 393, 360 and 320 |
| `hands.js` | all five gates complete with a mouse, every beat in order, Bob reads the message back |
| `touch.js` | the same five gates complete with `pointerType: "touch"` |
| `walk.js` | the happy path, opening scene to decrypted message, at mobile and desktop |
| `validate44.js` | the nine frame tests: random entry, action, consequence, no-copy, grayscale, squint, cramming, continuity, aesthetic budget — plus character scales and ratios |
| `silent3.js` | the whole story still reads with every word hidden |
| `locked.js` | every phone holds 71.9 : 150 on every frame |
| `paint.js` | the colour analogy is real arithmetic: both finals compute from the same three ingredients |
| `real.js` | every claim the picture makes is backed by the bytes the browser computed |
| `a11y2.js` | 44px targets, colour-free reading, reduced motion |
| `six.js` | per-beat requirements: a referent, evidence, a connector, a dominant object |
| `consist.js`, `scale.js`, `ask.js`, `stagecraft.js` | older passes' checks, still useful, less load-bearing |

`drive.js` is shared: it exports `KEYS` (the beat order) and `reach(page)`,
which gets a page to the point where the interactive module is mounted. **If
you add, remove or rename a beat, update `KEYS` in `drive.js`** — several
harnesses read their running order from it.
