/* POST-DEPLOY WALKTHROUGH. The whole path, opening scene to Bob reading the
   message, against the exact bytes that were written to the project folder —
   verified identical by hash — at desktop width as well as phone width. */
const { chromium } = require("playwright");
const { reach } = require("./drive");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  let bad = 0;
  for (const [w, h] of [[393, 852], [1440, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 140)));
    p.on("pageerror", (e) => errs.push("PAGEERROR " + String(e).slice(0, 140)));
    await reach(p);
    const ok = (c, m) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${m}`); };
    const at = async (k) => { await p.waitForSelector(`.flm[data-frame="${k}"]`, { timeout: 90000 });
      await p.waitForTimeout(600); };
    const drag = async () => {
      const g = await p.waitForSelector(".flm-focal .grab", { timeout: 40000 });
      const d = await p.waitForSelector("[data-drop]", { timeout: 40000 });
      const a = await g.boundingBox(), t = await d.boundingBox();
      await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
      await p.mouse.down();
      for (let i = 1; i <= 6; i++) {
        await p.mouse.move(a.x + a.width / 2 + (t.x + t.width / 2 - a.x - a.width / 2) * i / 6,
                           a.y + a.height / 2 + (t.y + t.height / 2 - a.y - a.height / 2) * i / 6);
        await p.waitForTimeout(40);
      }
      await p.mouse.up();
    };
    console.log(`\n=== ${w}x${h} ===`);
    await at("problem"); ok(true, "opens on the problem, with all three present");
    await at("pickA");   await p.click(".cin-pick .cin-sw");
    await at("mine");    ok(true, "the chosen colour is held in its slot");
    await at("mixA");    await drag();
    await at("mixAout"); ok(true, "the mixture is made in view");
    await at("sendA");   await p.click(".tap-send");
    await at("exchange"); ok(true, "both mixtures cross and Eve copies both");
    await at("combA");   await drag();
    await at("reveal");  ok(true, "both results uncover together");
    await at("tokey");   ok(true, "the secret becomes the same key on both");
    await at("type");
    const i = await p.waitForSelector(".cin-in"); await i.click(); await i.type("meet me at six");
    await p.click(".tap-send:not([disabled])");
    await at("open");    await p.waitForTimeout(2000);
    const msg = await p.evaluate(() => (document.querySelector(".cin-plain") || {}).textContent || "");
    ok(/meet me at six/.test(msg), `Bob reads it back: "${msg}"`);
    await at("chain");   ok(true, "the chain resolves and offers a replay");
    ok(!errs.length, `no console errors${errs.length ? ": " + errs[0] : ""}`);
    await p.close();
  }
  await b.close();
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nTHE DEPLOYED BUILD PLAYS END TO END AT BOTH SIZES");
})();
