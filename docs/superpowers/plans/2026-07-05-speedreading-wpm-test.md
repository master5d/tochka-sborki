# WPM Entry/Exit Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the WPM entry/exit test (slice 4 of the «Скорочтение» epic): the user reads a timed passage, answers comprehension questions, and gets a headline **effective WPM** (raw WPM × comprehension) plus the delta from their first test.

**Architecture:** A pure metric engine (`lib/speedreading/wpm.ts`, reusing `tokenize` from slice 2) + bilingual passage data (`passages.ts`) + a localStorage store + hook mirroring `lib/pacing` + a thin `'use client'` four-step component (intro → reading → quiz → result) whose quiz mirrors the existing `break-interstitial` MCQ pattern; two page routes mount it. Zero backend, zero LLM, no new deps.

**Tech Stack:** TypeScript, Next.js 16 App Router (`output: 'export'`), React (useState/useEffect/useRef/useMemo), Vitest, `lib/authoring/dehustle.ts` `lintDehustle`.

## Global Constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/test/`. No `content/`, no `LMS/registry.json`, no nav entry. Both routes `robots: { index: false, follow: false }`.
- Pure engine / data / thin component: no DOM in `wpm.ts`; the component delegates metric computation to the engine.
- Reuse: `wordCount` builds on `tokenize` from `./rsvp` (slice 2) — do not re-implement word splitting.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_wpm`; no clock in the store (date supplied by the hook).
- `Bi` imported from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `localDate` from `@/lib/quests/daily-store` — not redefined.
- De-hustle: every user-facing string (passages, questions, choices, UI labels) passes `lintDehustle []`. If a string trips the lint, reword it — never weaken the guard.
- Authenticity: WPM / comprehension / effective WPM are real measurements; no fabricated metrics, no shaming on wrong answers; passages are original (no third-party copyrighted text).
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM, no new dependencies.
- Web gate (from `LMS/tochka-sborki/web`): `npx tsc --noEmit && npx vitest run && npx next build`; the build must statically export `/speedreading/test` and `/en/speedreading/test`.
- Trunk-based `main`, one commit per task. **Ops: run all git via the PowerShell tool — bash-git hangs this session.** Run tsc/vitest/build via the Bash tool from the web dir. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- All `lib/`, `components/`, `app/` paths below are relative to `LMS/tochka-sborki/web/`.

---

### Task 1: Pure WPM metric engine (`lib/speedreading/wpm.ts`)

**Files:**
- Create: `lib/speedreading/wpm.ts`
- Test: `lib/speedreading/wpm.test.ts`

**Interfaces:**
- Consumes: `tokenize` from `./rsvp` (slice 2).
- Produces: `wordCount(text): number`, `computeWpm(words, ms): number`, `comprehensionFraction(correct, total): number`, `effectiveWpm(wpm, fraction): number`.

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/wpm.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { wordCount, computeWpm, comprehensionFraction, effectiveWpm } from './wpm'

describe('wordCount', () => {
  it('counts whitespace-separated words (matches tokenize)', () => {
    expect(wordCount('  one two   three\nfour ')).toBe(4)
    expect(wordCount('')).toBe(0)
  })
})

describe('computeWpm', () => {
  it('words per minute, rounded', () => {
    expect(computeWpm(300, 60000)).toBe(300)
    expect(computeWpm(150, 30000)).toBe(300)
    expect(computeWpm(100, 40000)).toBe(150)
  })
  it('non-positive ms → 0', () => {
    expect(computeWpm(300, 0)).toBe(0)
    expect(computeWpm(300, -5)).toBe(0)
  })
})

describe('comprehensionFraction', () => {
  it('correct / total, guarded', () => {
    expect(comprehensionFraction(3, 3)).toBe(1)
    expect(comprehensionFraction(1, 2)).toBe(0.5)
    expect(comprehensionFraction(0, 3)).toBe(0)
    expect(comprehensionFraction(1, 0)).toBe(0)
  })
})

describe('effectiveWpm', () => {
  it('rounds wpm × fraction', () => {
    expect(effectiveWpm(400, 0.5)).toBe(200)
    expect(effectiveWpm(333, 1)).toBe(333)
    expect(effectiveWpm(300, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/wpm.test.ts`
Expected: FAIL — cannot resolve `./wpm`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/speedreading/wpm.ts`:

```ts
// lib/speedreading/wpm.ts
// Pure reading-metric engine (Скорочтение epic, slice 4). Reuses the slice-2 tokenizer for word count.
// effectiveWpm = raw WPM × comprehension fraction — the honest "effective reading speed".
import { tokenize } from './rsvp'

export function wordCount(text: string): number {
  return tokenize(text).length
}

export function computeWpm(words: number, ms: number): number {
  if (ms <= 0) return 0
  return Math.round(words / (ms / 60000))
}

export function comprehensionFraction(correct: number, total: number): number {
  if (total <= 0) return 0
  return correct / total
}

export function effectiveWpm(wpm: number, fraction: number): number {
  return Math.round(wpm * fraction)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/wpm.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/wpm.ts LMS/tochka-sborki/web/lib/speedreading/wpm.test.ts
git commit -m @'
feat(speedreading): pure WPM metric engine (slice 4 task 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: Passage data (`lib/speedreading/passages.ts`)

**Files:**
- Create: `lib/speedreading/passages.ts`
- Test: `lib/speedreading/passages.test.ts`

**Interfaces:**
- Consumes: `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`.
- Produces: `TestQuestion { prompt: Bi; choices: Bi[]; answer: number }`, `TestPassage { id: string; text: Bi; questions: TestQuestion[] }`, `PASSAGES: TestPassage[]`, `ResolvedQuestion { prompt: string; choices: string[]; answer: number }`, `ResolvedPassage { id: string; text: string; questions: ResolvedQuestion[] }`, `resolvePassage(passage, locale): ResolvedPassage`, `pickPassage(count: number): TestPassage`.

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/passages.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PASSAGES, resolvePassage, pickPassage } from './passages'
import { lintDehustle } from '../authoring/dehustle'

describe('PASSAGES', () => {
  it('has 3 passages with unique ids', () => {
    expect(PASSAGES).toHaveLength(3)
    const ids = PASSAGES.map(p => p.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids).toEqual(['attention', 'memory', 'vision'])
  })
  it('each passage has >= 3 questions, each with >= 3 choices and a valid answer index', () => {
    for (const p of PASSAGES) {
      expect(p.questions.length).toBeGreaterThanOrEqual(3)
      for (const q of p.questions) {
        expect(q.choices.length).toBeGreaterThanOrEqual(3)
        expect(q.answer).toBeGreaterThanOrEqual(0)
        expect(q.answer).toBeLessThan(q.choices.length)
      }
    }
  })
  it('is de-hustle clean across text, prompts, and choices in both locales', () => {
    const strings: string[] = []
    for (const p of PASSAGES) {
      strings.push(p.text.ru, p.text.en)
      for (const q of p.questions) {
        strings.push(q.prompt.ru, q.prompt.en, ...q.choices.flatMap(c => [c.ru, c.en]))
      }
    }
    for (const s of strings) expect(lintDehustle(s)).toEqual([])
  })
})

describe('resolvePassage', () => {
  it('localizes text and questions', () => {
    const ru = resolvePassage(PASSAGES[0], 'ru')
    const en = resolvePassage(PASSAGES[0], 'en')
    expect(ru.text).not.toBe(en.text)
    expect(ru.text.length).toBeGreaterThan(0)
    expect(ru.questions[0].choices.length).toBeGreaterThanOrEqual(3)
    expect(ru.questions[0].choices[0]).not.toBe(en.questions[0].choices[0])
    expect(ru.questions[0].answer).toBe(PASSAGES[0].questions[0].answer)
  })
})

describe('pickPassage', () => {
  it('rotates by count', () => {
    expect(pickPassage(0).id).toBe(PASSAGES[0].id)
    expect(pickPassage(1).id).toBe(PASSAGES[1].id)
    expect(pickPassage(PASSAGES.length).id).toBe(pickPassage(0).id)
    expect(pickPassage(0).id).not.toBe(pickPassage(1).id)
  })
})
```

Note: `choices` is a `Bi[]` — an array of `{ ru, en }` options (same shape as `break-interstitial`'s `PuzzleBreak.choices`). The test reads `q.choices.length` and `q.choices.flatMap(c => [c.ru, c.en])`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/speedreading/passages.test.ts`
Expected: FAIL — cannot resolve `./passages`.

- [ ] **Step 3: Write the implementation**

Create `lib/speedreading/passages.ts`. `choices` is a `Bi[]` — an array of `{ ru, en }` options (same shape as `break-interstitial`'s `PuzzleBreak.choices`), so the single `answer` index is locale-independent:

```ts
// lib/speedreading/passages.ts
// Original bilingual reading passages + comprehension questions for the WPM test (Скорочтение epic, slice 4).
// All prose is original and de-hustle clean (passages.test.ts asserts lintDehustle []). No third-party text.
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface TestQuestion { prompt: Bi; choices: Bi[]; answer: number }
export interface TestPassage { id: string; text: Bi; questions: TestQuestion[] }

export const PASSAGES: TestPassage[] = [
  {
    id: 'attention',
    text: {
      ru: 'Чтение начинается не с глаз, а с внимания. Глаз способен различить строку за доли секунды, но смысл возникает только там, куда направлено внимание. Если оно рассеяно, взгляд скользит по словам, а в голове почти ничего не остаётся — приходится возвращаться и перечитывать. Внимание работает как узкий луч: в каждый момент оно освещает небольшой участок текста. Чем спокойнее ум, тем ровнее движется этот луч и тем реже он перескакивает назад. Тренировка чтения — это во многом тренировка внимания: научиться удерживать луч на строке, не отвлекаясь на посторонние мысли. Когда внимание собрано, скорость растёт сама собой, потому что глазу больше не приходится дважды проходить один и тот же участок. Поэтому первый шаг быстрого чтения — не ускорять глаз, а успокоить и собрать внимание.',
      en: 'Reading begins not with the eyes but with attention. The eye can take in a line in a fraction of a second, yet meaning appears only where attention is pointed. When it is scattered, the gaze slides over the words and almost nothing stays in the mind, so you have to go back and read again. Attention works like a narrow beam: at any moment it lights up a small part of the text. The calmer the mind, the more evenly that beam moves and the less it jumps backward. Training your reading is largely training your attention — learning to hold the beam on the line without drifting into stray thoughts. When attention is gathered, speed grows on its own, because the eye no longer has to cross the same stretch twice. So the first step of faster reading is not to speed up the eye but to settle and gather attention.',
    },
    questions: [
      {
        prompt: { ru: 'С чего, по тексту, начинается чтение?', en: 'Where does reading begin, according to the text?' },
        choices: [
          { ru: 'Со скорости глаза', en: 'With eye speed' },
          { ru: 'С внимания', en: 'With attention' },
          { ru: 'С громкости голоса', en: 'With the loudness of the voice' },
          { ru: 'С размера шрифта', en: 'With font size' },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'Что происходит, когда внимание рассеяно?', en: 'What happens when attention is scattered?' },
        choices: [
          { ru: 'Скорость растёт', en: 'Speed increases' },
          { ru: 'Приходится возвращаться и перечитывать', en: 'You have to go back and re-read' },
          { ru: 'Глаз отдыхает', en: 'The eye rests' },
          { ru: 'Текст запоминается лучше', en: 'The text is remembered better' },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'Каков, по тексту, первый шаг быстрого чтения?', en: 'What is the first step of faster reading?' },
        choices: [
          { ru: 'Ускорять глаз', en: 'Speed up the eye' },
          { ru: 'Читать вслух', en: 'Read aloud' },
          { ru: 'Собрать и успокоить внимание', en: 'Settle and gather attention' },
          { ru: 'Увеличить шрифт', en: 'Enlarge the font' },
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'memory',
    text: {
      ru: 'Прочитать — не значит запомнить. Память устроена так, что большая часть новой информации быстро тускнеет: уже через сутки без повторения в голове остаётся лишь малая доля прочитанного. Психолог Герман Эббингауз описал это как кривую забывания — она круто падает в первые часы, а потом становится более пологой. И вот что важно: каждое повторение делает кривую положе — то, что мы возвращаем в память через день, через неделю и через месяц, держится куда дольше. Поэтому для чтения важна не только скорость, но и то, что происходит после. Короткий пересказ своими словами сразу после текста, а затем несколько разнесённых во времени повторений сохраняют больше, чем повторное чтение подряд. Смысл, связанный с тем, что вы уже знаете, забывается медленнее, чем отдельные разрозненные факты.',
      en: 'Reading something is not the same as remembering it. Memory is built so that most new information fades quickly: within a day, without review, only a small share of what you read is still in your head. The psychologist Hermann Ebbinghaus described this as the forgetting curve — it drops steeply in the first hours and then flattens out. And here is what matters: each review makes the curve gentler — what we bring back to mind after a day, a week, and a month holds far longer. So for reading, not only speed matters but also what happens afterward. A short retelling in your own words right after the text, followed by a few reviews spread over time, keeps more than reading it again straight through. Meaning tied to what you already know is forgotten more slowly than separate, disconnected facts.',
    },
    questions: [
      {
        prompt: { ru: 'Что происходит с большей частью новой информации через сутки без повторения?', en: 'What happens to most new information after a day without review?' },
        choices: [
          { ru: 'Она укрепляется', en: 'It gets stronger' },
          { ru: 'Остаётся лишь малая доля', en: 'Only a small share remains' },
          { ru: 'Она сохраняется полностью', en: 'It is fully kept' },
          { ru: 'Она превращается в навык', en: 'It turns into a skill' },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'Кто описал кривую забывания?', en: 'Who described the forgetting curve?' },
        choices: [
          { ru: 'Иван Павлов', en: 'Ivan Pavlov' },
          { ru: 'Герман Эббингауз', en: 'Hermann Ebbinghaus' },
          { ru: 'Альфред Бине', en: 'Alfred Binet' },
          { ru: 'Уильям Джеймс', en: 'William James' },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'Что, по тексту, помогает сохранить больше?', en: 'What helps keep more, per the text?' },
        choices: [
          { ru: 'Читать один раз очень быстро', en: 'Reading once very fast' },
          { ru: 'Повторное чтение подряд', en: 'Reading again straight through' },
          { ru: 'Пересказ и разнесённые повторения', en: 'Retelling and spaced reviews' },
          { ru: 'Ничего не делать после', en: 'Doing nothing afterward' },
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'vision',
    text: {
      ru: 'Во время чтения глаз движется не плавно, а короткими скачками. Между скачками он на миг замирает — и только в эти остановки мозг получает чёткую картинку. Сам скачок длится доли секунды, и в этот момент мы почти ничего не видим. Опытный читатель делает меньше остановок на строке, потому что за одну остановку захватывает не одно слово, а небольшую группу. Помогает в этом периферийное зрение: чёткой остаётся лишь узкая центральная зона, но края поля тоже несут информацию, и её можно научиться использовать. Ещё одна привычка, которая замедляет чтение, — возвраты, когда глаз без необходимости прыгает к уже прочитанному. Чем спокойнее и увереннее идёт взгляд, тем меньше таких возвратов. Поэтому тренажёры скорочтения работают с двумя вещами сразу: расширяют зону охвата и убирают лишние возвраты.',
      en: 'While reading, the eye does not glide smoothly but moves in short jumps. Between the jumps it freezes for an instant — and only in those stops does the brain get a clear picture. The jump itself lasts a fraction of a second, and during it we see almost nothing. A practised reader makes fewer stops per line, because each stop takes in not a single word but a small group. Peripheral vision helps here: only a narrow central zone stays sharp, but the edges of the field carry information too, and you can learn to use it. Another habit that slows reading is regression — when the eye jumps back to already-read words without need. The calmer and more confident the gaze, the fewer such returns. This is why speed-reading trainers work on two things at once: they widen the span you take in and remove the extra returns.',
    },
    questions: [
      {
        prompt: { ru: 'Как движется глаз при чтении?', en: 'How does the eye move while reading?' },
        choices: [
          { ru: 'Плавно и непрерывно', en: 'Smoothly and continuously' },
          { ru: 'Короткими скачками с остановками', en: 'In short jumps with stops' },
          { ru: 'Только сверху вниз', en: 'Only top to bottom' },
          { ru: 'По кругу', en: 'In a circle' },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'Когда мозг получает чёткую картинку?', en: 'When does the brain get a clear picture?' },
        choices: [
          { ru: 'Во время скачка', en: 'During the jump' },
          { ru: 'В моменты остановки', en: 'In the moments it stops' },
          { ru: 'Постоянно', en: 'Constantly' },
          { ru: 'Только в начале строки', en: "Only at the line's start" },
        ],
        answer: 1,
      },
      {
        prompt: { ru: 'С какими двумя вещами, по тексту, работают тренажёры?', en: 'What two things do the trainers work on, per the text?' },
        choices: [
          { ru: 'Громкость и темп', en: 'Loudness and tempo' },
          { ru: 'Зона охвата и лишние возвраты', en: 'The span taken in and extra returns' },
          { ru: 'Шрифт и цвет', en: 'Font and color' },
          { ru: 'Поза и дыхание', en: 'Posture and breathing' },
        ],
        answer: 1,
      },
    ],
  },
]

export interface ResolvedQuestion { prompt: string; choices: string[]; answer: number }
export interface ResolvedPassage { id: string; text: string; questions: ResolvedQuestion[] }

export function resolvePassage(passage: TestPassage, locale: Locale): ResolvedPassage {
  return {
    id: passage.id,
    text: passage.text[locale],
    questions: passage.questions.map(q => ({ prompt: q.prompt[locale], choices: q.choices.map(c => c[locale]), answer: q.answer })),
  }
}

export function pickPassage(count: number): TestPassage {
  return PASSAGES[((count % PASSAGES.length) + PASSAGES.length) % PASSAGES.length]
}
```

If any string trips `lintDehustle` in Step 5, reword that sentence/choice keeping its meaning and keeping the `answer` still correct — do not edit the test.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/passages.test.ts`
Expected: PASS. Fix any de-hustle trip per the Step-3 note.

- [ ] **Step 5: Type-check + commit (PowerShell)**

Run: `npx tsc --noEmit` → no errors. Then:

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/passages.ts LMS/tochka-sborki/web/lib/speedreading/passages.test.ts
git commit -m @'
feat(speedreading): 3 original bilingual test passages + resolver (slice 4 task 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 3: Types, store, and hook

**Files:**
- Create: `lib/speedreading/wpm-test-types.ts`
- Create: `lib/speedreading/wpm-test-store.ts`
- Create: `lib/speedreading/use-wpm-test.ts`
- Test: `lib/speedreading/wpm-test-store.test.ts`

**Interfaces:**
- Consumes: `localDate` from `@/lib/quests/daily-store`.
- Produces:
  - `WPM_KEY = 'speedreading_wpm'`, `WpmResult { date; passageId; ms; words; wpm; correct; total; effectiveWpm }`, `WpmTestState { results: WpmResult[] }`
  - `freshWpmTest()`, `recordTest(state, result: WpmResult)`, `readWpmTest()`, `writeWpmTest(state)`
  - hook `useWpmTest()` → `{ state: WpmTestState; ready: boolean; recordTest(result: Omit<WpmResult, 'date'>) }`

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/wpm-test-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { freshWpmTest, recordTest, readWpmTest, writeWpmTest } from './wpm-test-store'
import { WPM_KEY, type WpmResult } from './wpm-test-types'

const sample = (wpm: number): WpmResult => ({
  date: '2026-07-05', passageId: 'attention', ms: 30000, words: 150,
  wpm, correct: 3, total: 3, effectiveWpm: wpm,
})

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
  })
})

describe('wpm-test-store', () => {
  it('freshWpmTest has empty results', () => {
    expect(freshWpmTest()).toEqual({ results: [] })
  })
  it('recordTest appends', () => {
    const s = recordTest(freshWpmTest(), sample(300))
    expect(s.results).toHaveLength(1)
    expect(s.results[0].wpm).toBe(300)
  })
  it('caps results at 50', () => {
    let s = freshWpmTest()
    for (let i = 0; i < 60; i++) s = recordTest(s, sample(300))
    expect(s.results).toHaveLength(50)
  })
  it('write then read round-trips', () => {
    writeWpmTest(recordTest(freshWpmTest(), sample(420)))
    expect(readWpmTest().results[0].wpm).toBe(420)
  })
  it('missing key and malformed JSON → freshWpmTest', () => {
    expect(readWpmTest()).toEqual(freshWpmTest())
    localStorage.setItem(WPM_KEY, '{not json')
    expect(readWpmTest()).toEqual(freshWpmTest())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/speedreading/wpm-test-store.test.ts`
Expected: FAIL — modules do not exist yet.

- [ ] **Step 3: Create the types**

Create `lib/speedreading/wpm-test-types.ts`:

```ts
// lib/speedreading/wpm-test-types.ts
export const WPM_KEY = 'speedreading_wpm'
export interface WpmResult {
  date: string; passageId: string; ms: number; words: number
  wpm: number; correct: number; total: number; effectiveWpm: number
}
export interface WpmTestState { results: WpmResult[] }
```

- [ ] **Step 4: Create the store**

Create `lib/speedreading/wpm-test-store.ts` (mirror `lib/pacing/store.ts`):

```ts
// lib/speedreading/wpm-test-store.ts
// Pure reducers + localStorage persistence with graceful fallback. Mirrors lib/pacing/store.ts.
import { WPM_KEY, type WpmTestState, type WpmResult } from './wpm-test-types'

const RESULTS_CAP = 50

export function freshWpmTest(): WpmTestState {
  return { results: [] }
}

export function recordTest(state: WpmTestState, result: WpmResult): WpmTestState {
  const results = [...state.results, result]
  const capped = results.length > RESULTS_CAP ? results.slice(results.length - RESULTS_CAP) : results
  return { ...state, results: capped }
}

export function readWpmTest(): WpmTestState {
  try {
    const raw = localStorage.getItem(WPM_KEY)
    if (!raw) return freshWpmTest()
    const p = JSON.parse(raw) as Partial<WpmTestState>
    return { results: Array.isArray(p.results) ? p.results : [] }
  } catch {
    return freshWpmTest()
  }
}

export function writeWpmTest(state: WpmTestState): void {
  try { localStorage.setItem(WPM_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}
```

- [ ] **Step 5: Create the hook**

Create `lib/speedreading/use-wpm-test.ts` (mirror `lib/pacing/use-pacing.ts`):

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { freshWpmTest, readWpmTest, writeWpmTest, recordTest as _recordTest } from './wpm-test-store'
import { localDate } from '@/lib/quests/daily-store'
import type { WpmTestState, WpmResult } from './wpm-test-types'

export function useWpmTest() {
  const [state, setState] = useState<WpmTestState>(freshWpmTest)
  const [ready, setReady] = useState(false)

  useEffect(() => { setState(readWpmTest()); setReady(true) }, [])

  const update = useCallback((fn: (s: WpmTestState) => WpmTestState) => {
    setState(prev => { const next = fn(prev); writeWpmTest(next); return next })
  }, [])

  const recordTest = useCallback((result: Omit<WpmResult, 'date'>) =>
    update(s => _recordTest(s, { ...result, date: localDate() })), [update])

  return { state, ready, recordTest }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/wpm-test-store.test.ts`
Expected: PASS.

- [ ] **Step 7: Type-check + commit (PowerShell)**

Run: `npx tsc --noEmit` → no errors. Then:

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/wpm-test-types.ts LMS/tochka-sborki/web/lib/speedreading/wpm-test-store.ts LMS/tochka-sborki/web/lib/speedreading/use-wpm-test.ts LMS/tochka-sborki/web/lib/speedreading/wpm-test-store.test.ts
git commit -m @'
feat(speedreading): WPM test types, store, hook (slice 4 task 3)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 4: Test component + RU/EN routes

**Files:**
- Create: `components/speedreading/wpm-test.tsx`
- Create: `app/speedreading/test/page.tsx`
- Create: `app/en/speedreading/test/page.tsx`

**Interfaces:**
- Consumes: `pickPassage`, `resolvePassage` from `@/lib/speedreading/passages`; `wordCount`, `computeWpm`, `comprehensionFraction`, `effectiveWpm` from `@/lib/speedreading/wpm`; `useWpmTest` from `@/lib/speedreading/use-wpm-test`; `Locale` from `@/lib/dictionaries`; `Nav` from `@/components/nav`.
- Produces: `WpmTest({ locale })` client component; routes `/speedreading/test` (RU) and `/en/speedreading/test` (EN).

- [ ] **Step 1: Create the component**

Create `components/speedreading/wpm-test.tsx`. The quiz step mirrors the `break-interstitial` MCQ interaction (pick → lock → ✓/✗, no shaming). `prevEff` is captured from `state.results[0]` (the first test) **before** `recordTest` appends this run:

```tsx
'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { Locale } from '@/lib/dictionaries'
import { pickPassage, resolvePassage } from '@/lib/speedreading/passages'
import { wordCount, computeWpm, comprehensionFraction, effectiveWpm } from '@/lib/speedreading/wpm'
import { useWpmTest } from '@/lib/speedreading/use-wpm-test'

const T = {
  ru: {
    intro: 'Прочитай текст в своём темпе, затем ответь на вопросы. Результат — слов в минуту с поправкой на понимание.',
    start: 'Начать', reading: 'Читай в своём темпе, потом нажми «Готово».', done: 'Готово',
    quiz: 'Вопросы на понимание', seeResult: 'Показать результат', answerAll: 'Ответь на все вопросы',
    effective: 'Эффективная скорость', wpm: 'сл/мин', raw: 'Скорость', comprehension: 'Понимание',
    vsFirst: 'к первому тесту', again: 'Ещё раз',
  },
  en: {
    intro: 'Read the text at your own pace, then answer the questions. The score is words per minute adjusted for comprehension.',
    start: 'Start', reading: 'Read at your own pace, then press "Done".', done: 'Done',
    quiz: 'Comprehension questions', seeResult: 'See result', answerAll: 'Answer all questions',
    effective: 'Effective speed', wpm: 'wpm', raw: 'Speed', comprehension: 'Comprehension',
    vsFirst: 'vs your first test', again: 'Again',
  },
}

const btn: React.CSSProperties = {
  border: 'none', borderRadius: 8, padding: '.6rem 1.4rem', background: 'var(--text-accent)',
  color: 'var(--bg-primary)', fontWeight: 600, cursor: 'pointer',
}
const card: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)',
}

type Step = 'intro' | 'reading' | 'quiz' | 'result'
interface Result { wpm: number; frac: number; eff: number; correct: number; total: number; prevEff: number | null }

export function WpmTest({ locale }: { locale: Locale }) {
  const t = T[locale]
  const { state, ready, recordTest } = useWpmTest()
  const [step, setStep] = useState<Step>('intro')
  const [runIndex, setRunIndex] = useState(0)
  const [picks, setPicks] = useState<(number | null)[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const startAt = useRef(0)
  const msRef = useRef(0)

  // seed the run index from prior-test count once persisted state is ready
  useEffect(() => { if (ready) setRunIndex(state.results.length) }, [ready, state.results.length])

  const passage = useMemo(() => resolvePassage(pickPassage(runIndex), locale), [runIndex, locale])
  const words = useMemo(() => wordCount(passage.text), [passage])

  const startReading = () => {
    setPicks(passage.questions.map(() => null))
    setResult(null)
    startAt.current = Date.now()
    setStep('reading')
  }
  const finishReading = () => { msRef.current = Date.now() - startAt.current; setStep('quiz') }
  const pick = (qi: number, ci: number) => {
    setPicks(prev => (prev[qi] !== null ? prev : prev.map((p, i) => (i === qi ? ci : p))))
  }
  const allAnswered = picks.length > 0 && picks.every(p => p !== null)

  const seeResult = () => {
    const correct = passage.questions.reduce((n, q, i) => n + (picks[i] === q.answer ? 1 : 0), 0)
    const total = passage.questions.length
    const wpm = computeWpm(words, msRef.current)
    const frac = comprehensionFraction(correct, total)
    const eff = effectiveWpm(wpm, frac)
    const prevEff = state.results.length > 0 ? state.results[0].effectiveWpm : null
    recordTest({ passageId: passage.id, ms: msRef.current, words, wpm, correct, total, effectiveWpm: eff })
    setResult({ wpm, frac, eff, correct, total, prevEff })
    setStep('result')
  }
  const again = () => { setRunIndex(state.results.length); setStep('intro'); setResult(null); setPicks([]) }

  if (step === 'intro') {
    return (
      <section style={card}>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.55, margin: '0 0 1.25rem' }}>{t.intro}</p>
        <button style={btn} onClick={startReading} disabled={!ready}>{t.start}</button>
      </section>
    )
  }

  if (step === 'reading') {
    return (
      <section style={card}>
        <p style={{ fontSize: '.8rem', color: 'var(--text-accent)', margin: '0 0 .75rem' }}>{t.reading}</p>
        <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, fontSize: '1.05rem', margin: '0 0 1.5rem' }}>{passage.text}</p>
        <button style={btn} onClick={finishReading}>{t.done}</button>
      </section>
    )
  }

  if (step === 'quiz') {
    return (
      <section style={card}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', color: 'var(--text-primary)' }}>{t.quiz}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {passage.questions.map((q, qi) => {
            const answered = picks[qi] !== null
            return (
              <div key={qi}>
                <p style={{ color: 'var(--text-primary)', margin: '0 0 .6rem' }}>{q.prompt}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {q.choices.map((choice, ci) => {
                    const isCorrect = ci === q.answer
                    const isPicked = ci === picks[qi]
                    const mark = answered && isCorrect ? ' ✓' : answered && isPicked ? ' ✗' : ''
                    const borderColor = answered && isCorrect ? 'var(--text-accent)' : answered && isPicked ? 'var(--crit, #c0392b)' : 'var(--border-color)'
                    return (
                      <button key={ci} type="button" disabled={answered} aria-pressed={isPicked} onClick={() => pick(qi, ci)}
                        style={{
                          background: 'transparent', color: 'var(--text-primary)', border: `1px solid ${borderColor}`,
                          borderRadius: 8, padding: '.5rem .9rem', textAlign: 'left',
                          cursor: answered ? 'default' : 'pointer',
                          opacity: answered && !isCorrect && !isPicked ? 0.6 : 1,
                        }}>
                        {choice}{mark}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          {allAnswered
            ? <button style={btn} onClick={seeResult}>{t.seeResult}</button>
            : <span style={{ fontSize: '.85rem', color: 'var(--text-secondary)' }}>{t.answerAll}</span>}
        </div>
      </section>
    )
  }

  // step === 'result'
  const r = result!
  const delta = r.prevEff !== null ? r.eff - r.prevEff : null
  return (
    <section style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '.4rem' }}>{t.effective}</div>
      <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--text-accent)', lineHeight: 1 }}>{r.eff}</div>
      <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t.wpm}</div>
      <div style={{ fontSize: '.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {t.raw}: {r.wpm} {t.wpm} · {t.comprehension}: {Math.round(r.frac * 100)}% ({r.correct}/{r.total})
      </div>
      {delta !== null && (
        <div style={{ fontSize: '.9rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          {delta >= 0 ? '+' : ''}{delta} {t.wpm} {t.vsFirst}
        </div>
      )}
      <button style={btn} onClick={again}>{t.again}</button>
    </section>
  )
}
```

- [ ] **Step 2: Create the RU route**

Create `app/speedreading/test/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { WpmTest } from '@/components/speedreading/wpm-test'

export const metadata: Metadata = {
  title: 'Тест скорости — Скорочтение',
  description: 'Замерь скорость чтения с поправкой на понимание (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>Тест скорости чтения</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Прочитай короткий текст, ответь на вопросы и увидь свою скорость с поправкой на понимание. Повтори позже, чтобы сравнить.
        </p>
        <WpmTest locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the EN route**

Create `app/en/speedreading/test/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { WpmTest } from '@/components/speedreading/wpm-test'

export const metadata: Metadata = {
  title: 'Reading-speed test — Speed Reading',
  description: 'Measure your reading speed adjusted for comprehension (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>Reading-speed test</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Read a short text, answer the questions, and see your speed adjusted for comprehension. Take it again later to compare.
        </p>
        <WpmTest locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full web gate**

Run: `npx vitest run && npx next build`
Expected: all tests pass; build succeeds and statically exports `/speedreading/test` and `/en/speedreading/test`.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/components/speedreading/wpm-test.tsx LMS/tochka-sborki/web/app/speedreading/test/page.tsx LMS/tochka-sborki/web/app/en/speedreading/test/page.tsx
git commit -m @'
feat(speedreading): WPM test component + RU/EN routes (slice 4 task 4)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

## Notes for the executor

- **Do not** add the test to `LMS/registry.json`, `components/nav.tsx`, or `content/`. It stays dark/isolated. Both routes are `noindex`.
- Reuse the engine (`wordCount`/`computeWpm`/`comprehensionFraction`/`effectiveWpm`) for all metric math — do not compute WPM inline in the component.
- No new npm dependencies. Plain React + the engine only.
- `prevEff` MUST be read from `state.results[0]` before `recordTest` appends the current run, so the delta compares against the FIRST test.
- `Date.now()` here is ordinary browser app code (not a Workflow orchestration script) — allowed.
- If `lintDehustle` flags a passage/question/choice in Task 2, reword it and keep the `answer` index correct; never edit the test to pass.
- Hold the push until the user's "go" gate; commit locally per task.
```
