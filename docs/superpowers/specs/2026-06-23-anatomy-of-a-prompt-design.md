# "Anatomy of a Prompt" — Design

**Ticket:** `fb_2e3ffcf70af2` (apply `<AnnotatedExample>` as an annotated "Anatomy of a
Prompt" in module 04 + the cheatsheet — course content, RU+EN mirror).
**Depends on (shipped):** `fb_e92087192011` (`<AnnotatedExample>` engine component).

**Date:** 2026-06-23

## Goal

Teach prompt structure by *showing* it: drop a color-coded, callout-annotated example
prompt — role / context / task / constraints / format — into the prompt-engineering
unit (`04-prompt-engineering/u2-spec-formula`) and into the cheatsheet, in both RU and
EN. The reusable `<AnnotatedExample>` engine already exists; this ticket authors the
course-specific annotated prompt and wires it into the lessons.

## Honest-triage note (verified — this changed the design)

- `<AnnotatedExample>` is registered and renders (`fb_e92087192011`). It is
  props-driven: `segments: Segment[]`, `caption?`, `mono?`.
- **Build probe (decisive):** passing `segments={[…]}` *inline* in MDX **fails the
  build** under this stack — `next-mdx-remote@6`'s `MDXRemote` delivered `segments`
  as `undefined` (`Cannot read properties of undefined (reading 'map')`). Inline
  array/object expression props are not viable here. **String props do work**
  (`<AgentBlock stack="…">`, `<OsBlock os="…">` are used throughout content).
- Therefore the annotated prompt data must live in a `lib/` module and be fed to
  `<AnnotatedExample>` by a thin course wrapper used propless-ish from MDX — exactly
  the established pattern (`StackMatrix` hardcodes its data and is used as
  `<StackMatrix />`).
- Insertion points confirmed:
  - `content/{ru,en}/04-prompt-engineering/u2-spec-formula.mdx` — inside
    `<Phase type="concept">`, after the CTID mnemonic, before "Пример в действии".
  - `content/{ru,en}/cheatsheet.mdx` — under `## 📋 Структура хорошего промпта`,
    before the markdown template block.

## Decisions locked during brainstorming

1. **Course-data wrapper, not inline MDX props** (forced by the build probe).
   `lib/content/prompt-anatomy.ts` holds the bilingual data; `components/prompt-anatomy.tsx`
   feeds it to `<AnnotatedExample>`; MDX uses `<PromptAnatomy locale="ru" />` /
   `locale="en"` (a string prop — the supported pattern).
2. **One canonical annotated prompt**, reused in both u2 and the cheatsheet (DRY). A
   FastAPI-optimization request, broken into 5 inline prose parts.
3. **5 parts** mapping the unit's vocabulary: Роль / Контекст / Задача / Ограничения /
   Формат (role / context / task / constraints / format), accents
   lime/cyan/amber/magenta/violet.
4. **Prose, not mono** (`mono={false}`) — it's a natural-language prompt.
5. **Authenticity:** the example is a realistic, honest prompt; no invented metrics or
   testimonial claims. RU is the source; EN is a faithful mirror.
6. Static export, no server/data/migration, no new dependency.

## Components

### `lib/content/prompt-anatomy.ts` (pure)

```ts
import type { Locale } from '@/lib/intake/types'
import type { Segment } from '@/lib/content/annotated-example'

export interface PromptAnatomyVM { caption: string; segments: Segment[] }

export const PROMPT_ANATOMY: Record<Locale, { caption: string; segments: Segment[] }>
export function getPromptAnatomy(locale: Locale): PromptAnatomyVM
```

- `getPromptAnatomy(locale)` returns `PROMPT_ANATOMY[locale]` (with `locale === 'en'`
  → en, else ru — same guard style as `getShowcase`).
- Each locale carries `caption` + 5 `Segment`s. Reuses `Segment`/`Accent` from
  `annotated-example.ts` (no redefinition).

**Seed data (RU — source; EN mirror in the plan):**

| # | accent | text (RU) | label (RU) | note (RU) |
|---|---|---|---|---|
| 1 | lime | Ты — senior Python-разработчик | Роль | Кто отвечает: даёшь AI экспертизу и тон. |
| 2 | cyan | у меня FastAPI-проект, где ручка /report отвечает 4 секунды | Контекст | Вводные: ситуация и данные. |
| 3 | amber | найди узкие места и предложи, как ускорить | Задача | Что сделать — одно действие. |
| 4 | magenta | без смены базы данных | Ограничения | Рамки: чего нельзя. |
| 5 | violet | ответь нумерованным списком с примерами кода | Формат | Форма результата: структура вывода. |

`caption`: RU `Анатомия промпта` / EN `Anatomy of a prompt`.

### `components/prompt-anatomy.tsx` (server component)

```tsx
import { getPromptAnatomy } from '@/lib/content/prompt-anatomy'
import { AnnotatedExample } from '@/components/annotated-example'
import type { Locale } from '@/lib/intake/types'

export function PromptAnatomy({ locale }: { locale: Locale }) {
  const a = getPromptAnatomy(locale)
  return <AnnotatedExample segments={a.segments} caption={a.caption} mono={false} />
}
```

Registered in `components/mdx-components.tsx` (`import { PromptAnatomy }` +
`PromptAnatomy,` in `mdxComponents`).

### MDX insertions (4 files)

- `content/ru/04-prompt-engineering/u2-spec-formula.mdx`: `<PromptAnatomy locale="ru" />`
  inside `<Phase type="concept">`, after the CTID mnemonic code block, before the
  "### Пример в действии" heading.
- `content/en/04-prompt-engineering/u2-spec-formula.mdx`: `<PromptAnatomy locale="en" />`
  at the mirror position.
- `content/ru/cheatsheet.mdx`: `<PromptAnatomy locale="ru" />` directly under
  `## 📋 Структура хорошего промпта`, before the ```markdown template.
- `content/en/cheatsheet.mdx`: `<PromptAnatomy locale="en" />` at the mirror position.

## Data flow

```
lesson .mdx → <PromptAnatomy locale/>
  → getPromptAnatomy(locale) → { caption, segments }
    → <AnnotatedExample segments caption mono={false}/>
      → buildAnatomy → numbered accent tokens + callout grid
```

## Edge cases

- `locale` other than `'en'` → ru (the guard's default), so a missing/unknown locale
  never throws.
- The component depends only on shipped, tested pieces (`getPromptAnatomy`,
  `AnnotatedExample`); no new runtime branches.

## Testing (vitest env=node — pure data only)

`lib/content/prompt-anatomy.test.ts`:
- `getPromptAnatomy('ru')` and `('en')` each return `caption` non-empty and exactly 5
  segments; every segment has non-empty `text/label/note` and a valid `Accent`.
- the 5 accents are unique within a locale.
- ru and en differ (`caption` ru ≠ en; segment[0].text ru ≠ en).

The wrapper component and the 4 MDX insertions are verified by a green `npm run build`
(repo convention — UI/content verified by build; the build also proves the
`<PromptAnatomy>` usage compiles, which the inline-prop approach did not).

## Files

| File | Responsibility |
|---|---|
| `lib/content/prompt-anatomy.ts` | bilingual annotated-prompt data + `getPromptAnatomy` |
| `lib/content/prompt-anatomy.test.ts` | data tests |
| `components/prompt-anatomy.tsx` | wrapper feeding `<AnnotatedExample>` |
| `components/mdx-components.tsx` | register `PromptAnatomy` |
| `content/{ru,en}/04-prompt-engineering/u2-spec-formula.mdx` | insert in concept phase |
| `content/{ru,en}/cheatsheet.mdx` | insert under prompt-structure heading |

No server, data, migration, or new dependency. ~2 TDD tasks.

## Out of scope

- Changing `<AnnotatedExample>` (the engine is done; this only consumes it).
- Re-authoring the surrounding u2/cheatsheet copy beyond the single insertion.
- Multiple distinct anatomies (CLI command, install one-liner) — YAGNI; one canonical
  prompt anatomy now. A future ticket can add command/config variants reusing the same
  engine + the wrapper pattern.
- Fixing `next-mdx-remote` inline-expression-prop support — the wrapper sidesteps it;
  not worth a framework workaround.
