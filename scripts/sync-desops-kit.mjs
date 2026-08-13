#!/usr/bin/env node
// Sync the @desops/ui-kit source from its home in NAUTILUS into vendor/.
// Source of truth stays in NAUTILUS/core/desops/ui-kit; this copies the
// consumable source (no node_modules, no lockfile) so CI's `npm ci` in hub/
// can resolve the file: dependency inside the repo clone.
// Usage: node scripts/sync-desops-kit.mjs
import { cpSync, rmSync, mkdirSync, existsSync, renameSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(repoRoot, '..', 'NAUTILUS', 'core', 'desops', 'ui-kit')
// Inside hub/ so Node/Turbopack module resolution from the vendored source
// walks up into hub/node_modules, where npm installs the kit's dependencies.
const dest = join(repoRoot, 'hub', 'vendor', 'desops-ui-kit')

if (!existsSync(src)) {
  console.error(`source kit not found: ${src}`)
  process.exit(1)
}

// Build into a tmp dir first; the existing vendor copy is only replaced
// after every entry has landed there — a half-failed sync must not destroy it.
const tmp = `${dest}.tmp-${process.pid}`
rmSync(tmp, { recursive: true, force: true })
mkdirSync(tmp, { recursive: true })

const ENTRIES = [
  'components',
  'hooks',
  'lib',
  'index.ts',
  'globals.css',
  'tailwind-theme.ts',
  'tailwind.config.ts',
  'package.json',
]

const failures = []
for (const entry of ENTRIES) {
  const from = join(src, entry)
  if (!existsSync(from)) {
    console.error(`missing in source: ${entry}`)
    failures.push(entry)
    continue
  }
  try {
    cpSync(from, join(tmp, entry), { recursive: true })
    console.log(`synced ${entry}`)
  } catch (err) {
    console.error(`copy failed: ${entry}: ${err.message}`)
    failures.push(entry)
  }
}

if (failures.length > 0) {
  rmSync(tmp, { recursive: true, force: true })
  console.error(`\nsync failed (${failures.length}): ${failures.join(', ')} — ${dest} left untouched`)
  process.exit(1)
}

// tmp build proven complete — swap it into place.
mkdirSync(dirname(dest), { recursive: true })
rmSync(dest, { recursive: true, force: true })
renameSync(tmp, dest)

console.log(`\nhub/vendor/desops-ui-kit refreshed from ${src}`)
