# Speed-reading course skeleton (dark) — Slice 1 of the «Скорочтение» epic

**Epic:** «Скорочтение» — an isolated speed-reading module for the S.A.S.H.A. academy,
hybrid **course + interactive trainers**. Methodology drawn from public-domain speed-reading
technique (Schulte tables, regression elimination, subvocalization suppression, peripheral
vision, key-extraction/mind-maps, Ebbinghaus retention) — reference site shaleny-ravlyk.com
was consulted for structure only; **zero of its copyrighted copy is used**.

**This slice (1):** the course **skeleton** — the isolated container + methodology taxonomy that
the later trainer slices (RSVP reader, Schulte tables, WPM entry/exit test, progress) plug into.
Exact mirror of the shipped speech-course skeleton (`lib/speech/course.ts`, fb_015e518d).

## Scope decision

Skeleton only. Lesson **prose** is owner-authored later (S2+); this slice ships 6 lesson titles +
one-line objectives (structure-only), a dark syllabus surface, and the resolver — nothing more.
No interactive trainer, no registry entry, no nav entry, no `content/` MDX. Trainers are separate
slices in the epic and are out of scope here.

## Architecture — exact mirror of the speech-course skeleton

### Isolation (why it lives outside `content/`)

Everything sits under `lib/speedreading/` + `app/speedreading/`, never under `content/{locale}/`,
so the AI-course scanners (`getAllLessons` / `getNavigationItems` / `MODULE_SLUGS`) and the RPG
layer can never pick it up. The syllabus page is `robots: { index: false, follow: false }`, carries
an "in preparation / готовится" badge, and is **not** wired into nav or `LMS/registry.json`.
Engine+keyed-data mirrors `lib/speech/course.ts` (which itself mirrors `lib/course/certificate.ts`).

### `lib/speedreading/course.ts`

```ts
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface SpeedreadingLesson { slug: string; title: Bi; objective: Bi }
export interface SpeedreadingCourse { title: Bi; tagline: Bi; lessons: SpeedreadingLesson[] }

export const SPEEDREADING_COURSE: SpeedreadingCourse = { title, tagline, lessons: [ …6… ] }

export interface ResolvedSpeedreadingLesson { slug: string; title: string; objective: string }
export interface ResolvedSpeedreadingCourse { title: string; tagline: string; lessons: ResolvedSpeedreadingLesson[] }

export function resolveSpeedreadingCourse(
  locale: Locale,
  source: SpeedreadingCourse = SPEEDREADING_COURSE,
): ResolvedSpeedreadingCourse
```

**Title / tagline** (honest, anti-hype — NO "guaranteed ×2-3", NO scarcity/urgency):
- title: `{ ru: 'Скорочтение', en: 'Speed Reading' }`
- tagline: `{ ru: 'Читать быстрее и удерживать больше — через тренировку внимания и глаз.',
  en: 'Read faster and remember more — by training your eyes and attention.' }`

**6 lessons** (arc: measure → release the brakes → widen intake → hold meaning → keep it long-term):

| slug | title.ru | title.en | objective (ru → en) |
|------|----------|----------|---------------------|
| `baseline` | Замер и привычки | Baseline & habits | Понять текущую скорость чтения и что её тормозит. → See your current reading speed and what slows it down. |
| `regression` | Возвраты глаз | Eliminating regression | Перестать неосознанно перечитывать назад. → Stop unconsciously re-reading backwards. |
| `subvocalization` | Внутренний голос | Quieting the inner voice | Ослабить внутреннее проговаривание, чтобы читать быстрее речи. → Ease the inner voicing so you read faster than speech. |
| `peripheral` | Периферийное зрение | Widening the gaze | Захватывать взглядом блоки слов, а не отдельные буквы. → Take in blocks of words at a glance, not single letters. |
| `comprehension` | Удержание смысла | Holding the meaning | Вытаскивать ключевое и держать структуру текста. → Pull out the key points and hold the text's structure. |
| `retention` | Долгая память | Making it stick | Возвращаться к прочитанному так, чтобы оно осталось. → Revisit what you read so it stays with you. |

### `lib/speedreading/course.test.ts` (mirror `lib/speech/course.test.ts`)

- `SPEEDREADING_COURSE.lessons` slugs `toEqual(['baseline','regression','subvocalization','peripheral','comprehension','retention'])` in order.
- Slugs unique.
- Isolation: no slug matches `/^\d{2}-/`.
- **De-hustle: `lintDehustle []` across title.ru/en, tagline.ru/en, and every lesson title/objective (both locales).**
  ⚠ If any string trips `lintDehustle` (e.g. a banned scarcity/vanity token), reword the copy — do **not** weaken the guard.
- `resolveSpeedreadingCourse(loc)` for `ru` and `en`: title/tagline non-empty, 6 lessons, every title/objective non-empty.
- Localizes: `resolveSpeedreadingCourse('ru').tagline !== resolveSpeedreadingCourse('en').tagline`.
- Accepts an injected fixture source (1-lesson fixture resolves).

### `components/speedreading-syllabus.tsx` (mirror `components/speech-syllabus.tsx`)

Server component `SpeedreadingSyllabus({ locale }: { locale: Locale })`. Calls `resolveSpeedreadingCourse(locale)`.
Badge `locale === 'en' ? 'in preparation' : 'готовится'`. Intro line
EN `'This course is in preparation. Here is the shape it will take.'` /
RU `'Курс готовится. Вот структура, которую он примет.'`. Renders `<h1>` title, tagline blockquote,
intro, `<ol>` of lessons (title + badge + objective). Same inline-style chrome as speech-syllabus.

### `app/speedreading/page.tsx` (RU) + `app/en/speedreading/page.tsx` (EN)

Mirror `app/speech/page.tsx` / `app/en/speech/page.tsx`: `metadata` with `robots: { index: false, follow: false }`,
`<Nav locale=… />` + `<main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>` +
`<SpeedreadingSyllabus locale=… />`. Titles: RU `'Скорочтение — Точка Сборки'`,
EN `'Speed Reading — Tochka Sborki'`; descriptions note "(готовится)" / "(in preparation)".

## Global constraints

- Isolated course: outside `content/`, no registry entry, no nav entry, `robots: noindex`. Mirror speech.
- Engine+keyed-data `Bi`: data separate from resolver; `resolveSpeedreadingCourse(locale, source?)` injectable.
- De-hustle: every string under `lintDehustle []` (reuse `lib/authoring/dehustle.ts`, do not duplicate ban-list).
- Authenticity: no fabricated metrics, no "guaranteed" speed multipliers, no scarcity/urgency/vanity.
- Bilingual RU (primary) + EN, both routes.
- Sovereign: zero backend, zero LLM (skeleton is static data).
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run && npx next build`.
- Trunk-based `main`, one commit. **Ops:** git only via the PowerShell tool (bash-git hangs this session).

## Out of scope (later epic slices)

Interactive trainers (RSVP reader, Schulte tables, WPM entry/exit test), progress/CS integration,
lesson prose, registry/nav wiring, `content/` MDX, any backend or persistence.
