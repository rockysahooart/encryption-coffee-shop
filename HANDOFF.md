# Handoff — encryption-coffee-shop

Prepared for moving development into Claude Code. Nothing was redesigned in
this pass; the working state was consolidated, documented and pushed.

## Repository

- **Remote:** `https://github.com/rockysahooart/encryption-coffee-shop.git`
- **Branch:** `main` (also the deploy branch)
- **Commit:** see the line printed at the end of this handoff / `git log -1`

Before this handoff, `origin/main` and the local clone had **diverged**: the
local history had seven commits the remote did not, and the remote had three
"Add files via upload" commits made through the GitHub web UI. Those web
uploads replaced `index.html` and, because uploading a single file through the
web UI commits only that file, **deleted** `README.md`, `classic.html`,
`sync.sh`, `watch.sh`, `.gitignore`, `.nojekyll` and the whole `one-scene/`
tree from the remote. This handoff merges the two histories, restores the
files those uploads removed, and publishes the newest build.

## Layout

```
/                       repo root; GitHub Pages serves this directory of `main`
  index.html            THE DEPLOYED ARTEFACT — GENERATED, never edit by hand
  CLAUDE.md             durable instructions for Claude Code (read this first)
  HANDOFF.md            this file
  README.md             what the project is, for a human
  classic.html          an earlier standalone variant, kept for reference
  .nojekyll             so GitHub Pages serves paths beginning with "_"
  .gitignore
  sync.sh               add -A, commit, push to origin main
  watch.sh              optional: publish automatically on change
  src/                  the sources index.html is built from
    app.tsx             the entire application, one file
    styles.css          the entire stylesheet, one file
    shell.html          HTML skeleton with @@STYLES@@ / @@REACT@@ / @@APP@@
    assemble.py         inlines everything into ../index.html
    make.sh             the build
    vendor-react.js
    vendor-react-dom.js
  tools/                headless validation harnesses + their README
  one-scene/            an earlier single-scene prototype; not deployed
```

## Which files control what

**The iPhone interactive experience** — `src/app.tsx` and `src/styles.css`.

In `app.tsx`: `const FILM = [` (the beat list, the copy, the formulas, the
timings), `const Cinema = (` and its JSX (the stage, phones, slots, rail,
palette, composer), `const Tok = (` and `const Pack = (` (every object drawn
as inline SVG), `const MIX` / `RGB` / `HUE_NAME` (the colour arithmetic), and
the driver (`playFrom`, `onAct`, `window.__cin`).

In `styles.css`: everything from the first `.flm{` rule to the end of the
file — roughly the last 1,100 lines. Written as one authoritative stylesheet
and amended in dated blocks; later blocks override earlier ones on purpose, so
read from the bottom when debugging.

**The café / opening sequence** — the same two files, but the *other* half.
In `app.tsx`: `const EcdhStage`, `const PhoneFrame`, and the `insp-*` / `cin-*`
components outside `Cinema`. In `styles.css`: everything *before* the first
`.flm{` rule (about the first 4,757 lines). The two halves share only the
sprite constants and a few `.cin-*` classes.

**Assets.** There are no asset files. The three character sprites are base64
PNGs inlined in `app.tsx` as `const SPRITE = { you, fr, atk }` — Alice 200×293,
Bob 200×258, Eve 200×260. The phone, swatches, keys, packets, seals and every
other object are **inline SVG drawn in code**, not images. This is why the
deployed file is a single self-contained document.

## Commands

| | |
|---|---|
| build | `cd src && ./make.sh` → writes `../index.html` |
| preview | `open index.html`, or `python3 -m http.server 8000` |
| validate | `cd tools && npm install && npx playwright install chromium`, then `node fit.js`, `node hands.js`, `node touch.js`, `node walk.js`, `node validate44.js`, `node silent3.js`, `node locked.js`, `node paint.js`, `node real.js`, `node a11y2.js`, `node six.js` |
| deploy | `./sync.sh "message"` — or `git push origin main`; the push *is* the deploy |

## Dependencies and environment

- **Build:** Node (for `npx esbuild` — no package.json, esbuild is fetched on
  demand) and Python 3 (standard library only).
- **Validation:** `playwright` plus a Chromium download, installed under
  `tools/`. The harnesses honour a `TARGET` environment variable
  (`TARGET=file:///abs/path/index.html node fit.js`) and otherwise resolve
  `../index.html` relative to `tools/`.
- **Runtime:** none. The page needs `crypto.subtle`, which means it must be
  opened over `file://` or `https://` — not plain `http://` on a remote host.
- **No environment variables, keys or secrets are required**, at build time or
  at runtime. All cryptography happens in the visitor's browser with
  `window.crypto`.

## Generated files — do not edit

- `index.html` (the deployed artefact)
- `src/app.js` (esbuild output, gitignored)
- `src/storyboard.html` (legacy build output name, gitignored)

Edit `src/app.tsx` / `src/styles.css` and rebuild. A change to `index.html`
that is not reproduced by `make.sh` will be silently destroyed by the next
build.

## Unfinished work, known bugs, remaining design issues

1. **Scrubber / rewind was dropped.** A timeline control that snaps to
   authored beats, with deterministic state reconstruction when scrubbing
   backward, was specified and then explicitly cut for the demo. The
   machinery it would need already exists: `window.__cin(beat)` jumps to any
   beat deterministically, and `cManual`/`cRun` already pin a beat against an
   in-flight playback. It was never built.
2. **The recap line overflows at 320px.** `fit.js` reports exactly one issue,
   on the `chain` beat at 320×700: `.flm-rail runs outside the module`. Every
   other width is clean. Not a demo viewport, so it was left.
3. **A transient clip in the exchange frame.** `validate44.js` intermittently
   reports one clipped element inside the small phones during the arrival
   animation. Nothing escapes — the glass has `overflow:hidden` — but the
   scroll-width blip was not chased down.
4. **Comparison frames are the weakest shots.** Two phones side by side on a
   narrow stage caps how large each value can be, so `reveal`, `asmath` and
   `tokey` are legible but less commanding than the close-ups.
5. **Several harnesses are stale.** `consist.js`, `scale.js`, `ask.js` and
   `stagecraft.js` were written for earlier passes. They still run and still
   catch things, but their thresholds encode older briefs; treat a failure
   there as a question, not a verdict.
6. **`one-scene/` is an orphan.** An earlier prototype, still tracked, not
   deployed, not maintained.

## Easy to break

- **`tools/drive.js` holds the beat order.** Add, remove or rename a beat in
  `FILM` and several harnesses silently drive the wrong sequence until `KEYS`
  is updated to match.
- **`cManual` / `cRun` in the driver.** These guard a pinned beat against a
  playback still in flight. Touch them carelessly and every harness breaks at
  once, in ways that look like layout bugs.
- **The `wait` values on blend beats are tuned to the 6-second fuse
  animation.** Change the animation timing without changing the waits and the
  film cuts away mid-blend — which is precisely the fault the held blend was
  built to fix.
- **Object ownership is derived, not declared.** `OWNED` is computed by
  walking `FILM` once, using `SIDE_OF` and `CONSUMED`. A new object without
  entries in those maps goes missing from shelves without any error.
- **Sizing is scoped by habitat.** Objects inside a phone are `width:100%` of
  the glass; objects on the wire or with Eve are sized to their band. Collapse
  that distinction and things leave the frame — it is the single most common
  regression in this codebase.
- **`pick` starts `null` on purpose.** Pre-filling Alice's private colour
  makes the one real decision in the piece look already made.

## The experience, as currently authored

**Beat order** (22 beats; `FILM` in `app.tsx`, `KEYS` in `tools/drive.js`):

```
problem   the privacy problem, with all three present
base      the public yellow, in the open
pickA     YOUR TURN — choose a private colour          [gate: tap]
mine      the chosen colour lifts into ALICE'S slot
pickB     Bob chooses from his own tray
mixA      YOUR TURN — drag the public colour onto yours [gate: drag]
mixAout   the two meet, hold, and make a third          Q_A = d_A G
mixB      Bob mirrors it                                Q_B = d_B G
sendA     YOUR TURN — send your mixture to Bob          [gate: tap]
exchange  both mixtures cross; Eve copies both; privates stay home
combA     YOUR TURN — drag Bob's mixture onto yours     [gate: drag]
combAout  your result forms, covered
combB     Bob's result forms, covered
reveal    both uncover at once — "Same colour. Never sent."   Z = d_A Q_B = d_B Q_A
asmath    the plate drains to the number it always was
tokey     the same key on both phones                   K = HKDF(Z)
type      YOUR TURN — type a message, then tap Send     [gate: type]
protect   the message becomes a packet                  (C, T) = AES-GCM(K, nonce, message)
journey   the packet crosses; Eve copies it, unreadable
arrive    Bob's key checks the tag
open      the message, large and clean                  message = AES-GCM-Open(K, nonce, C, T)
chain     the recap, and a replay
```

**Colour selection and blending.** Public colour is yellow (`base =
"#E8C93A"`), hard-coded. Alice picks from `SWATCHES` — six colours with yellow
deliberately absent. Bob picks from `bobPool` = `SWATCHES` minus Alice's
colour minus yellow, indexed by a byte of his real private scalar, so his
colour can never collide with hers or with the public one. Mixtures are
`MIX(base, mine)` and `MIX(base, bprivC)`; the shared colour is `MIX(base,
mine, bprivC)` — a mean over a *multiset of ingredients*, which is why both
sides land on the identical hex. A blend is a six-second held process:
ingredients meet, overlap and mix for about 2.4 seconds with `blending…`
shown, and only then does the result appear.

**Formula sequence.** `Q_A = d_A G` → `Q_B = d_B G` → `Z = d_A Q_B = d_B Q_A`
→ `K = HKDF(Z)` → `(C, T) = AES-GCM(K, nonce, message)` → `message =
AES-GCM-Open(K, nonce, C, T)`. Each appears in the dialogue container on the
beat whose visual relationship it describes, never over the action. Real
values are behind the "See the actual values" disclosure.

**Design rules encoded in the implementation.** Phone containment (everything
inside the glass, with an explicit safe area and `overflow:hidden`; objects
outside a phone sized to their band). Character aspect ratios (height-only
sizing, per-sprite `aspect-ratio` lock, heights normalised against the tallest,
exactly three scales). Close-up framing (phone and figure as a two-column
two-shot, figure at `min(41cqw,230px)`, device sized from its column). One
accent colour with one meaning. One hairline weight, one radius scale, no
coloured outer shadows. Dialogue travels with the actor and only a turn wears
a box. Object continuity by stable `data-obj` ids and FLIP. Every line of copy
has a visual event that proves it.

All of the above are checked by the harnesses in `tools/`.
