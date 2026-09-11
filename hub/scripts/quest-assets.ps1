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
#
# Wave K: parallax plates. A prior task split each accepted scene along its
# natural sky/land seam into `plates/<id>-<state>-{sky,land}.webp` + a
# `manifest.json` carrying per-frame `horizon_row`/`feather`/`size`/`unsplit`
# (NAUTILUS `.worktrees/world-v3/.../plates/`). This script copies BOTH the
# manifest and the plate images for scenes whose day AND night frame split
# cleanly straight through — never hand-picks ids; `lib/quest/plates.ts`
# applies the same symmetry rule (both states `unsplit: false`) when reading
# the copied manifest at build/runtime, so a future re-split that flips a
# scene's `unsplit` flag changes what this script copies without an edit
# here. Ceiling per plate file is 1000 KB — plates are near-full-canvas WebP
# with an alpha channel (the seam feather), heavier than the opaque 400 KB
# scene posters; same weight class as the 900 KB loop videos.
param(
  [string]$Media = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v3',
  [string]$Loops = 'C:\telo\Efforts\Ongoing\NAUTILUS\.worktrees\world-v3\core\image-pool\worlds\mamaev-quest\loops-v3',
  [string]$Plates = 'C:\telo\Efforts\Ongoing\NAUTILUS\.worktrees\world-v3\core\desops\taste\_media\world-v3\plates',
  [string]$Outcomes = ''
)
$ErrorActionPreference = 'Stop'
$hub = Split-Path -Parent $PSScriptRoot
$out = Join-Path $hub 'public\quest'
New-Item -ItemType Directory -Force (Join-Path $out 'scenes') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $out 'roads') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $out 'loops') | Out-Null
New-Item -ItemType Directory -Force (Join-Path $out 'plates') | Out-Null

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

# 1d. Plates (Wave K) → public/quest/plates/, manifest.json + per-scene webp,
#     symmetry rule applied here from the manifest itself (never a hardcoded id list).
$manifestSrc = Join-Path $Plates 'manifest.json'
if (-not (Test-Path $manifestSrc)) {
  throw "plates manifest not found: $manifestSrc"
}
$manifest = Get-Content $manifestSrc -Raw | ConvertFrom-Json
$maxPlateBytes = 1000 * 1024
$byId = $manifest.scenes | Group-Object -Property id
$splitIds = @()
foreach ($g in $byId) {
  $frames = $g.Group
  $bothSplit = ($frames.Count -eq 2) -and (-not ($frames | Where-Object { $_.unsplit }))
  if ($bothSplit) { $splitIds += $g.Name }
}
foreach ($id in $splitIds) {
  foreach ($frame in ($byId | Where-Object { $_.Name -eq $id }).Group) {
    foreach ($layer in 'sky', 'land') {
      $fileName = $frame.$layer
      $src = Join-Path $Plates $fileName
      if (-not (Test-Path $src)) { throw "plate file missing: $src" }
      $dst = Join-Path $out "plates\$fileName"
      Copy-Item -Path $src -Destination $dst -Force
      $bytes = (Get-Item $dst).Length
      if ($bytes -gt $maxPlateBytes) {
        throw "$fileName is $bytes bytes, over the $maxPlateBytes byte plate ceiling"
      }
    }
  }
}
Copy-Item -Path $manifestSrc -Destination (Join-Path $out 'plates\manifest.json') -Force
Write-Host "plates: split scenes = $($splitIds -join ', ')"

# 1e. L2/L3 (2026-09-11): outcome illustrations + detour curtains, already web
#     WebP in NAUTILUS `core/image-pool/worlds/mamaev-quest/outcomes-v3/` (commit
#     6d333921; the main NAUTILUS tree may sit on another branch — pass -Outcomes
#     pointing at a checkout/archive of origin/main). Copied as-is (no re-encode),
#     renamed habit/detour → scroller/builder like the road strips; the generation
#     manifest stays in NAUTILUS (its prompt marks are not page copy).
if ($Outcomes) {
  New-Item -ItemType Directory -Force (Join-Path $out 'outcomes') | Out-Null
  New-Item -ItemType Directory -Force (Join-Path $out 'detours') | Out-Null
  $maxStillBytes = 250 * 1024
  foreach ($fork in $forks) {
    foreach ($state in $states) {
      foreach ($genId in $roadGuides.Keys) {
        $guide = $roadGuides[$genId]
        Copy-Item (Join-Path $Outcomes "outcome-$fork-$genId-$state.webp") (Join-Path $out "outcomes\$fork-$guide-$state.webp") -Force
      }
      Copy-Item (Join-Path $Outcomes "detour-$fork-$state.webp") (Join-Path $out "detours\$fork-$state.webp") -Force
    }
  }
  Get-ChildItem (Join-Path $out 'outcomes'), (Join-Path $out 'detours') -File | Where-Object { $_.Length -gt $maxStillBytes } | ForEach-Object {
    throw "$($_.Name) is $($_.Length) bytes, over the $maxStillBytes byte ceiling"
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
