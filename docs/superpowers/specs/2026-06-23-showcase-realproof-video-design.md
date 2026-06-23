# Real-Proof Showcase + Video Polish — Design

**Ticket:** `fb_2fbf86ac3c67` (intro/demo video + showcase of real cases on the landing).
**Paired:** `fb_83d05aa7ee6f` (a blog deep-dive per showcase case — the `href` target).

**Date:** 2026-06-23

## Goal

On the LMS course landing (`ai.mamaev.coach`), upgrade the existing showcase
section two ways: (1) add a **real-proof** case layer — concrete "a person built
an AI system and turned it to their benefit" stories — visually distinct from and
ranked above the existing aspirational "what you can dream about" cards; (2)
**polish the video slot** into a click-to-play facade that does not load a
third-party iframe (or a local video file) until the visitor clicks.

## Honest-triage note (verified)

The showcase scaffolding already shipped in `fb_b2a67b22be2c`:

- `lib/course/showcase.ts` — `getShowcase(locale)` returns `ShowcaseVM` with a
  `videoUrl` (currently `null` → "ролик скоро" placeholder), 4 **aspirational**
  cases (`CASES`, "о чём можно мечтать"), and a CTA. `videoEmbedUrl(url)` maps
  YouTube/Vimeo watch-URLs to nocookie/player embeds; unknown URLs pass through.
- `components/showcase-gallery.tsx` (server component) renders an eager `<iframe>`
  (or placeholder), a case grid, and the CTA. Mounted in
  `components/pages/home-page.tsx:282`.
- `components/video-checkpoint.tsx` — a separate in-lesson MDX video; out of scope.

So the engine (video slot + case grid + CTA) exists. The genuine deltas are the
**real-vs-aspirational distinction** and the **click-to-play video facade**.

## Decisions locked during brainstorming

1. **Two sub-sections in one showcase block**: "Реальные истории / Real stories"
   (proof) above "О чём можно мечтать / What you can dream about" (aspirational).
   The proof sub-section is **omitted entirely when it has no cases** — a graceful
   dark-launch, mirroring the products catalog.
2. **Proof cases are seeded now, not empty** — with the founder's own real
   projects (Echo, this LMS, sovern-mindmap, the Knowledge Graph). Copy is an
   honest first draft the founder edits later. **Authenticity boundary is sacred:
   no fabricated metrics or glossy testimonials** — result lines are qualitative.
3. **Proof card** carries, beyond the dream-card fields: a `result` payoff line, an
   `author` attribution, and an optional `href` to a blog deep-dive (`fb_83d05aa7ee6f`).
   The `→ разбор` arrow renders only when `href` is present (no posts yet → no arrow).
4. **Video facade**: don't load the iframe / `<video>` on page load. Show a poster
   (or dark fallback) + a ▶ button; load the real player only on click. Support
   local `.mp4/.webm` files (rendered as `<video>`) in addition to YouTube/Vimeo
   embeds.
5. All changes are client-side, static-export-safe, bilingual ru/en. No server,
   data, migration, or new dependency.

## Components

### `lib/course/showcase.ts` (pure data + helpers — modified)

```ts
import type { Locale } from '@/lib/intake/types'
interface Bi { ru: string; en: string }

// existing — aspirational card
export interface ShowcaseCase { id: string; icon: string; title: Bi; blurb: Bi; tag: Bi; href?: string }

// new — real-proof card
export interface RealCase {
  id: string; icon: string; title: Bi; blurb: Bi; tag: Bi
  result: Bi          // the "обернул во благо" payoff line
  author: Bi          // attribution, e.g. { ru: 'Александр', en: 'Alexander' }
  href?: string       // → blog deep-dive; omitted until the post exists
}

// video classification
export interface VideoSource { kind: 'embed' | 'file'; src: string }

export interface ShowcaseVM {
  label: string                                   // overall eyebrow
  video: { source: VideoSource | null; poster: string | null; caption: string }
  real: { heading: string; cases: ResolvedReal[] }   // cases: [] => section hidden
  dream: { heading: string; cases: ResolvedDream[] }
  cta: string
}
interface ResolvedDream { id: string; icon: string; title: string; blurb: string; tag: string; href?: string }
interface ResolvedReal  extends ResolvedDream { result: string; author: string }

export function videoEmbedUrl(url: string | null): string | null   // unchanged
export function resolveVideoSource(url: string | null): VideoSource | null
export function withAutoplay(embedUrl: string): string
export function getShowcase(locale: Locale): ShowcaseVM
```

Logic:
- `resolveVideoSource(url)`: `null → null`; `/\.(mp4|webm|ogg)(\?|#|$)/i` → `{kind:'file', src:url}`;
  else `videoEmbedUrl(url)` → `{kind:'embed', src}` (or `null` if that returns null).
- `withAutoplay(embedUrl)`: append `autoplay=1` with the right separator
  (`embedUrl.includes('?') ? '&' : '?'`).
- `getShowcase`: flatten `Bi` fields to the locale; `real.cases` from `REAL_CASES`
  (seeded, see below), `dream.cases` from the renamed `DREAM_CASES` (≥4, unchanged
  copy). `video.source = resolveVideoSource(VIDEO.url)`; `VIDEO` config gains
  `poster: string | null` (a local `/public` path, `null` for now).

Section strings:
- `label`: `{ ru: 'Возможности', en: 'Possibilities' }` (unchanged eyebrow).
- `real.heading`: `{ ru: 'Реальные истории', en: 'Real stories' }`.
- `dream.heading`: `{ ru: 'О чём можно мечтать', en: 'What you can dream about' }` (the existing `HEADING`).

**Seed `REAL_CASES` (honest first draft — founder edits; no metrics):**

| id | icon | title (ru) | tag (ru) | result (ru) |
|---|---|---|---|---|
| `echo` | 🎙️ | Echo — голос вместо клавиатуры | Диктовка | Письма, заметки и код теперь надиктовываю — печать ушла на второй план. |
| `lms` | 🧭 | Точка Сборки — этот самый сайт | Платформа | Целый обучающий продукт собран в одиночку, без классической команды разработки. |
| `canvas` | 🗺️ | Канвас AI-диаграмм | Запуск | Схемы, на которые уходил час в редакторе, рождаются за минуты. |
| `brain` | 🧠 | Граф знаний — второй мозг | Знание | Перестал терять идеи — спрашиваю собственный архив как живого собеседника. |

(Each has an `en` counterpart and a `blurb`; `author = { ru: 'Александр', en: 'Alexander' }`;
no `href` yet. Full bilingual copy lives in the implementation plan.)

### `components/showcase-video.tsx` (`'use client'` — new)

```tsx
export function ShowcaseVideo(props: {
  source: VideoSource | null
  poster: string | null
  caption: string
  title: string
}): JSX.Element
```

- `useState(playing=false)`.
- `source === null` → static placeholder (▶ glyph + `caption`) — same look as today.
- `source && !playing` → facade `<button>` filling the 16:9 box: background = poster
  image if `poster`, else `var(--bg-surface)`; centered ▶; `aria-label` = `title`.
  Click → `setPlaying(true)`.
- `playing`:
  - `source.kind === 'embed'` → `<iframe src={withAutoplay(source.src)} …allow=autoplay allowFullScreen>`.
  - `source.kind === 'file'`  → `<video src={source.src} controls autoPlay playsInline poster={poster ?? undefined}>`.
- The 16:9 frame styling matches the current `aspectRatio:'16 / 9'` wrapper.

### `components/showcase-gallery.tsx` (modified)

- Replace the inline `<iframe>`/placeholder with `<ShowcaseVideo source={t.video.source}
  poster={t.video.poster} caption={t.video.caption} title={t.real.heading || t.dream.heading} />`.
- Render `t.real` block **only if `t.real.cases.length > 0`**, above the dream block:
  its own `heading`, a card grid; each real card shows icon, title, blurb, `result`
  (emphasized line), a `tag` chip, an author line (`— {author}`), and, when `href`
  is set, a `→ разбор / → deep-dive` link.
- Render `t.dream` block with `t.dream.heading` (replacing the single old heading);
  card markup unchanged.
- CTA unchanged.

## Data flow

```
home-page.tsx → <ShowcaseGallery locale/>
  → getShowcase(locale) → ShowcaseVM { video, real, dream, cta }
      → <ShowcaseVideo source poster caption/>   (click → real player)
      → real.cases.length ? <real section/> : (omitted)
      → <dream section/>
      → CTA
```

## Edge cases

- **No video URL** (`VIDEO.url = null`, current state) → `source = null` → placeholder,
  no facade, no network.
- **No poster** (`poster = null`, current state) → facade uses `var(--bg-surface)`
  background; `<video>` omits the `poster` attr.
- **No real cases** (`REAL_CASES = []`) → real section omitted; dream section still
  shows. (Not the launch state — we seed 4 — but the helper must not throw.)
- **Real case without `href`** → no `→ разбор` arrow (the launch state for all 4).
- **`.mp4` with a query string** (`/v.mp4?t=1`) → still classified `file`.

## Testing (vitest env=node — pure helpers only)

`lib/course/showcase.test.ts` (extend the existing file):
- `getShowcase` (ru & en): `label`, `cta` non-empty; `dream.cases.length >= 4` with
  every dream card carrying non-empty `title/blurb/tag/icon` (**migrate the existing
  `s.cases` assertions to `s.dream.cases`**); `real.cases.length >= 1` with every
  real card carrying non-empty `title/blurb/tag/icon/result/author`.
- ru and en differ (`real.heading` ru ≠ en; `dream.heading` ru ≠ en).
- `resolveVideoSource`: `null → null`; `'https://x/v.mp4' → {kind:'file'}`;
  `'https://x/v.mp4?t=1' → {kind:'file'}`; `'https://youtu.be/abc' → {kind:'embed', src: nocookie}`;
  `'https://vimeo.com/12345' → {kind:'embed'}`.
- `withAutoplay`: `'https://www.youtube-nocookie.com/embed/ID' → '…/embed/ID?autoplay=1'`;
  a url already containing `?` gets `&autoplay=1`.
- `videoEmbedUrl` existing tests unchanged.

`ShowcaseVideo` is **not** unit-tested (consistent with the repo — UI is verified by
a green static build, `npm run build`); the gallery wiring is likewise build-verified.

## Files

| File | Responsibility |
|---|---|
| `lib/course/showcase.ts` | `RealCase`, `REAL_CASES` seed, `DREAM_CASES` rename, `resolveVideoSource`, `withAutoplay`, extended `ShowcaseVM` + `getShowcase` |
| `lib/course/showcase.test.ts` | extend: real-case shape, `dream.cases` migration, video helpers |
| `components/showcase-video.tsx` | click-to-play facade (`'use client'`) |
| `components/showcase-gallery.tsx` | two sub-sections + `<ShowcaseVideo>` |

No server, data, migration, or new dependency. ~4 TDD tasks.

## Out of scope

- Recording the actual intro video, and supplying a poster image (founder content;
  the slot/poster config is ready to receive them).
- Writing the per-case blog deep-dives (`fb_83d05aa7ee6f`) — this only wires the
  optional `href`.
- The hub portfolio landing (`mamaev.coach`) — its "projects" section is the
  founder's two offerings, a different surface.
- Learner-submitted cases / a CMS — YAGNI; the seed is a hand-curated array.
