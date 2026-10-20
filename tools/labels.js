/* THE REVIEW LABEL MATCHES THE STORYBOARD, AND TOUCHES NOTHING.
   Every beat shows the label drive.js LABELS assigns it (and the timed
   sub-states of LABEL_SUB); the café walks 0a → 0d; exactly one label is
   ever visible; and the label is out of the layout — absolutely positioned,
   inert, unanimated — and overlaps no dialogue, control or phase cue. */
const { KEYS, reach, launch, LABELS, LABEL_SUB } = require("./drive");

const probe = () => {
  const ls = [...document.querySelectorAll(".ref-label")].filter((e) => {
    const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).display !== "none"; });
  if (ls.length !== 1) return { n: ls.length, text: ls.map((e) => e.textContent).join(",") };
  const e = ls[0], cs = getComputedStyle(e), r = e.getBoundingClientRect();
  const hit = [...document.querySelectorAll(".flm-rail, .flm-arc-i b, button, input, .insp-say, .cin-who")]
    .filter((o) => { const q = o.getBoundingClientRect(); return q.width && q.height &&
      Math.min(r.right, q.right) - Math.max(r.left, q.left) > 0 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 0; })
    .map((o) => (o.className || o.tagName).toString().slice(0, 24));
  return { n: 1, text: e.textContent, pos: cs.position, pe: cs.pointerEvents, anim: cs.animationName,
    size: parseFloat(cs.fontSize), hit };
};

(async () => {
  const b = await launch();
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; if (!c || process.env.VERBOSE) console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x ? "   " + x : ""}`); };
  const check = (r, want, where) => {
    ok(r.n === 1, `${where}: exactly one label`, r.n !== 1 ? `${r.n} (${r.text})` : "");
    if (r.n !== 1) return;
    ok(r.text === want, `${where}: shows ${want}`, r.text !== want ? `got ${r.text}` : "");
    ok(r.pos === "absolute" && r.pe === "none" && r.anim === "none", `${where}: out of the layout and inert`);
    ok(r.size >= 9, `${where}: legible`);
    ok(!r.hit.length, `${where}: overlaps nothing`, r.hit.join(" "));
  };
  for (const [w, h] of [[1440, 900], [393, 852]]) {
    console.log(`\n--- ${w}x${h} ---`);
    const p = await b.newPage({ viewport: { width: w, height: h } });
    /* the café, then the hand-off into the film */
    await p.goto("file://" + require("path").resolve(__dirname, "..", "index.html"));
    await p.waitForFunction(() => !!window.__go);
    await p.evaluate(() => window.__go(1, 0, []));
    await p.waitForFunction(() => window.__tape && window.__tape.dur);
    const dur = await p.evaluate(() => window.__tape.dur);
    const seenCafe = [];
    for (let t = 400; t < dur; t += 1500) {
      await p.evaluate((t) => window.__go(1, t, []), t); await p.waitForTimeout(260);
      const r = await p.evaluate(probe);
      if (r.n === 1 && seenCafe[seenCafe.length - 1] !== r.text) seenCafe.push(r.text);
      if (r.n > 1) ok(false, `café t=${t}: one label`, r.text);
      if (r.n === 1) ok(!r.hit.length, `café t=${t}: overlaps nothing`, r.hit.join(" "));
    }
    ok(seenCafe.join(" ") === "0a 0b 0c 0d", "the café walks 0a → 0b → 0c → 0d", seenCafe.join(" "));
    await reach(p);
    for (const k of KEYS) {
      await p.evaluate((x) => window.__cin(x), k);
      await p.waitForTimeout(300);
      check(await p.evaluate(probe), LABELS[k], k);
      for (const [ms, lab] of LABEL_SUB[k] || []) {
        await p.evaluate((x) => window.__cin(x), k);
        await p.waitForTimeout(ms + 350);
        check(await p.evaluate(probe), lab, `${k} +${ms}ms`);
      }
    }
    await p.close();
  }
  await b.close();
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nEVERY FRAME CARRIES ITS STORYBOARD LABEL, AND THE LABEL TOUCHES NOTHING");
})();
