/* THE BROAD STORY, WITH EVERY WORD HIDDEN.
   Not "can a harness read the captions" — can the SHAPE of the sequence still
   carry it: a public colour everyone sees, two private ones that stay home,
   two mixtures that cross, a matching final colour that does not, a shared
   key, a protected message, Eve with traffic and no key, Bob with the original. */
const { KEYS, reach, launch } = require("./drive");
const HIDE = `.insp-say,.tk-l,.tk-h,.tk-n,.cin-who,.flm-turn,.grab-hint,
  .flm-nokey b,.flm-peek,.flm-more,.cin-ctl,.tk-note b{visibility:hidden !important}`;

const shot = () => {
  const zone = (e) => e.closest(".flm-a") ? "alice" : e.closest(".flm-b") ? "bob"
    : e.closest(".flm-lane") ? "wire" : e.closest(".flm-net") ? "eve" : "?";
  const st = document.querySelector(".flm-stage").getBoundingClientRect();
  const o = {};
  for (const e of document.querySelectorAll(".flm-obj[data-obj]")) {
    const r = e.getBoundingClientRect(), c = getComputedStyle(e);
    if (r.width < 2 || c.visibility === "hidden" || +c.opacity < .05) continue;
    const f = e.querySelector("svg > [fill]:not([fill=none])");
    o[e.dataset.obj] = { zone: zone(e), h: +(r.height / st.height).toFixed(3),
      colour: f ? f.getAttribute("fill") : null,
      masked: !!e.querySelector(".tk-masked") || e.classList.contains("covers-late"),
      role: (e.querySelector(".tk") || { className: "" }).className
        .match(/tk-(private|public|secret|key|cipher|seal|message|payload)/)?.[1] || null };
  }
  return { objs: o, cam: (document.querySelector(".flm").className.match(/cam-(\w+)/) || [])[1] };
};

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  await p.addStyleTag({ content: HIDE });
  const F = {};
  for (const k of KEYS) {
    await p.evaluate((x) => window.__cin(x), k);
    /* long enough for a continuous crossing to have happened */
    /* A frame that MAKES something only shows the parents while it is making
       it — afterwards the spent parent has given up its place, which is the
       point. Lineage is therefore read during the motion, not after it. */
    const MAKES = /mixAout|mixB|combAout|combB|protect/.test(k);
    await p.waitForTimeout(/crossA|crossB|journey|exchange/.test(k) ? 8200 : MAKES ? 1500 : 2400);
    F[k] = await p.evaluate(shot);
    if (MAKES) {
      /* two readings per making beat: the parents are only on screen while
         the thing is being made, and the result only after. Reading one of
         them and calling it the frame is how a harness ends up testing the
         clock instead of the film. */
      const early = F[k];
      await p.waitForTimeout(3600);
      const late = await p.evaluate(shot);
      F[k] = { ...late, objs: { ...early.objs, ...late.objs } };
      F[k + ":early"] = early; F[k + ":late"] = late;
    }
  }
  await p.close(); await b.close();
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x ? "   " + x : ""}`); };
  const at = (k, id) => (F[k] && F[k].objs[id]) || null;
  const zn = (k, id) => { const o = at(k, id); return o ? o.zone : null; };

  console.log("\n--- the story, with nothing to read ---");
  ok(zn("base","base") === "wire" && F.base.cam === "wide",
    "1. one colour, in the open, with all three present");
  ok(zn("pickA","pa") === "alice" && zn("mixB","pb") === "bob"
     && at("pickA","pa").role === "private",
    "2. two private colours, one on each phone, drawn as locked");
  ok(zn("mixAout","qa") === "alice" && at("mixAout","qa").role === "public"
     && zn("mixB", "qb") === "bob",
    "3. each makes a mixture, drawn as shareable");
  /* the two crossings became one frame, so the test asks what that frame is
     answering: both mixtures on the wire, both copies with Eve, and both
     private values still at home */
  ok(zn("exchange","qa") === "wire" && zn("exchange","qb") === "wire"
     && zn("exchange","qa2") === "eve" && zn("exchange","qb2") === "eve"
     && zn("exchange","pa") === "alice" && zn("exchange","pb") === "bob",
    "4. both mixtures cross in one shot, Eve copies both, privates stay put",
    `wire ${zn("exchange","qa")}/${zn("exchange","qb")} · eve ${zn("exchange","qa2")}/${zn("exchange","qb2")} · home ${zn("exchange","pa")}/${zn("exchange","pb")}`);
  const privCrossed = KEYS.some((k) => ["pa","pb"].some((i) => ["wire","eve"].includes(zn(k, i))));
  ok(!privCrossed, "5. neither private colour is ever on the wire or with Eve");
  ok(at("combAout","sa").masked && at("combB","sb").masked,
    "6. both results form covered");
  ok(!at("reveal","sa").masked && !at("reveal","sb").masked
     && at("reveal","sa").colour === at("reveal","sb").colour,
    "7. and uncover together, the same colour", at("reveal","sa").colour);
  const finalCrossed = KEYS.some((k) => ["sa","sb"].some((i) => ["wire","eve"].includes(zn(k, i))));
  ok(!finalCrossed, "8. the final colour never crosses");
  ok(at("tokey","ka").role === "key" && at("tokey","ka").colour === at("tokey", "kb").colour
     && at("reveal","sa").role === "secret",
    "9. it becomes a differently-shaped key, the same on both",
    `ka=${(at("tokey","ka")||{}).colour} kb=${(at("tokey","kb")||{}).colour}`);
  const keyCrossed = KEYS.some((k) => ["ka","kb"].some((i) => ["wire","eve"].includes(zn(k, i))));
  ok(!keyCrossed, "10. the key never crosses either");
  ok(zn("protect","msg") === "alice" && at("protect","msg").role === "message",
    "11. a readable message, on Alice's phone");
  ok(zn("protect","pkt") === "alice" && !at("protect:late","msg"),
    "12. which becomes a packet before it leaves");
  ok(zn("journey","pkt2") === "eve", "13. Eve gets a copy of the packet");
  const plainOut = KEYS.some((k) => ["msg","plain"].some((i) => ["wire","eve"].includes(zn(k, i))));
  ok(!plainOut, "14. no readable message is ever on the wire or with Eve");
  ok(zn("open","plain") === "bob" && at("open","plain").role === "message",
    "15. and Bob ends with the readable message");
  /* ---- ancestry: nothing appears without a source already on screen ----- */
  const SRC = { qa: ["base","pa"], qb: ["base","pb"], qa2: ["qa"], qb2: ["qb"],
    sa: ["qb","pa"], sb: ["qa","pb"], ka: ["sa"], kb: ["sb"],
    pkt: ["msg","ka"], pkt2: ["pkt"], plain: ["pkt","kb"] };
  const birth = {};
  for (const k of KEYS) for (const id of Object.keys(F[k].objs)) if (!(id in birth)) birth[id] = k;
  const orphan = [];
  for (const [id, k] of Object.entries(birth)) {
    const src = SRC[id];
    if (!src) continue;                       /* chosen, minted or arriving */
    const i = KEYS.indexOf(k);
    const near = [F[k].objs, (F[KEYS[i - 1]] || { objs: {} }).objs];
    const missing = src.filter((x) => !near.some((o) => o[x]));
    if (missing.length) orphan.push(`${id}@${k} without ${missing.join("+")}`);
  }
  ok(orphan.length === 0, "16. every object has a visible source when it is born",
    orphan.join("; "));

  /* ---- and Bob shows nothing trusted before the check succeeds ---------- */
  const early = KEYS.slice(0, KEYS.indexOf("open")).filter((k) => F[k].objs.plain);
  ok(early.length === 0, "17. no readable message on Bob's phone before verification",
    early.join(","));

  /* the teaching object is never lost in the frame */
  const tiny = KEYS.filter((k) => { const v = Object.values(F[k].objs);
    return v.length && Math.max(...v.map((x) => x.h)) < .12; });
  ok(tiny.length === 0, "and nothing is left tiny in a large frame", tiny.join(", "));
  console.log(bad ? `\n${bad} STEP(S) NEED THE WORDS` : "\nTHE BROAD STORY READS WITH NO WORDS AT ALL");
})();
