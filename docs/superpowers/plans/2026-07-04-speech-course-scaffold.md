# Speech Course — S1 Dark Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold an isolated, dark speech/oratory course — engine+keyed-data (`lib/speech/course.ts`) + a dark `/speech` syllabus surface — with six "in preparation" lesson stubs, touching no AI-course machinery.

**Architecture:** A keyed-data module holds the 6-lesson bilingual outline + a resolver (mirroring `lib/course/certificate.ts`). A presentational syllabus card (mirroring `igi-ritual.tsx`) renders it with an honest "готовится / in preparation" badge per lesson. Two thin server pages expose `/speech` + `/en/speech`. Everything lives under `lib/speech/` + `app/speech/`, invisible to the AI course's filesystem scanners.

**Tech Stack:** TypeScript, Next.js App Router (`LMS/tochka-sborki/web`), Vitest.

## Global Constraints

- **Isolation (critical):** speech code lives in `lib/speech/` + `app/speech/`, NEVER in `content/{locale}/`; no AI-course file (`content.ts`, `lib/rpg/*`, `nav.tsx`, `MODULE_SLUGS`) is modified. Lesson slugs must NOT match `/^\d{2}-/`.
- **Engine + keyed-data:** `Bi { ru; en }` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `lintDehustle` from `@/lib/authoring/dehustle`.
- **The 6 lesson slugs, verbatim & in order:** `prep`, `plan`, `devices`, `delivery`, `memory`, `audience`.
- **De-hustle:** every speech string (title, tagline, each lesson title + objective) passes `lintDehustle` (`[]` = clean). Service-first tone; no manipulation/urgency/scarcity/vanity.
- **Dark-ship / facade:** honest "готовится" / "in preparation" badge per lesson; `/speech` is NOT added to the main nav; pages set `robots: { index: false, follow: false }`.
- **Structure-only:** no proprietary 4brain text. **No-Mermaid; sole-prop.**
- Trunk-based on `main`; TDD; commit per task. Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run` (+ `npx next build` for the page task).

---

### Task 1: `lib/speech/course.ts` engine + keyed-data

**Files:**
- Create: `LMS/tochka-sborki/web/lib/speech/course.ts`
- Test: `LMS/tochka-sborki/web/lib/speech/course.test.ts`

**Interfaces:**
- Consumes: `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `lintDehustle` from `@/lib/authoring/dehustle`.
- Produces:
  - `interface SpeechLesson { slug: string; title: Bi; objective: Bi }`
  - `interface SpeechCourse { title: Bi; tagline: Bi; lessons: SpeechLesson[] }`
  - `const SPEECH_COURSE: SpeechCourse` (6 lessons)
  - `interface ResolvedSpeechLesson { slug: string; title: string; objective: string }`
  - `interface ResolvedSpeechCourse { title: string; tagline: string; lessons: ResolvedSpeechLesson[] }`
  - `function resolveSpeechCourse(locale: Locale, source?: SpeechCourse): ResolvedSpeechCourse`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/speech/course.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SPEECH_COURSE, resolveSpeechCourse } from './course'
import { lintDehustle } from '../authoring/dehustle'

describe('SPEECH_COURSE', () => {
  it('has exactly the 6 expected lesson slugs in order', () => {
    expect(SPEECH_COURSE.lessons.map(l => l.slug)).toEqual([
      'prep', 'plan', 'devices', 'delivery', 'memory', 'audience',
    ])
  })

  it('has unique slugs', () => {
    const slugs = SPEECH_COURSE.lessons.map(l => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('isolation: no lesson slug looks like an AI-course NN- entry', () => {
    for (const l of SPEECH_COURSE.lessons) {
      expect(l.slug).not.toMatch(/^\d{2}-/)
    }
  })

  it('is de-hustle clean across title, tagline, and every lesson field (both locales)', () => {
    const strings = [
      SPEECH_COURSE.title.ru, SPEECH_COURSE.title.en,
      SPEECH_COURSE.tagline.ru, SPEECH_COURSE.tagline.en,
      ...SPEECH_COURSE.lessons.flatMap(l => [l.title.ru, l.title.en, l.objective.ru, l.objective.en]),
    ]
    for (const s of strings) expect(lintDehustle(s)).toEqual([])
  })
})

describe('resolveSpeechCourse', () => {
  it('returns 6 lessons with non-empty localized fields', () => {
    for (const loc of ['ru', 'en'] as const) {
      const r = resolveSpeechCourse(loc)
      expect(r.title.length).toBeGreaterThan(0)
      expect(r.tagline.length).toBeGreaterThan(0)
      expect(r.lessons).toHaveLength(6)
      for (const l of r.lessons) {
        expect(l.title.length).toBeGreaterThan(0)
        expect(l.objective.length).toBeGreaterThan(0)
      }
    }
  })

  it('localizes (a sampled field differs between ru and en)', () => {
    expect(resolveSpeechCourse('ru').tagline).not.toBe(resolveSpeechCourse('en').tagline)
  })

  it('accepts an injected fixture source', () => {
    const fixture = {
      title: { ru: 'Т', en: 'T' }, tagline: { ru: 'таг', en: 'tag' },
      lessons: [{ slug: 'x', title: { ru: 'а', en: 'a' }, objective: { ru: 'о', en: 'o' } }],
    }
    const r = resolveSpeechCourse('en', fixture)
    expect(r.lessons[0].title).toBe('a')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/speech/course.test.ts`
Expected: FAIL — `Cannot find module './course'`.

- [ ] **Step 3: Write the implementation**

Create `LMS/tochka-sborki/web/lib/speech/course.ts`:

```ts
// lib/speech/course.ts
// Speech/oratory course — S1 dark scaffold (fb_015e518d). ISOLATED from the Точка-Сборки AI course:
// lives here + app/speech/, never under content/{locale}/, so the AI-course scanners
// (getAllLessons/getNavigationItems/MODULE_SLUGS) can never pick it up. Engine+keyed-data mirrors
// lib/course/certificate.ts. The 6 lesson titles + one-line objectives are the methodological
// SKELETON (structure-only); the lesson prose is owner-authored later (S2–S5). Every string is
// de-hustle clean (course.test.ts asserts lintDehustle []).
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface SpeechLesson { slug: string; title: Bi; objective: Bi }
export interface SpeechCourse { title: Bi; tagline: Bi; lessons: SpeechLesson[] }

export const SPEECH_COURSE: SpeechCourse = {
  title: { ru: 'Ораторское мастерство', en: 'The Art of Speaking' },
  tagline: {
    ru: 'Говорить так, чтобы за тобой шли — служа, а не манипулируя.',
    en: 'Speak so people follow — by serving, not by manipulating.',
  },
  lessons: [
    {
      slug: 'prep',
      title: { ru: 'Подготовка речи', en: 'Preparing the talk' },
      objective: {
        ru: 'Понять, зачем ты выходишь говорить, и собрать материал под живую цель.',
        en: "Know why you're speaking, and gather material around a living goal.",
      },
    },
    {
      slug: 'plan',
      title: { ru: 'План выступления', en: 'Structuring the talk' },
      objective: {
        ru: 'Собрать выступление в ясную структуру под аудиторию и тайминг.',
        en: 'Shape the talk into a clear structure for your audience and timing.',
      },
    },
    {
      slug: 'devices',
      title: { ru: 'Ораторские приёмы', en: 'Rhetorical devices' },
      objective: {
        ru: 'Освоить приёмы, что держат внимание без давления.',
        en: 'Learn devices that hold attention without pressure.',
      },
    },
    {
      slug: 'delivery',
      title: { ru: 'Техника произнесения', en: 'Delivery' },
      objective: {
        ru: 'Владеть голосом: интонация, дикция, артикуляция, темп, пауза, жест.',
        en: 'Own your voice: intonation, diction, articulation, tempo, pause, gesture.',
      },
    },
    {
      slug: 'memory',
      title: { ru: 'Запоминание текста', en: 'Holding the text' },
      objective: {
        ru: 'Держать текст без зубрёжки — через смысл и опоры.',
        en: 'Hold your text without cramming — through meaning and anchors.',
      },
    },
    {
      slug: 'audience',
      title: { ru: 'Работа с аудиторией', en: 'Working with the audience' },
      objective: {
        ru: 'Быть в контакте с залом: удерживать внимание и отвечать живо.',
        en: 'Stay in contact with the room: hold attention and respond alive.',
      },
    },
  ],
}

export interface ResolvedSpeechLesson { slug: string; title: string; objective: string }
export interface ResolvedSpeechCourse { title: string; tagline: string; lessons: ResolvedSpeechLesson[] }

export function resolveSpeechCourse(locale: Locale, source: SpeechCourse = SPEECH_COURSE): ResolvedSpeechCourse {
  return {
    title: source.title[locale],
    tagline: source.tagline[locale],
    lessons: source.lessons.map(l => ({ slug: l.slug, title: l.title[locale], objective: l.objective[locale] })),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/speech/course.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/speech/course.ts LMS/tochka-sborki/web/lib/speech/course.test.ts
git commit -m "feat(speech): dark speech-course keyed-data engine (fb_015e518d)"
```

---

### Task 2: `/speech` dark syllabus surface

**Files:**
- Create: `LMS/tochka-sborki/web/components/speech-syllabus.tsx`
- Create: `LMS/tochka-sborki/web/app/speech/page.tsx`
- Create: `LMS/tochka-sborki/web/app/en/speech/page.tsx`

**Interfaces:**
- Consumes: `resolveSpeechCourse` from `@/lib/speech/course`; `Locale` from `@/lib/dictionaries`; `Nav` from `@/components/nav`.
- Produces: nothing downstream. Build-validated.

> **Note:** presentational + thin pages; no unit test (mirror the `/alumni` + `igi-ritual` precedent). Verified by `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 1: Create the syllabus component**

Create `LMS/tochka-sborki/web/components/speech-syllabus.tsx` (NOT `'use client'`; mirrors `igi-ritual.tsx` chrome):

```tsx
import type { Locale } from '@/lib/dictionaries'
import { resolveSpeechCourse } from '@/lib/speech/course'

export function SpeechSyllabus({ locale }: { locale: Locale }) {
  const c = resolveSpeechCourse(locale)
  const badge = locale === 'en' ? 'in preparation' : 'готовится'
  const intro = locale === 'en'
    ? 'This course is in preparation. Here is the shape it will take.'
    : 'Курс готовится. Вот структура, которую он примет.'
  return (
    <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)', marginBottom: '2.5rem' }}>
      <h1 style={{ margin: '0 0 .5rem', fontSize: '1.4rem', color: 'var(--text-primary)' }}>{c.title}</h1>
      <p style={{ margin: '0 0 1rem', fontSize: '.95rem', lineHeight: 1.55, color: 'var(--text-primary)', borderLeft: '3px solid var(--text-accent)', paddingLeft: '.8rem' }}>{c.tagline}</p>
      <p style={{ margin: '0 0 1.25rem', fontSize: '.85rem', color: 'var(--text-secondary)' }}>{intro}</p>
      <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '.7rem' }}>
        {c.lessons.map((l) => (
          <li key={l.slug} style={{ fontSize: '.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.title}</span>
            <span style={{ marginLeft: '.5rem', fontFamily: 'var(--font-mono)', fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '.05rem .4rem' }}>{badge}</span>
            <div>{l.objective}</div>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: Create the Russian page**

Create `LMS/tochka-sborki/web/app/speech/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeechSyllabus } from '@/components/speech-syllabus'

export const metadata: Metadata = {
  title: 'Ораторское мастерство — Точка Сборки',
  description: 'Курс ораторского мастерства (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeechSyllabus locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the English page**

Create `LMS/tochka-sborki/web/app/en/speech/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeechSyllabus } from '@/components/speech-syllabus'

export const metadata: Metadata = {
  title: 'The Art of Speaking — Tochka Sborki',
  description: 'A course on the art of speaking (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeechSyllabus locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Typecheck + build**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx next build`
Expected: PASS — no type errors; build succeeds; `/speech` + `/en/speech` render.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/components/speech-syllabus.tsx LMS/tochka-sborki/web/app/speech/page.tsx LMS/tochka-sborki/web/app/en/speech/page.tsx
git commit -m "feat(speech): dark /speech syllabus surface (fb_015e518d)"
```

---

## Notes for the controller

- **No migration, no D1, no AI-course file touched.** Pure additive Next app files under `lib/speech/` + `app/speech/`.
- **Final gate** (whole feature): `cd LMS/tochka-sborki/web && npx vitest run && npx tsc --noEmit && npx next build`.
- **Isolation check** the final review should confirm: `git diff --stat` shows only the new `lib/speech/*`, `components/speech-syllabus.tsx`, `app/speech/*`, `app/en/speech/*` files — no change to `content/`, `lib/content.ts`, `lib/rpg/*`, or `components/nav.tsx`.
