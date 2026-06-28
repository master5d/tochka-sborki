# Blog CLI Scaffolder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `node` CLI that scaffolds a new blog post/note (component + both locale routes) and prints a paste-ready registry stub, cutting the per-entry boilerplate.

**Architecture:** A Node ESM script under `blog/scripts/` (the `fb.mjs` precedent), split into pure template builders (`templates.mjs`, unit-tested) and a thin CLI wrapper (`new-post.mjs`: arg parse, slug validation, existence guard, file writes, stdout). Vitest defaults pick up `blog/scripts/templates.test.mjs`.

**Tech Stack:** Node ESM (zero new deps), Vitest.

## Global Constraints

- Files under `blog/scripts/` (+ one `blog/package.json` line). Node ESM, zero new dependencies. Run tests from `blog/`: `cd blog && npx vitest run`.
- Pure builders in `templates.mjs` (tested); the CLI wrapper does fs + stdout only.
- The CLI refuses to overwrite existing files; slug must be kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`).
- Generated routes/components mirror the existing blog post pattern (default OG, `PostLayout`, `blog-prose.module.css`); `--kind note` produces a note variant.
- Does NOT edit `posts.ts` — prints a paste-ready stub. Emits TODO placeholders only (never fabricates prose).
- Trunk-based: commit directly to `main`, no feature branch, do not push.

---

### Task 1: pure template builders + tests

**Files:**
- Create: `blog/scripts/templates.mjs`
- Test: `blog/scripts/templates.test.mjs`

**Interfaces:**
- Produces: `componentName(slug) → string` (PascalCase); `componentSource(slug, kind='post') → string`; `routeSource(slug, locale) → string`; `registryStub(slug, kind='post') → string`. All consumed by Task 2's CLI.

- [ ] **Step 1: Write the failing tests**

Create `blog/scripts/templates.test.mjs`:

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

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd blog && npx vitest run scripts/templates.test.mjs`
Expected: FAIL — `Cannot find module './templates.mjs'`.

- [ ] **Step 3: Write the builders**

Create `blog/scripts/templates.mjs`:

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd blog && npx vitest run scripts/templates.test.mjs`
Expected: PASS — all builder tests green.

- [ ] **Step 5: Run the full blog suite (no regression)**

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green (the new `.test.mjs` is picked up by the default include).

- [ ] **Step 6: Commit**

```bash
git add blog/scripts/templates.mjs blog/scripts/templates.test.mjs
git commit -m "feat(blog): pure scaffolder templates (fb_2367bdbf2304 follow-on)"
```

---

### Task 2: CLI wrapper + npm script + smoke run

**Files:**
- Create: `blog/scripts/new-post.mjs`
- Modify: `blog/package.json`

**Interfaces:**
- Consumes: `componentName`, `componentSource`, `routeSource`, `registryStub` from `./templates.mjs` (Task 1).
- Produces: the `new:post` CLI (no unit test; smoke-validated).

- [ ] **Step 1: Write the CLI**

Create `blog/scripts/new-post.mjs`:

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

- [ ] **Step 2: Add the npm script**

In `blog/package.json`, add to the `scripts` object (after the existing `"test"` entry):

```json
    "new:post": "node scripts/new-post.mjs"
```

(Ensure valid JSON — the preceding line needs a trailing comma.)

- [ ] **Step 3: Smoke-run the CLI (note kind), verify, then clean up**

Run: `cd blog && node scripts/new-post.mjs smoke-test --kind note`
Expected: prints three `✓` lines + a registry stub containing `kind: 'note'`. Confirm the three files exist:

Run: `cd blog && ls components/blog/posts/smoke-test.tsx app/blog/smoke-test/page.tsx app/en/blog/smoke-test/page.tsx`
Expected: all three listed.

Then DELETE the generated sample (do not commit it):

Run: `cd blog && rm components/blog/posts/smoke-test.tsx && rm -r app/blog/smoke-test && rm -r app/en/blog/smoke-test`
Expected: removed. Verify nothing remains:

Run: `cd blog && git status --porcelain components/blog/posts/smoke-test.tsx app/blog/smoke-test app/en/blog/smoke-test`
Expected: empty output (no leftover sample files).

- [ ] **Step 4: Smoke-run the overwrite guard**

Run: `cd blog && node scripts/new-post.mjs prologue` (a slug whose component already exists)
Expected: a `✗ exists, refusing to overwrite` error and a non-zero exit; no files changed (`git status --porcelain` clean for blog/).

- [ ] **Step 5: Full suite (no regression)**

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green; no smoke-test artifacts present.

- [ ] **Step 6: Commit**

```bash
git add blog/scripts/new-post.mjs blog/package.json
git commit -m "feat(blog): new:post CLI scaffolder (fb_2367bdbf2304 follow-on)"
```

---

## Self-Review

**Spec coverage:**
- `templates.mjs` pure builders (componentName / componentSource / routeSource / registryStub) → Task 1 (Step 3). ✓
- `templates.test.mjs` (PascalCase; post vs note component; ru vs en route; note vs post stub) → Task 1 (Step 1). ✓
- `new-post.mjs` CLI (arg parse + kebab validation + existence guard + writes + stub print) → Task 2 (Step 1). ✓
- `package.json` `new:post` alias → Task 2 (Step 2). ✓
- CLI smoke-run validation + cleanup (no committed sample) → Task 2 (Steps 3–4). ✓
- Zero deps, no posts.ts edit, no overwrite, TODO-only → respected throughout. ✓
- Carve (no auto-insert / OG file / MDX / prompts / LMS-hub CLI) → nothing added. ✓

**Placeholder scan:** the `TODO` strings are the CLI's intended output (the scaffold's placeholders), not plan gaps; every plan step has full code/commands. No `TBD`/"implement later" in the plan itself.

**Type consistency:** the four builder names (`componentName`, `componentSource`, `routeSource`, `registryStub`) are defined in Task 1 and imported byte-identically in Task 2's CLI. `componentSource(slug, kind)` / `registryStub(slug, kind)` take `kind`; `routeSource(slug, locale)` takes `locale` — matching the CLI's call sites. The kebab regex in the CLI matches the one in Global Constraints. ✓
