/* THE ANALOGY IS TRUE, NOT JUST ILLUSTRATIVE.
   Reads the colours the page actually paints and checks the arithmetic the
   story depends on: the mixtures are the documented blend of their two
   ingredients, both final colours are the same three ingredients, and they
   therefore land on the identical hex. Also checks provenance — that no colour
   on screen came from anywhere but the four permitted sources. */
const { reach, launch } = require("./drive");
const hex2 = (h) => { const v = h.replace("#", "");
  return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16)]; };
const mix = (...c) => "#" + [0,1,2].map((i) =>
  Math.round(c.reduce((a,x) => a + hex2(x)[i], 0) / c.length).toString(16).padStart(2,"0").toUpperCase()).join("");

const fill = async (p, id) => p.evaluate((x) => {
  const e = document.querySelector('[data-obj="' + x + '"] svg > [fill]:not([fill="none"])');
  return e ? e.getAttribute("fill").toUpperCase() : null;
}, id);

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 393, height: 852 } });
  await reach(p);
  /* the private slot is empty until the viewer chooses, so the harness has to
     choose: reading Alice's colour off an unchosen slot got null */
  await p.evaluate(() => window.__cin("pickA"));
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const s = document.querySelectorAll(".cin-sw"); s[0] && s[0].click(); });
  await p.waitForTimeout(600);
  let bad = 0;
  const ok = (c, q, x) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${x ? "   " + x : ""}`); };
  const go = async (k) => { await p.evaluate((x) => window.__cin(x), k); await p.waitForTimeout(950); };

  await go("base");   const BASE = await fill(p, "base");
  await go("pickA");  const A = await fill(p, "pa");
  await go("mixB");  const B = await fill(p, "pb");
  await go("mixAout"); const QA = await fill(p, "qa");
  await go("mixB"); const QB = await fill(p, "qb");
  await go("reveal");
  const SA = await fill(p, "sa"), SB = await fill(p, "sb");

  console.log("\n--- the paint, as the page paints it ---");
  console.log(`  public ${BASE}   Alice ${A}   Bob ${B}`);
  console.log(`  mixtures ${QA} / ${QB}   finals ${SA} / ${SB}`);
  ok(QA === mix(BASE, A), "Alice's mixture is the blend of the public colour and hers",
    `${QA} vs ${mix(BASE, A)}`);
  ok(QB === mix(BASE, B), "Bob's mixture is the blend of the public colour and his",
    `${QB} vs ${mix(BASE, B)}`);
  ok(SA === mix(BASE, A, B), "Alice's final is the three ingredients", `${SA} vs ${mix(BASE, A, B)}`);
  ok(SB === mix(BASE, A, B), "Bob's final is the same three", `${SB} vs ${mix(BASE, A, B)}`);
  ok(SA === SB, "so the two finals are the identical colour", SA);
  ok(SA !== QA && SA !== QB && SA !== BASE, "and it is not any colour that crossed");

  /* provenance: every colour on screen traces to a permitted source */
  const allowed = new Set([BASE, A, B, QA, QB, SA].map((x) => x && x.toUpperCase()));
  const strays = [];
  for (const k of ["base","pickA","mine","pickB","mixAout","mixB","exchange","combAout","combB","reveal"]) {
    await go(k);
    const cols = await p.evaluate(() =>
      [...document.querySelectorAll('.flm-obj[data-obj] svg > [fill]:not([fill="none"])')]
        .map((e) => ({ id: e.closest("[data-obj]").dataset.obj, f: e.getAttribute("fill").toUpperCase() })));
    for (const c of cols)
      if (c.f.startsWith("#") && !allowed.has(c.f) && c.f !== "#3A4449") strays.push(`${k}:${c.id}=${c.f}`);
  }
  ok(strays.length === 0, "every colour in the analogy traces to a permitted source",
    strays.slice(0, 6).join(" "));

  /* the private colours never cross, the finals never cross */
  const crossed = [];
  for (const k of ["exchange","unmix","reveal","asmath"]) {
    await go(k);
    const lane = await p.evaluate(() =>
      [...document.querySelectorAll('.flm-lane .flm-obj[data-obj]')].map((e) => e.dataset.obj));
    const eve = await p.evaluate(() =>
      [...document.querySelectorAll('.flm-net .flm-obj[data-obj]')].map((e) => e.dataset.obj));
    for (const id of [...lane, ...eve])
      if (["pa","pb","sa","sb"].includes(id)) crossed.push(`${k}:${id}`);
  }
  ok(crossed.length === 0, "no private colour and no final colour is ever on the wire or with Eve",
    crossed.join(" "));

  /* 4f: Eve's guesses at Alice's private colour. They are random, and they
     must never land on either private colour — the attempt fails by
     construction, so the picture can never show her succeeding */
  await go("unmix");
  const guesses = await p.evaluate(() => [...document.querySelectorAll(".flm-unmix i")]
    .flatMap((e) => ["--c1", "--c2", "--c3"].map((v) => e.style.getPropertyValue(v).trim().toUpperCase())));
  const dist = (x, y) => { const a = hex2(x), c = hex2(y); return Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]); };
  const close = guesses.filter((g) => !/^#[0-9A-F]{6}$/.test(g) || dist(g, A) < 60 || dist(g, B) < 60);
  ok(guesses.length === 24 && close.length === 0, "Eve's 24 guesses are all far from Alice's and Bob's colours",
    close.slice(0, 4).join(" "));
  const eveHolds = await p.evaluate(() => [...document.querySelectorAll(".flm-net .flm-obj[data-obj]")].map((e) => e.dataset.obj).join(","));
  const local = await p.evaluate(() => [document.querySelector('.flm-a [data-obj="pa"]'), document.querySelector('.flm-b [data-obj="pb"]')].every(Boolean));
  ok(eveHolds === "qa2,qb2" && local, "while she tries, Eve holds only the two copies and each private colour is on its own phone", eveHolds);

  /* 9b–9c: Eve tries to open her copy of the packet. She holds the packet and
     nothing else; no plaintext ever appears on her side; Alice and Bob still
     hold K; her key guesses are never K; the card says the key was missing */
  await go("open");
  const plaintext = await p.evaluate(() => ((document.querySelector(".cin-plain") || {}).textContent || "").trim());
  await go("unseal");
  const u = await p.evaluate(() => ({
    eve: [...document.querySelectorAll(".flm-net .flm-obj[data-obj]")].map((e) => e.dataset.obj).join(","),
    eveText: (document.querySelector(".flm-net") || {}).textContent || "",
    keys: [document.querySelector('.flm-a [data-obj="ka"]'), document.querySelector('.flm-b [data-obj="kb"]')].every(Boolean),
    bob: !!document.querySelector('.flm-b [data-obj="pkt"]'),
    card: ((document.querySelector(".flm-fail.fail-key b") || {}).textContent || ""),
    kfill: ((document.querySelector('.flm-a [data-obj="ka"] svg > [fill]:not([fill="none"])') || { getAttribute: () => "" }).getAttribute("fill") || "").toUpperCase(),
    guesses: [...document.querySelectorAll('.flm-net [data-obj="pkt2"] .flm-unmix i')].flatMap((e) => ["--c1", "--c2", "--c3"].map((v) => e.style.getPropertyValue(v).trim().toUpperCase())) }));
  ok(u.eve === "pkt2" && u.keys && u.bob, "while Eve tries the packet, she holds only her copy; Alice and Bob hold K; Bob has the original", u.eve);
  ok(plaintext.length > 0 && !u.eveText.includes(plaintext), "no plaintext ever appears on Eve's side", plaintext);
  ok(/key required/i.test(u.card), "her attempt ends on the key-required failure card", u.card);
  ok(u.guesses.length === 24 && (!/^#[0-9A-F]{6}$/.test(u.kfill) || u.guesses.every((g) => dist(g, u.kfill) >= 60)),
    "her 24 key guesses are all far from K", u.kfill);
  await p.close(); await b.close();
  console.log(bad ? `\n${bad} PROBLEM(S)` : "\nTHE ANALOGY HOLDS AS ARITHMETIC, NOT JUST AS A PICTURE");
})();
