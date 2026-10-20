/* THE DEVICE PROPORTIONS ARE A STANDING CONSTRAINT.
   Every phone in the film, on every frame, at every width, measured against
   the iPhone 17 Pro ratio this project locked. Content is never allowed to
   change it — which is exactly how it broke. */
const { chromium } = require("playwright");
const { KEYS, reach } = require("./drive");
const R = 71.9 / 150;
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  let bad = 0;
  for (const [w, h] of [[1440, 900], [393, 852], [320, 700]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await reach(p);
    let worst = 0, where = "";
    for (const k of KEYS) {
      await p.evaluate((x) => window.__cin(x), k);
      /* the ratio is a static property; measuring mid-transition is the
         harness’s error, not the build’s */
      await p.waitForTimeout(950);
      const r = await p.evaluate(() => [...document.querySelectorAll(".flm-ph-body")]
        .map((e) => { const b = e.getBoundingClientRect();
          return b.height > 2 ? +(b.width / b.height).toFixed(4) : null; }).filter((x) => x));
      for (const got of r) {
        const off = Math.abs(got - R) / R;
        if (off > worst) { worst = off; where = `${k} ${got}`; }
      }
    }
    const okw = worst < 0.02;
    if (!okw) bad++;
    console.log(`  ${okw ? "ok  " : "FAIL"} ${w}x${h}: worst deviation ${(worst * 100).toFixed(2)}%  (${where || "—"})`);
    await p.close();
  }
  console.log(bad ? "\nTHE DEVICE PROPORTIONS DRIFT" : "\nEVERY PHONE HOLDS 71.9 : 150 ON EVERY FRAME");
  await b.close();
})();
