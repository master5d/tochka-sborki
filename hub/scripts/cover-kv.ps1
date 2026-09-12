# Reading of `wrangler kv key get` output for cover.ps1, kept apart so it can be
# tested without a network (cover-kv.test.ps1). A missing KEY is normal (the
# middleware then uses its default); a missing NAMESPACE or any other failure is
# an error and must never be reported as "no key".
function Resolve-KvGet([int]$code, [string]$text) {
  if ($text -match '(?i)namespace' -and $text -match '(?i)not found|does not exist|\b10013\b') {
    throw "SITE_COVER namespace not found (exit $code):`n$text"
  }
  if ($code -eq 0) {
    if ($text -match '^\s*Value not found') { return '(no key: middleware default)' }
    return $text
  }
  if ($text -match '\b10009\b' -or $text -match "(?i)key not found") { return '(no key: middleware default)' }
  throw "wrangler kv key get failed (exit $code):`n$text"
}