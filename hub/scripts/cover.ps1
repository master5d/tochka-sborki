# Home-page cover switch (spec 2026-09-11-site-covers-floor-ab).
# Owner's command only: status | ab <cover> <share> | promote <cover> | rollback.
#
#   pwsh hub/scripts/cover.ps1 -Env preview status
#   pwsh hub/scripts/cover.ps1 -Env production -NamespaceId <id> ab trend-adweek-2026-09 20
#
# Writes the `config` key of the SITE_COVER KV namespace through wrangler: no
# rebuild, live in seconds. Production has no namespace yet (the deploy token
# cannot create KV) — until the owner orders one, -Env production refuses.
param(
  [Parameter(Mandatory)][ValidateSet('preview', 'production')][string]$Env,
  [string]$NamespaceId,
  [Parameter(Mandatory, Position = 0)][ValidateSet('status', 'ab', 'promote', 'rollback')][string]$Action,
  [Parameter(Position = 1)][string]$Cover,
  [Parameter(Position = 2)][int]$Share = -1
)
$ErrorActionPreference = 'Stop'
$known = @('floor', 'trend-adweek-2026-09') # mirror of hub/lib/covers.ts

if (-not $NamespaceId) {
  throw "no SITE_COVER namespace id for '$Env': pass -NamespaceId (none exists yet; creating one is the owner's call)"
}

function Get-Config {
  $raw = npx --yes wrangler kv key get config --namespace-id $NamespaceId --remote 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $raw) { return '(no key: middleware default)' }
  return ($raw -join "`n")
}

$before = Get-Config
Write-Host "[$Env] before: $before"
if ($Action -eq 'status') { exit 0 }

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
npx --yes wrangler kv key put config $json --namespace-id $NamespaceId --remote
if ($LASTEXITCODE -ne 0) { throw 'wrangler kv key put failed' }
Write-Host "[$Env] after:  $(Get-Config)"
