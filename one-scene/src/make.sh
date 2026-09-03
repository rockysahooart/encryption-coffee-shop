#!/usr/bin/env bash
# The only build command. esbuild strips the types (it does not check them);
# the types document the data shapes rather than guard them.
set -e
cd "$(dirname "$0")"
npx esbuild app.tsx --jsx=transform --format=iife --target=es2019 --outfile=app.js --log-level=warning
python3 assemble.py
