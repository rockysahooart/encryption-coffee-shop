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
type Shot = "wide" | "you" | "fr" | "both" | "net" | "atk" | "msg" | "tap";
type Tone = "you" | "fr" | "key" | "priv" | "danger" | "neutral";
type GlyphKind = "setup" | "lock" | "packet" | "key" | "msg" | "cipher";
type Who = "you" | "fr" | "atk";

interface Spot { x: number; y: number; s: number }

interface CalloutDef {
  kind: "note" | "chip" | "wire";
  /* "wire" only: the intercepted payload, drawn as text on a panel */
  lines?: string[];
  foot?: string;
  tag?: string;
  text: string;
  tone?: Tone;
}

type Calls = Record<string, CalloutDef | null>;
type Flow = [string, Tone, 1 | -1];
/* What a laptop lid is currently saying about itself. */
type Lit = "pub" | "priv" | "key";
/* The camera's tempo. Quick enough that the viewer arrives at the teaching
   point rather than watching the trip. */
const CAM_MS = 1050;

interface Layout {
  tall: boolean;
  w: number; h: number;
  you: Spot; fr: Spot; atk: Spot;
  router: { x: number; y: number };
  sight: string;
  paths: Record<string, string>;
  shots: Record<Shot, [number, number, number]>;
  co: Record<string, [number, number]>;
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
  /* Everything sits on a 20-unit grid. Three columns (180 / 500 / 820) and
     four rows (router 120, bus 280, station 440, table 540), so the picture
     reads as a diagram of a network rather than a scattering of furniture. */
  you: { x: 180, y: 540, s: 1 },
  fr:  { x: 820, y: 540, s: 1 },
  atk: { x: 500, y: 400, s: 0.78 },
  router: { x: 500, y: 120 },
  /* Right angles only. The observer looks straight up his own drop line. */
  sight: "M500 274 V176",
  paths: {
    main:   "M180 440 V280 H820 V440",
    netYou: "M500 150 V280 H180 V440",
    netFr:  "M500 150 V280 H820 V440",
    netAtk: "M500 150 V360",
  },
  shots: {
    /* Establishing, medium, close-up — with real distance between them, so a
       cut registers as a change of attention rather than a nudge. */
    wide: [500, 350, 1.00],
    you:  [240, 500, 1.85],
    fr:   [760, 500, 1.85],
    both: [500, 460, 1.28],
    net:  [500, 340, 1.04],
    atk:  [500, 320, 1.60],
    /* The two tightest shots in the piece: the message itself, and the
       moment somebody else takes hold of it. */
    msg:  [180, 450, 3.10],
    tap:  [500, 330, 1.90],
  },
  /* Authored, not computed. Each anchor satisfies three constraints: inside
     every shot frame it appears in, clear of the wires, and clear of its own
     speaker's head and nameplate. */
  co: { you: [392, 494], fr: [608, 494], atk: [700, 364], net: [258, 224] },
  /* cNet names the router and only ever appears in a frame that contains the
     wall; cMid speaks about the space between the two tables, so it needs a
     slot that survives the two-shot. */
  ch: { cYou: [180, 360], cFr: [820, 360], cNet: [676, 208], cMid: [500, 630],
        cAtk: [672, 324], cMsg: [180, 366], cMsgFr: [820, 372], cTap: [644, 248] },
  an: {
    youScreen: [180, 494], frScreen: [820, 494], atkScreen: [500, 364],
    router:    [500, 120], mid:      [500, 280],
  },
};

const TALL: Layout = {
  tall: true,
  w: 560, h: 880,
  /* The same grid turned on its side: one column of people at x=160, one
     network spine at x=420, rows at 140 / 300 / 470 / 780. The gap between
     the two people is sized to hold a caption without touching either. */
  you: { x: 160, y: 470, s: 0.72 },
  fr:  { x: 160, y: 780, s: 0.72 },
  atk: { x: 420, y: 300, s: 0.55 },
  router: { x: 420, y: 170 },
  sight: "M420 238 V208",
  paths: {
    main:   "M200 430 H420 V740 H200",
    netYou: "M420 198 V430 H200",
    netFr:  "M420 198 V740 H200",
    netAtk: "M420 198 V272",
  },
  /* A phone is not a small desktop. Establishing stays loose enough to place
     the room; every other shot pushes in, so mobile reads as a sequence of
     close-ups rather than one diagram viewed from too far away. */
  shots: {
    wide: [290, 450, 1.02],
    you:  [200, 460, 1.90],
    fr:   [200, 770, 1.90],
    both: [200, 620, 1.42],
    net:  [290, 470, 1.10],
    atk:  [400, 270, 2.10],
    msg:  [175, 400, 2.90],
    tap:  [400, 300, 1.90],
  },
  /* One caption slot lives in the gap between the two people; it survives
     every shot either of them appears in. */
  co: { you: [200, 610], fr: [200, 610], atk: [400, 420], net: [240, 250] },
  ch: { cYou: [300, 400], cFr: [300, 710], cNet: [280, 210], cMid: [300, 600],
        cAtk: [280, 340], cMsg: [175, 312], cMsgFr: [175, 640], cTap: [380, 428] },
  an: {
    youScreen: [160, 437], frScreen: [160, 747], atkScreen: [420, 275],
    router:    [420, 170], mid:      [420, 585],
  },
};

/* ============================================================= 3. COPY === */
/* Every word in one place. Roughly 75/25 visual to verbal — fewer words than
   this and the viewer has to infer; more and they stop watching.            */

/* Three chapters, not five clicks. Inside a chapter the beats chain
   automatically — camera move, focus shift, action, reaction, result, pause —
   and the viewer only acts at a chapter boundary. */
/* One question per chapter. The title is the question; the chapter answers it. */
const ACTS: { label: string; title: string; beats: Step[] }[] = [
  { label: "Setup",    beats: [1, 2], title: "What stays private?" },
  { label: "Exchange", beats: [3, 4], title: "What can safely travel?" },
  { label: "Send",     beats: [5],    title: "What happens to the message?" },
];

/* The narrator layer. A term only appears once the viewer has just watched the
   thing it names, and it never arrives alone — the plain line under it is what
   makes it usable rather than decorative. */
interface Line { t?: string; s: string }
const NOTE: Record<string, Line> = {
  wifi:     { s: "Three people, one café, one open Wi-Fi network." },
  router:   { s: "Everything anyone sends here passes through this router." },
  pickMaya: { s: "Maya needs a private number. Choose one for her." },
  pickLeo:  { s: "Leo needs his own. Choose a different one." },
  oneway:   { t: "One-way math",
              s: "Easy to calculate forward. Hard to reverse." },
  leoToo:   { s: "Leo runs the same calculation on his own private number." },
  swapped:  { s: "Each of them now holds the other\u2019s public value." },
  tally:    { s: "Two machines, the same secret. One observer, without it." },
  pickMsg:  { s: "Now the secret has a job. Choose what Maya sends." },
  threeWays:{ s: "The same traffic crossed the same network." },
  close:    { s: "Maya and Leo created the same shared secret without ever sending it. Evan saw what crossed the Wi-Fi and still could not read the conversation." },

  plainDemo:{ s: "Maya sends a plain note across it, with no protection." },
  plainSeen:{ s: "Evan reads the same words off the wire." },
  neither:  { s: "The wire lights up, and neither number goes down it." },
  staysGoes:{ s: "One value stays on the laptop. Only the other one travels." },
  evanTry:  { s: "He has both public values, and tries to work backwards." },
  same:     { t: "Public starting value",
              s: "Both laptops begin from the same number. It was never secret." },
  evanNet:  { s: "Evan is on the same network, so he starts from it too." },
  keepMaya: { t: "Private value", s: "It lands on her laptop and stays there." },
  keepLeo:  { t: "Private value", s: "A different number, and it stays put too." },
  nothing:  { s: "Nothing has crossed the network yet." },

  made:     { t: "Public value", s: "Out comes a new number, and this one is safe to send." },
  travel:   { s: "Maya’s public value crosses the Wi-Fi to Leo." },
  land:     { s: "Leo’s laptop takes it in." },
  back:     { s: "Leo’s public value makes the same trip the other way." },
  evanSees: { s: "Evan reads both public values off the network." },
  evanNot:  { s: "The public values do not point back to one private number. Nothing narrows down." },
  mixMaya:  { s: "Maya combines Leo’s public value with her own private value." },
  mixLeo:   { s: "Leo combines Maya’s public value with his own private value." },
  sameKey:  { t: "Shared secret",
              s: "The same number on both machines — and it never crossed the network." },
  named:    { t: "Diffie\u2013Hellman key exchange",
              s: "That is the method you just watched, and it is the reason the secret never had to travel." },
  evanNo:   { s: "Evan saw every message and still cannot produce it." },
  write:    { s: "Maya writes the message she actually wants to send." },
  sym:      { t: "Symmetric encryption",
              s: "Now the shared secret does a second job: it scrambles the message." },
  scram:    { s: "The text stops being text." },
  lock:     { s: "It is protected before it leaves the device." },

  notice:   { s: "Evan notices the packet crossing the wire." },
  tapped:   { s: "He takes hold of it. This is the whole question." },
  evanMeh:  { s: "Seeing a transmission is not the same as understanding it." },
  open:     { s: "Leo has the same secret, so the words come back." },
};

/* What each card says. Kept apart from the beats so the whole script can be
   read as a script — one or two plain sentences, each with a job. */
const SAY = {
  router:   "Everyone on this Wi-Fi can read what crosses it. That is normal, and it is the problem.",
  evanHere: "Evan is on the same network. He can see the starting value — it was never secret.",
  mayaKeep: "This number stays on my laptop. It never crosses the Wi-Fi.",
  leoKeep:  "Mine is a different number, and it stays on my laptop too.",
  mayaMake: "I combine my private value with the public starting value using one-way math. The result is safe to share.",
  leoMake:  "Same calculation, my own private number, a different result.",
  evanPlain: "I did not break into her laptop. I read what she sent across the shared network.",
  evanOpen: "Evan can read everything sent openly across the Wi-Fi. Seeing public values is expected.",
  evanLack: "I have both public values. They are not enough to work out the private numbers behind them.",
  mayaMix:  "Now I run Leo’s public value through it, with my private number.",
  leoMix:   "And I run Maya’s public value through it, with mine.",
  evanNo:   "Evan never had a private number, so he cannot reach the same result.",
  mayaMsg:  "Meet me outside at 5.",
  mayaEnc:  "I scramble it with the secret Leo and I both worked out, before it leaves my laptop.",
  evanTap:  "I can intercept the transmission, but I cannot read it.",
  evanUseless: "Without the shared secret, this is useless to me.",
  leoOpen:  "The same secret runs the process backwards.",
};

/* The message, and the two steps between readable and unreadable. Shown as
   actual characters so the viewer watches language stop being language. */
/* The viewer picks one. Each cipher matches its plaintext line for line and
   character for character, so the scramble can walk one glyph at a time and
   every letter has somewhere to land. */
const MSGS = [
  { plain: ["Meet me", "outside at 5"],   enc: ["8X#q2Lm", "!4KzR7pQv9x2"] },
  { plain: ["The keys are", "under the mat"], enc: ["7#zP1qR4m@Xv", "k9!Xv2ZtQ0b3R"] },
  { plain: ["Deal closes", "on Friday"],  enc: ["V3#x9Kq2rZm", "!8mPw4Lcq"] },
];
/* Every cipher has to match its plaintext line for line and character for
   character, or the walk runs off the end of the string and the message
   renders half-turned and short. Checked here so it cannot regress. */
MSGS.forEach((m) => m.plain.forEach((ln, i) => {
  if (ln.length !== m.enc[i].length)
    throw new Error(`cipher length mismatch: "${ln}" vs "${m.enc[i]}"`);
}));
const WIRE = MSGS[0];

const CLOSER = "Maya and Leo have never met. They are strangers on the same café Wi-Fi, and so is Evan, who can read everything that crosses it. Both laptops start from the same public number. Each of them then picks a private number and keeps it — those two numbers never leave the machines they were chosen on. Each feeds their private number and the public one through a calculation that is quick to run forwards and impractical to run backwards, and sends only the result. Evan sees both results. He cannot work back from them to either private number, so when Maya combines Leo\u2019s result with her private number, and Leo combines Maya\u2019s with his, they land on the same secret that was never sent. Maya scrambles her message with it before it leaves her laptop. Evan reads the packet off the wire and gets nothing but characters; Leo, holding the same secret, gets the sentence back.";

/* ==================================================== 4. SCENE PARTS ===== */

const Cup = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse className="paper" cx="0" cy="0" rx="10.5" ry="8" />
    <ellipse className="ln" cx="0" cy="0" rx="10.5" ry="8" />
    <ellipse className="furn-2" cx="0" cy="0" rx="6.5" ry="4.6" />
    <path className="ln-thin" d="M10.5 -1 a5 4 0 0 1 0 3" />
  </g>
);

/* What each item is called. Only the persistent state label under a person
   uses these now — the screens themselves carry no microcopy. */
const ITEM_LABEL: Record<GlyphKind, string> = {
  setup: "Starting value", lock: "Private value", packet: "Public value",
  key: "Shared secret", msg: "Message", cipher: "Encrypted",
};

/* ------------------------------------------------------------------------
   CHARACTER SPRITES
   Head-and-shoulders crops of the cast, keyed out and quantised. They drop
   into exactly the box the old vector head and torso occupied — x -44..44,
   y -133..-28 — so no coordinate, label, ring or network line moves. The
   laptop is still drawn after them, so it stays the foreground object and
   the figure reads as seated behind it.
   ------------------------------------------------------------------------ */
const SPRITE: Record<Who, string> = {
  you: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAElCAMAAACWK11EAAAAqFBMVEXy1a9dIx6bKR338OHTsZyhaF7gTiDHbkSxm5KiTizhmF0pICVjWFTxlzLdOh+th3f9zXBxRC1aPESGOEU0Nkc4QzinfYH+wTkAAAAOCQsrGBjLc0JJKCMaERTVOyE6IiGPFxbFazuxJRr76czlSCTQNh05IB7aQiRvNSXwVCd0FBVMJBuTRSnKcT2uWDK6ZTlNFxSHOiWmHBcsCgrIqJbFLBtsDA9tKRpakpYYAAAAOHRSTlP///////////////////////////////8A//////////////////////////////////////////Wap1EAADdmSURBVHja1Z2JYtrI0qiR2AzYOJ5zzn8jgZDAIBTEIpAx7/9mt7beJIFx4mRmeiaO9+ijlq6urq5uff+bR17keT5NwzSMf+n3tP52kBBA8hBAwn83CCCkBYCE/3KQvAhTkAioVvxrJH8zSO55UzPifylIDs+eT22QX9CvPwgCTwoWDS5qKtaB7qoGMgqj6J8PkofpVIOUCDKtgoRh8I+XCJg0+qg8FYngDKJQYnr7rwDJPDKJFB9ZJDKtDAQNR1HwjwbJthkOL03jmNxTEBJIntKIcRBIHAXBPxgkvxAHaA+BkA5NkQBEFAMHk7Bq/ZNBwBhYIPjwMdtCCOLAuZBx0ioIfPhPlEhBIB6qFjxzGBFIjj4MxaG0ywYJ1fjHgXiEAooEEglCYJmS00IAVC0Qy78CpECn5XkIEsZKtcjxsp1rzfqHg1CcDn84zk2ZQXmsVBCQIQiiKApp+uTvuNNU/hwITYbp1BZGip8CnQodEHovFhBy0X8rSM5Lv9ABiesgrFSpAYnMd6QCco+C/UaQvApCc6F+zJgeMI1jFyQyILlo4N8NUhQQ34bWQjA1qkVPP2U4x87RQCD+hWkfNO4fIZGLvJiKg1aBqbz0KlJEA4mvq9b0HyCRPKMgcZqyK51SggEfld7NMglY8ClFHCgG7dEknkwpxOT55W8BgSchjhhA8BkpGEkZBHVGQLTeEAj4qzRWAKJU7J7/PonEIYOgREDrg9SWCFpKEwhJBL9ombmZZf4eEPiHBWRKILGjWggCc7xSLcZgieC6S08f+EUSyT8HZNoAMnUkAt+EIClLZGqDhH8viEev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",
  fr: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAECCAMAAACMgmjKAAAAqFBMVEXVZC6gUCnw06rtmVBXLR/Or5YqHyL48d5hW1/tmi+nmZEpXJdvRy6RdGMbMlijiXOWNx3heET7yWssSXJTb49th6AGPIShydm2hDdEPEFyyOZ8qsk4gruNtM54g3j/wjmQf4CvwLcAAAAJBwolWZj758kwGRX8q2pOJxtsNiP9s3EpYqQWExYVOGwNFysZSYgxJyklXaFVLCEQKE8aQnkcU5X2l1b6pzOAaKsuAAAAOHRSTlP/////////////////////////////////////////////AP///////////////////////////24PXI0AAC5cSURBVHja7Z0Le9pKsq4REm1AF0xwsldmz545J8JCgBA3gf//Pzv1VfVNIN9i7Kw5z+61ktgJYL2qa1dXt3q//uQoy5t9VO9/Qf4XxI3o8P8HyHK5/FuDvOE2l2WwBMbfWiJR+armF2WZLHn8zUFee0lRRMu/P8gbPFEZlctlkiTLv7NqLQ9vMXIeSVkUf08QVpaiW0wylsvosLTjPxEkMiCH/wSQiGy4+9qiqIjKqNAw/xEgL6tWRDgCEf2NQfgCO68tCO7x/33ghFGWh0N+wx/euyUEg7irO0QHGQRBFPSP9/8BIFF0CXI4GIW6vwcIUbQlUub53w8kugYpy5dBSgLJteGQV7v6wLJ8T5Z/I5DIKE3igViJBHZcSiQvIhmX16zf+cUgfKlyu5NCFb7VeAyBgT3Q/S/04NDCHrkrJBVfDoJrTLRq5Yr/7gpkaTlIGsSQc1jht8krrhygfNIXghQMIpeqcmg+3U62magDJNIgJA768mBxl5E1NP1CVXw5yNKCFLkx4edASgdiAn03SKG+XiLJNUj5HAgFlmVEGIokUhQORJt95IWkL5dIsXQ2om/1wbMRc2WB87w6YaGJiSW9d+/QIF8eR2TGJwmu05lDeYi0IhlNc6/wNOjey1w87VPvi5a3k0i0vAAhez9IiaHlsOQVlL4QGxQJ0bIL5J1R/2YgkQ9yEBCyhuhiKmVRI/nrCBL5oyB0kbaaQyCRBmF3FGkQbQZlF4gOIdC4TtUqvgrETyGMakECuE5hQNkKkiLVijpAiBxWjcQ4uL8C+bKkMfB+oDEK8UTla6MdQoy7lVz5oK3o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",
  atk: "data:image/png;base64,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",
};

/* Character rig. Local coordinates, origin = table centre.
   Depth is the point of this arrangement: the figure is drawn first and sits
   higher, the table and then the laptop are drawn over it, so the machine
   reads as an object on the table between the viewer and the person. Head and
   shoulders clear the lid; everything below the collarbone is behind it. */
/* Evan working backwards. Candidate private values cycle and none of them
   resolves: the failure is the teaching point, so it is drawn rather than
   asserted. */
const Guessing = ({ inv, s, pub, start }: {
  inv: number; s: number; pub: string; start: string;
}) => (
  <g className="guess" transform="translate(0,-104)">
    <g className="hold" style={{ transform: `scale(${inv / s})` }}>
      <rect className="paper" x="-62" y="-30" width="124" height="52" rx="8" />
      <rect fill="none" stroke="var(--danger)" strokeWidth="1" opacity=".7"
            x="-62" y="-30" width="124" height="52" rx="8" />
      <text className="guess-cap" y="-16">{pub} came from {start} and\u00a0?</text>
      {[-42, -21, 0, 21, 42].map((x, i) => (
        <text key={x} className="guess-n" x={x} y="10"
              style={{ animationDelay: `${i * 160}ms` }}>{["3", "9", "14", "?", "?"][i]}</text>
      ))}
    </g>
  </g>
);

/* The transformation, drawn as a transformation. Two inputs go in, a block
   that is cheap forwards and expensive backwards sits in the middle, and one
   new value comes out. Deliberately not an arithmetic sign: nothing here
   should read as a sum anyone could undo in their head. */
const Fn = ({ inA, inB, out }: { inA: string; inB: string; out: string }) => (
  <g className="fn">
    {/* Two values go in and one comes out. There is deliberately no operator
        between them: a plus sign would tell the viewer this is reversible by
        inspection, which is the opposite of what the next beat proves. The
        inputs are told apart the way they are everywhere else in the piece —
        the starting value is neutral, the private one is yellow. */}
    <text className="fn-in" x="-21" y="-17">{inA}</text>
    <text className="fn-in fn-priv" x="21" y="-17">{inB}</text>
    <path className="fn-arrow" d="M-19 -13 C -19 -9, -12 -9, -8 -7
                                  m0 0 -4 -1 m4 1 -1 -4" />
    <path className="fn-arrow" d="M19 -13 C 19 -9, 12 -9, 8 -7
                                  m0 0 -1 -4 m1 4 -4 -1" />
    <rect className="fn-box" x="-17" y="-6" width="34" height="15" rx="4" />
    <text className="fn-f" y="5">{"\u0192()"}</text>
    <path className="fn-arrow" d="M0 11 v7 m0 0 -3 -3 m3 3 3 -3" />
    <text className="fn-out" y="28">{out}</text>
  </g>
);

const Patron = ({
  spot, who, sprite, idle, name, state, inv, cls, screen, extra, lit, morphing, hostile,
}: {
  spot: Spot; who: string; sprite: string; idle: number; name: string; state: string;
  inv: number; cls: string; screen: React.ReactNode;
  extra?: React.ReactNode; lit?: Lit; morphing?: boolean; hostile?: boolean;
}) => (
  <g className={"actor " + who + " " + cls + (hostile ? " hostile" : "")}
     transform={`translate(${spot.x},${spot.y}) scale(${spot.s})`}>
    <ellipse className={"sh" + (hostile ? " sh-hostile" : "")}
             cx="0" cy="12" rx="99" ry="31" data-audit="SHADOW" />
    {/* The intruder is lit from below in his own colour: the room is the same
        room, but he is not sitting in it the way the other two are. */}
    {hostile && <ellipse className="underlight" cx="0" cy="-30" rx="70" ry="60" />}

    {/* Chair back. It sits behind the shoulders, not above the head: the
        sprite is shorter than the vector figure it replaced, so a chair at
        head height read as a rectangle floating in mid-air. */}
    <rect className="furn-2" x="-41" y="-106" width="82" height="44" rx="15" />
    <rect className="ln"     x="-41" y="-106" width="82" height="44" rx="15" data-audit="CHAIR" />
    <path className="ln-thin" d="M-31 -97 H31" opacity=".45" />
    <path className="ln-thin" d="M-31 -70 V-58 M31 -70 V-58" opacity=".5" />

    {/* The figure. One image, fitted into the old avatar's exact box and
        bottom-aligned, so silhouettes differ but the footprint does not. */}
    <g className="idle" style={{ animationDelay: `${idle}ms` }}>
      <image className={hostile ? "fig-hostile" : ""} href={sprite}
             x="-44" y="-142" width="88" height="105"
             preserveAspectRatio="xMidYMax meet" data-audit="BODY" />
    </g>

    <ellipse className="furn-2" cx="0" cy="7" rx="92" ry="34" />
    <ellipse className="furn"   cx="0" cy="0" rx="92" ry="34" />
    <ellipse className={"ln ring" + (hostile ? " ring-hostile" : "")}
             cx="0" cy="0" rx="92" ry="34" data-audit="TABLE" />
    <ellipse className="ln-thin" cx="0" cy="0" rx="83" ry="29" opacity=".35" />

    {/* The machine. A MacBook read in flat, hard-edged fills so it belongs to
        the same pixel world as the cast: graphite body, slim black bezel, a
        notch, a black screen, black keyboard, one big centred trackpad.
        Drawn over the person, so it stands between them and the viewer. */}
    <path className="mac-deck" d="M-52 -6 L52 -6 L68 11 L-68 11 Z" />
    <path className="mac-lip"  d="M-68 11 H68 L65 15 H-65 Z" />
    <path className="mac-hi"   d="M-52 -6 H52" />
    <path className="mac-well" d="M-43 -3 L43 -3 L51 5 L-51 5 Z" />
    <path className="mac-row"  d="M-41 -1 H41 M-44 1.6 H44 M-47 4.2 H47" />
    <path className="mac-grill" d="M-50 -3 L-48 -1 M-46 -3 L-44 -1
                                   M50 -3 L48 -1 M46 -3 L44 -1" />
    <path className="mac-pad"  d="M-18 6 L18 6 L20 9.6 L-20 9.6 Z" />
    <rect className="mac-hinge" x="-15" y="-7.6" width="30" height="2" rx="1" />

    <rect className={"mac-lid" + (lit ? " lit-" + lit : "")}
          x="-46" y="-76" width="92" height="70" rx="6" />
    <rect className={"ln lid" + (lit ? " lit-" + lit : "")}
          x="-46" y="-76" width="92" height="70" rx="6" data-audit="LAPTOP" />
    <rect className={hostile ? "mac-screen hostile" : "mac-screen"}
          x="-42" y="-72" width="84" height="56" rx="3" data-audit="GLASS" />
    <rect className="mac-lid" x="-6" y="-72.5" width="12" height="3.4" rx="1.7" />
    <path className="mac-glare" d="M-38 -20 L-24 -68 L-17 -68 L-31 -20 Z" />
    {hostile && <rect className="scanline" x="-42" y="-72" width="84" height="3" />}
    <g transform="translate(0,-44)">
      <g className={morphing ? "morphing" : ""}>{screen}</g>
    </g>

    {extra}

    {/* who this is, and what they are holding right now */}
    <g transform="translate(0,72)">
      <g className="hold" style={{ transform: `scale(${inv / spot.s})` }}>
        <text className="nameplate" y="0" data-audit="NAME">{name}</text>
        <text className={"statelabel" + (hostile ? " danger" : "")} y="17">{state}</text>
      </g>
    </g>
  </g>
);

const Router = ({ x, y, live, inv }: {
  x: number; y: number; live: boolean; inv: number;
}) => (
  <g className="router-g" transform={`translate(${x},${y})`}>
    {/* Named, because it is a character in this story: the thing everyone in
       the room is talking through. Above the box, clear of the drop line. */}
    <g transform="translate(0,-64)">
      <g className="hold" style={{ transform: `scale(${inv})` }}>
        <text className="nameplate" y="0" data-audit="NAME">Public Wi-Fi</text>
        <text className="statelabel" y="17">Everyone here is on this network</text>
      </g>
    </g>
    <ellipse className="sh" cx="0" cy="16" rx="36" ry="9" />
    {/* wall bracket */}
    <path className="ln-thin" d="M-8 12 V20 H8 V12" opacity=".6" />
    {/* antennas */}
    <path className="ln" d="M-16 -8 L-23 -30 M16 -8 L23 -30" />
    <circle className="ink" cx="-23" cy="-31" r="2" />
    <circle className="ink" cx="23"  cy="-31" r="2" />
    {/* body */}
    <rect className="furn-2" x="-28" y="-9" width="56" height="21" rx="7" />
    <rect className="ln"     x="-28" y="-9" width="56" height="21" rx="7" data-audit="ROUTER" />
    <path className="ln-thin" d="M-28 5 H28" opacity=".45" />
    {/* status lights: the middle one carries traffic */}
    <circle className={live ? "f-key glowed" : "f-neutral"} cx="0" cy="-2" r="3" />
    <circle className="ln-thin" cx="0" cy="-2" r="3" />
    <circle className="f-neutral" cx="-11" cy="-2" r="2.1" />
    <circle className="ln-thin"   cx="-11" cy="-2" r="2.1" />
    <circle className={live ? "f-key" : "f-neutral"} cx="11" cy="-2" r="2.1" opacity={live ? .7 : 1} />
    <circle className="ln-thin"   cx="11" cy="-2" r="2.1" />
    {/* the signal motif: this is the channel */}
    <g opacity={live ? 1 : 0.4} className={live ? "glowed" : ""}>
      <path className="bg-ln" d="M-36 -12 a22 22 0 0 1 0 -24" />
      <path className="bg-ln" d="M-46 -8 a32 32 0 0 1 0 -32" />
      <path className="bg-ln" d="M36 -12 a22 22 0 0 0 0 -24" />
      <path className="bg-ln" d="M46 -8 a32 32 0 0 0 0 -32" />
    </g>
  </g>
);

/* ============================================================== 4b. ROOM ===
   The café, drawn rather than rendered. Flat colour blocking, two or three
   tones per surface, no gradients, no bloom, no reflections. Everything in
   here exists to say "coffee shop, evening, shared network" in one glance and
   then get out of the way: the props sit at the perimeter, the middle of the
   floor is deliberately empty, and contrast drops with distance so the cast
   reads forward without a blur. Same line weights as the characters, because
   the background must not be more finished than they are.              */

const Room = ({ L }: { L: Layout }) => {
  const t = L.tall;
  const W = L.w, H = L.h;
  const horizon = t ? 200 : 210;        /* where the wall meets the floor */
  const vpx = W / 2, vpy = horizon - 54;

  /* floor: a few converging rays and a handful of courses, nothing more */
  const rays = [];
  for (let i = -5; i <= 5; i++)
    rays.push(`M${vpx} ${vpy} L${vpx + i * (t ? 170 : 240)} ${H + 300}`);
  const courses = [];
  for (let i = 1; i <= 6; i++) {
    const y = horizon + Math.pow(i, 2) * (t ? 11 : 9);
    if (y < H + 60) courses.push(`M${-300} ${y} H${W + 300}`);
  }

  /* Windows: one band, flat panes, a low skyline behind them in two tones.
     Clipped, because a city that spills onto the wall stops being a window. */
  const bandY = horizon - 150, bandH = 112;
  const panes: [number, number][] = t ? [[24, 200], [268, 250]]
                                      : [[120, 300], [560, 300]];
  return (
    <g className="room">
      <defs>
        {panes.map(([x, w], i) => (
          <clipPath key={i} id={`pane${i}`}>
            <rect x={x} y={bandY} width={w} height={bandH} />
          </clipPath>
        ))}
      </defs>

      {/* ground planes, bled past the frame so a pushed-in camera never finds
          the edge of the room */}
      <rect className="wall" x="-400" y="-400" width={W + 800} height={horizon + 400} />
      <rect className="floor" x="-400" y={horizon} width={W + 800} height={H + 700} />
      <g className="grid">
        {rays.map((d, i) => <path key={"r" + i} d={d} />)}
        {courses.map((d, i) => <path key={"c" + i} d={d} />)}
      </g>

      {/* the window band */}
      {panes.map(([x, w], i) => {
        const bars = Math.round(w / 100);
        const sky = [];
        for (let k = 0; k < Math.round(w / 34); k++) {
          const bw = 16 + ((k * 29) % 16);
          const bh = 26 + ((k * 47) % 52);
          sky.push(<rect key={k} className={k % 3 ? "city" : "city city-2"}
                         x={x + 4 + k * 34} y={bandY + bandH - bh - 18}
                         width={bw} height={bh} />);
        }
        return (
          <g key={i}>
            <rect className="glassplane" x={x} y={bandY} width={w} height={bandH} />
            <g clipPath={`url(#pane${i})`}>{sky}</g>
            <g className="paneline">
              <rect x={x} y={bandY} width={w} height={bandH} />
              {[...Array(bars - 1)].map((_, k) => (
                <path key={k} d={`M${x + ((k + 1) * w) / bars} ${bandY} v${bandH}`} />
              ))}
            </g>
          </g>
        );
      })}

      {/* the sill the router stands on, and the wall's shadow plane below it */}
      <rect className="sill" x="-400" y={horizon - 38} width={W + 800} height="9" />
      <rect className="walldark" x="-400" y={horizon - 29} width={W + 800} height="29" />

      {/* two flat pools of warm light on the floor — the only warmth here */}
      <path className="pool" d={`M${vpx - 250} ${horizon + 44} h96 l58 ${H - horizon}
                                 h-210 Z`} />
      <path className="pool" d={`M${vpx + 154} ${horizon + 44} h96 l56 ${H - horizon}
                                 h-208 Z`} />

      {/* counter: a top plane, a front plane, one edge */}
      <g transform={t ? `translate(${W - 90},${horizon + 300})` : `translate(66,${horizon + 120})`}>
        <ellipse className="contact" cx="0" cy="104" rx="118" ry="14" />
        <path className="prop-top"  d="M-116 -30 H116 L92 -14 H-92 Z" />
        <path className="prop-face" d="M-92 -14 H92 V104 H-92 Z" />
        <g className="prop-edge">
          <path d="M-92 -14 H92" />
          <path d="M-92 26 H92" opacity=".45" />
        </g>
      </g>

      {/* two stools along the window */}
      {(t ? [[96, 0], [188, 1]] : [[320, 0], [706, 1]]).map(([x, k]) => (
        <g key={k} transform={`translate(${x},${horizon + 20})`}>
          <ellipse className="contact" cx="0" cy="52" rx="26" ry="7" />
          <g className="prop-edge">
            <path d="M-9 2 -14 50 M9 2 14 50 M0 4 V50" />
          </g>
          <ellipse className="prop-top" cx="0" cy="0" rx="25" ry="8" />
          <ellipse className="prop-edge-e" cx="0" cy="0" rx="25" ry="8" />
        </g>
      ))}

      {/* one plant, one wall mark — the whole of the décor */}
      <g transform={t ? `translate(58,${horizon + 150})` : `translate(${W - 84},${horizon + 92})`}>
        <ellipse className="contact" cx="0" cy="46" rx="26" ry="7" />
        <path className="leaf" d="M0 2 C-24 -12, -28 -44, -7 -54 M0 2 C22 -14, 26 -42, 6 -50 M0 2 V-32" />
        <path className="prop-face" d="M-19 0 H19 L15 44 H-15 Z" />
        <path className="prop-top"  d="M-19 0 H19 L16 8 H-16 Z" />
      </g>
      <g className="mark" transform={`translate(${t ? 60 : W - 62},${bandY + 42})`}>
        <path d="M-15 -9 H11 V6 a8 8 0 0 1 -8 8 H-7 a8 8 0 0 1 -8 -8 Z" />
        <path d="M11 -3 h6 a6 6 0 0 1 0 12 h-6" />
        <path d="M-7 -18 v-7 M1 -18 v-10 M9 -18 v-7" />
      </g>
    </g>
  );
};

const Dressing = ({ L }: { L: Layout }) => <Room L={L} />;

/* ======================================================= 5. ITEM LAYER === */
/* The abstract concepts, drawn as objects in the same outline language as the
   furniture — so they belong to the world instead of floating above it.     */

const TONE_FILL: Record<Tone, string> = {
  you: "f-you-s", fr: "f-fr-s", key: "f-key-s", priv: "f-priv-s",
  danger: "f-danger", neutral: "f-neutral",
};
const TONE_SOLID: Record<Tone, string> = {
  you: "f-you", fr: "f-fr", key: "f-key", priv: "f-priv",
  danger: "f-danger", neutral: "f-neutral",
};

/* The message is drawn one character at a time, in a monospace face at a known
   advance, so any single glyph can be enlarged as it turns. A <tspan> cannot
   be transformed on its own; a <text> can. */
const Chars = ({ line, y, cls, hot, from }: {
  line: string; y: number; cls: string; hot: number; from: number;
}) => {
  const adv = 4.5;
  const x0 = 4 - ((line.length - 1) * adv) / 2;
  return (
    <>
      {line.split("").map((c, i) => (
        <text key={i} className={cls + " ch" + (from + i === hot ? " hot" : "")}
              x={x0 + i * adv} y={y}>{c}</text>
      ))}
    </>
  );
};

const Glyph = ({ kind, tone, wire, hot, token }: {
  kind: GlyphKind; tone: Tone; wire?: string[]; hot?: number; token?: string;
}) => {
  const soft = TONE_FILL[tone], solid = TONE_SOLID[tone];
  switch (kind) {
    case "setup":
      return (<g data-audit="GLYPH">
        <rect className="f-neutral" x="-12" y="-9" width="24" height="18" rx="4" />
        <rect className="ln" x="-12" y="-9" width="24" height="18" rx="4" />
        {token ? <text className="tok" y="3">{token}</text> : <>
          <circle className="ink" cx="-5" cy="0" r="1.7" />
          <circle className="ink" cx="0"  cy="0" r="1.7" />
          <circle className="ink" cx="5"  cy="0" r="1.7" />
        </>}
      </g>);
    case "lock":
      return (<g data-audit="GLYPH">
        <path className="ln" d="M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" />
        <rect className={soft} x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        <rect className={tone === "priv" ? "ln priv-ln" : "ln"}
              x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        {token
          ? <text className="tok tok-priv" y="2.6">{token}</text>
          : <circle className={tone === "priv" ? "f-priv" : "ink"} cx="0" cy="0" r="1.9" />}
      </g>);
    case "packet":
      return (<g data-audit="GLYPH">
        <rect className={soft} x="-15" y="-9.5" width="30" height="19" rx="3.5" />
        <rect className="ln"   x="-15" y="-9.5" width="30" height="19" rx="3.5" />
        {token ? <text className="tok" y="3.2">{token}</text>
               : <path className="ln" d="M-13 -6 L0 3 L13 -6" />}
      </g>);
    case "key":
      return (<g data-audit="GLYPH">
        <circle className="f-key" cx="-6" cy="0" r="7" />
        <circle className="ln"    cx="-6" cy="0" r="7" />
        {token ? <text className="tok tok-key" x="-6" y="2.8">{token}</text>
               : <circle className="glass" cx="-6" cy="0" r="2.4" />}
        <path className="ln" d="M1 0 H14 M11 0 V4.5 M7.5 0 V3.5" />
      </g>);
    case "msg": {
      const w = wire || WIRE.plain;
      return (<g data-audit="GLYPH">
        <rect className="f-neutral" x="-34" y="-14" width="68" height="28" rx="7" />
        <rect className="ln"        x="-34" y="-14" width="68" height="28" rx="7" />
        <path className="ln" d="M-20 14 L-16 17 L-12 14" />
        <rect className={solid} x="-30" y="-10" width="3" height="20" rx="1.5" />
        <Chars line={w[0]} y={-3} cls="wire" hot={hot ?? -1} from={0} />
        <Chars line={w[1]} y={8}  cls="wire" hot={hot ?? -1} from={w[0].length} />
      </g>);
    }
    case "cipher": {
      const w = wire || WIRE.enc;
      return (<g data-audit="GLYPH">
        <rect className="f-key-s" x="-34" y="-14" width="68" height="28" rx="7" />
        <rect className="ln"      x="-34" y="-14" width="68" height="28" rx="7" />
        <g transform="translate(-28,-7) scale(.4)">
          <path className="ln" d="M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" />
          <rect className="f-key" x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
          <rect className="ln"    x="-9.5" y="-7" width="19" height="14.5" rx="3.5" />
        </g>
        <Chars line={w[0]} y={-3} cls="cipher" hot={hot ?? -1} from={0} />
        <Chars line={w[1]} y={8}  cls="cipher" hot={hot ?? -1} from={w[0].length} />
      </g>);
    }
  }
};

/* ------------------------------------------------------------------------
   FLIGHT CARDS
   The line is only the route; the object on it has to say what it is. Every
   thing that crosses the room is a labelled card — icon, owner's colour, a
   name, and a second line saying where it came from or who can see it. It is
   authored in device units and counter-scaled by the walker, so it stays the
   same readable size whatever the camera is doing.
   ------------------------------------------------------------------------ */

interface Cargo { kind: GlyphKind; tone: Tone; label: string; sub?: string; mono?: boolean }

const ICO: Record<string, string> = {
  /* public: something leaving, on purpose */
  packet: '<path d="M3.5 9.5v4.2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9.5"/><path d="M8 2.2v8.4"/><path d="M5.2 5 8 2.2 10.8 5"/>',
  /* private-derived, locked */
  cipher: '<rect x="3.6" y="7.4" width="8.8" height="6.6" rx="1.6"/><path d="M5.6 7.4V5.6a2.4 2.4 0 0 1 4.8 0v1.8"/>',
  /* readable content */
  msg:    '<rect x="2.4" y="3.4" width="11.2" height="8" rx="2"/><path d="M5.6 11.4 5 14l3-2.6"/>',
  /* belongs to nobody */
  setup:  '<rect x="2.6" y="4.6" width="10.8" height="7.2" rx="1.8"/><circle cx="6" cy="8.2" r=".9"/><circle cx="8" cy="8.2" r=".9"/><circle cx="10" cy="8.2" r=".9"/>',
};

function cardMarkup(c: Cargo): string {
  const ico = ICO[c.kind] || ICO.packet;
  const wLabel = c.label.length * 7.0;
  const wSub = (c.sub ? c.sub.length * (c.mono ? 6.4 : 5.9) : 0);
  const w = Math.round(Math.max(146, Math.max(wLabel, wSub) + 66));
  const h = c.sub ? 48 : 36;
  const x = -w / 2, y = -h / 2;
  return `
    <rect class="fly-shade" x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="11"/>
    <rect class="fly-panel t-${c.tone}" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>
    <g class="fly-ico t-${c.tone}" transform="translate(${x + 14},${y + h / 2 - 8})">${ico}</g>
    <text class="fly-label" x="${x + 38}" y="${c.sub ? y + 20 : y + h / 2 + 4.5}">${c.label}</text>
    ${c.sub ? `<text class="fly-sub${c.mono ? " mono" : ""}" x="${x + 38}" y="${y + 35}">${c.sub}</text>` : ""}`;
}

/* Hard cap of two items per screen. When a third would be needed the story
   changes instead — something leaves. Which is also what actually happens. */
/* A token on each object, so "different value" is something the viewer can
   see rather than take on trust. The private values are plain numbers because
   the only thing that matters about them is that they differ; the public
   values are opaque, because working backwards from one is exactly what must
   look impossible. */
/* Real numbers, small enough to read on a laptop screen. g=5, p=23: forward
   is a single step, backwards is a search — which is the whole point, and the
   reason the public values must not look like arithmetic anyone can undo. */
const G = 5, P = 23;
const powmod = (b: number, e: number) => {
  let r = 1;
  for (let i = 0; i < e; i++) r = (r * b) % P;
  return r;
};
/* What each side is offered. Every one of the nine combinations gives six
   distinct numbers across the six roles — starting value, the two private
   numbers, the two public values and the shared secret — so no number on
   screen ever means two things at once. */
const PICKS = { you: [3, 7, 10], fr: [8, 13, 14] };

interface Vals { a: number; b: number }
const tokens = (v: Vals): Record<string, string> => {
  const A = powmod(G, v.a), B = powmod(G, v.b);
  const S = powmod(G, v.a * v.b);
  return {
    "you.setup": String(G), "fr.setup": String(G), "atk.setup": String(G),
    "you.lock": String(v.a), "fr.lock": String(v.b),
    "you.pubYou": String(A), "fr.pubFr": String(B),
    "fr.pubYou": String(A),  "you.pubFr": String(B),
    "atk.pubYou": String(A), "atk.pubFr": String(B),
    "you.key": String(S), "fr.key": String(S),
  };
};

const ITEM: Record<string, [GlyphKind, Tone]> = {
  "you.setup":  ["setup", "neutral"], "fr.setup":  ["setup", "neutral"],
  /* One idea, one colour: the private key is yellow on both machines. */
  "you.lock":   ["lock", "priv"],     "fr.lock":   ["lock", "priv"],
  "you.pubYou": ["packet", "you"],    "fr.pubFr":  ["packet", "fr"],
  "you.pubFr":  ["packet", "fr"],     "fr.pubYou": ["packet", "you"],
  "you.key":    ["key", "key"],       "fr.key":    ["key", "key"],
  "you.msg":    ["msg", "you"],       "fr.msg":    ["msg", "you"],
  "you.cipher": ["cipher", "key"],    "fr.cipher": ["cipher", "key"],
  "atk.setup":  ["setup", "neutral"],
  "atk.pubYou": ["packet", "you"],    "atk.pubFr": ["packet", "fr"],
  "atk.cipher": ["cipher", "key"],
};

const ORDER: Record<Who, string[]> = {
  you: ["you.setup", "you.lock", "you.pubYou", "you.pubFr", "you.key", "you.msg", "you.cipher"],
  fr:  ["fr.setup", "fr.lock", "fr.pubFr", "fr.pubYou", "fr.key", "fr.cipher", "fr.msg"],
  atk: ["atk.setup", "atk.pubYou", "atk.pubFr", "atk.cipher"],
};

const Screen = ({ who, vis, wire, focus, hot, mix, tok, fn }: {
  who: Who; vis: Set<string>; wire?: string[]; focus?: string | null;
  hot?: number; mix?: boolean; tok: Record<string, string>;
  fn?: [string, string, string] | null;
}) => {
  /* While the transformation runs it owns the screen: the inputs, the block
     and the result are the only things on it. */
  if (fn) return <Fn inA={fn[0]} inB={fn[1]} out={fn[2]} />;
  const on = ORDER[who].filter((id) => vis.has(id));
  /* Nothing on a screen is smaller than it has to be. The old caption strip
     under the icons became unreadable the moment the camera moved, and the
     narration says the same thing better, so it is gone; what is left is
     drawn larger, and anything the current teaching point is not about steps
     back rather than competing with it. */
  const wide = on.some((id) => ITEM[id][0] === "msg" || ITEM[id][0] === "cipher");
  const k = wide ? 1 : on.length > 1 ? 1.12 : 1.30;
  const gap = on.length > 1 ? 36 : 0;
  return (
    <g transform={`scale(${k})`}>
      {on.map((id, i) => {
        const [kind, tone] = ITEM[id];
        const x = (i - (on.length - 1) / 2) * gap;
        const back = !!focus && focus !== id;
        /* Mixing collapses the inputs toward each other instead of cutting to
           the answer: the viewer has to see the two things become one. */
        return (
          <g key={id} data-id={id}
             className={"item" + (back ? " back" : focus === id ? " fore" : "")
                        + (mix ? " mixing" : "")}
             style={{ transform: `translate(${mix ? 0 : x}px,0)` }}>
            <Glyph kind={kind} tone={tone} wire={wire} hot={hot} token={tok[id]} />
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

/* The speaker's name carries their identity colour. These used to point at
   --you and --fr, which do not exist, so every name fell back to black. */
const TAG_FILL: Record<Tone, string> = {
  you: "var(--maya)", fr: "var(--leo)", key: "var(--key)", priv: "var(--priv)",
  danger: "var(--evan)", neutral: "var(--ink-2)",
};

const Callout = ({ def, at, inv, narrow }: {
  def: CalloutDef; at: [number, number]; inv: number; narrow: boolean;
}) => {
  const [ax, ay] = at;
  const chip = def.kind === "chip";
  const wire = def.kind === "wire";
  const fs = chip ? 14 : 15.5;
  const padX = chip ? 16 : 22;
  const padY = chip ? 12 : 18;
  const lines = wire ? [] : wrapText(def.text, narrow ? 22 : 26);
  const longest = lines.reduce((a, b) => (a.length > b.length ? a : b), "");
  /* 0.53 is the average glyph-width ratio for the display face at weight 600.
     Measured once, hard-coded, deliberately generous — over-estimating adds
     air, under-estimating puts text against the border. */
  const w = wire ? 230
          : Math.max(96, Math.round(longest.length * fs * 0.53 + padX * 2));
  const lh = fs * 1.55;
  const tagH = def.tag ? 20 : 0;
  const h = wire ? 122 : Math.round(lines.length * lh + padY * 2 + tagH);
  return (
    <g transform={`translate(${ax},${ay})`}>
      {/* No leader line. The speaker is named on the card itself, and the card
          sits beside them, so a tether only added a line across the picture. */}
      <g className="hold" style={{ transform: `scale(${inv})` }}>
        {wire ? (
          /* What Evan actually pulled off the wire. Same chrome as every other
             card, so it reads as part of the narration rather than an effect;
             the content is the point. */
          <g data-audit="DIALOG" className="tapcard">
            <rect className="paper" x={-w / 2} y={-h / 2} width={w} height={h} rx="10" />
            <rect fill="none" stroke="var(--danger)" strokeWidth="1.2"
                  x={-w / 2} y={-h / 2} width={w} height={h} rx="10" />
            <text className="dlg-tag" data-audit="TAG" x={-w / 2 + 18} y={-h / 2 + 22}
                  fill="var(--danger)">Intercepted on the network</text>
            {(def.lines || []).map((ln, i) => (
              <text key={i} className="tapline" x={0} y={-h / 2 + 56 + i * 20}>{ln}</text>
            ))}
            <text className="tapfoot" x={0} y={h / 2 - 16}>{def.foot}</text>
          </g>
        ) : chip ? (
          <g data-audit="CHIP">
            <text className="chip-halo" textAnchor="middle" y={5}>{def.text}</text>
            <text className="chip-text" textAnchor="middle" y={5}>{def.text}</text>
          </g>
        ) : (
          <g data-audit="DIALOG">
            <rect className="paper" x={-w / 2} y={-h / 2} width={w} height={h} rx="10" />
            <rect fill="none" stroke="var(--edge)" strokeWidth="1"
                  x={-w / 2} y={-h / 2} width={w} height={h} rx="10" />
            <rect fill={TAG_FILL[def.tone || "neutral"]} opacity=".9"
                  x={-w / 2} y={-h / 2 + 8} width="3" height={h - 16} rx="1.5" />
            {def.tag && (
              <text className="dlg-tag" data-audit="TAG" x={-w / 2 + padX} y={-h / 2 + 21}
                    fill={TAG_FILL[def.tone || "neutral"]}>{def.tag}</text>
            )}
            {/* Each wrapped line keeps its trailing space, so the card reads
                as sentences to a screen reader or a copy-paste rather than
                running the words together at every line break. */}
            {lines.map((ln, i) => (
              <text key={i} className="dlg-text" xmlSpace="preserve"
                    x={-w / 2 + padX}
                    y={-h / 2 + padY + tagH + lh * (i + 0.75)}>
                {i < lines.length - 1 ? ln + " " : ln}
              </text>
            ))}
          </g>
        )}
      </g>
    </g>
  );
};


/* ==================================================== 6b. KEY FRAMES ===== */
/* Cinematic intertitles, not modals. At the end of a major beat the room
   freezes and blurs, and one sentence comes into focus over imagery lifted
   from the scene itself — the same laptops, the same lock, the same card —
   so the summary is recognisable rather than abstract. */

const Lid = ({ x, children, lit }: { x: number; children: React.ReactNode; lit?: boolean }) => (
  <g transform={`translate(${x},0)`}>
    <path className="kf-ln" d="M-50 26 L50 26 L64 42 L-64 42 Z" />
    <rect className={"kf-ln" + (lit ? " lit" : "")} x="-46" y="-34" width="92" height="60" rx="7" />
    <rect className="kf-glass" x="-41" y="-29" width="82" height="50" rx="4" />
    <g transform="translate(0,-4)">{children}</g>
  </g>
);

const ART: Record<string, React.ReactNode> = {
  /* contained and calm: two machines, two locks, nothing between them */
  private: (
    <svg viewBox="-190 -60 380 120" className="kf-art">
      <Lid x={-96}><Glyph kind="lock" tone="you" /></Lid>
      <Lid x={96}><Glyph kind="lock" tone="fr" /></Lid>
      <path className="kf-void" d="M-24 4 H24" />
    </svg>
  ),
  /* exposed but controlled: one named card, on the route, going somewhere */
  publicOnly: (
    <svg viewBox="-190 -62 380 124" className="kf-art">
      <path className="kf-route" d="M-150 34 C -90 -14, 90 -14, 150 34" />
      <g transform="translate(-150,34)"><Glyph kind="lock" tone="you" /></g>
      <g transform="translate(0,-22)">
        <rect className="kf-card t-you" x="-84" y="-19" width="168" height="38" rx="9" />
        <g className="kf-ico t-you" transform="translate(-70,-8)"
           dangerouslySetInnerHTML={{ __html: ICO.packet }} />
        <text className="kf-card-t" x="-46" y="5">Maya’s public value</text>
      </g>
      <path className="kf-arrow" d="M96 -4 h34 m0 0 -7 -6 m7 6 -7 6" />
    </svg>
  ),
  /* the mixing, twice, in parallel */
  combine: (
    <svg viewBox="-190 -60 380 120" className="kf-art">
      <Lid x={-96}>
        <g transform="translate(-19,0) scale(.9)"><Glyph kind="lock" tone="you" /></g>
        <text className="kf-plus" x="0" y="5">{"\u0192"}</text>
        <g transform="translate(21,0) scale(.72)"><Glyph kind="packet" tone="fr" /></g>
      </Lid>
      <Lid x={96}>
        <g transform="translate(-19,0) scale(.9)"><Glyph kind="lock" tone="fr" /></g>
        <text className="kf-plus" x="0" y="5">{"\u0192"}</text>
        <g transform="translate(21,0) scale(.72)"><Glyph kind="packet" tone="you" /></g>
      </Lid>
    </svg>
  ),
  /* resolution: the same object, twice, glowing */
  sameKey: (
    <svg viewBox="-190 -60 380 120" className="kf-art">
      <Lid x={-96} lit><g className="kf-glow" transform="scale(1.5)"><Glyph kind="key" tone="key" /></g></Lid>
      <Lid x={96} lit><g className="kf-glow" transform="scale(1.5)"><Glyph kind="key" tone="key" /></g></Lid>
      <path className="kf-tie" d="M-24 4 H24" />
    </svg>
  ),
  /* protection: one object, two states, the arrow between them */
  protected: (
    <svg viewBox="-190 -52 380 104" className="kf-art">
      <g transform="translate(-104,0) scale(1.5)"><Glyph kind="msg" tone="you" /></g>
      <path className="kf-arrow" d="M-16 0 h32 m0 0 -7 -6 m7 6 -7 6" />
      <g className="kf-glow" transform="translate(104,0) scale(1.5)"><Glyph kind="cipher" tone="key" /></g>
    </svg>
  ),
};

/* `on` is what the card is about. Everything else softens; the subject
   stays sharp, so the viewer never loses the room. */
type Subject = "pair" | "you" | "fr" | "atk" | "net" | "packet" | null;
interface Frame { art?: string; text: string; ms: number; soft?: boolean; on?: Subject }
const FRAMES: Record<string, Frame> = {
  /* The opening title card. Unlike the others it carries no foreground art —
     the room is the imagery, so the blur stays light enough to still read
     three people, three laptops and the router behind the sentence. */
  opening:    { text: "Maya and Leo have never met. Evan can read everything they send over this Wi-Fi. Can they still create the same secret?",
                ms: 2400, soft: true },
  tapWire:    { text: "Evan can tap the wire — but he only gets encrypted text.",
                ms: 1700, on: "atk" },
  neverSent:  { text: "They arrived at the same secret. Neither one ever sent it.",
                ms: 2100, on: "pair" },
  named:      { text: "This is Diffie\u2013Hellman key exchange.", ms: 1800, soft: true },
  ending:     { text: "Same network. Same traffic. Different knowledge.",
                ms: 2400, soft: true },
  private:    { art: "private",    text: "The private values never leave.", ms: 1600, on: "pair" },
  publicOnly: { art: "publicOnly", text: "Only the public values travel.", ms: 1600, on: "net" },
  combine:    { art: "combine",    text: "Each side combines its own private value with the other\u2019s public value.", ms: 1800, on: "pair" },
  sameKey:    { art: "sameKey",    text: "Both devices create the same shared secret.", ms: 1700, on: "pair" },
  protected:  { art: "protected",  text: "The same secret protects the message before it crosses.", ms: 1700, on: "you" },
};

const KeyFrame = ({ f, on }: { f: Frame | null; on: boolean }) => {
  /* Two kinds of card. One names a subject in the scene, and the scene is its
     illustration: it becomes a caption along the foot of the frame, with the
     subject left sharp above it. The other is about the whole story, so it
     takes the frame — artwork, sentence, and a ground of its own. */
  const capt = !!(f && f.on);
  return (
    <div className={"kf" + (on ? " on" : "") + (f && f.soft ? " soft" : "")
                    + (capt ? " kf-capt" : "")} aria-hidden={!on}>
      {f && <>
        {f.art && !capt && <div className="kf-img">{ART[f.art]}</div>}
        <p className={"kf-line" + (f.art && !capt ? "" : " lead")}>{f.text}</p>
      </>}
    </div>
  );
};

/* ========================================================== 7. CHROME === */

/* The single instructional box. It lives inside the viewport, in a safe zone
   that never touches an edge, and it carries whichever line is current — the
   narrator's, or a character's, never both. Nothing essential is printed
   under the animation any more. */
const NoteBox = ({ line, tag, tone, pos, swap }: {
  line: Line; tag?: string; tone?: Tone; pos: string; swap: boolean;
}) => (
  <div className={"nb nb-" + pos + (swap ? " swap" : "")}
       data-audit={pos === "dock" ? "DOCK" : "NOTE"} aria-live="polite">
    {tag && <span className="nb-tag" style={{ color: TAG_FILL[tone || "neutral"] }}>{tag}</span>}
    {line.t && !tag && <span className="nb-term">{line.t}</span>}
    <p>{line.s}</p>
  </div>
);

/* A point where the story stops and waits. Either a row of numbers to choose
   from, or a single action to take — nothing else, and never more than one on
   screen at a time. */
interface Ask { kind: "pick" | "act"; label: string; opts: { v: any; t: string }[] }

const Gate = ({ ask, pos, onPick }: {
  ask: Ask; pos: string; onPick: (v: any) => void;
}) => (
  <div className={"gate gate-" + pos} data-audit="GATE">
    <span className="gate-lbl">{ask.label}</span>
    <div className="gate-row">
      {ask.opts.map((o) => (
        <button key={String(o.v)} className={"gate-btn" + (ask.kind === "act" ? " act" : "")}
                onClick={() => onPick(o.v)}>{o.t}</button>
      ))}
    </div>
  </div>
);

/* Who ended up with what. The whole argument in three rows, and the only
   place the three of them are compared directly. */
const Ledger = ({ rows, line }: {
  rows: [string, string, string][]; line?: Line;
}) => (
  /* A summary owns the frame, so it brings its own ground rather than sitting
     on top of the cast — and it carries its own sentence, so there is never a
     second box competing with it. */
  <div className="ledger-wrap" data-audit="LEDGER">
    <div className="ledger">
      {rows.map(([who, what, tone]) => (
        <div key={who} className="ledger-row">
          <span className="ledger-who" style={{ color: tone }}>{who}</span>
          <span className="ledger-what">{what}</span>
        </div>
      ))}
      {line && <p className="ledger-line">{line.s}</p>}
    </div>
  </div>
);

/* The transport. One track for the whole story with the two chapter
   boundaries marked on it, a playhead that follows the clock, and a handle
   big enough for a thumb. Dragging seeks; it does not scrub a second
   timeline of its own. */
const Scrub = ({ pos, dur, marks, playing, onSeek, onScrub, onToggle, labels }: {
  pos: number; dur: number; marks: number[]; playing: boolean; labels: string[];
  onSeek: (t: number) => void; onScrub: (on: boolean) => void; onToggle: () => void;
}) => {
  const track = useRef<HTMLDivElement | null>(null);
  const from = (e: { clientX: number }) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
  };
  const grab = (e: React.PointerEvent) => {
    /* Capture keeps the drag alive outside the track; some pointer sources
       refuse it, and that must not break the seek. */
    try { (e.target as Element).setPointerCapture?.(e.pointerId); } catch {}
    onScrub(true); onSeek(from(e));
  };
  const move = (e: React.PointerEvent) => { if (e.buttons) onSeek(from(e)); };
  const drop = () => onScrub(false);
  const pct = dur ? (pos / dur) * 100 : 0;
  return (
    <div className="scrub">
      <button className="scrub-play" onClick={onToggle}
              aria-label={playing ? "Pause" : "Play"}>
        {playing
          ? <svg viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="1" width="3" height="10" rx="1" /><rect x="7.5" y="1" width="3" height="10" rx="1" /></svg>
          : <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 1 L11 6 L2.5 11 Z" /></svg>}
      </button>
      <div className="scrub-track" ref={track} onPointerDown={grab}
           onPointerMove={move} onPointerUp={drop} onPointerCancel={drop}
           role="slider" tabIndex={0}
           aria-label="Timeline" aria-valuemin={0} aria-valuemax={Math.round(dur)}
           aria-valuenow={Math.round(pos)}
           onKeyDown={(e) => {
             if (e.key === "ArrowRight") onSeek(pos + 1000);
             if (e.key === "ArrowLeft") onSeek(pos - 1000);
           }}>
        <div className="scrub-rail" />
        <div className="scrub-fill" style={{ width: pct + "%" }} />
        {marks.map((m, i) => (
          <span key={i} className="scrub-mark" style={{ left: (m / dur) * 100 + "%" }}
                title={labels[i + 1]} />
        ))}
        <span className="scrub-head" style={{ left: pct + "%" }} />
      </div>
    </div>
  );
};

const Controls = ({ act, playing, waiting, go, replay }: {
  act: number; playing: boolean; waiting: boolean;
  go: (a: number) => void; replay: () => void;
}) => {
  const last = act === ACTS.length;
  return (
    <div className="nav">
      <div className="nav-in">
        <button className="btn ghost" onClick={replay}>Replay chapter</button>
        <button className={"btn primary" + (playing ? " waiting" : "")}
                onClick={() => go(last ? 1 : act + 1)}
                aria-live="polite">
          {waiting ? "Your turn" : playing ? "Playing…" : last ? "Watch again" : "Continue"}
          {!playing && !waiting && <span className="ct">{act}/{ACTS.length}</span>}
        </button>
      </div>
    </div>
  );
};

/* ======================================================== 8. FALLBACKS === */
/* The exact end state of each beat. Reduced-motion users, thumbnails, and
   anyone arriving mid-transition all see this, so every step needs a legible
   still frame. */

/* ============================================================ 8b. TAPE === */
/* The scene as a value. Everything the picture shows lives in here, so the
   state at any moment is a pure function of the tape and the clock. */
interface Scene {
  step: Step; shot: Shot; vis: string[]; calls: Calls; flows: Flow[];
  seen: boolean; lit: Partial<Record<Who, Lit>>; focus: string | null;
  hot: number; mix: Who | null; tap: boolean; spot: Subject; guess: boolean;
  morphing: boolean; fn: Who | null; ledger: boolean;
  frame: Frame | null; frameOn: boolean;
  wire: Record<Who, string[]>; note: Line; noteSwap: boolean;
}
const BASE: Scene = {
  step: 1, shot: "wide", vis: [], calls: {}, flows: [],
  seen: false, lit: {}, focus: null, hot: -1, mix: null, tap: false,
  spot: null, guess: false, morphing: false, fn: null, ledger: false,
  frame: null, frameOn: false,
  wire: { you: WIRE.plain, fr: WIRE.plain, atk: WIRE.enc },
  note: NOTE.wifi, noteSwap: false,
};

interface KF { at: number; go: (s: Scene) => void; mark?: string }
interface Fly {
  at: number; hold: number; ms: number; settle: number; fade: number;
  path: string; cargo: Cargo; back: boolean;
}
interface Tape {
  /* which chapter and which take this tape belongs to, so extending it with
     an answer is not mistaken for arriving at a new one */
  key: string;
  kfs: KF[]; flights: Fly[]; dur: number;
  gate?: { at: number; ask: Ask; index: number };
}
/* `await` on this resolves in a microtask without a timer, so a whole chapter
   records in well under a millisecond. */
const SYNC: any = { then: (r: (v?: any) => void) => r() };

/* The resolver. One function, used by playback and by scrubbing alike: the
   scene at t is the base scene with every keyframe at or before t applied in
   order. Seeking backwards is the same fold from zero, so a state can never
   be left over from a moment the viewer has scrubbed away from. */
function resolve(tape: Tape | null, t: number): Scene {
  const s: Scene = { ...BASE, vis: [], calls: {}, flows: [], lit: {},
                     wire: { ...BASE.wire } };
  if (!tape) return s;
  for (const k of tape.kfs) { if (k.at > t) break; k.go(s); }
  return s;
}
/* How many keyframes are in force — the cheap way to know whether the fold
   would produce anything new this frame. */
function cursorAt(tape: Tape | null, t: number): number {
  if (!tape) return 0;
  let n = 0;
  for (const k of tape.kfs) { if (k.at > t) break; n++; }
  return n;
}

/* ============================================================== 9. APP === */

/* The state label under a person: the most advanced thing they currently
   hold, said plainly. */
const RANK: GlyphKind[] = ["setup", "lock", "packet", "key", "msg", "cipher"];
const STATE_LABEL: Partial<Record<GlyphKind, string>> = {
  setup: "Starting value", lock: "Private value", packet: "Public value",
  key: "Shared secret", msg: "Readable message", cipher: "Encrypted message",
};
function stateOf(who: Who, vis: Set<string>): string {
  if (who === "atk") return "Watching the network";
  const held = ORDER[who].filter((id) => vis.has(id)).map((id) => ITEM[id][0]);
  if (!held.length) return "Nothing yet";
  const best = held.reduce((a, b) => (RANK.indexOf(b) > RANK.indexOf(a) ? b : a));
  return STATE_LABEL[best] || "";
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function App() {
  const [act, setAct] = useState(1);
  const [step, setStep] = useState<Step>(1);
  const [note, setNote] = useState<Line>(NOTE.wifi);
  const [noteSwap, setNoteSwap] = useState(false);
  const [L, setL] = useState<Layout>(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 880px)").matches ? WIDE : TALL);
  const [shot, setShot] = useState<Shot>("wide");
  const [vis, setVis] = useState<Set<string>>(new Set());
  const [calls, setCalls] = useState<Calls>({});
  const [flows, setFlows] = useState<Flow[]>([]);
  const [seen, setSeen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [lit, setLit] = useState<Partial<Record<Who, Lit>>>({});
  const [focus, setFocus] = useState<string | null>(null);
  const [hot, setHot] = useState(-1);          /* the character mid-turn */
  const [mix, setMix] = useState<Who | null>(null);
  const [tap, setTap] = useState(false);       /* Evan has hold of the wire */
  const [spot, setSpot] = useState<Subject>(null);
  const [guess, setGuess] = useState(false);   /* Evan trying to work backwards */
  const [morphing, setMorph] = useState(false);
  const [fn, setFn] = useState<Who | null>(null);   /* the one-way block, running */
  const [ledger, setLedger] = useState(false);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [frameOn, setFrameOn] = useState(false);
  const [wire, setWire] = useState<Record<Who, string[]>>(BASE.wire);

  /* A working pair until the viewer chooses their own. */
  const [vals, setVals] = useState<Vals>({ a: PICKS.you[0], b: PICKS.fr[0] });

  /* --- the transport ---------------------------------------------------- */
  const [tape, setTape] = useState<Tape | null>(null);
  const [durs, setDurs] = useState<number[]>([1, 1, 1]);
  const [answers, setAnswers] = useState<Record<number, any[]>>({});
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [scrubbing, setScrubbing] = useState(false);
  const tRef = useRef(0);
  const curRef = useRef(-1);
  const seekRef = useRef<number | null>(null);   /* pending seek after a chapter change */
  /* A seek shows the moment it lands on. The camera glides during playback,
     because that is the choreography; it snaps when the viewer moves the
     playhead, because a sweep would be answering a question they did not
     ask. */
  const [snap, setSnap] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const packRef = useRef<SVGGElement | null>(null);
  const invRef = useRef(1);

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
  /* A close-up is its own composition. Labels counter-scale to hold their size,
     then take a further 0-40% so the text the camera moved for is actually
     easier to read, not merely the same size on a busier frame. */
  const boost = 1 + Math.min(0.4, Math.max(0, (k - 1) * 0.3));
  const inv = boost / k;
  /* CSS transforms on SVG need REAL UNITS. translate(28,-528) is valid SVG
     attribute syntax and invalid CSS — the whole declaration is dropped
     silently and every shot renders at 1x. */
  invRef.current = inv;
  const cam = `translate(${L.w / 2 - cx * k}px,${L.h / 2 - cy * k}px) scale(${k})`;

  /* Zoom alone is not emphasis. */
  const near = (who: Who) =>
    shot === "wide" || shot === "net" ? ""
      : shot === "both" ? (who === "atk" ? " far" : " near")
      : shot === who ? " near"
      : " far";

  /* --- record, then play ------------------------------------------------
     Recording is pure and cheap, so it happens whenever the chapter, the
     staging or the viewer's answers change. Playing is a clock. Seeking is
     the same fold the clock uses, run at a different number. */
  /* ================================================ THE CHAPTER CLOCK ===
     Every beat below is written the way it always was — a sequence of state
     changes separated by waits. What changed is what those calls do: instead
     of mutating the scene when a timer fires, they append a keyframe to a
     tape at a virtual time, and the whole chapter's tape is built in under a
     millisecond. Playback and scrubbing then share one resolver: the scene at
     time t is the base scene with every keyframe at or before t applied, in
     order. There is no second code path, and no state that only exists
     because a timer happened to fire. */

  /* Building the tape for (chapter, layout, answers). Pure: it touches no
     React state, so it can be run for chapters the viewer has not reached. */
  const build = async (actNo: number, LL: Layout, answers: any[], key = ""): Promise<Tape> => {
    let vt = 0;
    const kfs: KF[] = [];
    const flights: Fly[] = [];
    let gate: Tape["gate"] = undefined;
    let gi = 0;
    const HALT = { halt: true };

    const at = (go: (s: Scene) => void, mark?: string) => { kfs.push({ at: vt, go, mark }); };
    const wait = (ms: number) => { vt += Math.max(0, ms); return SYNC; };

    /* --- the same vocabulary the beats have always used ------------------ */
    const show = (ids: string[]) => at((s) => { s.vis = ids.slice(); });
    /* A new dialogue box replaces any other dialogue box; captions stay. */
    const say = (patch: Calls) => at((s) => {
      const opensNote = Object.keys(patch).some((key) => patch[key] && patch[key]!.kind !== "chip");
      const n: Calls = { ...s.calls };
      if (opensNote) for (const key of Object.keys(n)) if (n[key] && n[key]!.kind !== "chip") n[key] = null;
      s.calls = Object.assign(n, patch);
    });
    const clearAll = () => at((s) => { s.calls = {}; });
    /* One line at a time, cross-faded in place so the eye never hunts. */
    const tell = (line: Line) => {
      at((s) => { s.noteSwap = true; });
      const hold = vt; vt += RM ? 0 : 170;
      at((s) => { s.note = line; s.noteSwap = false; });
      vt = hold;
    };
    /* A brief arrival, not the whole trip: narration lands while the camera
       is still finishing its move, so the two overlap instead of queueing. */
    const settle = () => wait(RM ? 0 : 380);
    /* Scaled to the sentence in front of the viewer — around two seconds for
       one short line, three and a half for two — and never longer than the
       action it is describing. */
    const read = (t: string) => wait(RM ? 400 : Math.min(3400, 850 + t.length * 24));
    const emph = (id: string | null) => at((s) => { s.focus = id; });
    const flowOn = (f: Flow[]) => at((s) => { s.flows = f.slice(); });
    const flowOff = () => at((s) => { s.flows = []; });
    const setShot = (sh: Shot) => at((s) => { s.shot = sh; });
    const setSpot = (sp: Subject) => at((s) => { s.spot = sp; });
    const setGuess = (g: boolean) => at((s) => { s.guess = g; });
    const setTap = (v: boolean) => at((s) => { s.tap = v; });
    const setFn = (w: Who | null) => at((s) => { s.fn = w; });
    const setLedger = (v: boolean) => at((s) => { s.ledger = v; });
    const setStep = (st: Step) => at((s) => { s.step = st; }, "beat");
    const setWire = (f: (p: Record<Who, string[]>) => Record<Who, string[]>) =>
      at((s) => { s.wire = f(s.wire); });
    /* An "on for a while" state is two keyframes, so seeking into the middle
       of it lands inside the window and seeking past it lands after. */
    const span = (on: (s: Scene) => void, off: (s: Scene) => void, ms: number) => {
      at(on);
      const back = vt; vt += ms; at(off); vt = back;
    };
    const observe = (ms: number) =>
      span((s) => { s.seen = true; }, (s) => { s.seen = false; }, ms);
    /* The lid outline is how a machine says "this landed on me". Green when a
       public value is absorbed, yellow for the private key that stays put,
       and both frames light together for the shared secret — because the key
       is computed in two places at the same instant. */
    const light = (who: Who[], kind: Lit, ms = 700) => span(
      (s) => { s.lit = { ...s.lit, ...Object.fromEntries(who.map((w) => [w, kind])) }; },
      (s) => { const n = { ...s.lit }; who.forEach((w) => { if (n[w] === kind) delete n[w]; }); s.lit = n; },
      ms);
    const gold = () => light(["you", "fr"], "key", 900);
    const morph = () => span((s) => { s.morphing = true; }, (s) => { s.morphing = false; }, 620);
    /* One character at a time, one keyframe each: the walk is reconstructible
       from any point, so scrubbing into the middle of a scramble shows the
       message exactly half-turned rather than whole or finished. */
    const turn = (who: Who, from: string[], to: string[], step = 52) => {
      const total = from[0].length + from[1].length;
      const txt = (n: number) => [0, 1].map((li) => {
        const off = li === 0 ? 0 : from[0].length;
        return from[li].split("").map((c, i) => (off + i < n ? to[li][i] : c)).join("");
      });
      for (let n = 1; n <= total; n++) {
        const line = txt(n), h = n - 1;
        at((s) => { s.wire = { ...s.wire, [who]: line }; s.hot = h; });
        vt += RM ? 0 : step;
      }
      at((s) => { s.hot = -1; });
      return SYNC;
    };
    /* Two things on one screen move together and resolve into one. */
    const merge = (who: Who, out: string[], ms = 620) => {
      at((s) => { s.mix = who; });
      vt += RM ? 0 : ms;
      at((s) => { s.mix = null; s.vis = out.slice(); });
      return SYNC;
    };
    /* freeze -> sentence + image -> hold -> fade -> sharpen */
    const cut = (id: keyof typeof FRAMES) => {
      const f = FRAMES[id];
      at((s) => { s.frame = f; s.frameOn = true; });
      vt += f.ms;
      at((s) => { s.frameOn = false; });
      vt += 260;
      at((s) => { s.frame = null; });
      return SYNC;
    };
    /* A payload in flight is a function of time, not a timer: it is recorded
       with a start, a duration and a path, and drawn wherever the clock says
       it has got to. Seeking into the middle of a crossing therefore shows it
       mid-crossing. */
    const send = (pathId: string, cargo: Cargo, ms: number,
                  opts: { back?: boolean; hold?: number; settle?: number } = {}) => {
      const hold = opts.hold ?? 820, st = opts.settle ?? 420;
      flights.push({ at: vt, hold, ms, settle: st, fade: 260,
                     path: pathId, cargo, back: !!opts.back });
      vt += hold + ms + st + 260;
      return SYNC;
    };
    /* Where the story hands over. If the viewer has already answered this
       one, recording carries straight on with their answer, which is what
       makes the tape a pure function of the answers so far. */
    const askUser = (a: Ask): any => {
      const i = gi++;
      if (i < answers.length) return { then: (r: any) => r(answers[i]) };
      gate = { at: vt, ask: a, index: i };
      throw HALT;
    };
    const answered = () => {};
    const alive = () => true;

    const A = LL.an;

    const beat: Record<number, () => Promise<void>> = {};
    const run = async () => {

      /* ============================ THE LESSON ============================
         One rhythm, every time: the camera arrives and settles, the narration
         names the idea, the viewer gets time to read it, the action happens,
         and the result holds before anything else moves. Nothing overlaps.
         Where the viewer has a choice to make, the timeline stops and waits
         rather than performing the choice for them. */

      /* Asked at the end of every chapter, because the whole argument is
         about the gap between what crosses the wire and what anyone learns
         from it. */
      const evanKnows = async (line: string, ms = 1092) => {
        setShot("atk"); await settle(); if (!alive()) return;
        setSpot("atk");
        tell({ t: "What Evan knows now", s: line });
        await wait(ms); if (!alive()) return;
        setSpot(null);
      };

      /* ------------------------------------------------------- 1 SETUP -- */
      beat[1] = async () => {
        setShot("wide"); show([]); clearAll(); emph(null); tell(NOTE.wifi);
        await wait(588); if (!alive()) return;
        await cut("opening"); if (!alive()) return;
        await wait(294); if (!alive()) return;

        setShot("net"); await settle(); if (!alive()) return;
        tell(NOTE.router);
        await wait(336); if (!alive()) return;
        say({ d: { kind: "note", tag: "Router", tone: "neutral", text: SAY.router } });
        await read(SAY.router); if (!alive()) return;

        /* Proof, not assertion: a plain note crosses the room in the clear and
           the same words appear on the observer's screen. */
        say({ d: null }); setSpot("net");
        await wait(252); if (!alive()) return;
        tell(NOTE.plainDemo);
        flowOn([["main", "you", 1]]);
        send("p-main", { kind: "msg", tone: "you",
              label: "Sent with no protection", sub: "Meet me outside at 5" },
             1092, { hold: 504 });
        await wait(546); if (!alive()) return;
        observe(1596);
        await send("p-netAtk", { kind: "msg", tone: "danger",
                    label: "The same words, on the wire", sub: "Meet me outside at 5" },
                   588, { hold: 840 }); if (!alive()) return;
        setSpot("atk");
        tell(NOTE.plainSeen);
        await wait(1176); if (!alive()) return;
        flowOff(); setSpot(null);
        say({ d: { kind: "note", tag: "Evan", tone: "danger", text: SAY.evanPlain } });
        await read(SAY.evanPlain); if (!alive()) return;

        /* the one number everyone is allowed to have */
        say({ d: null });
        await wait(294); if (!alive()) return;
        setShot("net"); await settle(); if (!alive()) return;
        const START = { kind: "setup" as GlyphKind, tone: "neutral" as Tone,
                        label: "Public starting value", sub: "From the network" };
        send("p-netYou", START, 588);
        await send("p-netFr", START, 588); if (!alive()) return;
        show(["you.setup", "fr.setup"]); light(["you", "fr"], "pub", 462);
        tell(NOTE.same);
        await wait(1008); if (!alive()) return;
        observe(1092);
        await send("p-netAtk", { kind: "setup", tone: "neutral",
                    label: "Public starting value", sub: "Evan sees this" }, 462); if (!alive()) return;
        show(["you.setup", "fr.setup", "atk.setup"]); light(["atk"], "pub", 462);
        tell(NOTE.evanNet);
        await wait(1008);
      };

      /* ------------------------------------------- 2 THE PRIVATE HALVES -- */
      /* The viewer picks both numbers. Nothing about this beat is automatic:
         the point is that these two values are chosen locally and never go
         anywhere, so the viewer should be the one choosing them. */
      beat[2] = async () => {
        setShot("you"); show(["you.setup", "fr.setup", "atk.setup"]); clearAll();
        await settle(); if (!alive()) return;
        tell(NOTE.pickMaya);
        await wait(294); if (!alive()) return;

        const a = await askUser({ kind: "pick", label: "Pick Maya’s private number",
                                  opts: PICKS.you.map((v) => ({ v, t: String(v) })) });
        if (!alive() || a === undefined) return;
        answered(); setVals((p) => ({ ...p, a }));
        show(["you.setup", "you.lock", "fr.setup", "atk.setup"]);
        emph("you.lock"); light(["you"], "priv", 672); tell(NOTE.keepMaya);
        await wait(504); if (!alive()) return;
        say({ d: { kind: "note", tag: "Maya", tone: "you", text: SAY.mayaKeep } });
        await read(SAY.mayaKeep); if (!alive()) return;

        setShot("fr"); say({ d: null }); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.pickLeo);
        await wait(294); if (!alive()) return;

        const b = await askUser({ kind: "pick", label: "Pick Leo’s private number",
                                  opts: PICKS.fr.map((v) => ({ v, t: String(v) })) });
        if (!alive() || b === undefined) return;
        answered(); setVals((p) => ({ ...p, b }));
        show(["you.setup", "you.lock", "fr.setup", "fr.lock", "atk.setup"]);
        emph("fr.lock"); light(["fr"], "priv", 672); tell(NOTE.keepLeo);
        await wait(504); if (!alive()) return;
        say({ d: { kind: "note", tag: "Leo", tone: "fr", text: SAY.leoKeep } });
        await read(SAY.leoKeep); if (!alive()) return;

        /* the wires light up and neither number goes down them */
        setShot("both"); say({ d: null }); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.neither);
        flowOn([["netYou", "priv", 1], ["netFr", "priv", 1]]);
        await wait(924); if (!alive()) return;
        flowOff();
        await wait(378); if (!alive()) return;
        await cut("private"); if (!alive()) return;
        await evanKnows("The starting number, and nothing else. Neither private number has been anywhere.");
      };

      /* -------------------------------------------------- 3 EXCHANGE ---- */
      beat[3] = async () => {
        setShot("you");
        show(["you.setup", "you.lock", "fr.setup", "fr.lock", "atk.setup"]);
        clearAll(); emph(null);
        await settle(); if (!alive()) return;

        /* the transformation, shown as a transformation */
        tell(NOTE.oneway);
        await wait(420); if (!alive()) return;
        say({ d: { kind: "note", tag: "Maya", tone: "you", text: SAY.mayaMake } });
        await read(SAY.mayaMake); if (!alive()) return;
        say({ d: null }); setFn("you");
        await wait(840); if (!alive()) return;
        show(["you.lock", "you.pubYou", "fr.setup", "fr.lock", "atk.setup"]);
        setFn(null); light(["you"], "pub", 462); emph("you.pubYou"); tell(NOTE.made);
        await wait(840); if (!alive()) return;
        emph("you.lock"); tell(NOTE.staysGoes);
        await wait(756); if (!alive()) return;
        emph(null);

        /* the viewer sends it */
        const goA = await askUser({ kind: "act", label: "",
                                    opts: [{ v: 1, t: "Send Maya’s public value" }] });
        if (!alive() || goA === undefined) return;
        answered();
        flowOn([["netYou", "you", -1]]);
        await send("p-netYou", { kind: "packet", tone: "you",
                    label: "Maya’s public value", sub: "Safe to send" },
                   756, { back: true, hold: 378 }); if (!alive()) return;
        flowOff();
        await wait(420); if (!alive()) return;

        setShot("fr"); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.leoToo);
        await wait(378); if (!alive()) return;
        say({ d: { kind: "note", tag: "Leo", tone: "fr", text: SAY.leoMake } });
        await read(SAY.leoMake); if (!alive()) return;
        say({ d: null }); setFn("fr");
        await wait(840); if (!alive()) return;
        show(["you.lock", "you.pubYou", "fr.lock", "fr.pubFr", "atk.setup"]);
        setFn(null); light(["fr"], "pub", 462); emph("fr.pubFr");
        await wait(756); if (!alive()) return;
        emph(null);

        const goB = await askUser({ kind: "act", label: "",
                                    opts: [{ v: 1, t: "Send Leo’s public value" }] });
        if (!alive() || goB === undefined) return;
        answered();
        flowOn([["netFr", "fr", -1]]);
        await send("p-netFr", { kind: "packet", tone: "fr",
                    label: "Leo’s public value", sub: "Safe to send" },
                   756, { back: true, hold: 378 }); if (!alive()) return;
        flowOff();

        /* they land on each other's machines */
        setShot("both");
        await settle(); if (!alive()) return;
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.setup"]);
        light(["you", "fr"], "pub", 462); tell(NOTE.swapped);
        await wait(1008); if (!alive()) return;

        /* and Evan takes his copy off the wire */
        setShot("atk");
        await settle(); if (!alive()) return;
        tell(NOTE.evanSees);
        await wait(336); if (!alive()) return;
        observe(1428);
        send("p-netAtk", { kind: "packet", tone: "you",
              label: "Maya’s public value", sub: "Evan sees this" }, 462, { hold: 336 });
        await wait(252); if (!alive()) return;
        await send("p-netAtk", { kind: "packet", tone: "fr",
                    label: "Leo’s public value", sub: "Evan sees this" }, 462, { hold: 336 }); if (!alive()) return;
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"]);
        light(["atk"], "pub", 462);
        await wait(336); if (!alive()) return;
        say({ d: { kind: "note", tag: "Evan", tone: "danger", text: SAY.evanOpen } });
        await read(SAY.evanOpen); if (!alive()) return;

        /* the experiment that fails */
        tell(NOTE.evanTry); setSpot("atk"); setGuess(true);
        await wait(504); if (!alive()) return;
        say({ d: { kind: "note", tag: "Evan", tone: "danger", text: SAY.evanLack } });
        await read(SAY.evanLack); if (!alive()) return;
        tell(NOTE.evanNot);
        await wait(1092); if (!alive()) return;
        setGuess(false); setSpot(null); say({ d: null });
        await wait(336); if (!alive()) return;
        await cut("publicOnly"); if (!alive()) return;
        setShot("wide");
        await wait(378);
      };

      /* --------------------------------------------------- 4 COMBINE ---- */
      /* The lightbulb. Everything is tuned to one instant: the two sides run
         the same operation on different inputs and land on the same number,
         and the number is one that never crossed the room. */
      beat[4] = async () => {
        setShot("you");
        show(["you.lock", "you.pubFr", "fr.lock", "fr.pubYou", "atk.pubYou", "atk.pubFr"]);
        clearAll(); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.mixMaya); emph("you.pubFr");
        await wait(462); if (!alive()) return;
        say({ d: { kind: "note", tag: "Maya", tone: "you", text: SAY.mayaMix } });
        await read(SAY.mayaMix); if (!alive()) return;

        setShot("fr"); say({ d: null }); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.mixLeo); emph("fr.pubYou");
        await wait(462); if (!alive()) return;
        say({ d: { kind: "note", tag: "Leo", tone: "fr", text: SAY.leoMix } });
        await read(SAY.leoMix); if (!alive()) return;

        say({ d: null }); emph(null);
        await cut("combine"); if (!alive()) return;
        setShot("both");
        await settle(); if (!alive()) return;
        /* both, at the same instant — the key is never sent, it arrives twice */
        show(["you.key", "fr.key", "atk.pubYou", "atk.pubFr"]); tell(NOTE.sameKey);
        gold();
        say({ cYou: { kind: "chip", text: "shared secret" },
              cFr:  { kind: "chip", text: "shared secret" } });
        await wait(2600); if (!alive()) return;   /* the lightbulb: the one real hold */
        await cut("sameKey"); if (!alive()) return;

        /* the three-way tally, then the sentence, then the name */
        setShot("wide"); say({ cYou: null, cFr: null });
        await settle(); if (!alive()) return;
        setLedger(true); tell(NOTE.tally);
        await wait(2400); if (!alive()) return;
        await cut("neverSent"); if (!alive()) return;
        await cut("named"); if (!alive()) return;
        tell(NOTE.named);
        await wait(1008); if (!alive()) return;
        setLedger(false);
        await evanKnows("Two public values, and the starting number. Not the secret those two share.", 1260);
        setShot("wide");
        await wait(378);
      };

      /* ------------------------------------------------------- 5 SEND --- */
      /* Three states, in order, and the viewer sees all three: readable
         before, scrambled across, readable again after. */
      beat[5] = async () => {
        setShot("msg"); show(["you.key", "fr.key"]); clearAll(); emph(null);
        await settle(); if (!alive()) return;
        tell(NOTE.pickMsg);
        await wait(252); if (!alive()) return;

        const pick = await askUser({ kind: "act", label: "What should Maya send?",
          opts: MSGS.map((m, i) => ({ v: i, t: m.plain.join(" ") })) });
        if (!alive() || pick === undefined) return;
        answered();
        const M = MSGS[pick as number];
        setWire((p) => ({ ...p, you: M.plain }));
        show(["you.msg"]); tell(NOTE.write);
        say({ cMsg: { kind: "chip", text: "readable — before encryption" } });
        await wait(1008); if (!alive()) return;

        say({ cMsg: null,
              d: { kind: "note", tag: "Maya", tone: "key", text: SAY.mayaEnc } });
        tell(NOTE.sym);
        await read(SAY.mayaEnc); if (!alive()) return;

        /* the turn itself, one character at a time */
        say({ d: null }); tell(NOTE.scram);
        await wait(252); if (!alive()) return;
        await turn("you", M.plain, M.enc); if (!alive()) return;
        show(["you.cipher"]); tell(NOTE.lock);
        say({ cMsg: { kind: "chip", text: "scrambled — safe to send" } });
        await wait(1008); if (!alive()) return;
        await cut("protected"); if (!alive()) return;

        setShot("net"); say({ cMsg: null });
        await settle(); if (!alive()) return;
        flowOn([["main", "key", 1]]);
        const crossing = send("p-main", { kind: "cipher", tone: "key",
                                label: "Encrypted message", sub: M.enc.join(" "), mono: true },
                               1428, { hold: 630 });
        await wait(420); if (!alive()) return;

        /* --- the checkpoint: the viewer puts Evan on the wire ------------ */
        tell(NOTE.notice);
        observe(1932);
        await wait(378); if (!alive()) return;
        const doTap = await askUser({ kind: "act", label: "",
                                      opts: [{ v: 1, t: "Let Evan tap the wire" }] });
        if (!alive() || doTap === undefined) return;
        answered();
        setTap(true);
        setShot("tap");
        await settle(); if (!alive()) return;
        tell(NOTE.tapped);
        await wait(378); if (!alive()) return;
        await cut("tapWire"); if (!alive()) return;
        const TAPPED = { kind: "wire" as const, text: "", lines: M.enc,
                         foot: "Unreadable without the shared secret" };
        say({ cTap: TAPPED });
        await wait(588); if (!alive()) return;
        show(["you.cipher", "atk.cipher"]);
        say({ cTap: TAPPED,
              d: { kind: "note", tag: "Evan", tone: "danger", text: SAY.evanTap } });
        await read(SAY.evanTap); if (!alive()) return;
        say({ cTap: TAPPED,
              d: { kind: "note", tag: "Evan", tone: "danger", text: SAY.evanUseless } });
        tell(NOTE.evanMeh);
        await read(SAY.evanUseless); if (!alive()) return;
        setTap(false); say({ d: null, cTap: null });
        await wait(336); if (!alive()) return;

        setShot("net");
        await settle(); if (!alive()) return;
        await crossing; if (!alive()) return;
        flowOff();
        show(["you.cipher", "fr.cipher", "atk.cipher"]);
        await wait(504); if (!alive()) return;

        /* --- and the same walk, backwards, on the side that has the key -- */
        setShot("fr");
        await settle(); if (!alive()) return;
        setWire((p) => ({ ...p, fr: M.enc }));
        show(["you.cipher", "fr.cipher", "atk.cipher"]);
        say({ cMsgFr: { kind: "chip", text: "scrambled — as it arrived" } });
        await wait(756); if (!alive()) return;
        say({ cMsgFr: null });
        await turn("fr", M.enc, M.plain); if (!alive()) return;
        show(["you.cipher", "fr.msg", "atk.cipher"]); tell(NOTE.open);
        say({ cMsgFr: { kind: "chip", text: "readable — after decryption" } });
        await wait(672); if (!alive()) return;
        say({ cMsgFr: null,
              d: { kind: "note", tag: "Leo", tone: "fr", text: SAY.leoOpen } });
        await read(SAY.leoOpen); if (!alive()) return;

        /* --- the synthesis: the answer to the opening question ---------- */
        say({ d: null });
        setShot("wide");
        await settle(); if (!alive()) return;
        setLedger(true); tell(NOTE.threeWays);
        await wait(2400); if (!alive()) return;
        await cut("ending"); if (!alive()) return;
        tell(NOTE.close);
        await wait(1260);
      };

      /* ---- the chapter runner ----------------------------------------
         The beats chain themselves into one tape. Nothing here starts a
         timer: the runner only decides the order and the gaps. */
      const seq = ACTS[actNo - 1].beats;
      for (let i = 0; i < seq.length; i++) {
        setStep(seq[i]);
        await beat[seq[i]]();
        if (i < seq.length - 1) wait(220);
      }
    };

    try { await run(); } catch (e) { if (e !== HALT) throw e; }
    return { key, kfs, flights, dur: vt, gate };
  };

  /* The tape for the chapter in front of the viewer. */
  useEffect(() => {
    let dead = false;
    build(act, L, answers[act] || [], `${act}:${nonce}`)
      .then((tp) => { if (!dead) setTape(tp); });
    return () => { dead = true; };
  }, [act, L, answers, nonce, RM]);

  /* Every chapter's length, so the track can show the whole story and its
     two boundaries. Chapters the viewer has not answered yet are measured
     with the first option of each question — the shape of the timeline, not
     its content, is what the track needs. */
  useEffect(() => {
    let dead = false;
    Promise.all([1, 2, 3].map((n) =>
      build(n, L, answers[n] || [0, 0]).then((tp) => Math.max(1, tp.dur))
    )).then((d) => { if (!dead) setDurs(d); });
    return () => { dead = true; };
  }, [L, answers, RM]);

  /* Where the clock is allowed to reach: a question the viewer has not
     answered is a wall, because what comes after it depends on the answer. */
  const wall = tape ? (tape.gate ? tape.gate.at : tape.dur) : 0;
  const ask = tape && tape.gate && t >= tape.gate.at - 1 ? tape.gate.ask : null;

  /* One commit per keyframe crossed, not one per frame: the fold is cheap
     but re-rendering the scene is not. */
  const commit = (s: Scene) => {
    setStep(s.step); setShot(s.shot); setVis(new Set(s.vis)); setCalls(s.calls);
    setFlows(s.flows); setSeen(s.seen); setLit(s.lit); setFocus(s.focus);
    setHot(s.hot); setMix(s.mix); setTap(s.tap); setSpot(s.spot);
    setGuess(s.guess); setMorph(s.morphing); setFn(s.fn); setLedger(s.ledger);
    setFrame(s.frame); setFrameOn(s.frameOn); setWire(s.wire);
    setNote(s.note); setNoteSwap(s.noteSwap);
  };

  /* The clock. It only ever moves t; everything visible follows from t. */
  useEffect(() => {
    if (!tape) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      if (playing && !scrubbing) {
        let n = tRef.current + dt;
        if (n >= wall) { n = wall; setPlaying(false); }
        if (n !== tRef.current) { tRef.current = n; setT(n); }
      }
      /* payloads are drawn from the clock every frame, so a seek lands one
         mid-crossing rather than showing it whole or not at all */
      drawFlights(tRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tape, playing, scrubbing, wall, frameOn]);

  useEffect(() => {
    if (!snap) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    return () => cancelAnimationFrame(r);
  }, [snap, t]);

  /* The resolver, driven by the clock. Identical for playback and scrubbing. */
  useEffect(() => {
    const cur = cursorAt(tape, t);
    if (cur === curRef.current) return;
    curRef.current = cur;
    commit(resolve(tape, t));
  }, [tape, t]);

  /* A new chapter — or a replay — starts at the beginning, or at the point a
     cross-chapter seek asked for. A tape merely extended by an answer keeps
     the clock exactly where it was, so answering never rewinds the story. */
  const tapeKey = useRef("");
  useEffect(() => {
    if (!tape) return;
    curRef.current = -1;
    if (tape.key === tapeKey.current) return;
    tapeKey.current = tape.key;
    const want = seekRef.current;
    seekRef.current = null;
    const start = want == null ? 0 : Math.min(want, tape.dur);
    tRef.current = start; setT(start);
    if (want == null) setPlaying(!RM);
    /* Reduced motion: settle on the end of what is unlocked and stay there. */
    if (RM && want == null) {
      const end = tape.gate ? tape.gate.at : tape.dur;
      tRef.current = end; setT(end);
    }
  }, [tape]);

  const seek = (globalT: number) => {
    setSnap(true);
    let g = Math.max(0, globalT), n = 1;
    while (n < 3 && g > durs[n - 1]) { g -= durs[n - 1]; n++; }
    if (n !== act) { seekRef.current = g; setAct(n); return; }
    const cap = tape ? (tape.gate ? tape.gate.at : tape.dur) : 0;
    const nt = Math.min(g, cap);
    tRef.current = nt; setT(nt);
  };
  const answer = (v: any) => {
    setAnswers((p) => ({ ...p, [act]: [...(p[act] || []), v] }));
    setPlaying(true);
  };
  /* Continue is a seek, not a second timer: it lands on the next beat mark. */
  const nextBeat = () => {
    if (!tape) return;
    const nx = tape.kfs.find((k) => k.mark === "beat" && k.at > t + 1);
    if (nx && nx.at <= wall) { tRef.current = nx.at; setT(nx.at); setPlaying(true); }
    else if (t >= tape.dur - 1) setAct(act === ACTS.length ? 1 : act + 1);
    else { tRef.current = wall; setT(wall); setPlaying(true); }
  };

  /* --- payloads, drawn from the clock ----------------------------------- */
  const drawFlights = (now: number) => {
    const host = packRef.current, svg = svgRef.current;
    if (!host || !svg || !tape) return;
    const live = frameOn ? [] : tape.flights
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => now >= f.at && now < f.at + f.hold + f.ms + f.settle + f.fade);
    const keep = new Set(live.map(({ i }) => String(i)));
    Array.from(host.children).forEach((c) => {
      if (!keep.has((c as SVGGElement).dataset.fly || "")) c.remove();
    });
    for (const { f, i } of live) {
      let g = host.querySelector<SVGGElement>(`[data-fly="${i}"]`);
      if (!g) {
        g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-audit", "PACKET");
        g.setAttribute("class", "fly");
        g.dataset.fly = String(i);
        g.innerHTML = cardMarkup(f.cargo);
        host.appendChild(g);
      }
      const path = svg.querySelector<SVGPathElement>(`#${f.path}`);
      if (!path) continue;
      const len = path.getTotalLength();
      const local = now - f.at;
      let u = 0, op = 1;
      if (local < f.hold) { u = 0; op = Math.min(1, local / 240); }
      else if (local < f.hold + f.ms) {
        const x = (local - f.hold) / f.ms;
        u = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      } else if (local < f.hold + f.ms + f.settle) { u = 1; }
      else { u = 1; op = 1 - (local - f.hold - f.ms - f.settle) / f.fade; }
      const q = path.getPointAtLength((f.back ? 1 - u : u) * len);
      g.setAttribute("transform", `translate(${q.x},${q.y}) scale(${invRef.current})`);
      g.setAttribute("opacity", String(Math.max(0, Math.min(1, op))));
    }
  };



  /* Beside the subject when there is room, and in a safe zone at the foot of
     the frame when there is not. Derived from the shot, so a camera move
     repositions it instead of stranding it off-frame. */
  /* The message close-up fills the frame with Maya, so its box takes the
     strip along the foot of the picture rather than a corner. */
  /* The message close-up fills the frame edge to edge, so its box docks into
     its own band under the picture rather than covering the thing it is
     explaining. Everywhere else there is a clear corner. */
  /* Beside the subject when a corner is genuinely clear, and in the band
     under the picture when it is not. At the establishing shots the cast is
     spread across the frame and every corner is somebody's, so the band is
     the only place a sentence does not land on a person. */
  const boxPos = L.tall || shot === "msg" || shot === "wide" ? "dock"
    : shot === "you" ? "tr" : "tl";

  const tok = tokens(vals);

  const dlg = calls.d;
  const chips = Object.keys(calls).filter((c) => c !== "d" && calls[c]);

  return (
    <div className="page">
      <header className="head">
        <span className="eyebrow">Three people · one café · one secret</span>
        <h1 className="h1">{ACTS[act - 1].title}</h1>
      </header>

      <nav className="pips" aria-label="Chapters">
        {ACTS.map((a, i) => (
          <button key={a.label} className="pip"
                  data-on={i + 1 === act ? "now" : i + 1 < act ? "done" : "next"}
                  onClick={() => setAct(i + 1)}>
            <span className="dot" /><span className="lbl">{a.label}</span>
          </button>
        ))}
      </nav>

      <div className={"stage" + (frameOn ? " frozen" : "") + (frameOn && frame && frame.soft ? " soft" : "")}
           style={{ ["--ar" as any]: String(L.w / L.h) }}>
        <div className="screen">
        <svg ref={svgRef} viewBox={`0 0 ${L.w} ${L.h}`} role="img" aria-label={note.s}>
          <defs>
            {(["you", "fr", "key", "danger"] as Tone[]).map((t) => (
              <marker key={t} id={`arw-${t}`} viewBox="0 0 10 10" refX="7.5" refY="5"
                      markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path className={`arw arw-${t}`} d="M0.5 1 L9 5 L0.5 9 Z" />
              </marker>
            ))}
          </defs>

          <g className={"cam" + (snap ? " snap" : "") + (k >= 1.4 ? " tight" : "")
                          + (frameOn && frame && frame.on ? " spot spot-" + frame.on
                             : spot ? " spot spot-" + spot : "")}
               style={{ transform: cam }}>
            <Dressing L={L} />

            <path className="link" d={L.paths.netYou} />
            <path className="link" d={L.paths.netFr} />
            <path className="link" d={L.paths.netAtk} />

            <path id="p-main"   className="ghostpath" d={L.paths.main} />
            <path id="p-netYou" className="ghostpath" d={L.paths.netYou} />
            <path id="p-netFr"  className="ghostpath" d={L.paths.netFr} />
            <path id="p-netAtk" className="ghostpath" d={L.paths.netAtk} />

            {flows.map(([pth, tone, dir], i) => (
              <path key={i} className={`flow tone-${tone} ${dir === 1 ? "fwd" : "rev"}`}
                    d={L.paths[pth]}
                    markerEnd={dir === 1 ? `url(#arw-${tone})` : undefined}
                    markerStart={dir === -1 ? `url(#arw-${tone})` : undefined} />
            ))}

            {tap && <path className="tap" d={L.paths.main} />}
            {seen && <path className="sight" d={L.sight} data-audit="SIGHT" />}

            <Router x={L.router.x} y={L.router.y} live={flows.length > 0} inv={inv} />

            <Patron spot={L.atk} who="a-atk" sprite={SPRITE.atk} idle={-1400} name="Evan (intruder)"
                    state={stateOf("atk", vis)} inv={inv} cls={near("atk")} hostile
                    lit={lit.atk}
                    screen={<Screen who="atk" vis={vis} wire={wire["atk"]} focus={focus}
                                    hot={hot} mix={mix === "atk"} tok={tok} />}
                    extra={
                      <>
                      {guess && <Guessing inv={inv} s={L.atk.s}
                                          pub={tok["atk.pubYou"]} start={tok["atk.setup"]} />}
                      <g className={"eye" + (seen ? " on" : "")} transform="translate(0,-150)">
                        <g className="hold" style={{ transform: `scale(${inv / L.atk.s})` }}>
                          <circle className="eye-pulse" cx="0" cy="0" r="17" />
                          <path className="f-danger glowed-d"
                                d="M-15 0 C -9 -9, 9 -9, 15 0 C 9 9, -9 9, -15 0 Z" />
                          <circle cx="0" cy="0" r="3.6" fill="#0b0d10" />
                        </g>
                      </g>
                      </>
                    } />

            <Patron spot={L.you} who="a-you" sprite={SPRITE.you} idle={0} name="Maya"
                    state={stateOf("you", vis)} inv={inv} cls={near("you")}
                    lit={lit.you} morphing={morphing}
                    screen={<Screen who="you" vis={vis} wire={wire["you"]} focus={focus}
                                    hot={hot} mix={mix === "you"} tok={tok}
                                    fn={fn === "you" ? [tok["you.setup"], tok["you.lock"], tok["you.pubYou"]] : null} />} />

            <Patron spot={L.fr} who="a-fr" sprite={SPRITE.fr} idle={-2100} name="Leo"
                    state={stateOf("fr", vis)} inv={inv} cls={near("fr")}
                    lit={lit.fr} morphing={morphing}
                    screen={<Screen who="fr" vis={vis} wire={wire["fr"]} focus={focus}
                                    hot={hot} mix={mix === "fr"} tok={tok}
                                    fn={fn === "fr" ? [tok["fr.setup"], tok["fr.lock"], tok["fr.pubFr"]] : null} />} />

            <g className="packets" ref={packRef} />

            {chips.map((slot) => (
              <Callout key={slot} def={calls[slot]!} at={L.ch[slot]} inv={inv} narrow={L.tall} />
            ))}
              </g>
        </svg>

        {/* CRT dressing, above the picture and below nothing that must be read */}
        <div className="crt bloom" aria-hidden="true" />
        <div className="crt lines" aria-hidden="true" />
        <div className="crt vig" aria-hidden="true" />
        <KeyFrame f={frame} on={frameOn} />
        {boxPos !== "dock" && !frameOn && !ledger &&
          <NoteBox line={dlg ? { s: dlg.text } : note}
                   tag={dlg ? dlg.tag : undefined} tone={dlg ? dlg.tone : undefined}
                   pos={boxPos} swap={noteSwap} />}
        </div>

        {boxPos === "dock" && !frameOn && !ledger &&
          <NoteBox line={dlg ? { s: dlg.text } : note}
                   tag={dlg ? dlg.tag : undefined} tone={dlg ? dlg.tone : undefined}
                   pos="dock" swap={noteSwap} />}

        {ledger && <Ledger line={note} rows={[
          ["Maya", step >= 5 ? "readable message" : "shared secret " + tok["you.key"], "var(--maya)"],
          ["Leo",  step >= 5 ? "readable message" : "shared secret " + tok["fr.key"],  "var(--leo)"],
          ["Evan", step >= 5 ? "scrambled text" : "?", "var(--evan)"],
        ]} />}

        <Scrub pos={durs.slice(0, act - 1).reduce((x, y) => x + y, 0) + t}
               dur={durs.reduce((x, y) => x + y, 0)}
               marks={[durs[0], durs[0] + durs[1]]}
               labels={ACTS.map((a) => a.label)}
               playing={playing} onSeek={seek}
               onScrub={(on) => { setScrubbing(on); if (on) setPlaying(false); }}
               onToggle={() => setPlaying((p) => !p)} />

        {/* Where the story hands over. Always the same strip, directly under
            the picture, so the viewer never hunts for their turn. */}
        {ask && <Gate ask={ask} pos="dock" onPick={answer} />}

        {/* The controls live inside the viewport, docked under the picture:
            the thing you watch and the thing you press are one object. */}
        <Controls act={act} playing={playing} waiting={!!ask}
                  go={(a) => (a === act ? nextBeat() : setAct(a))}
                  replay={() => { setAnswers((p) => ({ ...p, [act]: [] })); setNonce((n) => n + 1); }} />
      </div>

      {/* The interaction does the teaching. The prose is here for anyone who
          wants it and out of the way for everyone else. */}
      <details className="read">
        <summary>How it works in plain English</summary>
        <p>{CLOSER}</p>
      </details>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
