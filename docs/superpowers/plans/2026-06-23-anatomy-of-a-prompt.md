# "Anatomy of a Prompt" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author a bilingual annotated example prompt and render it via `<AnnotatedExample>` in the prompt-engineering unit and the cheatsheet.

**Architecture:** The annotated-prompt data lives in a pure `lib/content/prompt-anatomy.ts` module (unit-tested). A thin server wrapper `components/prompt-anatomy.tsx` feeds it to the existing `<AnnotatedExample>` engine and is used from MDX as `<PromptAnatomy locale="ru"|"en" />` — a string prop, because inline array/object props (`segments={[…]}`) are NOT delivered by `next-mdx-remote@6` (build probe confirmed `undefined`).

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, static), `next-mdx-remote@6` (`MDXRemote`), React server component, TypeScript, Vitest (`env: node`).

## Global Constraints

- Working directory for ALL commands: `LMS/tochka-sborki/web/` (run `cd LMS/tochka-sborki/web` first). NEVER run `npx vitest` from `workers/`.
- Test command: `npm test -- prompt-anatomy`. Build command: `npm run build`.
- **Do NOT pass `segments={[…]}` (or any array/object expression) as an inline MDX prop** — it arrives `undefined` under `next-mdx-remote@6` and fails the build. Only string props from MDX (`<PromptAnatomy locale="ru" />`).
- Bilingual: RU is the source, EN a faithful mirror; both carry the SAME 5 accents in the SAME order (lime, cyan, amber, magenta, violet). Use the seed copy in Task 1 verbatim.
- Authenticity: the example is a realistic prompt — no invented metrics or testimonial claims.
- `<PromptAnatomy>` and `<AnnotatedExample>` are server components — NO `'use client'`.
- The pure data module is unit-tested; the wrapper + MDX insertions are verified by a green `npm run build` only (repo convention).
- No server, data store, migration, or new npm dependency.

---

### Task 1: Bilingual annotated-prompt data + `getPromptAnatomy`

**Files:**
- Create: `LMS/tochka-sborki/web/lib/content/prompt-anatomy.ts`
- Test: `LMS/tochka-sborki/web/lib/content/prompt-anatomy.test.ts`

**Interfaces:**
- Consumes: `type Segment` from `@/lib/content/annotated-example` (shipped); `type Locale` from `@/lib/intake/types` (`'ru' | 'en'`).
- Produces (used by Task 2):
  - `export interface PromptAnatomyVM { caption: string; segments: Segment[] }`
  - `export const PROMPT_ANATOMY: Record<Locale, PromptAnatomyVM>`
  - `export function getPromptAnatomy(locale: Locale): PromptAnatomyVM`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/content/prompt-anatomy.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getPromptAnatomy } from './prompt-anatomy'

describe('getPromptAnatomy', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`returns caption + 5 segments with content (${loc})`, () => {
      const a = getPromptAnatomy(loc)
      expect(a.caption.length).toBeGreaterThan(0)
      expect(a.segments).toHaveLength(5)
      for (const s of a.segments) {
        expect(s.text.length).toBeGreaterThan(0)
        expect(s.label.length).toBeGreaterThan(0)
        expect(s.note.length).toBeGreaterThan(0)
        expect(s.accent.length).toBeGreaterThan(0)
      }
    })
    it(`has 5 unique accents (${loc})`, () => {
      const accents = getPromptAnatomy(loc).segments.map(s => s.accent)
      expect(new Set(accents).size).toBe(5)
    })
  }
  it('ru and en differ', () => {
    expect(getPromptAnatomy('ru').caption).not.toBe(getPromptAnatomy('en').caption)
    expect(getPromptAnatomy('ru').segments[0].text).not.toBe(getPromptAnatomy('en').segments[0].text)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npm test -- prompt-anatomy`
Expected: FAIL — cannot resolve `./prompt-anatomy` / `getPromptAnatomy is not a function`.

- [ ] **Step 3: Implement the data module**

Create `LMS/tochka-sborki/web/lib/content/prompt-anatomy.ts`:
```ts
import type { Segment } from '@/lib/content/annotated-example'
import type { Locale } from '@/lib/intake/types'

export interface PromptAnatomyVM { caption: string; segments: Segment[] }

export const PROMPT_ANATOMY: Record<Locale, PromptAnatomyVM> = {
  ru: {
    caption: 'Анатомия промпта',
    segments: [
      { text: 'Ты — senior Python-разработчик', label: 'Роль', note: 'Кто отвечает: даёшь AI экспертизу и тон.', accent: 'lime' },
      { text: 'у меня FastAPI-проект, где ручка /report отвечает 4 секунды', label: 'Контекст', note: 'Вводные: ситуация и данные.', accent: 'cyan' },
      { text: 'найди узкие места и предложи, как ускорить', label: 'Задача', note: 'Что сделать — одно действие.', accent: 'amber' },
      { text: 'без смены базы данных', label: 'Ограничения', note: 'Рамки: чего нельзя.', accent: 'magenta' },
      { text: 'ответь нумерованным списком с примерами кода', label: 'Формат', note: 'Форма результата: структура вывода.', accent: 'violet' },
    ],
  },
  en: {
    caption: 'Anatomy of a prompt',
    segments: [
      { text: 'You are a senior Python developer', label: 'Role', note: 'Who answers: you give the AI expertise and tone.', accent: 'lime' },
      { text: 'I have a FastAPI project where the /report endpoint takes 4 seconds', label: 'Context', note: 'The inputs: the situation and data.', accent: 'cyan' },
      { text: 'find the bottlenecks and suggest how to speed it up', label: 'Task', note: 'What to do — one action.', accent: 'amber' },
      { text: 'without switching the database', label: 'Constraints', note: "The limits: what's off-limits.", accent: 'magenta' },
      { text: 'answer as a numbered list with code examples', label: 'Format', note: 'The shape of the result: output structure.', accent: 'violet' },
    ],
  },
}

export function getPromptAnatomy(locale: Locale): PromptAnatomyVM {
  return PROMPT_ANATOMY[locale === 'en' ? 'en' : 'ru']
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npm test -- prompt-anatomy`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/content/prompt-anatomy.ts LMS/tochka-sborki/web/lib/content/prompt-anatomy.test.ts
git commit -m "feat(content): bilingual prompt-anatomy data + getPromptAnatomy (fb_2e3ffcf70af2)"
```

---

### Task 2: `<PromptAnatomy>` wrapper + MDX wiring

**Files:**
- Create: `LMS/tochka-sborki/web/components/prompt-anatomy.tsx`
- Modify: `LMS/tochka-sborki/web/components/mdx-components.tsx`
- Modify: `LMS/tochka-sborki/web/content/ru/04-prompt-engineering/u2-spec-formula.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/04-prompt-engineering/u2-spec-formula.mdx`
- Modify: `LMS/tochka-sborki/web/content/ru/cheatsheet.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/cheatsheet.mdx`

**Interfaces:**
- Consumes: `getPromptAnatomy` from `@/lib/content/prompt-anatomy` (Task 1); `AnnotatedExample` from `@/components/annotated-example` (shipped); `type Locale` from `@/lib/intake/types`.
- Produces: `<PromptAnatomy locale="ru"|"en" />` available in MDX.

Verified by a green `npm run build` (no unit test). The build also proves the
`<PromptAnatomy locale="…" />` usages compile — which the inline-prop approach did not.

- [ ] **Step 1: Create the wrapper component**

Create `LMS/tochka-sborki/web/components/prompt-anatomy.tsx`:
```tsx
import { getPromptAnatomy } from '@/lib/content/prompt-anatomy'
import { AnnotatedExample } from '@/components/annotated-example'
import type { Locale } from '@/lib/intake/types'

export function PromptAnatomy({ locale }: { locale: Locale }) {
  const a = getPromptAnatomy(locale)
  return <AnnotatedExample segments={a.segments} caption={a.caption} mono={false} />
}
```

- [ ] **Step 2: Register the component in MDX**

In `LMS/tochka-sborki/web/components/mdx-components.tsx`:

Add the import after the `AnnotatedExample` import line:
```tsx
import { PromptAnatomy } from './prompt-anatomy'
```

Add `PromptAnatomy,` to the `mdxComponents` object, after the `AnnotatedExample,` entry:
```tsx
  AnnotatedExample,
  PromptAnatomy,
}
```

- [ ] **Step 3: Insert into the RU unit**

In `LMS/tochka-sborki/web/content/ru/04-prompt-engineering/u2-spec-formula.mdx`, find:
```
### Пример в действии
```
Replace it with (the component goes immediately before that heading, still inside `<Phase type="concept">`):
```
<PromptAnatomy locale="ru" />

### Пример в действии
```

- [ ] **Step 4: Insert into the EN unit**

In `LMS/tochka-sborki/web/content/en/04-prompt-engineering/u2-spec-formula.mdx`, find:
```
### Example in action
```
Replace it with:
```
<PromptAnatomy locale="en" />

### Example in action
```

- [ ] **Step 5: Insert into the RU cheatsheet**

In `LMS/tochka-sborki/web/content/ru/cheatsheet.mdx`, find:
```
## 📋 Структура хорошего промпта
```
Replace it with (component goes right under the heading, before the markdown template):
```
## 📋 Структура хорошего промпта

<PromptAnatomy locale="ru" />
```

- [ ] **Step 6: Insert into the EN cheatsheet**

In `LMS/tochka-sborki/web/content/en/cheatsheet.mdx`, find:
```
## 📋 Structure of a good prompt
```
Replace it with:
```
## 📋 Structure of a good prompt

<PromptAnatomy locale="en" />
```

- [ ] **Step 7: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — build completes; all four `<PromptAnatomy locale="…" />` usages render (no `undefined`/`map` error, unlike inline-prop usage).

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/components/prompt-anatomy.tsx LMS/tochka-sborki/web/components/mdx-components.tsx LMS/tochka-sborki/web/content/ru/04-prompt-engineering/u2-spec-formula.mdx LMS/tochka-sborki/web/content/en/04-prompt-engineering/u2-spec-formula.mdx LMS/tochka-sborki/web/content/ru/cheatsheet.mdx LMS/tochka-sborki/web/content/en/cheatsheet.mdx
git commit -m "feat(content): PromptAnatomy wrapper + Anatomy of a Prompt in u2 & cheatsheet (fb_2e3ffcf70af2)"
```

---

## Self-Review

**1. Spec coverage:**
- `PromptAnatomyVM`, `PROMPT_ANATOMY` (bilingual, 5 segments), `getPromptAnatomy` → Task 1. ✓
- Tests: 5 segments both locales, non-empty fields, unique accents, ru≠en → Task 1 test. ✓
- Wrapper `<PromptAnatomy locale>` feeding `<AnnotatedExample mono={false}>` → Task 2 step 1. ✓
- Registration → Task 2 step 2. ✓
- 4 MDX insertions (ru/en u2 concept-phase before "Пример/Example in action"; ru/en cheatsheet under the prompt-structure heading) → Task 2 steps 3-6. ✓
- String-prop locale (NOT inline array prop) → Global Constraints + wrapper. ✓
- Server components, bilingual mirror, authenticity → Global Constraints + seed copy. ✓
- Build-verified wrapper/MDX → Task 2 step 7. ✓
- Out of scope (engine change, extra anatomies, framework fix) → not built. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in every step; full bilingual data inline; exact MDX find/replace anchors. ✓

**3. Type consistency:** `PromptAnatomyVM`/`PROMPT_ANATOMY`/`getPromptAnatomy` defined in Task 1 and consumed identically in Task 2 (`getPromptAnatomy(locale)` → `.segments`/`.caption`). `Segment` imported from the shipped `annotated-example.ts`; the seed accents (`lime/cyan/amber/magenta/violet`) are all members of its `Accent` union. `<AnnotatedExample>` prop names (`segments`, `caption`, `mono`) match the shipped component. `<PromptAnatomy>` is registered under the same name it is used by in MDX. ✓
