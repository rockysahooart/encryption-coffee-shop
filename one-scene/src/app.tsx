/* ============================================================================
   ONE SCENE, ONE CAMERA — Diffie–Hellman in a coffee shop
   ----------------------------------------------------------------------------
   Three ideas carry the whole system:

   1. ONE PERSISTENT SCENE. The room is drawn once, as one SVG coordinate
      space, and never torn down. Steps change what is visible *inside* a world
      that keeps existing, so continuity is free.

   2. A CAMERA, NOT A LAYOUT. Attention is directed by moving a virtual camera
      over the scene, not by re-flowing DOM. The same drawing serves a wide
      shot and a close-up.

   3. BEATS, NOT CLICKS. One user action enters a narrative beat-group; inside
      it an async timeline plays 3-6 sub-beats.

   All narrative state is `step`. Everything else is derived and fully
   reconstructible, so jumping to step 4 replays step 4 from a clean baseline.
   ========================================================================== */

const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================ 1. TYPES === */

type Step = 1 | 2 | 3 | 4 | 5;
type Shot = "wide" | "you" | "fr" | "both" | "net" | "atk";
type Tone = "you" | "fr" | "key" | "danger" | "neutral";
type GlyphKind = "setup" | "lock" | "packet" | "key" | "msg" | "cipher";
type Who = "you" | "fr" | "atk";

interface Spot { x: number; y: number; s: number }

interface CalloutDef {
  kind: "note" | "chip";
  tag?: string;
  text: string;
  tone?: Tone;
  to: [number, number];
}

type Calls = Record<string, CalloutDef | null>;
type Flow = [string, Tone, 1 | -1];

interface Layout {
  tall: boolean;
  w: number; h: number;
  you: Spot; fr: Spot; atk: Spot;
  router: { x: number; y: number };
  sight: string;
  paths: Record<string, string>;
  shots: Record<Shot, [number, number, number]>;
  co: Record<Who, [number, number]>;
  ch: Record<string, [number, number]>;
  an: Record<string, [number, number]>;
}

/* ========================================================= 2. STAGINGS === */
/* Two complete coordinate worlds. Not one scaled down: different aspect
   ratio, different actor scales, different camera targets, different label
   positions. Nothing else in the app knows which one is active.             */

const WIDE: Layout = {
  tall: false,
  w: 1000, h: 700,
  you: { x: 220, y: 500, s: 1 },
  fr:  { x: 780, y: 500, s: 1 },
  atk: { x: 512, y: 420, s: 0.82 },
  router: { x: 500, y: 100 },
  sight: "M512 384 C 508 320, 504 250, 500 186",
  paths: {
    main:   "M226 440 C 300 380, 420 220, 500 128 C 580 220, 700 380, 774 440",
    netYou: "M500 128 C 420 220, 300 380, 226 440",
    netFr:  "M500 128 C 580 220, 700 380, 774 440",
    netAtk: "M500 128 C 505 210, 508 300, 512 384",
  },
  shots: {
    wide: [500, 350, 1.00],
    you:  [230, 470, 1.55],
    fr:   [770, 470, 1.55],
    both: [500, 480, 1.20],
    net:  [500, 350, 1.00],
    atk:  [500, 420, 1.30],
  },
  /* Authored, not computed. Each anchor satisfies four constraints: inside
     every shot frame it appears in, not over scenery, leader clears all text,
     and the box clears its own speaker's head and nameplate. */
  co: { you: [350, 646], fr: [650, 646], atk: [250, 300] },
  /* cNet names the router and only ever appears in a frame that contains the
     wall; cMid speaks about the space between the two tables, so it needs a
     slot that survives the two-shot. */
  ch: { cYou: [110, 386], cFr: [890, 386], cNet: [560, 40], cMid: [500, 250],
        cAtk: [655, 380] },
  an: {
    youScreen: [262, 500], frScreen: [738, 500], atkScreen: [445, 415],
    router:    [500, 100], mid:      [500, 170],
  },
};

const TALL: Layout = {
  tall: true,
  w: 560, h: 880,
  you: { x: 175, y: 445, s: 0.76 },
  fr:  { x: 175, y: 762, s: 0.76 },
  atk: { x: 415, y: 235, s: 0.55 },
  router: { x: 452, y: 520 },
  sight: "M417 224 C 432 300, 446 410, 452 486",
  paths: {
    main:   "M181 418 C 300 430, 430 452, 452 520 C 430 600, 300 700, 181 735",
    netYou: "M452 520 C 430 452, 300 430, 181 418",
    netFr:  "M452 520 C 430 600, 300 700, 181 735",
    netAtk: "M452 520 C 448 400, 430 292, 417 224",
  },
  shots: {
    wide: [280, 440, 1.00],
    you:  [175, 500, 1.42],
    fr:   [175, 690, 1.42],
    both: [190, 590, 1.05],
    net:  [280, 470, 1.00],
    atk:  [256, 385, 1.30],
  },
  co: { you: [180, 575], fr: [180, 575], atk: [180, 575] },
  ch: { cYou: [ 78, 380], cFr: [ 78, 697], cNet: [400, 590], cMid: [370, 668],
        cAtk: [250, 300] },
  an: {
    youScreen: [245, 445], frScreen: [245, 762], atkScreen: [360, 250],
    router:    [452, 520], mid:      [340, 640],
  },
};

/* ============================================================= 3. COPY === */
/* Every word in one place. Roughly 75/25 visual to verbal — fewer words than
   this and the viewer has to infer; more and they stop watching.            */

const BEATS = ["SETUP", "KEEP", "SHARE", "COMBINE", "SEND"];

const TITLES: Record<Step, string> = {
  1: "Maya and Leo want to agree on a secret, in a room where everyone can hear.",
  2: "Each of them picks a private number and never lets it leave the table.",
  3: "Each sends the other something that is safe to overhear.",
  4: "Both mix what they received with what they kept — and land on the same key.",
  5: "Now the message crosses the room, and only the two of them can read it.",
};

const QUESTIONS: Record<Step, string> = {
  1: "Why is this hard?",
  2: "What is a private value?",
  3: "Isn't sending anything dangerous?",
  4: "How do they end up with the same key?",
  5: "So what did Evan actually get?",
};

const ANSWERS: Record<Step, string> = {
  1: "They have never met and share no password. Every word they exchange crosses a café network that a stranger is already listening to.",
  2: "A number you invent and never transmit. It is the one thing in this story that never moves — which is exactly why it can be trusted later.",
  3: "No. The public value is derived from the private one, and the derivation only runs one way. Anyone can hold it; nobody can run it backwards.",
  4: "Same ingredients, either order. Maya's private mixed with Leo's public equals Leo's private mixed with Maya's public. The key is computed at both tables, never sent between them.",
  5: "Both public values and every encrypted byte. He is missing exactly one thing — either private number — and without it the two halves he holds do not combine into anything.",
};

/* ==================================================== 4. SCENE PARTS ===== */

const Cup = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse className="paper" cx="0" cy="0" rx="10.5" ry="8" />
    <ellipse className="ln" cx="0" cy="0" rx="10.5" ry="8" />
    <ellipse className="furn-2" cx="0" cy="0" rx="6.5" ry="4.6" />
    <path className="ln-thin" d="M10.5 -1 a5 4 0 0 1 0 3" />
  </g>
);

/* Character rig. Local coordinates, origin = table centre.
   Head bottom sits at -75; laptop top at -66; nine units of clear air between
   a chin and a screen is the difference between a person and a pile of shapes. */
const Patron = ({
  spot, hue, hair, name, inv, cls, screen, extra,
}: {
  spot: Spot; hue: string; hair: React.ReactNode; name: string;
  inv: number; cls: string; screen: React.ReactNode; extra?: React.ReactNode;
}) => (
  <g className={"actor " + cls} transform={`translate(${spot.x},${spot.y}) scale(${spot.s})`}>
    {/* the only shadow in the system; it grounds the rig */}
    <ellipse className="sh" cx="0" cy="12" rx="99" ry="31" data-audit="SHADOW" />

    <rect className="furn-2" x="-33" y="-148" width="66" height="34" rx="14" />
    <rect className="ln"    x="-33" y="-148" width="66" height="34" rx="14" data-audit="CHAIR" />

    {/* torso tucks under the table so no floor shows between body and table */}
    <path fill={hue} d="M-38 -28 C -38 -62, -24 -83, 0 -83 C 24 -83, 38 -62, 38 -28 Z" />
    <path className="ln" d="M-38 -28 C -38 -62, -24 -83, 0 -83 C 24 -83, 38 -62, 38 -28" data-audit="BODY" />

    <circle className="paper" cx="0" cy="-96" r="21" />
    <circle className="ln"    cx="0" cy="-96" r="21" data-audit="HEAD" />
    {hair}
    <circle className="ink" cx="-7" cy="-89" r="2.6" />
    <circle className="ink" cx="7"  cy="-89" r="2.6" />

    {/* two stacked ellipses read as thickness from above */}
    <ellipse className="furn-2" cx="0" cy="7" rx="92" ry="34" />
    <ellipse className="furn"   cx="0" cy="0" rx="92" ry="34" />
    <ellipse className="ln"     cx="0" cy="0" rx="92" ry="34" data-audit="TABLE" />

    <Cup x={62} y={-2} />

    {/* laptop: deck flares to the near edge as the only perspective cue */}
    <path className="furn-2" d="M-50 -6 L50 -6 L66 10 L-66 10 Z" />
    <path className="ln"     d="M-50 -6 L50 -6 L66 10 L-66 10 Z" />
    <rect className="paper" x="-46" y="-66" width="92" height="60" rx="7" />
    <rect className="ln"    x="-46" y="-66" width="92" height="60" rx="7" data-audit="LAPTOP" />
    <rect className="glass" x="-41" y="-61" width="82" height="50" rx="4" data-audit="GLASS" />
    <g transform="translate(0,-36)">{screen}</g>

    {extra}

    <g transform="translate(0,74)">
      <g className="hold" style={{ transform: `scale(${inv / spot.s})` }}>
        <text className="nameplate" y="0" data-audit="NAME">{name}</text>
      </g>
    </g>
  </g>
);

const Router = ({ x, y, live }: { x: number; y: number; live: boolean }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse className="sh" cx="0" cy="14" rx="34" ry="10" />
    <rect className="furn-2" x="-26" y="-8" width="52" height="20" rx="6" />
    <rect className="ln"     x="-26" y="-8" width="52" height="20" rx="6" data-audit="ROUTER" />
    <path className="ln" d="M-14 -8 L-20 -26 M14 -8 L20 -26" />
    <circle className={live ? "f-key" : "f-neutral"} cx="0" cy="2" r="3.4" />
    <path className="bg-ln" d="M-40 -30 a26 26 0 0 1 -8 -18" opacity="0" />
    <g opacity={live ? 0.9 : 0.35}>
      <path className="bg-ln" d="M-34 -14 a20 20 0 0 1 0 -22" />
      <path className="bg-ln" d="M-44 -10 a30 30 0 0 1 0 -30" />
      <path className="bg-ln" d="M34 -14 a20 20 0 0 0 0 -22" />
      <path className="bg-ln" d="M44 -10 a30 30 0 0 0 0 -30" />
    </g>
  </g>
);

/* The room. Wall band across the top, floor below, isometric tile pattern,
   and floor objects that read as being IN the room rather than on the wall. */
const Dressing = ({ L }: { L: Layout }) => {
  const wallH = 150;
  return (
    <g>
      {/* Bleed: ground planes run 300 units past the viewBox on every side, or
         a camera pushed in near an edge reveals the container behind the room. */}
      <rect className="wall-fill" x="-300" y="-300" width={L.w + 600} height={wallH + 300} />
      <rect className="floor-fill" x="-300" y={wallH} width={L.w + 600} height={L.h + 600} />
      <rect x="-300" y={wallH} width={L.w + 600} height={L.h + 600} fill="url(#tiles)" />
      <path className="ln" d={`M-300 ${wallH} H ${L.w + 300}`} />

      {/* window */}
      <g transform={`translate(${L.tall ? 120 : 175},${72})`}>
        <rect className="glass" x="-96" y="-52" width="192" height="104" rx="8" />
        <rect className="bg-ln" x="-96" y="-52" width="192" height="104" rx="8" strokeWidth="3" data-audit="WINDOW" />
        <path className="bg-ln" d="M0 -52 V52 M-96 0 H96" strokeWidth="2.4" />
      </g>

      {/* menu board */}
      <g transform={`translate(${L.tall ? 400 : 760},${66})`}>
        <rect className="furn-2" x="-74" y="-44" width="148" height="88" rx="6" />
        <rect className="bg-ln"  x="-74" y="-44" width="148" height="88" rx="6" strokeWidth="3" data-audit="SIGN" />
        <path className="bg-ln" d="M-52 -20 H52 M-52 0 H30 M-52 20 H44" strokeWidth="2.6" />
      </g>

      {/* counter */}
      <g transform={`translate(${L.tall ? 470 : 110},${L.tall ? 782 : 208})`}>
        <ellipse className="sh" cx="0" cy="30" rx="88" ry="18" />
        <rect className="furn"   x="-84" y="-26" width="168" height="54" rx="10" />
        <rect className="bg-ln"  x="-84" y="-26" width="168" height="54" rx="10" strokeWidth="3" data-audit="COUNTER" />
        <path className="bg-ln" d="M-84 -8 H84" strokeWidth="2.2" />
      </g>

      {/* plant */}
      <g transform={`translate(${L.tall ? 60 : 906},${L.tall ? 250 : 250})`}>
        <ellipse className="sh" cx="0" cy="30" rx="30" ry="9" />
        <path className="furn-2" d="M-18 4 H18 L14 30 H-14 Z" />
        <path className="bg-ln"  d="M-18 4 H18 L14 30 H-14 Z" strokeWidth="3" data-audit="PLANT" />
        <path className="bg-ln" d="M0 4 C -22 -8, -26 -32, -8 -40 M0 4 C 20 -10, 24 -30, 6 -38 M0 4 V -26" strokeWidth="2.6" />
      </g>
    </g>
  );
};

/* ======================================================= 5. ITEM LAYER === */
/* The abstract concepts, drawn as objects in the same outline language as the
   furniture — so they belong to the world instead of floating above it.     */

const TONE_FILL: Record<Tone, string> = {
  you: "f-you-s", fr: "f-fr-s", key: "f-key-s", danger: "f-danger", neutral: "f-neutral",
};
const TONE_SOLID: Record<Tone, string> = {
  you: "f-you", fr: "f-fr", key: "f-key", danger: "f-danger", neutral: "f-neutral",
};

const Glyph = ({ kind, tone }: { kind: GlyphKind; tone: Tone }) => {
  const soft = TONE_FILL[tone], solid = TONE_SOLID[tone];
  switch (kind) {
    case "setup":
      return (<g data-audit="GLYPH">
        <rect className="f-neutral" x="-12" y="-9" width="24" height="18" rx="4" />
        <rect className="ln" x="-12" y="-9" width="24" height="18" rx="4" />
        <circle className="ink" cx="-5" cy="0" r="1.7" />
        <circle className="ink" cx="0"  cy="0" r="1.7" />
        <circle className="ink" cx="5"  cy="0" r="1.7" />
      </g>);
    case "lock":
      return (<g data-audit="GLYPH">
        <path className="ln" d="M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" />
        <rect className={soft} x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        <rect className="ln"   x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        <circle className="ink" cx="0" cy="0" r="1.9" />
      </g>);
    case "packet":
      return (<g data-audit="GLYPH">
        <rect className={soft} x="-13" y="-9.5" width="26" height="19" rx="3.5" />
        <rect className="ln"   x="-13" y="-9.5" width="26" height="19" rx="3.5" />
        <path className="ln"   d="M-13 -6 L0 3 L13 -6" />
      </g>);
    case "key":
      return (<g data-audit="GLYPH">
        <circle className="f-key" cx="-6" cy="0" r="7" />
        <circle className="ln"    cx="-6" cy="0" r="7" />
        <circle className="glass" cx="-6" cy="0" r="2.4" />
        <path className="ln" d="M1 0 H14 M11 0 V4.5 M7.5 0 V3.5" />
      </g>);
    case "msg":
      return (<g data-audit="GLYPH">
        <rect className="f-neutral" x="-29" y="-14" width="58" height="28" rx="7" />
        <rect className="ln"        x="-29" y="-14" width="58" height="28" rx="7" />
        <path className="ln" d="M-18 14 L-13 20 L-8 14" />
        <circle className={solid} cx="-18" cy="0" r="5.5" />
        <path className="ln-thin" d="M-8 -4 H22 M-8 4 H13" />
      </g>);
    case "cipher":
      return (<g data-audit="GLYPH">
        <rect className="f-key-s" x="-29" y="-12.5" width="58" height="25" rx="6" />
        <rect className="ln"      x="-29" y="-12.5" width="58" height="25" rx="6" />
        <g transform="translate(-19,0) scale(.62)">
          <path className="ln" d="M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" />
          <rect className="f-key" x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
          <rect className="ln"    x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        </g>
        <text className="cipher" x="-8" y="4">8F A2</text>
      </g>);
  }
};

/* The same geometry as <Glyph>, emitted as a string for the imperative flight
   layer. Duplicated deliberately: serialising React to string costs more than
   it saves, and the two are commented as a pair. */
function packetMarkup(kind: GlyphKind, tone: Tone): string {
  const soft = TONE_FILL[tone];
  if (kind === "packet") {
    return `<rect class="${soft}" x="-13" y="-9.5" width="26" height="19" rx="3.5"/>
            <rect class="ln" x="-13" y="-9.5" width="26" height="19" rx="3.5"/>
            <path class="ln" d="M-13 -6 L0 3 L13 -6"/>`;
  }
  if (kind === "cipher") {
    return `<rect class="f-key-s" x="-29" y="-12.5" width="58" height="25" rx="6"/>
            <rect class="ln" x="-29" y="-12.5" width="58" height="25" rx="6"/>
            <g transform="translate(-19,0) scale(.62)">
              <path class="ln" d="M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7"/>
              <rect class="f-key" x="-9.5" y="-7" width="19" height="14.5" rx="3.5"/>
              <rect class="ln" x="-9.5" y="-7" width="19" height="14.5" rx="3.5"/>
            </g>
            <text class="cipher" x="-8" y="4">8F A2</text>`;
  }
  return `<rect class="f-neutral" x="-12" y="-9" width="24" height="18" rx="4"/>
          <rect class="ln" x="-12" y="-9" width="24" height="18" rx="4"/>`;
}

/* Hard cap of two items per screen. When a third would be needed the story
   changes instead — something leaves. Which is also what actually happens. */
const ITEM: Record<string, [GlyphKind, Tone]> = {
  "you.setup":  ["setup", "neutral"], "fr.setup":  ["setup", "neutral"],
  "you.lock":   ["lock", "you"],      "fr.lock":   ["lock", "fr"],
  "you.pubYou": ["packet", "you"],    "fr.pubFr":  ["packet", "fr"],
  "you.pubFr":  ["packet", "fr"],     "fr.pubYou": ["packet", "you"],
  "you.key":    ["key", "key"],       "fr.key":    ["key", "key"],
  "you.msg":    ["msg", "you"],       "fr.msg":    ["msg", "you"],
  "you.cipher": ["cipher", "key"],    "fr.cipher": ["cipher", "key"],
  "atk.pubYou": ["packet", "you"],    "atk.pubFr": ["packet", "fr"],
  "atk.cipher": ["cipher", "key"],
};

const ORDER: Record<Who, string[]> = {
  you: ["you.setup", "you.lock", "you.pubYou", "you.pubFr", "you.key", "you.msg", "you.cipher"],
  fr:  ["fr.setup", "fr.lock", "fr.pubFr", "fr.pubYou", "fr.key", "fr.cipher", "fr.msg"],
  atk: ["atk.pubYou", "atk.pubFr", "atk.cipher"],
};

const Screen = ({ who, vis }: { who: Who; vis: Set<string> }) => {
  const on = ORDER[who].filter((id) => vis.has(id));
  const gap = on.length > 1 ? 34 : 0;
  return (
    <g>
      {on.map((id, i) => {
        const [kind, tone] = ITEM[id];
        const x = (i - (on.length - 1) / 2) * gap;
        return (
          <g key={id} transform={`translate(${x},0)`} data-id={id}>
            <Glyph kind={kind} tone={tone} />
          </g>
        );
      })}
    </g>
  );
};

/* ====================================================== 6. ANNOTATION ==== */

function wrapText(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? line + " " + w : w;
    if (next.length > max && line) { lines.push(line); line = w; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const TAG_FILL: Record<Tone, string> = {
  you: "var(--you)", fr: "var(--fr)", key: "var(--key)",
  danger: "var(--danger)", neutral: "var(--text-3)",
};

const Callout = ({ def, at, inv, narrow }: {
  def: CalloutDef; at: [number, number]; inv: number; narrow: boolean;
}) => {
  const [ax, ay] = at;
  const to = def.to;
  const chip = def.kind === "chip";
  const fs = chip ? 14 : 15.5;
  const padX = chip ? 16 : 22;
  const padY = chip ? 12 : 18;
  const lines = wrapText(def.text, narrow ? 22 : 26);
  const longest = lines.reduce((a, b) => (a.length > b.length ? a : b), "");
  /* 0.53 is the average glyph-width ratio for the display face at weight 600.
     Measured once, hard-coded, deliberately generous — over-estimating adds
     air, under-estimating puts text against the border. */
  const w = Math.max(96, Math.round(longest.length * fs * 0.53 + padX * 2));
  const lh = fs * 1.55;
  const tagH = def.tag ? 20 : 0;
  const h = Math.round(lines.length * lh + padY * 2 + tagH);

  return (
    <g transform={`translate(${ax},${ay})`}>
      {/* The leader lives OUTSIDE the counter-scaled group. Inside it, the
          group's bounding box would include the leader and the scale would
          pivot on the wrong point, sliding the label off its anchor. */}
      <g className="leader" style={{ strokeWidth: 1.6 * inv }} data-audit="LEADER"
         data-x1={to[0]} data-y1={to[1]} data-x2={ax} data-y2={ay}>
        <line x1={0} y1={0} x2={to[0] - ax} y2={to[1] - ay} />
        <circle cx={to[0] - ax} cy={to[1] - ay} r={4 * inv} />
      </g>

      <g className="hold" style={{ transform: `scale(${inv})` }}>
        {chip ? (
          <g data-audit="CHIP">
            <text className="chip-halo" textAnchor="middle" y={5}>{def.text}</text>
            <text className="chip-text" textAnchor="middle" y={5}>{def.text}</text>
          </g>
        ) : (
          <g data-audit="DIALOG">
            <rect className="paper" x={-w / 2} y={-h / 2} width={w} height={h} rx="12" />
            <rect fill="none" stroke="var(--outline)" strokeWidth="3.4"
                  x={-w / 2} y={-h / 2} width={w} height={h} rx="12" />
            <rect fill={TAG_FILL[def.tone || "neutral"]} opacity=".16"
                  x={-w / 2 + 3} y={-h / 2 + 3} width={w - 6} height={22} rx="9" />
            {def.tag && (
              <text className="dlg-tag" data-audit="TAG" x={-w / 2 + padX} y={-h / 2 + 18}
                    fill={TAG_FILL[def.tone || "neutral"]}>{def.tag}</text>
            )}
            {lines.map((ln, i) => (
              <text key={i} className="dlg-text" x={-w / 2 + padX}
                    y={-h / 2 + padY + tagH + lh * (i + 0.75)}>{ln}</text>
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

/* ========================================================== 7. CHROME === */

const StepControls = ({ step, set, replay }: {
  step: Step; set: (s: Step) => void; replay: () => void;
}) => (
  <div className="nav">
    <div className="nav-in">
      <button className="btn replay" onClick={replay} aria-label="Replay this step">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4" />
        </svg>
        <span>Replay</span>
      </button>
      <div className="spacer" />
      <button className="btn" disabled={step === 1}
              onClick={() => set((step - 1) as Step)}>Back</button>
      <button className="btn primary"
              onClick={() => set(step === 5 ? 1 : ((step + 1) as Step))}>
        {step === 5 ? "Start over" : "Next"}
        <span className="ct">{step}/5</span>
      </button>
    </div>
  </div>
);

/* ======================================================== 8. FALLBACKS === */
/* The exact end state of each beat. Reduced-motion users, thumbnails, and
   anyone arriving mid-transition all see this, so every step needs a legible
   still frame. */

const RESTING: Record<Step, string[]> = {
  1: ["you.setup", "fr.setup"],
  2: ["you.setup", "you.lock", "fr.setup", "fr.lock"],
  3: ["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"],
  4: ["you.key", "fr.key", "atk.pubYou", "atk.pubFr"],
  5: ["you.cipher", "fr.msg", "atk.cipher"],
};

const RESTING_CALLS = (L: Layout): Record<Step, Calls> => ({
  1: { d: { kind: "note", tag: "EVAN", tone: "danger", to: L.an.atkScreen,
            text: "Same network. I see everything." } },
  2: { d: { kind: "note", tag: "MAYA", tone: "you", to: L.an.youScreen,
            text: "My number stays on my table." },
       cMid: { kind: "chip", text: "nothing has crossed", to: L.an.mid } },
  3: { d: { kind: "note", tag: "EVAN", tone: "danger", to: L.an.atkScreen,
            text: "Two public values. Useless alone." } },
  4: { d: { kind: "note", tag: "MAYA", tone: "key", to: L.an.youScreen,
            text: "Same key. Neither of us sent it." } },
  5: { d: { kind: "note", tag: "LEO", tone: "fr", to: L.an.frScreen,
            text: "Dinner at 8. Read only here." },
       cAtk: { kind: "chip", text: "still scrambled", to: L.an.atkScreen } },
});

/* ============================================================== 9. APP === */

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function App() {
  const [step, setStep] = useState<Step>(1);
  const [L, setL] = useState<Layout>(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 880px)").matches ? WIDE : TALL);
  const [shot, setShot] = useState<Shot>("wide");
  const [vis, setVis] = useState<Set<string>>(new Set());
  const [calls, setCalls] = useState<Calls>({});
  const [flows, setFlows] = useState<Flow[]>([]);
  const [seen, setSeen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const packRef = useRef<SVGGElement | null>(null);
  const runId = useRef(0);

  const RM = useMemo(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  /* A single media query swaps the entire staging object. Because both are
     complete worlds, nothing else in the app knows which one is active. */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 880px)");
    const onChange = () => setL(mq.matches ? WIDE : TALL);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const [cx, cy, k] = L.shots[shot];
  const inv = 1 / k;
  /* CSS transforms on SVG need REAL UNITS. translate(28,-528) is valid SVG
     attribute syntax and invalid CSS — the whole declaration is dropped
     silently and every shot renders at 1x. */
  const cam = `translate(${L.w / 2 - cx * k}px,${L.h / 2 - cy * k}px) scale(${k})`;

  /* Zoom alone is not emphasis. */
  const near = (who: Who) =>
    shot === "wide" || shot === "net" ? ""
      : shot === "both" ? (who === "atk" ? " far" : " near")
      : shot === who ? " near"
      : " far";

  /* ---------------------------------------------------- the beat engine -- */
  useEffect(() => {
    const id = ++runId.current;
    const alive = () => id === runId.current;

    const show = (ids: string[]) => setVis(new Set(ids));
    /* A new dialogue box replaces any other dialogue box; captions stay. */
    const say = (patch: Calls) => setCalls((p) => {
      const opensNote = Object.keys(patch).some((key) => patch[key] && patch[key]!.kind !== "chip");
      const n: Calls = { ...p };
      if (opensNote) for (const key of Object.keys(n)) if (n[key] && n[key]!.kind !== "chip") n[key] = null;
      return Object.assign(n, patch);
    });
    const clearAll = () => setCalls({});
    const flowOn = (f: Flow[]) => setFlows(f);
    const flowOff = () => setFlows([]);
    const observe = async (ms: number) => { setSeen(true); await wait(ms); if (alive()) setSeen(false); };

    /* The packet walker. Imperative DOM nodes built from the same markup as
       the on-screen item, so the object in flight is visually identical to the
       object at rest. Outside React because it is transient and frame-driven. */
    const send = (pathId: string, kind: GlyphKind, tone: Tone, ms: number, back = false) =>
      new Promise<void>((done) => {
        const svg = svgRef.current, host = packRef.current;
        const path = svg?.querySelector<SVGPathElement>(`#${pathId}`);
        if (!svg || !host || !path) { done(); return; }
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-audit", "PACKET");
        g.innerHTML = packetMarkup(kind, tone);
        host.appendChild(g);

        if (RM) { g.remove(); done(); return; }

        const len = path.getTotalLength();
        const t0 = performance.now();
        const tick = (now: number) => {
          if (!alive()) { g.remove(); done(); return; }
          const u = Math.min(1, (now - t0) / ms);
          const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const p = path.getPointAtLength((back ? 1 - e : e) * len);
          const fade = u < 0.12 ? u / 0.12 : u > 0.9 ? (1 - u) / 0.1 : 1;
          g.setAttribute("transform", `translate(${p.x},${p.y})`);
          g.setAttribute("opacity", String(fade));
          if (u < 1) requestAnimationFrame(tick);
          else { g.remove(); done(); }
        };
        requestAnimationFrame(tick);
      });

    /* Reduced motion: apply the exact end state of the beat and stop. */
    if (RM) {
      setShot(step === 1 ? "wide" : step === 5 ? "both" : "both");
      show(RESTING[step]);
      setCalls(RESTING_CALLS(L)[step]);
      setFlows([]);
      return () => { runId.current++; };
    }

    const A = L.an;

    const run = async () => {
      flowOff(); setSeen(false);

      /* ------------------------------------------------------- 1 SETUP -- */
      if (step === 1) {
        setShot("wide"); show([]); clearAll();
        await wait(700); if (!alive()) return;
        say({ cNet: { kind: "chip", text: "open café wi-fi", to: A.router } });
        await wait(1000); if (!alive()) return;
        say({ d: { kind: "note", tag: "MAYA", tone: "you", to: A.youScreen,
                   text: "Leo and I have never met." } });
        await wait(2000); if (!alive()) return;
        setShot("net"); show(["you.setup", "fr.setup"]);
        say({ d: null, cYou: { kind: "chip", text: "public value", to: A.youScreen } });
        await wait(1900); if (!alive()) return;
        setShot("atk"); say({ cYou: null, cNet: null });
        await wait(560); if (!alive()) return;
        say({ d: { kind: "note", tag: "EVAN", tone: "danger", to: A.atkScreen,
                   text: "Same network. I see everything." } });
        await wait(2100); if (!alive()) return;
        setShot("wide");
        return;
      }

      /* -------------------------------------------------------- 2 KEEP -- */
      if (step === 2) {
        setShot("you"); show(["you.setup", "fr.setup"]); clearAll();
        await wait(760); if (!alive()) return;
        show(["you.setup", "you.lock", "fr.setup"]);
        say({ d: { kind: "note", tag: "MAYA", tone: "you", to: A.youScreen,
                   text: "My number stays on my table." } });
        await wait(1400); if (!alive()) return;
        setShot("fr");
        await wait(560); if (!alive()) return;
        show(["you.setup", "you.lock", "fr.setup", "fr.lock"]);
        say({ d: { kind: "note", tag: "LEO", tone: "fr", to: A.frScreen,
                   text: "Mine never leaves either." } });
        await wait(1500); if (!alive()) return;
        setShot("both");
        say({ d: null, cMid: { kind: "chip", text: "nothing has crossed", to: A.mid } });
        await wait(900); if (!alive()) return;
        setShot("wide");
        return;
      }

      /* ------------------------------------------------------- 3 SHARE -- */
      if (step === 3) {
        setShot("both");
        show(["you.setup", "you.lock", "fr.setup", "fr.lock"]); clearAll();
        await wait(520); if (!alive()) return;
        show(["you.lock", "you.pubYou", "fr.lock", "fr.pubFr"]);
        say({ d: { kind: "note", tag: "MAYA", tone: "you", to: A.youScreen,
                   text: "Safe to send. Runs one way only." } });
        await wait(1100); if (!alive()) return;
        setShot("net"); say({ d: null });
        await wait(420); if (!alive()) return;

        flowOn([["main", "you", 1]]);
        await send("p-main", "packet", "you", 1500); if (!alive()) return;
        flowOff();
        show(["you.lock", "you.pubYou", "fr.lock", "fr.pubYou"]);
        await wait(320); if (!alive()) return;

        flowOn([["main", "fr", -1]]);
        await send("p-main", "packet", "fr", 1500, true); if (!alive()) return;
        flowOff();
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou"]);
        await wait(320); if (!alive()) return;

        setShot("atk");
        await wait(400); if (!alive()) return;
        observe(1400);
        send("p-netAtk", "packet", "you", 700);
        await wait(260); if (!alive()) return;
        await send("p-netAtk", "packet", "fr", 700); if (!alive()) return;
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"]);
        await wait(340); if (!alive()) return;
        say({ d: { kind: "note", tag: "EVAN", tone: "danger", to: A.atkScreen,
                   text: "Two public values. Useless alone." } });
        await wait(1200); if (!alive()) return;
        setShot("wide");
        return;
      }

      /* ----------------------------------------------------- 4 COMBINE -- */
      if (step === 4) {
        setShot("you");
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"]);
        clearAll();
        await wait(600); if (!alive()) return;
        say({ d: { kind: "note", tag: "MAYA", tone: "you", to: A.youScreen,
                   text: "What I kept, plus what Leo sent." } });
        await wait(1300); if (!alive()) return;
        show(["you.key", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"]);
        await wait(1200); if (!alive()) return;
        setShot("fr"); say({ d: null });
        await wait(560); if (!alive()) return;
        say({ d: { kind: "note", tag: "LEO", tone: "fr", to: A.frScreen,
                   text: "What I kept, plus what Maya sent." } });
        await wait(1300); if (!alive()) return;
        show(["you.key", "fr.key", "atk.pubYou", "atk.pubFr"]);
        await wait(900); if (!alive()) return;
        setShot("both"); say({ d: null });
        await wait(620); if (!alive()) return;
        say({ d: { kind: "note", tag: "MAYA", tone: "key", to: A.youScreen,
                   text: "Same key. Neither of us sent it." } });
        await wait(1500); if (!alive()) return;
        setShot("wide");
        return;
      }

      /* -------------------------------------------------------- 5 SEND -- */
      /* The message and the ciphertext are full-width items, so each one takes
         a screen alone — the key made its point in step 4, and repeating it
         beside them would push the ciphertext past the glass. */
      setShot("you");
      show(["you.key", "fr.key"]); clearAll();
      await wait(600); if (!alive()) return;
      show(["you.msg"]);
      say({ d: { kind: "note", tag: "MAYA", tone: "you", to: A.youScreen,
                 text: "Readable here, on my screen." } });
      await wait(1400); if (!alive()) return;
      show(["you.cipher"]);
      say({ d: { kind: "note", tag: "MAYA", tone: "key", to: A.youScreen,
                 text: "Locked before it moves." } });
      await wait(1400); if (!alive()) return;

      setShot("net"); say({ d: null });
      await wait(420); if (!alive()) return;
      flowOn([["main", "key", 1]]);
      observe(1500);
      send("p-netAtk", "cipher", "key", 900);
      await send("p-main", "cipher", "key", 1500); if (!alive()) return;
      flowOff();
      show(["you.cipher", "fr.cipher", "atk.cipher"]);
      say({ cAtk: { kind: "chip", text: "still scrambled", to: A.atkScreen } });
      await wait(900); if (!alive()) return;

      setShot("fr"); say({ cAtk: null });
      await wait(560); if (!alive()) return;
      show(["you.cipher", "fr.msg", "atk.cipher"]);
      say({ d: { kind: "note", tag: "LEO", tone: "fr", to: A.frScreen,
                 text: "Dinner at 8. Read only here." } });
      await wait(1500); if (!alive()) return;
      setShot("both");
    };

    run();
    /* Unmount, step change or staging change invalidates the timeline. */
    return () => { runId.current++; };
  }, [step, L, nonce, RM]);

  const dlg = calls.d;
  const chips = Object.keys(calls).filter((c) => c !== "d" && calls[c]);
  const who: Who = dlg ? (dlg.tag === "LEO" ? "fr" : dlg.tag === "EVAN" ? "atk" : "you") : "you";

  return (
    <div className="page">
      <header className="head">
        <span className="eyebrow">Diffie–Hellman · one scene, one camera</span>
        <h1 className="h1">{TITLES[step]}</h1>
        <div className="pips" role="list">
          {BEATS.map((b, i) => (
            <button key={b} className="pip" role="listitem"
                    data-on={i + 1 === step ? "now" : i + 1 < step ? "done" : "next"}
                    onClick={() => setStep((i + 1) as Step)}>
              <span className="dot" /><span className="lbl">{b}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="stage" style={{ ["--ar" as any]: String(L.w / L.h) }}>
        <svg ref={svgRef} viewBox={`0 0 ${L.w} ${L.h}`} role="img"
             aria-label={TITLES[step]}>
          <defs>
            <pattern id="tiles" width="56" height="28" patternUnits="userSpaceOnUse">
              <path className="tile" d="M28 0 L56 14 L28 28 L0 14 Z" />
            </pattern>
            {(["you", "fr", "key", "danger"] as Tone[]).map((t) => (
              <marker key={t} id={`arw-${t}`} viewBox="0 0 10 10" refX="7.5" refY="5"
                      markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path className={`arw arw-${t}`} d="M0.5 1 L9 5 L0.5 9 Z" />
              </marker>
            ))}
          </defs>

          <g className="cam" style={{ transform: cam }}>
            <Dressing L={L} />

            {/* infrastructure: the network exists whether or not it is in use */}
            <path className="link" d={L.paths.netYou} />
            <path className="link" d={L.paths.netFr} />
            <path className="link" d={L.paths.netAtk} />

            {/* invisible rails the packet walker samples */}
            <path id="p-main"   className="ghostpath" d={L.paths.main} />
            <path id="p-netAtk" className="ghostpath" d={L.paths.netAtk} />

            {flows.map(([p, tone, dir], i) => (
              <path key={i} className={`flow tone-${tone} ${dir === 1 ? "fwd" : "rev"}`}
                    d={L.paths[p]}
                    markerEnd={dir === 1 ? `url(#arw-${tone})` : undefined}
                    markerStart={dir === -1 ? `url(#arw-${tone})` : undefined} />
            ))}

            {seen && <path className="sight" d={L.sight} data-audit="SIGHT" />}

            <Router x={L.router.x} y={L.router.y} live={flows.length > 0} />

            <Patron spot={L.atk} hue="var(--danger)" name="EVAN" inv={inv}
                    cls={near("atk")}
                    hair={
                      <><g fill="#3b2b1c">
                        <path d="M-21 -97 a21 21 0 0 1 42 0 Z" />
                        <path d="M-25 -96 h50 a3.5 3.5 0 0 1 0 6 h-50 a3.5 3.5 0 0 1 0 -6 Z" />
                      </g></>
                    }
                    screen={<Screen who="atk" vis={vis} />}
                    extra={
                      <g className={"eye" + (seen ? " on" : "")} transform="translate(0,-130)">
                        <g className="hold" style={{ transform: `scale(${inv / L.atk.s})` }}>
                          <path className="f-danger"
                                d="M-13 0 C -8 -8, 8 -8, 13 0 C 8 8, -8 8, -13 0 Z" />
                          <circle className="ink" cx="0" cy="0" r="3.1" />
                        </g>
                      </g>
                    } />

            <Patron spot={L.you} hue="var(--you)" name="MAYA" inv={inv}
                    cls={near("you")}
                    hair={
                      <><g fill="#3b2b1c">
                        <ellipse cx="-19" cy="-84" rx="7.5" ry="12" transform="rotate(-14 -19 -84)" />
                        <ellipse cx="19"  cy="-84" rx="7.5" ry="12" transform="rotate(14 19 -84)" />
                        <path d="M-21 -96 a21 21 0 0 1 42 0 Z" />
                      </g></>
                    }
                    screen={<Screen who="you" vis={vis} />} />

            <Patron spot={L.fr} hue="var(--fr)" name="LEO" inv={inv}
                    cls={near("fr")}
                    hair={
                      <><g fill="#3b2b1c">
                        <path d="M-21 -96 a21 21 0 0 1 42 0 C 12 -101, -12 -101, -21 -96 Z" />
                      </g></>
                    }
                    screen={<Screen who="fr" vis={vis} />} />

            {/* packets in flight live here: inside the camera, above the cast */}
            <g className="packets" ref={packRef} />

            {chips.map((slot) => (
              <Callout key={slot} def={calls[slot]!} at={L.ch[slot]} inv={inv} narrow={L.tall} />
            ))}
            {dlg && <Callout def={dlg} at={L.co[who]} inv={inv} narrow={L.tall} />}
          </g>
        </svg>
      </div>

      <div className="read">
        <p className="q">{QUESTIONS[step]}</p>
        <p className="a">{ANSWERS[step]}</p>
      </div>

      <StepControls step={step} set={setStep} replay={() => setNonce((n) => n + 1)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
