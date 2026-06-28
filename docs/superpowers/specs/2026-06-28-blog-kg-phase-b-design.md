# Blog knowledge-graph Phase B (engine) — Design

**Ticket:** `fb_2367bdbf2304` (Blog knowledge-graph Phase B: evergreen atomic notes — a `kind: note|post`
split in `blog/lib/posts.ts`; shorter densely-linked notes that thicken graph edges; content-driven).

**Date:** 2026-06-28

## Goal

Add the engine for atomic evergreen notes: a `kind: 'note' | 'post'` split in the blog registry so
short, densely-linked notes participate in the knowledge graph (thickening its edges) without
diluting the essay "publication" (the chronological index, RSS, and the SEO manifest). Phase A (the
graph viz at `/blog/graph` + `lib/graph.ts`) already shipped. Note **content** is owner-written;
this slice ships the engine dark (zero notes).

## Decisions (owner, at design gate)

- **Notes appear in the graph only.** The blog index, RSS, and `posts-manifest.json` (consumed by the
  hub's SEO surfaces) stay essays-only; notes are graph nodes (clickable to their own page).
- **Engine-only, dark.** Ship the `kind` split + graph support + filters + tests with **zero** notes
  (the Stripe `PRODUCTS=[]` dark-ship precedent). The owner adds notes later as registry entries +
  components + routes, exactly like posts but `kind:'note'`.

## Scope (carved by honest triage)

`getAllPosts` is the spine feeding four surfaces: the blog index, `rss.xml`, `posts-manifest.json`,
and the graph. The delta is the `kind` field + routing notes through the graph getter only.

- **In scope:** `Post.kind` field; `getAllPosts` filtered to essays; a new `getGraphEntries` getter
  (posts + notes); `GraphNode.kind` + `buildGraph` threading it; the graph viz sizing notes smaller;
  tests for all of it.
- **Out of scope (carved):**
  - Note **content** (owner-written) — none seeded; engine ships dark.
  - A `/blog/notes` index page (the graph is the notes surface — YAGNI).
  - tag-derived edges (edges stay `related[]`-driven).
  - Layout/physics changes (the deterministic radial layout stays).
  - Graph copy changes ("each node is a post") — left as-is while notes are dark; not claiming
    nonexistent notes.

## Architecture

A registry-field + getter change. `kind` is optional (default `'post'`), so every existing post is an
essay with no edit. `getAllPosts` gains a `kind !== 'note'` filter — which keeps the index/RSS/manifest
essays-only automatically (they all call `getAllPosts`). A new `getGraphEntries` returns posts + notes
for the graph. `buildGraph` carries `kind` onto each node; the viz renders note nodes with a smaller
radius. Notes are full `Post` entries (same routing/`localizedPost`/`postUrl`), so a note node links to
its own page like any post.

## Component

### `blog/lib/posts.ts` (modified)

(a) Add the optional field to the `Post` type (after `draft?`):

```ts
  kind?: 'note' | 'post'   // default 'post'; 'note' = atomic evergreen note (graph-only, excluded from index/RSS/manifest)
```

(b) Extract the shared filters/sort and split the two getters. Replace the existing `getAllPosts` with:

```ts
const byDateDesc = (a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
const visible = (p: Post, locale: Locale) => !p.draft && (locale === 'ru' || p.en != null)

/**
 * Published ESSAYS (kind !== 'note'), newest-first. Drafts and notes excluded.
 * Feeds the blog index, RSS, and the SEO manifest — the essay "publication".
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

(Existing posts have no `kind`, so `kind !== 'note'` keeps them in `getAllPosts` — backward
compatible. The `source` param on both keeps them fixture-testable.)

### `blog/lib/graph.ts` (modified)

`GraphNode` gains `kind`; `buildGraph` reads `p.kind ?? 'post'`. Edges unchanged.

```ts
export interface GraphNode { slug: string; title: string; tag: string; kind: 'note' | 'post' }
```

In `buildGraph`, the node map becomes:

```ts
  const nodes: GraphNode[] = posts.map(p => ({ slug: p.slug, title: p.title, tag: p.tags[0] ?? 'AI', kind: p.kind ?? 'post' }))
```

### `blog/components/blog/post-graph.tsx` (modified)

- Import and use `getGraphEntries` instead of `getAllPosts` (one import-line + one call-site change;
  the `posts` local now holds posts + notes, so `titleOf` resolves note titles too).
- Note nodes render smaller to distinguish atomic notes from essays — change the circle radius:

```tsx
              <circle cx={pt.x} cy={pt.y} r={n.kind === 'note' ? 6 : 9} fill={tagColor(n.tag)} stroke="var(--bg-primary)" strokeWidth={2} />
```

(Everything else — layout, edges, labels, colours — unchanged.)

### `blog/lib/posts.test.ts` (extend)

Add, using the existing fixture style (`f`/`p` helper pattern with the `source` param):

```ts
  it('getAllPosts excludes notes (essays only)', () => {
    const f = (slug: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay'), f('atom', 'note')]
    expect(getAllPosts('ru', set).map(p => p.slug)).toEqual(['essay'])
  })

  it('getGraphEntries includes both posts and notes', () => {
    const f = (slug: string, date: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date, author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay', '2026-01-01'), f('atom', '2026-02-01', 'note')]
    expect(getGraphEntries('ru', set).map(p => p.slug)).toEqual(['atom', 'essay']) // both, newest-first
  })

  it('getGraphEntries still drops drafts + respects en locale', () => {
    const f = (slug: string, en?: { title: string; description: string; readingTime: string }, draft?: boolean): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind: 'note', en, draft,
    })
    const set = [f('a', { title: 'A', description: 'd', readingTime: '1' }), f('b'), f('c', undefined, true)]
    expect(getGraphEntries('en', set).map(p => p.slug)).toEqual(['a']) // b has no en, c is draft
  })
```

(Import `getGraphEntries` alongside the existing imports.)

### `blog/lib/graph.test.ts` (extend)

```ts
  it('carries kind onto nodes, defaulting to post', () => {
    const note: Post = { slug: 'n', title: 'n', description: '', date: '2026-01-01', author: 'x', readingTime: '1', tags: ['AI'], related: [], kind: 'note' }
    const g = buildGraph([p('a', []), note])
    expect(g.nodes.find(n => n.slug === 'a')?.kind).toBe('post')   // no kind → 'post'
    expect(g.nodes.find(n => n.slug === 'n')?.kind).toBe('note')
  })
```

## Data flow

Static. The index/RSS/manifest call `getAllPosts` (now essays-only); the graph calls
`getGraphEntries` (posts + notes) → `buildGraph` (nodes carry `kind`) → the viz sizes note nodes
smaller. No endpoint, no client state. With zero notes registered, `getGraphEntries === getAllPosts`
in practice — the engine is dormant until the owner adds notes.

## Authenticity (binding)

- Nothing publicly false: the engine is dark; the graph shows notes only once the owner writes them.
  The essay publication (index / RSS / SEO manifest) is not diluted by atomic notes.

## Testing

- `blog/lib/posts.test.ts`: `getAllPosts` excludes `kind:'note'`; `getGraphEntries` includes both
  (newest-first) and still drops drafts + respects the en locale.
- `blog/lib/graph.test.ts`: nodes carry `kind` (default `'post'`, explicit `'note'`).
- Validated by `cd blog && npm run build` (the graph compiles with the note radius; index/RSS/manifest
  unaffected).

Run: `cd blog && npx vitest run` then `npm run build`.

## Global constraints

- Files under `blog/` (standalone blog app). Static.
- `kind` optional, default `'post'` — existing posts byte-identical, no per-post edit.
- Additive: index/RSS/manifest keep calling `getAllPosts` (now essays-only by the new filter); only
  the graph switches to `getGraphEntries`. Edges, layout, colours unchanged.
- Bilingual: notes respect the same en-locale gating as posts in both getters.
- Engine dark: zero notes seeded (content is owner-written).

## Files

| File | Responsibility |
|---|---|
| `blog/lib/posts.ts` | `Post.kind` field; `getAllPosts` essays-only; new `getGraphEntries` (posts+notes) |
| `blog/lib/posts.test.ts` | getAllPosts excludes notes; getGraphEntries includes both + draft/locale gating |
| `blog/lib/graph.ts` | `GraphNode.kind` + `buildGraph` threads `p.kind ?? 'post'` |
| `blog/lib/graph.test.ts` | nodes carry kind (default post / explicit note) |
| `blog/components/blog/post-graph.tsx` | use `getGraphEntries`; note nodes render at r=6 (vs 9) |

## Out of scope

- Note content (owner-written); `/blog/notes` index; tag-derived edges; layout/physics changes;
  graph copy changes.
