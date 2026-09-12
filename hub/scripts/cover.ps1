# Home-page cover switch (spec 2026-09-11-site-covers-floor-ab).
# Owner's command only: status | ab <cover> <share> | promote <cover> | rollback.
#
#   pwsh hub/scripts/cover.ps1 -Env preview status
#   pwsh hub/scripts/cover.ps1 -Env production -ConfirmProduction ab trend-adweek-2026-09 20
#
# Writes the `config` key of the SITE_COVER KV namespace through wrangler: no
# rebuild, live in seconds. The namespace id is NOT an argument: it is read from
# hub/wrangler.toml for the chosen -Env (top-level [[kv_namespaces]] = production,
# [[env.preview.kv_namespaces]] = preview), so a preview run cannot reach the
# production namespace by a pasted id. Production writes also need -ConfirmProduction.
param(
  [Parameter(Mandatory)][ValidateSet('preview', 'production')][string]$Env,
  [Parameter(Mandatory, Position = 0)][ValidateSet('status', 'ab', 'promote', 'rollback')][string]$Action,
  [Parameter(Position = 1)][string]$Cover,
  [Parameter(Position = 2)][int]$Share = -1,
  [switch]$ConfirmProduction
)
$ErrorActionPreference = 'Stop'
$known = @('floor', 'trend-adweek-2026-09') # mirror of hub/lib/covers.ts
$toml = Join-Path $PSScriptRoot '..\wrangler.toml'

# Minimal reader for the two shapes this file uses: [section] / [[array]] headers
# and `key = "value"` lines. Returns per-env vars and the SITE_COVER namespace id.
function Read-WranglerConfig {
  $cfg = @{ production = @{ vars = @{}; kv = $null }; preview = @{ vars = @{}; kv = $null } }
  $section = ''
  $binding = $null; $id = $null
  $flush = {
    if ($section -match 'kv_namespaces$' -and $binding -eq 'SITE_COVER' -and $id) {
      $target = if ($section -like 'env.preview.*') { 'preview' } else { 'production' }
      $cfg[$target].kv = $id
    }
  }
  foreach ($line in Get-Content $toml) {
    $l = ($line -replace '#.*$', '').Trim()
    if ($l -match '^\[\[?([^\]]+)\]\]?$') { & $flush; $section = $Matches[1]; $binding = $null; $id = $null; continue }
    if ($l -match '^(\w+)\s*=\s*"(.*)"$') {
      $k = $Matches[1]; $v = $Matches[2]
      if ($section -match 'kv_namespaces$') { if ($k -eq 'binding') { $binding = $v } elseif ($k -eq 'id') { $id = $v } }
      elseif ($section -eq 'vars') { $cfg.production.vars[$k] = $v }
      elseif ($section -eq 'env.preview.vars') { $cfg.preview.vars[$k] = $v }
    }
  }
  & $flush
  return $cfg
}

function Invoke-Wrangler([string[]]$argv) {
  $out = & npx --yes wrangler @argv 2>&1 | ForEach-Object { "$_" }
  return @{ code = $LASTEXITCODE; text = ($out -join "`n") }
}

. (Join-Path $PSScriptRoot 'cover-kv.ps1')

function Get-KvConfig([string]$id) {
  $r = Invoke-Wrangler @('kv', 'key', 'get', 'config', '--namespace-id', $id, '--remote')
  return Resolve-KvGet $r.code $r.text
}

# Refuse before touching anything remote.
if ($Action -ne 'status' -and $Env -eq 'production' -and -not $ConfirmProduction) {
  throw 'production write refused: pass -ConfirmProduction (owner command only)'
}

$cfg = Read-WranglerConfig
$mine = $cfg[$Env]
Write-Host "[$Env] wrangler.toml vars: COVER_CONFIG=$($mine.vars['COVER_CONFIG'] ?? '(unset)')  COVER_DEFAULT=$($mine.vars['COVER_DEFAULT'] ?? '(unset)')"
if ($mine.kv) {
  Write-Host "[$Env] SITE_COVER namespace $($mine.kv): $(Get-KvConfig $mine.kv)"
  Write-Host "[$Env] live source: KV (overrides COVER_CONFIG)"
} else {
  $src = if ($mine.vars['COVER_CONFIG']) { 'COVER_CONFIG' } elseif ($mine.vars['COVER_DEFAULT']) { 'COVER_DEFAULT' } else { 'none -> floor' }
  Write-Host "[$Env] SITE_COVER: not bound in wrangler.toml; live source: $src"
}
if ($Action -eq 'status') { exit 0 }

if (-not $mine.kv) {
  throw "no SITE_COVER namespace bound for '$Env' in wrangler.toml: switching today means editing COVER_CONFIG and redeploying (owner's command); creating a namespace is the owner's call"
}

switch ($Action) {
  'ab' {
    if ($known -notcontains $Cover -or $Cover -eq 'floor') { throw "unknown trend cover '$Cover'" }
    if ($Share -lt 0 -or $Share -gt 100) { throw 'share must be 0..100' }
    $json = @{ active = 'floor'; ab = @{ cover = $Cover; share = $Share } } | ConvertTo-Json -Compress
  }
  'promote' {
    if ($known -notcontains $Cover) { throw "unknown cover '$Cover'" }
    $json = @{ active = $Cover } | ConvertTo-Json -Compress
  }
  'rollback' { $json = @{ active = 'floor' } | ConvertTo-Json -Compress }
}
$r = Invoke-Wrangler @('kv', 'key', 'put', 'config', $json, '--namespace-id', $mine.kv, '--remote')
if ($r.code -ne 0) { throw "wrangler kv key put failed (exit $($r.code)):`n$($r.text)" }
Write-Host "[$Env] after:  $(Get-KvConfig $mine.kv)"