/* PLAYED WITH HANDS. Every teaching beat is completed by dragging the object
   onto the one place it can go — no buttons exist for them. This is the whole
   point of the pass, so it is driven with real pointer events. */
const { KEYS, reach, launch } = require("./drive");
const MSG = "the table by the window";
const ORDER = KEYS;   /* the film is the source of truth for its own order */

const drag = async (p) => {
  const g = await p.waitForSelector(".flm-focal .grab", { timeout: 40000 });
  const d = await p.waitForSelector("[data-drop]", { timeout: 40000 });
  const a = await g.boundingBox(), b = await d.boundingBox();
  await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await p.mouse.down();
  /* a real hand moves in steps */
  for (let i = 1; i <= 6; i++) {
    await p.mouse.move(a.x + a.width / 2 + (b.x + b.width / 2 - a.x - a.width / 2) * i / 6,
                       a.y + a.height / 2 + (b.y + b.height / 2 - a.y - a.height / 2) * i / 6);
    await p.waitForTimeout(40);
  }
  await p.mouse.up();
};

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x ? "   " + x : ""}`); };
  await p.evaluate(() => {
    window.__seen = [];
    const rec = () => { const e = document.querySelector(".flm"); if (!e) return;
      const k = e.getAttribute("data-frame");
      const last = window.__seen[window.__seen.length - 1];
      if (!last || last.k !== k) window.__seen.push({ k, act: e.dataset.act || "" }); };
    rec(); new MutationObserver(rec).observe(document.body, { subtree: true, childList: true, attributes: true });
  });
  const at = async (k) => { await p.waitForSelector(`.flm[data-frame="${k}"]`, { timeout: 60000 });
    await p.waitForTimeout(600); };

  console.log("\n--- played with hands ---");
  await at("pickA");
  await p.click(".cin-pick .cin-sw");
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "pickA"),
    "pickA: tapping a swatch advanced the film");
  await at("mixA"); await drag(p);
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "mixA"),
    "mixA: dragging the swatch advanced the film");
  await at("sendA"); await p.click(".tap-send");
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "sendA"),
    "sendA: tapping Send advanced the film");
  await at("combA"); await drag(p);
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "combA"),
    "combA: dragging the mixture advanced the film");
  await at("type");
  await p.fill(".flm-compose .cin-in", MSG);
  await p.click(".flm-compose .tap-send");
  /* read the recovered message where it is shown, not after the recap has
     cleared the stage */
  await p.waitForSelector('.flm[data-frame="open"]', { timeout: 160000 });
  await p.waitForTimeout(2600);
  const shown = await p.evaluate(() => (document.querySelector(".cin-plain") || {}).textContent || "");
  await p.waitForSelector('.flm[data-frame="chain"]', { timeout: 90000 });
  await p.waitForTimeout(700);

  const order = await p.evaluate(() => window.__seen.map((s) => s.k));
  ok(JSON.stringify(order) === JSON.stringify(ORDER),
    "every frame, in order, no repeats",
    order.length === ORDER.length ? "" : `${order.length}: ${order.join(" ")}`);
  ok(shown === MSG, "the message Bob recovered is the one that was typed", shown);
  await p.close(); await b.close();
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nEVERY TEACHING BEAT IS COMPLETED BY HAND");
})();
