# Encryption at the coffee shop

An interactive, single-frame explainer: what actually happens between your
laptop and your mail server when you open your inbox on café Wi-Fi.

**ACCESS → AGREE → PROTECT**

- **Access** — find an unsecured network, join it, clear the captive portal, get online.
- **Agree** — Email proves its identity with a public/private key pair, then both
  sides run a Diffie–Hellman exchange: private values stay home, public values cross,
  and both ends derive the same secret without ever sending it.
- **Protect** — symmetric session keys encrypt the message before it leaves, so
  another device on the network sees only ciphertext.

Single file, no dependencies, no build step. Vanilla HTML/CSS/JS, dark mode,
responsive from 1440×900 down to 360×800, and `prefers-reduced-motion` aware.

## Local

Open `index.html` in a browser. That's it.

## Deploy

GitHub Pages serves `index.html` from the repository root.
Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
