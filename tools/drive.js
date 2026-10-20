/* shared: reach the film and step it, honouring the nine viewer gates */
const KEYS = ["problem","base","pickA","mine","pickB","mixA","mixAout","mixB","sendA","exchange","combA","combAout","combB","reveal","asmath","tokey","type","protect","journey","arrive","open","chain"];
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
module.exports = { KEYS, reach };
