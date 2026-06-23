# Real-Proof Showcase + Video Facade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-proof case layer (above the aspirational "dream" cards) and a click-to-play video facade to the LMS course-landing showcase section.

**Architecture:** All data + classification logic stays in the pure module `lib/course/showcase.ts` (locale-flattened view-model). Rendering is a server component (`showcase-gallery.tsx`) plus one new client component (`showcase-video.tsx`) that defers loading the real player until clicked. Tasks are ordered helpers → facade → (data + gallery together) so `npm run build` stays green at every commit — the gallery is coupled to the `ShowcaseVM` shape, so the VM change and the gallery rewrite ship in one task.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, static), React client components, TypeScript, Vitest (`env: node`).

## Global Constraints

- Working directory for ALL commands: `LMS/tochka-sborki/web/` (run `cd LMS/tochka-sborki/web` first). NEVER run `npx vitest` from `workers/` — it sweeps the wrong cwd.
- Test command: `npm test` (= `vitest run`). Build command: `npm run build`.
- Bilingual: every user-facing string has a `{ ru, en }` (`Bi`) pair; `getShowcase` flattens to the active locale. `Locale = 'ru' | 'en'` from `@/lib/intake/types`.
- Authenticity boundary is sacred: real-case copy is qualitative — NO fabricated metrics, percentages, or glossy testimonials. Use the exact seed copy in Task 3 verbatim.
- Static export safe: the only client component is `showcase-video.tsx` (`'use client'`). `showcase-gallery.tsx` stays a server component.
- No server, no data store, no migration, no new npm dependency.
- Pure helpers are unit-tested (Vitest); UI components are verified by a green `npm run build` only (repo convention — UI is not unit-tested).

---

### Task 1: Video classification helpers + poster config

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.ts`
- Test: `LMS/tochka-sborki/web/lib/course/showcase.test.ts`

**Interfaces:**
- Consumes: existing `videoEmbedUrl(url: string | null): string | null` (already in the file).
- Produces:
  - `export interface VideoSource { kind: 'embed' | 'file'; src: string }`
  - `export function resolveVideoSource(url: string | null): VideoSource | null`
  - `export function withAutoplay(embedUrl: string): string`
  - `VIDEO` config object gains a `poster: string | null` field (used by Task 3's `getShowcase`).

This task is purely additive — `getShowcase` and the existing `ShowcaseVM` are NOT touched here, so all existing tests keep passing.

- [ ] **Step 1: Write the failing tests**

Append to `LMS/tochka-sborki/web/lib/course/showcase.test.ts` (the file already imports from `./showcase` and has a `describe('videoEmbedUrl', …)` block — add a new import and two new describe blocks):

Change the existing top import line
```ts
import { getShowcase, videoEmbedUrl } from './showcase'
```
to
```ts
import { getShowcase, videoEmbedUrl, resolveVideoSource, withAutoplay } from './showcase'
```

Then append at the end of the file:
```ts
describe('resolveVideoSource', () => {
  it('null → null', () => expect(resolveVideoSource(null)).toBeNull())
  it('.mp4 → file', () => expect(resolveVideoSource('https://x.com/v.mp4')).toEqual({ kind: 'file', src: 'https://x.com/v.mp4' }))
  it('.webm → file', () => expect(resolveVideoSource('https://x.com/v.webm')).toEqual({ kind: 'file', src: 'https://x.com/v.webm' }))
  it('.mp4 with query → file', () => expect(resolveVideoSource('https://x.com/v.mp4?t=1')).toEqual({ kind: 'file', src: 'https://x.com/v.mp4?t=1' }))
  it('youtu.be → embed (nocookie)', () => expect(resolveVideoSource('https://youtu.be/abc123')).toEqual({ kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc123' }))
  it('vimeo → embed (player)', () => expect(resolveVideoSource('https://vimeo.com/12345')).toEqual({ kind: 'embed', src: 'https://player.vimeo.com/video/12345' }))
})

describe('withAutoplay', () => {
  it('no query → appends ?autoplay=1', () => expect(withAutoplay('https://www.youtube-nocookie.com/embed/ID')).toBe('https://www.youtube-nocookie.com/embed/ID?autoplay=1'))
  it('existing query → appends &autoplay=1', () => expect(withAutoplay('https://player.vimeo.com/video/1?h=x')).toBe('https://player.vimeo.com/video/1?h=x&autoplay=1'))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd LMS/tochka-sborki/web && npm test -- showcase`
Expected: FAIL — `resolveVideoSource is not a function` / `withAutoplay is not a function`.

- [ ] **Step 3: Implement the helpers**

In `LMS/tochka-sborki/web/lib/course/showcase.ts`, find the existing `VIDEO` const:
```ts
const VIDEO: { url: string | null; caption: Bi } = {
  url: null, // впиши YouTube/Vimeo watch-URL — встроится автоматически
  caption: { ru: 'Короткий ролик о сути — скоро', en: 'A short film about the essence — coming soon' },
}
```
Replace it with (adds the `poster` field):
```ts
const VIDEO: { url: string | null; poster: string | null; caption: Bi } = {
  url: null,    // впиши YouTube/Vimeo watch-URL или путь к .mp4 — встроится автоматически
  poster: null, // путь к постеру в /public, например '/showcase-poster.jpg'
  caption: { ru: 'Короткий ролик о сути — скоро', en: 'A short film about the essence — coming soon' },
}
```

Then, immediately AFTER the existing `videoEmbedUrl` function, add:
```ts
export interface VideoSource { kind: 'embed' | 'file'; src: string }

export function resolveVideoSource(url: string | null): VideoSource | null {
  if (!url) return null
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return { kind: 'file', src: url }
  const embed = videoEmbedUrl(url)
  return embed ? { kind: 'embed', src: embed } : null
}

export function withAutoplay(embedUrl: string): string {
  return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1'
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npm test -- showcase`
Expected: PASS (all `resolveVideoSource`, `withAutoplay`, and pre-existing tests green).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/showcase.ts LMS/tochka-sborki/web/lib/course/showcase.test.ts
git commit -m "feat(showcase): video source classification + autoplay helpers (fb_2fbf86ac3c67)"
```

---

### Task 2: Click-to-play video facade component

**Files:**
- Create: `LMS/tochka-sborki/web/components/showcase-video.tsx`

**Interfaces:**
- Consumes: `VideoSource` and `withAutoplay` from `@/lib/course/showcase` (Task 1).
- Produces: `export function ShowcaseVideo(props: { source: VideoSource | null; poster: string | null; caption: string; title: string }): React.JSX.Element` — used by Task 3's gallery.

This is a new, not-yet-imported file, so the build stays green. It is verified by `npm run build` (no unit test — repo convention for UI). Reference pattern: `components/video-checkpoint.tsx` (16:9 wrapper, lazy iframe) and the current inline player in `components/showcase-gallery.tsx` (the placeholder look to preserve).

- [ ] **Step 1: Create the component**

Create `LMS/tochka-sborki/web/components/showcase-video.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { withAutoplay, type VideoSource } from '@/lib/course/showcase'

const FRAME: React.CSSProperties = {
  position: 'relative', aspectRatio: '16 / 9', width: '100%',
  borderRadius: 14, overflow: 'hidden',
  border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
  marginBottom: '2rem',
}
const FILL: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }

export function ShowcaseVideo({ source, poster, caption, title }: {
  source: VideoSource | null
  poster: string | null
  caption: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)

  // No video configured yet → static placeholder (preserves current look).
  if (!source) {
    return (
      <div style={FRAME}>
        <div style={{ ...FILL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: 'var(--text-secondary)' }}>
          <span aria-hidden="true" style={{ fontSize: '2.4rem' }}>▶</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{caption}</span>
        </div>
      </div>
    )
  }

  // Facade: poster (or surface) + play button; load the real player only on click.
  if (!playing) {
    return (
      <div style={FRAME}>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={title}
          style={{
            ...FILL, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: poster ? `center / cover no-repeat url(${poster})` : 'var(--bg-surface)',
          }}
        >
          <span aria-hidden="true" style={{
            fontSize: '1.6rem', width: 72, height: 72, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--text-accent)', color: 'var(--text-on-accent)',
          }}>▶</span>
        </button>
      </div>
    )
  }

  // Playing.
  return (
    <div style={FRAME}>
      {source.kind === 'embed' ? (
        <iframe
          src={withAutoplay(source.src)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={FILL}
        />
      ) : (
        <video src={source.src} controls autoPlay playsInline poster={poster ?? undefined} style={FILL} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — build completes; the new file type-checks (it is not yet imported, so no behavior change).

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/components/showcase-video.tsx
git commit -m "feat(showcase): click-to-play video facade component (fb_2fbf86ac3c67)"
```

---

### Task 3: Real-proof data layer + two-section gallery

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.ts`
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.test.ts`
- Modify: `LMS/tochka-sborki/web/components/showcase-gallery.tsx`

**Interfaces:**
- Consumes: `resolveVideoSource`, `VideoSource`, `VIDEO.poster` (Task 1); `ShowcaseVideo` (Task 2).
- Produces: restructured `ShowcaseVM` (below) consumed only by the gallery in this same task.

The `ShowcaseVM` shape changes and the gallery is coupled to it, so both ship together to keep the build green. The data layer is unit-tested; the gallery is build-verified.

New `ShowcaseVM` shape:
```ts
export interface ShowcaseVM {
  label: string
  video: { source: VideoSource | null; poster: string | null; caption: string }
  real: { heading: string; cases: ResolvedReal[] }   // cases: [] => section hidden
  dream: { heading: string; cases: ResolvedDream[] }
  cta: string
}
```

- [ ] **Step 1: Rewrite the data-layer tests**

Replace the ENTIRE existing `describe('getShowcase', …)` block in `LMS/tochka-sborki/web/lib/course/showcase.test.ts` (the block that currently asserts on `s.cases`) with:
```ts
describe('getShowcase', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`label/cta + >=4 dream cases with content (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.cta.length).toBeGreaterThan(0)
      expect(s.dream.heading.length).toBeGreaterThan(0)
      expect(s.dream.cases.length).toBeGreaterThanOrEqual(4)
      for (const c of s.dream.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
      }
    })
    it(`>=1 real case with proof fields (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.real.heading.length).toBeGreaterThan(0)
      expect(s.real.cases.length).toBeGreaterThanOrEqual(1)
      for (const c of s.real.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
        expect(c.result.length).toBeGreaterThan(0)
        expect(c.author.length).toBeGreaterThan(0)
      }
    })
  }
  it('ru and en differ', () => {
    expect(getShowcase('ru').dream.heading).not.toBe(getShowcase('en').dream.heading)
    expect(getShowcase('ru').real.heading).not.toBe(getShowcase('en').real.heading)
  })
  it('video source is null until a URL is configured', () => {
    expect(getShowcase('ru').video.source).toBeNull()
  })
})
```
Leave the `resolveVideoSource`, `withAutoplay`, and `videoEmbedUrl` describe blocks (added in Task 1 / pre-existing) untouched.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd LMS/tochka-sborki/web && npm test -- showcase`
Expected: FAIL — `getShowcase(...).dream is undefined` / `.real is undefined`.

- [ ] **Step 3: Rewrite the data layer**

In `LMS/tochka-sborki/web/lib/course/showcase.ts`, make these changes:

(a) Replace the `ShowcaseVM` interface and the `LABEL/HEADING/CTA` consts. Find:
```ts
export interface ShowcaseVM {
  label: string
  heading: string
  videoUrl: string | null
  videoCaption: string
  cases: { id: string; icon: string; title: string; blurb: string; tag: string; href?: string }[]
  cta: string
}

const LABEL: Bi = { ru: 'Возможности', en: 'Possibilities' }
const HEADING: Bi = { ru: 'О чём можно мечтать', en: 'What you can dream about' }
const CTA: Bi = { ru: 'Начать свой путь →', en: 'Start your path →' }
```
Replace with:
```ts
export interface RealCase {
  id: string; icon: string; title: Bi; blurb: Bi; tag: Bi
  result: Bi      // the "обернул во благо" payoff line
  author: Bi      // attribution
  href?: string   // → blog deep-dive; omitted until the post exists
}

interface ResolvedDream { id: string; icon: string; title: string; blurb: string; tag: string; href?: string }
interface ResolvedReal extends ResolvedDream { result: string; author: string }

export interface ShowcaseVM {
  label: string
  video: { source: VideoSource | null; poster: string | null; caption: string }
  real: { heading: string; cases: ResolvedReal[] }
  dream: { heading: string; cases: ResolvedDream[] }
  cta: string
}

const LABEL: Bi = { ru: 'Возможности', en: 'Possibilities' }
const REAL_HEADING: Bi = { ru: 'Реальные истории', en: 'Real stories' }
const DREAM_HEADING: Bi = { ru: 'О чём можно мечтать', en: 'What you can dream about' }
const CTA: Bi = { ru: 'Начать свой путь →', en: 'Start your path →' }
```

(b) Rename the existing `const CASES: ShowcaseCase[]` to `const DREAM_CASES: ShowcaseCase[]` (only the declaration name changes; keep all 4 entries exactly as they are).

(c) Add the seeded real cases. Immediately after the `DREAM_CASES` array, add:
```ts
const REAL_CASES: RealCase[] = [
  { id: 'echo', icon: '🎙️',
    title: { ru: 'Echo — голос вместо клавиатуры', en: 'Echo — voice instead of keyboard' },
    blurb: { ru: 'Десктоп-приложение локальной диктовки: говоришь — появляется текст, офлайн, RU/EN. Собрано vibe-кодингом на Tauri, Rust и Whisper.', en: 'A desktop dictation app: you speak, text appears — offline, RU/EN. Built by vibe-coding with Tauri, Rust and Whisper.' },
    tag: { ru: 'Диктовка', en: 'Dictation' },
    result: { ru: 'Письма, заметки и код теперь надиктовываю — печать ушла на второй план.', en: 'I now dictate emails, notes and code — typing took a back seat.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'lms', icon: '🧭',
    title: { ru: 'Точка Сборки — этот самый сайт', en: 'Tochka Sborki — this very site' },
    blurb: { ru: 'RPG-платформа курса с AI-ментором, картой мира и квестами — собрана тем же vibe-кодингом, которому учит.', en: 'The course RPG platform with an AI mentor, world map and quests — built with the same vibe-coding it teaches.' },
    tag: { ru: 'Платформа', en: 'Platform' },
    result: { ru: 'Целый обучающий продукт собран в одиночку, без классической команды разработки.', en: 'A whole learning product built solo, without a classic dev team.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'canvas', icon: '🗺️',
    title: { ru: 'Канвас AI-диаграмм', en: 'AI diagramming canvas' },
    blurb: { ru: 'Один холст, где идея превращается в схему: генераторы работают в фоне, ты двигаешь смысл, а не рисуешь прямоугольники.', en: 'One canvas where an idea becomes a diagram: generators run in the background, you move meaning instead of drawing rectangles.' },
    tag: { ru: 'Запуск', en: 'Launch' },
    result: { ru: 'Схемы, на которые уходил час в редакторе, рождаются за минуты.', en: 'Diagrams that took an hour in an editor now appear in minutes.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'brain', icon: '🧠',
    title: { ru: 'Граф знаний — второй мозг', en: 'Knowledge graph — a second brain' },
    blurb: { ru: 'Заметки, источники и опыт собраны в граф, который отвечает на вопросы и находит связи между ними.', en: 'Notes, sources and experience gathered into a graph that answers questions and finds connections between them.' },
    tag: { ru: 'Знание', en: 'Knowledge' },
    result: { ru: 'Перестал терять идеи — спрашиваю собственный архив как живого собеседника.', en: 'Stopped losing ideas — I query my own archive like a living interlocutor.' },
    author: { ru: 'Александр', en: 'Alexander' } },
]
```

(d) Replace the entire `getShowcase` function. Find:
```ts
export function getShowcase(locale: Locale): ShowcaseVM {
  const L: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  return {
    label: LABEL[L],
    heading: HEADING[L],
    videoUrl: VIDEO.url,
    videoCaption: VIDEO.caption[L],
    cases: CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], href: c.href })),
    cta: CTA[L],
  }
}
```
Replace with:
```ts
export function getShowcase(locale: Locale): ShowcaseVM {
  const L: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  return {
    label: LABEL[L],
    video: { source: resolveVideoSource(VIDEO.url), poster: VIDEO.poster, caption: VIDEO.caption[L] },
    real: {
      heading: REAL_HEADING[L],
      cases: REAL_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], result: c.result[L], author: c.author[L], href: c.href })),
    },
    dream: {
      heading: DREAM_HEADING[L],
      cases: DREAM_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], href: c.href })),
    },
    cta: CTA[L],
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npm test -- showcase`
Expected: PASS (data-layer + helper tests all green).

- [ ] **Step 5: Rewrite the gallery to consume the new VM**

Replace the ENTIRE contents of `LMS/tochka-sborki/web/components/showcase-gallery.tsx` with:
```tsx
import { getShowcase } from '@/lib/course/showcase'
import { ShowcaseVideo } from '@/components/showcase-video'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseGallery({ locale }: { locale: Locale }) {
  const t = getShowcase(locale)
  const intakeHref = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'
  const deepDive = locale === 'en' ? '→ deep-dive' : '→ разбор'

  const card: React.CSSProperties = {
    display: 'block', padding: '1.2rem', borderRadius: 12,
    border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
    color: 'inherit', textDecoration: 'none',
  }
  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
  }
  const subHeading: React.CSSProperties = { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '1.6rem' }

  return (
    <section className="home-section" style={{ padding: 'var(--section-gap) 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.6rem' }}>{t.label}</div>

        <ShowcaseVideo source={t.video.source} poster={t.video.poster} caption={t.video.caption} title={t.real.heading} />

        {t.real.cases.length > 0 && (
          <>
            <h2 style={subHeading}>{t.real.heading}</h2>
            <div style={{ ...grid, marginBottom: '2.5rem' }}>
              {t.real.cases.map(c => {
                const inner = (
                  <>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.result}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>— {c.author}</span>
                    </div>
                    {c.href && <div style={{ marginTop: '0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>{deepDive}</div>}
                  </>
                )
                return c.href
                  ? <a key={c.id} href={c.href} style={card}>{inner}</a>
                  : <div key={c.id} style={card}>{inner}</div>
              })}
            </div>
          </>
        )}

        <h2 style={subHeading}>{t.dream.heading}</h2>
        <div style={grid}>
          {t.dream.cases.map(c => {
            const inner = (
              <>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
              </>
            )
            return c.href
              ? <a key={c.id} href={c.href} style={card}>{inner}</a>
              : <div key={c.id} style={card}>{inner}</div>
          })}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href={intakeHref} style={{ display: 'inline-block', background: 'var(--text-accent)', color: 'var(--text-on-accent)', fontWeight: 700, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>{t.cta}</a>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — the gallery type-checks against the new VM and renders the real + dream sections.

- [ ] **Step 7: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/showcase.ts LMS/tochka-sborki/web/lib/course/showcase.test.ts LMS/tochka-sborki/web/components/showcase-gallery.tsx
git commit -m "feat(showcase): real-proof case layer + two-section gallery (fb_2fbf86ac3c67)"
```

---

## Self-Review

**1. Spec coverage:**
- Real-proof layer (RealCase + REAL_CASES seed of 4 + result/author/href) → Task 3. ✓
- Dreams vs proof, two sub-sections, proof above, hidden when empty → Task 3 gallery (`t.real.cases.length > 0`). ✓
- DREAM_CASES rename, ≥4 unchanged → Task 3 (b). ✓
- Video facade (click-to-play, embed + file, poster/dark fallback, placeholder when null) → Task 2 component. ✓
- `resolveVideoSource` / `withAutoplay` / `VIDEO.poster` → Task 1. ✓
- Tests: helper classification, `dream.cases` migration, real-case fields, ru≠en → Tasks 1 & 3. ✓
- Bilingual, static-export, no server/migration → Global Constraints + single `'use client'` file. ✓
- Authenticity (no metrics) → seed copy is qualitative; Global Constraints. ✓
- Out of scope (record video, blog posts, hub landing, CMS) → not built. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; full bilingual copy inline. ✓

**3. Type consistency:** `VideoSource`, `resolveVideoSource`, `withAutoplay` (Task 1) used identically in Tasks 2-3. `ShowcaseVM.{label,video,real,dream,cta}` defined in Task 3 and consumed by the same task's gallery. `ResolvedReal` carries `result`/`author`; gallery reads `c.result`/`c.author`. `getShowcase` no longer returns `videoUrl`/`heading`/`cases` — the rewritten gallery reads none of them. ✓
