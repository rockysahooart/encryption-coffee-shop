/* THE SUBJECT DOMINATES THE FRAME, AS A NUMBER.
   "Drastic zoom" is checked, not hoped for: when a character owns the beat,
   the character and their device together must occupy 50-70% of the stage
   height, and nothing unrelated may hold the focal area. */
const { chromium } = require("playwright");
const SUBJ = { a: ".flm-a", b: ".flm-b", eve: ".flm-net" };

const probe = () => {
  const flm = document.querySelector(".flm");
  const cam = (flm.className.match(/cam-(\w+)/) || [])[1];
  const st = document.querySelector(".flm-stage").getBoundingClientRect();
  const of = (sel) => {
    const s = document.querySelector(sel); if (!s) return null;
    const f = s.querySelector(".cin-face"), ph = s.querySelector(".flm-ph-body, .flm-eve-scr");
    if (!f) return null;
    const a = f.getBoundingClientRect();
    const b = ph ? ph.getBoundingClientRect() : a;
    const top = Math.min(a.top, b.top), bot = Math.max(a.bottom, b.bottom);
    return (bot - top) / st.height;
  };
  /* how much of the focal area anything else is holding */
  const others = ["a", "b", "eve"].filter((w) => w !== cam)
    .map((w) => ({ w, f: of({ a: ".flm-a", b: ".flm-b", eve: ".flm-net" }[w]) }))
    .filter((x) => x.f != null);
  return { frame: flm.getAttribute("data-frame"), cam,
    subject: ["a", "b", "eve"].includes(cam) ? of({ a: ".flm-a", b: ".flm-b", eve: ".flm-net" }[cam]) : null,
    others: others.map((x) => +x.f.toFixed(3)) };
};

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  let bad = 0;
  for (const [w, h] of [[393, 852], [1440, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
    await p.waitForFunction(() => !!window.__go);
    await p.evaluate(() => window.__go(2, 0, []));
    await p.waitForFunction(() => window.__tape && window.__tape.gate);
    const at = await p.evaluate(() => window.__tape.gate.at);
    await p.evaluate((t) => window.__go(2, t, []), at + 300);
    await p.waitForFunction(() => !!window.__cin, null, { timeout: 25000 });
    await p.waitForTimeout(400);
    console.log(`\n=== ${w}x${h} ===`);
    const frames = await p.evaluate(() => window.__film || null);
    const { KEYS } = require("./drive");
    for (const k of KEYS) {
      await p.evaluate((x) => window.__cin(x), k);
      await p.waitForTimeout(700);
      const r = await p.evaluate(probe);
      if (r.subject == null) continue;           /* wide and both shots are ensembles */
      const pct = (r.subject * 100).toFixed(0);
      /* The window has moved twice, and this is the third setting: 50-70%,
         then 60-75%, now 78-99%. The brief that set it asks for the phone to
         be the stage rather than a prop in a dark field, and a close-up that
         leaves a fifth of the frame empty is the fault being corrected. The
         clearance test tightened with it: "strongly subordinate" is not the
         same as "slightly smaller", so the next largest figure may be at most
         a third of the subject. */
    const okScale = r.subject >= .78 && r.subject <= .995;
      const biggest = r.others.length ? Math.max(...r.others) : 0;
      const okClear = biggest < r.subject * .35;
      if (!okScale || !okClear) bad++;
      console.log(`  ${k.padEnd(7)} ${okScale && okClear ? "ok  " : "✗   "} subject ${pct}% of the stage` +
        (r.others.length ? `  ·  next largest ${(biggest * 100).toFixed(0)}%` : ""));
    }
    await p.close();
  }
  console.log(bad ? `\n${bad} FRAME(S) DO NOT FILL THE FRAME` : "\nTHE SUBJECT OWNS 78-99% OF THE STAGE ON EVERY CLOSE SHOT");
  await b.close();
})();
