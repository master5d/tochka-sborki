# One-shot local encoder for the quest page. Not run in CI: outputs are committed.
# Requires: ffmpeg 8 (winget Gyan.FFmpeg), Python 3 with Pillow + numpy, NAUTILUS checkout
# (pool.py with --tier edit / --key lives on NAUTILUS origin/main; pass -Pool to a copy if the
# working tree sits on another branch).
param(
  [string]$Media = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v2',
  [string]$Pool  = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\image-pool\pool.py',
  [switch]$SkipGuides
)
$ErrorActionPreference = 'Stop'
$hub = Split-Path -Parent $PSScriptRoot
$out = Join-Path $hub 'public\quest'
foreach ($d in 'scenes', 'loops', 'guides') { New-Item -ItemType Directory -Force (Join-Path $out $d) | Out-Null }

$ids = '01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'

# 1. Scenes → WebP q82 (Pillow keeps the 1264×848 frame; no resize).
$py = @"
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
Image.open(src).convert('RGB').save(dst, 'WEBP', quality=82, method=6)
"@
$pyFile = Join-Path $env:TEMP 'quest-webp.py'
Set-Content -Path $pyFile -Value $py -Encoding UTF8
foreach ($id in $ids) {
  python $pyFile (Join-Path $Media "scenes\$id.png") (Join-Path $out "scenes\$id.webp")
}

# 2. Loops → H.264, no audio, faststart. Source is CRF 0 (≈1.4 MB); target ≤ 900 KB.
foreach ($id in $ids) {
  $src = Join-Path $Media "loops\$id\loop.mp4"
  $dst = Join-Path $out "loops\$id.mp4"
  ffmpeg -y -loglevel error -i $src -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart $dst
  $size = (Get-Item $dst).Length
  if ($size -gt 900KB) {
    ffmpeg -y -loglevel error -i $src -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart $dst
  }
}

# 3. Guides → generation on flat magenta, then chroma key → RGBA, then fit height 512.
if (-not $SkipGuides) {
  $env:LITELLM_KEY = [Environment]::GetEnvironmentVariable('LITELLM_KEY', 'User')
  $guides = @(
    @{ name = 'scroller'; ref = 'charA-sheet-v2.png';
       prompt = 'The Scroller: a plump mint-green cushion creature with Moebius hatching, big Rick-and-Morty eyes, pink cheeks and stubby legs, holding a glowing smartphone with a cosmic screen. Full body, standing, facing the viewer, centered, on a flat solid magenta #FF00FF background, nothing else in the frame. Cel-shaded flat cartoon, thin dark-brown outline, no text, no watermark.' },
    @{ name = 'builder'; ref = 'charB-girl-v3.png';
       prompt = 'The Builder: a young woman in clean modern anime style, copper-red wavy loose hair, green eyes, yellow hard hat with goggles pushed up, orange-and-cream striped sweater, dark teal work shorts with a hammer loop, brown boots, big teal backpack with a wrench. Full body, standing, facing the viewer, centered, on a flat solid magenta #FF00FF background, nothing else in the frame. Cel-shaded flat cartoon, thin dark-brown outline, no text, no watermark.' }
  )
  $py2 = @"
import sys
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
# The edit model mirrors the reference sheet (front/side/back). Keep only the
# leftmost figure: split on fully transparent columns, take the first run
# wider than 10% of the image (narrower runs are stray specks from the key).
alpha = np.asarray(im)[:, :, 3]
cols = alpha.max(axis=0) > 0
runs, start = [], None
for x, on in enumerate(list(cols) + [False]):
    if on and start is None: start = x
    if not on and start is not None: runs.append((start, x)); start = None
figure = next((r for r in runs if r[1] - r[0] > im.width * 0.1), (0, im.width))
im = im.crop((figure[0], 0, figure[1], im.height))
im = im.crop(im.getbbox())
h = 512
im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
# Palette PNG (256 colours incl. alpha) keeps a cel-shaded cut-out under 200 KB.
im.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(dst, 'PNG', optimize=True)
"@
  $py2File = Join-Path $env:TEMP 'quest-guide-fit.py'
  Set-Content -Path $py2File -Value $py2 -Encoding UTF8
  foreach ($g in $guides) {
    $raw = Join-Path $env:TEMP "quest-$($g.name)-magenta.png"
    $rgba = Join-Path $env:TEMP "quest-$($g.name)-rgba.png"
    python $Pool --tier edit --ref (Join-Path $Media $g.ref) --prompt $g.prompt --size 1024x1024 --out $raw
    python $Pool --key $raw --bg '#FF00FF' --out $rgba
    python $py2File $rgba (Join-Path $out "guides\$($g.name).png")
  }
}

Get-ChildItem $out -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
