/* THE DEPLOYMENT SMOKE SUITE. Runs the six harnesses that together cover
   every beat, every gate, both pointer types, both viewports, console errors
   and Bob reading the message back, in parallel, and compares what they
   report against baseline.json.

     known      a finding listed in baseline.json, no worse than recorded
     worse      a known finding past its recorded limit        -> regression
     new        anything not in baseline.json                  -> regression
     resolved   a known finding that no longer appears         -> informational

   A harness that reports something new while running alongside the others is
   rerun once on its own; the second run is the one that counts, because
   these harnesses wait on real animation time and five at once compete for
   the CPU. Exits 1 on any regression and writes .smoke/last.json, which
   ship.sh reads to make sure what it pushes is what passed. */
const { spawn, execSync } = require("child_process");
const fs = require("fs"), path = require("path");

const HARNESSES = [
  ["hands",      "five gates by mouse, all 26 beats in order, Bob reads the typed message"],
  ["touch",      "five gates by touch, all 26 beats in order, Bob reads the typed message"],
  ["walk",       "happy path at 393 and 1440, no console errors"],
  ["fit",        "every beat at 1440, 1024, 393, 360 and 320: nothing overflows or overlaps"],
  ["validate44", "every beat at 393 and 1440: the nine frame tests, containment, character scales"],
  ["labels",     "every frame shows its storyboard label (0a–10c), and the label touches nothing"],
];
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, "baseline.json"), "utf8")).known;
const OUT = path.join(__dirname, ".smoke");

const run = (name) => new Promise((res) => {
  const c = spawn(process.execPath, [path.join(__dirname, name + ".js")], { cwd: __dirname, env: process.env });
  let out = "";
  c.stdout.on("data", (d) => (out += d));
  c.stderr.on("data", (d) => (out += d));
  c.on("close", (code) => { fs.writeFileSync(path.join(OUT, name + ".log"), out); res({ code, out }); });
});

/* every harness prints FAIL lines; fit prints "beat: issue; issue" instead */
const findings = (name, out) => {
  const f = []; let section = "";
  for (const line of out.split("\n")) {
    const h = line.match(/^\s*(?:---|===)\s*(.+?)\s*(?:---|===)\s*$/);
    if (h) { section = h[1]; continue; }
    const fail = line.match(/^\s*FAIL\s+(.*)$/);
    if (fail) f.push({ section, text: fail[1].trim() });
    const fit = name === "fit" && line.match(/^  ([A-Za-z]+): (.+)$/);
    if (fit) for (const i of fit[2].split("; ")) f.push({ section, text: `${fit[1]}: ${i}` });
  }
  return f;
};
/* a harness that crashed never prints its closing line */
const finished = (out) => {
  const last = out.trim().split("\n").pop() || "";
  return /^\d+ [A-Z]+\(S\)/.test(last) || /^[A-Z][A-Z0-9 :,.']{15,}$/.test(last);
};
const classify = (name, f) => {
  for (const k of BASE) {
    if (k.harness !== name || !f.section.includes(k.section)) continue;
    const m = f.text.match(new RegExp(k.match));
    if (!m) continue;
    if (k.max != null && +m[1] > k.max) return { kind: "worse", k };
    return { kind: "known", k };
  }
  return { kind: "new" };
};
const judge = (name, r) => {
  if (r.code !== 0 || !finished(r.out)) return { crashed: true, list: [] };
  return { crashed: false, list: findings(name, r.out).map((f) => ({ ...f, ...classify(name, f) })) };
};
const regressed = (j) => j.crashed || j.list.some((x) => x.kind !== "known");

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fingerprint = execSync("git diff HEAD --binary | shasum -a 256", { cwd: path.join(__dirname, "..") })
    .toString().split(" ")[0];
  const t0 = Date.now();
  console.log(`smoke: ${HARNESSES.length} harnesses in parallel`);
  const first = await Promise.all(HARNESSES.map(([n]) => run(n)));
  const result = {};
  for (let i = 0; i < HARNESSES.length; i++) {
    const [name] = HARNESSES[i];
    let j = judge(name, first[i]);
    if (regressed(j)) {
      console.log(`  ${name}: something new under load, rerunning alone`);
      j = judge(name, await run(name));
      j.rerun = true;
    }
    result[name] = j;
  }

  let bad = 0;
  console.log("");
  for (const [name, what] of HARNESSES) {
    const j = result[name];
    const tag = j.crashed ? "CRASH" : regressed(j) ? "FAIL " : "ok   ";
    console.log(`${tag} ${name.padEnd(11)} ${what}${j.rerun ? "  (rerun alone)" : ""}`);
    if (j.crashed) { bad++; console.log(`        did not finish; see tools/.smoke/${name}.log`); }
    for (const x of j.list) {
      if (x.kind !== "known") bad++;
      console.log(`        ${x.kind.padEnd(8)} [${x.section}] ${x.text}`);
    }
  }
  for (const k of BASE) {
    const seen = Object.entries(result).some(([n, j]) => n === k.harness && j.list.some((x) => x.k === k));
    if (!seen && result[k.harness] && !result[k.harness].crashed)
      console.log(`        resolved [${k.section}] ${k.harness}: ${k.match}  (update baseline.json)`);
  }
  const pass = bad === 0;
  fs.writeFileSync(path.join(OUT, "last.json"), JSON.stringify(
    { pass, fingerprint, at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000) }, null, 2));
  console.log(`\n${pass ? "SMOKE PASSES: nothing new, nothing worse" : bad + " REGRESSION(S)"}  (${Math.round((Date.now() - t0) / 1000)}s, logs in tools/.smoke/)`);
  process.exit(pass ? 0 : 1);
})();
