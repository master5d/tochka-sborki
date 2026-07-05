# Speech course — S1 dark scaffold

**Ticket:** fb_015e518dc797 (#1 of the "all" sequence; sub-project 1/6 of the speech-course epic)
**Date:** 2026-07-04
**Status:** approved

## Goal

Scaffold an **isolated, dark** speech/oratory course as an engine+keyed-data
module plus a dark syllabus surface (`/speech`), WITHOUT touching the
Точка-Сборки AI-course machinery. Six lessons render as "in preparation"
stubs awaiting owner-authored prose (deferred sub-projects S2–S5). This is
the reference-skeleton the ticket asks for, made concrete as a live-but-dark
surface.

## Scope decomposition (the epic)

A full 6-lesson speech course is a separate course from the 9-module AI
course (which is hard-wired to `MODULE_SLUGS` + RPG skins / quest-log /
niche-map). It decomposes into: **S1 scaffold (this spec)** · S2–S5
owner-authored prose/exercises/test/case (corpus-gated: Carnegie/Lemmermann
via the ebook pipeline, owner supplies — see [[feedback_corpus_user_supplies]])
· S6 technique-taxonomy rubric engine + AI speaking-coach (no consumer yet —
Echo is cross-repo). Only S1 is buildable now without the corpus.

## Constraints

- **Isolation (critical):** the speech course lives in `lib/speech/` +
  `app/speech/`, NEVER in `content/{locale}/`, so it is invisible to
  `getAllLessons` / `getAllModules` / `getNavigationItems` (which scan only
  `NN-`-prefixed entries in `content/`) and to `MODULE_SLUGS` / RPG /
  quest-log / niche-map. No AI-course file is modified.
- **Engine + keyed-data:** `Bi { ru; en }` data + a `resolveSpeechCourse(locale)`
  resolver, mirroring `lib/course/certificate.ts` / `lib/igi.ts`.
- **Structure-only, no proprietary text:** the 6 lesson titles + one-line
  objectives are the methodological SKELETON (allowed). The actual lesson
  prose is owner-authored from primary sources (S2–S5) — NOT fabricated here.
- **Authenticity / de-hustle:** contemplative, service-first tone (speak to
  serve, not manipulate — the ethic of the shipped package/automate tracks).
  Every speech string passes `lintDehustle` (`[]` = clean).
- **Dark-ship / facade:** each lesson shows an honest "готовится / in
  preparation" badge — no fake availability. The `/speech` route is NOT added
  to the main nav (reachable by URL only) until content lands.
- **No-Mermaid; sole-prop; trunk-based** on `main`; TDD; commit per task.

## Architecture

### 1. `lib/speech/course.ts` — engine + keyed-data

```ts
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface SpeechLesson { slug: string; title: Bi; objective: Bi }
export interface SpeechCourse { title: Bi; tagline: Bi; lessons: SpeechLesson[] }  // 6

export const SPEECH_COURSE: SpeechCourse = { /* below */ }

export interface ResolvedSpeechLesson { slug: string; title: string; objective: string }
export interface ResolvedSpeechCourse { title: string; tagline: string; lessons: ResolvedSpeechLesson[] }

export function resolveSpeechCourse(locale: Locale, source: SpeechCourse = SPEECH_COURSE): ResolvedSpeechCourse
```

`resolveSpeechCourse` maps each `Bi` through `[locale]` (mirror
`resolveCertificate`). `source` param for fixture-testing.

#### Exact `SPEECH_COURSE` content (owner-authored draft — confirm at spec review)

**title** — ru: `Ораторское мастерство` · en: `The Art of Speaking`

**tagline** —
- ru: `Говорить так, чтобы за тобой шли — служа, а не манипулируя.`
- en: `Speak so people follow — by serving, not by manipulating.`

**lessons** (6 — `slug`, `title`, `objective`):

1. `prep` — «Подготовка речи» / "Preparing the talk"
   - ru: `Понять, зачем ты выходишь говорить, и собрать материал под живую цель.`
   - en: `Know why you're speaking, and gather material around a living goal.`
2. `plan` — «План выступления» / "Structuring the talk"
   - ru: `Собрать выступление в ясную структуру под аудиторию и тайминг.`
   - en: `Shape the talk into a clear structure for your audience and timing.`
3. `devices` — «Ораторские приёмы» / "Rhetorical devices"
   - ru: `Освоить приёмы, что держат внимание без давления.`
   - en: `Learn devices that hold attention without pressure.`
4. `delivery` — «Техника произнесения» / "Delivery"
   - ru: `Владеть голосом: интонация, дикция, артикуляция, темп, пауза, жест.`
   - en: `Own your voice: intonation, diction, articulation, tempo, pause, gesture.`
5. `memory` — «Запоминание текста» / "Holding the text"
   - ru: `Держать текст без зубрёжки — через смысл и опоры.`
   - en: `Hold your text without cramming — through meaning and anchors.`
6. `audience` — «Работа с аудиторией» / "Working with the audience"
   - ru: `Быть в контакте с залом: удерживать внимание и отвечать живо.`
   - en: `Stay in contact with the room: hold attention and respond alive.`

### 2. `components/speech-syllabus.tsx` — dark syllabus card

- **Not** `'use client'` (pure display). Props `{ locale: Locale }`; calls
  `resolveSpeechCourse(locale)`. Renders: title, tagline, and an ordered list
  (`<ol>`) of the 6 lessons — each shows its `title`, `objective` (muted), and
  an **"готовится" / "in preparation"** badge. Inline styles on CSS-vars
  (`--border-color`, `--bg-surface`, `--text-primary/secondary/accent`,
  `--font-mono`), matching `office-hours-card` / `igi-ritual` chrome.
- A short honest intro line stating the course is in preparation.

### 3. `app/speech/page.tsx` + `app/en/speech/page.tsx` — dark route

- Thin server pages: `<Nav locale={.} />` + `<SpeechSyllabus locale={.} />`,
  mirroring the existing `/login` / `/alumni` page shells. `metadata` title
  `Ораторское мастерство — Точка Сборки` (ru) / `The Art of Speaking` (en).
- NOT linked from `components/nav.tsx` (dark). Reachable by URL.

## Testing

- `lib/speech/course.test.ts` (env=node):
  - `SPEECH_COURSE.lessons` has exactly 6; slugs unique and equal
    `['prep','plan','devices','delivery','memory','audience']`.
  - `resolveSpeechCourse('ru'|'en')` returns 6 lessons, every field a
    non-empty string; a sampled field differs between ru and en.
  - de-hustle: `lintDehustle` returns `[]` for title, tagline, and every
    lesson title + objective, both locales.
  - **isolation:** no speech slug matches `/^\d{2}-/` (so the AI-course
    filesystem scanners can never pick them up).
- Pages: build-validated (`npx tsc --noEmit` + `npx next build`), no unit
  test (mirror existing page precedent).

## Decomposition → SDD tasks (writing-plans finalizes)

1. `lib/speech/course.ts` engine + keyed-data + `lib/speech/course.test.ts`.
2. `components/speech-syllabus.tsx` + `app/speech/page.tsx` + `app/en/speech/page.tsx`, build-validated.

## Out of scope

- S2–S5: lesson prose, 30 exercises, the test, the case «Развитие силы
  взгляда» — owner-authored + corpus-gated (Carnegie/Lemmermann).
- S6: the §4 technique-taxonomy rubric engine + AI speaking-coach prompt (no
  live consumer; Echo integration is cross-repo).
- The multi-course platform mechanism (course switching, per-course
  progress/RPG). This scaffold is a standalone dark surface, not a wired
  second course.
- Adding `/speech` to the main nav; any content/ tree for speech.
- Any nonprofit framing; copying 4brain text.
