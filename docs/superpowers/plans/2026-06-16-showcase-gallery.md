# Витрина возможностей (showcase gallery) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Секция «Возможности» на LMS home-page (видео-слот + сетка кейсов + CTA на анкету), bilingual, контент в data-файле (`fb_b2a67b22be2c`).

**Architecture:** Pure data+helpers (`lib/showcase.ts`) + server-компонент (`showcase-gallery.tsx`, зеркало `dream-scenarios.tsx`) + вставка в `home-page.tsx`. Тест — на чистые функции (vitest env node).

**Tech Stack:** Next.js 16, React server component, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-16-showcase-gallery-design.md`
**Пути:** от `LMS/tochka-sborki/web/`. Тесты: `npx vitest run <path>`.

## Треки (непересекающиеся)
- **A:** `lib/showcase.ts`, `lib/showcase.test.ts`, `components/showcase-gallery.tsx`
- **B:** вставка в `components/pages/home-page.tsx`

---

## Track A — Task 1: data + helpers

**Files:** Create `lib/showcase.ts`

- [ ] **Step 1:** создать `lib/showcase.ts`:
```ts
import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface ShowcaseCase {
  id: string
  icon: string
  title: Bi
  blurb: Bi
  tag: Bi
  href?: string
}
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
const VIDEO: { url: string | null; caption: Bi } = {
  url: null, // впиши YouTube/Vimeo watch-URL — встроится автоматически
  caption: { ru: 'Короткий ролик о сути — скоро', en: 'A short film about the essence — coming soon' },
}

const CASES: ShowcaseCase[] = [
  { id: 'partner', icon: '🤝',
    title: { ru: 'AI-напарник под твою нишу', en: 'An AI partner for your niche' },
    blurb: { ru: 'Не «сделай за меня», а со-мыслящий компаньон, который держит контекст твоего дела и двигает тебя думать.', en: 'Not a "do-it-for-me", but a co-thinking companion that holds the context of your work and moves you to think.' },
    tag: { ru: 'Со-мышление', en: 'Co-thinking' } },
  { id: 'weekend', icon: '🚀',
    title: { ru: 'Продукт за выходные', en: 'A product in a weekend' },
    blurb: { ru: 'От идеи до работающего прототипа — лендинг, бот, мини-сервис, — собранного с агентом за пару вечеров.', en: 'From idea to a working prototype — a landing page, a bot, a mini-service — built with an agent in a couple of evenings.' },
    tag: { ru: 'Запуск', en: 'Launch' } },
  { id: 'routine', icon: '⚙️',
    title: { ru: 'Автоматизация рутины', en: 'Routine on autopilot' },
    blurb: { ru: 'Повторяющиеся задачи — отчёты, разборы, рассылки — уходят в пайплайн, который работает без тебя.', en: 'Repetitive tasks — reports, breakdowns, mailings — move into a pipeline that runs without you.' },
    tag: { ru: 'Поток', en: 'Flow' } },
  { id: 'brain', icon: '🧠',
    title: { ru: 'Второй мозг', en: 'A second brain' },
    blurb: { ru: 'Твои заметки, источники и опыт — в граф знаний, который отвечает на вопросы и находит связи.', en: 'Your notes, sources, and experience — in a knowledge graph that answers questions and finds connections.' },
    tag: { ru: 'Знание', en: 'Knowledge' } },
]

export function videoEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

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

- [ ] **Step 2: Commit**
```bash
git add LMS/tochka-sborki/web/lib/showcase.ts
git commit -m "feat(showcase): showcase data + getShowcase/videoEmbedUrl (fb_b2a67b22be2c)"
```

## Track A — Task 2: тест

**Files:** Create `lib/showcase.test.ts`

- [ ] **Step 1:** создать `lib/showcase.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getShowcase, videoEmbedUrl } from './showcase'

describe('getShowcase', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`label/heading/cta + >=4 cases with content (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.heading.length).toBeGreaterThan(0)
      expect(s.cta.length).toBeGreaterThan(0)
      expect(s.cases.length).toBeGreaterThanOrEqual(4)
      for (const c of s.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
      }
    })
  }
  it('ru and en differ', () => {
    expect(getShowcase('ru').heading).not.toBe(getShowcase('en').heading)
  })
})

describe('videoEmbedUrl', () => {
  it('null passthrough', () => expect(videoEmbedUrl(null)).toBeNull())
  it('youtu.be → nocookie embed', () => expect(videoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123'))
  it('youtube watch → embed', () => expect(videoEmbedUrl('https://www.youtube.com/watch?v=XYZ_1')).toBe('https://www.youtube-nocookie.com/embed/XYZ_1'))
  it('vimeo → player', () => expect(videoEmbedUrl('https://vimeo.com/12345')).toBe('https://player.vimeo.com/video/12345'))
  it('unknown URL passthrough', () => expect(videoEmbedUrl('https://example.com/v.mp4')).toBe('https://example.com/v.mp4'))
})
```

- [ ] **Step 2:** `npx vitest run lib/showcase.test.ts` → PASS (7).
- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/lib/showcase.test.ts
git commit -m "test(showcase): getShowcase + videoEmbedUrl (fb_b2a67b22be2c)"
```

## Track A — Task 3: компонент

**Files:** Create `components/showcase-gallery.tsx`

- [ ] **Step 1:** создать `components/showcase-gallery.tsx` (server-компонент, как `dream-scenarios.tsx` — без `'use client'`):
```tsx
import { getShowcase, videoEmbedUrl } from '@/lib/showcase'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseGallery({ locale }: { locale: Locale }) {
  const t = getShowcase(locale)
  const embed = videoEmbedUrl(t.videoUrl)
  const intakeHref = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'

  const card: React.CSSProperties = {
    display: 'block', padding: '1.2rem', borderRadius: 12,
    border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
    color: 'inherit', textDecoration: 'none',
  }

  return (
    <section className="home-section" style={{ padding: 'var(--section-gap) 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.6rem' }}>{t.label}</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '1.6rem' }}>{t.heading}</h2>

        <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', marginBottom: '2rem' }}>
          {embed ? (
            <iframe src={embed} title={t.heading} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: 'var(--text-secondary)' }}>
              <span aria-hidden="true" style={{ fontSize: '2.4rem' }}>▶</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{t.videoCaption}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {t.cases.map(c => {
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

- [ ] **Step 2: Commit**
```bash
git add LMS/tochka-sborki/web/components/showcase-gallery.tsx
git commit -m "feat(showcase): ShowcaseGallery секция — видео-слот + сетка кейсов (fb_b2a67b22be2c)"
```

---

## Track B — Task 4: вставка в home-page

**Files:** Modify `components/pages/home-page.tsx`

- [ ] **Step 1:** добавить импорт (рядом с другими секционными импортами вверху файла):
```tsx
import { ShowcaseGallery } from '@/components/showcase-gallery'
```
- [ ] **Step 2:** вставить секцию сразу ПОСЛЕ строки `<DreamScenarios locale={locale} />`:
```tsx
      <DreamScenarios locale={locale} />
      <ShowcaseGallery locale={locale} />
```
(заменить `<DreamScenarios locale={locale} />` на обе строки.)

- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/components/pages/home-page.tsx
git commit -m "feat(showcase): витрина возможностей в LMS home после DreamScenarios (fb_b2a67b22be2c)"
```

---

## Task 5: Верификация + write-back (оркестратор)

- [ ] **Step 1:** `npx vitest run lib/showcase.test.ts` → PASS (7).
- [ ] **Step 2:** `npx vitest run` (вся LMS-сьюта) → зелёная (+7).
- [ ] **Step 3:** `npx tsc --noEmit` → rc 0 (ловит ошибки компонента/импорта).
- [ ] **Step 4: Write-back:**
```bash
node feedback/scripts/fb.mjs status fb_b2a67b22be2c done
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): fb_b2a67b22be2c done — витрина возможностей (структура+слоты)"
```

## Самопроверка плана
- **Покрытие спеки:** lib/showcase.ts (data+getShowcase+videoEmbedUrl) T1 ✓ · тест T2 ✓ · ShowcaseGallery (video-слот null→постер, сетка кейсов, CTA→quest-intake) T3 ✓ · вставка после DreamScenarios T4 ✓ · bilingual ✓ · verify+writeback T5 ✓.
- **Плейсхолдеров-нарушений нет:** кейсы — финальные вдохновляющие тексты (не TODO); `VIDEO.url=null` — намеренный слот.
- **Консистентность:** `getShowcase/videoEmbedUrl/ShowcaseVM` едины в T1/T2/T3; `ShowcaseGallery({locale})` — сигнатура T3 = вызов T4.
