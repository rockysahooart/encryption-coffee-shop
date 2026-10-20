/* NOTHING PAINTS OVER ANYTHING, AT ANY FRAME, AT ANY SIZE.
   Thirty-four frames at five widths. Checks that no region overflows its row,
   that a value never hangs out of the stage and into the equation beneath it,
   that nothing clips its own text, and that the maths is never dimmed. */
const { chromium } = require("playwright");
const B = ["problem","pickA","base","mixA","mixAout","sendA","crossA","mixB","mixBout","crossB","combA","combAout","combBin","combB","reveal","secret","tokey","keys","type","protect","pktOut","journey","eveFail","arrive","open","chain"];

const probe = () => {
  const box = (s) => { const e = document.querySelector(s); if (!e) return null;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1 ? r : null; };
  const over = (a, b) => a && b &&
    Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  const out = [];
  for (const [a, b] of [[".flm-a", ".cin-real"], [".flm-b", ".cin-real"],
                        [".flm-net", ".cin-real"], [".flm-a", ".cin-ctl"],
                        [".flm-b", ".cin-ctl"], [".flm-a", ".flm-net"],
                        [".flm-b", ".flm-net"], [".cin-real", ".cin-ctl"],
                        [".flm-a", ".flm-lane"], [".flm-b", ".flm-lane"]])
    if (over(box(a), box(b))) out.push(`${a} paints over ${b}`);
  const st = box(".flm-stage"), rb = box(".cin-real"), cb = box(".cin-ctl");
  for (const e of document.querySelectorAll(".flm-stage .tk, .flm-stage .cin-face, .flm-stage .flm-obj, .flm-stage .flm-ph-body, .flm-stage .flm-eve-scr")) {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const nm = e.className.split(" ")[0] + (e.dataset && e.dataset.obj ? "#" + e.dataset.obj : "");
    if (over(r, rb)) out.push("the stage paints over the equation (" + nm + ")");
    if (over(r, cb)) out.push("the stage paints over the controls (" + nm + ")");
    if (st && r.bottom > st.bottom + 3) out.push("hangs out of the stage: " + nm + " " + Math.round(r.bottom - st.bottom) + "px");
  }
  const cin = box(".flm"), insp = box(".insp");
  if (cin && insp && (cin.bottom > insp.bottom + 2)) out.push("the film overflows the module");
  /* the device itself must stay inside the stage: a phone that grew past the
     frame is the loudest possible layout fault and nothing was watching for it */
  const stg = box(".flm-stage");
  /* devices belong to the stage; the colour tray is its own row beneath it,
     so it is measured against the module instead */
  for (const sel of [".flm-ph-body", ".flm-eve-scr"])
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect();
      if (r.height < 2) continue;
      if (stg && (r.top < stg.top - 3 || r.bottom > stg.bottom + 3))
        out.push(`${sel} runs outside the stage by ${Math.round(Math.max(stg.top - r.top, r.bottom - stg.bottom))}px`);
    }
  const mod = box(".flm");
  for (const sel of [".cin-pick", ".cin-sw", ".flm-rail"])
    for (const e of document.querySelectorAll(sel)) {
      const r = e.getBoundingClientRect();
      if (r.height < 2) continue;
      if (mod && (r.top < mod.top - 3 || r.bottom > mod.bottom + 3 ||
                  r.left < mod.left - 3 || r.right > mod.right + 3))
        out.push(`${sel} runs outside the module`);
    }
  for (const e of document.querySelectorAll(".flm *")) {
    if (e.children.length || !e.textContent.trim()) continue;
    const c = getComputedStyle(e);
    if (c.overflow === "visible" || c.display === "none") continue;
    if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)
      out.push(`clipped: "${e.textContent.trim().slice(0, 24)}"`);
  }
  for (const e of document.querySelectorAll(".flm .cin-eq, .flm .cin-eq *"))
    if (+getComputedStyle(e).opacity < .999) out.push("the maths is dimmed");
  return [...new Set(out)];
};

(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  let bad = 0;
  for (const [w, h] of [[1440, 900], [1024, 800], [393, 852], [360, 780], [320, 700]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
    /* the film lives in the second act; the café has to be played past first */
    await p.waitForFunction(() => !!window.__go);
    await p.evaluate(() => window.__go(2, 0, []));
    await p.waitForFunction(() => window.__tape && window.__tape.gate);
    const at = await p.evaluate(() => window.__tape.gate.at);
    await p.evaluate((t) => window.__go(2, t, []), at + 300);
    await p.waitForFunction(() => !!window.__cin, null, { timeout: 20000 });
    await p.waitForTimeout(400);
    console.log(`\n--- ${w}x${h} ---`);
    let n = 0;
    for (const beat of B) {
      await p.evaluate((x) => window.__cin(x), beat);
      /* the object travel is deliberate and passes outside its container while
         it is in the air; this checks the composed frame, once it has settled */
      await p.waitForTimeout(/crossA|crossB|journey/.test(beat) ? 7600 : 1400);
      const issues = await p.evaluate(probe);
      if (issues.length) { n += issues.length; console.log(`  ${beat}: ${issues.join("; ")}`); }
    }
    if (!n) console.log("  every beat fits, nothing overlaps, the maths stays lit");
    bad += n;
    await p.close();
  }
  console.log(bad ? `\n${bad} ISSUE(S)` : "\nTHE FILM FITS AT EVERY INTENDED SIZE");
  await b.close();
})();
