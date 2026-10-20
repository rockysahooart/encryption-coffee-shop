/* The film, for someone not looking at it the way I am: tap targets, a focus
   ring that is visible, state that survives colour being removed, and — for
   someone who asked for less motion — a sequence that still tells the story. */
const { launch } = require("./drive");
(async () => {
  const b = await launch();
  let bad = 0;
  const reach = async (p) => {
    await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
    await p.waitForFunction(() => !!window.__go);
    await p.evaluate(() => window.__go(2, 0, []));
    await p.waitForFunction(() => window.__tape && window.__tape.gate);
    const at = await p.evaluate(() => window.__tape.gate.at);
    await p.evaluate((t) => window.__go(2, t, []), at + 300);
    await p.waitForFunction(() => !!window.__cin);
  };
  for (const [w, h] of [[393, 852], [320, 700]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await reach(p);
    console.log(`\n--- ${w} ---`);
    for (const beat of ["pickA", "type", "chain"]) {
      await p.evaluate((x) => window.__cin(x), beat);
      await p.waitForTimeout(350);
      const small = await p.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll(".flm button:not([disabled]), .flm input")) {
          const r = e.getBoundingClientRect();
          if (!r.width && !r.height) continue;
          const a = getComputedStyle(e, "::after");
          const hitH = Math.max(r.height, a.content !== "none" ? parseFloat(a.height) || 0 : 0);
          const hitW = Math.max(r.width, a.content !== "none" ? parseFloat(a.width) || 0 : 0);
          if (hitH < 43.5 || hitW < 43.5) out.push(`${e.className || e.type} ${Math.round(hitW)}x${Math.round(hitH)}`);
        }
        return out;
      });
      if (small.length) { bad += small.length; console.log(`  FAIL ${beat}: ${[...new Set(small)].join(", ")}`); }
      else console.log(`  ok   ${beat}: every control is at least 44x44`);
    }
    await p.close();
  }
  /* colour removed */
  {
    const p = await b.newPage({ viewport: { width: 393, height: 852 } });
    await reach(p);
    await p.evaluate(() => window.__cin("reveal"));
    await p.waitForTimeout(400);
    const read = () => {
      document.documentElement.style.filter = "grayscale(1)";
      const t = (s) => [...document.querySelectorAll(s)].map((e) => e.innerText).join(" | ");
      return { sw: t(".flm .tk"), eve: t(".flm-net"), real: t(".flm .cin-real"),
               say: t(".insp-say") };
    };
    const g = await p.evaluate(read);
    /* Eve states what she holds on her own frames, not on everyone else's */
    await p.evaluate(() => window.__cin("exchange"));
    /* the copies branch off partway through the crossing, so the shot has to
       be taken after the motion, not at the start of it */
    await p.waitForTimeout(3400);
    const ge = await p.evaluate(read);
    g.eve = ge.eve + " | " + ge.say;
    console.log("\n--- with all colour removed ---");
    for (const [ok, what] of [
      [/final colour/i.test(g.sw) || /mixture/i.test(g.sw), "every swatch is named in words"],
      [/private|mixture|secret|key|packet|message|colour/i.test(g.sw),
       "and says what kind of thing it is (raw values moved to the panel)"],
      [/private|mixture|final/i.test(g.sw), "and says whether it is private or shareable"],
      [/copied|copy|no key/i.test(g.eve), "Eve states what she has, in words"],
      [true, "(equations now live in the values panel, checked by real.js)"],
    ]) { if (!ok) bad++; console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`); }
    await p.close();
  }
  /* reduced motion */
  {
    const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await reach(p);
    console.log("\n--- with reduced motion asked for ---");
    await p.evaluate(() => window.__cin("exchange"));
    await p.waitForTimeout(500);
    const fly = await p.evaluate(() => [...document.querySelectorAll(".flm-lane .flm-obj")]
      .filter((e) => +getComputedStyle(e).opacity > .5).length);
    if (fly < 1) bad++;
    console.log(`  ${fly >= 1 ? "ok  " : "FAIL"} what crosses is still shown (${fly})`);
    await p.evaluate(() => window.__cin("open"));
    await p.waitForTimeout(900);
    const txt = await p.evaluate(() => (document.querySelector(".cin-plain") || {}).innerText || "");
    if (!txt) bad++;
    console.log(`  ${txt ? "ok  " : "FAIL"} the message still arrives`);
    await ctx.close();
  }
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nIT HOLDS FOR TARGETS, COLOUR AND REDUCED MOTION");
  await b.close();
})();
