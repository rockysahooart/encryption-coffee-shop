(() => {
    const { useState, useEffect, useLayoutEffect, useRef, useMemo } = React;
    const SUBJECT = {
      you: "you",
      fr: "fr",
      atk: "atk",
      msg: "you",
      work: "you",
      workFr: "fr",
      tap: "atk"
    };
    const WIDE = {
      tall: false,
      w: 1e3,
      h: 700,
      /* Everything sits on a 20-unit grid. Three columns (180 / 500 / 820) and
         four rows (router 120, bus 280, station 440, table 540), so the picture
         reads as a diagram of a network rather than a scattering of furniture. */
      you: { x: 180, y: 540, s: 1 },
      fr: { x: 820, y: 540, s: 1 },
      atk: { x: 500, y: 400, s: 0.78 },
      router: { x: 500, y: 120 },
      /* Right angles only. The observer looks straight up his own drop line. */
      sight: "M500 274 V176",
      /* Where the observer is looking. Two lines from his table to theirs: the
         existing sightline only ever pointed at the router, which says "he is on
         the network" and not "he is watching these two people". */
      watch: { you: "M452 372 H240 V468", fr: "M548 372 H760 V468" },
      paths: {
        main: "M180 440 V280 H820 V440",
        netYou: "M500 150 V280 H180 V440",
        netFr: "M500 150 V280 H820 V440",
        netAtk: "M500 150 V360"
      },
      shots: {
        /* Establishing, medium, close-up — with real distance between them, so a
           cut registers as a change of attention rather than a nudge. */
        wide: [500, 350, 1],
        you: [240, 500, 1.85],
        fr: [760, 500, 1.85],
        both: [500, 460, 1.28],
        net: [500, 340, 1.04],
        atk: [500, 320, 1.6],
        /* The two tightest shots in the piece: the message itself, and the
           moment somebody else takes hold of it. */
        msg: [180, 450, 3.1],
        tap: [500, 330, 1.9],
        /* On the glass, not on the person: the screen group sits at y 496, so the
           frame centres there and the block fills it. */
        work: [180, 492, 2.95],
        workFr: [820, 492, 2.95],
        /* Loose enough to hold Alice, Bob and Eve, tight enough that the number
           on each screen is still a number and not a smudge. */
        trio: [500, 420, 1.16]
      },
      /* Authored, not computed. Each anchor satisfies three constraints: inside
         every shot frame it appears in, clear of the wires, and clear of its own
         speaker's head and nameplate. */
      /* Inboard of each speaker and clear of the wires: the vertical drop lines
         live at x=180 and x=820, the bus runs along y=280, and the heads occupy
         y 398-503, so these three slots are the space left over. */
      sp: { you: [356, 384], fr: [644, 384], atk: [690, 386] },
      co: { you: [392, 494], fr: [608, 494], atk: [700, 364], net: [258, 224] },
      /* cNet names the router and only ever appears in a frame that contains the
         wall; cMid speaks about the space between the two tables, so it needs a
         slot that survives the two-shot. */
      ch: {
        cYou: [180, 360],
        cFr: [820, 360],
        cNet: [676, 208],
        cMid: [500, 630],
        cAtk: [672, 324],
        cMsg: [180, 366],
        cMsgFr: [820, 372],
        cTap: [644, 248]
      },
      an: {
        youScreen: [180, 494],
        frScreen: [820, 494],
        atkScreen: [500, 364],
        router: [500, 120],
        mid: [500, 280]
      }
    };
    const TALL = {
      tall: true,
      w: 560,
      h: 880,
      /* The same grid turned on its side: one column of people at x=160, one
         network spine at x=420, rows at 140 / 300 / 470 / 780. The gap between
         the two people is sized to hold a caption without touching either. */
      you: { x: 160, y: 470, s: 0.72 },
      fr: { x: 160, y: 780, s: 0.72 },
      atk: { x: 420, y: 300, s: 0.55 },
      router: { x: 420, y: 170 },
      sight: "M420 238 V208",
      watch: { you: "M388 316 H220 V424", fr: "M388 330 H220 V730" },
      paths: {
        main: "M200 430 H420 V740 H200",
        netYou: "M420 198 V430 H200",
        netFr: "M420 198 V740 H200",
        netAtk: "M420 198 V272"
      },
      /* A phone is not a small desktop. Establishing stays loose enough to place
         the room; every other shot pushes in, so mobile reads as a sequence of
         close-ups rather than one diagram viewed from too far away. */
      shots: {
        wide: [290, 450, 1.02],
        you: [200, 460, 1.9],
        fr: [200, 770, 1.9],
        both: [200, 620, 1.42],
        net: [290, 470, 1.1],
        atk: [400, 270, 2.1],
        msg: [175, 400, 2.9],
        tap: [400, 300, 1.9],
        work: [160, 438, 2.45],
        workFr: [160, 748, 2.45],
        /* As close as a staging this tall can get while still holding all three
           people: the reveal has to be a comparison, and a comparison needs every
           party in the frame at once. */
        trio: [285, 520, 1.22]
      },
      /* One caption slot lives in the gap between the two people; it survives
         every shot either of them appears in. */
      /* Only the observer gets one here: he is alone in the top half of the
         picture, so there is somewhere to put it. */
      sp: { atk: [400, 406] },
      co: { you: [200, 610], fr: [200, 610], atk: [400, 420], net: [240, 250] },
      ch: {
        cYou: [300, 400],
        cFr: [300, 710],
        cNet: [280, 210],
        cMid: [300, 600],
        cAtk: [280, 340],
        cMsg: [175, 312],
        cMsgFr: [175, 640],
        cTap: [380, 428]
      },
      an: {
        youScreen: [160, 437],
        frScreen: [160, 747],
        atkScreen: [420, 275],
        router: [420, 170],
        mid: [420, 585]
      }
    };
    const ACTS = [
      { label: "The caf\xE9", beats: [1], title: "Three people, one Wi-Fi." },
      { label: "The message", beats: [2], title: "Send Bob something private." }
    ];
    const NOTE = {
      /* --- chapter one: the room, and what "insecure" actually means --------- */
      wifi: { s: "Three people on one caf\xE9 Wi-Fi. Alice wants to send Bob a private message. Eve can see what crosses the network." },
      needSecret: { s: "So Alice and Bob need something Eve does not have." },
      nowUse: { s: "Now they can use it." },
      pairWant: { s: "Alice wants to send Bob a private message." },
      eveHere: { s: "Someone else is in the caf\xE9." },
      eveWatch: { s: "Eve is watching them." },
      eveBoth: { s: "He is on the same Wi-Fi they are." },
      oneNetwork: { s: "Everything any of them sends goes through this one router." },
      howPrivate: { s: "So how do they talk privately?" },
      pushAlice: { s: "Alice opens the message she actually wanted to send." },
      landed: { s: "Bob read it. Eve saw the same traffic and did not." },
      whatEve: { s: "So what does the person watching the network actually have?" },
      router: { s: "Everything anyone sends here passes through this router." },
      plainDemo: { s: "Alice sends a plain note across it, with no protection." },
      plainSeen: { s: "Eve reads the same sentence off the wire. Nothing was broken into." },
      startsNow: { s: "So nothing can be sent in the open. This is where the protection starts." },
      same: {
        t: "Public starting value",
        s: "Both laptops begin from the same number. It was never a secret."
      },
      eveNet: { s: "Eve is on the same network, so he has that number too." },
      /* --- chapter one, part two: the two numbers that never move ------------ */
      pickAlice: { s: "Alice needs a private number. Choose one for her." },
      pickBob: { s: "Bob needs his own. Choose a different one." },
      keepAlice: { t: "Private key", s: "Stays on this device." },
      keepBob: { t: "Private key", s: "A different one, and it stays on his." },
      neither: { s: "The wire lights up, and neither private number goes down it." },
      /* --- chapter two: the transformation ---------------------------------- */
      twoNums: { s: "Alice\u2019s laptop now holds two numbers: the public one, and her own." },
      feedIn: {
        t: "One-way math",
        s: "Both of them go into the same calculation. Watch what it does."
      },
      running: { s: "It runs forwards in one step. Backwards, there is no step to take." },
      made: { t: "Public key", s: "Safe to share." },
      staysGoes: { s: "Her private number never moved. Only the new number will travel." },
      travel: { s: "Alice\u2019s public value crosses the Wi-Fi to Bob." },
      bobToo: { s: "Bob runs the same calculation, with his own private number." },
      bobMade: { s: "A different private number, so a different public value." },
      backTrip: { s: "His public value makes the same trip the other way." },
      swapped: { s: "Each of them now holds the other\u2019s public value." },
      /* --- chapter two, part two: why Eve is stuck ------------------------- */
      eveSees: { s: "Eve reads both public values off the network. He is meant to." },
      eveHas: { s: "This is everything Eve has: the starting value and both public values." },
      eveTry: { s: "To read the conversation he needs a private number. He can only guess." },
      tryOne: { s: "Three tried, three wrong. And nothing about them says which to try next." },
      bigger: { s: "The real search is far larger than this. Each candidate has to be run and checked." },
      eveNot: {
        t: "Why this holds",
        s: "Forward is one step. Backward is a search, and nothing tells him which number to try first."
      },
      stillNot: { s: "Eve has every public number that crossed the Wi-Fi. None of them gives him these." },
      /* --- chapter two, part three: the same block, the other way round ----- */
      mixAlice: { s: "Now Alice feeds Bob\u2019s public value into the same calculation." },
      gotIt: { s: "Out comes a number she has not seen before." },
      mixBob: { s: "Bob does exactly the same, with Alice\u2019s public value and his own." },
      sameKey: {
        t: "Shared secret",
        s: "The same number, on both machines, and it never crossed the network."
      },
      compare: { s: "Alice has it. Bob has it. Eve watched the whole exchange and does not." },
      tally: { s: "Two machines with the secret. One observer without it." },
      named: {
        t: "Diffie\u2013Hellman key exchange",
        s: "That is the method you just watched, and the reason the secret never had to travel."
      },
      /* --- chapter three: the message --------------------------------------- */
      pickMsg: { s: "Now the secret has a job. Choose what Alice sends." },
      write: { s: "Alice writes the message she actually wants to send." },
      sym: {
        t: "Symmetric encryption",
        s: "The shared secret does a second job: it scrambles the message."
      },
      scram: { s: "The text stops being text." },
      lock: { s: "It is protected before it leaves the device." },
      notice: { s: "Eve notices the packet crossing the wire." },
      tapped: { s: "He takes hold of it. This is the whole question." },
      eveMeh: { s: "He has the transmission. Without the secret, that is all he has." },
      arrives: { s: "The packet reaches Bob, still scrambled." },
      open: { s: "Bob still has the same secret, so the words come back." },
      threeWays: { s: "The same traffic crossed the same network." },
      close: { s: "ECDH gave them the same key. AES-GCM protected the message." }
    };
    /* the café act's states, by the line it is showing (see REF below) */
    const CAFE_REF = new Map([
      [NOTE.wifi, "0a"], [NOTE.pairWant, "0a"],
      [NOTE.eveHere, "0b"], [NOTE.eveWatch, "0b"], [NOTE.eveBoth, "0b"], [NOTE.oneNetwork, "0b"],
      [NOTE.plainDemo, "0c"],
      [NOTE.plainSeen, "0d"], [NOTE.howPrivate, "0d"],
      [NOTE.pushAlice, "1a"]
    ]);
    const SAY = {
      router: "Everyone on this Wi-Fi can read what crosses it. That is normal, and it is the problem.",
      eveHere: "Eve is on the same network. He can see the starting value \u2014 it was never secret.",
      aliceKeep: "This number stays on my laptop. It never crosses the Wi-Fi.",
      bobKeep: "Mine is a different number, and it stays on my laptop too.",
      aliceMake: "I combine my private value with the public starting value using one-way math. The result is safe to share.",
      bobMake: "Same calculation, my own private number, a different result.",
      evePlain: "I did not break into her laptop. I read what she sent across the shared network.",
      eveOpen: "Eve can read everything sent openly across the Wi-Fi. Seeing public values is expected.",
      eveLack: "I have both public values. They are not enough to work out the private numbers behind them.",
      aliceMix: "Now I run Bob\u2019s public value through it, with my private number.",
      bobMix: "And I run Alice\u2019s public value through it, with mine.",
      eveNo: "Eve never had a private number, so he cannot reach the same result.",
      aliceMsg: "Meet me outside at 5.",
      aliceEnc: "I scramble it with the secret Bob and I both worked out, before it leaves my laptop.",
      eveTap: "I can intercept the transmission, but I cannot read it.",
      eveUseless: "Without the shared secret, this is useless to me.",
      bobOpen: "The same secret runs the process backwards."
    };
    const MSGS = [
      { plain: ["Meet me", "outside at 5"], enc: ["8X#q2Lm", "!4KzR7pQv9x2"] },
      { plain: ["The keys are", "under the mat"], enc: ["7#zP1qR4m@Xv", "k9!Xv2ZtQ0b3R"] },
      { plain: ["Deal closes", "on Friday"], enc: ["V3#x9Kq2rZm", "!8mPw4Lcq"] }
    ];
    MSGS.forEach((m) => m.plain.forEach((ln, i) => {
      if (ln.length !== m.enc[i].length)
        throw new Error(`cipher length mismatch: "${ln}" vs "${m.enc[i]}"`);
    }));
    const WIRE = MSGS[0];
    const CLOSER = "Alice and Bob have never met. They are strangers on the same caf\xE9 Wi-Fi, and so is Eve, who can read everything that crosses it. Both laptops start from the same public number. Each of them then picks a private number and keeps it \u2014 those two numbers never leave the machines they were chosen on. Each feeds their private number and the public one through a calculation that is quick to run forwards and impractical to run backwards, and sends only the result. Eve sees both results. He cannot work back from them to either private number, so when Alice combines Bob\u2019s result with her private number, and Bob combines Alice\u2019s with his, they land on the same secret that was never sent. Alice scrambles her message with it before it leaves her laptop. Eve reads the packet off the wire and gets nothing but characters; Bob, holding the same secret, gets the sentence back.";
    const SPRITE = {
      you: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAElCAMAAACWK11EAAAAqFBMVEXy1a9dIx6bKR338OHTsZyhaF7gTiDHbkSxm5KiTizhmF0pICVjWFTxlzLdOh+th3f9zXBxRC1aPESGOEU0Nkc4QzinfYH+wTkAAAAOCQsrGBjLc0JJKCMaERTVOyE6IiGPFxbFazuxJRr76czlSCTQNh05IB7aQiRvNSXwVCd0FBVMJBuTRSnKcT2uWDK6ZTlNFxSHOiWmHBcsCgrIqJbFLBtsDA9tKRpakpYYAAAAOHRSTlP///////////////////////////////8A//////////////////////////////////////////Wap1EAADdmSURBVHja1Z2JYtrI0qiR2AzYOJ5zzn8jgZDAIBTEIpAx7/9mt7beJIFx4mRmeiaO9+ijlq6urq5uff+bR17keT5NwzSMf+n3tP52kBBA8hBAwn83CCCkBYCE/3KQvAhTkAioVvxrJH8zSO55UzPifylIDs+eT22QX9CvPwgCTwoWDS5qKtaB7qoGMgqj6J8PkofpVIOUCDKtgoRh8I+XCJg0+qg8FYngDKJQYnr7rwDJPDKJFB9ZJDKtDAQNR1HwjwbJthkOL03jmNxTEBJIntKIcRBIHAXBPxgkvxAHaA+BkA5NkQBEFAMHk7Bq/ZNBwBhYIPjwMdtCCOLAuZBx0ioIfPhPlEhBIB6qFjxzGBFIjj4MxaG0ywYJ1fjHgXiEAooEEglCYJmS00IAVC0Qy78CpECn5XkIEsZKtcjxsp1rzfqHg1CcDn84zk2ZQXmsVBCQIQiiKApp+uTvuNNU/hwITYbp1BZGip8CnQodEHovFhBy0X8rSM5Lv9ABiesgrFSpAYnMd6QCco+C/UaQvApCc6F+zJgeMI1jFyQyILlo4N8NUhQQ34bWQjA1qkVPP2U4x87RQCD+hWkfNO4fIZGLvJiKg1aBqbz0KlJEA4mvq9b0HyCRPKMgcZqyK51SggEfld7NMglY8ClFHCgG7dEknkwpxOT55W8BgSchjhhA8BkpGEkZBHVGQLTeEAj4qzRWAKJU7J7/PonEIYOgREDrg9SWCFpKEwhJBL9ombmZZf4eEPiHBWRKILGjWggCc7xSLcZgieC6S08f+EUSyT8HZNoAMnUkAt+EIClLZGqDhH8viEev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",
      fr: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAECCAMAAACMgmjKAAAAqFBMVEXVZC6gUCnw06rtmVBXLR/Or5YqHyL48d5hW1/tmi+nmZEpXJdvRy6RdGMbMlijiXOWNx3heET7yWssSXJTb49th6AGPIShydm2hDdEPEFyyOZ8qsk4gruNtM54g3j/wjmQf4CvwLcAAAAJBwolWZj758kwGRX8q2pOJxtsNiP9s3EpYqQWExYVOGwNFysZSYgxJyklXaFVLCEQKE8aQnkcU5X2l1b6pzOAaKsuAAAAOHRSTlP/////////////////////////////////////////////AP///////////////////////////24PXI0AAC5cSURBVHja7Z0Le9pKsq4REm1AF0xwsldmz545J8JCgBA3gf//Pzv1VfVNIN9i7Kw5z+61ktgJYL2qa1dXt3q//uQoy5t9VO9/Qf4XxI3o8P8HyHK5/FuDvOE2l2WwBMbfWiJR+armF2WZLHn8zUFee0lRRMu/P8gbPFEZlctlkiTLv7NqLQ9vMXIeSVkUf08QVpaiW0wylsvosLTjPxEkMiCH/wSQiGy4+9qiqIjKqNAw/xEgL6tWRDgCEf2NQfgCO68tCO7x/33ghFGWh0N+wx/euyUEg7irO0QHGQRBFPSP9/8BIFF0CXI4GIW6vwcIUbQlUub53w8kugYpy5dBSgLJteGQV7v6wLJ8T5Z/I5DIKE3igViJBHZcSiQvIhmX16zf+cUgfKlyu5NCFb7VeAyBgT3Q/S/04NDCHrkrJBVfDoJrTLRq5Yr/7gpkaTlIGsSQc1jht8krrhygfNIXghQMIpeqcmg+3U62magDJNIgJA768mBxl5E1NP1CVXw5yNKCFLkx4edASgdiAn03SKG+XiLJNUj5HAgFlmVEGIokUhQORJt95IWkL5dIsXQ2om/1wbMRc2WB87w6YaGJiSW9d+/QIF8eR2TGJwmu05lDeYi0IhlNc6/wNOjey1w87VPvi5a3k0i0vAAhez9IiaHlsOQVlL4QGxQJ0bIL5J1R/2YgkQ9yEBCyhuhiKmVRI/nrCBL5oyB0kbaaQyCRBmF3FGkQbQZlF4gOIdC4TtUqvgrETyGMakECuE5hQNkKkiLVijpAiBxWjcQ4uL8C+bKkMfB+oDEK8UTla6MdQoy7lVz5oK3oU7NfP4fTHpP/qigVdL6IiheGcl9qFilFiH/D9R+sf3u3Wr0PxKSx99rr31NYwMWIVZQ6EeQMpXNwjisEeENkJMKGdGjL7AtA7k2Qw+wiYEtgEHOVRZVX3tV7X/PLPBBPBw8+SFQQSP6pIJFI5N5Ea8oqPBCt/M9KpEPfcPNJpAA5iHkc5FPo5UqB+zNAcMdbaYdOJUqj9DLMPMlLQ/gvFOtQyy/gnYW2jINIxYHkbFXRZxi7ypXVBYrKB5uV00UUFZSIlCJ6GoVPeowwzDe9XEfKg00dZWLCClgVlb4RMguITBQlkX+C+7V3Ez9G/6SIbycbRx4FUfA0enKX75H0WL0ciHZRB62LFYbRwhKBJ0lMVPmEOGIwXNYhDuegGIR1Lrka4uboWp8FIQj+AAvisjP92huDFFbtJblgvRIQXEbQ6/XKazPHP1UJSyQqD6UPcrAvrzwHV7bj/OETQLyZhvdjDnBdSpW9UW8UqZ1SWaboj9qMiv5PSkWvIE08GI2UaKjyQnnREqKRZaAk8POa26corcjFqRQMtMr/CsMwUpEa35nxsJ3P5/Fpe4q323ibwFxGBBNJIIc3hxBHoyAJjCmNZLAaXojl9rlW3g4E5C9ZKQBCMsjufJDT/HTabun/7TZTJV1vO47Q20ajf/+VF+IhQMO/B9BGgLTyZsLHm24Ngg9VOqEwIFldb9ogGNs5QGZ5noRhIe7JGQRd9195FfwVBBMaf/31F30/SoyhRG1D4SBzQxD1HAhJ5OiDnE6MwiAZ1CistKP1QUa1gjkdjxn9h5HtnrF4ZKc3BMltOqvYYckVBQQyjOO5A/m+PckAyIlAEgZp+aec3gUQGsyRHdk5sIe7njTeWiIX04ucb3AwegofDcN//Q+NGDZixmnLIKoqdgncNzm1aIdviGT8XwIe05htmqbJFIIPTelL7eHI1dmpzA29Vus25fmOBoFQbtIWRnxyHPP5tgIIvTQamhEVu10VhN/0m/4n/mf8zzW9Zz+PZ7NsNELCZS5fldDmG0d2h2JAFECePJDTmobPoUFUtdu1QHYO5L9JIP+ck88mXSSpjHoGpGQlfiUXvg3I7hokXu89kNP+VBnVaoEUZFttEMhxO+sAKW+Za0UyKTcTbQtSsY20JeKDkLrUr4P804JAIgHn0zbf/hXdDsQuyep8riTflVdtkP/CeGBNb4GcNEhFID9h7j+1jVjTYmO3/joeRrsosZOd8oaRnQRgy9GJrmrCm5LrFJAnQvgHh3Htdq1i4drqmkAKzD3sKHZKQP6bNJEZ5nP7xkwNKenJdQZwu1wLSyCRV1c/WJCd2hmQf/zjH+St9vv9qeWxcHUACQUEUaNmENUGYTHirXjzkUCeDEh1MxCv/B/oiYiO6axatZMIDQ2iaTjhOm2rikAUg9S1JanYRiyIFgj+J5AnA/KGQtfvgyxpBs7BGe5XQP4vS4SuZC/39aQxON8irxU+KSMRIWGQb7DzNYPIi+W9x5pAkpurVlEGPkhCIIeyBUKJazgej09O041EiCPeziJkv8rMajnfIhB4rf7jdw2CF5v3HrPhiEFeiufvBsEiDdKGpcutseo5HKZpxLpF5pMglIQzZ+ySv9NoNtkx6fUCdVW+O0BDVRAaW5qLgSC52RAI5cEypUyS24CgvKiXnCITDSGLNA3SpCJj58BCIE/h7EfDIAjmZjRZlkGUki1ipmiKPsi6Cko4tavWaT/e2QZZJtHHQSg5CJYWxPT2RAyCYgMkcojoR8FMSCKU9WmJgKGJ4+2QpsAjeqmootR6hYQrXpWVCKsWQOYOROcRhw+nKEgOjERs6USqBg4kYhDMVoekSA1NcR9oUPSOtwTyFyZ+Hogu1WkQSCSOT3aQNBDeN1nqg5SvGMpbQKIlgSQXSxhc1mSQWkCWEabloxAzPfoDg2at/C1PYMmGrkFQYCzInaUE/aDNhO6CqFb65INEUfkhEFmlsbV/LKTxPH2nM/I0wUxpFx12uzKiv/vr36aEYMdTUukSYtHuoGNjqWjOH/EtwJhAlBqEHCHHkZIrLzQriX4bRC8H8jKMrPzpYjObrELKNIzYBUew+CXg6CfuiOpgBr2mMHNbXsqyS9kJsNgRc8pwJo4nC0L+GiBKQAiFl/p+d2Jll8wJQO7mQdYKC4BQUpckBmSnQWhgHkT/yoNZdoWuI7Z7GhkkR40R5LsJQFID0oSU/hYcDwVEyijl74GgM4EFq0EOSz3rLJxEODZgirRbahCJ3BqEUCIL0lKtxIIUJFBFU6ynp1E6/Ne//kVz/9mMy1sOBG0r0W+DsGodbCuMBTloiQyHWiIMkkT66ne+NHYAUZcggawTFRFASIikX2RnpdJl7xCVLh8kMhN39QHVivApWrWW3EhKSWwEiUAmO505quKgCkV/AFFBu4qd1EJ3krPTVfF8xrRvAUQhs63weabsm0SUQPRoBEHEtW3bR1F+wEawKtJaYkL1/cDheUgUOy7tcJEr95MoSaSqVnkaXqMo2y02kVnhqmBYimvANW4DbkJuREivIfUt1MuB5PU44oMcsE5WCgjPp3CRvPBUVRcgrg6nQRA6oqDVZ1M4EFMqc4qp3+XfyF83AymhqaWRCEBkjayU2U8nh14+5CLC8hqkciBFB0jk1+o/njRaiUQSRGhOMfypdDJbctGpaC3magEZkFJAog4QUUp1iWFA3ALlbdJ4XSc9LDVIjhKCOKy8FIlU+YsLus+B+Eu+LZ+n/54zZfX6zOqNIICwIQR5u4JmSRF4yWsdnP2ZhXVe1IKLtvWcQorrRJC4Ui6v93IHhS9M/xaUr8Tz35hYIU3hoF7xlFDxPTvY1UTp7+c7TL+R/wx6JX2VL6XTo+Di+n3Q7qzhl4XTXhgU+j5cyfEg69bqZiARg0SsWLVR4soFagvimhgZhL/i2q3XC8hNjQQTIGJMpxw0AC6lokuQw0HdDGQpIMgTlAWROZJZ20QORupU6GAmIEq4SMdLv6mR3lRoEJaIBamKom03IpFC3US1YONRZJf4NYiqdBKoJ4yRxDflg9DFyMo0ZlCt7kwBQTNIDxy9ewYxVn8pkRvZCEB0q4KsfNbWOzLIPWdium9DJMJ3GCEAobxHWWx5H7lG1APbCInvHpoVhtOwh3ctTfRTzpFx4LoRCLpFRRgKpV6pHuw4NSnZmZqJaMEI4RkDcyT+gpEw3MKmMSV67XTR/7aisTiHi8WZ7wB73INpn9IpFv26CYi0tikj9Z0Pwnc5ciBT4VgsVvyFD3KwG5K0KYXnlYwF3hGyjuX68uVlFuTVHq7e2ziwVqiMROB9HciyJZGANSJJ00mIu7zoGSsIWEvaIIaDQOilDLJsgyjbyFWoj4BEuvNVr6gqiXnaRDpAYOI2MwLHYkpuSa5Q7ojYuhKQlQVZGJALibj1kY+B8Gabg3TGIlk4+CC5B0KyUrkD4ZdO6PpWZMkCEoityWur3IH0V6tvqwX9p0H4BiH2mp0Z0s31MRC/mVI3+pHLQtBycz2+0fe6VbO0aTdNu2A8KdGw0ZuGc6TAbDekeeAIyd0lCTc1RSVC/VJPJA9+Ryo7mw+BqMumi50GkcZMo8B8g9ttpayLRUKXu4BHcp2yQUjBfLQQpfqWei0hVRTCb2EWohRnC4W2eE7zPmTsz4Jwmcg0VQLkvmyDKN0GnJAjXmiJFNbOF6x3NFJ65eHA5Qr0BQUCwuK220wOkuZ9zGtdgigNEl2CoHSjrAg1h2JdC30Qjv3hCkYhKwZcptPTpzyaGhA2T5k83ASkDSMS4QYLvRdaOpbkRnLFQUdl1NzpO778cEUgqMDwPwJkyuZRaFY3n82XYaDn97zN4cYgDgXzhRolNVYtzh9MWECQxxIKmv+keATp4EKLhALjPbeUote2h6gPkLTQraaQG3FHUp4oeEZZeO3numJ5i4aBPK9MOldxscnvRSHPi3xDchKO50F0f+/ZDDpuAqhdxGFQ3NVqkOguI6k0FbwDgyZahWf+7W7h2011PRDbyg7tVj3O/jjFwv2W/VL2KhRRBpwlMgh5MQYJiqjQ2hUZFx4FfwLE9lApTpxIJCHni+cpd2xj0idv0yCROKyFkBBIqX0DM3Batvx6EL2nWKpDAa4Psc8TC32hp4lQrZ7MouCLDUjCmS66afF6zsh6ZESF7dFT+kttpbc19lwXZF02By2ajiizCmyPrwxcHl9/yrGdksdQp1VCgmWiYIpvtGnRr2lvWly20ZtLuC2IxAovTkpcwHVcFg96ktdP5fLxioUDkXjYG7EA0yBNA04yz6EF0bJ/466Y9xXoEBBz1WrUlXIDa9JFZasqIo1iRCAUKwsyDafnwL4+ILLFeeqBFMWNQfKiLZH2CFDTOQeqY8fFEsKahovWsCALtAo7ehUsANLT9iid/+qGIP7eD3eNNssFCEkk6SoxliNWrTaHAzkv0hY20KbTyoGQxb+lFPTW4kNu273zPAnEnhO3eSqYTqfnqZJFkl3bTKIAVuwbhptJrcIkifxX07ySrD2oTCmlkgq9uqGNYKBxMVeLb/pKdI2ZzIUy2cGCVL0aj8eDcW474ushLm61aFu4ByLioBeiF4QGfd55EWgFkEaaWxu7zHtRnjIaLh28fMs4gtDP3zGIa+1X4yG6r8+LCxNB4rsSkIo56nw4oLfSqw8ORBcbPgOETK/0QCoGIRfmg/SdRPJ6PE6rZe8SBLNahpkUIg9CHtJbgV1egdBPrW4NQo43ikJRjFWolzUoa0XOEV6rFkDGlCaGi8W1TACSGg4Hoq5B3jreDpJzZR3lKuQZMNSCt34ohIlzmkTDu7u7Rw8kH/f740kYek535ayEArt9qRr2B4N+SpP3cxhpkOrTQKo8hVKcJSWakvPUfXohLi9chH20ihKItpK8wvf9xeoygIhqrfqJYx7yS5GHhbk19s+TSGqrT5yUjJYaRGdLAwMiJKqWq3Phw3grAfnWBnm865MXFyciy0RfBhImPkgIkEdPIlcg2u2a3751SWTFIOWngrBq0e10IIEHQsnFBUgtIItOkAVALDGBPDIIaWkhRf7PBllZEEr4fBAafQ1iTdiBuNqosLB+JcqTyKO8lCVS4RSu9xrJO7a4KiMRSklkRSN4K4gX0Z3Fd4IgSC5R+Q7esb31nSBR6IPY0rsKdQ1aQJQP8sg24jtdbfH4pMRzv4aZQWTRK/oCEFnANGsIL4PolMTo1aoDRF2CTL8CRGThQNQFiJc0WhALwF8tHIh4aoA8ioNbDQkk+WQQsZFQLJ0dV68slTgzvjhExEG2ocG714aPEhAvtEprGt188ldKYZdb9sAgyMrg0oOvAOFZtbaRFea3URmaPHLBu0A2cYMxO37H1a0W3mLOiqsMJj4Ohkeins3iecMvHeBfShUFvD46/UwQuV4CkbUburbw7CW3K959uGkaCEWDDHSquxCPZUD47wgky4hkvtEvFZD7HtcjvgAkDH0Ql92ybg2PGx7NcaxBvHzR1H08kGwWz7C/91EctYBMP1Miv35JQLQgUyny+Ol5v/84Hg5nuLyZ7Nod2GSRJQLwaU+Kv/0h7wPdHB/YZ8kHRV8B8osgKI3n0o+kKSBp1xWIZYWC1YLycoxVaxaywDuIZAqUbxO9aYxfOZBXUZZFIPSC4DNBaOLJYlgNdOrYNWHii7VFrKvZOi+M6AWSgbemq0VGHADphYH6TJBcTUXhz50gHZd9McEV58UgHqyne/fRfaBBik8F0bV0nTouruexnSSr1vdXIIsWSE9auD4VRBs8DQntq06Eywtf2NxEr+Se+a3PgQQ9mGHwzgt796bjUFozFqGtol8plrt8/yv+a665YwUh9NJHDyTEqhZq+O++rvdvA1dRkS64pCAKNu1Sq9ZUyhOPCUE9V6ZrvZGm7AW73ujzQaJCpWcuu60WU4xWQdcvmay8VLcT5EozvxSkaIP0potrd7taXYAsbJrCqcFi1frHPwPChsLLy9+4dWG6eObuerN0Z+kXEWXVNq0+gURh+DuX9JtHt/Fq+jDhvV5L2MnKN3K51jQIwlXL1FddLC7EkCNIq7wIfn0hSGvx4P4+WFw6ILq7lGT0ukCMkAYDFxH530hN+WiXrwTROzs0SNAJkt7f359bXrgtEtZP4xfwi0GK3zy5/PdB3PlLLRBXTJziTMzzlQEZpvN94M18QQKQX787PnhypgFZXcSFlQaJ2Kf1V9dj0BMQj5Di5K8/BYKdO2h5SrA+vbhIrDD74K4UXXTpcdiRVs0kCKZhS1ir9K2Hm30OSMUKpqRp1M82xMTRlXLPo2cGf1eooD9ogyQfOn39oyAFy0SaA84deQpKFYF3mCB/hdPXg0W7x5SY8+LPgei13m6QlZ7+0vRvMJA8kyMoqjCtqLj68yB21d3vR76cEvY7xpXxL1Yfu5IPgZiTWhKcFl/kUc/E+Mu57eVFX/xbP0yS4NcfAsH27snYjCGvmEH5w9WrHK3aIzxxP80//JiFd4F4BxgNJ5M0TTXJZMIgvF0q9Oa3r4KITzijs6b6YyDpFQjv++zo13iJA7WuafgxO/8dkOznz5/YpbsbjgGiFWsiqlXSDDU4e/n56i0Dq92/Pj7eBUJXTI50gN/oywlrVzpOh2nKQtphj5WcwRqaltiXDOSMfs60vM0j+N4DQtePlYJHGnd3sPV02Bqqrlxmf38/XS18k24bOFofA8Wrt7d5nMpbQfIhZDEABUUB+q0DJMO6jXQ94sDu6apjImW+PLNlyA7K3R8AEY7+410/BQkOrwCBATE7U3M8ACaYej2MF6ESS9ECwicJ/REQoAAEQzRqp7Q32zkQnSZOV7q/6xuGlcu3RTo1EsFWwF1V118L4mjuONPAegDGUGmhDCuZoPCh5ei4G/LsXiQ3lC9x4BD3bg7lGx2SvgqEHa0Hog9llG8Gk3GaZ8Ms+6lB2juJu4Zubhrbz2WHPtz9pqK9QyJtEDdgM/jHGiCZDfFB5I4p9zbq2724O8Qi8uJjm+mkkMwuU18rkRYJQCYVQGbc3aPnHtHlXn0PpM52Q5MXaBI2O/XZElHPg0C16HqGWDLfOYkEvIftWcXaMYhmQE/jZIjQSlnDZ4KQqTpjZ/NugzzC7G0eXEToJkG7Cp86fc/nrfNjt+DM0DYjrmGc/p9UDzL4scxU6PM/D2RwMfqD/oVI9Hi8m3ht8b2g17ObqfXo4Uynyks8bTwda/9B8v0UEFLqyQXGlUQ80YyxB8uCXMzTA33umQYx4hCY8WNfm9w4f3+58Q0geZ6+CnJnvxhTMMl5t6vdD94TEgOVX4HoxV0D8kgg1e1BKH3qkshdJweDDIcHDWGFYiSCP/LXJEIg+SdIhFKIsYMYD8av6tfj4wT7ZIJe94D/zWY0XLrJn+k+bfAbcf4dIOyT2oM956WZwGb5tXw0xTUI729C80ZmP6Mt30d4ruHNexrJsY81RjfIXYfNg2aYV9FzEqkdiJkdeO9GHeyTQMYahI9E+flTnwPGmeLk0mDM5RDIoQsEZ1BZkJmAXEnkU0AUB162j45zdbgd3OWPPojU7TolMmOS2SzrAPkkieB0OOQQEVJw3vN2KPkpCfrcjUjh1kLHLmwfeqibb2RwJX46jbBtX3FPJgvUd3qPEtx5E8YnuF/MBlO9AayoSvcojiXlHwecylHX5IO6on26TJaBnR9ynxp6O3lORTeI4NvC7LNbweTzE0AqlH1SM53bHeRsUf3Ev+iAA+srnM/6eKVgd48pzawCW+jiRgmIRUDS9FKKDkTdHITEMKG0dJjrk0SiCKcaJO4RhpLNQkmuDIVASCMdCLd/OJDJ2A9FfBv6yOPgWXafAJJH9rC7nZz+Fx0CPrxPHrLBMw9yYYMOB8STjPPC7CIR1eLzECKVXmgiWwcy4aGKVHXrgJi3J0d83ANA3EGfMOfI1EN2Yxvx+4h0fIVcE74AoSxl8tgSCE2XJ247320je/sBNWayGmkQzcLnBOEf2RO5bGMwfKD8CSAoOoS2aVBAdgzii4RAxqmdEt8WpHruYWcKT0dyqiUnMcF5qXFfg3D6KCA4cyC06sVZC4FEaQvkDhKcVJ8jkTRNdlVV10fFLdMYdLVYbSvtQ6oEBhEFzxCpZSIO/eJ8hqMEx4tzaHqyKJ5QvptOOG+XaSG94Q7mMdSncby/a+BFkOhwKOjijs16v9+v+bkP2+32yE9rah2E+28ylFEvrzebDb28VtkEJpuSt+PshZvkE7J59r+43gk7OAgEtdfBED3otTnZQsYNQEy5A3vaKkhiYx+T0DSbFoh++BZbfMAgTIJFhwmmY6lVHgbhDXMMomce5KdQRBniWTA1dokF9vin4H0K1nvBMvhwEAZZ4+kI+z1AmisQ/p1/ssqkv59BUkzHUp3k9wEipw94IGZ1YsytzDUSh8DO9G8A4jak43gz+gkeCHrFBUS7LfzxFApIBYFkWe2BmMSYVCsJON8KMR9M73h+j+Icq1Z95Dp+dVOJJDgyD80/FTZ34CY38sAKkch8w4/R4cjeUi1Ka4/HbMOPC2LzZono5ehHVL1ljZ1XUWE37KYkAmZGIokxkVHApy99ACRhV4R0StHd3cDE99hHsV3vhWe9bbZbLhlG/OAp+7A9PG+gxmnrW2IdpmNsFJU7ridPd1z/YTuXyiL8FXbJbXAIdlZhoWikPzFkrY3y3wNBt1Qin0Cjws1llfJB5uvtptngHNUqaYE8CQh2KmwUg1AsmbTqk7DsgYn6A3LOAIHu0ufHAtK7AHlrI9qzIJSHVBmDzMXGt3u2EhIJrpXSriLvBmk0yEBAJhMDImVEUTSZN1OCyCAZg/AGXwMifiRCtvB+EByAkEdsxTi7i2OIeF3cMkQS/R2DKEhk5J7j+ISd+1oiNYPc3aHe7oPYISADCwInYlRLFPWpRyAlnn33bhB9POTIqJZCWJBHHmHM2VxEPk0N5iuJEAhLjyyeVevRqVa/xdHXNiIgqpnHW5IIzugL7CeKauFmvg+kZAZ6P46O5cMxmtjEQQ7rMGP7yJ2MH5BnwzDDl/RX9dyQZ7CRweCym2bQdwVkXpLEogrrLyllnGHPfGlvTpjk1XY/V+8CwakgfBf4jH4G2btnBe3bIPNNN0jlQDadIK1KuIAcN5m8Z9PMjlcg9TY+1dV7HqSCQNQG2a69px4xyCY23zJI9CLIdwPy2MnhQJxEKNiW1yDbd4HwoZwc3F4C2epv169LJDMgd49GqdogElsAwq5xP2MQzD9tDgfVIi9ZvfnRNrk8uPRCIrO1e5zWKyBMElWFA5mJRPq2xnMpFXyBIAkbmbFXx+PqoFoHk8cxyGzevPkZPZgUsShR50l4Xo79mvM1HpFFN2uNqMgOayMJy7rhwlDRfgS42u2K2tqVBrl77Fg7NXU4/CNCzYN98hNS1SoItQ8GSJXhpzZvBSl09HAg5HnBgevfO5AsO24Y5PoRzDgwcFevWyD9ThAzqUfIfEQOY0C2pEXFjkEkhyOQPIs3nHO/AQQVBQ0SOIkcBYQAMK+SqI70tplv57NcP5zYHezED1hQ6lUQTuqfATmdKrodBGIehmpB4uMrrWk9PQGR+YUPctQg+73FEJANCWjWOZlvgTTPgzw6EC4YTR5i5NaiWgD5pkk0SPNWEFJ3NdKqlQgIB/V4rkHwY6Bie0olMspAZhmeKsunkErJkZ+joijHcKq1fR0Esf8RWf1DzLfqdJrXIhGTUDMIrmP+FhBcDj9fp7fjpBeZhnNYJlXcc1Rsso3KI/RgcnNMv+86ZdBiGS1nFgQB8fEFDpKITBMpT9nqn7NuUA0qR8YXAuQIXwM3+TIIHiyDDFFA1EFArIbs914soc8jkRwpEN5fnGKme8Kj++ioHxgEkLsXMdogp7kDsasRBFIzyPx1EDIQDwTPP8p9iezZablEhUHuNchFwzKBRKXS88n56Q0gdw6ERbJnELesMgreCaIf3dTjx7gwyF5rlS8RAckEZHW5wQggBT+GuW4QgE5sAf3nQfq+RLRLQYByIKNRUDEIiSp7JSheg3A3iQTotbZzL1GBjaDUET4DwvI8xmuA9O/8hd87b1jVupP8BTbC0heQwmY9TiJvAWFfxYUL3m903ByzOT8VjGLIfm2EIil9TZMWt9d4ag+K5Leja447/DIBGQzGfbv+/vDdjrFUGMPztz53zt+RRE48p16fUIWobL9HRBJhNV83r8wUCaRqg8h0ikG4vthWL75d9pwWs6/FgUzPITkvuonx1laBBWSrn39Gv34MIKswHNH/KxKNgMjt4nKKB6KnOARyfNVrdYJIUO8GcRLpAEF/ONR6O+aM14KcSErGMz+MwSEgWiLmny5A8t8HqSUWxmth4LJvBwiLpN0QABBpHrUgfQ8kts88pBxn9cTHjTmJeCBHCxK8AyRv2YiyIDxBX4tEPKm0QezWWwfCp7gpuuhm7Dd50LXG3mOP57yp9IkykbDvg+znAKmCXhsE7qzOXpOIgEgHEnzf3k3TTd2EfwQmS9UyCHrPbcQP7wNt7Oph+DAbW9+LRwqukbn5T3Z9eECrQf8bDqNCQDzx9fKfORaO5bF2AFmT+1zPKd96k0RMK5W47blJ3F0wRE3oyEctu6vHExG8HcMA4aKtD0I3nPUUFLF7ODhd+gODIDtkTzAX30Kzn1x32Ee8eFnLHaUXxC9KJG+BVAIi0Qly2dtguG06QMKXQIxasZ7GPOyDKCmWCwiMZbwVgez5ydszB4IHTAkIKUQ8eyGWACRqqZYD2TOIJdl0SsSdjbKaeiAPD8Pxnel3FJC5r1xwxRbkyajW2oLw4wcdSAyQ7YsgkmsxSK+X63zR2DevUxmbYZD7K4mYB46cFwwyMiCzsVlRMBKZi0jMs11/PNyJao0AMhcQPPt1cy0RAWleBIFEMLFAa8msobkG25ZUFSHS0ylGWaA5YjUh5X0hrUNAzi2vFfBSdf0gzZYI6DTYB8ZMQn9OzPasAW+I1ynK9sSceOMQ81393D5OYNcmBNXPZ44QAoNwkrTWwWNvPNZ6zY/F3XC1l+70Kjy3D9lZ8dqmhEXZAXrPIGk65BrJ9x+wa9IqMXYiOYXfQm75Zzsfheybf+D53xgpmiwqflQWPyPSZuJAievnex3FRjRIzdxr63v5G9TaMGo+XPZ8bp+y6m8M4e3S6Omo5xbEhg8GoU+MT6yPjMKFEl662pJGWYEAJLoEwWTlRRBfIvIWvn5jGryq40DCc0si/vEnIYPwg+A28yGDcKgzlTB8INuIA4HnXWmQ04l1j0HqDhC+u6+DJIlyIGsvFgoIr6DjEsMLiXjnH4QLA5Kd5ljwHDxyFmX8VAzbQ9roS2T09E1AyNgtyANAmCQq2lf1ko0YY8eiTrYGto29s2Y2m2U4luzIa5XLZXJugfib2JGsQLNUfdw6kL4DgWrEWDUUCD4MLJ2kE7g1dr8srpgiPkDMk+sU3UN7Z9fH53N5gPBbnCzEtrHQnPPuryrfrNcKejUNL0DkxANoG58Mj+3dmy0mSQLy+O0pzWYz/ehfuunfv8mg3BcF0c3mB46f4xx/e3K3sNbXRCA4dsyBbLL6pTiyw1MzIVe2qDUeGM0wshaGwjSEyvO2SxDEkpF9ZpUBmRsbCZ/SDYG4CtE3Q4KCT7hpZhsfxATfFgjpydskQiDwdTZ/kKjBEpE9bMfGAwmvQM72TFAB4RkSdiINcNvTbDhzFaJ/GRBxWDiuTkB+CIikdnuAKAtyfDtIRP/NIJE1QhciBzsqAalZ5zRIeAXiBUTk3gWv1bHNDnC1qa61czz/MbQglJeMQljfkEGwPr3Ws+r93pMIVt5iB/L8giLSeH6kr5g33aNZAxLuBIID2IgrrqX39UIivJPVPOBpis5AteW5E9bTuVwYfif7xlTqgffuGDMPsedFNsE8GpC9KTOvM+6tIKEULJG5ZyPZ5oWAyAdY889HFsKn+vFWqWxvHQBNqPJlKM8/O3fMRjDZW6EsyE7jhDRkfAZIHw3mDYFMrEahOnKeca6lKyoAabamcDNfz/gAZ25Aw9XAfNemOenUvAhS10hIYzmmzyQkG3nq+xzuJGeQsBNEGztOvZSFntOcn23OIFh5m8WzRoOEoQEhIbnpowWRVSSAFLtCg7hZ3qlpnsscPRBS4wsQngrxQg8kkoj77ZTIcyAjnrdTOHIgoQO580F0w0sXiFWt0/MpcE+fpV+zpZkummMmINuY79M+hkSSc9gJwmd7C4iuFPgglKf0h7PhTEBQN4FIzqjp+yDkKz2JKAEhElatN4H8Eupmzl6XRzacTDDNGsbORiggRniGQgfIWT/+5bzMlcouQMJVuFpNJuHEDd4b9v272LkBMUvf/CNj9EqxjaAS0qz9pInudmfCBZAZZlDcniSRPVvRfIfGUJdS+C9tQGSQs9OosGfS+CLfyH0lkPFkHNqORyQl45gzdSnSbeetpu27Mc6ktfUBntZyCMszehev/sVewlU/B9JgnrkhR7dh/dpkIZfPwiG5CwOyMSDykB3bj6xdb8in/+ZZY0HGDCLrs1hMmfgVlG3c2quhQda6+A+QxoFs9XxCl9Hn3W02sBGO6JQKHDmrmWceiFHPeGMCooBo/QJILyqj8l56y61ExhqEdGuSDlcWRPJCOKzWviYNItNrLjQ08uDQjUjElXNeBGlQi8mMas1rZUGscsaZBtGqJacC4oyyc48fTRDxk6iNRGaQyBnCSOdk6dgEvnow8Z1+/ZijGO+BwEz3umQuILIquaGMaSulQlOjmnfv7eshB8GLMrhyekM8n6BFgW3khzc3yY547CUeASjPqgrNI5vMUx12uyMlI5xpnR6w5YA978OWfC/bOEAe7HZpH6P/OJ5lm6w9EYJEjsdmK34ZSm4m4KqzeNqjvxbL0JPcOOYLQKo9zE5GIKyieBa7Pl3K7DIyz47FtNC2RQgIt/tjpjGDepj1UbtC0gLpE8nM2OPeLOzU6PyiwUUDXIGwUHB4BkSqsXoed/JB5t4tipFvRXL0vYBM9aENsu8CILEHIg3+dmIV64Xe7kW48YwlsmcM/nFHB8K/Ga+znnc3cAnIftus7d3sAJFypxKQngHpXYHMr0EaC0K+9/vdcwvVpID2pnkgdphgQlbwDMgRICd64b4N0ncg5vqUPDI+CHXgaEkkdyDr2IF833CMZRM//XgehNLaublSYyM+yPxtIGSjHHU4c3XteqS3D7HUOvHhMSaN8vxI7tzAo9r1LokaKZqp/MROItKFaUf/2dYBbn+Qe7bnGR56K2pzvrYptTLItrMur0HckqcH0sf0aC6AupA8zy4eHobNBVUuzaVSEXPGLqV4cyLM3Qur1X20PQJkPTcFqbnWV7b2WFdZzVVSfK6fAbHjCmSuQaRWl7lDDxikUoolspF5g1yESOTOb6B5eXAbMIFIDWdvQZQIRJQTIOYqsw4Qddy/BiIfrkEqOVin1pMfHwRz7n3L2N84DIgWCSuBlggZjwVpXH7cAXJ8FmTwEyBa2vwzRLW4WQWFA0hH8ZPaa/EsWkNPfGTHO0HGAiJei/7Az6mtRES7XgSpM1OS1K/6PjYkIbaaouuLVSbm4gr6+KUwUddaIOhARkHSbGmgVOq9EhkYG9EVZwTwnGZJmZ3pOSTTiXgFslm3jGT+Y+Z3IKJ3csOY5sOk11rO/amQYaEZbWubHz8CspfaFse+I0CkBrLRG2wYqdESya8CYuYtePKiZxskk/fqUrYdGqRSsEgDor0KgwzeDXKKBUSXfuha1Qsgl6pFc9v4EuRbSyIbilWNThS6QHyJzD8GMteKtW+DHDWHKNnzIF6TGf7fzlZtEJSH2hRNvJHjGdHNzhJpdXcZr9V/v43IMpMGqY4X42WQo11+0KWf08P3sasIhuFEHoJgYWpt6BJP2H9t9+4zZnHzXbf1v9tGXOUHVTrttVqed663QxyvQZTNTrWrxZKrpaB5Hk0KMV/NfK3KlQE5YknLrcdzMX9sjrd4K8hEq5aePc11uRFTTsxH6IJkDoxfxmKeAVm3+v5iBzLCPOoVkMbORGW/z2+C6CkRd4KSatHHY1dNI+UKW5kQrXgepBUW5z4I/+5AshdAkPI1DuTubRgaZHsBguIDvAwFaROkYD/PghzdapvJD04O5EloaPbNjwWyEtkpfZT0ET3z3n2IGxzkMH5fHHEge51wzWsNwqq1FQPkObuJx5cglLlubQ5iExXef8e2MULtiv6Y4im+6a7mAwWqChX8mndbtvMCGGMzdocl3b2mYLbrf9bM/flPgynDUYzdlO/2a7c9qtle1n55z1mzbuvWjx/bH8MR12m1RLAddxQq2daOrU9KOqK2kuDbTqgmO87croQXD7ThLRkDc8THbNNICGEemgKZSaJM3E2PB37afo3CT2vzPkA4s/Q4OMugLC19MhyhbPcmFA3CAil4JyjvSI63e73cNJ9R/Bq0QZ5j6RvPKxLZYBsXNyVJq8NRS4TXz1zbDfsvAakvQBpUgubtXS80+PwrXiE0JwmMLAj2rlcVduY2KHV7kX1GhnQN0u8+xKoNEs91EaUDxLaF8x4QrHPP6xYI/WKJxHN/YxiDIPRkk7MWiAwLsuPeLo62+M0FrPga5OUM3pyuRDaytyBrAeGlAVxGhsqeVKekhgd3cAnyC8nyVqrx22brBj9YCwN2PtyVpfSbo5efUDC3hAbCxDZzK9HsmM28fTx2R9VF77L9e5kEo5a34VozbCCGR1/zte6C1BXy7dRISl/1JQhpSe3l/AzR6LXdjQ6kaO63aoVZIieTeo+XH0jo7s36Vy4pHFwcRuPvsxJ7edjMGpmSwKFv9KREaSvlEWMJzfhnrAddgdS1LoU1RiKOA1st8Cyz2pzDwfaBZcqNcbeN2+m3jh3InX/F3uEOLRB7RCKeEqdB8DO5UqCwBOtAuCJrA94LEnEghkPDIBJaEPJYtawl8QSdpbh3ixuvgbT/uhtEW3cHyNY1/Bw7QHKWiClWNC2QRqfxDmSH7J2bK/QGMs/W1+S2Zsa+u0E8jfNBxpsYvQWmiYQ/DB3svmphLbBbIv8P43zUxx31KgsAAAAASUVORK5CYII=",
      atk: "data:image/png;base64,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"
    };
    const Fn = ({ inA, inB, out, phase, capA, capB }) => /* @__PURE__ */ React.createElement("g", { className: "fn fn-p" + phase, "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("text", { className: "fn-cap", x: "-21", y: "-22.1" }, capA[0]), /* @__PURE__ */ React.createElement("text", { className: "fn-cap", x: "-21", y: "-18.4" }, capA[1]), /* @__PURE__ */ React.createElement("text", { className: "fn-in", x: "-21", y: "-8.4" }, inA), /* @__PURE__ */ React.createElement("text", { className: "fn-cap fn-cap-priv", x: "21", y: "-22.1" }, capB[0]), /* @__PURE__ */ React.createElement("text", { className: "fn-cap fn-cap-priv", x: "21", y: "-18.4" }, capB[1]), /* @__PURE__ */ React.createElement("text", { className: "fn-in fn-priv", x: "21", y: "-8.4" }, inB), /* @__PURE__ */ React.createElement("path", { className: "fn-arrow fn-feed", d: "M-19 -5 C -19 -2.5, -13 -1.5, -9 -1\n                                  m0 0 -4 -1 m4 1 -1 -4" }), /* @__PURE__ */ React.createElement("path", { className: "fn-arrow fn-feed", d: "M19 -5 C 19 -2.5, 13 -1.5, 9 -1\n                                  m0 0 -1 -4 m1 4 -4 -1" }), /* @__PURE__ */ React.createElement("g", { className: "fn-win" }, /* @__PURE__ */ React.createElement("rect", { className: "fn-box", x: "-17", y: "0", width: "34", height: "11", rx: "4" }), /* @__PURE__ */ React.createElement("clipPath", { id: "fn-clip" }, /* @__PURE__ */ React.createElement("rect", { x: "-17", y: "0", width: "34", height: "11", rx: "4" })), /* @__PURE__ */ React.createElement("g", { clipPath: "url(#fn-clip)" }, /* @__PURE__ */ React.createElement("rect", { className: "fn-sweep", x: "-17", y: "0", width: "9", height: "11" })), /* @__PURE__ */ React.createElement("text", { className: "fn-f", y: "8.4" }, "\u0192()")), phase >= 3 && /* @__PURE__ */ React.createElement("g", { className: "fn-result" }, /* @__PURE__ */ React.createElement("text", { className: "fn-out", y: "22" }, out)));
    const KeyBig = ({ n }) => /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH", className: "bigkey" }, /* @__PURE__ */ React.createElement("text", { className: "bigkey-n" + (n ? "" : " unk"), y: "5" }, n || "?"), /* @__PURE__ */ React.createElement("text", { className: "bigkey-l", y: "20" }, n ? "shared secret" : "no shared secret"));
    const Reverse = ({ inv, s, start, pubA, pubB, tries, phase }) => {
      const wide = phase >= 5;
      const bottom = wide ? 145 : phase >= 2 ? 54 : -4;
      const lift = -164 - bottom * (inv / s);
      return /* @__PURE__ */ React.createElement("g", { className: "rev", transform: `translate(0,${lift})` }, /* @__PURE__ */ React.createElement("g", { className: "hold", "data-audit": "DIALOG", style: { transform: `scale(${inv / s})` } }, /* @__PURE__ */ React.createElement("rect", { className: "paper", x: "-116", y: "-74", width: "232", height: bottom + 74, rx: "9" }), /* @__PURE__ */ React.createElement(
        "rect",
        {
          fill: "none",
          stroke: "var(--danger)",
          strokeWidth: "1.1",
          opacity: ".8",
          x: "-116",
          y: "-74",
          width: "232",
          height: bottom + 74,
          rx: "9"
        }
      ), /* @__PURE__ */ React.createElement("text", { className: "rev-h", x: "-101", y: "-60" }, "Everything Eve can see"), [
        ["public starting value", start],
        ["Alice’s public", pubA],
        ["Bob’s public", pubB]
      ].map(([lbl, v], i) => /* @__PURE__ */ React.createElement("g", { key: lbl }, /* @__PURE__ */ React.createElement("text", { className: "rev-lbl", x: "-101", y: -44 + i * 14 }, lbl), /* @__PURE__ */ React.createElement("text", { className: "rev-eq", x: "101", y: -44 + i * 14 }, v))), /* @__PURE__ */ React.createElement("path", { className: "rev-rule", d: "M-101 -10 H101" }), phase >= 2 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("text", { className: "rev-h", x: "-101", y: "4" }, "Trying private numbers, one at a time"), tries.map(([cand, got], i) => /* @__PURE__ */ React.createElement("g", { key: cand, className: "rev-row" }, /* @__PURE__ */ React.createElement("text", { className: "rev-try", x: "-101", y: 20 + i * 14 }, "private ", cand, "? gives ", got), /* @__PURE__ */ React.createElement("text", { className: "rev-no", x: "101", y: 20 + i * 14 }, "\u2715 not " + pubA)))), wide && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("g", { className: "rev-field" }, Array.from({ length: 42 }).map((_, i) => /* @__PURE__ */ React.createElement(
        "rect",
        {
          key: i,
          className: "rev-cell",
          x: -90 + i % 14 * 13,
          y: 64 + Math.floor(i / 14) * 11,
          width: "11",
          height: "9",
          rx: "1.5",
          style: { animationDelay: `${i % 14 * 26 + Math.floor(i / 14) * 90}ms` }
        }
      ))), /* @__PURE__ */ React.createElement("text", { className: "rev-lbl rev-mid", x: "0", y: "109" }, "and on, past anything worth trying")), phase >= 6 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("text", { className: "rev-foot", x: "0", y: "124" }, "Easy to calculate forward."), /* @__PURE__ */ React.createElement("text", { className: "rev-foot", x: "0", y: "138" }, "Impractical to work backward."))));
    };
    const Patron = ({
      spot,
      who,
      sprite,
      idle,
      name,
      state,
      inv,
      cls,
      screen,
      extra,
      lit,
      morphing,
      hostile,
      look
    }) => /* @__PURE__ */ React.createElement(
      "g",
      {
        className: "actor " + who + " " + cls + (hostile ? " hostile" : "") + (look ? " look-" + look : ""),
        transform: `translate(${spot.x},${spot.y}) scale(${spot.s})`
      },
      /* @__PURE__ */ React.createElement(
        "ellipse",
        {
          className: "sh" + (hostile ? " sh-hostile" : ""),
          cx: "0",
          cy: "12",
          rx: "99",
          ry: "31",
          "data-audit": "SHADOW"
        }
      ),
      hostile && /* @__PURE__ */ React.createElement("ellipse", { className: "underlight", cx: "0", cy: "-30", rx: "70", ry: "60" }),
      /* @__PURE__ */ React.createElement("rect", { className: "furn-2", x: "-41", y: "-106", width: "82", height: "44", rx: "15" }),
      /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-41", y: "-106", width: "82", height: "44", rx: "15", "data-audit": "CHAIR" }),
      /* @__PURE__ */ React.createElement("path", { className: "ln-thin", d: "M-31 -97 H31", opacity: ".45" }),
      /* @__PURE__ */ React.createElement("path", { className: "ln-thin", d: "M-31 -70 V-58 M31 -70 V-58", opacity: ".5" }),
      /* @__PURE__ */ React.createElement("g", { className: "turn" }, /* @__PURE__ */ React.createElement("g", { className: "idle", style: { animationDelay: `${idle}ms` } }, /* @__PURE__ */ React.createElement(
        "image",
        {
          className: hostile ? "fig-hostile" : "",
          href: sprite,
          x: "-44",
          y: "-142",
          width: "88",
          height: "105",
          preserveAspectRatio: "xMidYMax meet",
          "data-audit": "BODY"
        }
      ))),
      /* @__PURE__ */ React.createElement("ellipse", { className: "furn-2", cx: "0", cy: "7", rx: "92", ry: "34" }),
      /* @__PURE__ */ React.createElement("ellipse", { className: "furn", cx: "0", cy: "0", rx: "92", ry: "34" }),
      /* @__PURE__ */ React.createElement(
        "ellipse",
        {
          className: "ln ring" + (hostile ? " ring-hostile" : ""),
          cx: "0",
          cy: "0",
          rx: "92",
          ry: "34",
          "data-audit": "TABLE"
        }
      ),
      /* @__PURE__ */ React.createElement("ellipse", { className: "ln-thin", cx: "0", cy: "0", rx: "83", ry: "29", opacity: ".35" }),
      /* ================================== THE DEVICE ON THE TABLE ==========
         Alice and Bob hold phones; Eve still works a laptop. Everything that
         made the laptop read as a lit screen in this room is kept — the same
         glass fill, the same glare, the same scanline, the same idle jitter on
         the figure behind it — so the swap changes the silhouette and nothing
         else. The screen group still hangs off translate(0,-44), which is
         where every label, wire and payload in the sequence is anchored, so
         no path, timing or crypto step moves. */
      hostile
        ? /* @__PURE__ */ React.createElement(React.Fragment, null,
            /* @__PURE__ */ React.createElement("path", { className: "mac-deck", d: "M-52 -6 L52 -6 L68 11 L-68 11 Z" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-lip", d: "M-68 11 H68 L65 15 H-65 Z" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-hi", d: "M-52 -6 H52" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-well", d: "M-43 -3 L43 -3 L51 5 L-51 5 Z" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-row", d: "M-41 -1 H41 M-44 1.6 H44 M-47 4.2 H47" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-grill", d: "M-50 -3 L-48 -1 M-46 -3 L-44 -1 M50 -3 L48 -1 M46 -3 L44 -1" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-pad", d: "M-18 6 L18 6 L20 9.6 L-20 9.6 Z" }),
            /* @__PURE__ */ React.createElement("rect", { className: "mac-hinge", x: "-15", y: "-7.6", width: "30", height: "2", rx: "1" }),
            /* @__PURE__ */ React.createElement("rect", { className: "mac-lid" + (lit ? " lit-" + lit : ""), x: "-46", y: "-76", width: "92", height: "70", rx: "6" }),
            /* @__PURE__ */ React.createElement("rect", { className: "ln lid" + (lit ? " lit-" + lit : ""), x: "-46", y: "-76", width: "92", height: "70", rx: "6", "data-audit": "LAPTOP" }),
            /* @__PURE__ */ React.createElement("rect", { className: "mac-screen hostile", x: "-42", y: "-72", width: "84", height: "56", rx: "3", "data-audit": "GLASS" }),
            /* @__PURE__ */ React.createElement("rect", { className: "mac-lid", x: "-6", y: "-72.5", width: "12", height: "3.4", rx: "1.7" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-glare", d: "M-38 -20 L-24 -68 L-17 -68 L-31 -20 Z" }),
            /* @__PURE__ */ React.createElement("rect", { className: "scanline", x: "-42", y: "-72", width: "84", height: "3" }))
        : /* @__PURE__ */ React.createElement("g", { className: "hand-g", transform: "translate(0,10)", style: { animationDelay: `${idle}ms` } },
            /* the hands that hold it, read as two shapes either side rather
               than drawn fingers: at this size fingers are noise */
            /* @__PURE__ */ React.createElement("rect", { className: "phone-grip", x: "-38", y: "-36", width: "17", height: "38", rx: "8" }),
            /* @__PURE__ */ React.createElement("rect", { className: "phone-grip", x: "21", y: "-36", width: "17", height: "38", rx: "8" }),
            /* body, screen and island at the locked iPhone proportions:
               52 x 107 is 0.486, against the device's own 71.9/150 */
            /* @__PURE__ */ React.createElement("rect", { className: "phone-body" + (lit ? " lit-" + lit : ""), x: "-26", y: "-97.5", width: "52", height: "107", rx: "9" }),
            /* @__PURE__ */ React.createElement("rect", { className: "ln lid" + (lit ? " lit-" + lit : ""), x: "-26", y: "-97.5", width: "52", height: "107", rx: "9", "data-audit": "PHONE" }),
            /* @__PURE__ */ React.createElement("rect", { className: "mac-screen phone-screen", x: "-22.6", y: "-93.7", width: "45.2", height: "99.4", rx: "6.4", "data-audit": "GLASS" }),
            /* @__PURE__ */ React.createElement("rect", { className: "phone-island", x: "-7.5", y: "-91.2", width: "15", height: "4.4", rx: "2.2" }),
            /* @__PURE__ */ React.createElement("path", { className: "mac-glare", d: "M-19 2 L-8 -90 L-2 -90 L-13 2 Z" }),
            /* the same scanline the hostile screen has: the CRT texture is the
               room's, not one character's */
            /* @__PURE__ */ React.createElement("rect", { className: "scanline", x: "-22.6", y: "-93.7", width: "45.2", height: "3" }), /* the thumbs come over the front edge, which is the difference between a    phone being held and a phone standing on a shelf */ /* @__PURE__ */ React.createElement("rect", { className: "phone-grip thumb", x: "-29", y: "-26", width: "9", height: "20", rx: "4.5" }), /* @__PURE__ */ React.createElement("rect", { className: "phone-grip thumb", x: "20", y: "-26", width: "9", height: "20", rx: "4.5" })),
      /* the anchor does not move; on a phone the card it carries is set
         into the narrower glass, which it overhangs by four units on
         each side — close enough to read as the screen’s content and
         far enough that the text keeps its size */
      /* @__PURE__ */ React.createElement("g", { transform: "translate(0,-44)" }, /* @__PURE__ */ React.createElement("g", { className: (morphing ? "morphing" : "") + (hostile ? "" : " on-phone") }, screen)),
      extra,
      /* @__PURE__ */ React.createElement("g", { transform: "translate(0,72)" }, /* @__PURE__ */ React.createElement("g", { className: "hold", style: { transform: `scale(${inv / spot.s})` } }, /* @__PURE__ */ React.createElement("text", { className: "nameplate", y: "0", "data-audit": "NAME" }, name), /* @__PURE__ */ React.createElement("text", { className: "statelabel" + (hostile ? " danger" : ""), y: "17" }, state)))
    );
    const Router = ({ x, y, live, inv }) => /* @__PURE__ */ React.createElement("g", { className: "router-g", transform: `translate(${x},${y})` }, /* @__PURE__ */ React.createElement("g", { transform: "translate(0,-64)" }, /* @__PURE__ */ React.createElement("g", { className: "hold", style: { transform: `scale(${inv})` } }, /* @__PURE__ */ React.createElement("text", { className: "nameplate", y: "0", "data-audit": "NAME" }, "Public Wi-Fi"), /* @__PURE__ */ React.createElement("text", { className: "statelabel", y: "17" }, "Everyone here is on this network"))), /* @__PURE__ */ React.createElement("ellipse", { className: "sh", cx: "0", cy: "16", rx: "36", ry: "9" }), /* @__PURE__ */ React.createElement("path", { className: "ln-thin", d: "M-8 12 V20 H8 V12", opacity: ".6" }), /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M-16 -8 L-23 -30 M16 -8 L23 -30" }), /* @__PURE__ */ React.createElement("circle", { className: "ink", cx: "-23", cy: "-31", r: "2" }), /* @__PURE__ */ React.createElement("circle", { className: "ink", cx: "23", cy: "-31", r: "2" }), /* @__PURE__ */ React.createElement("rect", { className: "furn-2", x: "-28", y: "-9", width: "56", height: "21", rx: "7" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-28", y: "-9", width: "56", height: "21", rx: "7", "data-audit": "ROUTER" }), /* @__PURE__ */ React.createElement("path", { className: "ln-thin", d: "M-28 5 H28", opacity: ".45" }), /* @__PURE__ */ React.createElement("circle", { className: live ? "f-key glowed" : "f-neutral", cx: "0", cy: "-2", r: "3" }), /* @__PURE__ */ React.createElement("circle", { className: "ln-thin", cx: "0", cy: "-2", r: "3" }), /* @__PURE__ */ React.createElement("circle", { className: "f-neutral", cx: "-11", cy: "-2", r: "2.1" }), /* @__PURE__ */ React.createElement("circle", { className: "ln-thin", cx: "-11", cy: "-2", r: "2.1" }), /* @__PURE__ */ React.createElement("circle", { className: live ? "f-key" : "f-neutral", cx: "11", cy: "-2", r: "2.1", opacity: live ? 0.7 : 1 }), /* @__PURE__ */ React.createElement("circle", { className: "ln-thin", cx: "11", cy: "-2", r: "2.1" }), /* @__PURE__ */ React.createElement("g", { opacity: live ? 1 : 0.4, className: live ? "glowed" : "" }, /* @__PURE__ */ React.createElement("path", { className: "bg-ln", d: "M-36 -12 a22 22 0 0 1 0 -24" }), /* @__PURE__ */ React.createElement("path", { className: "bg-ln", d: "M-46 -8 a32 32 0 0 1 0 -32" }), /* @__PURE__ */ React.createElement("path", { className: "bg-ln", d: "M36 -12 a22 22 0 0 0 0 -24" }), /* @__PURE__ */ React.createElement("path", { className: "bg-ln", d: "M46 -8 a32 32 0 0 0 0 -32" })));
    const Room = ({ L }) => {
      const t = L.tall;
      const W = L.w, H = L.h;
      const horizon = t ? 200 : 210;
      const vpx = W / 2, vpy = horizon - 54;
      const rays = [];
      for (let i = -5; i <= 5; i++)
        rays.push(`M${vpx} ${vpy} L${vpx + i * (t ? 170 : 240)} ${H + 300}`);
      const courses = [];
      for (let i = 1; i <= 6; i++) {
        const y = horizon + Math.pow(i, 2) * (t ? 11 : 9);
        if (y < H + 60) courses.push(`M${-300} ${y} H${W + 300}`);
      }
      const bandY = horizon - 150, bandH = 112;
      const panes = t ? [[24, 200], [268, 250]] : [[120, 300], [560, 300]];
      return /* @__PURE__ */ React.createElement("g", { className: "room" }, /* @__PURE__ */ React.createElement("defs", null, panes.map(([x, w], i) => /* @__PURE__ */ React.createElement("clipPath", { key: i, id: `pane${i}` }, /* @__PURE__ */ React.createElement("rect", { x, y: bandY, width: w, height: bandH })))), /* @__PURE__ */ React.createElement("rect", { className: "wall", x: "-400", y: "-400", width: W + 800, height: horizon + 400 }), /* @__PURE__ */ React.createElement("rect", { className: "floor", x: "-400", y: horizon, width: W + 800, height: H + 700 }), /* @__PURE__ */ React.createElement("g", { className: "grid" }, rays.map((d, i) => /* @__PURE__ */ React.createElement("path", { key: "r" + i, d })), courses.map((d, i) => /* @__PURE__ */ React.createElement("path", { key: "c" + i, d }))), panes.map(([x, w], i) => {
        const bars = Math.round(w / 100);
        const sky = [];
        for (let k = 0; k < Math.round(w / 34); k++) {
          const bw = 16 + k * 29 % 16;
          const bh = 26 + k * 47 % 52;
          sky.push(/* @__PURE__ */ React.createElement(
            "rect",
            {
              key: k,
              className: k % 3 ? "city" : "city city-2",
              x: x + 4 + k * 34,
              y: bandY + bandH - bh - 18,
              width: bw,
              height: bh
            }
          ));
        }
        return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("rect", { className: "glassplane", x, y: bandY, width: w, height: bandH }), /* @__PURE__ */ React.createElement("g", { clipPath: `url(#pane${i})` }, sky), /* @__PURE__ */ React.createElement("g", { className: "paneline" }, /* @__PURE__ */ React.createElement("rect", { x, y: bandY, width: w, height: bandH }), [...Array(bars - 1)].map((_, k) => /* @__PURE__ */ React.createElement("path", { key: k, d: `M${x + (k + 1) * w / bars} ${bandY} v${bandH}` }))));
      }), /* @__PURE__ */ React.createElement("rect", { className: "sill", x: "-400", y: horizon - 38, width: W + 800, height: "9" }), /* @__PURE__ */ React.createElement("rect", { className: "walldark", x: "-400", y: horizon - 29, width: W + 800, height: "29" }), /* @__PURE__ */ React.createElement("path", { className: "pool", d: `M${vpx - 250} ${horizon + 44} h96 l58 ${H - horizon}
                                 h-210 Z` }), /* @__PURE__ */ React.createElement("path", { className: "pool", d: `M${vpx + 154} ${horizon + 44} h96 l56 ${H - horizon}
                                 h-208 Z` }), /* @__PURE__ */ React.createElement("g", { transform: t ? `translate(${W - 90},${horizon + 300})` : `translate(66,${horizon + 120})` }, /* @__PURE__ */ React.createElement("ellipse", { className: "contact", cx: "0", cy: "104", rx: "118", ry: "14" }), /* @__PURE__ */ React.createElement("path", { className: "prop-top", d: "M-116 -30 H116 L92 -14 H-92 Z" }), /* @__PURE__ */ React.createElement("path", { className: "prop-face", d: "M-92 -14 H92 V104 H-92 Z" }), /* @__PURE__ */ React.createElement("g", { className: "prop-edge" }, /* @__PURE__ */ React.createElement("path", { d: "M-92 -14 H92" }), /* @__PURE__ */ React.createElement("path", { d: "M-92 26 H92", opacity: ".45" }))), (t ? [[96, 0], [188, 1]] : [[320, 0], [706, 1]]).map(([x, k]) => /* @__PURE__ */ React.createElement("g", { key: k, transform: `translate(${x},${horizon + 20})` }, /* @__PURE__ */ React.createElement("ellipse", { className: "contact", cx: "0", cy: "52", rx: "26", ry: "7" }), /* @__PURE__ */ React.createElement("g", { className: "prop-edge" }, /* @__PURE__ */ React.createElement("path", { d: "M-9 2 -14 50 M9 2 14 50 M0 4 V50" })), /* @__PURE__ */ React.createElement("ellipse", { className: "prop-top", cx: "0", cy: "0", rx: "25", ry: "8" }), /* @__PURE__ */ React.createElement("ellipse", { className: "prop-edge-e", cx: "0", cy: "0", rx: "25", ry: "8" }))), /* @__PURE__ */ React.createElement("g", { transform: t ? `translate(58,${horizon + 150})` : `translate(${W - 84},${horizon + 92})` }, /* @__PURE__ */ React.createElement("ellipse", { className: "contact", cx: "0", cy: "46", rx: "26", ry: "7" }), /* @__PURE__ */ React.createElement("path", { className: "leaf", d: "M0 2 C-24 -12, -28 -44, -7 -54 M0 2 C22 -14, 26 -42, 6 -50 M0 2 V-32" }), /* @__PURE__ */ React.createElement("path", { className: "prop-face", d: "M-19 0 H19 L15 44 H-15 Z" }), /* @__PURE__ */ React.createElement("path", { className: "prop-top", d: "M-19 0 H19 L16 8 H-16 Z" })), /* @__PURE__ */ React.createElement("g", { className: "mark", transform: `translate(${t ? 60 : W - 62},${bandY + 42})` }, /* @__PURE__ */ React.createElement("path", { d: "M-15 -9 H11 V6 a8 8 0 0 1 -8 8 H-7 a8 8 0 0 1 -8 -8 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M11 -3 h6 a6 6 0 0 1 0 12 h-6" }), /* @__PURE__ */ React.createElement("path", { d: "M-7 -18 v-7 M1 -18 v-10 M9 -18 v-7" })));
    };
    const Dressing = ({ L }) => /* @__PURE__ */ React.createElement(Room, { L });
    const TONE_FILL = {
      you: "f-you-s",
      fr: "f-fr-s",
      key: "f-key-s",
      priv: "f-priv-s",
      danger: "f-danger",
      neutral: "f-neutral"
    };
    const TONE_SOLID = {
      you: "f-you",
      fr: "f-fr",
      key: "f-key",
      priv: "f-priv",
      danger: "f-danger",
      neutral: "f-neutral"
    };
    const Chars = ({ line, y, cls, hot, from }) => {
      const adv = 4.5;
      const x0 = 4 - (line.length - 1) * adv / 2;
      return /* @__PURE__ */ React.createElement(React.Fragment, null, line.split("").map((c, i) => /* @__PURE__ */ React.createElement(
        "text",
        {
          key: i,
          className: cls + " ch" + (from + i === hot ? " hot" : ""),
          x: x0 + i * adv,
          y
        },
        c
      )));
    };
    const Glyph = ({ kind, tone, wire, hot, token }) => {
      const soft = TONE_FILL[tone], solid = TONE_SOLID[tone];
      switch (kind) {
        case "setup":
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("rect", { className: "f-neutral", x: "-12", y: "-9", width: "24", height: "18", rx: "4" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-12", y: "-9", width: "24", height: "18", rx: "4" }), token ? /* @__PURE__ */ React.createElement("text", { className: "tok", y: "3" }, token) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("circle", { className: "ink", cx: "-5", cy: "0", r: "1.7" }), /* @__PURE__ */ React.createElement("circle", { className: "ink", cx: "0", cy: "0", r: "1.7" }), /* @__PURE__ */ React.createElement("circle", { className: "ink", cx: "5", cy: "0", r: "1.7" })));
        case "lock":
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" }), /* @__PURE__ */ React.createElement("rect", { className: soft, x: "-9.5", y: "-7", width: "19", height: "14.5", rx: "3.5" }), /* @__PURE__ */ React.createElement(
            "rect",
            {
              className: tone === "priv" ? "ln priv-ln" : "ln",
              x: "-9.5",
              y: "-7",
              width: "19",
              height: "14.5",
              rx: "3.5"
            }
          ), token ? /* @__PURE__ */ React.createElement("text", { className: "tok tok-priv", y: "2.6" }, token) : /* @__PURE__ */ React.createElement("circle", { className: tone === "priv" ? "f-priv" : "ink", cx: "0", cy: "0", r: "1.9" }));
        case "packet":
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("rect", { className: soft, x: "-15", y: "-9.5", width: "30", height: "19", rx: "3.5" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-15", y: "-9.5", width: "30", height: "19", rx: "3.5" }), token ? /* @__PURE__ */ React.createElement("text", { className: "tok", y: "3.2" }, token) : /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M-13 -6 L0 3 L13 -6" }));
        case "key":
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("circle", { className: "f-key", cx: "-6", cy: "0", r: "7" }), /* @__PURE__ */ React.createElement("circle", { className: "ln", cx: "-6", cy: "0", r: "7" }), token ? /* @__PURE__ */ React.createElement("text", { className: "tok tok-key", x: "-6", y: "2.8" }, token) : /* @__PURE__ */ React.createElement("circle", { className: "glass", cx: "-6", cy: "0", r: "2.4" }), /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M1 0 H14 M11 0 V4.5 M7.5 0 V3.5" }));
        case "msg": {
          const w = wire || WIRE.plain;
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("rect", { className: "f-neutral", x: "-34", y: "-14", width: "68", height: "28", rx: "7" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-34", y: "-14", width: "68", height: "28", rx: "7" }), /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M-20 14 L-16 17 L-12 14" }), /* @__PURE__ */ React.createElement("rect", { className: solid, x: "-30", y: "-10", width: "3", height: "20", rx: "1.5" }), /* @__PURE__ */ React.createElement(Chars, { line: w[0], y: -3, cls: "wire", hot: hot != null ? hot : -1, from: 0 }), /* @__PURE__ */ React.createElement(Chars, { line: w[1], y: 8, cls: "wire", hot: hot != null ? hot : -1, from: w[0].length }));
        }
        case "cipher": {
          const w = wire || WIRE.enc;
          return /* @__PURE__ */ React.createElement("g", { "data-audit": "GLYPH" }, /* @__PURE__ */ React.createElement("rect", { className: "f-key-s", x: "-34", y: "-14", width: "68", height: "28", rx: "7" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-34", y: "-14", width: "68", height: "28", rx: "7" }), /* @__PURE__ */ React.createElement("g", { transform: "translate(-28,-7) scale(.4)" }, /* @__PURE__ */ React.createElement("path", { className: "ln", d: "M-5.5 -7 V-11 a5.5 5.5 0 0 1 11 0 V-7" }), /* @__PURE__ */ React.createElement("rect", { className: "f-key", x: "-9.5", y: "-7", width: "19", height: "14.5", rx: "3.5" }), /* @__PURE__ */ React.createElement("rect", { className: "ln", x: "-9.5", y: "-7", width: "19", height: "14.5", rx: "3.5" })), /* @__PURE__ */ React.createElement(Chars, { line: w[0], y: -3, cls: "cipher", hot: hot != null ? hot : -1, from: 0 }), /* @__PURE__ */ React.createElement(Chars, { line: w[1], y: 8, cls: "cipher", hot: hot != null ? hot : -1, from: w[0].length }));
        }
      }
    };
    const ICO = {
      /* public: something leaving, on purpose */
      packet: '<path d="M3.5 9.5v4.2a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V9.5"/><path d="M8 2.2v8.4"/><path d="M5.2 5 8 2.2 10.8 5"/>',
      /* private-derived, locked */
      cipher: '<rect x="3.6" y="7.4" width="8.8" height="6.6" rx="1.6"/><path d="M5.6 7.4V5.6a2.4 2.4 0 0 1 4.8 0v1.8"/>',
      /* readable content */
      msg: '<rect x="2.4" y="3.4" width="11.2" height="8" rx="2"/><path d="M5.6 11.4 5 14l3-2.6"/>',
      /* belongs to nobody */
      setup: '<rect x="2.6" y="4.6" width="10.8" height="7.2" rx="1.8"/><circle cx="6" cy="8.2" r=".9"/><circle cx="8" cy="8.2" r=".9"/><circle cx="10" cy="8.2" r=".9"/>'
    };
    function cardMarkup(c) {
      const ico = ICO[c.kind] || ICO.packet;
      const wLabel = c.label.length * 7;
      const wSub = c.sub ? c.sub.length * (c.big ? 9.4 : c.mono ? 6.4 : 5.9) : 0;
      const w = Math.round(Math.max(146, Math.max(wLabel, wSub) + 66));
      const h = c.sub ? c.big ? 58 : 48 : 36;
      const x = -w / 2, y = -h / 2;
      return `
    <rect class="fly-shade" x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="11"/>
    <rect class="fly-panel t-${c.tone}" x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/>
    <g class="fly-ico t-${c.tone}" transform="translate(${x + 14},${y + h / 2 - 8})">${ico}</g>
    <text class="fly-label" x="${x + 38}" y="${c.sub ? y + 20 : y + h / 2 + 4.5}">${c.label}</text>
    ${c.sub ? `<text class="fly-sub${c.mono ? " mono" : ""}${c.big ? " big" : ""}" x="${x + 38}" y="${y + (c.big ? 42 : 35)}">${c.sub}</text>` : ""}`;
    }
    const G = 5;
    const P = 23;
    const powmod = (b, e) => {
      let r = 1;
      for (let i = 0; i < e; i++) r = r * b % P;
      return r;
    };
    const PICKS = { you: [3, 7, 10], fr: [8, 13, 14] };
    const CANDS = [2, 4, 6, 9, 11];
    const TRIES = (a) => CANDS.filter((c) => c !== a).slice(0, 3).map((c) => [c, powmod(G, c)]);
    const tokens = (v) => {
      const A = powmod(G, v.a), B = powmod(G, v.b);
      const S = powmod(G, v.a * v.b);
      return {
        "you.setup": String(G),
        "fr.setup": String(G),
        "atk.setup": String(G),
        "you.lock": String(v.a),
        "fr.lock": String(v.b),
        "you.pubYou": String(A),
        "fr.pubFr": String(B),
        "fr.pubYou": String(A),
        "you.pubFr": String(B),
        "atk.pubYou": String(A),
        "atk.pubFr": String(B),
        "you.key": String(S),
        "fr.key": String(S)
      };
    };
    const ITEM = {
      "you.setup": ["setup", "neutral"],
      "fr.setup": ["setup", "neutral"],
      /* One idea, one colour: the private key is yellow on both machines. */
      "you.lock": ["lock", "priv"],
      "fr.lock": ["lock", "priv"],
      "you.pubYou": ["packet", "you"],
      "fr.pubFr": ["packet", "fr"],
      "you.pubFr": ["packet", "fr"],
      "fr.pubYou": ["packet", "you"],
      "you.key": ["key", "key"],
      "fr.key": ["key", "key"],
      "you.msg": ["msg", "you"],
      "fr.msg": ["msg", "you"],
      "you.cipher": ["cipher", "key"],
      "fr.cipher": ["cipher", "key"],
      "atk.setup": ["setup", "neutral"],
      "atk.pubYou": ["packet", "you"],
      "atk.pubFr": ["packet", "fr"],
      "atk.cipher": ["cipher", "key"]
    };
    const ORDER = {
      you: ["you.setup", "you.lock", "you.pubYou", "you.pubFr", "you.key", "you.msg", "you.cipher"],
      fr: ["fr.setup", "fr.lock", "fr.pubFr", "fr.pubYou", "fr.key", "fr.cipher", "fr.msg"],
      atk: ["atk.setup", "atk.pubYou", "atk.pubFr", "atk.cipher"]
    };
    const KeyBadge = ({ n }) => /* @__PURE__ */ React.createElement("g", { className: "kb", transform: "translate(-26,-20)" }, /* @__PURE__ */ React.createElement("circle", { className: "f-key", cx: "-5", cy: "0", r: "4.2" }), /* @__PURE__ */ React.createElement("circle", { className: "ln-thin", cx: "-5", cy: "0", r: "4.2" }), /* @__PURE__ */ React.createElement("path", { className: "ln-thin", d: "M-0.8 0 H5 M3 0 V2.6" }), /* @__PURE__ */ React.createElement("text", { className: "kb-n", x: "11", y: "2.6" }, n));
    const Screen = ({ who, vis, wire, focus, hot, mix, tok, fn, fnp, reveal }) => {
      if (fn) return /* @__PURE__ */ React.createElement(
        Fn,
        {
          inA: fn.a,
          inB: fn.b,
          out: fn.out,
          phase: fnp || 1,
          capA: fn.capA,
          capB: fn.capB
        }
      );
      if (reveal) {
        if (who === "atk") return /* @__PURE__ */ React.createElement(KeyBig, null);
        if (vis.has(who + ".key")) return /* @__PURE__ */ React.createElement(KeyBig, { n: tok[who + ".key"] });
      }
      let on = ORDER[who].filter((id) => vis.has(id));
      const keyId = who + ".key";
      const bigOn = on.some((id) => ITEM[id][0] === "msg" || ITEM[id][0] === "cipher");
      const badge = bigOn && on.includes(keyId) ? tok[keyId] : null;
      if (badge) on = on.filter((id) => id !== keyId);
      const wide = on.some((id) => ITEM[id][0] === "msg" || ITEM[id][0] === "cipher");
      const k = wide ? 1 : on.length > 1 ? 1.12 : 1.3;
      const gap = on.length > 1 ? 32 : 0;
      return /* @__PURE__ */ React.createElement("g", { transform: `scale(${k})` }, badge && /* @__PURE__ */ React.createElement(KeyBadge, { n: badge }), on.map((id, i) => {
        const [kind, tone] = ITEM[id];
        const x = (i - (on.length - 1) / 2) * gap;
        const back = !!focus && focus !== id;
        return /* @__PURE__ */ React.createElement(
          "g",
          {
            key: id,
            "data-id": id,
            className: "item" + (back ? " back" : focus === id ? " fore" : "") + (mix ? " mixing" : ""),
            style: { transform: `translate(${mix ? 0 : x}px,0)` }
          },
          /* @__PURE__ */ React.createElement(Glyph, { kind, tone, wire, hot, token: tok[id] })
        );
      }));
    };
    function wrapText(text, max) {
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const w of words) {
        const next = line ? line + " " + w : w;
        if (next.length > max && line) {
          lines.push(line);
          line = w;
        } else line = next;
      }
      if (line) lines.push(line);
      return lines;
    }
    const TAG_FILL = {
      you: "var(--alice)",
      fr: "var(--bob)",
      key: "var(--key)",
      priv: "var(--priv)",
      danger: "var(--eve)",
      neutral: "var(--ink-2)"
    };
    const Callout = ({ def, at, inv, narrow }) => {
      const [ax, ay] = at;
      const chip = def.kind === "chip";
      const wire = def.kind === "wire";
      const fs = chip ? 14 : 15.5;
      const padX = chip ? 16 : 22;
      const padY = chip ? 12 : 18;
      const lines = wire ? [] : wrapText(def.text, narrow ? 22 : 26);
      const longest = lines.reduce((a, b) => a.length > b.length ? a : b, "");
      const w = wire ? 230 : Math.max(96, Math.round(longest.length * fs * 0.53 + padX * 2));
      const lh = fs * 1.55;
      const tagH = def.tag ? 20 : 0;
      const h = wire ? 122 : Math.round(lines.length * lh + padY * 2 + tagH);
      return /* @__PURE__ */ React.createElement("g", { transform: `translate(${ax},${ay})` }, /* @__PURE__ */ React.createElement("g", { className: "hold", style: { transform: `scale(${inv})` } }, wire ? (
        /* What Eve actually pulled off the wire. Same chrome as every other
           card, so it reads as part of the narration rather than an effect;
           the content is the point. */
        /* @__PURE__ */ React.createElement("g", { "data-audit": "DIALOG", className: "tapcard" }, /* @__PURE__ */ React.createElement("rect", { className: "paper", x: -w / 2, y: -h / 2, width: w, height: h, rx: "10" }), /* @__PURE__ */ React.createElement(
          "rect",
          {
            fill: "none",
            stroke: "var(--danger)",
            strokeWidth: "1.2",
            x: -w / 2,
            y: -h / 2,
            width: w,
            height: h,
            rx: "10"
          }
        ), /* @__PURE__ */ React.createElement(
          "text",
          {
            className: "dlg-tag",
            "data-audit": "TAG",
            x: -w / 2 + 18,
            y: -h / 2 + 22,
            fill: "var(--danger)"
          },
          "Intercepted on the network"
        ), (def.lines || []).map((ln, i) => /* @__PURE__ */ React.createElement("text", { key: i, className: "tapline", x: 0, y: -h / 2 + 56 + i * 20 }, ln)), /* @__PURE__ */ React.createElement("text", { className: "tapfoot", x: 0, y: h / 2 - 16 }, def.foot))
      ) : chip ? /* @__PURE__ */ React.createElement("g", { "data-audit": "CHIP" }, /* @__PURE__ */ React.createElement("text", { className: "chip-halo", textAnchor: "middle", y: 5 }, def.text), /* @__PURE__ */ React.createElement("text", { className: "chip-text", textAnchor: "middle", y: 5 }, def.text)) : /* @__PURE__ */ React.createElement("g", { "data-audit": "DIALOG" }, /* @__PURE__ */ React.createElement("rect", { className: "paper", x: -w / 2, y: -h / 2, width: w, height: h, rx: "10" }), /* @__PURE__ */ React.createElement(
        "rect",
        {
          fill: "none",
          stroke: "var(--edge)",
          strokeWidth: "1",
          x: -w / 2,
          y: -h / 2,
          width: w,
          height: h,
          rx: "10"
        }
      ), /* @__PURE__ */ React.createElement(
        "rect",
        {
          fill: TAG_FILL[def.tone || "neutral"],
          opacity: ".9",
          x: -w / 2,
          y: -h / 2 + 8,
          width: "3",
          height: h - 16,
          rx: "1.5"
        }
      ), def.tag && /* @__PURE__ */ React.createElement(
        "text",
        {
          className: "dlg-tag",
          "data-audit": "TAG",
          x: -w / 2 + padX,
          y: -h / 2 + 21,
          fill: TAG_FILL[def.tone || "neutral"]
        },
        def.tag
      ), lines.map((ln, i) => /* @__PURE__ */ React.createElement(
        "text",
        {
          key: i,
          className: "dlg-text",
          xmlSpace: "preserve",
          x: -w / 2 + padX,
          y: -h / 2 + padY + tagH + lh * (i + 0.75)
        },
        i < lines.length - 1 ? ln + " " : ln
      )))));
    };
    const Lid = ({ x, children, lit }) => /* @__PURE__ */ React.createElement("g", { transform: `translate(${x},0)` }, /* @__PURE__ */ React.createElement("path", { className: "kf-ln", d: "M-50 26 L50 26 L64 42 L-64 42 Z" }), /* @__PURE__ */ React.createElement("rect", { className: "kf-ln" + (lit ? " lit" : ""), x: "-46", y: "-34", width: "92", height: "60", rx: "7" }), /* @__PURE__ */ React.createElement("rect", { className: "kf-glass", x: "-41", y: "-29", width: "82", height: "50", rx: "4" }), /* @__PURE__ */ React.createElement("g", { transform: "translate(0,-4)" }, children));
    const ART = {
      /* contained and calm: two machines, two locks, nothing between them */
      private: /* @__PURE__ */ React.createElement("svg", { viewBox: "-190 -60 380 120", className: "kf-art" }, /* @__PURE__ */ React.createElement(Lid, { x: -96 }, /* @__PURE__ */ React.createElement(Glyph, { kind: "lock", tone: "you" })), /* @__PURE__ */ React.createElement(Lid, { x: 96 }, /* @__PURE__ */ React.createElement(Glyph, { kind: "lock", tone: "fr" })), /* @__PURE__ */ React.createElement("path", { className: "kf-void", d: "M-24 4 H24" })),
      /* exposed but controlled: one named card, on the route, going somewhere */
      publicOnly: /* @__PURE__ */ React.createElement("svg", { viewBox: "-190 -62 380 124", className: "kf-art" }, /* @__PURE__ */ React.createElement("path", { className: "kf-route", d: "M-150 34 C -90 -14, 90 -14, 150 34" }), /* @__PURE__ */ React.createElement("g", { transform: "translate(-150,34)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "lock", tone: "you" })), /* @__PURE__ */ React.createElement("g", { transform: "translate(0,-22)" }, /* @__PURE__ */ React.createElement("rect", { className: "kf-card t-you", x: "-84", y: "-19", width: "168", height: "38", rx: "9" }), /* @__PURE__ */ React.createElement(
        "g",
        {
          className: "kf-ico t-you",
          transform: "translate(-70,-8)",
          dangerouslySetInnerHTML: { __html: ICO.packet }
        }
      ), /* @__PURE__ */ React.createElement("text", { className: "kf-card-t", x: "-46", y: "5" }, "Alice’s public")), /* @__PURE__ */ React.createElement("path", { className: "kf-arrow", d: "M96 -4 h34 m0 0 -7 -6 m7 6 -7 6" })),
      /* the mixing, twice, in parallel */
      combine: /* @__PURE__ */ React.createElement("svg", { viewBox: "-190 -60 380 120", className: "kf-art" }, /* @__PURE__ */ React.createElement(Lid, { x: -96 }, /* @__PURE__ */ React.createElement("g", { transform: "translate(-19,0) scale(.9)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "lock", tone: "you" })), /* @__PURE__ */ React.createElement("text", { className: "kf-plus", x: "0", y: "5" }, "\u0192"), /* @__PURE__ */ React.createElement("g", { transform: "translate(21,0) scale(.72)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "packet", tone: "fr" }))), /* @__PURE__ */ React.createElement(Lid, { x: 96 }, /* @__PURE__ */ React.createElement("g", { transform: "translate(-19,0) scale(.9)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "lock", tone: "fr" })), /* @__PURE__ */ React.createElement("text", { className: "kf-plus", x: "0", y: "5" }, "\u0192"), /* @__PURE__ */ React.createElement("g", { transform: "translate(21,0) scale(.72)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "packet", tone: "you" })))),
      /* resolution: the same object, twice, glowing */
      sameKey: /* @__PURE__ */ React.createElement("svg", { viewBox: "-190 -60 380 120", className: "kf-art" }, /* @__PURE__ */ React.createElement(Lid, { x: -96, lit: true }, /* @__PURE__ */ React.createElement("g", { className: "kf-glow", transform: "scale(1.5)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "key", tone: "key" }))), /* @__PURE__ */ React.createElement(Lid, { x: 96, lit: true }, /* @__PURE__ */ React.createElement("g", { className: "kf-glow", transform: "scale(1.5)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "key", tone: "key" }))), /* @__PURE__ */ React.createElement("path", { className: "kf-tie", d: "M-24 4 H24" })),
      /* protection: one object, two states, the arrow between them */
      protected: /* @__PURE__ */ React.createElement("svg", { viewBox: "-190 -52 380 104", className: "kf-art" }, /* @__PURE__ */ React.createElement("g", { transform: "translate(-104,0) scale(1.5)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "msg", tone: "you" })), /* @__PURE__ */ React.createElement("path", { className: "kf-arrow", d: "M-16 0 h32 m0 0 -7 -6 m7 6 -7 6" }), /* @__PURE__ */ React.createElement("g", { className: "kf-glow", transform: "translate(104,0) scale(1.5)" }, /* @__PURE__ */ React.createElement(Glyph, { kind: "cipher", tone: "key" })))
    };
    const FRAMES = {
      nowUse: { text: "Now they can use it.", ms: 1900, soft: true },
      /* The opening title card. Unlike the others it carries no foreground art —
         the room is the imagery, so the blur stays light enough to still read
         three people, three laptops and the router behind the sentence. */
      opening: {
        text: "Three people on one caf\xE9 Wi-Fi. Two of them want to share a secret.",
        ms: 2100,
        soft: true
      },
      tapWire: {
        text: "Eve can tap the wire \u2014 but he only gets encrypted text.",
        ms: 1700,
        on: "atk"
      },
      neverSent: {
        text: "They arrived at the same secret. Neither one ever sent it.",
        ms: 2100,
        on: "pair"
      },
      named: { text: "This is Diffie\u2013Hellman key exchange.", ms: 1800, soft: true },
      ending: {
        text: "Same network. Same traffic. Different knowledge.",
        ms: 2400,
        soft: true
      },
      private: { art: "private", text: "The private values never leave.", ms: 1600, on: "pair" },
      publicOnly: { art: "publicOnly", text: "Only the public values travel.", ms: 1600, on: "net" },
      combine: { art: "combine", text: "Each side combines its own private value with the other\u2019s public value.", ms: 1800, on: "pair" },
      sameKey: { art: "sameKey", text: "Both devices create the same shared secret.", ms: 1700, on: "pair" },
      protected: { art: "protected", text: "The same secret protects the message before it crosses.", ms: 1700, on: "you" }
    };
    const KeyFrame = ({ f, on }) => {
      const capt = !!(f && f.on);
      return /* @__PURE__ */ React.createElement("div", { className: "kf" + (on ? " on" : "") + (f && f.soft ? " soft" : "") + (capt ? " kf-capt" : ""), "aria-hidden": !on }, f && /* @__PURE__ */ React.createElement(React.Fragment, null, f.art && !capt && /* @__PURE__ */ React.createElement("div", { className: "kf-img" }, ART[f.art]), /* @__PURE__ */ React.createElement("p", { className: "kf-line" + (f.art && !capt ? "" : " lead") }, f.text)));
    };
    const Caption = ({ line, zone, swap }) => /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "nc nc-" + (zone || "center") + (swap ? " swap" : ""),
        "data-audit": "NOTE",
        "aria-live": "polite"
      },
      line.t && /* @__PURE__ */ React.createElement("span", { className: "nc-term" }, line.t),
      /* @__PURE__ */ React.createElement("p", null, line.s)
    );
    const NoteBox = ({ line, tag, tone, pos, swap }) => /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "nb nb-" + pos + (swap ? " swap" : ""),
        "data-audit": pos === "dock" ? "DOCK" : "NOTE",
        "aria-live": "polite"
      },
      tag && /* @__PURE__ */ React.createElement("span", { className: "nb-tag", style: { color: TAG_FILL[tone || "neutral"] } }, tag),
      line.t && !tag && /* @__PURE__ */ React.createElement("span", { className: "nb-term" }, line.t),
      /* @__PURE__ */ React.createElement("p", null, line.s)
    );
    const Gate = ({ ask, pos, onPick }) => /* @__PURE__ */ React.createElement("div", { className: "gate gate-" + pos, "data-audit": "GATE" }, /* @__PURE__ */ React.createElement("span", { className: "gate-lbl" }, ask.label), /* @__PURE__ */ React.createElement("div", { className: "gate-row" }, ask.opts.map((o) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: String(o.v),
        className: "gate-btn" + (ask.kind === "act" ? " act" : ""),
        onClick: () => onPick(o.v)
      },
      o.t
    ))));
    const Ledger = ({ rows, line }) => (
      /* A summary owns the frame, so it brings its own ground rather than sitting
         on top of the cast — and it carries its own sentence, so there is never a
         second box competing with it. */
      /* @__PURE__ */ React.createElement("div", { className: "ledger-wrap", "data-audit": "LEDGER" }, /* @__PURE__ */ React.createElement("div", { className: "ledger" }, rows.map(([who, what, tone]) => /* @__PURE__ */ React.createElement("div", { key: who, className: "ledger-row" }, /* @__PURE__ */ React.createElement("span", { className: "ledger-who", style: { color: tone } }, who), /* @__PURE__ */ React.createElement("span", { className: "ledger-what" }, what))), line && /* @__PURE__ */ React.createElement("p", { className: "ledger-line" }, line.s)))
    );
    const Scrub = ({ pos, dur, marks, playing, onSeek, onScrub, onToggle, labels }) => {
      const track = useRef(null);
      const from = (e) => {
        const r = track.current.getBoundingClientRect();
        return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur;
      };
      const grab = (e) => {
        var _a, _b;
        try {
          (_b = (_a = e.target).setPointerCapture) == null ? void 0 : _b.call(_a, e.pointerId);
        } catch {
        }
        onScrub(true);
        onSeek(from(e));
      };
      const move = (e) => {
        if (e.buttons) onSeek(from(e));
      };
      const drop = () => onScrub(false);
      const pct = dur ? pos / dur * 100 : 0;
      return /* @__PURE__ */ React.createElement("div", { className: "scrub" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "scrub-play",
          onClick: onToggle,
          "aria-label": playing ? "Pause" : "Play"
        },
        playing ? /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 12 12", width: "12", height: "12" }, /* @__PURE__ */ React.createElement("rect", { x: "1.5", y: "1", width: "3", height: "10", rx: "1" }), /* @__PURE__ */ React.createElement("rect", { x: "7.5", y: "1", width: "3", height: "10", rx: "1" })) : /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 12 12", width: "12", height: "12" }, /* @__PURE__ */ React.createElement("path", { d: "M2.5 1 L11 6 L2.5 11 Z" }))
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "scrub-track",
          ref: track,
          onPointerDown: grab,
          onPointerMove: move,
          onPointerUp: drop,
          onPointerCancel: drop,
          role: "slider",
          tabIndex: 0,
          "aria-label": "Timeline",
          "aria-valuemin": 0,
          "aria-valuemax": Math.round(dur),
          "aria-valuenow": Math.round(pos),
          onKeyDown: (e) => {
            if (e.key === "ArrowRight") onSeek(pos + 1e3);
            if (e.key === "ArrowLeft") onSeek(pos - 1e3);
          }
        },
        /* @__PURE__ */ React.createElement("div", { className: "scrub-rail" }),
        /* @__PURE__ */ React.createElement("div", { className: "scrub-fill", style: { width: pct + "%" } }),
        marks.map((m, i) => /* @__PURE__ */ React.createElement(
          "span",
          {
            key: i,
            className: "scrub-mark",
            style: { left: m / dur * 100 + "%" },
            title: labels[i + 1]
          }
        )),
        /* @__PURE__ */ React.createElement("span", { className: "scrub-head", style: { left: pct + "%" } })
      ));
    };
    const Controls = ({ act, playing, waiting, go, replay }) => {
      const last = act === ACTS.length;
      return /* @__PURE__ */ React.createElement("div", { className: "nav" }, /* @__PURE__ */ React.createElement("div", { className: "nav-in" }, /* @__PURE__ */ React.createElement("button", { className: "btn ghost", onClick: replay }, "Replay chapter"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "btn primary" + (playing ? " waiting" : ""),
          onClick: () => go(last ? 1 : act + 1),
          "aria-live": "polite"
        },
        waiting ? "Your turn" : playing ? "Playing\u2026" : last ? "Watch again" : "Continue",
        !playing && !waiting && /* @__PURE__ */ React.createElement("span", { className: "ct" }, act, "/", ACTS.length)
      )));
    };
    const BASE = {
      step: 1,
      shot: "wide",
      vis: [],
      calls: {},
      flows: [],
      seen: false,
      lit: {},
      focus: null,
      hot: -1,
      mix: null,
      tap: false,
      /* who the observer is turned toward, and whether his sightlines are up */
      look: null,
      watch: false,
      spot: null,
      guess: 0,
      morphing: false,
      fn: null,
      fnp: 1,
      reveal: false,
      ledger: false,
      frame: null,
      frameOn: false,
      wire: { you: WIRE.plain, fr: WIRE.plain, atk: WIRE.enc },
      note: NOTE.wifi,
      /* Where the narration should sit for this beat. The caption follows the
         camera rather than living in one corner, so the viewer never has to
         choose between watching the picture and reading the line. */
      nz: "center",
      noteSwap: false
    };
    const SYNC = { then: (r) => r() };
    function resolve(tape, t) {
      const s = {
        ...BASE,
        vis: [],
        calls: {},
        flows: [],
        lit: {},
        wire: { ...BASE.wire }
      };
      if (!tape) return s;
      for (const k of tape.kfs) {
        if (k.at > t) break;
        k.go(s);
      }
      return s;
    }
    function cursorAt(tape, t) {
      if (!tape) return 0;
      let n = 0;
      for (const k of tape.kfs) {
        if (k.at > t) break;
        n++;
      }
      return n;
    }
    const RANK = ["setup", "lock", "packet", "key", "msg", "cipher"];
    const STATE_LABEL = {
      setup: "Starting value",
      lock: "Private value",
      packet: "Public value",
      key: "Shared secret",
      msg: "Readable message",
      cipher: "Encrypted message"
    };
    function stateOf(who, vis) {
      if (who === "atk") return "Watching the network";
      const held = ORDER[who].filter((id) => vis.has(id)).map((id) => ITEM[id][0]);
      if (!held.length) return "Nothing yet";
      const best = held.reduce((a, b) => RANK.indexOf(b) > RANK.indexOf(a) ? b : a);
      return STATE_LABEL[best] || "";
    }
    const SUB = typeof crypto !== "undefined" && crypto.subtle ? crypto.subtle : null;
    const B64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    const HEX = (buf, n) => [...new Uint8Array(buf)].slice(0, n || 1e9).map((x) => x.toString(16).padStart(2, "0")).join("");
    const B64U = (str) => {
      const b = atob(str.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(str.length / 4) * 4, "="));
      return Uint8Array.from(b, (c) => c.charCodeAt(0));
    };
    const XOR = (a, b) => a.map((x, i) => x ^ b[i]);
    const BYTES = (u8, n) => {
      if (!u8) return "";
      const a = [...u8].slice(0, n || 1e9).map((x) => x.toString(16).padStart(2, "0"));
      return a.join(" ") + (n && u8.length > n ? " \u2026" : "");
    };
    async function makeKit() {
      if (!SUB) return null;
      const TE = new TextEncoder();
      const pair = () => SUB.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
      const [alice, bob] = await Promise.all([pair(), pair()]);
      const bits = (mine, theirs) => SUB.deriveBits({ name: "ECDH", public: theirs }, mine, 256);
      const [Zm, Zl] = await Promise.all([
        bits(alice.privateKey, bob.publicKey),
        bits(bob.privateKey, alice.publicKey)
      ]);
      const hk = async (raw) => {
        const base = await SUB.importKey("raw", raw, "HKDF", false, ["deriveBits"]);
        return SUB.deriveBits(
          {
            name: "HKDF",
            hash: "SHA-256",
            salt: new Uint8Array(16),
            info: TE.encode("cafe-cipher/aes-gcm")
          },
          base,
          256
        );
      };
      const [Km, Kl] = await Promise.all([hk(Zm), hk(Zl)]);
      const aes = (raw) => SUB.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
      /* 128-bit authentication tag, stated once and used everywhere */
      const TAGBITS = 128;
      const [keyM, keyL] = await Promise.all([aes(Km), aes(Kl)]);
      const jwkD = async (k) => B64U((await SUB.exportKey("jwk", k.privateKey)).d);
      /* the raw private scalars, so a swatch can be mapped from real bytes
         rather than from something invented for the picture */
      const jwkDraw = async (k) => {
        const d = (await SUB.exportKey("jwk", k.privateKey)).d;
        const b64 = d.replace(/-/g, "+").replace(/_/g, "/");
        const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
        return Uint8Array.from(bin, (c) => c.charCodeAt(0));
      };
      const rawQ = async (k) => new Uint8Array(await SUB.exportKey("raw", k.publicKey));
      const [dM, dL, Qm, Ql, dMraw, dLraw] = await Promise.all(
        [jwkD(alice), jwkD(bob), rawQ(alice), rawQ(bob), jwkDraw(alice), jwkDraw(bob)]
      );
      const u8 = (b) => new Uint8Array(b);
      return {
        /* the two sides really did land on the same value; shown, not asserted */
        same: HEX(Zm) === HEX(Zl),
        fingerprint: HEX(Zm, 4),
        session: {
          dM,
          dL,
          Qm,
          Ql,
          Z: u8(Zm),
          Zl: u8(Zl),
          K: u8(Km),
          Kl: u8(Kl),
          dMraw,
          dLraw,
          zSame: HEX(Zm) === HEX(Zl),
          kSame: HEX(Km) === HEX(Kl)
        },
        async encrypt(text) {
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const P2 = TE.encode(text);
          /* THE TAG LENGTH IS CONFIGURED, NOT INHERITED. WebCrypto's default is
             128 bits, but the film says "16 bytes" on screen, and a claim on
             screen should not rest on a default that could change. */
          const out = u8(await SUB.encrypt({ name: "AES-GCM", iv, tagLength: TAGBITS }, keyM, P2));
          const C = out.slice(0, P2.length);
          const tag = out.slice(P2.length);
          return {
            iv,
            buf: out.buffer,
            b64: B64(out),
            hex: HEX(out),
            P: P2,
            C,
            S: XOR(C, P2),
            tag,
            ivHex: HEX(iv, 6)
          };
        },
        /* GCM authenticates and decrypts in one operation: if the tag does not
           verify, WebCrypto throws and there is no plaintext to show. This
           returns that fact rather than a string, so no caller can display
           unverified bytes as if they were a message. */
        async open(packet) {
          try {
            const out = await SUB.decrypt({ name: "AES-GCM", iv: packet.iv, tagLength: TAGBITS }, keyL, packet.buf);
            return { ok: true, text: new TextDecoder().decode(out) };
          } catch (e) {
            return { ok: false, text: null };
          }
        },
        /* Bob decrypts with the key HIS side derived, never Alice's. */
        async decrypt(packet) {
          const out = await SUB.decrypt({ name: "AES-GCM", iv: packet.iv, tagLength: TAGBITS }, keyL, packet.buf);
          return new TextDecoder().decode(out);
        }
      };
    }
    /* One chip, one value, one owner. The owner is an initial and the kind is
       a glyph — a dot for what stays put, an arrow for what gets sent, an
       equals for what both sides worked out — so neither ownership nor
       security state rests on colour alone. */
    const Val = ({ kind, who, name, bytes, on }) => (
      <span className={"sv sv-" + kind + (on ? " on" : "")}>
        <span className="sv-own" aria-hidden="true">{who}</span>
        <span className="sv-t">
          <span className="sv-k">
            <i className="sv-g" aria-hidden="true">
              {kind === "priv" ? "\u25cf" : kind === "pub" ? "\u2197" : "="}
            </i>
            {name}
          </span>
          <span className="sv-v">{bytes}</span>
        </span>
      </span>
    );
    const shorten = (s, n) => s.length <= n ? s : s.slice(0, n) + "\u2026";
    const PhoneFrame = ({ who, title, children, quiet }) => /* @__PURE__ */ React.createElement("div", { className: "ip" + (quiet ? " quiet" : "") + (who === "fr" ? " ip-bob" : "") }, /* @__PURE__ */ React.createElement("div", { className: "ip-body" }, /* @__PURE__ */ React.createElement("div", { className: "ip-island" }), /* @__PURE__ */ React.createElement("div", { className: "ip-screen" }, /* @__PURE__ */ React.createElement("div", { className: "ip-nav" }, /* @__PURE__ */ React.createElement("span", { className: "ip-back" }, "\u2039"), /* @__PURE__ */ React.createElement("span", { className: "ip-who" }, title), /* @__PURE__ */ React.createElement("span", { className: "ip-dot" })), children)));
    const Bubble = ({ text, mine, cipher }) => /* @__PURE__ */ React.createElement("div", { className: "bub" + (mine ? " mine" : "") + (cipher ? " cipher" : "") }, String(text).split("\n").map((l, i) => /* @__PURE__ */ React.createElement("span", { key: i }, l || "\xA0")));
    const MCAM = {
      idle: [200, 104, 1],
      pause: [200, 104, 1],
      priv: [78, 136, 1.85],
      privLabel: [200, 140, 1.35],
      pub: [78, 136, 1.85],
      pubLabel: [200, 140, 1.35],
      travel1: [200, 98, 1],
      evePub: [200, 72, 1.45],
      combine: [200, 138, 1.12],
      same: [200, 138, 1.08],
      ecdh: [200, 110, 1.05],
      encrypting: [78, 136, 1.7],
      handoff: [90, 118, 1.45],
      wire: [200, 88, 1],
      landed: [200, 92, 1.12],
      toBob: [318, 126, 1.4],
      decrypting: [318, 126, 1.4],
      done: [200, 118, 1.05]
    };
    const MiniCafe = ({ stage, ct, ready, wide }) => {
      const P2 = [
        { who: "you", x: 66, y: 148, name: "Alice", sprite: SPRITE.you },
        { who: "atk", x: 200, y: 88, name: "Eve", sprite: SPRITE.atk },
        { who: "fr", x: 334, y: 148, name: "Bob", sprite: SPRITE.fr }
      ];
      const S = {
        priv: ["priv", "privLabel", "pub", "pubLabel", "travel1", "evePub", "combine"].includes(stage),
        pub: ["pub", "pubLabel", "travel1", "evePub", "combine"].includes(stage),
        swap: stage === "combine",
        key: [
          "same",
          "ecdh",
          "hinge",
          "encrypting",
          "handoff",
          "travel2",
          "eve",
          "arrive",
          "toBob",
          "decrypting",
          "done"
        ].includes(stage) || ready,
        pubFly: stage === "travel1" || stage === "evePub",
        /* the payload exists while it is in the air and not after: once the
           crossing pulls it into Bob’s phone it is his, and leaving the card
           parked over his head said the opposite of what the absorption had
           just shown */
        ctFly: ["handoff", "wire"].includes(stage)
      };
      const crossing = stage === "wire";
      const u = stage === "handoff" ? 0.04 : ["landed", "toBob", "decrypting", "done"].includes(stage) ? 1 : 0;
      const px = 66 + (334 - 66) * u;
      const copied = ["wire", "landed", "toBob", "decrypting", "done"].includes(stage);
      const live = S.pubFly || S.ctFly;
      const hot = stage === "evePub" ? "atk" : ["landed", "toBob", "decrypting"].includes(stage) ? "fr" : ["priv", "pub", "encrypting", "handoff"].includes(stage) ? "you" : null;
      const [cx, cy, k] = wide ? MCAM.idle : MCAM[stage] || MCAM.idle;
      const tapping = ["wire", "landed", "evePub"].includes(stage);
      return /* @__PURE__ */ React.createElement("svg", { className: "mini", viewBox: "0 0 400 200", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(
        "g",
        {
          className: "minicam",
          style: { transform: `translate(${200 - cx * k}px,${104 - cy * k}px) scale(${k})` }
        },
        /* @__PURE__ */ React.createElement("path", { className: "mini-wire", d: "M66 124 V62 H334 V124" }),
        /* @__PURE__ */ React.createElement("path", { className: "mini-live" + (live ? " on" : ""), d: "M66 124 V62 H334 V124" }),
        /* @__PURE__ */ React.createElement(
          "g",
          {
            className: "mini-router" + (k > 1.2 ? " tight" : ""),
            transform: "translate(200,36) scale(.5)"
          },
          /* @__PURE__ */ React.createElement(Router, { x: 0, y: 0, live, inv: 2 / k })
        ),
        tapping && /* @__PURE__ */ React.createElement("path", { className: "mini-tap", d: "M200 108 V62" }),
        crossing && /* @__PURE__ */ React.createElement("circle", { className: "mini-split", cx: "200", cy: "62", r: "7" }),
        P2.map((p) => {
          const mine = p.who !== "atk";
          return /* @__PURE__ */ React.createElement(
            "g",
            {
              key: p.who,
              transform: `translate(${p.x},${p.y})`,
              className: "mini-p" + (hot === p.who ? " hot" : "") + (p.who === "atk" ? " evil" : "") + (p.who === "atk" && tapping ? " busy" : "")
            },
            /* @__PURE__ */ React.createElement("ellipse", { className: "sh", cx: "0", cy: "32", rx: "42", ry: "10" }),
            /* @__PURE__ */ React.createElement(
              "image",
              {
                href: p.sprite,
                x: "-29",
                y: "-40",
                width: "58",
                height: "66",
                preserveAspectRatio: "xMidYMax meet"
              }
            ),
            /* Alice and Bob hold phones here too. The map is titled "Caf\u00e9
               view" and shows the same three people as the caf\u00e9 sequence; a
               landscape lid on this one and a portrait phone on that one
               would be two different rooms. Eve keeps her laptop. */
            mine
              ? /* @__PURE__ */ React.createElement("rect", {
                  className: "mini-lid mini-phone" + (S.key ? " keyed" : ""),
                  x: "-11", y: "0", width: "22", height: "44", rx: "5"
                })
              : /* @__PURE__ */ React.createElement("rect", {
                  className: "mini-lid",
                  x: "-30", y: "6", width: "60", height: "30", rx: "5"
                }),
            /* @__PURE__ */ React.createElement("g", { className: "mini-scr" }, mine && S.priv && !S.key && /* @__PURE__ */ React.createElement("text", { className: "mini-ico priv", x: S.pub ? -13 : 0, y: "27" }, "\u{1F512}"), mine && S.pub && !S.key && /* @__PURE__ */ React.createElement("text", { className: "mini-ico pub", x: "13", y: "26" }, "\u25CF"), mine && S.key && /* @__PURE__ */ React.createElement("text", { className: "mini-ico key", y: "27" }, "\u{1F511}"), !mine && S.ctFly && /* @__PURE__ */ React.createElement(
              "text",
              {
                className: "mini-ct" + (stage === "eveFail" ? " got" : ""),
                y: "25"
              },
              shorten(ct || "", 9)
            ), !mine && stage === "eveFail" && /* @__PURE__ */ React.createElement("text", { className: "mini-no", y: "34" }, "unreadable"), !mine && !S.ctFly && S.pub && /* @__PURE__ */ React.createElement("text", { className: "mini-ico seen", y: "26" }, "\u25CF\u25CF")),
            /* @__PURE__ */ React.createElement("text", { className: "mini-name", y: "52" }, p.name),
            mine && S.swap && /* @__PURE__ */ React.createElement("text", { className: "mini-sub", y: "64" }, p.who === "you" ? "kept + Bob\u2019s" : "kept + Alice\u2019s"),
            mine && stage === "same" && /* @__PURE__ */ React.createElement("text", { className: "mini-sub lit", y: "64" }, "same secret")
          );
        }),
        S.pubFly && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("g", { className: "mini-pub a" }, /* @__PURE__ */ React.createElement("rect", { x: "-34", y: "-11", width: "68", height: "22", rx: "6" }), /* @__PURE__ */ React.createElement("text", { y: "4" }, "Alice\u2019s public key")), /* @__PURE__ */ React.createElement("g", { className: "mini-pub b" }, /* @__PURE__ */ React.createElement("rect", { x: "-34", y: "-11", width: "68", height: "22", rx: "6" }), /* @__PURE__ */ React.createElement("text", { y: "4" }, "Bob\u2019s public key"))),
        S.ctFly && /* @__PURE__ */ React.createElement(
          "g",
          {
            className: "mini-pay" + (crossing ? " fly" : ""),
            transform: crossing ? void 0 : `translate(${px},62)`
          },
          /* @__PURE__ */ React.createElement("rect", { x: "-72", y: "-17", width: "144", height: "34", rx: "7" }),
          /* @__PURE__ */ React.createElement("text", { className: "mini-pay-l", y: "-4" }, "Encrypted message \xB7 Alice \u2192 Bob"),
          /* @__PURE__ */ React.createElement("text", { className: "mini-pay-c", y: "9" }, shorten(ct || "", 22))
        ),
        copied && /* @__PURE__ */ React.createElement(
          "g",
          {
            className: "mini-dup" + (crossing ? " drop" : " at") + (["toBob", "decrypting", "done"].includes(stage) ? " dim" : ""),
            transform: crossing ? void 0 : "translate(200,104)"
          },
          /* @__PURE__ */ React.createElement("rect", { x: "-72", y: "-17", width: "144", height: "34", rx: "7" }),
          /* @__PURE__ */ React.createElement("text", { className: "mini-pay-l", y: "-4" }, crossing ? "Copy \xB7 intercepted" : "Eve\u2019s copy \xB7 unreadable"),
          /* @__PURE__ */ React.createElement("text", { className: "mini-pay-c", y: "9" }, shorten(ct || "", 22))
        )
      ));
    };
    const Fx = ({ children }) => /* @__PURE__ */ React.createElement("span", { className: "fx" }, children);
    /* The guiding copy has to be able to say a symbol out loud — "Alice
       multiplies Q_B by her d_A" is specific in a way that "the values
       combine" never is, but only if the symbol in the sentence is set the
       same way as the symbol in the equation above it. {dA} in a line of copy
       becomes the same glyph the equation uses. */
    const Say = (t) => String(t).split(/(\{[A-Za-z]+\})/).map((part, i) => {
      const m = /^\{([A-Za-z])([A-Za-z]*)\}$/.exec(part);
      return m
        ? /* @__PURE__ */ React.createElement("i", { className: "fxi", key: i }, m[1],
            m[2] ? /* @__PURE__ */ React.createElement("sub", null, m[2]) : null)
        : /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, part);
    });

    /* ================================================== THE EQUATION REGION ===
       The phone telling of the key agreement had no math in it at all: the
       values were chips beside two characters, and the symbolic form lived
       only on the desktop panel. This is the math, staged one step at a time,
       in its own reserved row directly above the guiding copy.

       Two rules govern it. It is never dimmed, tinted down, overlaid or
       covered — emphasis here is additive only (a rule under the live term,
       a step up in size), because a formula at reduced contrast reads as a
       formula that has been switched off. And the bytes sit with the symbols
       rather than out in the scene, so the viewer is never asked to hold a
       symbol in one region and its value in another. */
    const EQN = (beat, s2) => {
      if (!s2) return null;
      const B = (x, n) => BYTES(x, n || 3);
      const pair = (fa, fb, va, vb, note) => ({ kind: "pair", fa, fb, va, vb, note });
      const solo = (f, rows, note) => ({ kind: "solo", f, rows, note });
      const dA = ["d", "A"], dB = ["d", "B"], QA = ["Q", "A"], QB = ["Q", "B"];
      switch (beat) {
        case "priv":
        case "privName":
          return pair([dA], [dB], B(s2.dM), B(s2.dL),
            beat === "privName" ? "each private value, on its own device" : null);
        case "pub":
        case "pubName":
          return pair([QA, " = ", dA, "G"], [QB, " = ", dB, "G"], B(s2.Qm), B(s2.Ql),
            beat === "pubName" ? "each public value, built from the private one" : null);
        case "travel1":
          return pair([QA, " \u2192"], ["\u2190 ", QB], B(s2.Qm), B(s2.Ql),
            "the public values, and only these, cross the Wi-Fi");
        case "evePub":
          return pair([QA], [QB], B(s2.Qm), B(s2.Ql),
            "Eve has both of these, and neither private value.");
        case "mixA":
          return solo([dA, QB], [["A", B(s2.Z)]], "your private value, Bob\u2019s public one");
        case "mixB":
          return solo([dB, QA], [["B", B(s2.Zl)]], "his private value, your public one");
        case "same":
          return solo(["Z = ", dA, QB, " = ", dB, QA],
            [["A", B(s2.Z)], ["B", B(s2.Zl)]],
            "computed separately, never sent");
        case "ecdh":
          return solo(["K = HKDF(Z)"], [["K", B(s2.K, 4)]],
            "the key AES-GCM uses on your message");
        default:
          return null;
      }
    };
    /* a formula is a list of strings and [letter, subscript] pairs */
    const Fxl = ({ parts }) => /* @__PURE__ */ React.createElement("span", { className: "fx" },
      parts.map((t, i) => Array.isArray(t)
        ? /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, t[0],
            /* @__PURE__ */ React.createElement("sub", null, t[1]))
        : /* @__PURE__ */ React.createElement(React.Fragment, { key: i }, t)));
    const EqnRegion = ({ beat, s: s2, on }) => {
      const e = EQN(beat, s2);
      if (!e) return null;
      const lit = (who) => on === "both" || on === who ? " lit" : "";
      return /* @__PURE__ */ React.createElement("div",
        { className: "eqn eqn-" + e.kind, role: "figure", "aria-label": "Equation for this step" },
        e.kind === "pair"
          ? /* @__PURE__ */ React.createElement("div", { className: "eqn-pair" },
              /* @__PURE__ */ React.createElement("span", { className: "eqn-col" + lit("a") },
                /* @__PURE__ */ React.createElement(Fxl, { parts: e.fa }),
                /* @__PURE__ */ React.createElement("span", { className: "eqn-v" },
                  /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "A"), e.va)),
              /* @__PURE__ */ React.createElement("span", { className: "eqn-col" + lit("b") },
                /* @__PURE__ */ React.createElement(Fxl, { parts: e.fb }),
                /* @__PURE__ */ React.createElement("span", { className: "eqn-v" },
                  /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "B"), e.vb)))
          : /* @__PURE__ */ React.createElement("div", { className: "eqn-solo" },
              /* @__PURE__ */ React.createElement(Fxl, { parts: e.f }),
              /* @__PURE__ */ React.createElement("span", { className: "eqn-rows" },
                e.rows.map(([k, v], i) => /* @__PURE__ */ React.createElement("span",
                  { className: "eqn-v", key: i },
                  /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, k), v)))),
        e.note && /* @__PURE__ */ React.createElement("span", { className: "eqn-note" }, e.note));
    };

    const Raw = ({ children }) => /* @__PURE__ */ React.createElement("span", { className: "raw" }, children);
    /* EIGHT BEATS, AND rest IS ONE OF THEM.
       The old list had ten and stopped short of the resting state, so every
       flag derived from "how far have we got" fell back to false the moment
       the sequence finished: the equation cleared, the device went back to
       "not established", and the copy was left claiming a key that nothing on
       screen agreed existed. A settled state is the last frame of the story,
       not the absence of one. */
    const EORD = [
      "setup",   /* both hold a private value, on their own device        */
      "qa",      /* Alice derives her public value                        */
      "qb",      /* Bob derives his                                       */
      "cross",   /* the two public values cross, through Eve              */
      "mixA",    /* Alice combines \u2014 result masked                        */
      "mixB",    /* Bob combines \u2014 result masked                          */
      "reveal",  /* both masks lift together: this is where Z first exists */
      "rest"     /* K on both devices, and nothing is taken away          */
    ];
    const upTo = (beat, name) => EORD.indexOf(beat) >= EORD.indexOf(name);
    /* ==================================================== THE COLOUR FILM ====
       The café has already made the problem: Eve is on this network and can
       read what crosses it. This is the answer to that problem, told as one
       continuous scene with a camera that goes where the action is.

       TWO LAYERS, NEVER CONFUSED. The colours are an analogy for mixing that
       cannot be unmixed. The cryptography is real: P-256 ECDH, HKDF and
       AES-GCM run in the browser, and every swatch that stands for a real
    /* ============ THE FILM: THE CHAIN, ONE LINK AT A TIME =================
       Re-authored to the seventeen steps, with each crossing given its own
       direction rather than both at once, and with Eve's failure made its own
       beat instead of a sentence inside someone else's.

       The governing rule: no line of dialogue introduces an idea unless the
       stage is at that moment showing, moving, splitting, combining or
       revealing the exact objects that make the line true. Beats that existed
       only to say what had happened have been replaced by beats that do it.
    */
    /* ========================================================================
       THE FILM                                                       pass 44
       One causal path, read top to bottom. Every beat is either something
       happening or something the viewer does; no beat exists to narrate a
       state that the beat before it could have shown. Three screens were
       removed by merging them into the motion they were describing (Bob's
       mix, Bob's combine, and the packet's assembly), one was removed because
       its content belongs to the shot it was explaining (Eve's failure, now
       part of the crossing), and one was added because the story was skipping
       it (Bob choosing a private value of his own).

       `arc` is the subordinate phase cue. It exists so that a viewer who
       lands on a frame cold knows which of the three questions the film is
       answering at that moment, without a legend and without a paragraph.
       ===================================================================== */
    /* the beats where the colour itself is the action, and a 203px phone
       screen is not enough room to do it in */
    const WORK = new Set(["mine", "pickB", "mixA", "mixAout", "mixB",
                          "combA", "combAout", "combB", "protect", "open"]);
    const ARCS = ["secret", "key", "send"];
    const ARCNAME = { secret: "Make the secret", key: "Make the key", send: "Send the message" };
    const FILM = [
      /* -- 1. the problem ------------------------------------------------- */
      /* storyboard 1a: a true close-up. The onlookers were the café's job;
         here the viewer becomes Alice, at the close-up scale */
      { k: "problem", cam: "a", arc: "secret", at: { msg: "a" }, lead: "msg",
        from: { msg: "seed" }, born: "msg", watched: true, wait: 4600,
        say: "You want to send Bob something only he can read",
        sub: "Eve sees everything that crosses this café's Wi‑Fi." },

      /* -- 2. the one colour everybody starts from ------------------------ */
      { k: "base", cam: "wide", arc: "secret", at: { base: "lane" }, lead: "base",
        from: { base: "wire" }, open: true, wait: 4000,
        say: "Everyone starts from the same public colour",
        sub: "Alice, Bob and Eve can all see this one." },

      /* -- 3-4. Alice's private value: chosen, then held ------------------ */
      /* the public colour stays in the phone, quieter, while the private one
         is chosen: "shared + mine -> my mixture" without relying on memory
         of 1b (pass 53). Bob's phone shows it the same way in 2c. */
      { k: "pickA", cam: "a", arc: "secret", at: { base: "a", pa: "a" }, lead: "pa",
        from: { pa: "pick" }, act: "pick", point: "picker", empty: "pa",
        say: "Choose your private colour", sub: "" },
      { k: "mine", cam: "a", arc: "secret", at: { base: "a", pa: "a" }, lead: "pa", keep: "pa",
        claim: true, wait: 4400,
        say: "{MINE} is yours",
        sub: "It stays in this slot. It never leaves the phone." },

      /* -- 5. Bob does the same, so the mirror is established early ------- */
      { k: "pickB", cam: "b", arc: "secret", at: { base: "b", pb: "b" }, lead: "pb",
        from: { pb: "pick" }, born: "pb", claim: true, wait: 3800,
        say: "Bob keeps one too", sub: "Neither of you will ever see the other's." },

      /* -- 6-7. Alice mixes, by hand, and the mixture is made in view ----- */
      { k: "mixA", cam: "a", arc: "secret", at: { base: "a", pa: "a" }, lead: "base",
        act: "blend", drag: { from: "base", to: "pa" }, grabHint: "drag me onto yours",
        say: "Drag the public colour onto yours", sub: "" },
      { k: "mixAout", cam: "a", arc: "secret", at: { base: "a", qa: "a", pa: "a" },
        lead: "qa", from: { qa: ["base", "pa"] }, born: "qa", keep: "pa",
        fuse: true, wait: 6600,
        /* no formula over the paint: Q_A arrives with its picture in 6b */
        say: "The two make a third colour",
        sub: "Yours stays in its slot. The mixture is the part you can share." },

      /* -- 8. Bob's mix: the same motion, mirrored, in one beat ----------- */
      { k: "mixB", cam: "b", arc: "secret", at: { base: "b", qb: "b", pb: "b" },
        lead: "qb", from: { qb: ["base", "pb"] }, born: "qb", keep: "pb",
        fuse: true, wait: 6400,
        say: "Bob does the same with his", sub: "" },

      /* -- 9-11. the exchange, with Eve taking a copy of each ------------- */
      /* 4a: her colour stays visibly in its slot while the mixture is offered —
         this is the frame about what can leave and what cannot */
      { k: "sendA", cam: "a", arc: "secret", at: { pa: "a", qa: "a" }, lead: "qa", act: "send",
        tap: true, keep: "pa", point: "send",
        say: "Send your mixture to Bob", sub: "" },
      /* -- 10. THE EXCHANGE, IN ONE FRAME ------------------------------
         This was two beats: hers crosses, then his crosses back. Split that
         way the viewer never saw the whole relationship at once, and Eve's
         position had to be described rather than shown. One frame now holds
         all five facts: her private value is on her phone, his is on his,
         each mixture is on the wire heading for the other person, and Eve
         has a copy of both. What travels is visibly the mixture; what stays
         is visibly the private colour. */
      { k: "exchange", cam: "wide", arc: "secret", xchg: true,
        at: { pa: "a", pb: "b", qa: "lane", qb: "lane", qa2: "eve", qb2: "eve" },
        lead: "qa", journey: "both", from: { qa2: ["qa"], qb2: ["qb"] },
        born: "qa2", peek: true, wait: 7200, bobSends: true,
        say: "You swap mixtures. Eve copies both.",
        sub: "Eve can see the mixed colours, but not the original private colours." },
      /* storyboard 4e: the census. Each mixture finishes its trip INTO the
         other phone, so the frame says, without words, who now holds what:
         own colour + the other's mixture on each phone, two copies with Eve */
      { k: "xland", cam: "wide", arc: "secret", xchg: true,
        at: { pa: "a", qb: "a", pb: "b", qa: "b", qa2: "eve", qb2: "eve" },
        lead: "qa", moved: "qa", wait: 4200,
        say: "Now each of you has the other’s mixture",
        sub: "Eve has copies of both. Neither private colour ever left." },
      /* storyboard 4f–4g (pass 57): EVE TRIES TO UNMIX. Same three people,
         same holdings as 4e: Alice's colour on Alice's phone, Bob's on Bob's,
         each with the other's mixture, Eve with her two copies. Eve's copy of
         Alice's mixture swells and comes apart into guesses that flicker and
         never settle, then closes back into the mixture it was. The guesses
         are her trying private colours, not anything hidden in the mixture:
         unmixing is the picture of a one-way calculation, and the copy never
         turns into either private colour. */
      { k: "unmix", cam: "wide", arc: "secret", xchg: true, unmix: true,
        at: { pa: "a", qb: "a", pb: "b", qa: "b", qa2: "eve", qb2: "eve" },
        lead: "qa2", wait: 7000,
        say: "Eve tries to unmix a copy",
        sub: "No guess turns back into your colour or Bob’s. Working backwards is the hard direction." },

      /* -- 12-14. both sides combine; the results form covered ----------- */
      { k: "combA", cam: "a", arc: "secret", at: { qb: "a", pa: "a" }, lead: "qb",
        act: "combine", drag: { from: "qb", to: "pa" }, grabHint: "drag me onto yours",
        say: "Drag Bob's mixture onto your private colour", sub: "" },
      { k: "combAout", cam: "a", arc: "secret", at: { qb: "a", sa: "a", pa: "a" }, lead: "sa",
        from: { sa: ["qb", "pa"] }, born: "sa", masked: true, fuse: true, wait: 6400,
        say: "That makes your result", sub: "Covered until Bob has his." },
      { k: "combB", cam: "b", arc: "secret", at: { qa: "b", sb: "b", pb: "b" }, lead: "sb",
        from: { sb: ["qa", "pb"] }, born: "sb", masked: true,
        fuse: true, wait: 6600,
        say: "Bob does the same with yours", sub: "" },

      /* -- 15. the payoff: both uncover at once, and the wire is empty ---- */
      /* storyboard 5d: revealed together, with Eve in the shot holding the two
         copies she took — the proof that what she has is not enough */
      { k: "reveal", cam: "both", arc: "secret", at: { sa: "a", sb: "b", qa2: "eve", qb2: "eve" },
        lead: "sa", rev: true, payoff: true, converge: true, bare: true, eveIn: true, wait: 6000,
        say: "Same colour. Never sent.",
        sub: "Eve has both mixtures and still cannot make this one." },

      /* -- 16. one transition out of the analogy, and only one ------------ */
      { k: "asmath", cam: "both", arc: "key", at: { sa: "a", sb: "b" }, lead: "sa",
        rev: true, bare: true, converge: true, toMath: true, bridge: true, wait: 6200,
        say: "Computers do this with numbers instead of paint",
        sub: "Every colour you used has an exact number behind it." },

      /* storyboard 6b: the same exchange, once, in the real vocabulary and on
         the same stage — the private numbers stay in their slots, the two
         public values cross, Eve copies the public values */
      { k: "pubvals", cam: "wide", arc: "key", xchg: true, sym: true,
        at: { pa: "a", pb: "b", qa: "lane", qb: "lane", qa2: "eve", qb2: "eve" },
        lead: "qa", journey: "both", wait: 7400,
        math: "Q_A = d_A G   ·   Q_B = d_B G",
        say: "Each private number makes a public value",
        sub: "Only these cross, and Eve copies them. Finding d from Q is the one-way step the unmixing stood for." },

      /* storyboard 7a: each phone combines its own private number with the
         other side's public value, and both arrive at the same Z */
      { k: "zsec", cam: "both", arc: "key", sym: true, at: { pa: "a", sa: "a", pb: "b", sb: "b" },
        lead: "sa", rev: true, bare: true, wait: 6000,
        math: "Z = d_A Q_B = d_B Q_A",
        say: "Both phones reach the same Z",
        sub: "Z never crossed the network." },

      /* -- 17-18. the key, derived locally, identical on both ------------- */
      /* "each phone derives a key" and "both phones have the same key" were
         two frames showing the same picture. The derivation and its result are
         one event, so they are one beat: the secret morphs into a key on both
         sides at once, and the line names what the viewer is watching. */
      { k: "tokey", cam: "both", arc: "key", at: { ka: "a", kb: "b" }, lead: "ka",
        from: { ka: ["sa"], kb: ["sb"] }, born: "ka", kdf: true, morph: true,
        bare: true, payoff: true, wait: 6000,
        math: "K = HKDF(Z)",
        say: "Each phone turns that into the same key",
        sub: "Nothing crossed the network to put it there." },

      /* -- 19-20. the message, and the packet it becomes ----------------- */
      { k: "type", cam: "a", arc: "send", at: { ka: "a" }, lead: "ka", bare: true,
        act: "type", point: "compose",
        say: "Type a message for Bob", sub: "" },
      { k: "protect", cam: "a", arc: "send", at: { msg: "a", pkt: "a" },
        lead: "pkt", from: { pkt: ["msg", "ka"] }, born: "pkt", bare: true,
        gcm: true, fuse: true, data: true, wait: 6600,
        math: "(C, T) = AES-GCM(K, nonce, message)",
        say: "Your key turns it into a packet",
        sub: "Nothing readable leaves the phone." },

      /* -- 21. it crosses; Eve gets a copy and cannot open it ------------ */
      /* storyboard 9a: both keys stay in their phones while the packet crosses,
         so what Eve lacks is visible, not stated */
      { k: "journey", cam: "wide", arc: "send", xchg: true,
        at: { ka: "a", kb: "b", pkt: "lane", pkt2: "eve" }, lead: "pkt",
        journey: "pkt", from: { pkt2: ["pkt"] }, born: "pkt2", peek: true, noK: true,
        bare: true, wait: 7400,
        say: "Eve copies the packet too",
        sub: "She has no key, so it stays noise." },

      /* -- 22-23. Bob checks it, and the message comes back ------------- */
      { k: "arrive", cam: "b", arc: "send", at: { pkt: "b", kb: "b" }, lead: "pkt",
        moved: "pkt", sink: true, bare: true, verify: true, wait: 4000,
        say: "It reaches Bob, and his key checks it", sub: "" },
      { k: "open", cam: "b", arc: "send", at: { plain: "b" }, lead: "plain",
        from: { plain: ["pkt", "kb"] }, born: "plain", bare: true, opened: true, wait: 6000,
        math: "message = AES-GCM-Open(K, nonce, C, T)",
        say: "And here is your message", sub: "" },

      /* -- 24. the end ---------------------------------------------------- */
      { k: "chain", cam: "both", arc: "send", at: {}, chain: true, end: true,
        say: "Same secret → one key → protected message → Bob reads it", sub: "" }
    ];
    const FKEY = FILM.map((f) => f.k);
    const FAT  = (k) => FILM[FKEY.indexOf(k)] || FILM[0];
    const GATES = FILM.filter((f) => f.act).map((f) => f.k);

    /* ------------------------------------------- FRAME REFERENCE LABELS ----
       A review marker, not part of the lesson: the label in the top-left of
       the module names the storyboard frame being shown, so "4c" in a note
       means the same picture here and in the Figma storyboard. Sections are
       story chapters, letters are the visual states inside them, in order.
       Internal beat ids are unchanged; this is the one place they are mapped.
       The full table (label -> Figma frame -> beat/state) is in CLAUDE.md.

       Two beats hold more than one storyboard state, so they are split by
       time since the beat began, matched to their animations: the held blend
       resolves at ~3.4s, and the two mixtures meet under Eve at ~3.1s. */
    const REF = {
      you: "1a", problem: "1a", base: "1b",
      pickA: "2a", mine: "2b", pickB: "2c",
      mixA: "3a", mixAout: "3b", mixB: "3d",
      sendA: "4a", exchange: "4b", xland: "4e", unmix: "4f",
      combA: "5a", combAout: "5b", combB: "5d", reveal: "5f",
      asmath: "6a", pubvals: "6b",
      zsec: "7a", tokey: "7b",
      type: "8a", protect: "8b",
      journey: "9a",
      arrive: "10a", open: "10b", chain: "10c"
    };
    const REF_SUB = {
      mixAout: [[3360, "3c"]], mixB: [[3360, "3e"]],
      exchange: [[2600, "4c"], [3900, "4d"]],
      unmix: [[4800, "4g"]],
      combAout: [[3360, "5c"]], combB: [[3360, "5e"]]
    };
    /* WHERE EACH LABEL IS, EXACTLY. For review, not for viewers: the hidden
       window.__ref("4c") pins the beat and pauses every animation in the film
       at this many ms after the beat began, so a labelled state can be
       inspected without waiting for a timer. A label inside a split beat sits
       inside its REF_SUB window; the rest are the settled picture. */
    const REF_AT = {
      "1a": ["problem", 1500], "1b": ["base", 2400],
      "2a": ["pickA", 1200], "2b": ["mine", 2000], "2c": ["pickB", 2000],
      "3a": ["mixA", 1200], "3b": ["mixAout", 2350], "3c": ["mixAout", 6200],
      "3d": ["mixB", 2350], "3e": ["mixB", 6200],
      "4a": ["sendA", 1200], "4b": ["exchange", 1300], "4c": ["exchange", 3350],
      "4d": ["exchange", 5000], "4e": ["xland", 1600],
      "4f": ["unmix", 2600], "4g": ["unmix", 6000],
      "5a": ["combA", 1200], "5b": ["combAout", 2350], "5c": ["combAout", 4600],
      "5d": ["combB", 2350], "5e": ["combB", 4600], "5f": ["reveal", 2400],
      "6a": ["asmath", 3600], "6b": ["pubvals", 4400],
      "7a": ["zsec", 2000], "7b": ["tokey", 3200],
      "8a": ["type", 1200], "8b": ["protect", 6200],
      "9a": ["journey", 4600],
      "10a": ["arrive", 2000], "10b": ["open", 2400], "10c": ["chain", 1500]
    };

    /* ------------------------------------------------ WHO HOLDS WHAT ------
       Ownership is derived by walking the film once: a focal placement assigns
       or moves it, and an object leaves the world only when whatever consumed
       it is present. Hand-written shelf lists were tried and twenty-six
       objects went missing without anything breaking. */
    const CONSUMED = { base: ["qa", "qb"], msg: ["pkt"], sa: ["ka"], sb: ["kb"], pkt: ["plain"] };
    const SIDE_OF = { pa: "a", qa: "a", sa: "a", ka: "a", msg: "a", pkt: "a", base: "a",
      pb: "b", qb: "b", sb: "b", kb: "b", vfy: "b", plain: "b",
      qa2: "e", qb2: "e", pkt2: "e" };
    const OWNED = (() => {
      const own = { a: new Set(), b: new Set(), e: new Set() };
      const out = [];
      for (const F of FILM) {
        for (const [id, w] of Object.entries(F.at || {})) {
          const side = w === "a" ? "a" : w === "b" ? "b" : w === "eve" ? "e" : null;
          if (side) { for (const s of ["a", "b", "e"]) own[s].delete(id); own[side].add(id); }
          else if (w === "lane" && !["a", "b", "e"].some((s) => own[s].has(id)))
            own[SIDE_OF[id] || "a"].add(id);
        }
        for (const [id, succ] of Object.entries(CONSUMED))
          if (succ.every((x) => ["a", "b", "e"].some((s) => own[s].has(x))))
            for (const s of ["a", "b", "e"]) own[s].delete(id);
        out.push({ a: [...own.a], b: [...own.b], e: [...own.e] });
      }
      return out;
    })();
    const HELD = (k) => OWNED[Math.max(0, FKEY.indexOf(k))] || { a: [], b: [], e: [] };

    /* ------------------------------------------------- WHAT A BEAT NEEDS ---
       Ownership persists, but the frame is not a ledger. Each phase names what
       belongs to its story; anything older is still owned, still real, and
       still in the panel — it just is not in the shot. */
    const RELEVANT = {
      paint:  ["base", "pa", "pb", "qa", "qb", "sa", "sb", "qa2", "qb2"],
      bridge: [],
      derive: ["sa", "sb", "ka", "kb"],
      protect: ["ka", "kb", "msg", "pkt", "pkt2", "vfy", "plain"],
      recap:  []
    };
    const PHASE = (k) => {
      const i = FKEY.indexOf(k);
      if (i >= FKEY.indexOf("chain")) return "recap";
      if (i >= FKEY.indexOf("type")) return "protect";
      if (i >= FKEY.indexOf("reveal")) return "derive";
      return "paint";
    };
    /* the film is read frame by frame and never cumulatively, so there is no
       `cinAt`-style helper here on purpose: reintroducing one would let
       information pile up again, which is the fault this rebuild removes */
    /* THE DISPLAY MAPPING, declared once and used everywhere. */
    const RGB = (bytes, off) => {
      if (!bytes || bytes.length < (off || 0) + 3) return "#3a4449";
      const h = (n) => n.toString(16).padStart(2, "0").toUpperCase();
      return "#" + h(bytes[(off || 0)]) + h(bytes[(off || 0) + 1]) + h(bytes[(off || 0) + 2]);
    };
    /* a public key starts with an 0x04 tag byte; the colour comes from the
       coordinate bytes after it, not from the tag every key shares */
    const QRGB = (q) => RGB(q, 1);
    /* ===================== THE PAINT MODEL ==================================
       The analogy layer has its own arithmetic, and it is the arithmetic that
       makes the analogy TRUE rather than merely illustrative.

       A swatch in this layer is a MULTISET OF INGREDIENTS. Its hex is the mean
       of those ingredients, channel by channel. So:

         public base        {base}
         Alice's private    {a}                 Bob's private     {b}
         Alice's mixture    {base, a}           Bob's mixture     {base, b}
         Alice's final      {base, a} + {b}     Bob's final       {base, b} + {a}
                          = {base, a, b}                        = {base, a, b}

       The two final mixtures are literally the same three ingredients, so they
       compute to the same hex — the payoff is a fact about the data, not a
       coincidence arranged for the screen. A plain pairwise average would not
       do this: mix(mix(base,a),b) weights b twice as heavily as a, and the two
       sides would visibly disagree.

       Blending paint is not what ECDH does. It is an analogy for an operation
       that is easy forwards and hard backwards, and the real key agreement
       runs underneath, untouched by any of this. */
    const HEX2RGB = (h) => {
      const v = h.replace("#", "");
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    };
    /* AN INSTRUCTION HAS TO NAME THE THING. "Drag onto your colour" assumes the
       viewer already knows which object is meant; "drag the yellow swatch onto
       your blue swatch" does not. These are the plain words for a hex. */
    const HUE_NAME = (hex) => {
      const [r, g, b] = HEX2RGB(hex);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (d < 26) return mx > 190 ? "white" : mx < 70 ? "black" : "grey";
      let h = 0;
      if (mx === r) h = 60 * (((g - b) / d) % 6);
      else if (mx === g) h = 60 * ((b - r) / d + 2);
      else h = 60 * ((r - g) / d + 4);
      if (h < 0) h += 360;
      if (h < 16) return "red";
      if (h < 45) return "orange";
      if (h < 68) return "yellow";
      if (h < 100) return "lime";
      if (h < 160) return "green";
      if (h < 200) return "teal";
      if (h < 250) return "blue";
      if (h < 290) return "purple";
      if (h < 330) return "magenta";
      return "pink";
    };
    const MIX = (...cols) => {
      const n = cols.length || 1;
      const sum = [0, 0, 0];
      for (const c of cols) { const r = HEX2RGB(c); sum[0] += r[0]; sum[1] += r[1]; sum[2] += r[2]; }
      return "#" + sum.map((x) => Math.round(x / n).toString(16).padStart(2, "0").toUpperCase()).join("");
    };

    /* Yellow is the public colour, so it is not on offer as a private one: the
       two would be the same swatch doing opposite jobs. */
    const SWATCHES = ["#3276E8", "#E8734A", "#22C98A", "#B968E8", "#E0457B", "#3AC7E8"];

    /* ======================================= THE SHAPE GRAMMAR ==============
       Seven cryptographic roles were all drawn as the same rounded rectangle
       with a different fill, which meant hue was doing the whole job of saying
       what a thing WAS. Each role now has its own silhouette, readable with
       the colour removed entirely:

         private    a chip behind a closed padlock, sitting on a dock bar
         public     a chip in an open frame, with outward chevrons
         secret Z   two halves interlocked into one form
         key K      a key: bow, blade and teeth
         nonce      a narrow counter chip, ticked, single-use
         cipher     a strip of byte-derived swatches
         seal       a notched seal with a check or a cross
         message    a card with text lines on it

       Colour still carries the VALUE (the display mapping of real bytes);
       shape carries the ROLE. Neither is asked to do the other's work. */
    const Tok = ({ role, hex, label, note, masked, state, bytes, dock, digits, sym }) => {
      const c = masked ? "none" : (hex || "#3a4449");
      const S = { className: "tk-art", viewBox: "0 0 60 44", width: "100%",
        preserveAspectRatio: "xMidYMid meet", "aria-hidden": "true" };
      const art = {
        /* ======================================================= pass 44 ==
           ONE PLATE, ONE HAIRLINE, NO CLIP ART.
           The grammar was carried by illustrations bolted to the plate — a
           padlock shackle over a private value, arrowheads beside a public
           one, a drawn key with bow and teeth. At the size the film now runs
           at those read as stickers, and they brought their own stroke
           weights and colours with them.

           The plate is identical everywhere (x6 y10, 48x26). The role is now
           said by ONE inner hairline and what is done to it:

             private   closed hairline, seated on a rail
             public    hairline broken at both sides — it is open, it travels
             secret    two hairlines — it was made from two things
             key       the colour with a keyhole cut out of it
             nonce     the plate with a single tick in the corner
             cipher    a row of byte swatches behind the same hairline
             seal      a hairline ring with a check or a cross
             message   a card with lines of text

           Every stroke in here is 1.4 and inherits one colour. Nothing is
           filled except the colour itself. */
        /* THE ROLE MARK IS ON THE OUTER EDGE. Drawn inside the plate it had
           to be legible against every colour the viewer might pick, and on a
           dark mixture it vanished. On the edge it sits against the stage,
           which is always dark, so the grammar reads the same on a yellow
           private value and on a near-black one:
             closed edge + a rail under it   it stays where it is
             edge broken at both sides       it leaves, and comes back
             doubled edge                    it was made from two things     */
        private: (
          <svg {...S}>
            <rect x="6" y="10" width="48" height="26" rx="4" fill={c} />
            <rect className="tk-ln" x="6" y="10" width="48" height="26" rx="4" fill="none" />
            <rect className="tk-rail" x="11" y="39" width="38" height="2" rx="1" />
            {sym && <text className="tk-sym" x="30" y="27.6" textAnchor="middle">{sym}</text>}
          </svg>
        ),
        public: (
          <svg {...S}>
            <rect x="6" y="10" width="48" height="26" rx="4" fill={c} />
            <path className="tk-ln" d="M6 20 V14 a4 4 0 0 1 4 -4 H50 a4 4 0 0 1 4 4 V20" fill="none" />
            <path className="tk-ln" d="M54 26 V32 a4 4 0 0 1 -4 4 H10 a4 4 0 0 1 -4 -4 V26" fill="none" />
            <path className="tk-ln" d="M1.6 23 H5 M55 23 H58.4" fill="none" />
            {sym && <text className="tk-sym" x="30" y="27.6" textAnchor="middle">{sym}</text>}
          </svg>
        ),
        secret: (
          <svg {...S}>
            <rect x="6" y="10" width="48" height="26" rx="4" fill={c} />
            <rect className="tk-ln" x="6" y="10" width="48" height="26" rx="4" fill="none" />
            {!digits && !sym && <rect className="tk-ln" x="3" y="7" width="54" height="32" rx="6.5" fill="none" opacity=".55" />}
            {digits && <text className="tk-dg" x="30" y="26" textAnchor="middle"
              textLength="40" lengthAdjust="spacingAndGlyphs">{digits}</text>}
            {sym && <text className="tk-sym" x="30" y="27.6" textAnchor="middle">{sym}</text>}
            {masked && <>
              <rect className="tk-cover" x="6" y="10" width="48" height="26" rx="4" />
              <text className="tk-q" x="30" y="27" textAnchor="middle">?</text>
            </>}
          </svg>
        ),
        /* The key was a keyhole cut out of the plate — a quieter drawing than
           the cartoon key it replaced, but still a picture of a lock in a
           system where nothing else is a picture of anything. It is the same
           plate as every other object, carrying the name the rest of the film
           calls it by. */
        key: (
          <svg {...S}>
            <rect x="6" y="10" width="48" height="26" rx="4" fill={c} />
            <rect className="tk-ln" x="6" y="10" width="48" height="26" rx="4" fill="none" />
            <text className="tk-k" x="30" y="29" textAnchor="middle">K</text>
          </svg>
        ),
        nonce: (
          <svg {...S}>
            <rect x="6" y="10" width="48" height="26" rx="4" fill={c} />
            <rect className="tk-ln" x="6" y="10" width="48" height="26" rx="4" fill="none" />
            <text className="tk-1" x="30" y="27" textAnchor="middle">1×</text>
          </svg>
        ),
        cipher: (
          <svg {...S}>
            {(bytes || []).slice(0, 6).map((b2, i) => (
              <rect key={i} x={7 + i * 7.8} y="11" width="6.6" height="24" fill={b2} />
            ))}
            <rect className="tk-ln" x="6" y="10" width="48" height="26" rx="4" fill="none" />
          </svg>
        ),
        seal: (
          <svg {...S}>
            <circle className="tk-ln" cx="30" cy="23" r="11" fill="none" />
            {state === "bad"
              ? <path className="tk-mk" d="M25.4 18.4 l9.2 9.2 M34.6 18.4 l-9.2 9.2" fill="none" />
              : <path className="tk-mk" d="M24.6 23.2 l4 4 l7-8.2" fill="none" />}
          </svg>
        ),
        message: (
          <svg {...S}>
            <rect className="tk-ln" x="6" y="8" width="48" height="28" rx="4" fill="none" />
            <path className="tk-in" d="M13 17 h28 M13 22 h34 M13 27 h20" fill="none" />
          </svg>
        ),
      }[role] || null;
      return (
        <div className={"tk tk-" + role + (masked ? " tk-masked" : "")
          + (dock ? " tk-dock-on" : "") + (state ? " tk-" + state : "")}>
          <div className="tk-box">{art}</div>
          {label && <span className="tk-l">{label}</span>}
          {!masked && hex && <span className="tk-h">{hex}</span>}
          {note && <span className="tk-n">{note}</span>}
        </div>
      );
    };

    const Sw = ({ hex, label, note, big, mixing, base, past, masked }) =>
      React.createElement("div", { className: "sw" + (big ? " sw-big" : "") + (past ? " sw-past" : "") + (masked ? " sw-masked" : "") },
        React.createElement("div", { className: "sw-chip" + (mixing ? " mixing" : ""),
          style: { background: masked ? "transparent" : (base || hex) } },
          mixing && React.createElement("i", { style: { background: hex } }),
          masked && React.createElement("b", { "aria-label": "not revealed yet" }, "?")),
        label && React.createElement("span", { className: "sw-l" }, label),
        !masked && React.createElement("span", { className: "sw-h" }, hex),
        note && React.createElement("span", { className: "sw-n" }, note));

    const Eq = ({ parts, note }) =>
      React.createElement("div", { className: "cin-eq" },
        React.createElement(Fxl, { parts }),
        note && React.createElement("span", { className: "cin-eq-n" }, note));
    /* ==================== DIRECT MANIPULATION ===============================
       The teaching moments used to be buttons that started animations: the
       viewer pressed "Blend them" and watched a blend happen. That is a
       remote control, not a first-person story, and it is why the experience
       still read as a state viewer.

       The object itself is now the control. A frame declares `drag: {from, to}`
       and the named object becomes grabbable; the named target lights up as
       the only place it can go. Dropping it is what advances the film, so the
       viewer's hand is what causes the next state rather than a press that
       requests it.

       Pointer, touch and keyboard are all supported on the SAME element —
       there is no parallel button to compete with the object, because a
       second control in the frame is exactly the clutter this pass removes. */
    const useDrag = ({ id, target, onDone, disabled }) => {
      const ref = useRef(null);
      const [live, setLive] = useState(false);
      const [over, setOver] = useState(false);
      useEffect(() => {
        const el = ref.current;
        if (!el || disabled) return;
        let moved = false;
        const hit = (x, y) => {
          const t = document.querySelector('[data-drop="' + target + '"]');
          if (!t) return false;
          const r = t.getBoundingClientRect();
          /* a generous target: this is a story, not a dexterity test */
          const pad = 26;
          return x >= r.left - pad && x <= r.right + pad
              && y >= r.top - pad && y <= r.bottom + pad;
        };
        const move = (e) => {
          const pt = e.touches ? e.touches[0] : e;
          moved = true;
          const r0 = el.__start;
          el.style.transform = "translate(" + (pt.clientX - r0.x) + "px," + (pt.clientY - r0.y) + "px)";
          setOver(hit(pt.clientX, pt.clientY));
        };
        const up = (e) => {
          const pt = e.changedTouches ? e.changedTouches[0] : e;
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          setLive(false);
          const landed = moved && hit(pt.clientX, pt.clientY);
          el.style.transition = "transform 320ms cubic-bezier(.3,0,.2,1)";
          el.style.transform = "";
          setOver(false);
          if (landed) onDone();
        };
        const down = (e) => {
          const pt = e.touches ? e.touches[0] : e;
          el.__start = { x: pt.clientX, y: pt.clientY };
          moved = false;
          el.style.transition = "none";
          setLive(true);
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
          e.preventDefault();
        };
        const key = (e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDone(); }
        };
        el.addEventListener("pointerdown", down);
        el.addEventListener("keydown", key);
        return () => {
          el.removeEventListener("pointerdown", down);
          el.removeEventListener("keydown", key);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        };
      }, [id, target, disabled, onDone]);
      return { ref, live, over };
    };

    /* ======================================================= THE PACKET ====
       It used to be three tokens in a grid — a ciphertext strip, a nonce chip
       and a seal badge — each with its own box, its own ring and its own
       label, which read as a parts bin rather than as one thing travelling.

       A packet is one sealed object with its parts on its face: the plate
       everything else in the film uses, a band of real ciphertext bytes
       across it, a notch cut from the right edge where the seal closes it,
       and one tick for the single-use nonce. Nothing nested, one hairline. */
    /* THE WHOLE PACKET, EVERY BYTE OF IT. What crosses the wire is the
       nonce, the ciphertext and the 16-byte tag, and each is drawn from its
       own real bytes, three bytes to a cell: the nonce as short bars (it is
       public, it only has to be fresh), the ciphertext at full height (one
       cell for every three bytes of the message), the tag on the sealed end.
       The parts are told apart by shape and by the hairlines between them,
       not by colour alone. */
    const cellsOf = (bytes) => {
      const out = [];
      if (!bytes) return out;
      for (let i = 0; i < bytes.length; i += 3)
        out.push(RGB([bytes[i] || 0, bytes[i + 1] || 0, bytes[i + 2] || 0], 0));
      return out;
    };
    const Pack = ({ pk, locked }) => {
      const grey = (n) => Array(n).fill("#3a4449");
      const N = pk ? cellsOf(pk.iv) : grey(4), C = pk ? cellsOf(pk.C) : grey(5), T = pk ? cellsOf(pk.tag) : grey(6);
      const x0 = 5, W = 50, g = 2.8, p = (W - 2 * g) / (N.length + C.length + T.length), bw = p * .74;
      const xN = x0, xC = xN + N.length * p + g, xT = xC + C.length * p + g;
      return (
        <svg className="tk-art tk-pack" viewBox="0 0 60 44" width="100%"
          preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <clipPath id="pk-clip"><rect x="2" y="7" width="56" height="30" rx="5" /></clipPath>
          </defs>
          <g clipPath="url(#pk-clip)">
            <rect x="2" y="7" width="56" height="30" fill="rgba(231,239,233,.045)" />
            <rect className="pk-tband" x={xT - g / 2} y="7" width={58 - xT + g / 2} height="30" />
            {N.map((c, i) => <rect key={"n" + i} className="pk-nc" x={xN + i * p} y="17" width={bw} height="10" rx=".9" fill={c} />)}
            {C.map((c, i) => <rect key={"c" + i} className="pk-b" x={xC + i * p} y="11" width={bw} height="22" rx=".9" fill={c} />)}
            {T.map((c, i) => <rect key={"t" + i} className="pk-tg" x={xT + i * p} y="11" width={bw} height="22" rx=".9" fill={c} />)}
            <path className="pk-seal" d={`M${xC - g / 2} 9 v26 M${xT - g / 2} 7 v30`} />
          </g>
          <rect className="tk-ln" x="2" y="7" width="56" height="30" rx="5" fill="none" />
          {locked && <rect className="pk-lock" x="2" y="7" width="56" height="30" rx="5" />}
        </svg>
      );
    };

    const Grab = ({ id, target, onDone, hint, children }) => {
      const { ref, live, over } = useDrag({ id, target, onDone });
      return (
        <div ref={ref} tabIndex={0} role="button" aria-label={hint}
          className={"grab" + (live ? " live" : "") + (over ? " over" : "")}>
          {children}
          <span className="grab-hint">{hint}</span>
        </div>
      );
    };


    /* ===================================== OBJECT CONTINUITY (FLIP) ==========
       A value keeps one identity for the whole film. When a frame places it
       somewhere else, it travels there from wherever it last was, rather than
       vanishing and being redrawn. That travel is what carries transfer and
       observation, so the captions no longer have to.

       The measurement has to be exact, which is why the camera CUTS: the stage
       columns change instantly on a frame change. If the columns eased instead,
       every rect below would be measured mid-transition and every object would
       fly to a place the layout was still on its way to. A cut is also what the
       brief asks for — "cut to Bob" — so the two agree. */
    const FLIPS = new Map();
    const flipReset = () => FLIPS.clear();
    const REDUCE = () => typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const Obj = ({ id, frame, cls, drop, style, children }) => {
      const ref = useRef(null);
      useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const now = el.getBoundingClientRect();
        /* an object measured while its side of the stage was hidden has no
           position; keeping that zero rect made it fly in from the page
           corner when the camera came back to it (pass 58) */
        if (now.width < 1) return;
        const was = FLIPS.get(id);
        FLIPS.set(id, now);
        if (!was || REDUCE()) return;
        /* a blend's sources start where the blend needs them: the blend
           itself is the only travel in that frame (pass 53). Without this,
           after a cut to Bob his private plate flew in from his thumbnail
           phone while the public colour was already falling onto it. */
        if (el.closest(".flm.fusing:not(.gcm)")) return;
        const dx = (was.left + was.width / 2) - (now.left + now.width / 2);
        const dy = (was.top + was.height / 2) - (now.top + now.height / 2);
        const s = Math.max(.25, Math.min(4, was.width / Math.max(1, now.width)));
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3 && Math.abs(s - 1) < .06) return;
        el.style.transition = "none";
        el.style.transform = "translate(" + dx + "px," + dy + "px) scale(" + s + ")";
        el.getBoundingClientRect();
        requestAnimationFrame(() => {
          if (!ref.current) return;
          ref.current.style.transition = "transform 900ms cubic-bezier(.35,0,.15,1)";
          ref.current.style.transform = "";
        });
      }, [frame]);
      return <div className={"flm-obj " + (cls || "")} data-obj={id} data-drop={drop || undefined}
        style={style} ref={ref}>{children}</div>;
    };

    /* the device, at the proportions this project has locked everywhere else */
    const Phone = ({ who, lit, drop, children }) => (
      <div className={"flm-ph flm-ph-" + who + (lit ? " lit" : "")} data-drop={drop || undefined}>
        <div className="flm-ph-body">
          <i className="flm-ph-island" aria-hidden="true" />
          <div className="flm-ph-scr">{children}</div>
        </div>
      </div>
    );

    /* ======================= DIRECTED DIALOGUE =============================
       An instruction that names an object should not leave the eye hunting for
       it. A leader line is drawn from the rail to the object the sentence is
       about, and the destination of the gesture is ringed, so the gesture is
       legible before the sentence has been read. Measured from the live
       layout, so it cannot drift from what it points at. */
    const Lead = ({ from, to, frame }) => {
      const [d, setD] = useState(null);
      useLayoutEffect(() => {
        const r = requestAnimationFrame(() => {
          const a = document.querySelector(from);
          const b = document.querySelector(to);
          const host = document.querySelector(".flm");
          if (!a || !b || !host) { setD(null); return; }
          const H = host.getBoundingClientRect();
          const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
          if (A.width < 2 || B.width < 2) { setD(null); return; }
          const x1 = A.left + A.width / 2 - H.left, y1 = A.top - H.top;
          const x2 = B.left + B.width / 2 - H.left, y2 = B.bottom - H.top;
          const my = (y1 + y2) / 2;
          setD({ path: `M${x2} ${y2} C ${x2} ${my}, ${x1} ${my}, ${x1} ${y1}`,
            w: H.width, h: H.height, tx: x2, ty: y2 });
        });
        return () => cancelAnimationFrame(r);
      }, [frame, from, to]);
      if (!d) return null;
      return (
        <svg className="flm-lead" width={d.w} height={d.h} aria-hidden="true">
          <path className="flm-lead-p" d={d.path} fill="none" />
          <circle className="flm-lead-o" cx={d.tx} cy={d.ty} r="4.5" />
        </svg>
      );
    };

    const Cinema = ({ kit, beat, pick, setPick, text, setText, onSend, onReplay, onAct,
                     pack, opened, inRef, busy, peeking, setPeeking,
                     tampered, onTamper, onAgain }) => {
      const F = FAT(beat);
      const s = kit ? kit.session : null;
      /* ON A PHONE THE ACTION LIVES AT THE THUMB (pass 54). Below 560px the
         film's controls leave the drawn phone for the action dock under the
         dialogue: a tray of 44pt swatches, a full-width Send, a message bar.
         Measured from the film's own width, so it follows the module, not
         the window. Each control is rendered once, in one place. */
      const rootRef = useRef(null);
      const [narrow, setNarrow] = useState(false);
      useLayoutEffect(() => {
        const el = rootRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => setNarrow(el.getBoundingClientRect().width < 560));
        ro.observe(el);
        setNarrow(el.getBoundingClientRect().width < 560);
        return () => ro.disconnect();
      }, []);
      /* EVE IS ON THE WIRE (pass 55). Wherever Alice and Bob's wire and Eve
         are both in the frame, a tap runs from Eve down to the middle of their
         wire and joins it there: what she copies, she copies from that line.
         Measured from the live layout, so it lands on the wire at every size. */
      const [tap, setTap] = useState(null);
      useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const measure = () => {
          const st = root.querySelector(".flm-stage"), tr = root.querySelector(".flm-lane-track"),
            face = root.querySelector(".flm-net .cin-face");
          const shown = (e) => e && e.getBoundingClientRect().width > 1 && getComputedStyle(e).display !== "none"
            && getComputedStyle(e.closest(".flm-net, .flm-lane") || e).display !== "none";
          if (!st || !shown(tr) || !shown(face)) { setTap(null); return; }
          const S = st.getBoundingClientRect(), T = tr.getBoundingClientRect(), E = face.getBoundingClientRect();
          const x = T.left + T.width / 2 - S.left, top = E.bottom - S.top - E.height * .12, y = T.top + T.height / 2 - S.top;
          setTap(y - top > 8 ? { x: Math.round(x), top: Math.round(top), h: Math.round(y - top) } : null);
          /* THE COPIES BRANCH OFF THE WIRE (pass 57). Each copy starts at the
             point where Eve's tap meets the wire and climbs the tap into her
             hands, so the copy is visibly taken from what is passing, while
             the original keeps going. Measured without the copy's own
             transform, so it lands on the junction at every size. */
          for (const c of root.querySelectorAll('.flm-net [data-obj="qa2"], .flm-net [data-obj="qb2"]')) {
            const R = c.getBoundingClientRect(), m = new DOMMatrixReadOnly(getComputedStyle(c).transform);
            const cx = R.left + R.width / 2 - m.m41 - S.left, cy = R.top + R.height / 2 - m.m42 - S.top;
            /* born side by side at the tap, each on its own side, so the
               two copies never read as one blob (pass 58) */
            const side = c.dataset.obj === "qa2" ? -.3 : .3;
            c.style.setProperty("--jx", Math.round(x - cx + side * R.width / (m.a || 1)) + "px");
            c.style.setProperty("--jy", Math.round(y - cy) + "px");
          }
        };
        const r1 = requestAnimationFrame(() => requestAnimationFrame(measure));
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
        if (ro) ro.observe(root);
        return () => { cancelAnimationFrame(r1); if (ro) ro.disconnect(); };
      }, [beat, narrow]);
      /* THE PUBLIC COLOUR IS YELLOW. Every blend below is computed from it,
         so changing this one value moves the whole analogy with it — the
         mixtures and the shared colour are means of their ingredients, never
         literals. */
      const base = "#E8C93A";
      const mine = (pick || SWATCHES[0]).toUpperCase();
      /* TWO LAYERS, ONE BRIDGE.
         Analogy layer — every colour is either the viewer's own choice, a
         deterministic mapping of real bytes, or a documented blend of those.
         Crypto layer — Z and K are shown from their real bytes, and only in
         the values panel.  No colour anywhere is invented to look good. */
      /* BOB CHOOSES, HE IS NOT ASSIGNED. His colour used to be the first three
         bytes of his private scalar mapped straight to RGB, which meant it
         could land on Alice's colour or on the public yellow and say something
         untrue. He now picks from the same palette she does — the choice is
         still his own private value doing the choosing (a byte of it indexes
         the tray), and the two colours he must not take are removed first. */
      const bobPool = SWATCHES.filter((c) => c.toUpperCase() !== mine
        && c.toUpperCase() !== base.toUpperCase());
      const bobIx = s && s.dLraw ? s.dLraw[0] % bobPool.length : 2 % bobPool.length;
      const bprivC = (bobPool[bobIx] || "#3a4449").toUpperCase();
      const qaC   = MIX(base, mine);                     /* documented blend   */
      const qbC   = MIX(base, bprivC);
      const sharedC = MIX(base, mine, bprivC);           /* the same three     */
      /* EVE'S GUESSES (4f). She holds the mixture and knows the public yellow;
         what she lacks is the private ingredient, and the only way at it is to
         guess. Each guess is a colour from real random bytes (the crypto
         layer's byte -> colour mapping, desaturated toward the room's grey),
         and any guess near Alice's colour, Bob's, either mixture or the accent
         is redrawn — so the attempt can never resolve into a private colour.
         In the protocol the guesses would be private scalars, about 2^256 of
         them; that is the size of the problem the flicker stands for. */
      const guesses = useMemo(() => {
        const near = (c) => { const p = HEX2RGB(c); return [mine, bprivC, MIX(base, mine), MIX(base, bprivC), "#83E3A9"]
          .some((x) => { const q = HEX2RGB(x); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 72; }); };
        const out = [], buf = new Uint8Array(3);
        for (let n = 0; out.length < 24 && n < 4000; n++) {
          crypto.getRandomValues(buf);
          const c = "#" + [...buf].map((v) => Math.round(v * .55 + 0x5a * .45).toString(16).padStart(2, "0")).join("").toUpperCase();
          if (!near(c)) out.push(c);
        }
        return out;
      }, [mine, bprivC]);
      const zC    = s ? RGB(s.Z, 0)   : "#3a4449";       /* real Z, panel only */
      const kC    = s ? RGB(s.K, 0)   : "#3a4449";       /* real K             */
      const nonC  = pack ? RGB(pack.iv, 0) : "#3a4449";
      const cbytes = [];
      if (pack) for (let i = 0; i + 2 < pack.C.length && cbytes.length < 6; i += 3)
        cbytes.push(RGB(pack.C, i));

      /* -------- the cast. role decides the shape, bytes decide the colour -- */
      /* THE SAME OBJECTS, AS NUMBERS. On the beats after the paint is put
         away (storyboard 6b, 7a) every analogy object keeps its id, its owner
         and its place, and carries the symbol it stood for on a neutral plate
         instead of a colour: d stays in the slot, Q travels, Z is made. */
      const N = F.sym ? "#1d2629" : null;
      const CAST = {
        base: (d) => <Tok role="public" hex={base} dock={d} label="the public colour"
                       note="" />,
        pa:   (d) => N ? <Tok role="private" hex={N} sym="d_A" dock={d} label="your private number" /> : <Tok role="private" hex={pick ? mine : null} masked={!pick} dock={d}
                       label={pick ? "your private colour" : "your private colour — not chosen yet"}
                       note="" />,
        pb:   (d) => N ? <Tok role="private" hex={N} sym="d_B" dock={d} label="Bob’s private number" /> : <Tok role="private" hex={bprivC} dock={d} label="Bob’s private colour"
                       note="" />,
        qa:   (d) => N ? <Tok role="public" hex={N} sym="Q_A" dock={d} label="your public value" /> : <Tok role="public" hex={qaC} dock={d} label="your mixture"
                       note="" />,
        qb:   (d) => N ? <Tok role="public" hex={N} sym="Q_B" dock={d} label="Bob’s public value" /> : <Tok role="public" hex={qbC} dock={d} label="Bob’s mixture"
                       note="" />,
        qa2:  (d) => <Tok role="public" hex={N || qaC} sym={N ? "Q_A" : null} dock={d} label={N ? "Q_A, copied" : "Alice’s mixture, copied"} />,
        qb2:  (d) => <Tok role="public" hex={N || qbC} sym={N ? "Q_B" : null} dock={d} label={N ? "Q_B, copied" : "Bob’s mixture, copied"} />,
        /* AT THE MORPH THE PLATE STOPS BEING PAINT. It keeps its place, its
           size and its position — the same object — while the colour drains
           out of it and the number the browser actually computed appears on
           its face. That is the whole transition, in one object, with no
           mapping legend and no second diagram. */
        sa:   (d) => N ? <Tok role="secret" hex={N} sym="Z" dock={d} label="the shared secret" /> : <Tok role="secret" hex={sharedC} dock={d} masked={!F.rev && !d && !F.fuse}
                       digits={F.toMath && s ? BYTES(s.Z, 3) : null}
                       label={F.toMath ? "the shared secret" : "the final colour"} note="" />,
        sb:   (d) => N ? <Tok role="secret" hex={N} sym="Z" dock={d} label="the same Z" /> : <Tok role="secret" hex={sharedC} dock={d} masked={!F.rev && !d && !F.fuse}
                       digits={F.toMath && s ? BYTES(s.Z, 3) : null}
                       label={F.toMath ? "the same number" : "the final colour"} note="" />,
        ka:   (d) => <Tok role="key" hex={kC} dock={d} label="K · key material"
                       note="" />,
        kb:   (d) => <Tok role="key" hex={kC} dock={d} label="the same K"
                       note="" />,
        non:  (d) => <Tok role="nonce" hex={nonC} dock={d} label="nonce"
                       note="" />,
        /* docked, the message is its card icon rather than its text: a
           truncated sentence on a shelf reads as a rendering fault, and the
           shelf's job is to say "this is still here", not to be readable */
        msg:  (d) => d
          ? <Tok role="message" dock label="your message" />
          : (
          <div className="tk tk-message">
            <div className="tk-box tk-note"><b>{text || "—"}</b></div>
            <span className="tk-l">your message</span>
          </div>
        ),
        ct:   (d) => <Tok role="cipher" bytes={cbytes} dock={d} label="ciphertext"
                       note={d ? "" : "display mapping"} />,
        seal: (d) => <Tok role="seal" dock={d} label="authentication tag"
                       note={d ? "" : "16 bytes"} />,
        pkt:  (d) => (
          <div className={"tk tk-payload" + (d ? " tk-dock-on" : "") + (F.sink ? " sink" : "")}>
            <div className="tk-box"><Pack pk={pack} /></div>
            {!d && <span className="tk-l">nonce · ciphertext · tag</span>}
          </div>
        ),
        pkt2: (d) => (
          <div className={"tk tk-payload tk-locked" + (d ? " tk-dock-on" : "")}>
            <div className="tk-box"><Pack pk={pack} locked /></div>
            {!d && <span className="tk-l">copied</span>}
          </div>
        ),
        vfy:  (d) => <Tok role="seal" dock={d} state={opened ? (opened.ok ? "ok" : "bad") : ""}
                       label={opened ? (opened.ok ? "verified" : "not verified") : "checking"} />,
        plain: (d) => (opened && opened.ok
          ? (d ? <Tok role="message" dock label="accepted" />
            : <div className="tk tk-message out">
                <div className="tk-box tk-note"><b className="cin-plain">{opened.text}</b></div>
                <span className="tk-l">accepted</span>
              </div>)
          : null),
      };
      /* the colour a draggable swatch pulses in: its own */
      const OWN = { base, pa: mine, pb: bprivC, qa: qaC, qb: qbC };
      const IDS = ["base","pa","pb","qa","qb","qa2","qb2","sa","sb","ka","kb",
                   "non","msg","ct","seal","pkt","pkt2","vfy","plain"];
      const bin = { a: [], b: [], lane: [], eve: [] };
      const dock = { a: [], b: [], e: [] };
      const placed = new Set();
      for (const id of IDS) {
        const w = F.at[id];
        if (!w || !bin[w]) continue;
        let node = CAST[id](false);
        if (!node) continue;
        /* A PRIVATE VALUE LIVES IN A SLOT. The brief asks the chosen colour to
           move into a persistent, labelled place rather than float in the
           frame — so the slot is real furniture on the phone, with a lock and
           a line saying what it is for, and the private token is always drawn
           inside it. Nothing else on either phone gets this frame, which is
           what makes "this one never travels" legible without a caption. */
        if (id === "pa" || id === "pb")
          node = (
            <div className={"flm-vault" + (id === "pa" ? " mine" : "")}>
              {/* the slot is the rail under the colour and the caption under
                  that; the padlock header said it a third time (pass 52) */}
              {node}
            </div>
          );
        if (F.unmix && id === "qa2")
          node = (<>
            {node}
            <span className="flm-unmix" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <i key={i} style={{ "--a0": (i - 3.5) * 13 + "deg", "--i": i, "--k0": i % 2 ? 1.5 : 1, "--s": i % 2 ? 1 : -1, "--d": i * 70 + "ms",
                  "--c1": guesses[i * 3] || "#3a4449", "--c2": guesses[i * 3 + 1] || "#3a4449", "--c3": guesses[i * 3 + 2] || "#3a4449" }} />
              ))}
            </span>
          </>);
        placed.add(id);
        const cls = (F.copy === id ? "is-copy " : "") + (F.land && w === F.land ? "is-land " : "")
          + (F.born === id ? "is-born " : "") + (F.moved === id ? "is-moved " : "")
          /* a combined result is revealed in colour, then covered until both
             sides have one (storyboard 5c/5e → 5f) */
          + (F.fuse && !F.rev && (id === "sa" || id === "sb") ? "covers-late " : "");
        /* ONE DOMINANT OBJECT PER FRAME. A frame may show its inputs beside
           the thing it is about, but only one of them is the subject, and the
           lead is sized so the frame has an unmistakable centre. */
        const isLead = F.lead ? F.lead === id : Object.keys(F.at)[0] === id;
        const grabs = F.drag && F.drag.from === id;
        const drops = F.drag && F.drag.to === id;
        const wrapped = grabs
          ? <Grab id={id} target={F.drag.to} hint={F.grabHint} onDone={() => onAct(F.act)}>{node}</Grab>
          : node;
        bin[w].push(
          <Obj key={id} id={id} frame={beat}
            cls={cls + "is-focal " + (isLead ? "is-lead" : "is-input")
              + (grabs ? " is-grab" : "") + (drops ? " is-drop" : "")}
            drop={drops ? id : null}
            style={grabs ? { "--own": OWN[id] || "#e7efe9" } : undefined}>{wrapped}</Obj>);
      }
      /* ONE ORDER ON EVERY PHONE (pass 58). Once a mixture has arrived, the
         phone shows what came in on top and its own private colour below,
         the order the colour close-ups use; the wide shots listed them the
         other way round, so the private plate visibly swapped rows at 5a. */
      if (F.k === "xland" || F.k === "unmix") {
        const first = (list, id) => list.sort((x, y) => (y.key === id) - (x.key === id));
        first(bin.a, "qb"); first(bin.b, "qa");
      }
      /* PERSISTENCE. Everything already made stays on its owner's device,
         docked small. An object is never absent from the world once it exists. */
      /* a frame may declare itself bare: while the viewer is performing a
         transformation, nothing older is relevant and the screen is the
         action's. This is the same judgement as the phase scoping, one beat
         at a time. */
      /* A bare frame strips irrelevant history — but never the parents of the
         thing being born in it. Ancestry outranks tidiness: an object whose
         source has been swept off screen has no visible origin, which is the
         first fault this whole pass exists to fix. */
      const parents = [].concat(...Object.values(F.from || {}).filter(Array.isArray));
      const need = F.bare ? parents : RELEVANT[PHASE(beat)];
      for (const [side, ids] of Object.entries(HELD(beat)))
        for (const id of ids) {
          if (need.indexOf(id) < 0) continue;
          if (placed.has(id)) continue;
          const node = CAST[id](true);
          if (!node) continue;
          placed.add(id);
          dock[side].push(<Obj key={"d" + id} id={id} frame={beat} cls="is-docked">{node}</Obj>);
        }
      const lit = (who) => F.cam === "wide" || F.cam === who || F.cast
        || (F.cam === "both" && (who === "a" || who === "b"))
        /* the duel is Eve against Bob: both of them are the subject */
        || (F.cam === "duel" && (who === "eve" || who === "b"));
      const gate = !!F.act;
      /* NAMING ONLY HELPS WHILE THE NAMES DIFFER. Real byte-derived colours
         collide often enough that "drag Bob's blue mixture onto your blue
         swatch" is a sentence this build can produce — so when two names would
         match, the instruction falls back to naming them by role instead. */
      const say = (s) => {
        const nb = HUE_NAME(base), nm = HUE_NAME(mine), nq = HUE_NAME(qbC);
        const pair = (x, y) => x === y ? ["", ""] : [x + " ", y + " "];
        const [pb, pm1] = pair(nb, nm);
        const [pq, pm2] = pair(nq, nm);
        return (s || "")
          .replace("{BASE} ", pb).replace("{MINE} public", (pm1 || "") + "public")
          .replace("{QB} ", pq)
          .replace("{MINE} ", s.indexOf("{QB}") >= 0 ? (pm2 || "private ") : (pm1 || "private "))
          .replace("{BASE}", nb).replace("{MINE}", nm).replace("{QB}", nq)
          .replace("{QA}", HUE_NAME(qaC))
          /* a line that begins with a colour name still begins with a capital */
          .replace(/^\s*[a-z]/, (m) => m.toUpperCase());
      };

      /* THE BLEND IS A TRANSFORMATION, NOT A TOUCH (storyboard 3b/3d/5b/5d).
         The moving ingredient lands ON the private plate, the two converge for
         a second to one synchronised colour (--mixc), and only then is the
         result born at that same spot and allowed to settle into its place.
         The distances are measured, not guessed, so the ingredient lands on
         the plate on every screen size. */
      const mixc = F.fuse && !F.gcm
        ? (F.k === "mixAout" ? qaC : F.k === "mixB" ? qbC : sharedC) : null;
      useLayoutEffect(() => {
        if (!F.fuse || F.gcm) return;
        /* layout position of a plate inside the column, ignoring transforms:
           a FLIP from the previous frame may still be moving the private
           plate when this runs, and a transformed rect would aim at where it
           WAS, not where it is */
        const top = (el, root) => { let y = 0; for (let e = el; e && e !== root; e = e.offsetParent) y += e.offsetTop; return y; };
        for (const focal of document.querySelectorAll(".flm-slot.on .flm-ph-scr .flm-focal")) {
          const plate = focal.querySelector(".flm-obj .tk-private .tk-box");
          if (!plate) continue;
          const at = top(plate, focal);
          for (const o of focal.querySelectorAll(":scope > .flm-obj")) {
            if (o.querySelector(".tk-private")) continue;
            const box = o.querySelector(".tk-box");
            if (!box) continue;
            const d = at - top(box, focal);
            if (o.classList.contains("is-lead")) o.style.setProperty("--rise", d + "px");
            else o.style.setProperty("--fall", d + "px");
          }
        }
      }, [beat]);

      const Shelf = ({ items }) => items.length
        ? <div className="flm-shelf">{items}</div> : null;

      /* The row leaves once the choice is made (pass 53): the slot shows the
         decision, and a tray of five colours not taken would be history
         competing with it. */
      const controls = (<>
        {beat === "pickA" && (
          <div className="cin-pick">
            {SWATCHES.map((c) => (
              <button key={c} className={"cin-sw" + (pick && mine === c.toUpperCase() ? " on" : "")}
                style={{ background: c }} aria-label={"choose " + HUE_NAME(c)}
                onClick={() => { setPick(c); onAct("pick"); }} />
            ))}
          </div>
        )}
        {beat === "sendA" && (
          <button className="cin-go in-ph tap-send" onClick={() => onAct("send")}>
            {narrow ? "Send to Bob →" : "Send →"}
          </button>
        )}
        {beat === "type" && (
          <div className="flm-compose">
            <input className="cin-in" ref={inRef} value={text} placeholder="Message Bob…"
              disabled={busy} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onAct("type"); }} />
            <button className="cin-go in-ph tap-send" onClick={() => onAct("type")}
              disabled={!text.trim() || busy}>Send →</button>
          </div>
        )}
      </>);
      const peekBtn = F.peek && (
        <button className="flm-peek" onClick={() => setPeeking(true)}>
          What Eve has
        </button>
      );

      return (
        <div ref={rootRef} className={"flm cam-" + F.cam + " f-" + F.k + (gate ? " turn" : "") + (narrow ? " is-narrow" : "")
              + (tampered ? " tampered" : "")
              + (F.act === "pick" || F.act === "type" ? " solo" : "")
              + (F.journey ? " journey j-" + F.journey : "")
              + (F.morph ? " morphing" : "") + (F.gcm ? " gcm" : "")
              + (F.verify ? " verifying" : "") + (F.payoff ? " payoff" : "")
              + (F.converge ? " converge" : "") + (F.eveShort ? " eve-short" : "")
              + (F.chain ? " chain" : "")
              + (F.arrive ? " arriving" : "")
              + (F.back ? " back" : "")
              + (F.watched ? " watched" : "") + (F.claim ? " claiming" : "")
              + (F.empty ? " empty-" + F.empty : "") + (F.fuse ? " fusing" : "")
              + (F.toMath ? " toMath" : "") + (F.open ? " wide-open" : "")
              + (WORK.has(F.k) ? " working" : "") + (F.cast ? " cast" : "")
              + (F.xchg ? " xchg" : "") + (F.eveIn ? " eve-in" : "")
              + (F.bridge ? " bridging" : "") + (F.sym ? " sym" : "")}
          data-frame={F.k} data-act={F.act || ""} data-arc={F.arc || ""}
          style={mixc ? { "--mixc": mixc } : undefined}>
          {/* THE PHASE CUE. A viewer who lands on a frame cold needs to know
              which of the three questions the film is answering. It is one
              line of small caps with three ticks, carries no box, no colour
              and no glow, and is the quietest thing on the stage. */}
          {/* always rendered, so the stage keeps its grid row whether or not
              the cue has anything to say */}
          <div className="flm-arc" aria-label={"part " + (ARCS.indexOf(F.arc) + 1) + " of 3"}>
            {ARCS.map((a) => (
              <span key={a} className={"flm-arc-i" + (a === F.arc ? " on" : "")}>
                <i aria-hidden="true" />
                {a === F.arc && <b>{ARCNAME[a]}</b>}
              </span>
            ))}
          </div>
          <div className="flm-stage">
            {tap && <i className="flm-tap" aria-hidden="true"
              style={{ left: tap.x + "px", top: tap.top + "px", height: tap.h + "px" }} />}
            {/* the middle of a blend needs no caption (pass 53): the two
                plates converging on one footprint is the evidence */}

            {/* each figure is one staged unit (pass 56): chair behind, the
                sprite, the table in front — see "CAFÉ STAGING" in styles.css */}
            <div className={"flm-slot flm-a" + (lit("a") ? " on" : " off")}>
              <span className="cin-face" aria-hidden="true"><i className="cu-chair" /><img src={SPRITE.you} alt="" /><i className="cu-table" /></span>
              <span className="cin-who">Alice <i className="sur-me">you</i></span>
              <Phone who="a" lit={lit("a")} drop={(F.drag && F.drag.to === "phoneA") || beat === "pickA" ? "phoneA" : null}>
                {F.drag && F.drag.to === "openA" && (
                  <span className="flm-open is-drop" data-drop="openA" aria-hidden="true" />
                )}
                <div className="flm-focal">{bin.a}</div>
                {F.drag && F.drag.to === "slot" && (
                  <div className="flm-slot-x is-drop" data-drop="slot">
                    <span className="flm-slot-k">{beat === "hkdf" ? "HKDF" : "AES\u2011GCM"}</span>
                    <svg viewBox="0 0 60 18" className="flm-slot-a" aria-hidden="true">
                      <path d="M6 9 h40 M40 4 l6 5 l-6 5" fill="none" strokeWidth="2.2" />
                    </svg>
                  </div>
                )}

                {/* THE PICKER IS THE APP. Six large swatches on Alice’s own screen,
                    chosen with a tap. A separate tray under the phone could not
                    coexist with a phone this size, and a tap is the plainer gesture
                    for "choose" in any case. */}
                {!narrow && controls}
                <Shelf items={dock.a} />
              </Phone>
            </div>

            {/* EVE IS A PERSON, NOT A PANEL. She used to sit inside a purple
                box with its own border, glow and scanlines — a second visual
                system arriving for one character, and in the travel shots the
                biggest shape on the stage. She is now what Alice and Bob are:
                a face, a name, and the objects she holds, on the same stage,
                with the wire running under her. */}
            <div className={"flm-slot flm-net" + (lit("eve") ? " on" : " off")}>
              <span className="cin-face" aria-hidden="true"><img src={SPRITE.atk} alt="" /><i className="cu-table" /></span>
              <span className="cin-who evil">Eve</span>
              <div className="flm-eve">
                <div className="flm-focal flm-hold">{bin.eve}</div>
                {F.noK && <span className="flm-nokey" aria-label="Eve cannot read it" />}
                <Shelf items={dock.e} />
              </div>
              {!narrow && peekBtn}
            </div>

            <div className={"flm-slot flm-b" + (lit("b") ? " on" : " off")}>
              <span className="cin-face" aria-hidden="true"><i className="cu-chair" /><img src={SPRITE.fr} alt="" /><i className="cu-table" /></span>
              <span className="cin-who">Bob</span>
              <Phone who="b" lit={lit("b")}>
                {(F.verify || F.opened) && (
                  <span className="flm-seal-cue"><Tok role="seal"
                    state={opened ? (opened.ok ? "ok" : "bad") : ""} /></span>
                )}
                <div className="flm-focal">{bin.b}</div>
                {/* BOB SENDS HIS OWN. Alice's tap sends Alice's mixture; a
                    moment later Bob presses Send on his phone and his leaves
                    from his side. Not a control: it is Bob's action, drawn. */}
                {F.bobSends && <span className="flm-bsend" aria-hidden="true">Send</span>}
                {beat === "pickB" && (
                  /* the same tray Alice used, with his choice resolving out of
                     it — so "Bob keeps one too" is a thing the viewer watches
                     happen rather than a colour that was already there */
                  <div className="cin-pick done bob">
                    {bobPool.map((c) => (
                      <span key={c} className={"cin-sw" + (bprivC === c.toUpperCase() ? " on" : "")}
                        style={{ background: c }} aria-hidden="true" />
                    ))}
                  </div>
                )}
                <Shelf items={dock.b} />
              </Phone>
            </div>

            <div className={"flm-lane" + (bin.lane.length ? " live" : "") + (F.lane ? " at-" + F.lane : "")
                  + (F.drag && F.drag.to === "lane" ? " is-drop" : "")}
              data-drop={F.drag && F.drag.to === "lane" ? "lane" : undefined}>
              <span className="flm-lane-track" aria-hidden="true" />
              <div className="flm-focal">{bin.lane}</div>
            </div>
            {/* STORYBOARD 6a — THE METAPHOR IS RESET. Each colour the viewer
                used turns into the symbol it stood for, between the two dimmed
                phones. Positioned over the stage, so nothing else moves. */}
            {F.bridge && (
              <div className="flm-xmap">
                {[[base, "G", "the public starting point"], [mine, "d", "a private number, one each"],
                  [qaC, "Q", "a public value: Q = d·G"], [sharedC, "Z", "the shared secret"]].map(([c, sym, t], i) => (
                  <div className="flm-xmap-r" key={sym} style={{ animationDelay: (400 + i * 650) + "ms" }}>
                    <i className="flm-xmap-c" style={{ background: c }} />
                    <b className="flm-xmap-a" aria-hidden="true">→</b>
                    <span className="flm-xmap-s">{sym}</span>
                    <span className="flm-xmap-t">{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* NO CONNECTORS (pass 52). A line from the words to the object made
              the film read as a diagram. Proximity, scale and the object's own
              motion say which thing the line is about. */}

          {/* THE DIALOGUE RAIL. It used to be a fixed footer, which made the eye
              travel from the object to the bottom of the viewport and back on
              every beat. It now settles under whoever is acting: Alice's
              column, Bob's, the lane, or centred under the pair. It does two
              jobs and no others — say exactly what to do, or say what the
              motion means. */}
          <div className={"flm-rail rail-" + F.cam + (gate ? " is-turn" : "")}
            key={beat} role="status">
            {gate && <span className="flm-turn rail-turn">YOUR TURN</span>}
            <p className="flm-rail-t">{beat === "type"
              ? (text.trim() ? "Tap Send to send your message to Bob" : "Type a message for Bob")
              : say(F.say)}</p>
            {!gate && F.sub && <p className="flm-rail-s">{F.sub}</p>}
            {/* THE FORMULA ARRIVES WITH ITS PICTURE. It is shown only on the
                beat whose visual relationship it describes, in the same
                container as the line that names it, and it never sits on top
                of the action. */}
            {F.math && <p className="flm-rail-m">{F.math}</p>}
            {narrow && <div className="flm-act">{controls}{peekBtn}</div>}
          </div>

          {F.chain && (
            <div className="flm-chain">
              <Tok role="secret" hex={sharedC} label="same secret" />
              <b>→</b>
              <Tok role="key" hex={kC} label="one key" />
              <b>→</b>
              <div className="tk tk-payload">
                <div className="tk-box"><Pack pk={pack} /></div>
                <span className="tk-l">protected</span>
              </div>
              <b>→</b>
              <div className="tk tk-message">
                <div className="tk-box tk-note"><b>{(opened && opened.text) || text || "—"}</b></div>
                <span className="tk-l">Bob reads it</span>
              </div>
            </div>
          )}
          {F.recap && (
            <div className="flm-recap">
              <div className="flm-recap-row">
                <Tok role="secret" hex={sharedC} label="same secret" />
                <b>→</b>
                <Tok role="key" hex={kC} label="same key" />
                <b>→</b>
                <div className="tk tk-payload">
                  <div className="tk-box"><Pack pk={pack} /></div>
                  <span className="tk-l">protected message</span>
                </div>
              </div>
            </div>
          )}
          {/* THE BRIDGE. Said once, between the analogy and the real thing,
              and never replayed as a second story. */}
          {F.bridge && (
            <div className="flm-bridge">
              <div className="flm-map">
                <span><i className="bm-sw" style={{ background: mine }} /> private colour</span>
                <b>→</b><span>private value</span>
              </div>
              <div className="flm-map">
                <span><i className="bm-sw" style={{ background: qaC }} /> mixture</span>
                <b>→</b><span>public value</span>
              </div>
              <div className="flm-map">
                <span><i className="bm-sw" style={{ background: sharedC }} /> final colour</span>
                <b>→</b><span>shared secret</span>
              </div>
            </div>
          )}
          {F.eq && (
            <div className="cin-real late"><Eq parts={F.eq} note={F.eqn} /></div>
          )}

          {(F.bridge || F.data || F.payoff) && (
            <div className="cin-ctl-aux">
              <button className="flm-more" onClick={() => setPeeking("values")}>
                {F.data ? "See the data" : "See the actual values"}
              </button>
            </div>
          )}

          <div className="cin-ctl">
            {/* no button for a teaching moment: the object is the control */}
            {/* the experiments are offered only once the story has worked, so
                the successful path is the one the viewer learns first */}
            {beat === "r3" && (
              <>
                <button className="cin-go alt" onClick={onTamper}>Try breaking it</button>
                <button className="cin-go alt" onClick={onAgain}>Send another message</button>
              </>
            )}
            {F.end && <button className="cin-go ghost" onClick={onReplay}>↺ Start over</button>}
          </div>

          {/* WHAT EVE ACTUALLY HAS, on demand and then gone again. Kept out of
              the permanent interface so the main story stays uncluttered. */}
          {peeking === "values" && (
            <div className="flm-peek-pane" role="dialog">
              <div className="flm-peek-in flm-vals">
                <span className="flm-peek-t">The actual cryptography, running underneath</span>
                <dl className="flm-dl">
                  <dt>Curve</dt><dd>NIST P‑256 (ECDH)</dd>
                  <dt>Alice’s private scalar</dt><dd>{s ? BYTES(s.dMraw, 6) : "—"}</dd>
                  <dt>Alice’s public point Qₐ</dt><dd>{s ? BYTES(s.Qm, 6) : "—"}</dd>
                  <dt>Bob’s public point Qʙ</dt><dd>{s ? BYTES(s.Ql, 6) : "—"}</dd>
                  <dt>Shared secret Z</dt><dd>{s ? BYTES(s.Z, 8) : "—"}</dd>
                  <dt>Key material K = HKDF(Z)</dt><dd>{s ? BYTES(s.K, 8) : "—"}</dd>
                  {pack && <><dt>Nonce (96‑bit, this message)</dt><dd>{HEX(pack.iv, 6)}</dd></>}
                  {pack && <><dt>Auth tag (128‑bit)</dt><dd>{HEX(pack.tag, 6)}</dd></>}
                  {pack && <><dt>Ciphertext</dt><dd>{HEX(pack.C, 8)}</dd></>}
                </dl>
                <span className="flm-peek-n">
                  The colours on screen are an analogy for mixing. These are the
                  values the browser actually computed. Blending colours is not
                  what P‑256 does, and the colour you picked is not a key.
                </span>
                <button className="cin-go" onClick={() => setPeeking(false)}>Back to the story</button>
              </div>
            </div>
          )}
          {peeking === true && (
            <div className="flm-peek-pane" role="dialog">
              <div className="flm-peek-in">
                <span className="flm-peek-t">Everything Eve holds, right now</span>
                <div className="flm-peek-row">
                  {(dock.e.length || bin.eve.length)
                    ? [...bin.eve, ...dock.e].map((n, i) =>
                        <div className="flm-peek-i" key={i}>{n}</div>)
                    : <span className="flm-peek-n">nothing yet</span>}
                </div>
                <span className="flm-peek-n">
                  Public values and protected payloads. No private value, and no K \u2014
                  so none of it decrypts.
                </span>
                <button className="cin-go" onClick={() => setPeeking(false)}>Back to the story</button>
              </div>
            </div>
          )}
        </div>
      );
    };

    const EcdhStage = ({ scene, beat, sess, rate, onReplay, setRate, onNext, pending }) => {
      const B = (x, n) => sess ? BYTES(x, n || 3) : "";
      /* every row is "has this happened yet", so nothing is ever taken away */
      const rowsFor = (side) => {
        const mine = side === "a";
        const out = [];
        if (scene.priv) out.push({ k: "d", kind: "priv", label: mine ? "dₐ private" : "dʙ private",
          v: B(mine ? sess && sess.dM : sess && sess.dL), on: beat === "setup" });
        if (mine ? scene.qa : scene.qb) out.push({ k: "Q", kind: "pub",
          label: mine ? "Qₐ public" : "Qʙ public",
          v: B(mine ? sess && sess.Qm : sess && sess.Ql),
          on: beat === (mine ? "qa" : "qb") });
        if (scene.landed) out.push({ k: "in", kind: "in",
          label: mine ? "Qʙ from Bob" : "Qₐ from Alice",
          v: B(mine ? sess && sess.Ql : sess && sess.Qm), on: false });
        if (mine ? scene.mixA : scene.mixB) out.push({ k: "Z", kind: "sec", label: "Z shared secret",
          v: B(mine ? sess && sess.Z : sess && sess.Zl),
          masked: !scene.same, on: beat === "reveal" || beat === (mine ? "mixA" : "mixB") });
        if (scene.key) out.push({ k: "K", kind: "key", label: "K key material",
          /* three bytes like every other row: four overran the screen and the
             tail of a key is exactly the thing that must not be cut */
          v: B(sess && sess.K, 3), on: beat === "rest" });
        return out;
      };
      const status = scene.key ? { on: true, t: "key ready" }
        : scene.same ? { on: true, t: "shared secret agreed" }
        : { on: false, t: "no shared key yet" };
      const band = scene.same
        ? "same value — never sent"
        : scene.swap ? "only the public values crossed"
        : "nothing has crossed yet";
      return React.createElement("div", { className: "ecs ecs-" + beat + (scene.on ? " on-" + scene.on : "") },
        pending && React.createElement("div", { className: "ecs-hold" },
          React.createElement("i", null, "waiting to send"),
          React.createElement("b", null, pending)),
        React.createElement("p", { className: "ecs-orient" },
          React.createElement("strong", null, "You are Alice."), " ",
          React.createElement("span", null, "Your phone and Bob’s work out a shared key. Eve is on the same Wi‑Fi.")),
        /* Eve sits over the channel, and what she captures stays with her */
        React.createElement("div", { className: "ecs-eve" + (scene.seen ? " has" : ""), "aria-hidden": "true" },
          React.createElement("img", { className: "ecs-face", src: SPRITE.atk, alt: "" }),
          React.createElement("span", { className: "ecs-who evil" }, "Eve"),
          React.createElement("span", { className: "ecs-note" },
            scene.seen ? "sees everything that crosses" : "on the same network, watching"),
          scene.seen && React.createElement("span", { className: "ecs-got" },
            React.createElement("span", { className: "ecs-got-k" }, "copied off the wire"),
            React.createElement("span", { className: "ecs-got-r" },
              React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "A"),
              React.createElement("span", { className: "ecs-got-v" }, B(sess && sess.Qm)),
              React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "B"),
              React.createElement("span", { className: "ecs-got-v" }, B(sess && sess.Ql))),
            React.createElement("span", { className: "ecs-lack" }, "no private value — so no Z"))),
        /* the tap: the line that makes the crossing and the watching one event */
        React.createElement("div", { className: "ecs-tap" + (scene.swap ? " on" : ""), "aria-hidden": "true" }),
        React.createElement("div", { className: "ecs-row" },
          React.createElement("div", { className: "ecs-side ecs-a" },
            React.createElement("img", { className: "ecs-face lit", src: SPRITE.you, alt: "" }),
            React.createElement("span", { className: "ecs-who" }, "Alice ",
              React.createElement("i", { className: "sur-me" }, "you")),
            React.createElement("span", { className: "ecs-role" },
              scene.key ? "holds K" : scene.same ? "has the shared secret"
                : scene.mixA ? "combining on her phone"
                : scene.swap ? "sent Qₐ, waiting" : scene.qa ? "built Qₐ" : "picked dₐ"),
            React.createElement(EcDev, { who: "A", rows: rowsFor("a"), status,
              lit: scene.on === "a" || scene.on === "both", arriving: beat === "mixA",
              deriving: beat === "qa", combining: beat === "mixA" })),
          React.createElement("div", { className: "ecs-lane" + (scene.swap ? " live" : ""), "aria-hidden": "true" },
            React.createElement("span", { className: "ecs-lane-k" },
              scene.swap ? "the café Wi‑Fi" : "nothing here yet")),
          React.createElement("div", { className: "ecs-side ecs-b" },
            React.createElement("img", { className: "ecs-face", src: SPRITE.fr, alt: "" }),
            React.createElement("span", { className: "ecs-who" }, "Bob"),
            React.createElement("span", { className: "ecs-role" },
              scene.key ? "holds the same K" : scene.same ? "has the same secret"
                : scene.mixB ? "combining on his phone"
                : scene.swap ? "sent Qʙ, waiting" : scene.qb ? "built Qʙ" : "picked dʙ"),
            React.createElement(EcDev, { who: "B", rows: rowsFor("b"), status,
              lit: scene.on === "b" || scene.on === "both", arriving: beat === "mixB",
              deriving: beat === "qb", combining: beat === "mixB" })),
          /* the two values in flight travel between the two devices, across
             the whole row, so they leave and arrive at a device rather than
             at a portrait or at the edge of a box */
          beat === "cross" && React.createElement("div", { className: "ecs-air", "aria-hidden": "true" },
            React.createElement("span", { className: "ecl ecl-a" },
              React.createElement("i", { className: "sv-own" }, "A"), "Q\u2090 ", B(sess && sess.Qm, 2)),
            React.createElement("span", { className: "ecl ecl-b" },
              React.createElement("i", { className: "sv-own" }, "B"), "Q\u0299 ", B(sess && sess.Ql, 2)))),
        React.createElement("div", { className: "ecs-eq", role: "figure", "aria-label": "Equation for this step" },
          React.createElement(Fxl, { parts: EQ8(beat) }),
          React.createElement("span", { className: "ecs-eq-n" + (scene.same ? " match" : ""), "data-band": band }, EQ8N(beat))),
        /* THE HANDOVER. The agreement ends by naming what the key is for and
           offering the one action that follows from it. Without this the two
           halves read as two demos that happen to share a screen. */
        React.createElement("div", { className: "ecs-band" + (scene.same ? " match" : "") },
          React.createElement("i", null), React.createElement("span", null, band), React.createElement("i", null)),
        React.createElement("div", { className: "play" + (scene.key ? " done" : ""), "aria-label": "Playback" },
          React.createElement("button", { className: "play-b", onClick: onReplay }, "↺ Replay"),
          /* THE HANDOVER. The agreement ends by naming what the key is for
             and offering the action that follows from it; without it the two
             halves read as two demos sharing a screen. It takes the pace
             control’s place, because once the sequence has ended there is
             nothing left to pace. */
          scene.key
            ? React.createElement("button", { className: "ecs-next", onClick: onNext },
                React.createElement("strong", null, "Encrypt and send it →"),
                React.createElement("span", null, "AES-GCM protects it with this K"))
            : React.createElement("span", { className: "play-r", role: "radiogroup", "aria-label": "Pace" },
                [[1, "Narrated", "Headline and supporting line"],
                 [2, "Headlines", "Headlines only, at reading speed"]].map(([r, label, hint]) =>
                  React.createElement("button", { key: r, role: "radio", "aria-checked": rate === r,
                    title: hint, className: "play-s" + (rate === r ? " on" : ""),
                    onClick: () => setRate(r) }, label)))));
    };
    /* the operation written out, one per beat, and never dimmed */
    const EQ8 = (b) => ({
      setup:  [["d", "A"], "   ", ["d", "B"]],
      qa:     [["Q", "A"], " = ", ["d", "A"], "G"],
      qb:     [["Q", "B"], " = ", ["d", "B"], "G"],
      cross:  [["Q", "A"], "  →  ←  ", ["Q", "B"]],
      mixA:   ["Z = ", ["d", "A"], ["Q", "B"]],
      mixB:   ["Z = ", ["d", "B"], ["Q", "A"]],
      reveal: ["Z = ", ["d", "A"], ["Q", "B"], " = ", ["d", "B"], ["Q", "A"]],
      rest:   ["K = HKDF(Z)"]
    })[b] || [""];
    const EQ8N = (b) => ({
      setup:  "one number each, chosen on the phone it stays on",
      qa:     "G is the starting point both sides share",
      qb:     "the same operation, on Bob’s phone",
      cross:  "these two, and nothing else, go on the network",
      mixA:   "her own private value, his public one",
      mixB:   "his own private value, her public one",
      reveal: "two separate calculations, one answer",
      rest:   "Z is a point on a curve; HKDF turns it into key bytes"
    })[b] || "";

    const KeyAgreement = ({ s, beat, quiet, onReplay, pending, onNext }) => {
      if (!s) return /* @__PURE__ */ React.createElement("section", { className: "pan pan-keys" }, /* @__PURE__ */ React.createElement("h3", { className: "pan-t" }, "Key agreement"), /* @__PURE__ */ React.createElement("p", { className: "pan-empty" }, "Establishing this session\u2026"));
      const Side = ({ tag, name, d, Q }) => /* @__PURE__ */ React.createElement("div", { className: "ka-side" }, /* @__PURE__ */ React.createElement("span", { className: "ka-who" }, name), /* @__PURE__ */ React.createElement("div", { className: "ka-cell" + (beat === "setup" ? " on" : "") }, /* @__PURE__ */ React.createElement("span", { className: "ka-k" }, "Private \xB7 stays on this device"), /* @__PURE__ */ React.createElement(Fx, null, "d", /* @__PURE__ */ React.createElement("sub", null, tag)), /* @__PURE__ */ React.createElement(Raw, null, BYTES(d, 6))), /* @__PURE__ */ React.createElement("div", { className: "ka-cell" + (upTo(beat, tag === "A" ? "qa" : "qb") ? " lit" : "") + (beat === (tag === "A" ? "qa" : "qb") ? " on" : "") }, /* @__PURE__ */ React.createElement("span", { className: "ka-k" }, "Public \xB7 safe to send"), /* @__PURE__ */ React.createElement(Fx, null, "Q", /* @__PURE__ */ React.createElement("sub", null, tag), " = d", /* @__PURE__ */ React.createElement("sub", null, tag), "G"), /* @__PURE__ */ React.createElement(Raw, null, upTo(beat, tag === "A" ? "qa" : "qb") ? BYTES(Q, 6) : "\u2014")));
      return /* @__PURE__ */ React.createElement("section", { className: "pan pan-keys kb-" + beat + (quiet ? " quiet" : "") }, /* @__PURE__ */ React.createElement("h3", { className: "pan-t" }, "Key agreement \xB7 this session"), /* The wide composition had no point-of-view cue in this mode at all: the    line lives in the phone scene, and the phone scene is hidden here, so it    measured zero by zero. It belongs to the panel that is doing the    talking. */ /* @__PURE__ */ pending && /* @__PURE__ */ React.createElement("div", { className: "ka-hold" }, /* @__PURE__ */ React.createElement("i", null, "waiting to send"), /* @__PURE__ */ React.createElement("b", null, pending)), /* @__PURE__ */ React.createElement("p", { className: "ka-orient" }, /* @__PURE__ */ React.createElement("strong", null, "You are Alice."), " ", /* @__PURE__ */ React.createElement("span", null, "Your phone and Bob\u2019s agree a key without ever sending it. Eve is on the same Wi\u2011Fi.")), /* @__PURE__ */ React.createElement("div", { className: "ka" }, /* @__PURE__ */ React.createElement("div", { className: "ka-pair" }, /* @__PURE__ */ React.createElement(Side, { tag: "A", name: "Alice", d: s.dM, Q: s.Qm }), /* @__PURE__ */ React.createElement("div", { className: "ka-cross" + (upTo(beat, "cross") ? " lit" : "") + (beat === "cross" ? " on" : "") }, /* @__PURE__ */ React.createElement("span", { className: "ka-arrow" }, "\u2192"), /* @__PURE__ */ React.createElement("span", { className: "ka-cross-k" }, "public keys cross"), /* @__PURE__ */ React.createElement("span", { className: "ka-arrow" }, "\u2190")), /* On the wide composition Eve had no statement during the agreement at    all \u2014 she was a small figure in a quiet map. She belongs on the lane    the values cross, saying what she gets and what she does not. */ /* @__PURE__ */ React.createElement("span", { className: "ka-eve" + (upTo(beat, "cross") ? " on" : "") }, /* @__PURE__ */ React.createElement("b", null, "Eve"), upTo(beat, "cross") ? " sees both public values \u2014 neither private one" : " is watching this Wi\u2011Fi"), /* @__PURE__ */ React.createElement(Side, { tag: "B", name: "Bob", d: s.dL, Q: s.Ql })), /* @__PURE__ */ React.createElement("div", { className: "ka-join" + (upTo(beat, "mixA") ? " lit" : "") + (["mixA", "mixB", "reveal"].includes(beat) ? " on" : "") }, /* @__PURE__ */ React.createElement(Fx, null, "Z = d", /* @__PURE__ */ React.createElement("sub", null, "A"), "Q", /* @__PURE__ */ React.createElement("sub", null, "B"), " = d", /* @__PURE__ */ React.createElement("sub", null, "B"), "Q", /* @__PURE__ */ React.createElement("sub", null, "A")), /* @__PURE__ */ React.createElement("div", { className: "ka-two" }, /* @__PURE__ */ React.createElement("span", { className: "ka-two-w" }, "Alice computes"), /* @__PURE__ */ React.createElement(Raw, null, upTo(beat, "reveal") ? BYTES(s.Z, 6) : "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "ka-two-w" }, "Bob computes"), /* @__PURE__ */ React.createElement(Raw, null, upTo(beat, "reveal") ? BYTES(s.Zl, 6) : "\u2014")), upTo(beat, "reveal") && s.zSame && /* @__PURE__ */ React.createElement("span", { className: "ka-same" }, "Same value. It never crossed the network.")), /* @__PURE__ */ React.createElement("div", { className: "ka-cell ka-out" + (upTo(beat, "rest") ? " lit" : "") + (beat === "rest" ? " on" : "") }, /* @__PURE__ */ React.createElement("span", { className: "ka-k" }, "Usable key material"), /* @__PURE__ */ React.createElement(Fx, null, "K = HKDF(Z)"), /* @__PURE__ */ React.createElement(Raw, null, upTo(beat, "rest") ? BYTES(s.K, 8) : "\u2014"), upTo(beat, "rest") && /* @__PURE__ */ React.createElement("span", { className: "ka-note" }, "This is the key AES-GCM uses on your message."))), /* @__PURE__ */ React.createElement("div", { className: "ka-end" }, onReplay && /* @__PURE__ */ React.createElement("button", { className: "ka-replay", onClick: onReplay }, "Replay the agreement"), onNext && upTo(beat, "rest") && /* @__PURE__ */ React.createElement("button", { className: "ka-next", onClick: onNext }, /* @__PURE__ */ React.createElement("strong", null, "Encrypt and send it \u2192"), /* @__PURE__ */ React.createElement("span", null, "AES-GCM protects your message with this K"))));
    };
    const Process = ({ stage, plain, ct, got, quiet, iv, live, pk, act }) => {
      const enc = stage === "encrypting", dec = stage === "decrypting";
      const busy = enc || dec;
      const waiting = !plain && stage === "idle";
      const on = (i) => act === i ? " on" : "";
      const done = stage === "done";
      return /* @__PURE__ */ React.createElement("section", { className: "pan pan-proc" + (quiet ? " quiet" : "") + (busy ? " live" : "") }, /* @__PURE__ */ React.createElement("h3", { className: "pan-t" }, "Inside the message", live ? /* @__PURE__ */ React.createElement("em", null, " \xB7 live") : null), waiting ? /* @__PURE__ */ React.createElement("p", { className: "pan-empty" }, "Type a message. The algorithm runs as you type.") : /* @__PURE__ */ React.createElement("div", { className: "pipe" }, /* @__PURE__ */ React.createElement("div", { className: "st" + on(0) }, /* @__PURE__ */ React.createElement("span", { className: "st-k" }, "Message"), /* @__PURE__ */ React.createElement("span", { className: "st-v" }, shorten(plain || "", 42) || "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "st-flow" + (busy || live ? " run" : "") }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "st" + on(1) }, /* @__PURE__ */ React.createElement("span", { className: "st-k" }, "Plaintext bytes ", /* @__PURE__ */ React.createElement(Fx, null, "P")), /* @__PURE__ */ React.createElement(Raw, null, pk ? BYTES(pk.P, 12) : "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "st-flow" + (busy || live ? " run" : "") }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "st st-fx" + on(2) }, /* @__PURE__ */ React.createElement(Fx, null, "S = AES", /* @__PURE__ */ React.createElement("sub", null, "K"), "(IV \u2016 counter)"), /* @__PURE__ */ React.createElement(Raw, null, pk ? BYTES(pk.S, 12) : "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "st-sub" }, "IV ", /* @__PURE__ */ React.createElement(Raw, null, iv || "\u2014"), " \xB7 new for every message")), /* @__PURE__ */ React.createElement("div", { className: "st-flow" + (busy || live ? " run" : "") }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "st st-fx st-xor" + on(3) }, /* @__PURE__ */ React.createElement(Fx, null, dec || done ? /* @__PURE__ */ React.createElement(React.Fragment, null, "P = C \u2295 S") : /* @__PURE__ */ React.createElement(React.Fragment, null, "C = P \u2295 S")), pk ? /* @__PURE__ */ React.createElement("span", { className: "xr" }, /* @__PURE__ */ React.createElement(Raw, null, BYTES(dec || done ? pk.C : pk.P, 6)), /* @__PURE__ */ React.createElement("b", null, "\u2295"), /* @__PURE__ */ React.createElement(Raw, null, BYTES(pk.S, 6)), /* @__PURE__ */ React.createElement("b", null, "="), /* @__PURE__ */ React.createElement(Raw, null, BYTES(dec || done ? pk.P : pk.C, 6))) : /* @__PURE__ */ React.createElement(Raw, null, "\u2014")), /* @__PURE__ */ React.createElement("div", { className: "st-flow" + (busy || live ? " run" : "") }, /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null), /* @__PURE__ */ React.createElement("i", null)), /* @__PURE__ */ React.createElement("div", { className: "st st-out" + (busy || live ? " lit" : "") }, /* @__PURE__ */ React.createElement("span", { className: "st-k" }, done ? "Readable again" : /* @__PURE__ */ React.createElement(React.Fragment, null, "Ciphertext ", /* @__PURE__ */ React.createElement(Fx, null, "C"))), done ? /* @__PURE__ */ React.createElement("span", { className: "st-v" }, shorten(got || "", 42)) : /* @__PURE__ */ React.createElement(Raw, null, pk ? BYTES(pk.C, 12) : shorten(ct || "", 30) || "\u2014"), !done && pk && /* @__PURE__ */ React.createElement("span", { className: "st-sub" }, "+ tag ", /* @__PURE__ */ React.createElement(Raw, null, BYTES(pk.tag, 4)), " \xB7 GCM also checks the data was not altered"))));
    };
    const STEP = {
      /* ---- AES-GCM, Live: the composer is the subject ---------------------- */
      ready: [
        "Type a message for Bob, then press Enter",
        "What you type is encrypted before it leaves.",
        "phone"
      ],
      /* true wherever it is read: on a desktop the formula panel is beside the
         phone, on a phone the encrypted line sits inside it */
      typing: [
        "Press Enter to send it",
        "Your phone will need a shared key with Bob first.",
        "phone"
      ],
      /* ---- AES-GCM, Network: same instruction, different subject ------------ */
      /* the zone is which surface is speaking. At rest that is the phone in
         both views now, because the phone is what the viewer is being asked
         to act on — pointing this line at the café map made the first frame
         read as a result rather than as a prompt. */
      netIdle: [
        "You are Alice. Send Bob a message.",
        "Type it and press Enter. Eve is watching.",
        "phone"
      ],
      netTyping: [
        "Press Enter to send it",
        "Nothing has left your phone yet.",
        "phone"
      ],
      /* ---- ECDH, Live: the key agreement, step by step ---------------------- */
      /* FLOW 1 — EXCHANGE. A name only arrives on the beat after the thing
         it names has been watched, so each of the two values gets a holding
         beat whose only job is to say what the viewer just saw. */
      /* ---- the colour film: one line per beat, said to the viewer --------- */
      /* the film's own lines live in FILM, one action and one takeaway to a
         frame, so a frame cannot exist without a caption or drift from it */
      /* ---- ECDH, Live: eight beats, said from Alice\u2019s side -------------- */
      e_setup    : ["First, a key. You and Bob each pick a number", "Yours is {dA}, and it stays on this phone.", "keys"],
      e_qa       : ["Your phone turns {dA} into {QA}", "Nothing turns {QA} back into {dA}.", "keys"],
      e_qb       : ["Bob\u2019s phone does the same", "{dB} becomes {QB}, on his phone.", "keys"],
      e_cross    : ["{QA} and {QB} cross the Wi-Fi", "Your private values stay where they are.", "keys"],
      e_mixA     : ["Your phone combines {dA} with Bob\u2019s {QB}", "The answer is not shown yet.", "keys"],
      e_mixB     : ["His phone combines {dB} with your {QA}", "Neither of you has sent an answer.", "keys"],
      e_reveal   : ["The same {Z}, both phones", "Neither of you sent it.", "big"],
      e_rest     : ["Both phones now hold the same {K}", "Now your message can be protected with it.", "keys"],
      /* ---- ECDH, Network: the same eight, from the room ------------------- */
      n_setup    : ["Two numbers, on two phones", "{dA} on hers, {dB} on his.", "cafe"],
      n_qa       : ["Alice\u2019s phone builds {QA}", "From {dA}, and only one way.", "cafe"],
      n_qb       : ["Bob\u2019s phone builds {QB}", "From {dB}, the same way.", "cafe"],
      n_cross    : ["{QA} and {QB} go on the network", "Eve copies both as they pass.", "cafe"],
      n_mixA     : ["Alice combines, on her phone", "{dA} with the {QB} that arrived.", "cafe"],
      n_mixB     : ["Bob combines, on his phone", "{dB} with the {QA} that arrived.", "cafe"],
      n_reveal   : ["The same {Z}, both phones", "Nothing carrying it crossed.", "big"],
      n_rest     : ["Both hold the same {K} = HKDF({Z})", "Eve holds {QA} and {QB}, and neither private value.", "cafe"],
      encrypting: ["AES-GCM is rewriting your message", "with the {K} you and Bob agreed on.", "proc"],
      handoff: ["Leaving your phone", "", "proc"],
      /* the crossing is 1750ms. Anything longer than a glance here is copy the
         viewer has to choose between reading and watching. */
      wire: ["Crossing to Bob", "", "cafe"],
      landed: [
        "Bob got it. Eve copied it.",
        "Only Bob has the key.",
        "big"
      ],
      toBob: ["Bob has the same {K} you do", "", "cafe"],
      decrypting: [
        "Bob runs the same keystream backwards",
        "Only you and Bob can make that {S}.",
        "proc"
      ],
      done: ["Bob read what you typed", "Eve has a copy she cannot open.", "phone"]
    };
    const Inspection = ({ kit, onFinish, tall }) => {
      const [text, setText] = useState("");
      const [stage, setStage] = useState("idle");
      const [pack, setPack] = useState(null);
      const [scram, setScram] = useState("");
      const [got, setGot] = useState("");
      const [err, setErr] = useState(null);
      const inRef = useRef(null);
      const [ready, setReady] = useState(false);
      const [live, setLive] = useState(null);
      useEffect(() => {
        if (!kit || !text || stage !== "idle") {
          if (!text) setLive(null);
          return;
        }
        let dead = false;
        const id = setTimeout(() => {
          kit.encrypt(text).then((p) => {
            if (!dead) setLive(p);
          }).catch(() => {
          });
        }, 60);
        return () => {
          dead = true;
          clearTimeout(id);
        };
      }, [text, kit, stage]);
      const side = ["toBob", "decrypting", "done"].includes(stage) ? "fr" : "you";
      const [mode, setMode] = useState("live");
      /* THE MODULE OPENS ON THE KEY AGREEMENT.
         It used to open on AES-GCM, which meant the first thing the viewer
         was asked to do was encrypt a message with a key whose origin the
         experience had not yet explained. The order is the argument: agree a
         key without sending it, then use it. */
      const [algo, setAlgo] = useState("aes");
      /* set once the agreement has actually run to its end. Until then the
         message half of the experience is not reachable \u2014 not hidden, but
         visibly waiting on something that has to happen first. */
      const [keyReady, setKeyReady] = useState(false);
      const [ebeat, setEbeat] = useState("setup");
      /* the one short statement between pressing Send and the key
         agreement starting: it is what turns the agreement from a lesson
         into the reason the send has not happened yet */
      const [bridge, setBridge] = useState(null);
      /* THE FILM. Thirty-four frames, one action each, held long enough to
         take in. `pickA` and `type` wait for the viewer; everything else
         plays on its own. */
      const [cbeat, setCbeat] = useState("you");
      /* the review label for the frame on screen; a split beat advances it
         on the same clock as its animation */
      const [refSub, setRefSub] = useState(null);
      const [refPin, setRefPin] = useState(null);
      useEffect(() => {
        setRefSub(null);
        const ts = (REF_SUB[cbeat] || []).map(([ms, l]) => setTimeout(() => setRefSub(l), ms));
        return () => ts.forEach(clearTimeout);
      }, [cbeat]);
      const refLabel = (refPin && refPin.beat === cbeat ? refPin.lab : null) || refSub || REF[cbeat] || null;
      /* hold a pinned label's picture: every animation in the film paused at
         the label's moment, re-applied briefly so late-starting ones (a FLIP,
         a connector) are caught too */
      useEffect(() => {
        if (!refPin || refPin.beat !== cbeat) return;
        const hold = () => {
          const root = document.querySelector(".flm");
          if (!root || !document.getAnimations) return;
          for (const a of document.getAnimations()) {
            const t = a.effect && a.effect.target;
            if (!t || !root.contains(t)) continue;
            a.pause();
            a.currentTime = refPin.ms;
          }
        };
        let r1 = 0, r2 = 0;
        r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(hold); });
        const ts = [250, 700, 1200].map((ms) => setTimeout(hold, ms));
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); ts.forEach(clearTimeout); };
      }, [refPin, cbeat]);
      const [pick, setPick] = useState(null);
      const [opened, setOpened] = useState(null);
      const [peeking, setPeeking] = useState(false);
      const [tampered, setTampered] = useState(false);
      const cRun = useRef(0);
      /* a harness holding a beat still must not be overtaken by the opening
         auto-play, which starts as soon as the session resolves */
      const cManual = useRef(false);
      const [rate, setRateState] = useState(1);
      const setRate = (r) => {
        rateRef.current = r;
        setRateState(r);
      };
      const [act, setAct] = useState(null);
      const eRun = useRef(0);
      /* ONE THING IS PRIMARY AT A TIME, AND WHICH ONE IS A FUNCTION OF THE
         STAGE, NOT OF THE VIEW SWITCH. Before this the Network view opened
         on the café map, so the first frame of a mode whose whole purpose
         is "type something" led with a diagram of a room. The switch now
         chooses which panel is available to look at; the stage chooses
         which region is lit.
           composing  → the phone, because that is the thing to act on
           encrypting → the breakdown, because that is what is happening
           in flight  → the network path
           opening    → the breakdown, run backwards
           delivered  → the phone, because the outcome is on it */
      const focus = algo === "ecdh"
        ? (mode === "live" ? "keys" : "cafe")
        : stage === "idle" ? "phone"
        : stage === "encrypting" ? "proc"
        : ["handoff", "wire", "landed"].includes(stage) ? "cafe"
        : ["toBob", "decrypting"].includes(stage) ? "proc"
        : "phone";
      const rateRef = useRef(1);
      const pause = (ms) => new Promise((r) => setTimeout(r, ms / rateRef.current));
      const step = async (name, ms) => {
        setStage(name);
        await pause(ms);
      };
      const scramble = async (src) => {
        const pool = "!#$%&*+/<>?@^~0123456789ABCDEFabcdef";
        for (let i = 1; i <= 6; i++) {
          setScram(src.split("").map((c) => c === "\n" ? "\n" : c === " " ? " " : Math.random() < i / 6 ? pool[Math.random() * pool.length | 0] : c).join(""));
          await pause(80);
        }
        setScram("");
      };
      const playEcdh = async () => {
        const run = ++eRun.current;
        /* Timing is derived from the copy, never hand-tuned, so a wording
           change can never leave a beat on screen for less time than its own
           words need. WPM 200 is a comfortable silent-reading pace; the extra
           beat is the time the motion needs to land before reading starts.
           dwell  = the 1x hold, sized for headline + supporting line.
           floor  = the incompressible hold, sized for the headline alone,
                    which is all that is shown above 1x. Speed compresses the
                    dwell; it can never compress the reading. */
        const READ = (t) => t.trim().split(/\s+/).length * 300 + 500;
        const budget = (b) => {
          const e = STEP["e_" + b] || [], n = STEP["n_" + b] || [];
          const head = Math.max(READ(e[0] || ""), READ(n[0] || ""));
          const full = Math.max(READ(((e[0] || "") + " " + (e[1] || "")).trim()),
                                READ(((n[0] || "") + " " + (n[1] || "")).trim()));
          return [full, head];
        };
        for (const b of EORD) {
          const [ms, floor] = budget(b);
          if (eRun.current !== run) return;
          setEbeat(b);
          /* reaching the last beat is what unlocks the message half: the key
             has to exist before anything can be protected with it */
          if (b === "rest") setKeyReady(true);
          /* pause() divides by the rate, so the floor is multiplied back up */
          await pause(Math.max(ms / rateRef.current, floor) * rateRef.current);
        }
      };
      const pickAlgo = (a) => {
        /* the agreement is not reachable before the story reaches it */
        if (a === "ecdh" && !keyReady) return;
        setAlgo(a);
        if (a === "ecdh") {
          setEbeat("setup");
          playEcdh();
        } else eRun.current++;
      };
      /* THE STORY IS ONE ACTION. The viewer types a message and presses Send;
         the key agreement is what the phones do in order to finish that send,
         and the message is still there when they come back to it. Nothing in
         here clears `text`. */
      /* THE PROJECTIONIST. The film runs itself between the viewer's beats and
         stops dead on each of the nine that belong to them. A frame with `act`
         waits; a frame with `wait` holds for that long; the last one stops.
         There is no `hold: 0` convention any more — a frame either asks the
         viewer for something or it doesn't, and the difference is visible in
         the data rather than encoded in a magic number. */
      const playFrom = async (start) => {
        const run = ++cRun.current;
        for (let i = Math.max(0, FKEY.indexOf(start)); i < FILM.length; i++) {
          const F = FILM[i];
          if (cRun.current !== run) return;
          setCbeat(F.k);
          if (F.act) return;                   /* the viewer's turn */
          if (F.end) return;
          if (F.k === "open") {
            /* GCM authenticates as it decrypts: a failed tag yields no
               plaintext at all, so there is nothing to withhold */
            const r = await kit.open(packRef.current);
            if (cRun.current !== run) return;
            setOpened(r);
            await pause(F.wait);
            if (!r.ok) { setCbeat("broke"); return; }
            continue;
          }
          await pause(F.wait || 2600);
        }
      };
      const packRef = useRef(null);
      /* every one of the nine viewer beats comes through here, so the rule
         "the film only moves when the viewer moves it" has one place to live */
      const onAct = async (what) => {
        const here = FKEY.indexOf(cbeat);
        if (here < 0) return;
        if (what === "type") {
          if (!text.trim()) return;
          /* the one encryption happens as the viewer finishes writing, so the
             protection beat that follows has a real packet to assemble */
          const p3 = await kit.encrypt(text);
          packRef.current = p3;
          setPack(p3);
          setOpened(null);
          playFrom(FKEY[here + 1]);
          return;
        }
        if (what === "protect") {
          /* ONE encryption, at the moment the viewer asks for protection */
          const p2 = await kit.encrypt(text);
          packRef.current = p2;
          setPack(p2);
          setOpened(null);
          playFrom(FKEY[here + 1]);
          return;
        }
        playFrom(FKEY[here + 1]);
      };
      const cinSend = () => onAct("protect");
      /* the film starts itself once there is a session to draw from */
      useEffect(() => {
        if (!kit) return;
        const t = setTimeout(() => { if (!cManual.current) playFrom("you"); }, 400);
        return () => clearTimeout(t);
      }, [kit]);
      useEffect(() => {
        /* the slot stays empty until the viewer chooses: a pre-filled
           swatch made the one real decision in the film look already made */
      }, [cbeat]);
      const cinReplay = () => {
        /* a replay is a new film: the objects have no history to fly from */
        flipReset();
        setPack(null); setOpened(null); packRef.current = null;
        setText(""); setPick(null); setTampered(false);
        setCbeat("you"); playFrom("you");
      };
      /* ------------------------------------------------ the epilogue ------
         Two optional experiments, offered only after the story has succeeded,
         so the successful path is what the viewer learns first.

         TRY BREAKING IT flips one bit of one real ciphertext byte and sends
         the altered payload on. The tag check then fails for the real reason,
         and no trusted plaintext is shown, because there is none to show.

         SEND ANOTHER reuses the same K and mints a fresh nonce, so the viewer
         can see that a session key persists while the per-message nonce does
         not. */
      const cinTamper = async () => {
        const p0 = packRef.current;
        if (!p0) return;
        const bytes = new Uint8Array(p0.buf.slice(0));
        bytes[0] ^= 0x01;                      /* one bit of one byte */
        const bad = { ...p0, buf: bytes.buffer,
          C: bytes.slice(0, p0.C.length), tag: bytes.slice(p0.C.length) };
        packRef.current = bad;
        setPack(bad);
        setTampered(true);
        setOpened(null);
        flipReset();
        setCbeat("tamper");
        await pause(3200);
        setCbeat("wire");
        await pause(2600);
        setCbeat("absorb");
        await pause(2200);
        setCbeat("verify");
        const r = await kit.open(bad);
        setOpened(r);
        await pause(3600);
        setCbeat("broke");
      };
      const cinAgain = async () => {
        if (!kit) return;
        setTampered(false);
        setOpened(null);
        flipReset();
        setText("");
        setCbeat("type");
      };

      const send = async () => {
        if (!text.trim() || stage !== "idle") return;
        if (!keyReady) {
          setBridge("hold");
          await pause(2100);
          setBridge(null);
          setAlgo("ecdh");
          setEbeat("setup");
          setMode("live");
          playEcdh();
          return;
        }
        try {
          setMode("net");
          setAlgo("aes");
          eRun.current++;
          setReady(true);
          setStage("encrypting");
          const p = live || await kit.encrypt(text);
          setPack(p);
          for (let i = 0; i < 4; i++) {
            setAct(i);
            await pause(620);
          }
          setAct(null);
          await pause(380);
          /* The crossing used to take three and a half seconds and read as a
             caption sliding along a rule. It is 1750ms now, which is the
             length of the motion itself: the stage ends the instant the
             payload finishes being pulled into Bob's device, so there is no
             held frame between the arrival and the beat that explains it. */
          await step("handoff", 1000);
          await step("wire", 1750);
          await step("landed", 2400);
          await step("toBob", 1000);
          setStage("decrypting");
          setAct(3);
          await pause(1400);
          setAct(null);
          setGot(await kit.decrypt(p));
          setStage("done");
        } catch (e) {
          setErr(String(e && e.message || e));
        }
      };
      const again = () => {
        setStage("idle");
        setPack(null);
        setGot("");
        setText("");
        setErr(null);
        setLive(null);
        setMode("live");
        setAct(null);
      };
      useEffect(() => {
        const el = inRef.current;
        if (!el) return;
        const fit = () => {
          el.style.height = "auto";
          el.style.height = (el.value ? Math.min(el.scrollHeight, 110) : 0) + "px";
          el.placeholder = el.clientWidth < 150 ? "Message\u2026" : el.clientWidth < 215 ? "Private message\u2026" : "Type a private message\u2026";
        };
        fit();
        window.addEventListener("resize", fit);
        return () => window.removeEventListener("resize", fit);
      }, [text, stage, mode]);
      useEffect(() => {
        /* a harness needs to hold a beat still; the film otherwise plays on */
        window.__cin = (x) => { cManual.current = true; cRun.current++; setCbeat(x); setRefPin(null);
          /* see above: no default pick */
          if (FKEY.indexOf(x) >= FKEY.indexOf("press") || x === "tamper" || x === "broke") {
            if (!text) setText("meet me at six");
            if (!packRef.current && kit) kit.encrypt(text || "meet me at six").then((p2) => {
              packRef.current = p2; setPack(p2);
              kit.open(p2).then(setOpened);
            });
          }
        };
        /* review only: jump to a storyboard label and freeze it there */
        window.__refs = Object.keys(REF_AT);
        window.__ref = (lab, ms) => {
          const at = REF_AT[lab];
          if (!at) throw new Error(`__ref: "${lab}" is not a film frame label`);
          const t = typeof ms === "number" ? ms : at[1];
          window.__cin(at[0]);
          setRefPin({ lab, beat: at[0], ms: t });
          return { label: lab, beat: at[0], ms: t };
        };
        window.__insp = (st, m, a, eb) => {
          /* a harness that jumps straight to the message half is standing in
             for a viewer who has already watched the agreement */
          if (a === "aes" || (eb && eb === "rest")) setKeyReady(true);
          if (a) setAlgo(a);
          if (eb) setEbeat(eb);
          if (st) setStage(st);
          if (m) setMode(m);
          else if (st && st !== "idle") setMode("net");
        };
        return () => {
          delete window.__insp;
        };
      }, []);
      const holds = ["landed", "toBob", "decrypting", "done"].includes(stage);
      const E = algo === "ecdh";
      const at = (n) => E && EORD.indexOf(ebeat) >= EORD.indexOf(n);
      const sess = kit ? kit.session : null;
      /* Each flag answers "has this happened yet", so every one of them stays
         true once it is true. That is what makes the resting state hold the
         whole story instead of clearing it. */
      const scene = {
        priv: at("setup"),      /* both private values exist, on their phones */
        qa: at("qa"),           /* Alice's public value exists               */
        qb: at("qb"),           /* Bob's does too                            */
        swap: at("cross"),      /* the two of them are crossing              */
        landed: at("mixA"),     /* and have arrived on the other device      */
        seen: at("cross"),      /* Eve has copies, and keeps them            */
        mixA: at("mixA"),
        mixB: at("mixB"),
        same: at("reveal"),     /* the masks are off                         */
        key: at("rest"),        /* K derived on both                         */
        /* which side the camera is close on. Nobody is dimmed at setup, at
           the crossing, or at the reveal \u2014 those are the three frames about
           both of them at once. */
        on: ebeat === "qa" || ebeat === "mixA" ? "a"
          : ebeat === "qb" || ebeat === "mixB" ? "b"
          : ebeat === "reveal" || ebeat === "rest" ? "both"
          : ebeat === "cross" ? "e" : null
      };
      const shown = pack || live;
      const ct = shown ? BYTES(shown.C) : "";
      const F = FAT(cbeat);
      const line = null;   /* the film carries its own travelling rail */ const oldLine = algo === "ecdh" ? STEP[(mode === "live" ? "e_" : "n_") + ebeat] || null : stage !== "idle" ? STEP[stage] || null : mode === "net" ? text ? STEP.netTyping : STEP.netIdle : text ? STEP.typing : STEP.ready;
      return /* @__PURE__ */ React.createElement("div", { className: "insp f-" + focus + (tall ? " tall" : "") + " side-" + side + " m-" + mode + " a-" + algo + (stage === "idle" ? " composing" : ""), /* motion is divided by the same rate the dwells are, so a flight can    never still be in the air when the next beat begins */ style: { "--rate": rate } }, refLabel && /* @__PURE__ */ React.createElement("span", { className: "ref-label", "aria-hidden": "true", "data-ref": refLabel }, refLabel), /* The two turning points, each said once and then gone. The first is
     why the agreement is about to happen; the second is that it did, and
     that the message is still here. Without these the two halves are two
     demos that share a screen. */
  bridge && /* @__PURE__ */ React.createElement("div", { className: "brg brg-" + bridge, role: "status" },
    /* @__PURE__ */ React.createElement("strong", null, bridge === "hold"
      ? "Not yet \u2014 your phone and Bob\u2019s need the same key first"
      : "Both phones now have the same key"),
    /* @__PURE__ */ React.createElement("span", { className: "brg-m" },
      /* @__PURE__ */ React.createElement("i", null, bridge === "hold" ? "waiting to send" : "your message"),
      /* @__PURE__ */ React.createElement("b", null, shorten(text, 46))),
    /* @__PURE__ */ React.createElement("span", { className: "brg-n" }, bridge === "hold"
      ? "Watch them work it out without sending it."
      : "Now it can be encrypted and sent.")),
  /* @__PURE__ */ React.createElement("div", { className: "ctl" }, /* @__PURE__ */ React.createElement("div", { className: "ctl-g", role: "radiogroup", "aria-label": "View" }, /* @__PURE__ */ React.createElement("span", { className: "ctl-l" }, "View"), /* @__PURE__ */ React.createElement(
        "button",
        {
          role: "radio",
          "aria-checked": mode === "live",
          className: "mode" + (mode === "live" ? " on" : ""),
          onClick: () => setMode("live")
        },
        "Live"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          role: "radio",
          "aria-checked": mode === "net",
          className: "mode" + (mode === "net" ? " on" : ""),
          onClick: () => setMode("net")
        },
        "Network"
      )), /* @__PURE__ */ React.createElement("div", { className: "ctl-g", role: "radiogroup", "aria-label": "Algorithm" }, /* @__PURE__ */ React.createElement("span", { className: "ctl-l" }, "Algorithm"), /* @__PURE__ */ React.createElement(
        "button",
        {
          role: "radio",
          "aria-checked": algo === "ecdh",
          /* the agreement is reachable once it has happened, so it can be
             watched again; before that it has not been reached in the story */
          "aria-disabled": !keyReady && algo !== "ecdh",
          disabled: !keyReady && algo !== "ecdh",
          title: keyReady ? "How the two phones agreed this key"
                          : "This happens when you press Send",
          className: "mode" + (algo === "ecdh" ? " on" : "")
            + (!keyReady && algo !== "ecdh" ? " locked" : ""),
          onClick: () => pickAlgo("ecdh")
        },
        "ECDH"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          role: "radio",
          "aria-checked": algo === "aes",
          /* Not hidden \u2014 visibly waiting. The viewer should be able to see
             that there is a second half and that it needs the first half to
             have happened, which is the whole point of the ordering. */
          title: "The message you are sending Bob",
          className: "mode" + (algo === "aes" ? " on" : ""),
          onClick: () => pickAlgo("aes")
        },
        /* @__PURE__ */ React.createElement("span", { className: "mode-long" }, "AES-GCM"),
        /* @__PURE__ */ React.createElement("span", { className: "mode-short" }, "AES"),
      )), /* @__PURE__ */ React.createElement("span", { className: "mode-what" }, algo === "ecdh" ? mode === "live" ? "How this session\u2019s key was established" : "How the key was agreed across the room" : mode === "live" ? "What happens to your message as you type" : "What happens between Alice, Eve and Bob")), algo === "ecdh" && /* @__PURE__ */ React.createElement("div", { className: "insp-phone insp-keys" }, /* @__PURE__ */ React.createElement(
        KeyAgreement,
        {
          s: kit ? kit.session : null,
          beat: ebeat,
          quiet: focus !== "keys",
          pending: shorten(text, 44),
          onNext: async () => {
            setAlgo("aes");
            setMode("live");
            setBridge("back");
            await pause(2000);
            setBridge(null);
            send();
          },
          onReplay: playEcdh
        }
      )), /* THE FILM IS THE MODULE. The two half-experiences it replaces are still
         in the file and still hidden; the film is what a viewer meets. */
      /* @__PURE__ */ React.createElement("div", { className: "insp-ecs" }, /* @__PURE__ */ React.createElement(Cinema, { kit, beat: cbeat, pick, setPick, text, setText, pack, opened, inRef, busy: false, onSend: cinSend, onReplay: cinReplay, onAct, peeking, setPeeking, tampered, onTamper: cinTamper, onAgain: cinAgain })), /* @__PURE__ */ React.createElement("div", { className: "insp-phone" + (E ? " sc sc-" + ebeat + (scene.on ? " on-" + scene.on : "") : "") }, /* The frame the whole screen is read through, said once, at the top, in    the plainest words available. Before this line the module answered "who    am I, who am I sending to, who is watching" only by implication. */ /* @__PURE__ */ React.createElement("p", { className: "sur-orient" }, /* @__PURE__ */ React.createElement("strong", null, "You are Alice."), " ", /* @__PURE__ */ React.createElement("span", null, E ? "Your phone and Bob\u2019s agree on a key while Eve watches the Wi\u2011Fi." : "Send Bob a private message while Eve watches the Wi\u2011Fi.")), /* @__PURE__ */ React.createElement("div", { className: "sur-eve" + (holds ? " has-got" : ""), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("div", { className: "sur-eye" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 44 26", width: "100%" }, /* @__PURE__ */ React.createElement("path", { className: "eye-l", d: "M2 13 C10 2 34 2 42 13 C34 24 10 24 2 13 Z" }), /* @__PURE__ */ React.createElement("circle", { className: "eye-i", cx: "22", cy: "13", r: "6.6" }), /* @__PURE__ */ React.createElement("circle", { className: "eye-p", cx: "22", cy: "13", r: "2.9" }), /* @__PURE__ */ React.createElement("path", { className: "eye-lid", d: "M2 13 C10 2 34 2 42 13 Z" }))), /* @__PURE__ */ React.createElement("img", { className: "sur-face", src: SPRITE.atk, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "sur-who evil" }, "Eve"), /* @__PURE__ */ React.createElement("span", { className: "sur-note" }, holds ? "has a copy of the ciphertext \u2014 cannot read it" : "can watch the traffic, not read it"), holds && ct && /* @__PURE__ */ React.createElement("span", { className: "sur-got" }, /* @__PURE__ */ React.createElement("span", { className: "sur-got-k" }, "intercepted — unreadable"), /* @__PURE__ */ React.createElement("span", { className: "sur-got-v" }, shorten(ct, 14))), false && /* @__PURE__ */ React.createElement("span", { className: "sur-saw" + (scene.seen ? " on" : "") }, scene.seen ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "sur-saw-k" }, scene.same ? "sees both — neither private value" : "sees both public values"), /* @__PURE__ */ React.createElement("span", { className: "sur-saw-row" }, /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "A"), /* @__PURE__ */ React.createElement("span", { className: "sur-saw-v" }, sess ? BYTES(sess.Qm, 3) : ""), /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "B"), /* @__PURE__ */ React.createElement("span", { className: "sur-saw-v" }, sess ? BYTES(sess.Ql, 3) : "")), scene.same && /* @__PURE__ */ React.createElement("span", { className: "sur-lack" }, "neither private value — so not the secret")) : /* @__PURE__ */ React.createElement("span", { className: "sur-saw-k" }, "watching the Wi‑Fi"))), /* @__PURE__ */ React.createElement("div", { className: "sur-side sur-alice is-you", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("img", { className: "sur-face lit", src: SPRITE.you, alt: "" }), /* Alice is the role the viewer is standing in, so her name carries the    word for it and her label says what she is doing, not who she is. */ /* @__PURE__ */ React.createElement("span", { className: "sur-who" }, "Alice ", /* @__PURE__ */ React.createElement("i", { className: "sur-me" }, "you")), /* @__PURE__ */ React.createElement("span", { className: "sur-role" }, /* this element is the message flow now; the agreement has its own
           stage, with its own labels */ stage === "idle" ? "writing to Bob"
          : ["encrypting", "handoff"].includes(stage) ? "sending to Bob"
          : ["wire", "landed"].includes(stage) ? "sent it \u2014 on its way"
          : "sent it to Bob"), /* the key agreement has its own stage now; this element carries the
           message flow only */ /* @__PURE__ */ React.createElement("span", { className: "sur-note" }, stage === "idle" ? "writing" : "sent it")), /* @__PURE__ */ React.createElement("div", { className: "sur-side sur-bob" + (holds ? " has-got" : ""), "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("img", { className: "sur-face" + (stage === "done" ? " lit" : ""), src: SPRITE.fr, alt: "" }), /* @__PURE__ */ React.createElement("span", { className: "sur-who" }, "Bob"), /* @__PURE__ */ React.createElement("span", { className: "sur-role" }, stage === "done" ? "read what you sent" : "receives what you send"), /* the key agreement has its own stage now; this element carries the
           message flow only */ /* @__PURE__ */ React.createElement("span", { className: "sur-note" }, stage === "done" ? "read it" : stage === "idle" ? "waiting" : "receiving"), holds && /* @__PURE__ */ React.createElement("span", { className: "sur-got ok" }, /* @__PURE__ */ React.createElement("span", { className: "sur-got-k" }, "got it"), /* @__PURE__ */ React.createElement("span", { className: "sur-got-v" }, shorten(ct, 5)))), E && /* @__PURE__ */ React.createElement("div", { className: "play", "aria-label": "Playback" },
        /* @__PURE__ */ React.createElement("button", { className: "play-b", onClick: playEcdh }, "\u21BA Replay"),
        /* Two settings, not three. Each beat is floored at the reading time
           its own words need, so above 2x the floors are already doing all
           the holding and a third step bought 0.9s across the whole sequence
           \u2014 measured. A control that claims a change it cannot make is
           worse than no control, so it is gone. The two that remain are named
           for what actually differs: whether the supporting line is shown. */
        /* @__PURE__ */ React.createElement("span", { className: "play-r", role: "radiogroup", "aria-label": "Pace" },
          [[1, "Narrated", "Headline and supporting line"],
           [2, "Headlines", "Headlines only, at reading speed"]].map(([r, label, hint]) =>
            /* @__PURE__ */ React.createElement("button", {
              key: r, role: "radio", "aria-checked": rate === r, title: hint,
              className: "play-s" + (rate === r ? " on" : ""),
              onClick: () => setRate(r)
            }, label)))
      ), /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "sur-dir" + (text.trim() || stage !== "idle" ? " on" : "") + (E ? " e" : "") + (scene.same ? " match" : ""),
          "aria-hidden": "true"
        },
        /* @__PURE__ */ React.createElement("i", null),
        /* @__PURE__ */ React.createElement("span", null, scene.same ? "same value \u2014 never sent" : E ? "Alice \u2194 Bob" : "Alice \u2192 Bob"),
        /* @__PURE__ */ React.createElement("i", null)
      ), E && /* @__PURE__ */ React.createElement(EqnRegion, { beat: ebeat, s: sess, on: scene.on }), /* the lane runs from Alice to Bob in both flows, so the rail that names    its direction belongs to the scene, not to one of them */ /* @__PURE__ */ React.createElement("div", { className: "sur-rail", "aria-hidden": "true" }), E && /* FLOW 1, IN THE SAME LANE THE MESSAGE WILL USE LATER.
         The two public values leave their owners, cross the café Wi-Fi past
         Eve, and arrive on the other side. Each keeps its owner's colour the
         whole way, so at no point is it unclear whose number is moving. */
      /* @__PURE__ */ React.createElement("div", { className: "sur-wire sur-keys", "aria-hidden": "true" }, scene.swap && !scene.mixA && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "sk sk-a" }, /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "A"), /* @__PURE__ */ React.createElement("span", { className: "sk-k" }, "public value"), /* @__PURE__ */ React.createElement("span", { className: "sk-v" }, sess ? BYTES(sess.Qm, 3) : "")), /* @__PURE__ */ React.createElement("span", { className: "sk sk-b" }, /* @__PURE__ */ React.createElement("i", { className: "sv-own", "aria-hidden": "true" }, "B"), /* @__PURE__ */ React.createElement("span", { className: "sk-k" }, "public value"), /* @__PURE__ */ React.createElement("span", { className: "sk-v" }, sess ? BYTES(sess.Ql, 3) : ""))), null), ct && ["wire", "landed", "toBob", "decrypting", "done"].includes(stage) && /* @__PURE__ */ React.createElement("div", { className: "sur-wire", "aria-hidden": "true" }, stage === "wire" && /* @__PURE__ */ React.createElement("div", { className: "sur-pay fly" }, /* @__PURE__ */ React.createElement("span", { className: "sur-pay-l" }, "Encrypted \xB7 Alice \u2192 Bob"), /* @__PURE__ */ React.createElement("span", { className: "sur-pay-c" }, shorten(ct, 17))), stage === "wire" && /* @__PURE__ */ React.createElement("div", { className: "sur-dup split" }, /* @__PURE__ */ React.createElement("span", { className: "sur-pay-l" }, "Copy \xB7 intercepted"), /* @__PURE__ */ React.createElement("span", { className: "sur-pay-c" }, shorten(ct, 17)))), /* @__PURE__ */ React.createElement("div", { className: "ip" }, /* @__PURE__ */ React.createElement("div", { className: "ip-body" }, /* @__PURE__ */ React.createElement("div", { className: "ip-island" }), /* @__PURE__ */ React.createElement("div", { className: "ip-screen" }, /* @__PURE__ */ React.createElement("div", { className: "ip-nav" }, /* the device is Alice’s, and its own chrome says who it is addressed to:    a back chevron told the viewer nothing about whose phone this is */ /* @__PURE__ */ React.createElement("span", { className: "ip-back" }, side === "you" ? "To" : "From"), /* @__PURE__ */ React.createElement("span", { className: "ip-who" }, side === "you" ? "Bob" : "Alice"), /* @__PURE__ */ React.createElement("span", { className: "ip-dot" })), /* @__PURE__ */ React.createElement("div", { className: "ip-thread" }, side === "you" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Bubble, { text: "hey \u2014 you around?" }), stage !== "idle" && /* @__PURE__ */ React.createElement(Bubble, { mine: true, text }), stage !== "idle" && stage !== "done" && /* @__PURE__ */ React.createElement("span", { className: "ip-hold" }, ready ? "sending\u2026" : "waiting for a secure line\u2026")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Bubble, { text: "hey \u2014 you around?", mine: true }), stage !== "done" && /* @__PURE__ */ React.createElement(Bubble, { cipher: true, text: shorten(ct, 24) }), stage === "done" && /* @__PURE__ */ React.createElement(Bubble, { text: got }))), /* the composer belongs to the message half and is not rendered while
           the key is being agreed: a field that cannot be used should not be
           in the document at all */ !E && side === "you" && stage === "idle" && text.trim() && ct && /* @__PURE__ */ React.createElement("div", { className: "ip-live" }, /* @__PURE__ */ React.createElement("span", { className: "ip-live-k" }, "Encrypted"), /* @__PURE__ */ React.createElement("span", { className: "ip-live-v" }, shorten(ct, 30))), /* The device is the one place a value can be held without crossing the
   room, so the state of the line is reported inside it and nowhere else.
   Everything else on the device dims while the key agreement runs — the
   camera moves, the composition does not — and this row stays lit. */
E && /* @__PURE__ */ React.createElement("div", { className: "ipk" + (scene.same ? " ready" : "") },
  /* @__PURE__ */ React.createElement("span", { className: "ipk-g", "aria-hidden": "true" }, scene.same ? "\u25cf" : "\u25cb"),
  /* @__PURE__ */ React.createElement("span", { className: "ipk-t" },
    /* @__PURE__ */ React.createElement("span", { className: "ipk-k" }, "Secure line to Bob"),
    /* @__PURE__ */ React.createElement("span", { className: "ipk-v" },
      scene.same ? "ready \u2014 key held on your phone" : "not established yet"))), /* the composer belongs to the message half and is not rendered while
           the key is being agreed: a field that cannot be used should not be
           in the document at all */ !E && side === "you" && stage === "idle" && /* @__PURE__ */ React.createElement("div", { className: "ip-hint" + (text.trim() ? " on" : "") }, "Press Enter to send"), /* the composer belongs to the message half and is not rendered while
           the key is being agreed: a field that cannot be used should not be
           in the document at all */ !E && side === "you" && stage === "idle" && /* @__PURE__ */ React.createElement("div", { className: "ip-bar" }, /* @__PURE__ */ React.createElement(
        "textarea",
        {
          className: "ip-in",
          rows: 1,
          value: text,
          ref: inRef,
          placeholder: "Message Bob\u2026",
          autoFocus: true,
          onChange: (e) => setText(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }
        }
      ), /* @__PURE__ */ React.createElement("button", { className: "ip-send", onClick: send, disabled: !text.trim(), "aria-label": "Send" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 20 20", width: "17", height: "17" }, /* @__PURE__ */ React.createElement("path", { d: "M3 10 L17 3 L10 17 L9 11 Z" })))), side === "fr" && stage === "done" && /* @__PURE__ */ React.createElement("div", { className: "ip-bar done" }, /* @__PURE__ */ React.createElement("span", null, "Delivered")))))), /* @__PURE__ */ React.createElement("div", { className: "insp-side" }, /* @__PURE__ */ React.createElement("section", { className: "pan pan-cafe" + (focus === "cafe" ? "" : " quiet") }, /* @__PURE__ */ React.createElement("h3", { className: "pan-t" }, "Caf\xE9 view"), /* @__PURE__ */ React.createElement(
        MiniCafe,
        {
          stage: algo === "ecdh" ? ebeat : stage,
          ct,
          ready,
          wide: focus !== "cafe"
        }
      )), algo === "aes" && /* @__PURE__ */ React.createElement(
        Process,
        {
          stage,
          plain: text,
          ct,
          got,
          act,
          iv: shown ? shown.ivHex : null,
          pk: shown,
          live: stage === "idle" && !!text,
          quiet: focus !== "proc"
        }
      )), line && /* @__PURE__ */ React.createElement("div", { className: "insp-say is-" + (line[2] || "center"), key: cbeat },
        /* @__PURE__ */ React.createElement("strong", null, Say(line[0])),
        /* At speed the supporting clause is the first thing that stops being
           readable — a beat that holds for 800ms cannot carry two sentences.
           Above 1x only the headline runs, so what remains has time to land. */
        line[1] && rate === 1 ? /* @__PURE__ */ React.createElement("span", null, Say(line[1])) : null), err && /* @__PURE__ */ React.createElement("p", { className: "insp-err" }, err), stage === "done" && /* @__PURE__ */ React.createElement("div", { className: "insp-end" }, /* @__PURE__ */ React.createElement("button", { className: "insp-again", onClick: again }, "Another message"), /* @__PURE__ */ React.createElement("button", { className: "insp-next", onClick: () => onFinish(text) }, "Done")));
    };
    function App() {
      const [act, setAct] = useState(1);
      const [step, setStep] = useState(1);
      const [note, setNote] = useState(NOTE.wifi);
      const [noteSwap, setNoteSwap] = useState(false);
      const [L, setL] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 880px)").matches ? WIDE : TALL);
      const [shot, setShot] = useState("wide");
      const [vis, setVis] = useState(/* @__PURE__ */ new Set());
      const [calls, setCalls] = useState({});
      const [flows, setFlows] = useState([]);
      const [seen, setSeen] = useState(false);
      const [nonce, setNonce] = useState(0);
      const [lit, setLit] = useState({});
      const [focus, setFocus] = useState(null);
      const [hot, setHot] = useState(-1);
      const [mix, setMix] = useState(null);
      const [tap, setTap] = useState(false);
      const [look, setLook] = useState(null);
      const [watch, setWatch] = useState(false);
      const [nz, setNz] = useState("center");
      const [spot, setSpot] = useState(null);
      const [guess, setGuess] = useState(0);
      const [morphing, setMorph] = useState(false);
      const [fn, setFn] = useState(null);
      const [fnp, setFnp] = useState(1);
      const [reveal, setReveal] = useState(false);
      const [ledger, setLedger] = useState(false);
      const [frame, setFrame] = useState(null);
      const [frameOn, setFrameOn] = useState(false);
      const [wire, setWire] = useState(BASE.wire);
      const [tape, setTape] = useState(null);
      const [durs, setDurs] = useState(() => ACTS.map(() => 1));
      const [answers, setAnswers] = useState({});
      const [kit, setKit] = useState(null);
      useEffect(() => {
        let dead = false;
        makeKit().then((k2) => {
          if (dead) return;
          setKit(k2);
          if (typeof window !== "undefined") window.__kit = k2;
          /* test hook: the narration table, so a harness can measure every
             line of copy against the band instead of a sample of them */
          if (typeof window !== "undefined") window.__say = STEP;
        });
        return () => {
          dead = true;
        };
      }, []);
      const vals = useMemo(() => {
        const ans = answers[1] || [];
        return {
          a: ans[0] !== void 0 ? ans[0] : PICKS.you[0],
          b: ans[1] !== void 0 ? ans[1] : PICKS.fr[0]
        };
      }, [answers]);
      const [t, setT] = useState(0);
      const [playing, setPlaying] = useState(true);
      const [scrubbing, setScrubbing] = useState(false);
      const tRef = useRef(0);
      const curRef = useRef(-1);
      const seekRef = useRef(null);
      const holdRef = useRef(false);
      const [snap, setSnap] = useState(false);
      const svgRef = useRef(null);
      const packRef = useRef(null);
      const invRef = useRef(1);
      const RM = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
      useEffect(() => {
        const mq = window.matchMedia("(min-width: 880px)");
        const onChange = () => setL(mq.matches ? WIDE : TALL);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
      }, []);
      const [cx, cy, k] = L.shots[shot];
      const boost = 1 + Math.min(0.4, Math.max(0, (k - 1) * 0.3));
      const inv = boost / k;
      invRef.current = inv;
      const cam = `translate(${L.w / 2 - cx * k}px,${L.h / 2 - cy * k}px) scale(${k})`;
      const near = (who) => shot === "wide" || shot === "net" || shot === "trio" ? "" : shot === "both" ? who === "atk" ? " far" : " near" : SUBJECT[shot] === who ? " near" : " far";
      const build = async (actNo, LL, answers2, key = "") => {
        let vt = 0;
        const kfs = [];
        const flights = [];
        let gate = void 0;
        let gi = 0;
        const HALT = { halt: true };
        const at = (go, mark) => {
          kfs.push({ at: vt, go, mark });
        };
        const wait = (ms) => {
          vt += Math.max(0, ms);
          return SYNC;
        };
        const show = (ids) => at((s) => {
          s.vis = ids.slice();
        });
        const say = (patch) => at((s) => {
          const opensNote = Object.keys(patch).some((key2) => patch[key2] && patch[key2].kind !== "chip");
          const n = { ...s.calls };
          if (opensNote) {
            for (const key2 of Object.keys(n)) if (n[key2] && n[key2].kind !== "chip") n[key2] = null;
          }
          s.calls = Object.assign(n, patch);
        });
        const clearAll = () => at((s) => {
          s.calls = {};
        });
        const tell = (line) => {
          at((s) => {
            s.noteSwap = true;
          });
          const hold = vt;
          vt += RM ? 0 : 170;
          at((s) => {
            s.note = line;
            s.noteSwap = false;
          });
          vt = hold;
        };
        const lead = (line) => at((s) => {
          s.note = line;
          s.noteSwap = false;
        });
        const settle = () => wait(RM ? 0 : 380);
        const read = (t2) => wait(RM ? 400 : Math.min(3400, 850 + t2.length * 24));
        const emph = (id) => at((s) => {
          s.focus = id;
        });
        const flowOn = (f) => at((s) => {
          s.flows = f.slice();
        });
        const flowOff = () => at((s) => {
          s.flows = [];
        });
        const setShot2 = (sh) => at((s) => {
          s.shot = sh;
        });
        const setSpot2 = (sp) => at((s) => {
          s.spot = sp;
        });
        const setGuess2 = (g) => at((s) => {
          s.guess = g;
        });
        const look2 = (who) => at((s) => {
          s.look = who;
        });
        const watch2 = (v) => at((s) => {
          s.watch = v;
        });
        const where = (z) => at((s) => {
          s.nz = z;
        });
        const setTap2 = (v) => at((s) => {
          s.tap = v;
        });
        const setFn2 = (f, p = 1) => at((s) => {
          s.fn = f;
          s.fnp = p;
        });
        const fnPhase = (p) => at((s) => {
          s.fnp = p;
        });
        const setReveal2 = (v) => at((s) => {
          s.reveal = v;
        });
        const setLedger2 = (v) => at((s) => {
          s.ledger = v;
        });
        const setStep2 = (st) => at((s) => {
          s.step = st;
        }, "beat");
        const setWire2 = (f) => at((s) => {
          s.wire = f(s.wire);
        });
        const par = (f) => {
          const back = vt;
          f();
          vt = back;
        };
        const span = (on, off, ms) => {
          at(on);
          const back = vt;
          vt += ms;
          at(off);
          vt = back;
        };
        const observe = (ms) => span((s) => {
          s.seen = true;
        }, (s) => {
          s.seen = false;
        }, ms);
        const light = (who, kind, ms = 700) => span(
          (s) => {
            s.lit = { ...s.lit, ...Object.fromEntries(who.map((w) => [w, kind])) };
          },
          (s) => {
            const n = { ...s.lit };
            who.forEach((w) => {
              if (n[w] === kind) delete n[w];
            });
            s.lit = n;
          },
          ms
        );
        const gold = () => light(["you", "fr"], "key", 900);
        const morph = () => span((s) => {
          s.morphing = true;
        }, (s) => {
          s.morphing = false;
        }, 620);
        const turn = (who, from, to, step2 = 52) => {
          const total = from[0].length + from[1].length;
          const txt = (n) => [0, 1].map((li) => {
            const off = li === 0 ? 0 : from[0].length;
            return from[li].split("").map((c, i) => off + i < n ? to[li][i] : c).join("");
          });
          for (let n = 1; n <= total; n++) {
            const line = txt(n), h = n - 1;
            at((s) => {
              s.wire = { ...s.wire, [who]: line };
              s.hot = h;
            });
            vt += RM ? 0 : step2;
          }
          at((s) => {
            s.hot = -1;
          });
          return SYNC;
        };
        const merge = (who, out, ms = 620) => {
          at((s) => {
            s.mix = who;
          });
          vt += RM ? 0 : ms;
          at((s) => {
            s.mix = null;
            s.vis = out.slice();
          });
          return SYNC;
        };
        const cut = (id) => {
          const f = FRAMES[id];
          at((s) => {
            s.frame = f;
            s.frameOn = true;
          });
          vt += f.ms;
          at((s) => {
            s.frameOn = false;
          });
          vt += 260;
          at((s) => {
            s.frame = null;
          });
          return SYNC;
        };
        const send = (pathId, cargo, ms, opts = {}) => {
          var _a, _b;
          const hold = (_a = opts.hold) != null ? _a : 820, st = (_b = opts.settle) != null ? _b : 420;
          flights.push({
            at: vt,
            hold,
            ms,
            settle: st,
            fade: 260,
            path: pathId,
            cargo,
            back: !!opts.back
          });
          vt += hold + ms + st + 260;
          return SYNC;
        };
        const askUser = (a) => {
          const i = gi++;
          if (i < answers2.length) return { then: (r) => r(answers2[i]) };
          gate = { at: vt, ask: a, index: i };
          throw HALT;
        };
        const answered = () => {
        };
        const alive = () => true;
        const A = LL.an;
        const VALS = {
          a: actNo === 1 && answers2.length > 0 ? answers2[0] : vals.a,
          b: actNo === 1 && answers2.length > 1 ? answers2[1] : vals.b
        };
        const TOK = tokens(VALS);
        const tokOf = (id) => TOK[id];
        const beat = {};
        const run = async () => {
          const eveKnows = async (line, ms = 1092) => {
            setShot2("atk");
            tell(NOTE.whatEve);
            await settle();
            if (!alive()) return;
            setSpot2("atk");
            say({ d: { kind: "note", tag: "What Eve knows now", tone: "danger", text: line } });
            await wait(ms);
            if (!alive()) return;
            say({ d: null });
            setSpot2(null);
          };
          beat[1] = async () => {
            lead(NOTE.wifi);
            where("lower");
            setShot2("wide");
            show([]);
            clearAll();
            emph(null);
            look2(null);
            watch2(false);
            await wait(3400);
            if (!alive()) return;
            setShot2("both");
            tell(NOTE.pairWant);
            where("lower");
            await settle();
            if (!alive()) return;
            flowOn([["main", "you", 1]]);
            await wait(2600);
            if (!alive()) return;
            flowOff();
            await wait(900);
            if (!alive()) return;
            setShot2("atk");
            tell(NOTE.eveHere);
            where("eve");
            await settle();
            if (!alive()) return;
            await wait(2400);
            if (!alive()) return;
            watch2(true);
            look2("you");
            tell(NOTE.eveWatch);
            await wait(2300);
            if (!alive()) return;
            look2("fr");
            await wait(2300);
            if (!alive()) return;
            setShot2("wide");
            where("upper");
            tell(NOTE.eveBoth);
            await settle();
            if (!alive()) return;
            await wait(2600);
            if (!alive()) return;
            setShot2("net");
            tell(NOTE.oneNetwork);
            where("lower");
            await settle();
            if (!alive()) return;
            observe(2e3);
            await wait(2400);
            if (!alive()) return;
            tell(NOTE.plainDemo);
            await wait(600);
            if (!alive()) return;
            flowOn([["main", "you", 1]]);
            send(
              "p-main",
              { kind: "msg", tone: "you", label: "Sent with no protection", sub: "Meet me outside at 5" },
              1100,
              { hold: 400, settle: 500 }
            );
            await wait(1900);
            if (!alive()) return;
            look2(null);
            observe(2600);
            await send(
              "p-netAtk",
              { kind: "msg", tone: "danger", label: "What Eve reads off the wire", sub: "Meet me outside at 5" },
              800,
              { hold: 500, settle: 700 }
            );
            if (!alive()) return;
            flowOff();
            setShot2("atk");
            where("eve");
            tell(NOTE.plainSeen);
            await settle();
            if (!alive()) return;
            await wait(2600);
            if (!alive()) return;
            watch2(false);
            setShot2("both");
            tell(NOTE.howPrivate);
            where("center");
            await settle();
            if (!alive()) return;
            await wait(2400);
          };
          beat[2] = async () => {
            lead(NOTE.pushAlice);
            setShot2("you");
            await settle();
            if (!alive()) return;
            await wait(800);
            if (!alive()) return;
            setShot2("msg");
            await settle();
            if (!alive()) return;
            await wait(500);
            if (!alive()) return;
            const typed = await askUser({ kind: "inspect", label: "", opts: [] });
            if (!alive() || typed === void 0) return;
            answered();
            setShot2("wide");
            setWire2(() => ({ you: MSGS[0].enc, fr: MSGS[0].plain, atk: MSGS[0].enc }));
            show(["you.key", "you.cipher", "fr.key", "fr.msg", "atk.cipher"]);
            tell(NOTE.landed);
            await settle();
            if (!alive()) return;
            await wait(2200);
            if (!alive()) return;
            tell(NOTE.close);
            await wait(2400);
          };
          const seq = ACTS[actNo - 1].beats;
          for (let i = 0; i < seq.length; i++) {
            setStep2(seq[i]);
            await beat[seq[i]]();
            if (i < seq.length - 1) wait(220);
          }
        };
        try {
          await run();
        } catch (e) {
          if (e !== HALT) throw e;
        }
        return { key, kfs, flights, dur: vt, gate };
      };
      useEffect(() => {
        let dead = false;
        build(act, L, answers[act] || [], `${act}:${nonce}`).then((tp) => {
          if (dead) return;
          window.__tape = tp;
          setTape(tp);
        });
        return () => {
          dead = true;
        };
      }, [act, L, answers, nonce, RM]);
      useEffect(() => {
        let dead = false;
        Promise.all(ACTS.map(
          (_, i) => build(i + 1, L, [0, 0]).then((tp) => Math.max(1, tp.dur))
        )).then((d) => {
          if (!dead) setDurs(d);
        });
        return () => {
          dead = true;
        };
      }, [L, RM]);
      const wall = tape ? tape.gate ? tape.gate.at : tape.dur : 0;
      const ask = tape && tape.gate && t >= tape.gate.at - 1 ? tape.gate.ask : null;
      const inspecting = !!(ask && ask.kind === "inspect");
      const commit = (s) => {
        setStep(s.step);
        setShot(s.shot);
        setVis(new Set(s.vis));
        setCalls(s.calls);
        setFlows(s.flows);
        setSeen(s.seen);
        setLit(s.lit);
        setFocus(s.focus);
        setHot(s.hot);
        setMix(s.mix);
        setTap(s.tap);
        setLook(s.look);
        setWatch(s.watch);
        setNz(s.nz);
        setSpot(s.spot);
        setGuess(s.guess);
        setMorph(s.morphing);
        setFn(s.fn);
        setFnp(s.fnp);
        setReveal(s.reveal);
        setLedger(s.ledger);
        setFrame(s.frame);
        setFrameOn(s.frameOn);
        setWire(s.wire);
        setNote(s.note);
        setNoteSwap(s.noteSwap);
      };
      useEffect(() => {
        if (!tape) return;
        let raf = 0, last = performance.now();
        const tick = (now) => {
          const dt = now - last;
          last = now;
          if (playing && !scrubbing && !holdRef.current) {
            let n = tRef.current + dt;
            if (n >= wall) {
              n = wall;
              setPlaying(false);
            }
            if (n !== tRef.current) {
              tRef.current = n;
              setT(n);
            }
          }
          window.__t = tRef.current;
          drawFlights(tRef.current);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
      }, [tape, playing, scrubbing, wall, frameOn]);
      useEffect(() => {
        if (!snap) return;
        const r = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
        return () => cancelAnimationFrame(r);
      }, [snap, t]);
      useEffect(() => {
        const cur = cursorAt(tape, t);
        if (cur === curRef.current) return;
        curRef.current = cur;
        commit(resolve(tape, t));
      }, [tape, t]);
      const tapeKey = useRef("");
      useEffect(() => {
        if (!tape) return;
        curRef.current = -1;
        if (tape.key === tapeKey.current) return;
        tapeKey.current = tape.key;
        const want = seekRef.current;
        seekRef.current = null;
        const start = want == null ? 0 : Math.min(want, tape.dur);
        tRef.current = start;
        setT(start);
        if (want == null) setPlaying(!RM);
        if (RM && want == null) {
          const end = tape.gate ? tape.gate.at : tape.dur;
          tRef.current = end;
          setT(end);
        }
      }, [tape]);
      const seek = (globalT) => {
        setSnap(true);
        let g = Math.max(0, globalT), n = 1;
        while (n < ACTS.length && g > durs[n - 1]) {
          g -= durs[n - 1];
          n++;
        }
        if (n !== act) {
          seekRef.current = g;
          setAct(n);
          return;
        }
        const cap = tape ? tape.gate ? tape.gate.at : tape.dur : 0;
        const nt = Math.min(g, cap);
        tRef.current = nt;
        setT(nt);
      };
      const actRef = useRef(act);
      actRef.current = act;
      useEffect(() => {
        window.__go = (a, ms, ans = [0, 0, 0]) => {
          setAnswers((p) => ({ ...p, [a]: ans }));
          holdRef.current = true;
          setPlaying(false);
          setSnap(true);
          if (a !== actRef.current) {
            seekRef.current = ms;
            setAct(a);
          } else {
            tRef.current = ms;
            setT(ms);
          }
        };
      });
      const answer = (v) => {
        setAnswers((p) => ({ ...p, [act]: [...p[act] || [], v] }));
        setPlaying(true);
      };
      const nextBeat = () => {
        if (!tape) return;
        const nx = tape.kfs.find((k2) => k2.mark === "beat" && k2.at > t + 1);
        if (nx && nx.at <= wall) {
          tRef.current = nx.at;
          setT(nx.at);
          setPlaying(true);
        } else if (t >= tape.dur - 1) setAct(act === ACTS.length ? 1 : act + 1);
        else {
          tRef.current = wall;
          setT(wall);
          setPlaying(true);
        }
      };
      const drawFlights = (now) => {
        const host = packRef.current, svg = svgRef.current;
        if (!host || !svg || !tape) return;
        const live = frameOn ? [] : tape.flights.map((f, i) => ({ f, i })).filter(({ f }) => now >= f.at && now < f.at + f.hold + f.ms + f.settle + f.fade);
        const keep = new Set(live.map(({ i }) => String(i)));
        Array.from(host.children).forEach((c) => {
          if (!keep.has(c.dataset.fly || "")) c.remove();
        });
        for (const { f, i } of live) {
          let g = host.querySelector(`[data-fly="${i}"]`);
          if (!g) {
            g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("data-audit", "PACKET");
            g.setAttribute("class", "fly");
            g.dataset.fly = String(i);
            g.innerHTML = cardMarkup(f.cargo);
            host.appendChild(g);
          }
          const path = svg.querySelector(`#${f.path}`);
          if (!path) continue;
          const len = path.getTotalLength();
          const local = now - f.at;
          let u = 0, op = 1;
          if (local < f.hold) {
            u = 0;
            op = Math.min(1, local / 240);
          } else if (local < f.hold + f.ms) {
            const x = (local - f.hold) / f.ms;
            u = x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
          } else if (local < f.hold + f.ms + f.settle) {
            u = 1;
          } else {
            u = 1;
            op = 1 - (local - f.hold - f.ms - f.settle) / f.fade;
          }
          const q = path.getPointAtLength((f.back ? 1 - u : u) * len);
          g.setAttribute("transform", `translate(${q.x},${q.y}) scale(${invRef.current})`);
          g.setAttribute("opacity", String(Math.max(0, Math.min(1, op))));
        }
      };
      const tok = tokens(vals);
      const dlg = calls.d;
      const SPEAKER = { you: "you", fr: "fr", danger: "atk" };
      const TIGHT = { work: true, workFr: true, msg: true, tap: true };
      const spWho = dlg && dlg.tag && !TIGHT[shot] ? SPEAKER[dlg.tone || "neutral"] : void 0;
      const spAt = spWho ? L.sp[spWho] : void 0;
      const chips = Object.keys(calls).filter((c) => c !== "d" && calls[c]);
      const boxPos = L.tall || shot === "msg" || shot === "wide" || shot === "trio" || shot === "work" || shot === "workFr" || shot === "atk" || spAt ? "dock" : shot === "fr" ? "dock" : "tl";
      return /* @__PURE__ */ React.createElement("div", { className: "page" }, /* @__PURE__ */ React.createElement("header", { className: "head" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, "Three people \xB7 one caf\xE9 \xB7 one secret"), /* @__PURE__ */ React.createElement("h1", { className: "h1" }, ACTS[act - 1].title)), /* @__PURE__ */ React.createElement("nav", { className: "pips", "aria-label": "Chapters" }, ACTS.map((a, i) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: a.label,
          className: "pip",
          "data-on": i + 1 === act ? "now" : i + 1 < act ? "done" : "next",
          onClick: () => setAct(i + 1)
        },
        /* @__PURE__ */ React.createElement("span", { className: "dot" }),
        /* @__PURE__ */ React.createElement("span", { className: "lbl" }, a.label)
      ))), /* @__PURE__ */ React.createElement(
        "div",
        {
          /* The interactive mode is not bound to the film frame's aspect ratio:
             at laptop heights the 1000x700 picture leaves the inspection about
             350px, which cannot hold a phone and two panels. While it is open the
             stage takes the room it needs. */
          className: "stage" + (frameOn ? " frozen" : "") + (frameOn && frame && frame.soft ? " soft" : "") + (inspecting ? " inspect" : ""),
          style: { ["--ar"]: String(L.w / L.h) }
        },
        /* the café's review label; once the film is open it carries its own */
        !inspecting && CAFE_REF.get(note) && /* @__PURE__ */ React.createElement("span", { className: "ref-label", "aria-hidden": "true", "data-ref": CAFE_REF.get(note) }, CAFE_REF.get(note)),
        /* @__PURE__ */ React.createElement("div", { className: "screen" }, /* @__PURE__ */ React.createElement("svg", { ref: svgRef, viewBox: `0 0 ${L.w} ${L.h}`, role: "img", "aria-label": note.s }, /* @__PURE__ */ React.createElement("defs", null, ["you", "fr", "key", "danger"].map((t2) => /* @__PURE__ */ React.createElement(
          "marker",
          {
            key: t2,
            id: `arw-${t2}`,
            viewBox: "0 0 10 10",
            refX: "7.5",
            refY: "5",
            markerWidth: "4",
            markerHeight: "4",
            orient: "auto-start-reverse"
          },
          /* @__PURE__ */ React.createElement("path", { className: `arw arw-${t2}`, d: "M0.5 1 L9 5 L0.5 9 Z" })
        ))), /* @__PURE__ */ React.createElement(
          "g",
          {
            className: "cam" + (snap ? " snap" : "") + (k >= 1.4 ? " tight" : "") + (frameOn && frame && frame.on ? " spot spot-" + frame.on : spot ? " spot spot-" + spot : ""),
            style: { transform: cam }
          },
          /* @__PURE__ */ React.createElement(Dressing, { L }),
          /* @__PURE__ */ React.createElement("path", { className: "link", d: L.paths.netYou }),
          /* @__PURE__ */ React.createElement("path", { className: "link", d: L.paths.netFr }),
          /* @__PURE__ */ React.createElement("path", { className: "link", d: L.paths.netAtk }),
          /* @__PURE__ */ React.createElement("path", { id: "p-main", className: "ghostpath", d: L.paths.main }),
          /* @__PURE__ */ React.createElement("path", { id: "p-netYou", className: "ghostpath", d: L.paths.netYou }),
          /* @__PURE__ */ React.createElement("path", { id: "p-netFr", className: "ghostpath", d: L.paths.netFr }),
          /* @__PURE__ */ React.createElement("path", { id: "p-netAtk", className: "ghostpath", d: L.paths.netAtk }),
          flows.map(([pth, tone, dir], i) => /* @__PURE__ */ React.createElement(
            "path",
            {
              key: i,
              className: `flow tone-${tone} ${dir === 1 ? "fwd" : "rev"}`,
              d: L.paths[pth],
              markerEnd: dir === 1 ? `url(#arw-${tone})` : void 0,
              markerStart: dir === -1 ? `url(#arw-${tone})` : void 0
            }
          )),
          tap && /* @__PURE__ */ React.createElement("path", { className: "tap", d: L.paths.main }),
          /* the observer's attention, drawn: two lines from his table to theirs.
             They sweep on rather than blink, so it reads as looking rather than as
             a diagram of a connection. */
          watch && L.watch && /* @__PURE__ */ React.createElement(
            "path",
            { className: "watch" + (look === "you" ? " lead" : ""), d: L.watch.you, "data-audit": "SIGHT" }
          ),
          watch && L.watch && /* @__PURE__ */ React.createElement(
            "path",
            { className: "watch" + (look === "fr" ? " lead" : ""), d: L.watch.fr, "data-audit": "SIGHT" }
          ),
          seen && /* @__PURE__ */ React.createElement("path", { className: "sight", d: L.sight, "data-audit": "SIGHT" }),
          /* @__PURE__ */ React.createElement(Router, { x: L.router.x, y: L.router.y, live: flows.length > 0, inv }),
          /* @__PURE__ */ React.createElement(
            Patron,
            {
              spot: L.atk,
              who: "a-atk",
              sprite: SPRITE.atk,
              idle: -1400,
              name: "Eve (intruder)",
              state: stateOf("atk", vis),
              inv,
              cls: near("atk"),
              hostile: true,
              lit: lit.atk,
              /* While he is watching and holding nothing, his screen is not
                 blank: it scans. Idle hardware reads as a man sitting near them;
                 a moving readout reads as a man monitoring them. */
              screen: watch && vis.size === 0 ? /* @__PURE__ */ React.createElement(
                "g",
                { className: "scan" },
                [0, 1, 2].map((i) => /* @__PURE__ */ React.createElement("rect", {
                  key: i,
                  className: "scan-bar",
                  x: -20,
                  y: -7 + i * 6,
                  width: 40,
                  height: 3,
                  rx: 1.5,
                  style: { animationDelay: `${i * 240}ms` }
                }))
              ) : /* @__PURE__ */ React.createElement(
                Screen,
                {
                  who: "atk",
                  vis,
                  wire: wire["atk"],
                  focus,
                  hot,
                  mix: mix === "atk",
                  tok,
                  reveal
                }
              ),
              extra: /* @__PURE__ */ React.createElement(React.Fragment, null, guess > 0 && /* @__PURE__ */ React.createElement(
                Reverse,
                {
                  inv,
                  s: L.atk.s,
                  start: tok["atk.setup"],
                  pubA: tok["atk.pubYou"],
                  pubB: tok["atk.pubFr"],
                  tries: TRIES(vals.a).slice(0, Math.max(0, Math.min(3, guess - 1))),
                  phase: guess
                }
              ), /* @__PURE__ */ React.createElement("g", { className: "eye" + (seen ? " on" : ""), transform: "translate(0,-150)" }, /* @__PURE__ */ React.createElement("g", { className: "hold", style: { transform: `scale(${inv / L.atk.s})` } }, /* @__PURE__ */ React.createElement("circle", { className: "eye-pulse", cx: "0", cy: "0", r: "17" }), /* @__PURE__ */ React.createElement(
                "path",
                {
                  className: "f-danger glowed-d",
                  d: "M-15 0 C -9 -9, 9 -9, 15 0 C 9 9, -9 9, -15 0 Z"
                }
              ), /* @__PURE__ */ React.createElement("circle", { cx: "0", cy: "0", r: "3.6", fill: "#0b0d10" }))))
            }
          ),
          /* @__PURE__ */ React.createElement(
            Patron,
            {
              spot: L.you,
              who: "a-you",
              sprite: SPRITE.you,
              idle: 0,
              name: "Alice",
              state: stateOf("you", vis),
              inv,
              cls: near("you"),
              lit: lit.you,
              morphing,
              screen: /* @__PURE__ */ React.createElement(
                Screen,
                {
                  who: "you",
                  vis,
                  wire: wire["you"],
                  focus,
                  hot,
                  mix: mix === "you",
                  tok,
                  reveal,
                  fn: fn && fn.who === "you" ? fn : null,
                  fnp
                }
              )
            }
          ),
          /* @__PURE__ */ React.createElement(
            Patron,
            {
              spot: L.fr,
              who: "a-fr",
              sprite: SPRITE.fr,
              idle: -2100,
              name: "Bob",
              state: stateOf("fr", vis),
              inv,
              cls: near("fr"),
              lit: lit.fr,
              morphing,
              screen: /* @__PURE__ */ React.createElement(
                Screen,
                {
                  who: "fr",
                  vis,
                  wire: wire["fr"],
                  focus,
                  hot,
                  mix: mix === "fr",
                  tok,
                  reveal,
                  fn: fn && fn.who === "fr" ? fn : null,
                  fnp
                }
              )
            }
          ),
          /* @__PURE__ */ React.createElement("g", { className: "packets", ref: packRef }),
          chips.map((slot) => /* @__PURE__ */ React.createElement(Callout, { key: slot, def: calls[slot], at: L.ch[slot], inv, narrow: L.tall })),
          dlg && spAt && /* @__PURE__ */ React.createElement(Callout, { def: dlg, at: spAt, inv, narrow: L.tall })
        )), /* @__PURE__ */ React.createElement("div", { className: "crt bloom", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "crt lines", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "crt vig", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement(KeyFrame, { f: frame, on: frameOn }), ask && ask.kind === "inspect" && /* @__PURE__ */ React.createElement(Inspection, { kit, tall: L.tall, onFinish: answer }), !frameOn && !ledger && !inspecting && /* @__PURE__ */ React.createElement(Caption, { line: note, zone: nz, swap: noteSwap })),
        ledger && /* @__PURE__ */ React.createElement(Ledger, { line: note, rows: step === 4 ? [
          ["Alice\u2019s private value", "still unknown", "var(--alice)"],
          ["Bob\u2019s private value", "still unknown", "var(--bob)"],
          ["The shared secret", "still unknown", "var(--key)"]
        ] : step >= 6 ? [
          ["Alice", "sent the message", "var(--alice)"],
          ["Bob", "read the message", "var(--bob)"],
          ["Eve", "intercepted only scrambled characters", "var(--eve)"]
        ] : [
          ["Alice", "shared secret " + tok["you.key"], "var(--alice)"],
          ["Bob", "shared secret " + tok["fr.key"], "var(--bob)"],
          ["Eve", "?", "var(--eve)"]
        ] }),
        /* @__PURE__ */ React.createElement(
          Scrub,
          {
            pos: durs.slice(0, act - 1).reduce((x, y) => x + y, 0) + Math.min(t, durs[act - 1]),
            dur: durs.reduce((x, y) => x + y, 0),
            marks: durs.slice(0, -1).map((_, i) => durs.slice(0, i + 1).reduce((x, y) => x + y, 0)),
            labels: ACTS.map((a) => a.label),
            playing,
            onSeek: seek,
            onScrub: (on) => {
              setScrubbing(on);
              if (on) setPlaying(false);
            },
            onToggle: () => setPlaying((p) => !p)
          }
        ),
        ask && ask.kind !== "inspect" && /* @__PURE__ */ React.createElement(Gate, { ask, pos: "dock", onPick: answer }),
        /* @__PURE__ */ React.createElement(
          Controls,
          {
            act,
            playing,
            waiting: !!ask,
            go: (a) => a === act ? nextBeat() : setAct(a),
            replay: () => {
              setAnswers((p) => ({ ...p, [act]: [] }));
              setNonce((n) => n + 1);
            }
          }
        )
      ), /* @__PURE__ */ React.createElement("details", { className: "read" }, /* @__PURE__ */ React.createElement("summary", null, "How it works in plain English"), /* @__PURE__ */ React.createElement("p", null, CLOSER)));
    }
    ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
  })();
