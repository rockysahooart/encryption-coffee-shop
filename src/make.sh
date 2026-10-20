#!/usr/bin/env bash
# Build the deployed file: compile app.tsx, then inline everything into
# ../index.html. Run it from anywhere; it cd's to its own directory.
set -e
cd "$(dirname "$0")"
npx esbuild app.tsx --jsx=transform --format=iife --target=es2019 --outfile=app.js --log-level=warning
python3 assemble.py
