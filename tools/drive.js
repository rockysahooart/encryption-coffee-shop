/* shared: reach the film and step it, honouring the nine viewer gates */
const KEYS = ["problem","base","pickA","mine","pickB","mixA","mixAout","mixB","sendA","exchange","combA","combAout","combB","reveal","asmath","tokey","type","protect","journey","arrive","open","chain"];

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
module.exports = { KEYS, reach, launch };
