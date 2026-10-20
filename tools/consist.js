/* IS THE SAME OBJECT THE SAME OBJECT, SCENE TO SCENE? */
const { chromium } = require("playwright");
const { KEYS, reach } = require("./drive");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  const F = {};
  for (const k of KEYS) {
    await p.evaluate((x) => window.__cin(x), k);
    /* a frame that makes a colour in view is only at rest after it has made it:
       sampling at 1600ms caught the newborn mid-birth at scale(.5) and called
       it a shrink */
    await p.waitForTimeout(/crossA|crossB|journey/.test(k) ? 7600
      : /mixAout|mixBout|combAout|combB|mine/.test(k) ? 5200 : 1600);
    F[k] = await p.evaluate(() => {
      const st = document.querySelector(".flm-stage").getBoundingClientRect();
      const o = {};
      for (const e of document.querySelectorAll(".flm-obj[data-obj]")) {
        const box = e.querySelector(".tk-box") || e;
        const r = box.getBoundingClientRect();
        if (r.width < 2) continue;
        const tk = e.querySelector(".tk");
        o[e.dataset.obj] = {
          w: Math.round(r.width), h: Math.round(r.height),
          area: +(r.width * r.height / (st.width * st.height) * 100).toFixed(1),
          role: tk ? (tk.className.match(/tk-(private|public|secret|key|cipher|message|payload|nonce|seal)/) || [])[1] : null,
          zone: e.closest(".flm-a") ? "a" : e.closest(".flm-b") ? "b"
            : e.closest(".flm-lane") ? "wire" : e.closest(".flm-net") ? "eve" : "?",
          cx: +((r.left + r.width / 2 - st.left) / st.width).toFixed(3),
          cy: +((r.top + r.height / 2 - st.top) / st.height).toFixed(3),
          geom: (() => {
            const svg = e.querySelector("svg.tk-art");
            if (!svg) return null;
            const fills = [...svg.querySelectorAll("[fill]")].filter((n) => {
              const f = n.getAttribute("fill"); return f && f !== "none"; });
            const rings = [...svg.querySelectorAll("circle")].filter((n) =>
              (n.getAttribute("fill") || "none") === "none" && +n.getAttribute("r") > 6).length >= 2;
            const plate = fills.map((n) => n.tagName === "rect"
              ? +n.getAttribute("width") * +n.getAttribute("height") : 0)
              .sort((x, y) => y - x)[0] || 0;
            return { fills: fills.length, rings, plate: plate ? plate + "u\u00b2" : null,
              ply: !!svg.querySelector(".tk-ply") };
          })() };
      }
      const lead = document.querySelector(".flm-lead-o");
      return { objs: o, leadAt: lead ? { x: +lead.getAttribute("cx"), y: +lead.getAttribute("cy") } : null };
    });
  }
  await p.close(); await b.close();
  const at = (k, id) => (F[k] && F[k].objs[id]) || null;

  console.log("\n--- 1. is the shared secret still a colour swatch? ---");
  /* the old check read the CLASS NAME, which is tk-secret whatever the SVG
     draws, so it reported rings for a swatch. It now reads the geometry. */
  const sa = at("reveal", "sa"), sb = at("reveal", "sb");
  for (const [id, o] of [["sa", sa], ["sb", sb]]) {
    if (!o) { console.log(`   ${id}: absent`); continue; }
    const g = o.geom || {};
    const verdict = g.rings ? "   \u2190 DRAWN AS RINGS, not a swatch"
      : g.plate ? "   plate " + g.plate + ", ply " + (g.ply ? "yes" : "no")
      : "   \u2190 no colour plate found";
    console.log(`   ${id}  role=${o.role}  fills=${g.fills}` + verdict);
  }
  const plates = ["mixA/base", "mixAout/qa", "reveal/sa"].map((k) => {
    const [b2, i2] = k.split("/"); const o = at(b2, i2);
    return k + " " + (o && o.geom && o.geom.plate || "—");
  });
  console.log("   the same plate in every role? " + plates.join("   "));

  console.log("\n--- 2. does a colour shrink as it becomes more important? ---");
  const chain = [["pickA", "pa"], ["mine", "pa"], ["mixA", "pa"], ["mixAout", "qa"], ["sendA", "qa"],
    ["combA", "qb"], ["combAout", "sa"], ["reveal", "sa"], ["tokey", "ka"], ["tokey", "ka"]];
  let prev = null, prevK = null;
  for (const [k, id] of chain) {
    const o = at(k, id);
    if (!o) { console.log(`   ${k}/${id}  absent`); continue; }
    /* a close-up and a two-up comparison are different camera scales; a step
       between them is a camera move, and the harness says which it saw */
    const WIDE = ["reveal", "asmath", "tokey", "tokey", "chain", "base", "crossA", "crossB", "journey"];
    const camChange = WIDE.includes(k) !== WIDE.includes(prevK || k);
    const arrow = prev && o.area < prev * 0.8
      ? (camChange ? "  (camera pulls back for the two-up)" : "  ← SHRANK") : "";
    console.log(`   ${(k + "/" + id).padEnd(16)} ${String(o.w).padStart(4)}x${String(o.h).padEnd(4)} ${String(o.area).padStart(5)}%${arrow}`);
    prev = o.area; prevK = k;
  }

  console.log("\n--- 3. are Alice and Bob mirrored? ---");
  /* compare frames that do the same job, not frames that merely hold the same
     kind of object: pickA has a picker under it and mixB does not, so their
     vertical centres were never going to agree */
  for (const [ka, ida, kb, idb] of [["mixA","pa","mixB","pb"],["mixAout","qa","mixB","qb"],
                                    ["combAout","sa","combB","sb"],["tokey","ka","tokey","kb"]]) {
    const A = at(ka, ida), B = at(kb, idb);
    if (!A || !B) { console.log(`   ${ida} vs ${idb}: missing`); continue; }
    const dw = Math.abs(A.w - B.w), dh = Math.abs(A.h - B.h);
    const dy = Math.abs(A.cy - B.cy);
    const sym = Math.abs((1 - A.cx) - B.cx);
    console.log(`   ${(ida + " vs " + idb).padEnd(12)} size ${A.w}x${A.h} / ${B.w}x${B.h}` +
      `  Δsize ${dw}x${dh}  Δy ${dy.toFixed(3)}  mirror-x ${sym.toFixed(3)}` +
      (dw > 8 || dh > 8 || dy > .06 || sym > .12 ? "   ← NOT MIRRORED" : ""));
  }

  console.log("\n--- 4. does a travelling object keep its identity? ---");
  for (const [id, a, w, c] of [["qa","mixAout","crossA","combB"],["qb","mixB","crossB","combA"],
                               ["pkt","protect","journey","arrive"]]) {
    const A = at(a, id), W = at(w, id), C = at(c, id);
    const sizes = [A, W, C].map((x) => x ? `${x.w}x${x.h}` : "—").join("  →  ");
    const areas = [A, W, C].filter(Boolean).map((x) => x.area);
    const spread = areas.length ? (Math.max(...areas) / Math.min(...areas)).toFixed(2) : "—";
    console.log(`   ${id.padEnd(4)} ${sizes}   area ratio ${spread}×` +
      (+spread > 2.6 ? "   ← CHANGES SIZE IN TRANSIT" : ""));
  }

  console.log("\n--- 5. does Eve's copy match what Bob gets? ---");
  const e1 = at("journey", "pkt2"), b1 = at("arrive", "pkt");
  console.log(`   Eve ${e1 ? e1.w + "x" + e1.h : "—"}   Bob ${b1 ? b1.w + "x" + b1.h : "—"}`);

  console.log("\n--- 6. where does the connector land? ---");
  for (const k of ["mixA", "combA"]) {
    const L = F[k].leadAt;
    const target = k === "mixA" ? at(k, "base") : at(k, "qb");
    if (!L || !target) { console.log(`   ${k}: no connector or no target`); continue; }
    console.log(`   ${k}: ring at (${L.x},${L.y})  target centre ≈ object present`);
  }
})();
