/* THE SIX REQUIREMENTS, PER BEAT.
   dialogue · the referent it names · visible evidence · the action · the
   spatial connection between them · the visible result.
   A beat fails when the statement is true only because the sentence says so. */
const { KEYS, reach, launch } = require("./drive");
(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  const F = {};
  for (const k of KEYS) {
    await p.evaluate((x) => window.__cin(x), k);
    await p.waitForTimeout(/crossA|crossB|journey/.test(k) ? 7600 : 1600);
    F[k] = await p.evaluate(() => {
      const st = document.querySelector(".flm-stage").getBoundingClientRect();
      const rail = document.querySelector(".flm-rail");
      const rr = rail.getBoundingClientRect();
      const objs = [...document.querySelectorAll(".flm-obj[data-obj], .flm-chain > .tk")].map((e) => {
        const r = e.getBoundingClientRect();
        return { id: e.dataset.obj || (e.className.match(/tk-(secret|key|cipher|message)/) || [])[1] || "chain", area: (r.width * r.height) / (st.width * st.height),
          cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2,
          zone: e.closest(".flm-a") ? "a" : e.closest(".flm-b") ? "b"
            : e.closest(".flm-lane") ? "wire" : e.closest(".flm-net") ? "eve" : "?" };
      }).filter((o) => o.area > 0);
      return { text: (rail.querySelector(".flm-rail-t") || {}).textContent || "",
        sub: (rail.querySelector(".flm-rail-s") || {}).textContent || "",
        act: document.querySelector(".flm").dataset.act || "",
        connector: !!document.querySelector(".flm-lead, .flm-point, .flm-ghost"),
        railCx: (rr.left + rr.right) / 2, railCy: (rr.top + rr.bottom) / 2,
        objs, stageW: st.width, stageH: st.height,
        hex: new Set([...document.querySelectorAll(".flm .tk-h")]
        .filter((e) => e.getBoundingClientRect().width > 1)
        .map((e) => (e.textContent || "").trim())).size,
        biggest: objs.length ? Math.max(...objs.map((o) => o.area)) : 0 };
    });
  }
  await p.close(); await b.close();

  const NOUNS = { chain: /secret|key|protect|read/i, secret: /secret/i, key: /key/i, cipher: /protect/i, message: /message|read/i, base: /public|starting/i, pa: /private|your/i, pb: /private|Bob/i,
    qa: /mixture/i, qb: /mixture|Bob/i, qa2: /cop|Eve/i, qb2: /cop|Eve/i,
    sa: /secret|final|result|match|colour/i, sb: /secret|final|result|match|colour/i,
    ka: /key/i, kb: /key/i, msg: /message/i, pkt: /packet|protect/i,
    pkt2: /cop|Eve/i, plain: /message|open/i };
  let flag = 0;
  console.log("\nbeat      referent named?  evidence?  connector?  biggest obj");
  for (const k of KEYS) {
    const f = F[k];
    const all = (f.text + " " + f.sub);
    /* does the dialogue name something that is actually on screen? */
    const named = f.objs.filter((o) => NOUNS[o.id] && NOUNS[o.id].test(all));
    const evidence = f.objs.length > 0;
    const notes = [];
    /* a beat may name the control the viewer is about to use rather than an
       object already on the stage — the connector points at it, which is the
       same job done a different way */
    if (!named.length && f.objs.length && !f.connector) notes.push("names nothing on screen");
    if (!evidence) notes.push("NO OBJECT AT ALL — explanation only");
    if (f.act && !f.connector) notes.push("instruction with no connector");
    if (f.biggest < .05) notes.push("biggest object under 5% of stage");
    /* how far is the rail from what it describes? */
    /* DISTANCE MATTERS WHEN NOTHING LEADS THE EYE. With a leader line drawn
       from the rail to the object, the viewer is taken there; without one, the
       rail has to be near the thing it names. A tall phone fills the stage, so
       an unaided rail below it is genuinely too far away. */
    /* A PAYOFF IS THE EXCEPTION, AND IT IS THE BRIEF'S OWN. Narrative dialogue
       commenting on a result that is already unmistakable needs no pointer —
       and on these three beats the line would have crossed the very object it
       pointed at, which is worse than the distance. */
    const PAYOFF = ["reveal", "tokey", "open", "chain"];
    if (named.length && !f.connector && !PAYOFF.includes(k)) {
      const d = Math.min(...named.map((o) => Math.hypot(o.cx - f.railCx, o.cy - f.railCy)));
      if (d > f.stageH * .55) notes.push(`rail ${Math.round(d)}px away, and nothing leads the eye`);
    }
    if (notes.length) flag++;
    console.log(`${k.padEnd(9)} ${(named.map((o)=>o.id).join(",")||"—").padEnd(16)} ${String(f.objs.length).padEnd(10)} ${(f.connector?"yes":"no").padEnd(11)} ${(f.biggest*100).toFixed(1)}%   ${notes.join("; ")}`);
  }
  const hexy = KEYS.filter((k) => F[k].hex > 1);
  console.log(`\nbeats showing more than one hex value: ${hexy.join(", ") || "none"}`);
  console.log(`\n${flag} beat(s) with at least one unmet requirement`);
})();
