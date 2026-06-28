# Blog CLI scaffolder — Design

**Ticket:** owner follow-on to `fb_2367bdbf2304` (blog KG Phase B): a CLI to scaffold a new blog
post or atomic note, cutting the per-entry boilerplate.

**Date:** 2026-06-28

## Goal

A `node` CLI that scaffolds the boilerplate files for a new blog post/note — the component + both
locale routes — and prints a ready registry stub to paste into `blog/lib/posts.ts`. Removes the
4-file friction that otherwise deters writing many atomic notes (the whole point of Phase B).

## Decision (owner, at design gate)

Registry handling: **print a paste-ready stub**, not auto-insert. The CLI generates the pure-template
files (component + 2 routes) and prints the `Post` literal for the owner to paste into the `posts`
array — safe (never mutates the TS source array, mirroring how `fb.mjs` appends rather than rewrites)
and not brittle.

## Scope (carved by honest triage)

A blog post/note = 4 files: a registry entry + a ru/en component + two route files. Three of those
(component, both routes) are pure template; the registry entry is a TS-array literal.

- **In scope:** pure template builders + a CLI that writes the component + both routes and prints the
  registry stub; a `--kind note` flag; an npm script alias; tests on the builders.
- **Out of scope (carved):**
  - Auto-inserting into `posts.ts` (brittle TS-array mutation — rejected).
  - A per-post OG file (the blog uses the default OG route).
  - Markdown/MDX notes (the blog's hand-authored TSX pattern stays).
  - Interactive prompts (args only).
  - Overwriting existing files (the CLI errors instead).
  - A CLI for the LMS/hub apps (blog only for now).

## Architecture

A Node ESM script under `blog/scripts/` (the `fb.mjs` precedent), split into **pure template
builders** (`templates.mjs`, unit-tested) and a thin **CLI wrapper** (`new-post.mjs`: arg parse,
slug validation, existence guard, file writes, stdout). Vitest (no blog config → defaults) picks up
`blog/scripts/templates.test.mjs`.

## Component

### `blog/scripts/templates.mjs` (new, pure)

```js
// blog/scripts/templates.mjs — pure source-string builders for `new-post.mjs`. No fs, fully testable.

/** kebab-case slug → PascalCase component name. 'nervous-strength' → 'NervousStrength'. */
export function componentName(slug) {
  return slug.split('-').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

/** ru+en post/note component skeleton (TODO placeholders; owner writes the prose). */
export function componentSource(slug, kind = 'post') {
  const name = componentName(slug)
  const ru = kind === 'note'
    ? `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: одно ядро заметки — короткая плотная мысль.'}</p>
        <p>{'TODO: 2–4 предложения. Свяжи плотно через related[] в posts.ts — это утолщает граф.'}</p>
      </div>`
    : `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — крючок эссе.'}</p>
        <h2>TODO: раздел 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 3</h2>
        <p>{'TODO'}</p>
      </div>`
  const en = kind === 'note'
    ? `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: one core idea — a short, dense thought.'}</p>
        <p>{'TODO: 2–4 sentences. Link densely via related[] in posts.ts — it thickens the graph.'}</p>
      </div>`
    : `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — the essay hook.'}</p>
        <h2>TODO: section 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 3</h2>
        <p>{'TODO'}</p>
      </div>`
  return `import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function ${name}({ locale }: Props) {
  if (locale === 'en') {
    return (
${en}
    )
  }

  return (
${ru}
  )
}
`
}

/** A blog route page (mirrors the existing post routes). locale = 'ru' | 'en'. */
export function routeSource(slug, locale) {
  const name = componentName(slug)
  const isEn = locale === 'en'
  const url = isEn ? `https://mamaev.coach/en/blog/${slug}/` : `https://mamaev.coach/blog/${slug}/`
  return `import type { Metadata } from 'next'
import { ${name} } from '@/components/blog/posts/${slug}'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'TODO: title'
const description = 'TODO: description'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: '${url}',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/${slug}/',
      'en-US': 'https://mamaev.coach/en/blog/${slug}/',
      'x-default': 'https://mamaev.coach/blog/${slug}/',
    },
  },
  openGraph: { title, description, url: '${url}', type: 'article', locale: '${isEn ? 'en_US' : 'ru_RU'}' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function ${name}Page${isEn ? 'En' : ''}() {
  return (
    <PostLayout post={getPost('${slug}')!} locale="${locale}">
      <${name} locale="${locale}" />
    </PostLayout>
  )
}
`
}

/** Paste-ready Post registry literal (TODO placeholders; date = today; kind line only for notes). */
export function registryStub(slug, kind = 'post') {
  const today = new Date().toISOString().slice(0, 10)
  const kindLine = kind === 'note' ? `\n    kind: 'note',` : ''
  return `  {
    slug: '${slug}',
    title: 'TODO',
    description: 'TODO',
    date: '${today}',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['TODO'],
    related: [],${kindLine}
    en: { title: 'TODO', description: 'TODO', readingTime: '~5 min' },
  },`
}
```

### `blog/scripts/templates.test.mjs` (new)

```js
import { describe, it, expect } from 'vitest'
import { componentName, componentSource, routeSource, registryStub } from './templates.mjs'

describe('componentName', () => {
  it('kebab → PascalCase', () => {
    expect(componentName('nervous-strength')).toBe('NervousStrength')
    expect(componentName('idea')).toBe('Idea')
  })
})

describe('componentSource', () => {
  it('post: exports the component, both locales, 3 sections', () => {
    const s = componentSource('my-essay', 'post')
    expect(s).toContain('export function MyEssay(')
    expect(s).toContain("if (locale === 'en')")
    expect(s).toContain('styles.lead')
    expect((s.match(/<h2>/g) ?? []).length).toBe(6) // 3 per locale
  })
  it('note: short body, dense-related reminder, no sections', () => {
    const s = componentSource('atom', 'note')
    expect(s).toContain('export function Atom(')
    expect(s).toContain('related[]')
    expect(s).not.toContain('<h2>')
  })
})

describe('routeSource', () => {
  it('ru route wires getPost + locale + ru_RU', () => {
    const s = routeSource('atom', 'ru')
    expect(s).toContain("getPost('atom')")
    expect(s).toContain('locale="ru"')
    expect(s).toContain('ru_RU')
    expect(s).toContain('export default function AtomPage(')
  })
  it('en route uses the /en/ url + En suffix + en_US', () => {
    const s = routeSource('atom', 'en')
    expect(s).toContain('https://mamaev.coach/en/blog/atom/')
    expect(s).toContain('export default function AtomPageEn(')
    expect(s).toContain('en_US')
  })
})

describe('registryStub', () => {
  it('note stub carries slug + kind', () => {
    const s = registryStub('atom', 'note')
    expect(s).toContain("slug: 'atom'")
    expect(s).toContain("kind: 'note'")
  })
  it('post stub omits the kind line', () => {
    expect(registryStub('essay', 'post')).not.toContain('kind:')
  })
})
```

### `blog/scripts/new-post.mjs` (new, CLI)

```js
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
```

### `blog/package.json` (modified)

Add to `scripts`:

```json
    "new:post": "node scripts/new-post.mjs"
```

Run: `npm run new:post -- atomic-idea --kind note`.

## Data flow

Dev-time only. The CLI reads args, writes three source files under `blog/`, and prints the registry
stub + next-steps to stdout. The owner pastes the stub into `posts.ts` and fills the TODOs. Nothing
runs at build/runtime; the generated files are ordinary blog source.

## Authenticity (binding)

- The scaffolder emits TODO placeholders only — it never fabricates prose or titles; the owner writes
  all content (consistent with the owner-voiced blog).

## Testing

- `blog/scripts/templates.test.mjs`: `componentName` PascalCase; `componentSource` post (export +
  both locales + 3 sections) vs note (short body + related reminder + no `<h2>`); `routeSource` ru
  (getPost + ru_RU) vs en (/en/ url + `En` suffix + en_US); `registryStub` note (slug + kind) vs
  post (no kind line).
- CLI wiring validated by a smoke run during implementation: run it on a throwaway slug, confirm the
  three files are created and match the templates, then delete them (do NOT commit the sample).

Run: `cd blog && npx vitest run scripts/templates.test.mjs` (and the full suite stays green).

## Global constraints

- Files under `blog/scripts/` (+ one `package.json` line). Node ESM, zero new dependencies.
- Pure builders in `templates.mjs` (tested); the CLI wrapper does fs + stdout only.
- The CLI refuses to overwrite existing files; slug must be kebab-case.
- Generated routes/components mirror the existing blog post pattern (default OG, `PostLayout`,
  `blog-prose.module.css`).
- Does not edit `posts.ts` — prints a paste-ready stub.

## Files

| File | Responsibility |
|---|---|
| `blog/scripts/templates.mjs` | pure source builders (componentName / componentSource / routeSource / registryStub) |
| `blog/scripts/templates.test.mjs` | unit tests for the builders |
| `blog/scripts/new-post.mjs` | CLI: arg parse + slug validation + existence guard + writes + stub print |
| `blog/package.json` | `new:post` script alias |

## Out of scope

- Auto-inserting into `posts.ts`; per-post OG file; markdown/MDX notes; interactive prompts;
  overwriting; LMS/hub CLIs.
