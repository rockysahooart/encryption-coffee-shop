import base64, pathlib, sys
B = pathlib.Path(__file__).parent
def b64(p): return base64.b64encode((B/p).read_bytes()).decode()

FONTS = [
    ("Baloo 2", 700, "@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2"),
    ("Baloo 2", 800, "@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2"),
    ("Nunito",  400, "@fontsource/nunito/files/nunito-latin-400-normal.woff2"),
    ("Nunito",  700, "@fontsource/nunito/files/nunito-latin-700-normal.woff2"),
    ("IBM Plex Mono", 500, "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2"),
]
face = "\n".join(
    "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;"
    "src:url(data:font/woff2;base64,%s) format('woff2')}" % (fam, w, b64("node_modules/"+p))
    for fam, w, p in FONTS
)

css   = (B/"styles.css").read_text()
app   = (B/"app.js").read_text()
react = (B/"node_modules/react/umd/react.production.min.js").read_text()
rdom  = (B/"node_modules/react-dom/umd/react-dom.production.min.js").read_text()

html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>One Scene, One Camera — Diffie–Hellman at the coffee shop</title>
<style>
{face}
{css}
</style>
</head>
<body>
<div id="root"></div>
<script>{react}</script>
<script>{rdom}</script>
<script>
{app}
</script>
</body>
</html>
"""
out = B/"storyboard.html"
out.write_text(html)
print("built storyboard.html  %.0f KB" % (out.stat().st_size/1024))
