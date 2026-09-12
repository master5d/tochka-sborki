# pwsh hub/scripts/cover-kv.test.ps1 — exits 1 on the first failed case.
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'cover-kv.ps1')
$fail = 0
function Case($name, [scriptblock]$body) { try { & $body; "ok   $name" } catch { "FAIL $name :: $_"; $script:fail++ } }
function Throws($code, $text) { try { Resolve-KvGet $code $text | Out-Null } catch { return }; throw 'expected a throw' }
Case 'value is returned'           { if ((Resolve-KvGet 0 '{"active":"floor"}') -ne '{"active":"floor"}') { throw 'value' } }
Case 'exit 0 "Value not found"'    { if ((Resolve-KvGet 0 'Value not found') -notmatch 'no key') { throw 'nokey' } }
Case 'API key-not-found 10009'     { if ((Resolve-KvGet 1 "get: 'key not found' [code: 10009]") -notmatch 'no key') { throw 'nokey' } }
Case 'namespace not found throws'  { Throws 1 'A request to the Cloudflare API failed. namespace not found [code: 10013]' }
Case 'auth error throws'           { Throws 1 'Authentication error [code: 10000]' }
Case 'rate limit throws'           { Throws 1 'Rate limited [code: 10429]' }
if ($fail) { exit 1 }