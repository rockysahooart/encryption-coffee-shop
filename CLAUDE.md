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
| Formula Lab (formulas, real values, lab overlay) | `lab.js`, `a11y2.js`, `real.js` |
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

`tools/smoke.js` runs `hands`, `touch`, `walk`, `fit`, `validate44` and `labels` in
parallel, about 4–8 minutes. Between them they cover:
- all 27 beats, at 1440, 1024, 393, 360 and 320
- the five gates by mouse and by touch
- Bob reading back the typed message
- the happy path at mobile and desktop
- console errors
- the frame reference label on every beat and café state

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
grid: phone in one column, figure in the other at `--face: min(41cqw,230px)` (`min(46cqw,391px,97cqh)` on a module ≥560px wide — pass 56; it was 340px),
bottom-aligned and overlapping the device by 14%, with the stage cropping them
at the knees. Bob's side mirrors. The phone is sized from **its column**
(`min(78cqh,106cqw)`), not from the stage — sizing it from the stage is what
pushes it out through the frame when the figure grows.

**One accent.** `--act` (#83e3a9) means exactly one thing: *this is yours to
act on now*. The turn word, the object you may move, the place it may go, and
the connector between them. It is not a border, not a success state, not the
network. Colours painted from real bytes (the key, the ciphertext, the nonce)
are desaturated so they can never land on the accent and borrow its meaning.
`validate44.js` caps accent usage per frame. Formulas are ink, not accent.
**Byte colours (pass 60)** go through one display mapping (`BYTE_HSL` /
`HSL_HEX` in `app.tsx`): hue from the bytes, carried around the accent band
(125–165°) and the failure-red band (340–20°), saturation and lightness held
quiet. `real.js` recomputes it and checks 4096 values never land in a band.
A glyph on a painted plate uses `INK_ON` (black or white, ≥4.5:1).

**One hairline, one radius, no glow.** 1.4px strokes, `--r`/`--r-s` = 8px,
999px for pills, the device's own percentage corners. Selection rings are
`outline`, never a coloured `box-shadow` — `validate44.js` fails any frame
with a coloured outer shadow.

**Dialogue placement.** The rail travels with whoever is acting: `.rail-a`
left, `.rail-b` right, wide/both centred. The film is a grid, so on desktop
the side is `justify-self` (pass 60; `align-self` never moved it sideways).
It carries one line, an optional second line, and (only on the beats that
have earned it) one formula. Only a turn wears a box — at every width;
desktop narration is unboxed like mobile (pass 60). Font floor: nothing in
the film is under 9px. Names sit below the dialogue line in size: close-up
≈22px, two-shot ≈17px, wide ≈15px.

**Cleanup rules (pass 52).** No connector lines from dialogue to objects —
proximity, scale and motion carry the reference. Plates (swatches, mixtures,
secrets, keys) are borderless. The one draggable plate on a gate pulses in
its **own** colour (`--own`, `grabPulse`, 1.8s) and nothing else marks it: no
ring, no hint chip; the pulse stops when the gate is done. `validate44.js`
exempts `grabPulse` from the moving-element count. Names are 8px-radius
plates with a 1px inside stroke, in three sizes by emphasis (close-up,
two-shot, wide). Spacing inside the phone uses one unit,
`--u: calc(var(--ph-h)/50)`. Removed and not to return: vault padlock header,
history shelf, the packet's "1x" tag, "you chose this one", the grab hint.

**One grid in the colour close-ups (pass 53).** On every frame where a colour
is chosen or blended (2a–5e) the phone screen is a fixed three-row grid:
row 1 what comes in (the public colour, or the other side's mixture), row 2
the private colour, row 3 the result. One plate size (78% of the screen's
content width), rows a fixed pitch from the top (`--pitch`, 15.1u), so adding
the result row never moves the rows above it. The dialogue row reserves its
tallest height across these beats so the phone never changes size between a
gate and its outcome. The public colour stays in the chooser's phone at 60%
during 2a–2c; the picker tray leaves once Alice has chosen.

**Mobile is directed, not scaled (pass 53).** Below 560px the film has its own
composition (Figma row "MOBILE · 393"; 360 and 320 follow the same rules):
close-ups put a ≈78%-of-stage phone beside a figure 58% of its height,
overlapping the glass edge; network shots (1b, 4b–4e, 6b, 9a) bring Alice and
Bob in from the edges at half the stage width, standing behind their phones,
with Eve in a wider centre column holding her copies and the lane drawn at
the copies' size; two-shots (6a, 7a, 7b) put each figure behind its phone;
5f keeps Eve between the phones; 10c stands Alice and Bob above a recap that
stays two by two. Eve's copies carry no visible caption at any width — the
words remain for screen readers (`a11y2.js`).

Figma holds the design (desktop frames 1a–10c, the mobile row, and the
"FIGMA ↔ DEPLOYED PARITY AUDIT" section with every decision by label). Design
there first, implement, then check each changed label against its frame.

**Café staging (pass 56).** Every figure is one staged unit: `.cin-face` is
a sprite-sized box holding the chair (behind), the sprite `<img>` and the table
(in front). Furniture is placed in the sprite's own percentages, so the
tabletop always lands on the sprite's last rows (Alice 279/293, Bob 246/258,
Eve 246/260) and the waist cut never shows at any scale. Never size or move
the furniture against the stage, and never put a phone inside the unit. Layer
order, front to back: phones, plates, packets, the wire (`.flm-lane`, z 3),
names and controls → the unit (faces z 0–1) → the dim café on
`.flm-stage::before` (z −1). The stage crops with `contain:paint`, not
`overflow:hidden`, so a table bleeding off-frame is not counted as clipped
content. Desktop is its own composition: close-ups ×1.15 with a drop that only
spends room the stage has; the whole network row ×1.2 (`--face:30cqw`), Eve
included, so the scales stay three. Tables: narrow on mobile network shots,
long under phone and figure in close-ups, standard on desktop shots. Figma:
"IPHONE INTERACTIVE — CAFÉ 3-LAYER EXPLORATIONS" (explorations, the layer-order
board) and the storyboard rows (the spec, regenerated with a SCENE layer).

**Eve's interception (pass 57).** In the exchange each copy is born where
Eve's tap meets the wire (`--jx`/`--jy`, measured with the tap) and climbs the
tap into her hands while the original keeps travelling: she copies, she does
not stop anything. In `unmix` (4f–4g) Eve's copy of Alice's mixture swells and
comes apart into eight guesses that flicker and fold back into the unchanged
copy. The guesses are real random bytes, desaturated, and any guess near
either private colour, either mixture or the accent is redrawn, so the attempt
can never resolve into a private colour (`paint.js` checks this). They stand
for guessing the private input of a one-way calculation, not for anything
hidden in the mixture. They stay inside Eve's column: on a phone they
zig-zag down the centre, never over either phone.

**Failed recovery (pass 59).** One visual language wherever Eve holds what
travelled but cannot recover what it protects: the attempt is the swell and
the fan of random guesses (4f for the colour, 9b for the packet — random KEY
guesses, never K), and the end state (4g, 9c) is the failure card — what she
holds → an unresolved field of scrambled blocks, a small red mark and one caps
line (PRIVATE INPUT NOT RECOVERED / KEY REQUIRED · DECRYPTION FAILED) — with
the same red edge on her copy. The card sits on the stage just under the phones
(measured with the tap), above the wire, and never covers a phone. No plaintext
ever appears on Eve's side; `paint.js` checks this. Red there means "this
operation failed" and nothing else.

**One order on every phone (pass 58).** Once a mixture has arrived, a phone
shows what came in on top and its own private colour below — the order the
colour close-ups use — in the wide shots too (`xland`, `unmix`), so the
private plate never moves at 5a. An object measured while its side of the
stage is hidden (width 0) never becomes a FLIP origin.

**Design team review V4 (pass 60).** The film can be held: a Pause on the
chapter line (44pt on a phone), and an open overlay ("What Eve has", "See the
actual values") also holds it — the beat clock (`hold`) stops and every film
animation freezes, then both resume. Overlays are modal dialogs: focus in,
Esc out, focus back. While the film is open the café scrubber and nav are
`inert`. A trip back to the café keeps the viewer's colour and resumes at the
last gate (`FILM_MEMO`); only Start over forgets. Each gate takes focus when
it arrives. The chapter line is the name first (on the inset), then three
ticks. 1a shows the premise: an empty dashed "no shared key yet" slot. 7a/7b
show the first bytes of each phone's own Z and K. At 8b K stays on Alice's
phone (a key is not used up). Reduced motion steps through a changing beat
(inputs → result at 3.36s → cover/failure at 4.8s) and shows a crossing at
its end, inside the stage. On a phone held sideways the page heading steps
aside; the film is composed upright and says so quietly. Eve is "she"
everywhere. Figma: "IPHONE INTERACTIVE — DESIGN TEAM REVIEW V4" (spec, before,
after per finding).

**Usability pass V5 (pass 61, mobile first).** Bob still chooses, but never
a colour whose mixture sits within RGB 55 of Alice's or whose final colour
sits within 30 of either mixture (≥3 choices always remain; `paint.js` checks
the session). While two colours stack in a blend, the private plate's
caption reads "mixing on top · the private colour is underneath"; a covered
result says "hidden until both are done". From 6a the d/Q/Z plates carry a
6px strip of the paint they stood for. 10c restates the lesson (your colour
never left; Eve copied what crossed) and, at ≥360, that Eve here only
listens (certificates); Start over comes after the recap. The copy says
plainly that real paint could be unmixed and the one-way step is P‑256's.
The values overlay scrolls inside the film with Back pinned; overlays trap
Tab and close on Esc or a backdrop tap. Testing is mobile first: phones
(393/360/320 touch, 852×393) before desktop.

**Formula Lab (pass 62).** Optional depth, offered only at 6a and 10c as a
quiet "Formula Lab" button; it opens as the film's modal overlay (`peeking ===
"lab"`), so the film is held, focus is trapped, Esc / Back / backdrop close it.
Step 1 COLOUR EXPERIMENT ("not a key exchange"): the two real colours as hex
(RGB expandable) and four formulas — Average (= the film's `MIX`), Weighted
¼/¾, XOR, SHA‑256 of the six bytes → the film's byte palette — worked out
channel by channel from those exact values (= when exact, ≈ when rounded).
Step 2 REAL ECDH, progressive: L5 intro (3 bytes vs 32), L6 public values
(Alice | Bob columns), L7 Z made on each side (x-coordinate) and never sent,
L8 K = HKDF(Z); private values stay in their column, received Q slides in,
Z and K never move. Every value is this session's (`0x…` short, tap to
inspect; Q as SEC1 `04 …`). Review labels L1–L8 sit in the lab's corner;
`window.__lab("L4")` freezes a state. `tools/lab.js` recomputes every formula
and checks every real value against the session. Figma: "IPHONE INTERACTIVE —
FORMULA LAB V6".

**One world, moving camera (pass 63).** Supersedes the per-beat layouts
above where they conflict. Every beat renders the same café (the wide
network layout: Alice left, Eve centre, Bob right, the wire below); the root
is always `flm world cam-wide xchg shot-<cam>`. Inactive people dim where
they stand (`.flm-slot.off`); nobody is removed or moved between beats. The
**camera** is a transform on `.flm-stage` inside `.flm-view` (`--cam`,
1.1s), computed in `Cinema` from live rects in world coordinates: a close-up
(`shot-a`/`shot-b`) frames the active station (face, name, phone) at ~62% of
the width, zoom ≤2.2 (≤1.75 on a phone); wide beats are unzoomed; 10c
(`recap`, not `chain`) pulls back to show the café whole above the takeaway,
the recap and the controls. In a close-up the **active phone lifts**: it is
held out from the shoulder toward the middle at `--ph-h:min(62cqh,36cqw/.479)`,
the size its interface is authored for. Anything measured on screen (FLIP,
Eve's tap, drags, the contact painter) divides by the stage's effective
scale (`rect.width / offsetWidth`). Frozen labels finish the camera move.
**Responsive strategy.** Wider than a phone, the stage is **one canonical
box, 1000 × 625** (`STAGE_W`/`STAGE_H`, `.stage-box`), scaled as a whole by
`--fit = max(floor, min(1, w/1000, h/625))` from the App, where the
legibility floor is physical (`.7 / devicePixelRatio`, ≥.35, so browser zoom
and retina keep the canonical stage); it never grows past 1
and nothing inside it reads the window (no vh/vw/media rules inside the
stage). `html.fit-short` (<860 high) puts the heading on one row,
`fit-tiny` (<620) shrinks it. Too narrow for the floor → the phone
composition; too short for it → the page scrolls (1x windows under ~540 high).
Phones (<560, or sideways) are not scaled: the film is the viewport; ≤760
high the heading is one line, ≤600 it steps aside.
**Direct-contact blending.** Where two plates touch, the touching area is
the mixture: no overlap shows both colours, a partial overlap blends only
the overlap, a full overlap shows the full blend. The app paints the
intersection (`.flm-contact`, in the phone screen) in the formula's `MIX`
colour — never CSS blending — under the viewer's finger (3a, 5a) and in
every scripted blend (3b–3e, 5b–5e), at the moving plate's opacity. The old
1.0s whole-plate convergence is gone; the blend clock is otherwise as below.
Figma: "IPHONE INTERACTIVE — ONE WORLD, MOVING CAMERA V7".

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
exchange · xland · unmix · combA · combAout · combB · reveal · asmath · pubvals ·
zsec · tokey · type · protect · journey · unseal · arrive · open · chain
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
- A blend is a **6-second transformation**, not a touch (pass 50). On one
  linear clock:
  - **0–1.3s:** the moving ingredient drops from row 1 *onto* the private
    plate in row 2 until the edges coincide (the travel is exactly one grid
    pitch; FLIP is suspended in a blend frame so both sources start in
    place). The ingredient stays opaque; where it overlaps the plate, the overlap
    is painted as the mixture (pass 63).
  - **from first contact:** the overlapping area is the real `MIX` result
    (pass 63, direct contact); full overlap from ~1.3s.
  - **2.82–3.36s:** a synchronised hold.
  - **3.36s:** the result is born on the stack; from 3.6s it pulls down into
    row 3 (by 4.8s), uncovering the private plate, which never moved.
  - **4.8–5.2s:** only then does the result's caption appear.
  - **Combines only:** the result is then covered (4.8–5.4s) until 5f.

  The result is never visible before 3.36s. `wait` values (≥6.4s) are tuned
  to this; changing the animation without them cuts away mid-blend.
  `window.__ref("3b", ms)` freezes any moment of it.

**Formula sequence.** Each formula appears on the beat whose visual
relationship it describes, in the dialogue container, never over the action:

| beat | formula |
|---|---|
| `pubvals` (6b) | `Q_A = d_A G · Q_B = d_B G` |
| `zsec` (7a) | `Z = d_A Q_B = d_B Q_A` |
| `tokey` (7b) | `K = HKDF(Z)` |
| `protect` | `(C, T) = AES-GCM(K, nonce, message)` |
| `open` | `message = AES-GCM-Open(K, nonce, C, T)` |

The full values are behind the "See the actual values" disclosure
(`.flm-more` → `.flm-vals`), which shows the real scalars, points, Z and K the
browser computed. `real.js` checks the panel against the live session.

**Two layers, one bridge.** The analogy layer's colours are either the
viewer's own choice or a documented blend of such colours. The crypto layer's
colours are deterministic mappings of real bytes. No colour anywhere is
invented to look good, and `paint.js` + `real.js` enforce the split.

## Frame reference labels

The film and the Figma storyboard share one set of review labels. A note
like "4c needs a bigger Eve" means the same picture in both places.

- **Figma:** [Encryption Coffee Shop — iPhone Interactive Storyboard](https://www.figma.com/design/FfurwWtD8WRHOXEH6rFUue).
  Each top-level frame is named `4c — Eve copies both mixtures`, with the bare
  label in large type just above its top-left corner.
- **Live:** `.ref-label`, top-left of the module, in the panel padding: absolutely
  positioned, `pointer-events:none`, no animation. It is a review marker, not
  lesson copy.
- **Code:** `REF` / `REF_SUB` (film) and `CAFE_REF` (café notes) in `app.tsx`.
  The expected table is `LABELS` / `LABEL_SUB` in `tools/drive.js`; the freeze
  points are `REF_AT` in `app.tsx`.
  `tools/labels.js` checks that they agree and that the label overlaps nothing.
  It is part of the smoke suite.
- **Inspecting a label:** every film label is a deterministic, frozen state.
  `window.__ref("4c")` is hidden, review-only and not in the UI. It pins the
  beat and pauses every animation in the film at that label's moment
  (`REF_AT` in `app.tsx`). `window.__refs` lists the labels. From the tools:
  - `node tools/shoot.js 4b 4c 4d` screenshots each label frozen, at 393 and 1440
  - `gotoRef(page, "4c")` in `tools/drive.js` does the same inside a harness;
    café labels `0a`–`0d` are found by stepping the café tape
- **Changing a beat:** if you add, split or rename a beat, give it a label in
  all three places and in Figma, in story order. Don't renumber existing
  labels unless the storyboard is re-cut.

| label | storyboard frame | production beat / state |
|---|---|---|
| 0a | Alice wants to reach Bob | café, notes `wifi`, `pairWant` |
| 0b | One Wi‑Fi, and Eve is on it | café, notes `eveHere` → `oneNetwork` |
| 0c | A plain note crosses | café, note `plainDemo` |
| 0d | Eve reads it | café, notes `plainSeen`, `howPrivate` |
| 1a | The problem — you are Alice | act 2 push-in (`pushAlice`), then `problem` |
| 1b | The public colour | `base` |
| 2a | Alice chooses | `pickA` (gate: tap) |
| 2b | Alice’s colour stays | `mine` |
| 2c | Bob chooses | `pickB` |
| 3a | Alice drags the public colour | `mixA` (gate: drag) |
| 3b | The colours blend | `mixAout`, 0–3.36s |
| 3c | Alice’s mixture | `mixAout`, from 3.36s |
| 3d | Bob’s colours blend | `mixB`, 0–3.36s |
| 3e | Bob’s mixture | `mixB`, from 3.36s |
| 4a | Alice sends | `sendA` (gate: tap) |
| 4b | Alice’s mixture leaves, Bob sends his | `exchange`, 0–2.6s (Bob’s own Send at ~0.8s) |
| 4c | Eve copies both mixtures | `exchange`, 2.6–3.9s |
| 4d | Copies to Eve, originals continue | `exchange`, from 3.9s |
| 4e | Mixtures arrive | `xland` |
| 4f | Eve tries to unmix a copy | `unmix`, 0–4.8s (the guesses are out from ~1.8s) |
| 4g | Colour recovery fails (the copy stays mixed) | `unmix`, from 4.8s |
| 5a | Alice combines | `combA` (gate: drag) |
| 5b | Alice’s colours blend | `combAout`, 0–3.36s |
| 5c | Alice’s result (covered at ~4.9s) | `combAout`, from 3.36s |
| 5d | Bob’s colours blend | `combB`, 0–3.36s |
| 5e | Bob’s result (covered at ~4.9s) | `combB`, from 3.36s |
| 5f | Same colour, never sent | `reveal` |
| 6a | Paint becomes numbers | `asmath` |
| 6b | Public values Q_A, Q_B | `pubvals` |
| 7a | Shared secret Z | `zsec` |
| 7b | Key K = HKDF(Z) | `tokey` |
| 8a | Alice types | `type` (gate: type, Send) |
| 8b | The message becomes a packet | `protect` |
| 9a | Packet crosses, Eve copies it | `journey` |
| 9b | Eve tries to open her copy | `unseal`, 0–4.8s |
| 9c | Decryption fails | `unseal`, from 4.8s |
| 10a | Bob checks the packet | `arrive` |
| 10b | Bob opens it | `open` |
| 10c | Recap | `chain` |

A1–A4 in Figma are alternate compositions, not in the film.

## Do not

- Edit `index.html`, `src/app.js` or `src/storyboard.html` by hand. They are
  generated. Edit `src/app.tsx` / `src/styles.css` and rebuild.
- Re-introduce padlock or key illustrations, neon pills, purple panels for
  Eve, nested rounded containers, or coloured outer shadows. These were
  removed deliberately and harnesses now fail on several of them.
- Pre-fill Alice's private colour, or give Bob a colour without showing him
  choose it.
- Let a formula replace an animation.
