# One-shot local encoder for the quest page. Not run in CI: outputs are committed.
# Requires: Python 3 with Pillow (NAUTILUS venv or system Python already has it).
#
# Wave C: the seven scenes now ship as two states each — day and night, both the
# world-v3 tall (848x1264) art — and the old horizontal loops are retired (they
# don't fit the tall frame; Wave E regenerates loops for it). This script no
# longer touches ffmpeg or the guide cut-outs; guides were a one-time asset.
param(
  [string]$Media = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v3'
)
$ErrorActionPreference = 'Stop'
$hub = Split-Path -Parent $PSScriptRoot
$out = Join-Path $hub 'public\quest'
New-Item -ItemType Directory -Force (Join-Path $out 'scenes') | Out-Null

$ids = '01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'
$states = 'day', 'night'

# 1. Scenes → WebP q82 (Pillow keeps the native 848x1264 frame; no resize).
$py = @"
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
Image.open(src).convert('RGB').save(dst, 'WEBP', quality=82, method=6)
"@
$pyFile = Join-Path $env:TEMP 'quest-webp.py'
Set-Content -Path $pyFile -Value $py -Encoding UTF8
foreach ($id in $ids) {
  foreach ($state in $states) {
    python $pyFile (Join-Path $Media "$id-$state.png") (Join-Path $out "scenes\$id-$state.webp")
  }
}

# 2. Retire the Wave A/B horizontal scenes and their loops: two asset sets under
#    public/ would be two sources of truth (spec §6, "решения оператора").
foreach ($id in $ids) {
  $oldScene = Join-Path $out "scenes\$id.webp"
  if (Test-Path $oldScene) { Remove-Item $oldScene }
  $oldLoop = Join-Path $out "loops\$id.mp4"
  if (Test-Path $oldLoop) { Remove-Item $oldLoop }
}
$loopsDir = Join-Path $out 'loops'
if ((Test-Path $loopsDir) -and ((Get-ChildItem $loopsDir -File).Count -eq 0)) { Remove-Item $loopsDir -Recurse }

Get-ChildItem $out -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
