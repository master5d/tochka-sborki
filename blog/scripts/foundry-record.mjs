#!/usr/bin/env node
// blog/scripts/foundry-record.mjs — record new blog posts as distributions in Logos Foundry.
// Run by CI (deploy-hub) after a successful deploy, for post routes ADDED by the push:
//   node blog/scripts/foundry-record.mjs <slug>...        (env LOGOS_BASE, LOGOS_INGEST_TOKEN)
//   node blog/scripts/foundry-record.mjs --dry <slug>...  (plan only, no network)
//
// The Foundry piece id and the public URL come from the post record in lib/posts.ts
// (`foundryPiece`, `postUrl`), never derived from the slug: the blog slug and the Foundry
// slug may differ (piece #297: Foundry slug is length-truncated with a trailing dash).
// Foundry's POST /api/distributions is idempotent on (piece, channel, url), so a re-run
// returns the existing row instead of creating a duplicate.
import { pathToFileURL, fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/** Pure: decide what to record for each slug. */
export function planRecords(slugs, posts, postUrl) {
  return slugs.map((slug) => {
    const post = posts.find((p) => p.slug === slug)
    if (!post) return { slug, action: 'skip', reason: 'no post record in lib/posts.ts' }
    if (!Number.isInteger(post.foundryPiece))
      return { slug, action: 'skip', reason: 'post has no foundryPiece — not born in Logos Foundry, nothing to record' }
    return { slug, action: 'record', pieceId: post.foundryPiece, url: postUrl(slug, 'ru') }
  })
}

async function record(base, token, item) {
  const res = await fetch(`${base}/api/distributions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ pieceId: item.pieceId, channel: 'blog', url: item.url, status: 'published' }),
    signal: AbortSignal.timeout(20000),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`distribution write failed for ${item.slug}: HTTP ${res.status} ${body.error ?? ''}`.trim())
  return body
}

async function main() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry')
  const slugs = args.filter((a) => a !== '--dry')
  const here = dirname(fileURLToPath(import.meta.url))
  const { posts, postUrl } = await import(pathToFileURL(join(here, '..', 'lib', 'posts.ts')).href)
  const plan = planRecords(slugs, posts, postUrl)
  const base = process.env.LOGOS_BASE ?? 'https://logos-foundry.sovern.workers.dev'
  const token = process.env.LOGOS_INGEST_TOKEN
  if (!dry && plan.some((p) => p.action === 'record') && !token) {
    console.error('LOGOS_INGEST_TOKEN is not configured')
    process.exit(1)
  }
  for (const item of plan) {
    if (item.action === 'skip') {
      // GitHub annotation: visible in the run summary, does not fail the deploy.
      console.log(`::warning::Foundry record skipped for ${item.slug}: ${item.reason}`)
      continue
    }
    if (dry) {
      console.log(`[dry] would record piece ${item.pieceId} → blog ${item.url}`)
      continue
    }
    const row = await record(base, token, item)
    console.log(row.existing
      ? `Foundry distribution already recorded: #${row.id} (piece ${item.pieceId}, blog)`
      : `Foundry distribution recorded: #${row.id} (piece ${item.pieceId}, blog)`)
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  })
}
