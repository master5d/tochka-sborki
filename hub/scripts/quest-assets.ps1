# One-shot local encoder for the quest page. Not run in CI: outputs are committed.
# Requires: Python 3 with Pillow (NAUTILUS venv or system Python already has it).
#
# Wave C: the seven scenes now ship as two states each — day and night, both the
# world-v3 tall (848x1264) art — and the old horizontal loops are retired (they
# don't fit the tall frame; Wave E regenerates loops for it). This script no
# longer touches ffmpeg or the guide cut-outs; guides were a one-time asset.
#
# Wave D: three forks each split into a habit road (Scroller) and a detour
# (Builder) — 12 narrow vertical strips (768x1536, world-v3/roads/) encoded to
# `public/quest/roads/<fork>-<guide>-<state>.webp`. Source filenames use
# habit/detour (the generation ids); the site registry (`roadStrip`) keys by
# `guide` (scroller/builder) instead, matching `PathBlock.guide` — this script
# is the one place that translates between the two vocabularies.
#
# Wave E: 14 loops (7 scenes × day/night), built and rendered in NAUTILUS
# `core/image-pool/worlds/mamaev-quest/loops-v3/<id>-<state>/loop.mp4`. This
# script remuxes each with `-movflags +faststart` (a `-c copy` remux, so the
# encoded bytes — and the exact frame-0/frame-239 seam already verified by
# `verify-batch.py` in that folder — are untouched) into
# `public/quest/loops/<id>-<state>.mp4` and asserts the 900 KB ceiling holds
# after the remux (faststart only moves the moov atom; it does not re-encode).
param(
  [string]$Media = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v3',
  [string]$Loops = 'C:\telo\Efforts\Ongoing\NAUTILUS\.worktrees\world-v3\core\image-pool\worlds\mamaev-quest\loops-v3'
)
$ErrorActionPreference = 'Stop'
$hub = Split-Path -Parent $PSScriptRoot
$out = Join-Path $hub 'public\quest'
New-Item -ItemType Directory -Force (Join-Path $out 'scenes') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $out 'roads') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $out 'loops') | Out-Null

$ids = '01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'
$states = 'day', 'night'
$forks = 'boulder', 'temple', 'gates'
# generation id (habit/detour) → site guide (scroller/builder)
$roadGuides = @{ habit = 'scroller'; detour = 'builder' }

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

# 1b. Road strips → WebP q82 (native 768x1536, no resize), roads/<fork>-<guide>-<state>.webp.
$roadsMedia = Join-Path $Media 'roads'
foreach ($fork in $forks) {
  foreach ($genId in $roadGuides.Keys) {
    $guide = $roadGuides[$genId]
    foreach ($state in $states) {
      python $pyFile (Join-Path $roadsMedia "$fork-$genId-$state.png") (Join-Path $out "roads\$fork-$guide-$state.webp")
    }
  }
}

# 1c. Loops (Wave E) → hub/public/quest/loops/<id>-<state>.mp4, faststart remux.
$maxLoopBytes = 900 * 1024
foreach ($id in $ids) {
  foreach ($state in $states) {
    $src = Join-Path $Loops "$id-$state\loop.mp4"
    $dst = Join-Path $out "loops\$id-$state.mp4"
    if (-not (Test-Path $src)) {
      Write-Warning "missing loop source, skipping: $src"
      continue
    }
    ffmpeg -y -v error -i $src -movflags +faststart -c copy $dst
    if (-not (Test-Path $dst) -or (Get-Item $dst).Length -eq 0) {
      throw "faststart remux produced an empty file for $id-$state"
    }
    $bytes = (Get-Item $dst).Length
    if ($bytes -gt $maxLoopBytes) {
      throw "$id-$state loop.mp4 is $bytes bytes, over the $maxLoopBytes byte ceiling"
    }
  }
}

# 2. Retire the Wave A/B horizontal scenes: two asset sets under public/ would
#    be two sources of truth (spec §6, "решения оператора").
foreach ($id in $ids) {
  $oldScene = Join-Path $out "scenes\$id.webp"
  if (Test-Path $oldScene) { Remove-Item $oldScene }
  $oldLoop = Join-Path $out "loops\$id.mp4"
  if (Test-Path $oldLoop) { Remove-Item $oldLoop }
}

Get-ChildItem $out -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
