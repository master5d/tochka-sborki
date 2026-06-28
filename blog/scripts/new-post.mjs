#!/usr/bin/env node
// blog/scripts/new-post.mjs — scaffold a new blog post/note.
// Usage: node scripts/new-post.mjs <slug> [--kind note]   (run from blog/, or via `npm run new:post`)
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { componentName, componentSource, routeSource, registryStub } from './templates.mjs'

const BLOG = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const slug = args.find(a => !a.startsWith('--'))
const kind = args.includes('--kind') && args[args.indexOf('--kind') + 1] === 'note' ? 'note' : 'post'

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: node scripts/new-post.mjs <kebab-slug> [--kind note]')
  process.exit(1)
}

const targets = [
  { path: join(BLOG, 'components/blog/posts', `${slug}.tsx`), body: componentSource(slug, kind) },
  { path: join(BLOG, 'app/blog', slug, 'page.tsx'), body: routeSource(slug, 'ru') },
  { path: join(BLOG, 'app/en/blog', slug, 'page.tsx'), body: routeSource(slug, 'en') },
]

for (const t of targets) {
  if (existsSync(t.path)) { console.error(`✗ exists, refusing to overwrite: ${t.path}`); process.exit(1) }
}
for (const t of targets) {
  mkdirSync(dirname(t.path), { recursive: true })
  writeFileSync(t.path, t.body)
  console.log(`✓ ${t.path.slice(BLOG.length + 1)}`)
}

console.log(`\n→ Paste into blog/lib/posts.ts (the \`posts\` array), then fill the TODOs:\n`)
console.log(registryStub(slug, kind))
console.log(`\nComponent: ${componentName(slug)} — write the prose; for notes, add dense related[] slugs.`)
