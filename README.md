# Encryption Coffee Shop — how strangers agree on a secret

An animated, interactive explanation of **Diffie–Hellman key agreement (ECDH)**,
told through the familiar story of Alice, Bob and Eve.

**Live:** https://rockysahooart.github.io/encryption-coffee-shop/

This page belongs to the **[Buffer Crypto Playground](https://ditchoom.github.io/buffer/playground)**
learning experience. It isn't a standalone cryptography product.

## Where this page fits

The Crypto Playground shows Alice sealing a message with AES-GCM and sending it
past Eve. Eve copies the sealed bytes but can't open them, because only Bob holds
the matching secret. It ends on the catch: that worked only because Alice and
Bob **met in person** to share the secret. Two strangers on the internet can't
do that.

This page answers the next question:

> **If Alice and Bob have never met, how do they end up with the same secret,
> when Eve can see everything that travels between them?**

| | teaches |
|---|---|
| **Buffer Crypto Playground** | encryption and AES-GCM, once a shared key already exists |
| **This ECDH interactive** | how Alice and Bob establish shared key material over a network Eve can observe |
| **HKDF + AES-GCM** (the end of this page) | how that agreement becomes a usable key that protects the real message |

```
ECDH  →  shared secret  →  HKDF  →  symmetric key  →  AES-GCM  →  protected message
```

## The idea, as a story

Alice wants to send Bob a private message. Eve can watch everything that travels
between them. Alice and Bob don't start with a shared secret.

1. Each of them chooses something **private**. It never leaves their own device.
2. Each combines that private value with information that is **safe to share
   publicly**, and they exchange **only the public results**.
3. Eve can see, and copy, those public values.
4. Alice combines **Bob's public value** with **her own private value**.
   Bob combines **Alice's public value** with **his own private value**.
5. Because of the mathematics behind Diffie–Hellman, both arrive at the
   **same shared secret**, even though that secret was never transmitted.
6. Eve saw the public exchange, but she has neither private value. Watching the
   exchange alone doesn't give her the shared secret.

Then the secret is put to work. The raw Diffie–Hellman result goes through
**HKDF** to derive proper symmetric key material, and that key protects the
actual message with **AES-GCM**.

## The colour analogy

The interactive acts this out with paint, because mixing is easy to do and hard
to undo:

1. Alice and Bob start from the same **public colour**.
2. Alice chooses a **private colour**.
3. Bob chooses a **different** private colour.
4. Each mixes the public colour with their private colour.
5. They exchange **only those mixtures**.
6. Eve can see and copy the mixtures.
7. Alice mixes Bob's mixture with her own private colour.
8. Bob mixes Alice's mixture with his own private colour.
9. Both independently reach the **same final colour**.

> **Same secret. Never sent.**

Colour mixing is **only a teaching analogy**. Real ECDH uses elliptic-curve
mathematics, not paint. The page says so, then switches to the real values.

## The experience

**The café opening.** Introduces Alice, Bob and Eve, the shared café Wi-Fi Eve
can observe, and the privacy problem. A plain note crosses and Eve reads it word
for word, which is why a key-agreement mechanism is needed at all.

**The iPhone interactive.** The viewer becomes Alice, choosing and dragging by
hand:

```
public value → private choices → public mixtures → observable exchange
→ same shared secret → real ECDH → HKDF → AES-GCM → protected message
```

Small labels such as `1a`, `4c` or `5f` in the corner are **development
references**. They map each animation state to its frame in the Figma
storyboard. They aren't part of the lesson.

### The real sequence

Once the paint is put away, the page shows what the browser actually computes
with WebCrypto (ECDH on P-256, HKDF-SHA256, AES-256-GCM):

```
Q_A = d_A G                  Alice's public value from her private number
Q_B = d_B G                  Bob's, from his
Z   = d_A Q_B = d_B Q_A      the same shared secret on both sides
K   = HKDF(Z)                symmetric key material
(C, T) = AES-GCM(K, nonce, message)     ciphertext + authentication tag
message = AES-GCM-Open(K, nonce, C, T)  Bob checks the tag, then reads it
```

"See the actual values" shows the real scalars, points, `Z` and `K` from your
session.

### Worth keeping straight

- **ECDH is key agreement, not message encryption.** It produces a shared
  secret; AES-GCM does the encrypting.
- **Private values stay local.** Only the public values (`Q_A`, `Q_B`) travel,
  and they're allowed to.
- **The shared secret is derived independently** on each side and is never sent.
- **Don't use the raw ECDH output directly as an AES key.** Pass it through a
  KDF such as HKDF first.
- **AES-GCM is authenticated encryption.** Bob verifies the tag before any
  plaintext is shown; a tampered packet yields nothing.
- **Eve here is a passive observer:** she sees and copies traffic.
  **ECDH by itself doesn't stop an active man-in-the-middle.** Real protocols
  also authenticate the public values, for example with certificates or
  signatures.

## How it's designed

The page is an authored interactive story, not a technical dashboard:

- cinematic, character-driven staging; the characters are participants, not icons
- **object continuity**: things move and transform rather than appearing
- **one dominant event per frame**
- a clear visual difference between what **stays private** and what **travels**
- the picture explains first; dialogue confirms what is already visible
- every blend is a visible transformation: two known colours, about a second of
  convergence, then the result
- a **Figma storyboard is the animation specification**, and production states
  carry the same frame labels for iteration and QA

## Development

| path | what it is |
|---|---|
| `src/app.tsx` | experience logic and scenes (café opening, the interactive, real WebCrypto) |
| `src/styles.css` | visual presentation and animation |
| `src/make.sh` | the build |
| `index.html` | **generated** deployed artefact: one self-contained file. Never edit it by hand |
| `tools/` | Playwright validation harnesses and the deployment smoke suite |
| `ship.sh` | validated deployment: rebuild, smoke-test, commit, push, confirm Pages |
| `CLAUDE.md` | detailed operating instructions for Claude Code |
| `HANDOFF.md` | architecture and handoff notes |

```bash
cd src && ./make.sh          # build → ../index.html
open index.html              # preview; no server needed
```

**Iteration:** describe a change → update the storyboard if needed → implement
→ targeted validation → review → `ship it` → smoke test → GitHub Pages.

GitHub Pages deploys from `main`.
