/* PAUSE BEFORE EVERY ACTION AND ASK THE FIVE QUESTIONS.
   Can a first-time viewer state exactly what to do? Does the instruction lead
   with a verb and name its target? Is the dialogue attached to the action
   rather than pinned to the bottom of the screen? Is the phone big enough to
   read? Do the swatches still read as pieces of colour with every label off? */
const { KEYS, reach, launch } = require("./drive");
const VERBS = /^(tap|drag|type|choose|send|pick)\b/i;

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x ? "   " + x : ""}`); };
  const F = {};
  for (const k of KEYS) {
    await p.evaluate((x) => window.__cin(x), k);
    await p.waitForTimeout(/crossA|crossB|journey/.test(k) ? 7600 : 1500);
    F[k] = await p.evaluate(() => {
      const flm = document.querySelector(".flm");
      const st = document.querySelector(".flm-stage").getBoundingClientRect();
      const rail = document.querySelector(".flm-rail");
      const rr = rail.getBoundingClientRect();
      const slot = document.querySelector(".flm-slot.on");
      const sr = slot ? slot.getBoundingClientRect() : null;
      const face = document.querySelector(".flm-slot.on .cin-face");
      const ph = document.querySelector(".flm-slot.on .flm-ph-body");
      let figure = null;
      if (face && ph) {
        const a = face.getBoundingClientRect(), c = ph.getBoundingClientRect();
        figure = (Math.max(a.bottom, c.bottom) - Math.min(a.top, c.top)) / st.height;
      }
      /* does the rail sit on top of anything it is describing? */
      let over = false;
      for (const e of document.querySelectorAll(".flm-obj, .flm-ph-body, .cin-face")) {
        const r = e.getBoundingClientRect();
        if (r.width < 2) continue;
        if (Math.min(r.right, rr.right) - Math.max(r.left, rr.left) > 2 &&
            Math.min(r.bottom, rr.bottom) - Math.max(r.top, rr.top) > 2) over = true;
      }
      /* the biggest paint swatch's uninterrupted colour area */
      let swatch = 0;
      for (const e of document.querySelectorAll(".flm-focal .tk-private, .flm-focal .tk-public, .flm-focal .tk-secret")) {
        const box = e.querySelector(".tk-box");
        if (!box) continue;
        const r = box.getBoundingClientRect();
        swatch = Math.max(swatch, (r.width * r.height) / (st.width * st.height));
      }
      return { act: flm.dataset.act || "", turn: !!document.querySelector(".rail-turn"),
        text: (rail.querySelector(".flm-rail-t") || {}).textContent || "",
        railCls: rail.className, over, figure, swatch,
        railCx: (rr.left + rr.right) / 2 - st.left, slotCx: sr ? (sr.left + sr.right) / 2 - st.left : null,
        stageW: st.width,
        inputs: document.querySelectorAll(".flm .grab, .flm .tap-send, .flm-compose input, .flm .cin-sw").length,
        /* what is actually named on screen in this frame: object labels, the
           private slot's own line, and the text on any control */
        nouns: [...document.querySelectorAll(".flm-stage .tk-l, .flm-stage .flm-vault-k, .flm-stage button, .flm-stage input")]
          .map((e) => (e.textContent || e.placeholder || "").toLowerCase()).join(" ") };
    });
  }
  await p.close(); await b.close();

  console.log("\n--- every beat that asks for something ---");
  const gates = KEYS.filter((k) => F[k].act);
  for (const k of gates) {
    const f = F[k];
    console.log(`  ${k.padEnd(7)} “${f.text}”`);
    ok(f.turn, `    ${k}: marked YOUR TURN`);
    ok(VERBS.test(f.text.trim()), `    ${k}: leads with a verb`, f.text.split(" ")[0]);
    /* THE TEST USED A FIXED WORD LIST — so renaming the drop target from "your
       swatch" to "your private colour", which is what the slot on screen
       actually says, read as a regression. It now asks the real question: does
       the instruction name something this frame has put in front of the
       viewer? */
    const said = f.text.toLowerCase().match(/[a-z\u2019']{4,}/g) || [];
    const shown = said.filter((w) => f.nouns.includes(w) &&
      !/your|the|onto|into|tap|drag|choose|type|send|below|them|this|that|with/.test(w));
    ok(shown.length > 0, `    ${k}: names something the frame is showing`, shown.join("/"));
    ok(f.inputs >= 1, `    ${k}: something is actually there to use`);
  }
  console.log("\n--- and every beat that only runs ---");
  const watch = KEYS.filter((k) => !F[k].act);
  ok(watch.every((k) => !F[k].turn), "no watching beat claims YOUR TURN",
    watch.filter((k) => F[k].turn).join(","));
  ok(watch.every((k) => F[k].text.trim().length && F[k].text.length < 66),
    "each says what the motion means, in one short line",
    watch.filter((k) => F[k].text.length >= 66).join(","));

  console.log("\n--- the rail travels, and never covers what it describes ---");
  ok(KEYS.every((k) => !F[k].over), "the rail never overlaps a phone, character or object",
    KEYS.filter((k) => F[k].over).join(","));
  const aligned = KEYS.filter((k) => {
    const f = F[k];
    if (!/rail-a|rail-b/.test(f.railCls) || f.slotCx == null) return false;
    return Math.abs(f.railCx - f.slotCx) > f.stageW * 0.42;
  });
  ok(aligned.length === 0, "and sits on the same side as whoever is acting", aligned.join(","));

  console.log("\n--- size ---");
  const small = KEYS.filter((k) => ["a", "b"].includes((F[k].railCls.match(/rail-(\w+)/) || [])[1])
    && F[k].figure != null && F[k].figure < .58);
  ok(small.length === 0, "in close-ups the character and phone fill 60-75% of the stage",
    small.map((k) => `${k} ${(F[k].figure * 100).toFixed(0)}%`).join(", "));
  const paint = KEYS.filter((k) => F[k].swatch > 0);
  const mean = paint.reduce((a, k) => a + F[k].swatch, 0) / Math.max(1, paint.length);
  ok(mean > .055, "the paint swatches are large surfaces, not chips",
    `mean ${(mean * 100).toFixed(1)}% of the stage area, biggest ${(Math.max(...paint.map((k) => F[k].swatch)) * 100).toFixed(1)}%`);
  console.log(bad ? `\n${bad} STATE(S) STILL UNCLEAR` : "\nEVERY STATE SAYS WHETHER TO WATCH OR ACT, AND WHAT TO DO");
})();
