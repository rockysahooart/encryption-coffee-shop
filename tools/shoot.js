/* Screenshots of named beats at mobile and desktop, for looking at a change
   rather than measuring it.

     node shoot.js exchange journey      -> tools/shots/exchange-393.png, ...
     node shoot.js                       -> all 22 beats
     WIDTHS=320x700,393x852 node shoot.js chain

   Alice's colour is chosen first (the slot is empty until she does), and each
   beat is held long enough for its travel or blend to settle. */
const { KEYS, reach, launch } = require("./drive");
const fs = require("fs"), path = require("path");

const beats = process.argv.slice(2).length ? process.argv.slice(2) : KEYS;
const widths = (process.env.WIDTHS || "393x852,1440x900").split(",").map((s) => s.split("x").map(Number));
const settle = (k) => /exchange|journey|pubvals/.test(k) ? 7600 : /mixAout|mixB|combAout|combB|protect/.test(k) ? 7000 : 2400;

(async () => {
  for (const k of beats) if (!KEYS.includes(k)) throw new Error(`"${k}" is not a beat; see KEYS in drive.js`);
  const dir = path.join(__dirname, "shots");
  fs.mkdirSync(dir, { recursive: true });
  const b = await launch();
  await Promise.all(widths.map(async ([w, h]) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await reach(p);
    await p.evaluate(() => window.__cin("pickA"));
    await p.waitForTimeout(1100);
    await p.evaluate(() => { const s = document.querySelectorAll(".cin-sw"); s[0] && s[0].click(); });
    await p.waitForTimeout(400);
    for (const k of beats) {
      await p.evaluate((x) => window.__cin(x), k);
      await p.waitForTimeout(settle(k));
      const f = path.join(dir, `${k}-${w}.png`);
      await p.screenshot({ path: f });
      console.log(path.relative(process.cwd(), f));
    }
    await p.close();
  }));
  await b.close();
})();
