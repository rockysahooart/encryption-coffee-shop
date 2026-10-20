/* PLAYED WITH A FINGER. The same five gates as hands.js, driven with pointer
   events whose pointerType is "touch" — which is what the film's drag handler
   actually reads — and with taps rather than mouse clicks. Same scaffold as
   the mouse test on purpose: if the two differ, the difference is the input. */
const { KEYS, reach, launch } = require("./drive");
const MSG = "the table by the window";
const ORDER = KEYS;   /* the film is the source of truth for its own order */

const tap = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s); if (!el) throw new Error("no " + s);
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ev = (t) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true,
    pointerId: 7, pointerType: "touch", isPrimary: true, clientX: x, clientY: y }));
  ev("pointerdown"); ev("pointerup");
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y }));
  if (el.focus) el.focus();
}, sel);

const drag = async (p) => {
  const g = await p.waitForSelector(".flm-focal .grab", { timeout: 40000 });
  const d = await p.waitForSelector("[data-drop]", { timeout: 40000 });
  const a = await g.boundingBox(), t = await d.boundingBox();
  await p.evaluate(([x1, y1, x2, y2]) => {
    const el = document.querySelector(".flm-focal .grab");
    const ev = (type, x, y) => el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch",
      isPrimary: true, clientX: x, clientY: y, buttons: type === "pointerup" ? 0 : 1 }));
    ev("pointerdown", x1, y1);
    for (let i = 1; i <= 10; i++)
      ev("pointermove", x1 + (x2 - x1) * i / 10, y1 + (y2 - y1) * i / 10);
    ev("pointerup", x2, y2);
  }, [a.x + a.width / 2, a.y + a.height / 2, t.x + t.width / 2, t.y + t.height / 2]);
  await p.waitForTimeout(300);
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
  await tap(p, ".cin-pick .cin-sw");
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "pickA"),
    "pickA: tapping a colour advanced the film");
  await at("mixA"); await drag(p);
  ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame !== "mixA"),
    "mixA: a touch drag advanced the film");
  await at("sendA"); await tap(p, ".tap-send");
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
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nEVERY TEACHING BEAT IS COMPLETED BY TOUCH");
})();
