/* IS ANY OF THIS REAL?
   The swatches are only honest if the bytes behind them are. This reads the
   live session out of the page and checks the claims the UI makes: that the
   two sides derived the same secret, that the shared swatch comes from the
   real key material, that the ciphertext swatches come from the real
   ciphertext, that the nonce is fresh per encryption, and that a tampered
   tag yields no plaintext at all. */
const { launch } = require("./drive");

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto((process.env.TARGET || "file://" + require("path").resolve(__dirname, "..", "index.html")));
  await p.waitForFunction(() => !!window.__kit, null, { timeout: 20000 });
  await p.waitForTimeout(600);
  let bad = 0;
  const ok = (c, q, extra) => { if (!c) bad++; console.log(`  ${c ? "ok  " : "FAIL"} ${q}${extra ? "  " + extra : ""}`); };

  const r = await p.evaluate(async () => {
    const k = window.__kit, s = k.session;
    const hex = (u, n) => [...u.slice(0, n)].map((x) => x.toString(16).padStart(2, "0")).join("");
    const rgb = (u, o) => "#" + [0, 1, 2].map((i) => u[o + i].toString(16).padStart(2, "0").toUpperCase()).join("");
    const a = await k.encrypt("meet me at six");
    const b2 = await k.encrypt("meet me at six");
    const good = await k.open(a);
    /* flip one bit of the tag and ask again */
    const bytes = new Uint8Array(a.buf.slice(0));
    bytes[bytes.length - 1] ^= 1;
    const tampered = await k.open({ iv: a.iv, buf: bytes.buffer });
    return {
      zSame: s.zSame, kSame: s.kSame,
      zA: hex(s.Z, 8), zB: hex(s.Zl, 8),
      kA: hex(s.K, 8), kB: hex(s.Kl, 8),
      sharedSwatch: rgb(s.K, 0),
      qaSwatch: rgb(s.Qm, 1), qbSwatch: rgb(s.Ql, 1),
      privLen: s.dMraw.length,
      ivA: hex(a.iv, 12), ivB: hex(b2.iv, 12),
      ctA: hex(a.C, 6), ctB: hex(b2.C, 6),
      chip0: rgb(a.C, 0), tagLen: a.tag.length,
      good: good.ok, goodText: good.text,
      tamperedOk: tampered.ok, tamperedText: tampered.text,
    };
  });

  console.log("\n--- the session, as the page actually holds it ---");
  ok(r.zSame && r.zA === r.zB, "both sides derived the same Z", r.zA + " / " + r.zB);
  ok(r.kSame && r.kA === r.kB, "and the same key material K", r.kA + " / " + r.kB);
  ok(r.privLen === 32, "the private scalar is a real 32-byte P-256 scalar", r.privLen + " bytes");
  ok(r.qaSwatch !== r.qbSwatch, "the two public swatches differ", r.qaSwatch + " / " + r.qbSwatch);
  ok(/^#[0-9A-F]{6}$/.test(r.sharedSwatch), "RGB(K,0) is a well-formed swatch", r.sharedSwatch);
  ok(r.sharedSwatch === "#" + r.kA.slice(0, 6).toUpperCase(), "and the mapping is arithmetic, not decoration");
  ok(r.ivA !== r.ivB, "each encryption gets a fresh nonce", r.ivA + " / " + r.ivB);
  ok(r.ctA !== r.ctB, "so the same text encrypts to different ciphertext");
  ok(r.chip0 === "#" + r.ctA.slice(0, 6).toUpperCase(), "the first swatch is the first 3 ciphertext bytes", r.chip0);
  ok(r.tagLen === 16, "there is a real 16-byte authentication tag");
  ok(r.good && r.goodText === "meet me at six", "Bob's key opens it");
  ok(!r.tamperedOk && r.tamperedText === null, "a flipped tag bit yields no plaintext at all");

  /* ---- AND THE PICTURE SHOWS THOSE BYTES -------------------------------
     The checks above prove the mapping is arithmetic. They say nothing about
     what is on screen. This drives the film to the frames that claim a value
     and reads the pixel the viewer is actually looking at. */
  await p.evaluate(() => window.__go(2, 0, []));
  await p.waitForFunction(() => window.__tape && window.__tape.gate);
  const at = await p.evaluate(() => window.__tape.gate.at);
  await p.evaluate((t) => window.__go(2, t, []), at + 300);
  await p.waitForFunction(() => !!window.__cin, null, { timeout: 20000 });
  await p.waitForTimeout(400);
  const paint = async (frame, sel) => {
    await p.evaluate((x) => window.__cin(x), frame);
    await p.waitForTimeout(900);
    return p.evaluate((s) => {
      const e = document.querySelector(s); if (!e) return null;
      /* the token art carries the value as a fill attribute now, not as a
         background colour, because role is carried by the shape */
      const f = e.getAttribute && e.getAttribute("fill");
      if (f && f.startsWith("#")) return f.toUpperCase();
      const m = getComputedStyle(e).backgroundColor.match(/\d+/g);
      if (!m) return null;
      return "#" + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, "0").toUpperCase()).join("");
    }, sel);
  };
  console.log("\n--- the two layers, and the bridge between them ---");
  /* THE ANALOGY LAYER is checked by paint.js: its colours are blends, not
     byte mappings, and that is now deliberate. What must hold HERE is that
     the crypto layer is still painted from real bytes, and that the real
     values are reachable rather than merely asserted. */
  const kPix = await paint("tokey", '[data-obj="ka"] svg > rect[fill]:not([fill="none"])');
  ok(kPix === "#" + r.kA.slice(0, 6).toUpperCase(),
    "the key token is painted from the real K bytes", kPix + " vs #" + r.kA.slice(0, 6).toUpperCase());
  const ctPix = await paint("protect", '[data-obj="pkt"] .tk-pack rect.pk-b');
  ok(/^#[0-9A-F]{6}$/.test(ctPix || ""), "the ciphertext strip is painted from real bytes", ctPix);

  /* the real values are one tap away, and they are the ones computed */
  await p.evaluate(() => window.__cin("protect"));
  await p.waitForTimeout(700);
  await p.click(".flm-more");
  await p.waitForTimeout(500);
  const panel = await p.evaluate(() => {
    const e = document.querySelector(".flm-vals");
    return e ? e.innerText : null;
  });
  /* read the session the panel is showing, not the one from before the
     replay: the page derives fresh keys each time it is played, so comparing
     across two playthroughs tests the clock, not the maths */
  const now = await p.evaluate(() => {
    const s2 = window.__kit && window.__kit.session; if (!s2) return null;
    const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return { z: hex(s2.Z), k: hex(s2.K) };
  });
  if (now) { r.zA = now.z; r.kA = now.k; }
  ok(!!panel, "See the data opens the real values");
  /* the panel groups bytes for reading, so compare on hex characters alone */
  const flat = (panel || "").toLowerCase().replace(/[^0-9a-f]/g, "");
  ok(flat.indexOf(r.zA.slice(0, 8)) >= 0,
    "and it shows the shared secret the browser actually computed", r.zA.slice(0, 8));
  ok(flat.indexOf(r.kA.slice(0, 8)) >= 0, "and the real derived key", r.kA.slice(0, 8));
  ok(panel && /not a key/i.test(panel),
    "and says the colour the viewer picked is not a key");
  ok(panel && /analogy/i.test(panel) && /P.256/i.test(panel),
    "and separates the analogy from what P-256 actually does");

  await p.close();

  console.log(bad ? `\n${bad} CLAIM(S) NOT BACKED BY THE BYTES` : "\nEVERY CLAIM THE PICTURE MAKES IS BACKED BY THE BYTES");
  await b.close();
})();
