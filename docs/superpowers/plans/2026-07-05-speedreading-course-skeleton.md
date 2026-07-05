# Speed-reading Course Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the isolated "Скорочтение" (Speed Reading) course skeleton — engine+keyed-data methodology taxonomy (6 lessons) + a dark bilingual syllabus surface — as an exact mirror of the shipped speech-course skeleton.

**Architecture:** All logic lives under `lib/speedreading/` and pages under `app/speedreading/`, outside `content/` so the AI-course scanners and RPG layer never pick it up. `course.ts` holds `Bi`-keyed data + a `resolveSpeedreadingCourse(locale, source?)` resolver; a server component renders the data; two page routes (RU + EN) mount it with `robots: noindex`. Zero backend, zero LLM, pure static data.

**Tech Stack:** TypeScript, Next.js 16 App Router (`output: 'export'`), Vitest, `lib/authoring/dehustle.ts` `lintDehustle` for the de-hustle guard.

## Global Constraints

- Isolated course: files under `lib/speedreading/` + `app/speedreading/`, never `content/{locale}/`. No `LMS/registry.json` entry, no nav entry. Mirror `lib/speech/`.
- Engine+keyed-data: `Bi` data separate from resolver; `resolveSpeedreadingCourse(locale, source = SPEEDREADING_COURSE)` — `source` injectable.
- `Bi` type imported from `@/lib/course`; `Locale` type imported from `@/lib/dictionaries`.
- De-hustle: every string under `lintDehustle []` (reuse `lib/authoring/dehustle.ts`; do not duplicate the ban-list). If a string trips the lint, reword copy — never weaken the guard.
- Authenticity: no fabricated metrics, no "guaranteed" speed multipliers, no scarcity/urgency/vanity.
- Bilingual RU (primary) + EN; both page routes present.
- Pages carry `robots: { index: false, follow: false }` and a "готовится" / "in preparation" badge.
- Web gate (run from `LMS/tochka-sborki/web`): `npx tsc --noEmit && npx vitest run && npx next build`.
- Trunk-based `main`, one commit per task. **Ops: run all git via the PowerShell tool — bash-git hangs this session.** Commit message trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- All paths below starting `lib/`, `components/`, `app/` are relative to `LMS/tochka-sborki/web/`.

---

### Task 1: Course data + resolver + tests (`lib/speedreading/course.ts`)

**Files:**
- Create: `lib/speedreading/course.ts`
- Test: `lib/speedreading/course.test.ts`

**Interfaces:**
- Consumes: `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`.
- Produces (later tasks rely on these exact names):
  - `interface SpeedreadingLesson { slug: string; title: Bi; objective: Bi }`
  - `interface SpeedreadingCourse { title: Bi; tagline: Bi; lessons: SpeedreadingLesson[] }`
  - `const SPEEDREADING_COURSE: SpeedreadingCourse`
  - `interface ResolvedSpeedreadingLesson { slug: string; title: string; objective: string }`
  - `interface ResolvedSpeedreadingCourse { title: string; tagline: string; lessons: ResolvedSpeedreadingLesson[] }`
  - `function resolveSpeedreadingCourse(locale: Locale, source?: SpeedreadingCourse): ResolvedSpeedreadingCourse`

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/course.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SPEEDREADING_COURSE, resolveSpeedreadingCourse } from './course'
import { lintDehustle } from '../authoring/dehustle'

describe('SPEEDREADING_COURSE', () => {
  it('has exactly the 6 expected lesson slugs in order', () => {
    expect(SPEEDREADING_COURSE.lessons.map(l => l.slug)).toEqual([
      'baseline', 'regression', 'subvocalization', 'peripheral', 'comprehension', 'retention',
    ])
  })

  it('has unique slugs', () => {
    const slugs = SPEEDREADING_COURSE.lessons.map(l => l.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('isolation: no lesson slug looks like an AI-course NN- entry', () => {
    for (const l of SPEEDREADING_COURSE.lessons) {
      expect(l.slug).not.toMatch(/^\d{2}-/)
    }
  })

  it('is de-hustle clean across title, tagline, and every lesson field (both locales)', () => {
    const strings = [
      SPEEDREADING_COURSE.title.ru, SPEEDREADING_COURSE.title.en,
      SPEEDREADING_COURSE.tagline.ru, SPEEDREADING_COURSE.tagline.en,
      ...SPEEDREADING_COURSE.lessons.flatMap(l => [l.title.ru, l.title.en, l.objective.ru, l.objective.en]),
    ]
    for (const s of strings) expect(lintDehustle(s)).toEqual([])
  })
})

describe('resolveSpeedreadingCourse', () => {
  it('returns 6 lessons with non-empty localized fields', () => {
    for (const loc of ['ru', 'en'] as const) {
      const r = resolveSpeedreadingCourse(loc)
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
    expect(resolveSpeedreadingCourse('ru').tagline).not.toBe(resolveSpeedreadingCourse('en').tagline)
  })

  it('accepts an injected fixture source', () => {
    const fixture = {
      title: { ru: 'Т', en: 'T' }, tagline: { ru: 'таг', en: 'tag' },
      lessons: [{ slug: 'x', title: { ru: 'а', en: 'a' }, objective: { ru: 'о', en: 'o' } }],
    }
    const r = resolveSpeedreadingCourse('en', fixture)
    expect(r.lessons[0].title).toBe('a')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/course.test.ts`
Expected: FAIL — cannot resolve `./course` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `lib/speedreading/course.ts`:

```ts
// lib/speedreading/course.ts
// Speed-reading course — Slice 1 dark skeleton (Скорочтение epic). ISOLATED from the
// Точка-Сборки AI course: lives here + app/speedreading/, never under content/{locale}/, so the
// AI-course scanners (getAllLessons/getNavigationItems/MODULE_SLUGS) can never pick it up.
// Engine+keyed-data mirrors lib/speech/course.ts. The 6 lesson titles + one-line objectives are
// the methodological SKELETON (structure-only); lesson prose is owner-authored later. Every string
// is de-hustle clean (course.test.ts asserts lintDehustle []). Methodology is public-domain
// speed-reading technique; no third-party copy is used.
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface SpeedreadingLesson { slug: string; title: Bi; objective: Bi }
export interface SpeedreadingCourse { title: Bi; tagline: Bi; lessons: SpeedreadingLesson[] }

export const SPEEDREADING_COURSE: SpeedreadingCourse = {
  title: { ru: 'Скорочтение', en: 'Speed Reading' },
  tagline: {
    ru: 'Читать быстрее и удерживать больше — через тренировку внимания и глаз.',
    en: 'Read faster and remember more — by training your eyes and attention.',
  },
  lessons: [
    {
      slug: 'baseline',
      title: { ru: 'Замер и привычки', en: 'Baseline & habits' },
      objective: {
        ru: 'Понять текущую скорость чтения и что её тормозит.',
        en: 'See your current reading speed and what slows it down.',
      },
    },
    {
      slug: 'regression',
      title: { ru: 'Возвраты глаз', en: 'Eliminating regression' },
      objective: {
        ru: 'Перестать неосознанно перечитывать назад.',
        en: 'Stop unconsciously re-reading backwards.',
      },
    },
    {
      slug: 'subvocalization',
      title: { ru: 'Внутренний голос', en: 'Quieting the inner voice' },
      objective: {
        ru: 'Ослабить внутреннее проговаривание, чтобы читать быстрее речи.',
        en: 'Ease the inner voicing so you read faster than speech.',
      },
    },
    {
      slug: 'peripheral',
      title: { ru: 'Периферийное зрение', en: 'Widening the gaze' },
      objective: {
        ru: 'Захватывать взглядом блоки слов, а не отдельные буквы.',
        en: 'Take in blocks of words at a glance, not single letters.',
      },
    },
    {
      slug: 'comprehension',
      title: { ru: 'Удержание смысла', en: 'Holding the meaning' },
      objective: {
        ru: 'Вытаскивать ключевое и держать структуру текста.',
        en: "Pull out the key points and hold the text's structure.",
      },
    },
    {
      slug: 'retention',
      title: { ru: 'Долгая память', en: 'Making it stick' },
      objective: {
        ru: 'Возвращаться к прочитанному так, чтобы оно осталось.',
        en: 'Revisit what you read so it stays with you.',
      },
    },
  ],
}

export interface ResolvedSpeedreadingLesson { slug: string; title: string; objective: string }
export interface ResolvedSpeedreadingCourse { title: string; tagline: string; lessons: ResolvedSpeedreadingLesson[] }

export function resolveSpeedreadingCourse(
  locale: Locale,
  source: SpeedreadingCourse = SPEEDREADING_COURSE,
): ResolvedSpeedreadingCourse {
  return {
    title: source.title[locale],
    tagline: source.tagline[locale],
    lessons: source.lessons.map(l => ({ slug: l.slug, title: l.title[locale], objective: l.objective[locale] })),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/course.test.ts`
Expected: PASS — all cases green. If the de-hustle case fails, a string tripped `lintDehustle`; reword that copy (do not touch the test).

- [ ] **Step 5: Type-check**

Run (from `LMS/tochka-sborki/web`): `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/course.ts LMS/tochka-sborki/web/lib/speedreading/course.test.ts
git commit -m @'
feat(speedreading): course-skeleton data + resolver (slice 1 task 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: Syllabus component + RU/EN page routes

**Files:**
- Create: `components/speedreading-syllabus.tsx`
- Create: `app/speedreading/page.tsx`
- Create: `app/en/speedreading/page.tsx`

**Interfaces:**
- Consumes: `resolveSpeedreadingCourse` from `@/lib/speedreading/course` (Task 1); `Locale` from `@/lib/dictionaries`; `Nav` from `@/components/nav`.
- Produces: `SpeedreadingSyllabus({ locale }: { locale: Locale })` server component; two Next.js page routes at `/speedreading` and `/en/speedreading`.

- [ ] **Step 1: Create the syllabus component**

Create `components/speedreading-syllabus.tsx` (mirror of `components/speech-syllabus.tsx`):

```tsx
import type { Locale } from '@/lib/dictionaries'
import { resolveSpeedreadingCourse } from '@/lib/speedreading/course'

export function SpeedreadingSyllabus({ locale }: { locale: Locale }) {
  const c = resolveSpeedreadingCourse(locale)
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

- [ ] **Step 2: Create the RU page route**

Create `app/speedreading/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'

export const metadata: Metadata = {
  title: 'Скорочтение — Точка Сборки',
  description: 'Курс скорочтения (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the EN page route**

Create `app/en/speedreading/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'

export const metadata: Metadata = {
  title: 'Speed Reading — Tochka Sborki',
  description: 'A speed-reading course (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Type-check**

Run (from `LMS/tochka-sborki/web`): `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full web gate**

Run (from `LMS/tochka-sborki/web`): `npx vitest run && npx next build`
Expected: all tests pass; build succeeds and statically exports `/speedreading` and `/en/speedreading`.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/components/speedreading-syllabus.tsx LMS/tochka-sborki/web/app/speedreading/page.tsx LMS/tochka-sborki/web/app/en/speedreading/page.tsx
git commit -m @'
feat(speedreading): dark syllabus surface RU+EN (slice 1 task 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

## Notes for the executor

- **Do not** add the course to `LMS/registry.json`, to `components/nav.tsx`, or to `content/{ru,en}/`. It must stay dark and isolated — exactly like the speech course.
- The `Bi` type and `Locale` type already exist; import them, do not redefine.
- If `lintDehustle` flags a string in Task 1, reword the offending copy and keep the arc/meaning; never edit the test to pass.
- Hold the push until the user's "go" gate (per the standing workflow); commit locally per task.
