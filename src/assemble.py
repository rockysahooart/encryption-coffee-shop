#!/usr/bin/env python3
"""Inline the stylesheet, React and the built app into the deployed file.

The output is the repository's root index.html — the artefact GitHub Pages
serves. It is generated: never edit it by hand.
"""
import pathlib

here = pathlib.Path(__file__).parent
out_path = here.parent / "index.html"

shell = (here / "shell.html").read_text(encoding="utf-8")
out = (shell
       .replace("@@STYLES@@", (here / "styles.css").read_text(encoding="utf-8"))
       .replace("@@REACT@@", (here / "vendor-react.js").read_text(encoding="utf-8"))
       .replace("@@REACTDOM@@", (here / "vendor-react-dom.js").read_text(encoding="utf-8"))
       .replace("@@APP@@", (here / "app.js").read_text(encoding="utf-8")))
out_path.write_text(out, encoding="utf-8")
print(f"built {out_path}  {len(out.encode('utf-8')) // 1024} KB")
