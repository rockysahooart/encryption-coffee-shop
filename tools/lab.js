/* THE FORMULA LAB (pass 62). Every number the lab shows is checked against
   an independent recomputation from the inputs it shows, and every real
   value against the session the page actually holds.
     - entries only at 6a and 10c; opening holds the film; Esc closes; focus returns
     - each colour formula: rows, result hex and swatch recomputed from the
       displayed input hex; switching formulas leaves nothing stale
     - SHA-256 recomputed with node's crypto, through the documented palette
     - real ECDH: every short value and its full inspect match the session;
       received public values equal the sender's; Z and K equal on both sides
   Phones first (393, 320), then 1440. */
const { reach, launch } = require("./drive");
const crypto = require("crypto");

const H2 = (n) => n.toString(16).padStart(2, "0").toUpperCase();
const RGB3 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const BYTE_HSL = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = r / 255 * 360;
  if (d > 0) { if (mx === r) h = 60 * (((g - b) / d) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); if (h < 0) h += 360; }
  let hh = 20 + h * 280 / 360; if (hh >= 125) hh += 40; return [hh, .16 + .16 * (mx ? d / mx : 0), .38 + .24 * ((r + g + b) / 765)]; };
const HSL_HEX = ([h, s, l]) => { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return "#" + [f(0), f(8), f(4)].map((x) => x.toString(16).padStart(2, "0").toUpperCase()).join(""); };
const EXPECT = {
  avg: (p, a) => Math.round((p + a) / 2),
  w: (p, a) => Math.round(p / 4 + a * 3 / 4),
  xor: (p, a) => p ^ a,
};

(async () => {
  const b = await launch();
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x !== undefined && x !== "" ? "   " + x : ""}`); };
  for (const [W, H] of [[393, 852], [320, 700], [1440, 900]]) {
    console.log(`\n--- ${W}x${H} ---`);
    const mob = W < 560;
    const p = await b.newPage({ viewport: { width: W, height: H }, isMobile: mob, hasTouch: mob });
    const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
    await reach(p);
    await p.evaluate(() => window.__cin("pickA")); await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelectorAll(".cin-sw")[1].click()); await p.waitForTimeout(300);

    /* entries: only where the story turns paint into numbers, and at the end */
    const where = [];
    for (const k of ["problem", "reveal", "asmath", "pubvals", "tokey", "protect", "chain"]) {
      await p.evaluate((x) => window.__cin(x), k); await p.waitForTimeout(500);
      if (await p.$(".flm-lab-open")) where.push(k);
    }
    ok(where.join(",") === "asmath,chain", "the Formula Lab is offered at 6a and 10c only", where.join(","));

    /* opening holds the film; Esc closes and focus returns to the entry */
    await p.evaluate(() => window.__cin("asmath")); await p.waitForTimeout(600);
    await p.evaluate(() => { window.__cin = window.__cin; });
    await p.click(".flm-lab-open"); await p.waitForTimeout(400);
    ok(!!(await p.$(".flm-lab .lab[data-lab='L1']")), "opening shows L1: the colour experiment, nothing chosen");
    ok(await p.evaluate(() => !!document.activeElement.closest(".flm-lab")), "focus moves into the lab");
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    ok(!(await p.$(".flm-lab")) && await p.evaluate(() => document.activeElement && document.activeElement.classList.contains("flm-lab-open")),
      "Esc closes it and focus returns to its entry");

    /* the colour experiment, every formula, from the inputs on screen */
    await p.click(".flm-lab-open"); await p.waitForTimeout(400);
    const inHex = await p.evaluate(() => [...document.querySelectorAll(".lab-in .lab-hex")].map((e) => e.textContent.trim()));
    const live = await p.evaluate(() => ({ base: "#E8C93A" }));
    ok(inHex.length === 2 && inHex[0] === live.base, "the public input is the film's yellow", inHex.join(" "));
    const [P, A] = inHex.map(RGB3);
    for (const id of ["avg", "w", "xor", "sha"]) {
      await p.click(`.lab-opts button:nth-child(${["avg", "w", "xor", "sha"].indexOf(id) + 1})`);
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => ({
        rows: [...document.querySelectorAll(".lab-row")].map((e) => [e.querySelector(".lab-f").textContent, e.querySelector(".lab-o").textContent]),
        out: (document.querySelector(".lab-out .lab-hex") || {}).textContent,
        sw: getComputedStyle(document.querySelector(".lab-out .lab-sw")).backgroundColor,
        label: document.querySelector(".lab").dataset.lab,
        checked: [...document.querySelectorAll(".lab-opts [aria-checked='true']")].length,
      }));
      const swHex = "#" + (r.sw.match(/\d+/g) || []).slice(0, 3).map((n) => H2(+n)).join("");
      if (id !== "sha") {
        const exp = P.map((v, i) => EXPECT[id](v, A[i]));
        const expHex = "#" + exp.map(H2).join("");
        const rowsOk = r.rows.length === 3 && r.rows.every(([f, o], i) => f.includes(H2(P[i])) && f.includes(H2(A[i])) && o.trim().endsWith(H2(exp[i])));
        ok(rowsOk, `${id}: every channel row shows the real inputs and the right output`, r.rows.map((x) => x.join(" ")).join(" | "));
        ok(r.out === expHex && swHex === expHex, `${id}: result hex and swatch are ${expHex}`, `${r.out} / ${swHex}`);
      } else {
        const d = crypto.createHash("sha256").update(Buffer.from([...P, ...A])).digest();
        const expHex = HSL_HEX(BYTE_HSL(d[0], d[1], d[2]));
        ok(r.rows[0][0].endsWith([...P, ...A].map(H2).join(" ")) && r.rows[0][1].includes(d.toString("hex").slice(0, 8)),
          "sha: the digest shown is SHA-256 of the six input bytes shown", r.rows[0].join(" "));
        ok(r.rows[1][1].replace(/\s/g, "") === [d[0], d[1], d[2]].map(H2).join(""), "sha: its first three bytes", r.rows[1][1]);
        ok(r.out === expHex && swHex === expHex, `sha: through the film's byte palette = ${expHex}`, `${r.out} / ${swHex}`);
      }
      ok(r.label === "L4" && r.checked === 1, `${id}: ends on L4 with exactly one formula chosen`, r.label);
    }

    /* real ECDH, against the session */
    const S = await p.evaluate(() => { const s = window.__kit.session; const h = (u) => [...u].map((x) => x.toString(16).padStart(2, "0")).join("");
      return { dA: h(s.dMraw), QA: h(s.Qm), dB: h(s.dLraw), QB: h(s.Ql), ZA: h(s.Z), ZB: h(s.Zl), KA: h(s.K), KB: h(s.Kl) }; });
    const short = (h) => h.length === 130 && h.startsWith("04") ? "04 " + h.slice(2, 6) + "…" + h.slice(-4) : "0x" + h.slice(0, 4) + "…" + h.slice(-4);
    await p.click(".lab-foot .lab-next"); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.querySelector(".lab").dataset.lab) === "L5", "the real maths opens on L5, apart from the colours");
    ok(!(await p.$(".lab-ecdh .lab-in")), "no colour input appears in the real ECDH step");
    for (const want of ["L6", "L7", "L8"]) {
      await p.click(".lab-foot .lab-next"); await p.waitForTimeout(600);
      ok(await p.evaluate(() => document.querySelector(".lab").dataset.lab) === want, `Next reaches ${want}`);
    }
    const cells = await p.evaluate(() => [...document.querySelectorAll(".lab-col")].map((c) => [...c.querySelectorAll(".lab-cell")].map((e) => e.querySelector(".lab-val").textContent)));
    const [al, bo] = cells;
    ok(al.join() === [S.dA, S.QA, S.QB, S.ZA, S.KA].map(short).join(), "Alice's column: d_A, Q_A, received Q_B, Z_A, K — this session's values", al.join(" "));
    ok(bo.join() === [S.dB, S.QB, S.QA, S.ZB, S.KB].map(short).join(), "Bob's column: d_B, Q_B, received Q_A, Z_B, K — this session's values", bo.join(" "));
    ok(S.ZA === S.ZB && S.KA === S.KB, "Z and K are equal on both sides, and were made on each side");
    const priv = await p.evaluate(() => [...document.querySelectorAll(".lab-cell.priv")].map((e) => e.closest(".lab-col").className));
    ok(priv.length === 2 && priv[0].includes("lab-alice") && priv[1].includes("lab-bob"), "each private value stays in its own column");
    await p.click(".lab-alice .lab-cell:nth-of-type(1) .lab-val"); await p.waitForTimeout(200);
    const full = await p.evaluate(() => (document.querySelector(".lab-full") || {}).textContent || "");
    ok(full.replace(/\s/g, "") === S.dA, "inspect shows the full private value", full.slice(0, 24) + "…");
    const txt = await p.evaluate(() => document.querySelector(".lab").innerText);
    ok(/ECDH made the secret; it encrypts nothing/.test(txt), "says ECDH itself encrypts nothing");
    ok(/only listens/.test(txt) && /certificates/.test(txt), "says Eve only listens here, and names what stops a swap");

    /* the film was held all along */
    ok(await p.evaluate(() => document.querySelector(".flm").dataset.frame) === "asmath", "the film is still on 6a while the lab is open");
    const ov = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    ok(ov, "no horizontal scroll");
    ok(errs.length === 0, "no page errors", errs.join(" "));
    await p.close();
  }
  await b.close();
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nTHE LAB SHOWS ONLY WHAT IT COMPUTES");
  process.exit(bad ? 1 : 0);
})();
