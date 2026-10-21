/* shared: reach the film and step it, honouring the nine viewer gates */
const KEYS = ["problem","base","pickA","mine","pickB","mixA","mixAout","mixB","sendA","exchange","xland","combA","combAout","combB","reveal","asmath","pubvals","zsec","tokey","type","protect","journey","arrive","open","chain"];

/* The film falls back to its first frame for a name it does not know, so a
   stale beat name used to test "problem" without saying so. Every page a
   harness opens gets window.__cin wrapped before the app loads: an unknown
   name now throws inside page.evaluate and stops the harness. */
const guardCin = (keys) => {
  let real;
  Object.defineProperty(window, "__cin", { configurable: true,
    get: () => real && ((x) => {
      if (!keys.includes(x)) throw new Error(`__cin: "${x}" is not a beat in tools/drive.js KEYS`);
      return real(x);
    }),
    set: (f) => { real = f; } });
};

/* Playwright's own Chromium, wherever `npx playwright install chromium` put
   it; PW_CHROMIUM points at a different binary if one is needed. */
async function launch() {
  const { chromium } = require("playwright");
  const b = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const newContext = b.newContext.bind(b);
  b.newContext = async (o) => { const c = await newContext(o); await c.addInitScript(guardCin, KEYS); return c; };
  b.newPage = async (o) => { const c = await b.newContext(o); const p = await c.newPage();
    p.on("close", () => c.close().catch(() => {})); return p; };
  return b;
}

async function reach(p) {
  await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
  await p.waitForFunction(() => !!window.__go);
  await p.evaluate(() => window.__go(2, 0, []));
  await p.waitForFunction(() => window.__tape && window.__tape.gate);
  const at = await p.evaluate(() => window.__tape.gate.at);
  await p.evaluate((t) => window.__go(2, t, []), at + 300);
  await p.waitForFunction(() => !!window.__cin, null, { timeout: 25000 });
  await p.waitForTimeout(400);
}
/* The frame reference labels, as the storyboard assigns them. app.tsx (REF,
   REF_SUB, CAFE_REF) draws them; labels.js checks the page against this. */
const LABELS = {
  problem: "1a", base: "1b", pickA: "2a", mine: "2b", pickB: "2c",
  mixA: "3a", mixAout: "3b", mixB: "3d", sendA: "4a", exchange: "4b", xland: "4e",
  combA: "5a", combAout: "5b", combB: "5d", reveal: "5f", asmath: "6a", pubvals: "6b",
  zsec: "7a", tokey: "7b", type: "8a", protect: "8b", journey: "9a",
  arrive: "10a", open: "10b", chain: "10c"
};
/* states inside one beat: [ms after the beat starts, label] */
const LABEL_SUB = { mixAout: [[3360, "3c"]], mixB: [[3360, "3e"]], exchange: [[2600, "4c"], [3900, "4d"]],
  combAout: [[3360, "5c"]], combB: [[3360, "5e"]] };
/* Go to a storyboard label and hold it. Film labels use the app's hidden
   window.__ref, which pins the beat and pauses every animation at that
   label's moment. Café labels (0a–0d) are times on the café's own tape: the
   first moment showing that label is found by stepping the tape. */
async function gotoRef(p, label) {
  if (/^0[a-z]$/.test(label)) {
    await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
    await p.waitForFunction(() => !!window.__go);
    await p.evaluate(() => window.__go(1, 0, []));
    await p.waitForFunction(() => window.__tape && window.__tape.dur);
    const dur = await p.evaluate(() => window.__tape.dur);
    for (let t = 0; t <= dur; t += 250) {
      await p.evaluate((t) => window.__go(1, t, []), t);
      await p.waitForTimeout(60);
      const l = await p.evaluate(() => (document.querySelector(".ref-label") || {}).textContent);
      if (l === label) { await p.evaluate((t) => window.__go(1, t + 900, []), t); await p.waitForTimeout(700); return { label, act: 1, t: t + 900 }; }
    }
    throw new Error(`café label ${label} not found`);
  }
  if (!(await p.evaluate(() => !!window.__ref))) await reach(p);
  const r = await p.evaluate((l) => window.__ref(l), label);
  await p.waitForTimeout(1400);
  return r;
}
module.exports = { KEYS, reach, launch, LABELS, LABEL_SUB, gotoRef };
