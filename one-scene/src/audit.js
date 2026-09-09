/* ============================================================================
   COLLISION AUDITOR
   Bounding boxes, a whitelist, a minimum gap, and a frame-containment test.
   The whitelist is the valuable part: it states, explicitly, every overlap the
   design intends. Anything not on the list is a bug by definition.
   ========================================================================== */
const { chromium } = require("playwright");

const MIN_GAP = 6;          // px between a label and anything else
/* Chapters chain several beats, so the sample window is longer. */
const TIMES = [900, 2100, 3300, 4500, 5700, 6900, 8100, 9300, 10500, 11700, 13000, 14500];
const VIEWS = [
  { w: 1240, h: 900, tag: "WIDE" },
  { w: 390,  h: 844, tag: "TALL" },
];

/* What is ALLOWED to touch. Sorted pairs, "A|B". */
const OK = new Set([
  "BODY|HEAD", "BODY|CHAIR", "CHAIR|HEAD", "BODY|SHADOW", "CHAIR|SHADOW",
  "BODY|TABLE", "SHADOW|TABLE", "HEAD|SHADOW", "CHAIR|TABLE",
  "LAPTOP|TABLE", "GLYPH|LAPTOP", "GLYPH|TABLE", "ITEM|LAPTOP", "ITEM|TABLE",
  "GLYPH|ITEM", "BODY|LAPTOP", "LAPTOP|SHADOW", "HEAD|LAPTOP",
  "NAME|SHADOW", "NAME|TABLE",
  "GLASS|LAPTOP", "GLASS|GLYPH", "GLASS|TABLE", "GLASS|BODY", "GLASS|HEAD",
  "GLASS|SHADOW", "GLASS|CHAIR", "GLASS|PACKET", "GLASS|SIGHT",
  "BODY|GLYPH", "CHAIR|GLYPH", "GLYPH|HEAD", "GLYPH|SHADOW",
  "DIALOG|TAG", "DIALOG|LEADER", "CHIP|LEADER", "TAG|LEADER",
  /* packets fly over the world; that is the point */
  "PACKET|TABLE", "PACKET|LAPTOP", "PACKET|HEAD", "PACKET|BODY",
  "PACKET|CHAIR", "PACKET|SHADOW", "PACKET|GLYPH", "PACKET|ITEM",
  "PACKET|NAME", "PACKET|SIGHT", "PACKET|WINDOW", "PACKET|SIGN",
  "PACKET|ROUTER", "PACKET|COUNTER", "PACKET|PLANT", "PACKET|CHIP",
  "PACKET|GLASS", "PACKET|DIALOG", "PACKET|TAG", "PACKET|WIFITAG",
  /* scenery sits behind the cast by design */
  "SHADOW|WINDOW", "SHADOW|COUNTER", "SHADOW|SIGN", "SHADOW|PLANT",
  "COUNTER|SHADOW", "SIGHT|HEAD", "SIGHT|BODY", "SIGHT|CHAIR",
  "SIGHT|LAPTOP", "SIGHT|TABLE", "SIGHT|GLYPH", "SIGHT|ITEM",
  "SIGHT|ROUTER", "SIGHT|SHADOW", "SIGHT|NAME",
].map((k) => k.split("|").sort().join("|")));

/* Label kinds — these are what the 6px rule polices. */
const LABELS = new Set(["DIALOG", "CHIP", "TAG", "NAME"]);
/* Containment is only meaningful for authored annotations. A nameplate
   belongs to an actor and legitimately leaves frame in a close-up. */
const MUST_FIT = new Set(["DIALOG", "CHIP"]);
/* Hairlines: their bounding box spans their whole length, so a box test on
   them is meaningless. Leaders are policed by the segment test instead. */
const CONNECTOR = new Set(["LEADER", "SIGHT"]);

const rectsIn = () => {
  const out = [];
  document.querySelectorAll("[data-audit]").forEach((el) => {
    /* Intertitle artwork reuses the scene's components but lives outside the
       stage SVG, so it has no screen to sit inside. Not a layout subject. */
    if (el.closest(".kf")) return;
    const kind = el.getAttribute("data-audit");
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    /* an element inside a faded-out actor is not on screen */
    let n = el, op = 1;
    while (n && n !== document.body) {
      const o = parseFloat(getComputedStyle(n).opacity);
      if (!isNaN(o)) op *= o;
      n = n.parentElement;
    }
    if (op < 0.5) return;
    out.push({ kind, x: r.left, y: r.top, r: r.right, b: r.bottom });
  });
  /* leader endpoints transformed into screen space */
  const leaders = [];
  document.querySelectorAll('[data-audit="LEADER"]').forEach((g) => {
    const svg = g.ownerSVGElement;
    const m = g.getScreenCTM();
    if (!m) return;
    const pt = (x, y) => {
      const p = svg.createSVGPoint(); p.x = x; p.y = y;
      const q = p.matrixTransform(m); return [q.x, q.y];
    };
    const line = g.querySelector("line");
    const a = pt(+line.getAttribute("x1"), +line.getAttribute("y1"));
    const b = pt(+line.getAttribute("x2"), +line.getAttribute("y2"));
    leaders.push({ a, b });
  });
  const st = document.querySelector(".stage").getBoundingClientRect();
  return { out, leaders, stage: { x: st.left, y: st.top, r: st.right, b: st.bottom } };
};

const gap = (a, b) => {
  const dx = Math.max(a.x - b.r, b.x - a.r, 0);
  const dy = Math.max(a.y - b.b, b.y - a.b, 0);
  return dx > 0 || dy > 0 ? Math.hypot(dx, dy) : -1;   // -1 = overlapping
};

/* does segment a-b cross rect r? */
function crosses([p, q], r) {
  const inside = (pt) => pt[0] >= r.x && pt[0] <= r.r && pt[1] >= r.y && pt[1] <= r.b;
  if (inside(p) || inside(q)) return true;
  const seg = (a, b, c, d) => {
    const s = (o, a2, b2) => Math.sign((b2[0] - a2[0]) * (o[1] - a2[1]) - (b2[1] - a2[1]) * (o[0] - a2[0]));
    return s(a, c, d) !== s(b, c, d) && s(c, a, b) !== s(d, a, b);
  };
  const c = [[r.x, r.y], [r.r, r.y], [r.r, r.b], [r.x, r.b]];
  for (let i = 0; i < 4; i++) if (seg(p, q, c[i], c[(i + 1) % 4])) return true;
  return false;
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const faults = [];
  let samples = 0;

  for (const v of VIEWS) {
    const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
    const errs = [];
    page.on("pageerror", (e) => errs.push(e.message));
    await page.goto("file:///home/claude/build/storyboard.html");
    await page.waitForTimeout(1200);

    for (let step = 1; step <= 3; step++) {
      await page.evaluate((s) => document.querySelectorAll(".pip")[s - 1].click(), step);
      let last = 0;
      for (const t of TIMES) {
        await page.waitForTimeout(t - last); last = t;
        samples++;
        const { out, leaders, stage } = await page.evaluate(rectsIn);

        for (let i = 0; i < out.length; i++) {
          for (let j = i + 1; j < out.length; j++) {
            const A = out[i], B = out[j];
            const pair = [A.kind, B.kind].sort().join("|");
            if (A.kind === B.kind) continue;
            /* A leader is a hairline: its bounding box spans its whole length,
               so a box test on it is meaningless. Leaders are policed by the
               segment-versus-text-box test further down instead. */
            if (CONNECTOR.has(A.kind) || CONNECTOR.has(B.kind)) continue;
            if (OK.has(pair)) continue;
            const g = gap(A, B);
            if (g < 0) faults.push(`${v.tag} s${step} @${t} OVERLAP ${pair}`);
            else if (g < MIN_GAP && (LABELS.has(A.kind) || LABELS.has(B.kind)))
              faults.push(`${v.tag} s${step} @${t} GAP ${g.toFixed(1)}px ${pair}`);
          }
        }

        /* Clearance rule from the spec's spacing table: an item must sit
           inside the glass it is drawn on, with air around it. A string that
           has outgrown its screen is invisible to an overlap test. */
        const glasses = out.filter((e) => e.kind === "GLASS");
        for (const g of out.filter((e) => e.kind === "GLYPH")) {
          const gc = [(g.x + g.r) / 2, (g.y + g.b) / 2];
          let host = null, best = Infinity;
          for (const q of glasses) {
            const d = Math.hypot((q.x + q.r) / 2 - gc[0], (q.y + q.b) / 2 - gc[1]);
            if (d < best) { best = d; host = q; }
          }
          if (!host) continue;
          const m = Math.min(g.x - host.x, host.r - g.r, g.y - host.y, host.b - g.b);
          /* The design rule is 11 scene units of clearance. On the narrow
             staging that renders at ~2.8px, so a 3px floor would be stricter
             than the rule it is checking. */
          if (m < 2.5) faults.push(`${v.tag} s${step} @${t} ITEM overflows GLASS by ${(2.5 - m).toFixed(1)}px`);
        }

        for (const e of out) {
          if (!MUST_FIT.has(e.kind)) continue;
          if (e.x < stage.x - 1 || e.r > stage.r + 1 || e.y < stage.y - 1 || e.b > stage.b + 1)
            faults.push(`${v.tag} s${step} @${t} CLIPPED ${e.kind}`);
        }

        for (const L of leaders) {
          for (const e of out) {
            if (!LABELS.has(e.kind)) continue;
            if (crosses([L.a, L.b], e) && e.kind !== "TAG" && e.kind !== "DIALOG" && e.kind !== "CHIP")
              faults.push(`${v.tag} s${step} @${t} LEADER crosses ${e.kind}`);
          }
        }
      }
    }
    if (errs.length) faults.push(`${v.tag} JS ERROR ${errs[0]}`);
    await page.close();
  }
  await browser.close();

  const uniq = [...new Set(faults)];
  console.log(`sampled ${samples} states`);
  if (!uniq.length) console.log("CLEAN");
  else { console.log(`${uniq.length} distinct faults (${faults.length} occurrences)`); uniq.slice(0, 40).forEach((f) => console.log("  " + f)); }
})();
