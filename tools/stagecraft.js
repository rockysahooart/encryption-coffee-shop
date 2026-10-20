/* THE BRIEF OF PASS 43, AS NUMBERS.
   1. in a close-up, how much of the frame is the active phone + character?
   2. how big is a colour object, as a share of the frame?
   3. is the wide composition used only for travel or comparison?
   4. on a turn, is exactly one thing active, and is everything else still?
   5. does the chosen colour stay large, in a labelled slot, after selection? */
const { chromium } = require("playwright");
const { KEYS, reach } = require("./drive");
const CLOSE = ["pickA","mine","mixA","mixAout","sendA","mixB","mixB","combA","combAout",
  "combB","combB","type","protect","protect","arrive","open"];
const TRAVEL = ["base","crossA","crossB","journey"];
const COMPARE = ["reveal","asmath","tokey","tokey","chain","journey","problem"];
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  const keys = await p.evaluate(() => (window.__kit && window.__kit.keys) || null);
  const list = keys || KEYS;
  const F = {};
  for (const k of list) {
    await p.evaluate((x) => window.__cin(x), k);
    await p.waitForTimeout(/cross|journey/.test(k) ? 7000 : 1800);
    F[k] = await p.evaluate(() => {
      const st = document.querySelector(".flm-stage").getBoundingClientRect();
      const A = st.width * st.height;
      const share = (e) => { if (!e) return 0; const r = e.getBoundingClientRect();
        return +(r.width * r.height / A * 100).toFixed(1); };
      const onSlot = [...document.querySelectorAll(".flm-slot.on")];
      const subj = onSlot.reduce((s, e) => s + share(e.querySelector(".flm-ph-body") || e.querySelector(".flm-eve-scr"))
        + share(e.querySelector(".cin-face")), 0);
      const objs = [...document.querySelectorAll(".flm-obj[data-obj]")]
        .filter((e) => !e.closest(".flm-shelf"))
        .map((e) => ({ id: e.dataset.obj, pc: share(e.querySelector(".tk-box, .tk-pay") || e),
          role: ((e.querySelector(".tk") || {}).className || "").match(/tk-(private|public|secret|key|payload|message)/)?.[1] }));
      const flm = document.querySelector(".flm");
      const turn = flm.classList.contains("turn");
      const moving = [...document.querySelectorAll(".flm *")].filter((e) => {
        const a = getComputedStyle(e).animationName;
        return a && a !== "none" && !/leadDraw|turnPulse|caret|scan|railIn/.test(a);
      }).length;
      const drops = document.querySelectorAll("[data-drop]").length;
      const grabs = document.querySelectorAll(".grab").length;
      const vault = document.querySelector(".flm-vault");
      return { subj, objs, turn, moving, drops, grabs,
        cam: (flm.className.match(/cam-\w+/) || [])[0] || (flm.classList.contains("duel") ? "duel" : "?"),
        slotsOn: onSlot.length, vault: !!vault,
        vaultLabel: vault ? (vault.querySelector(".flm-vault-k") || {}).textContent : null,
        say: (document.querySelector(".flm-rail b, .flm-rail-say") || {}).textContent || "" };
    });
  }
  await p.close(); await b.close();

  console.log("\n--- 1. in a close-up, does the phone and its owner dominate? ---");
  for (const k of CLOSE) { const f = F[k]; if (!f) continue;
    console.log(`   ${k.padEnd(10)} ${String(f.subj).padStart(5)}% of the frame   cam=${f.cam}` +
      (f.subj < 45 ? "   <- the subject does not dominate" : "")); }

  console.log("\n--- 2. how big is a colour object? ---");
  let tot = [], big = 0;
  for (const k of Object.keys(F)) for (const o of F[k].objs) {
    if (!/private|public|secret|key/.test(o.role || "")) continue;
    tot.push(o.pc); big = Math.max(big, o.pc);
    if (CLOSE.includes(k)) console.log(`   ${(k + "/" + o.id).padEnd(18)} ${o.pc}%`);
  }
  const mean = tot.length ? (tot.reduce((a, c) => a + c, 0) / tot.length).toFixed(1) : 0;
  console.log(`   mean ${mean}% of the frame, biggest ${big}%` +
    (mean >= 10 ? "   (the brief asked for ~2x of 5.7%)" : "   <- still short of double"));

  console.log("\n--- 3. is the wide composition reserved for travel and comparison? ---");
  for (const k of Object.keys(F)) {
    const wide = F[k].cam === "cam-wide" || F[k].slotsOn >= 3;
    const allowed = TRAVEL.includes(k) || COMPARE.includes(k);
    if (wide && !allowed) console.log(`   ${k}: wide, but nothing travels and nothing is compared`);
  }
  console.log("   (nothing listed above = every wide shot is earned)");

  console.log("\n--- 4. on a turn, is there exactly one thing to do? ---");
  for (const k of Object.keys(F)) { const f = F[k]; if (!f.turn) continue;
    const targets = f.drops + (f.grabs > 1 ? f.grabs - 1 : 0);
    console.log(`   ${k.padEnd(10)} drop targets ${f.drops}  grabbables ${f.grabs}  other motion ${f.moving}` +
      (f.drops > 1 ? "   <- more than one valid target" : "")); }

  console.log("\n--- 5. is the chosen colour held in a labelled private slot? ---");
  for (const k of ["mine","mixA","mixAout","sendA","combA"]) { const f = F[k]; if (!f) { console.log(`   ${k}: absent`); continue; }
    const pa = f.objs.find((o) => o.id === "pa");
    console.log(`   ${k.padEnd(9)} slot=${f.vault ? '"' + (f.vaultLabel || "").trim() + '"' : "none"}   pa=${pa ? pa.pc + "%" : "not in frame"}`); }
})();
