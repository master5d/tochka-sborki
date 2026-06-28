# Blog Knowledge-Graph Phase B (engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the atomic-note engine to the blog: a `kind: 'note' | 'post'` split so notes participate in the knowledge graph (thickening edges) while the essay index/RSS/SEO-manifest stay essays-only. Engine ships dark (zero notes).

**Architecture:** A registry-field + getter change in `blog/lib/posts.ts` (`kind` field; `getAllPosts` filtered to essays; new `getGraphEntries` returning posts+notes), `GraphNode.kind` threaded through `buildGraph`, and the graph viz sizing note nodes smaller. No content seeded.

**Tech Stack:** Next.js (standalone `blog/` app, static export), TypeScript, Vitest.

## Global Constraints

- All files under `blog/` (standalone blog app). Static. Run tests: `cd blog && npx vitest run`. Build: `cd blog && npm run build`.
- `kind` is optional, default `'post'` — existing posts byte-identical, no per-post edit.
- Additive: index/RSS/manifest keep calling `getAllPosts` (now essays-only via the new filter); only the graph switches to `getGraphEntries`. Edges, layout, colours unchanged.
- Bilingual: notes respect the same en-locale gating as posts in both getters.
- Engine dark: zero notes seeded (content is owner-written).
- Carve: no note content, no `/blog/notes` index, no tag-derived edges, no layout/physics change, no graph copy change.

---

### Task 1: `kind` field + essays/graph getter split

**Files:**
- Modify: `blog/lib/posts.ts`
- Test: `blog/lib/posts.test.ts` (extend)

**Interfaces:**
- Consumes: the existing `Post` type + `posts` array + `Locale`.
- Produces: `Post.kind?: 'note' | 'post'`; `getAllPosts(locale, source)` (now essays-only); `getGraphEntries(locale: Locale = 'ru', source: Post[] = posts): Post[]` (posts + notes), consumed by Task 2's graph viz.

- [ ] **Step 1: Add the failing tests**

In `blog/lib/posts.test.ts`, import `getGraphEntries` (add it to the existing import from `./posts`), then append inside the `describe('posts registry', ...)` block (before its closing `})`):

```ts
  it('getAllPosts excludes notes (essays only)', () => {
    const f = (slug: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay'), f('atom', 'note')]
    expect(getAllPosts('ru', set).map(p => p.slug)).toEqual(['essay'])
  })

  it('getGraphEntries includes both posts and notes (newest-first)', () => {
    const f = (slug: string, date: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date, author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay', '2026-01-01'), f('atom', '2026-02-01', 'note')]
    expect(getGraphEntries('ru', set).map(p => p.slug)).toEqual(['atom', 'essay'])
  })

  it('getGraphEntries drops drafts and respects the en locale', () => {
    const f = (slug: string, en?: { title: string; description: string; readingTime: string }, draft?: boolean): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind: 'note', en, draft,
    })
    const set = [f('a', { title: 'A', description: 'd', readingTime: '1' }), f('b'), f('c', undefined, true)]
    expect(getGraphEntries('en', set).map(p => p.slug)).toEqual(['a'])
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd blog && npx vitest run lib/posts.test.ts`
Expected: FAIL — `getGraphEntries` is not exported (import error / not a function).

- [ ] **Step 3: Add the `kind` field**

In `blog/lib/posts.ts`, in the `Post` type, add the field immediately after the `draft?: boolean` line:

```ts
  draft?: boolean         // editorial control: drafts never appear in getAllPosts
  kind?: 'note' | 'post'  // default 'post'; 'note' = atomic evergreen note (graph-only, excluded from index/RSS/manifest)
```

- [ ] **Step 4: Split the getters**

In `blog/lib/posts.ts`, replace the existing `getAllPosts` function (the one with the inline `.filter(...).sort(...)`) entirely with the shared helpers + two getters:

```ts
const byDateDesc = (a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
const visible = (p: Post, locale: Locale) => !p.draft && (locale === 'ru' || p.en != null)

/**
 * Published ESSAYS (kind !== 'note'), newest-first. Drafts and notes excluded.
 * Feeds the blog index, RSS, and the SEO manifest — the essay "publication".
 * `source` defaults to the registry; the param exists for fixture-testing.
 */
export function getAllPosts(locale: Locale = 'ru', source: Post[] = posts): Post[] {
  return source.filter(p => visible(p, locale) && p.kind !== 'note').sort(byDateDesc)
}

/**
 * All published entries — posts AND notes — newest-first. The knowledge graph's input,
 * so atomic notes thicken its edges. Drafts excluded; locale-gated like getAllPosts.
 */
export function getGraphEntries(locale: Locale = 'ru', source: Post[] = posts): Post[] {
  return source.filter(p => visible(p, locale)).sort(byDateDesc)
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd blog && npx vitest run lib/posts.test.ts`
Expected: PASS — new tests green; existing registry tests (draft exclusion, newest-first sort, en-only filter, prologue/nervous-strength metadata) stay green (no existing fixture has `kind:'note'`, so `getAllPosts` behaviour is unchanged for them).

- [ ] **Step 6: Run the full blog suite (no regression)**

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green (posts, ai-prompt, graph).

- [ ] **Step 7: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts
git commit -m "feat(blog): kind note|post split + getGraphEntries (fb_2367bdbf2304)"
```

---

### Task 2: thread `kind` through the graph + size note nodes

**Files:**
- Modify: `blog/lib/graph.ts`
- Test: `blog/lib/graph.test.ts` (extend)
- Modify: `blog/components/blog/post-graph.tsx`

**Interfaces:**
- Consumes: `getGraphEntries` from Task 1; the existing `buildGraph(posts)` + `Post.kind`.
- Produces: `GraphNode.kind: 'note' | 'post'`; the viz reading it.

- [ ] **Step 1: Add the failing test**

In `blog/lib/graph.test.ts`, append inside the `describe('buildGraph', ...)` block (before its closing `})`):

```ts
  it('carries kind onto nodes, defaulting to post', () => {
    const note: Post = { slug: 'n', title: 'n', description: '', date: '2026-01-01', author: 'x', readingTime: '1', tags: ['AI'], related: [], kind: 'note' }
    const g = buildGraph([p('a', []), note])
    expect(g.nodes.find(n => n.slug === 'a')?.kind).toBe('post')
    expect(g.nodes.find(n => n.slug === 'n')?.kind).toBe('note')
  })
```

(The existing `p(...)` fixture helper has no `kind`, so node `a` exercises the `?? 'post'` default.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npx vitest run lib/graph.test.ts`
Expected: FAIL — `GraphNode` has no `kind` property (type error / `undefined` not `'post'`).

- [ ] **Step 3: Add `kind` to the graph node + builder**

In `blog/lib/graph.ts`:

(a) Add `kind` to the `GraphNode` interface:

```ts
export interface GraphNode { slug: string; title: string; tag: string; kind: 'note' | 'post' }
```

(b) In `buildGraph`, set it on each node (replace the existing `nodes` mapping line):

```ts
  const nodes: GraphNode[] = posts.map(p => ({ slug: p.slug, title: p.title, tag: p.tags[0] ?? 'AI', kind: p.kind ?? 'post' }))
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd blog && npx vitest run lib/graph.test.ts`
Expected: PASS — node `a` → `'post'` (default), node `n` → `'note'`; existing buildGraph edge tests stay green.

- [ ] **Step 5: Use the graph getter + size note nodes in the viz**

In `blog/components/blog/post-graph.tsx`:

(a) Change the import on line 2 from `getAllPosts` to `getGraphEntries` (keep the other named imports):

```tsx
import { getGraphEntries, localizedPost, stripOrigin, postUrl, type Locale } from '@/lib/posts'
```

(b) Change the call site (the `const posts = getAllPosts(locale)` line) to:

```tsx
  const posts = getGraphEntries(locale)
```

(c) Size note nodes smaller — change the `<circle ... r={9} ...>` to read the node kind:

```tsx
              <circle cx={pt.x} cy={pt.y} r={n.kind === 'note' ? 6 : 9} fill={tagColor(n.tag)} stroke="var(--bg-primary)" strokeWidth={2} />
```

(Everything else — layout math, edges, labels, colours, copy — unchanged.)

- [ ] **Step 6: Build + full suite**

Run: `cd blog && npm run build`
Expected: PASS — `/blog/graph` + `/en/blog/graph` compile; with zero notes registered, `getGraphEntries` returns exactly the current essays, so the graph renders identically today (the note sizing is dormant until notes exist).

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 7: Commit**

```bash
git add blog/lib/graph.ts blog/lib/graph.test.ts blog/components/blog/post-graph.tsx
git commit -m "feat(blog): graph carries note kind, note nodes render smaller (fb_2367bdbf2304)"
```

---

## Self-Review

**Spec coverage:**
- `Post.kind?: 'note' | 'post'` (default post) → Task 1 (Step 3). ✓
- `getAllPosts` essays-only filter → Task 1 (Step 4). ✓
- `getGraphEntries` (posts + notes) → Task 1 (Step 4). ✓
- posts.test: getAllPosts excludes notes; getGraphEntries includes both + draft/locale gating → Task 1 (Step 1). ✓
- `GraphNode.kind` + `buildGraph` threads `p.kind ?? 'post'` → Task 2 (Step 3). ✓
- graph.test: node carries kind (default post / explicit note) → Task 2 (Step 1). ✓
- post-graph uses `getGraphEntries`; note nodes r=6 vs 9 → Task 2 (Step 5). ✓
- Build-validated; index/RSS/manifest unchanged (still call essays-only `getAllPosts`) → respected. ✓
- Engine dark (zero notes), carves honored → nothing seeded; no /blog/notes, no tag edges, no layout/copy change. ✓

**Placeholder scan:** none — every code step carries full content with exact values.

**Type consistency:** `getGraphEntries(locale, source)` defined in Task 1 (Step 4) is imported + called in Task 2 (Step 5). `GraphNode.kind: 'note' | 'post'` defined in Task 2 (Step 3) is read as `n.kind === 'note'` in the viz (Step 5). `Post.kind?: 'note' | 'post'` (Task 1) is consumed by `p.kind ?? 'post'` in buildGraph (Task 2). The `byDateDesc`/`visible` helpers are module-local and used by both getters. ✓
