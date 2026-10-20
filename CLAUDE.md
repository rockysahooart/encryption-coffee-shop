# CLAUDE.md

Durable instructions for continuing this project. Read this before changing
anything; most of what looks like an odd decision here is load-bearing and has
a harness defending it.

## What this is

A single-page, self-contained explainer: **what actually happens between your
laptop and a server when you use café Wi-Fi**. Alice wants to send Bob
something only he can read; Eve watches the network. It teaches the real
sequence — ECDH → shared secret → HKDF → AES-GCM — through a paint-mixing
analogy, with the viewer standing in Alice's shoes and performing her side of
it by hand.

The deliverable is **one HTML file with no runtime dependencies**. React and
the compiled app are inlined at build time. It is opened by double-clicking
it, and served by GitHub Pages as a static file.

## Architecture

```
/                       GitHub Pages serves the repo root of `main`
  index.html            THE DEPLOYED ARTEFACT — GENERATED, DO NOT EDIT
  classic.html          an older standalone variant, kept for reference
  src/                  the sources the deployed file is built from
    app.tsx             the whole application (~300 KB, one file)
    styles.css          the whole stylesheet (~355 KB, one file)
    shell.html          the HTML skeleton with @@STYLES@@ / @@REACT@@ / @@APP@@
    assemble.py         inlines everything into index.html
    make.sh             the build: esbuild app.tsx, then assemble.py
    vendor-react.js     pinned React, inlined at build time
    vendor-react-dom.js pinned ReactDOM, inlined at build time
  tools/                headless validation harnesses (see tools/README.md)
  one-scene/            an earlier single-scene prototype; not deployed
  ship.sh               the mechanical half of `ship it`: check, then push
  sync.sh, watch.sh     older publish helpers that skip validation; do not use
```

`app.tsx` is a single file on purpose. It compiles with `--jsx=transform` and
has no imports; `React` and `ReactDOM` are globals supplied by the inlined
vendor scripts. There is no bundler config, no package.json at the root, no
framework. Keep it that way unless there is a reason that survives contact
with the build.

### Where things live inside `app.tsx`

| what | how to find it |
|---|---|
| the iPhone interactive ("the film") | `const FILM = [` — the beat list — through `const Cinema = (` and its JSX |
| the café / opening sequence | `const EcdhStage`, `const PhoneFrame`, the `insp-*` and `cin-*` components outside `Cinema` |
| character sprites | `const SPRITE = {` — base64 PNGs inlined in the source (`you` = Alice 200×293, `fr` = Bob 200×258, `atk` = Eve 200×260) |
| the phone, swatches, packets, keys | drawn as inline SVG in `const Tok = (` and `const Pack = (` — **there are no image assets for these** |
| the paint arithmetic | `const MIX = (`, `const HEX2RGB`, `const RGB`, `const HUE_NAME` |
| the real cryptography | `const KIT` / `kit` — WebCrypto: ECDH P-256, HKDF-SHA256, AES-256-GCM with `tagLength: 128` |

### Where things live inside `styles.css`

Lines 1–~4757 are the rest of the site (the café sequence, panels, the older
module). **Everything from the first `.flm{` rule to the end of the file is
the iPhone interactive**, written as one authoritative stylesheet in pass 44
and amended in dated blocks since. Later blocks intentionally override
earlier ones; read from the bottom when debugging.

## Commands

```bash
# build  (from the repo root)
cd src && ./make.sh          # esbuild app.tsx -> app.js (pinned 0.28.2), then inline -> ../index.html

# preview
open index.html              # macOS; it is a static file with no server needed

# look at beats, mobile and desktop  (tools/shots/<beat>-<width>.png)
cd tools && node shoot.js exchange journey

# validate  (first time: cd tools && npm install && npx playwright install chromium)
cd tools && node smoke.js    # the deployment smoke suite, compared with baseline.json
node fit.js                  # any single harness; see the table below

# ship
./ship.sh check              # rebuild + smoke suite + what would ship
./ship.sh push "message"     # commit what passed check, push, wait for Pages
```

**Deployment is GitHub Pages serving the root of `main`** (legacy branch
build, no workflow). Pushing to `main` is the deploy. `.nojekyll` is present
so paths beginning with `_` survive. Whatever `index.html` is in `main` is
what the world sees, so **`index.html` is always rebuilt and committed with
the source change that produced it.**

## How we work

This is the operating contract. It holds in every session.

### A change request

When I describe a change in plain English:

1. **Inspect first.** Find the beat in `FILM`, its JSX in `Cinema`, and the
   `.flm` rules involved; read the guardrails below that touch it.
2. **Edit canonical source only**: `src/app.tsx`, `src/styles.css`. Never
   `index.html`, `src/app.js` or `src/storyboard.html`.
3. **Rebuild**: `cd src && ./make.sh`.
4. **Run the targeted harnesses** for what changed (table below), not the
   whole suite.
5. **Look at it**: `cd tools && node shoot.js <affected beats>` and view the
   393 and 1440 shots. Add `WIDTHS=320x700,393x852,1440x900` when narrow
   widths matter.
6. **Report and stop.** Say what changed, what was run, and show the shots.
   Do not commit or push.

If the request is ambiguous, or doing it properly would change something
outside what was asked, ask before doing it.

### Which harnesses to run

| change | run |
|---|---|
| layout / visual (sizes, spacing, framing, type, motion) | `fit.js`, `validate44.js`, `locked.js`, plus `shoot.js` |
| interaction / gates (pickA, mixA, sendA, combA, type; drag, tap, timing, `wait`) | `hands.js`, `touch.js`, `walk.js` |
| colour / blending (swatches, `MIX`, base, blend animation) | `paint.js`, `silent3.js`, `validate44.js` (accent cap, grayscale) |
| crypto / message flow (`KIT`, values panel, packet, open) | `real.js`, `walk.js`, `hands.js` (Bob reads the message back) |
| accessibility (targets, focus, reduced motion, colour-free reading) | `a11y2.js`, `validate44.js` |
| copy / dialogue | `six.js` (advisory), `silent3.js`, `fit.js` |
| adding, removing or renaming a beat | update `KEYS` in `tools/drive.js` first, then `node smoke.js` |
| anything spanning several of these, or unsure | `node smoke.js` |

Every harness prints `FAIL` lines (fit prints `beat: issue`). Compare
against the baseline in `tools/README.md`: a listed failure is known, any
other is a regression to fix before reporting.

### `ship it`

When I say **ship it**:

1. **Check the tree.** `git status`: only the files this change needed.
   Anything unrelated, stop and ask.
2. **`./ship.sh check`**, which:
   - refuses to run off `main`, behind `origin/main`, with untracked files,
     or with changes outside `src/`, `tools/`, `index.html`, `ship.sh`,
     `.gitignore` and `*.md`
   - rebuilds from source, and refuses if `index.html` differs from HEAD with
     no change in `src/`
   - runs the smoke suite and stops on any regression
3. **Read the source diff**: `git diff HEAD -- . ':!index.html'`. Anything
   outside the request, stop and ask.
4. **`./ship.sh push "message"`**, with a message that says what changed in
   the experience. It refuses unless the last `check` passed on exactly this
   tree, then commits all tracked changes (source together with
   `index.html`), pushes to `origin main`, checks that `origin/main` is the
   new commit, and waits for the GitHub Pages build of that commit.
5. **Report** the commit hash and the Pages build status.

If my request already says **ship it**, carry the change through all of this
without asking again, unless the request is genuinely ambiguous, validation
finds a new regression, or the change would reach outside what was asked.

### The smoke suite and the baseline

`tools/smoke.js` runs `hands`, `touch`, `walk`, `fit` and `validate44` in
parallel, about 4 minutes. Between them they cover:
- all 22 beats, at 1440, 1024, 393, 360 and 320
- the five gates by mouse and by touch
- Bob reading back the typed message
- the happy path at mobile and desktop
- console errors

Each finding is sorted against `tools/baseline.json`:
- **known**: listed there, and no worse than recorded. This does not block.
- **worse**: listed there, but past its recorded limit (the exchange overshoot
  beyond 89px). This is a regression.
- **new**: anything else. This is a regression.

A harness that reports something new under parallel load is rerun alone
once, and that second run counts. A known failure that disappears is printed
as `resolved`; remove it from `baseline.json` and `tools/README.md` in
the same change. `six.js` is advisory and is not part of the smoke suite.

## Guardrails

These are design rules that are already encoded in the implementation and
defended by a harness. Breaking one is a regression, not a style choice.

**Containment.** Anything that happens inside Alice's or Bob's phone stays
inside the phone screen mask. `.flm-ph-scr` has `overflow:hidden` and an
explicit safe area (`padding:8% 7%`); objects inside it are `width:100%` of
that box. Objects on the wire or in Eve's hands are sized to the band they
live in (`min(19cqh, 28cqw)`), **not** to 100% of a column — that distinction
is the whole fix, and collapsing it is how things escape the frame. If content
does not fit, enlarge the phone or split the beat; do not let an object hang
over the glass. `fit.js` fails on overflow.

**Character proportions.** The three sprites are 200×293, 200×258 and 200×260
— three different shapes. Each is sized by **height alone** with `width:auto`,
and its own ratio is locked with `aspect-ratio` as a guard. Never set width
and height together on `.cin-face`. Heights are normalised against the tallest
sprite (Bob ×0.880, Eve ×0.887) so the three read as figures in one world.
There are exactly **three character scales** — close-up, network-wide,
comparison — set by `--face`; a fourth is a regression. `validate44.js` checks
both the ratios and the scale count.

**Close-up framing.** In a single-character close-up the slot is a two-column
grid: phone in one column, figure in the other at `--face: min(41cqw,230px)`,
bottom-aligned and overlapping the device by 14%, with the stage cropping them
at the knees. Bob's side mirrors. The phone is sized from **its column**
(`min(78cqh,106cqw)`), not from the stage — sizing it from the stage is what
pushes it out through the frame when the figure grows.

**One accent.** `--act` (#83e3a9) means exactly one thing: *this is yours to
act on now*. The turn word, the object you may move, the place it may go, and
the connector between them. It is not a border, not a success state, not the
network. Colours painted from real bytes (the key, the ciphertext, the nonce)
are desaturated so they can never land on the accent and borrow its meaning.
`validate44.js` caps accent usage per frame.

**One hairline, one radius, no glow.** 1.4px strokes, `--r`/`--r-s` = 8px,
999px for pills, the device's own percentage corners. Selection rings are
`outline`, never a coloured `box-shadow` — `validate44.js` fails any frame
with a coloured outer shadow.

**Dialogue placement.** The rail travels with whoever is acting: `.rail-a`
left, `.rail-b` right, wide/both centred. It carries one line, an optional
second line, and (only on the beats that have earned it) one formula. Only a
turn wears a box. Font floor: nothing in the film is under 9px.

**Object continuity.** Every object has a stable `data-obj` id and is FLIPped
between frames by that id — objects **transform and move**, they do not
disappear and reappear. If you add an object, give it an id and add it to
`IDS`, `SIDE_OF` and (if something consumes it) `CONSUMED`; ownership is then
derived by walking the film, not hand-maintained.

**Evidence.** Every line of dialogue must have a visual event that proves it
in the same frame. If you write copy that explains something the frame is not
showing, the frame is wrong, not the copy.

## How the interactive works

**Beat order** (`FILM` in `app.tsx`, and `KEYS` in `tools/drive.js` — keep
them in sync):

```
problem · base · pickA · mine · pickB · mixA · mixAout · mixB · sendA ·
exchange · combA · combAout · combB · reveal · asmath · tokey · type ·
protect · journey · arrive · open · chain
```

Five of these are **gates** — the film stops and waits for the viewer:
`pickA` (tap a colour), `mixA` (drag), `sendA` (tap Send), `combA` (drag),
`type` (type, then tap Send). Everything else plays on a timer (`wait`).

**The driver.** `playFrom(beat)` walks `FILM` and stops at any beat with
`act`. `onAct(what)` is the single place a viewer's action advances the film.
`window.__cin(beat)` pins the film to a beat for the harnesses and seeds the
message and packet for beats after `type`. `cManual`/`cRun` guard against a
pinned beat being overrun by a playback still in flight — **touching this is
the easiest way to break every harness at once.**

**Colour selection and blending.**

- The public colour is **yellow**, `base = "#E8C93A"`, hard-coded in `Cinema`.
- Alice's palette is `SWATCHES` — six colours, **yellow deliberately not among
  them**, because the public colour and a private colour must never be the
  same swatch doing opposite jobs.
- Alice's choice is `pick` (session state, set by the picker, `null` until she
  chooses; the slot renders empty until then — do not pre-fill it).
- **Bob chooses, he is not assigned.** `bobPool` is `SWATCHES` minus Alice's
  colour and minus yellow; `bobIx = s.dLraw[0] % bobPool.length` — a byte of
  his real private scalar indexes the tray. His colour therefore can never
  collide with hers or with the public colour.
- Mixtures are `MIX(base, mine)` and `MIX(base, bprivC)`; the shared colour is
  `MIX(base, mine, bprivC)` — the mean of a **multiset of ingredients**, not a
  pairwise average. This is why both sides compute the identical final colour:
  `{P,A} + {B}` and `{P,B} + {A}` are both `{P,A,B}`. A pairwise average would
  weight one ingredient twice. `paint.js` proves this against the colours the
  page actually paints.
- A blend is a **6-second held process**, not a cut: the two ingredients meet
  at ~1.3s, overlap and mix for ~2.4s with `blending…` shown and
  `mix-blend-mode:hard-light` on the falling plate, and the result only begins
  to appear at ~3.4s. The beats' `wait` values are tuned to this; changing the
  animation without changing the waits cuts away mid-blend.

**Formula sequence.** Each formula appears on the beat whose visual
relationship it describes, in the dialogue container, never over the action:

| beat | formula |
|---|---|
| `mixAout` | `Q_A = d_A G` |
| `mixB` | `Q_B = d_B G` |
| `reveal` | `Z = d_A Q_B = d_B Q_A` |
| `tokey` | `K = HKDF(Z)` |
| `protect` | `(C, T) = AES-GCM(K, nonce, message)` |
| `open` | `message = AES-GCM-Open(K, nonce, C, T)` |

The full values are behind the "See the actual values" disclosure
(`.flm-more` → `.flm-vals`), which shows the real scalars, points, Z and K the
browser computed. `real.js` checks the panel against the live session.

**Two layers, one bridge.** The analogy layer's colours are either the
viewer's own choice or a documented blend of such colours. The crypto layer's
colours are deterministic mappings of real bytes. No colour anywhere is
invented to look good, and `paint.js` + `real.js` enforce the split.

## Do not

- Edit `index.html`, `src/app.js` or `src/storyboard.html` by hand. They are
  generated. Edit `src/app.tsx` / `src/styles.css` and rebuild.
- Re-introduce padlock or key illustrations, neon pills, purple panels for
  Eve, nested rounded containers, or coloured outer shadows. These were
  removed deliberately and harnesses now fail on several of them.
- Pre-fill Alice's private colour, or give Bob a colour without showing him
  choose it.
- Let a formula replace an animation.
