# Точка Сборки. Пролог — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the «Пролог» longread funnel (RU first) on `mamaev.coach/prologue` per spec `docs/superpowers/specs/2026-05-29-prequel-prologue-design.md`.

**Architecture:** Standalone Next.js page in `hub/` Cloudflare Pages project. Content is plain TSX (hub is not MDX-configured), kept in a self-contained `<Prologue locale="ru">` component composed of typed section components for opening/three acts/assembly/CTA. Narrative is derived from three Telegram carousels (30 photos) + author BIO; first task extracts those carousels into structured research notes used by later writing tasks.

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), React 18, TypeScript, CSS Modules / Tailwind 4 (whichever hub already uses), Cloudflare Pages deploy via existing `deploy.yml`.

**Scope (this plan):** RU version + integration. **Out of scope for this plan:** EN translation (spec §10 q.2 — «RU first → EN после фидбэка»), final anchor images (placeholders OK; final art is a separate design task), Telegram analytics dashboards.

---

## File Structure

| File | Responsibility | Status |
|------|----------------|--------|
| `hub/_research/prologue/act-1-jordan-hall.md` | Slide-by-slide notes for carousel 1 | Create |
| `hub/_research/prologue/act-2-monolith.md` | Slide-by-slide notes for carousel 2 | Create |
| `hub/_research/prologue/act-3-liberationist.md` | Slide-by-slide notes for carousel 3 | Create |
| `hub/_research/prologue/voice-notes.md` | Author voice cheat-sheet from BIO | Create |
| `hub/components/prologue/Prologue.tsx` | Root component, composes sections, accepts `locale` prop | Create |
| `hub/components/prologue/sections/Opening.tsx` | Section 1 — personal entry | Create |
| `hub/components/prologue/sections/ActOne.tsx` | Section 2 — Great Transition | Create |
| `hub/components/prologue/sections/ActTwo.tsx` | Section 3 — Monolith loses | Create |
| `hub/components/prologue/sections/ActThree.tsx` | Section 4 — Liberationist | Create |
| `hub/components/prologue/sections/Assembly.tsx` | Section 5 — Personal return | Create |
| `hub/components/prologue/sections/DoubleDoor.tsx` | Section 6 — CTA, fires `prologue_cta_clicked` | Create |
| `hub/components/prologue/Prologue.module.css` | Typography: serif body, narrow column (~640px) | Create |
| `hub/app/prologue/page.tsx` | RU route `/prologue` | Create |
| `hub/app/prologue/layout.tsx` | Per-page metadata (title, description, OG) | Create |
| `hub/public/prologue/anchor-{1,2,3}.jpg` | Three anchor images (placeholders → final) | Create |
| `hub/public/prologue/og.jpg` | Open Graph image | Create |
| `hub/lib/analytics.ts` | Tiny wrapper for `prologue_cta_clicked` event (if hub lacks one) | Create or modify |
| Telegram draft post | `_research/prologue/telegram-announce.md` | Create |

---

## Task 1: Extract narrative from three Telegram carousels

**Files:**
- Create: `hub/_research/prologue/act-1-jordan-hall.md`
- Create: `hub/_research/prologue/act-2-monolith.md`
- Create: `hub/_research/prologue/act-3-liberationist.md`

**Input:** `C:\Users\sasha\Downloads\Telegram Desktop\prequel\` — 30 photos in 3 groups by timestamp:
- Group `23-48-53` (10 slides, 13 May) = Act I (Jordan Hall)
- Group `23-49-26` (10 slides, 13 May) = Act II (Monolith)
- Group `23-53-02` (10 slides, 25 May) = Act III (Liberationist)

- [ ] **Step 1: Read all 10 slides of group `23-48-53` via Read tool, in order `photo_1` → `photo_10`**

For each slide, capture in `act-1-jordan-hall.md`:
- Slide number
- Verbatim transcription of headline + body (Russian text from the image)
- One-sentence summary of the argument the slide makes
- Note any quotes from Jordan Hall to preserve verbatim

Format per slide:

```markdown
## Slide N
**Headline:** <verbatim>
**Body:** <verbatim>
**Argument:** <one sentence>
**Verbatim quotes to preserve:** <if any>
```

- [ ] **Step 2: Repeat Step 1 for group `23-49-26` into `act-2-monolith.md`**

This is the author's own manifesto. Pay extra attention — text from these slides may be re-used near-verbatim in Act II of the longread.

- [ ] **Step 3: Repeat Step 1 for group `23-53-02` into `act-3-liberationist.md`**

This carousel is by `@spirit.ofthelion` (English text). Capture in English; do not translate yet. Mark slides that contain framings we want to integrate vs. ones we'll skip.

- [ ] **Step 4: At the bottom of each research file, write an «Arc» section**

3–5 sentences capturing how the carousel moves from slide 1 → slide 10. This becomes the spine for the corresponding longread Act.

- [ ] **Step 5: Commit research notes**

```bash
git add hub/_research/prologue/
git commit -m "research: extract narrative from prequel telegram carousels"
```

---

## Task 2: Distill author voice from BIO

**Files:**
- Create: `hub/_research/prologue/voice-notes.md`
- Reference (read-only): `C:\telo\Efforts\Ongoing\bio\BIO.md`

- [ ] **Step 1: Read `BIO.md`**

Use Read tool on `C:\telo\Efforts\Ongoing\bio\BIO.md`.

- [ ] **Step 2: Write voice cheat-sheet**

In `voice-notes.md`, capture:

```markdown
# Voice notes — Александр Мамаев

## Биографические якоря (для конкретики)
- Год, место рождения
- Лос-Анджелес 2007–2014 (продюсирование, Hollywood)
- Burning Man 2012 + шаманская инициация (Мексика)
- Учителя: Yogi Bhajan, Goenka, Sadhguru, Amma (использовать имена точно)
- 13 лет коучинга
- 2025 → TransDev (AV Operator) + vibe coding
- Synergify, Embedding Agent, knowledge graph — текущие проекты

## Концепции/фразы, родные автору (можно использовать как стилевые маяки)
- «Неспешный Вершитель»
- «Transformation from knowledge to experience to wisdom»
- «Точка сборки» (взято из Кастанеды через шаманскую традицию)
- StrengthsFinder: Connectedness · Individualization · Ideation · Intellection · Achiever

## Запрещено в этом тексте
- «Сингулярность», «AGI», «революция» (см. spec §5)
- FOMO-формулировки
- «Однажды на ретрите» — всегда конкретное место/год/учитель
```

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/voice-notes.md
git commit -m "research: distill author voice cheat-sheet from BIO"
```

---

## Task 3: Draft Section 1 — Opening

**Files:**
- Create: `hub/_research/prologue/draft-01-opening.md`
- Reference: `hub/_research/prologue/voice-notes.md`, spec §4 Section 1

**Target:** ~400 words.

**Anchor phrase (must appear):** «Я тоже думал, что это конец. Вот что я увидел вместо конца.»

**Structure to follow:**
1. (1 абзац) Конкретная сцена — момент в 2024 или 2025, когда автор почувствовал стенку между коучем-собой и vibe-coder-собой. Использовать конкретику (день недели, что было перед экраном, какая практика была утром).
2. (1 абзац) Имя боли читателя — без обвинения, как со-переживание. «Возможно, вы тоже…».
3. (1 абзац) Anchor phrase.
4. (1 абзац) Обещание трёх увиденных вещей — одна строка на акт. **Не раскрывать**, только намёк:
   - «Сначала я увидел, что карта порвалась не из-за AI.»
   - «Потом — что AI не обязан быть чужой системой.»
   - «И последнее — что собранность внутри определяет, чем для тебя станет инструмент.»

- [ ] **Step 1: Write the draft in `draft-01-opening.md`**

400 words, Russian, исповедь от первого лица. Использовать voice-notes как палитру. Не редактировать на этом шаге.

- [ ] **Step 2: Self-check against §5 tonal rules**

Прочитать draft и пометить любые попадания запрещённых слов («сингулярность», «AGI», «революция», FOMO-конструкции, абстрактные «однажды»). Исправить inline.

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-01-opening.md
git commit -m "draft: prologue opening section"
```

---

## Task 4: Draft Section 2 — Act I (Великий переход)

**Files:**
- Create: `hub/_research/prologue/draft-02-act-one.md`
- Reference: `hub/_research/prologue/act-1-jordan-hall.md`, spec §4 Section 2

**Target:** ~800 words.

**Pivot phrase (must appear):** «Карта порвалась не из-за AI. AI пришёл, когда карта уже рвалась.»

**Structure:**
1. (~150 слов) Постановка: что Джордан Холл называет Великим переходом — civilizational phase shift. Своими словами; цитаты Холла отдельной строкой курсивом, не больше 2.
2. (~250 слов) Три симптома (выбрать из карусели наиболее резонирующие со спиритуальной аудиторией — например: распад институтов смысла, кризис экспертизы, ускорение запроса на «зачем»).
3. (~150 слов) Личная вставка автора (1 абзац) — растущий запрос клиентов на ретритах последних лет: не «улучшение жизни», а «разобраться, что вообще происходит».
4. (~150 слов) Поворот — anchor phrase + почему этот фрейм меняет постановку вопроса об AI: AI не причина перехода, он попутчик.
5. (~100 слов) Мост к Акту II: «Если карта рвётся не из-за AI — значит, и винить AI не за что. Тогда главный вопрос: какой AI?»

- [ ] **Step 1: Write the draft using `act-1-jordan-hall.md` as source of truth**

Verbatim quotes from Hall only if they exist in the carousel research notes; не выдумывать цитаты.

- [ ] **Step 2: Self-check against §5 tonal rules**

См. Task 3 Step 2.

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-02-act-one.md
git commit -m "draft: prologue act I (great transition)"
```

---

## Task 5: Draft Section 3 — Act II (Монолит проиграет)

**Files:**
- Create: `hub/_research/prologue/draft-03-act-two.md`
- Reference: `hub/_research/prologue/act-2-monolith.md`, spec §4 Section 3

**Target:** ~800 words.

**Pivot phrase (must appear):** «AI может стать твоим личным инструментом — собранным под твою практику, живущим на твоём железе, отражающим твой голос. Это уже инженерно возможно сегодня.»

**Structure:**
1. (~150 слов) Распаковка ложного равенства: AI = OpenAI = Кремниевая долина. Признать, почему это равенство кажется естественным.
2. (~300 слов) Три аргумента из карусели (взять из `act-2-monolith.md`):
   - S-кривая централизованного AI выравнивается;
   - Стоимость локального узла «человек+машина» падает экспоненциально;
   - Победит сеть интимных, личных узлов, а не один сверх-разум.
3. (~150 слов) Личная вставка — Synergify / Embedding Agent / knowledge graph как живые примеры. Без саморекламы: одно предложение «вот что я строю сейчас», доказательство, что это не теория.
4. (~100 слов) Pivot phrase + мост: «Но даже личный AI бесполезен, если человек, которым он усиливается, расщеплён.»

- [ ] **Step 1: Write the draft**

- [ ] **Step 2: Self-check against §5 tonal rules**

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-03-act-two.md
git commit -m "draft: prologue act II (monolith loses)"
```

---

## Task 6: Draft Section 4 — Act III (Liberationist)

**Files:**
- Create: `hub/_research/prologue/draft-04-act-three.md`
- Reference: `hub/_research/prologue/act-3-liberationist.md`, spec §4 Section 4

**Target:** ~800 words.

**Pivot phrase (must appear):** «Точка сборки — не метафора. Это конкретное состояние, в котором ты способен использовать инструмент, не теряя себя.»

**Per spec §10 q.3:** integrate `@spirit.ofthelion` material in author's own voice; attribution in a single line at the end of the act («Рамку liberation помог собрать пост `@spirit.ofthelion` — `<link>`.»).

**Structure:**
1. (~200 слов) Фрейм liberation vs. activism. Travma cycle → spiritual revolution, своими словами по-русски (исходник — английский). Без религиозного словаря.
2. (~200 слов) Мост к технологии: «AI как зеркало, а не как замена». Тот, кто не собран — через AI разгоняет расщепление. Тот, кто собран — получает усилитель.
3. (~250 слов) Личная вставка — Yogi Bhajan, Goenka, Burning Man 2012, шаманская инициация в Мексике. Откуда лично у автора пришло словосочетание «точка сборки». Одна сцена, не пересказ биографии.
4. (~100 слов) Pivot phrase + одна строка attribution (см. выше) + мост к финальной сборке.
5. (~50 слов) Финальное предложение акта — обещание сборки в следующей секции.

- [ ] **Step 1: Write the draft**

- [ ] **Step 2: Self-check against §5 tonal rules**

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-04-act-three.md
git commit -m "draft: prologue act III (liberationist)"
```

---

## Task 7: Draft Section 5 — Сборка (Assembly)

**Files:**
- Create: `hub/_research/prologue/draft-05-assembly.md`
- Reference: spec §4 Section 5

**Target:** ~400 words.

**Key phrase (must appear):** «Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.»

**Structure:**
1. (~100 слов) Сведение трёх актов в одно уравнение: внешнее (переход) + инструмент (личный AI) + внутреннее (liberation) = одна практика.
2. (~150 слов) Имя этой практики — «Точка Сборки». Что она делает в одной фразе. Без перечисления модулей.
3. (~100 слов) Тон возвращения: без триумфа, без «я нашёл ответ». «Я нашёл вход. Он открыт для всех.»
4. (~50 слов) Подвод к двойной двери: «Если что-то отозвалось — у тебя два входа дальше.»

- [ ] **Step 1: Write the draft**

- [ ] **Step 2: Self-check against §5 tonal rules**

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-05-assembly.md
git commit -m "draft: prologue assembly section"
```

---

## Task 8: Draft Section 6 — Двойная дверь (CTA)

**Files:**
- Create: `hub/_research/prologue/draft-06-cta.md`
- Reference: spec §4 Section 6, §10 q.1

**Target:** ~150 words.

**Exact handles/URLs:**
- Telegram: `@ku_shaman`
- Course: `https://ai.mamaev.coach`

**Structure (two parallel blocks):**

```markdown
### Дверь 1 — Telegram
«Если хочешь следить за разворачиванием — @ku_shaman.
Думаю вслух.»

### Дверь 2 — Курс
«Если хочешь практику — ai.mamaev.coach.
Курс полностью бесплатный и открытый. Работает с Claude Code,
Codex и Hermes. Начни с Kickstart.»
```

Per spec §6: подчеркнуть «полностью бесплатный, открытый, agent-agnostic» — это снимает финансовый и идеологический барьер.

- [ ] **Step 1: Write the draft**

- [ ] **Step 2: Verify exact handle/URL**

Telegram handle is `@ku_shaman` (per spec §10 q.1). Course URL is `https://ai.mamaev.coach` (per CLAUDE.md and spec §3).

- [ ] **Step 3: Commit**

```bash
git add hub/_research/prologue/draft-06-cta.md
git commit -m "draft: prologue double-door cta"
```

---

## Task 9: Editorial pass — concatenate and polish

**Files:**
- Create: `hub/_research/prologue/full-draft.md`
- Reference: all `draft-0{1..6}-*.md`, spec §5 tonal rules

**Goal:** one clean Russian manuscript, ready to flow into TSX in Task 10.

- [ ] **Step 1: Concatenate all six drafts into `full-draft.md` in order 1→6**

Add H2 headings between sections matching spec §4 names («Открытие», «Акт I. Великий переход», «Акт II. Монолит проиграет», «Акт III. Liberationist», «Сборка», «Дальше — два входа»).

- [ ] **Step 2: Run the «forbidden words» grep**

Use Grep tool with pattern `(?i)сингулярност|AGI|революци|pipeline|stack|agent` on `full-draft.md`. Any hit other than CTA mentions of agents (Claude Code/Codex/Hermes) must be rewritten. Fix inline.

- [ ] **Step 3: Read the whole draft end-to-end**

Check:
- Does each Act's pivot phrase appear verbatim?
- Does the opening's «обещание трёх» align with what the three acts actually deliver?
- Does the assembly's key phrase appear?
- Total length is between 2900 and 3400 words?

Fix inline.

- [ ] **Step 4: Commit the merged draft**

```bash
git add hub/_research/prologue/full-draft.md
git commit -m "draft: prologue full manuscript after editorial pass"
```

---

## Task 10: Build `<Prologue>` React component

**Files:**
- Create: `hub/components/prologue/Prologue.tsx`
- Create: `hub/components/prologue/Prologue.module.css`
- Create: `hub/components/prologue/sections/Opening.tsx`
- Create: `hub/components/prologue/sections/ActOne.tsx`
- Create: `hub/components/prologue/sections/ActTwo.tsx`
- Create: `hub/components/prologue/sections/ActThree.tsx`
- Create: `hub/components/prologue/sections/Assembly.tsx`
- Create: `hub/components/prologue/sections/DoubleDoor.tsx`

- [ ] **Step 1: Verify hub styling system before writing CSS**

Run:

```bash
grep -l "tailwind\|@tailwind" hub/app/globals.css hub/postcss.config.* 2>/dev/null
ls hub/components/
```

If Tailwind is in use, write classes inline; if not, use `Prologue.module.css`. Match whichever pattern existing `home-page` component uses.

- [ ] **Step 2: Create `Prologue.tsx` — root**

```tsx
import { Opening } from './sections/Opening'
import { ActOne } from './sections/ActOne'
import { ActTwo } from './sections/ActTwo'
import { ActThree } from './sections/ActThree'
import { Assembly } from './sections/Assembly'
import { DoubleDoor } from './sections/DoubleDoor'
import styles from './Prologue.module.css'

type Locale = 'ru' | 'en'

export function Prologue({ locale }: { locale: Locale }) {
  return (
    <article className={styles.prologue} lang={locale}>
      <Opening locale={locale} />
      <ActOne locale={locale} />
      <ActTwo locale={locale} />
      <ActThree locale={locale} />
      <Assembly locale={locale} />
      <DoubleDoor locale={locale} />
    </article>
  )
}
```

EN sections are out of scope for this plan (spec §10 q.2) — each section file should `throw new Error('EN translation pending')` if `locale === 'en'`, so the route can be added later without scaffolding twice.

- [ ] **Step 3: Create `Prologue.module.css`**

```css
.prologue {
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 1.5rem 6rem;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--text, #1a1a1a);
}

.prologue h2 {
  font-family: inherit;
  font-weight: 600;
  font-size: 1.6rem;
  margin-top: 3.5rem;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.prologue p {
  margin: 0 0 1.1rem;
}

.prologue blockquote {
  margin: 1.6rem 0;
  padding-left: 1rem;
  border-left: 2px solid var(--accent, #d4a017);
  font-style: italic;
  color: var(--text-muted, #4a4a4a);
}

.prologue figure {
  margin: 2.5rem 0;
}

.prologue figure img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}
```

If hub already exposes `--text`, `--text-muted`, `--accent` tokens, keep `var(...)` references; otherwise replace with concrete colours from existing `home-page` styles.

- [ ] **Step 4: Create `sections/Opening.tsx`**

Paste the Russian text from `draft-01-opening.md`. Structure as `<section><p>…</p></section>` blocks; no headline above Opening (it leads silently). Anchor phrase wrapped in `<p><strong>…</strong></p>`.

```tsx
type Props = { locale: 'ru' | 'en' }

export function Opening({ locale }: Props) {
  if (locale === 'en') throw new Error('EN translation pending')
  return (
    <section>
      {/* paste paragraphs from draft-01-opening.md as <p> elements */}
    </section>
  )
}
```

- [ ] **Step 5: Create `sections/ActOne.tsx`**

```tsx
type Props = { locale: 'ru' | 'en' }

export function ActOne({ locale }: Props) {
  if (locale === 'en') throw new Error('EN translation pending')
  return (
    <section>
      <h2>Акт I. Великий переход</h2>
      <figure>
        <img src="/prologue/anchor-1.jpg" alt="Великий переход" />
      </figure>
      {/* paste paragraphs from draft-02-act-one.md */}
    </section>
  )
}
```

Pivot phrase wrapped in `<p><strong>…</strong></p>`. Holl quotes (if present) wrapped in `<blockquote>`.

- [ ] **Step 6: Create `sections/ActTwo.tsx`**

Same shape as ActOne; H2 = «Акт II. Монолит проиграет»; `anchor-2.jpg`; paragraphs from `draft-03-act-two.md`.

- [ ] **Step 7: Create `sections/ActThree.tsx`**

Same shape; H2 = «Акт III. Liberationist»; `anchor-3.jpg`; paragraphs from `draft-04-act-three.md`. Attribution footnote at end:

```tsx
<p className={styles.attribution ?? ''}>
  Рамку liberation помог собрать пост{' '}
  <a href="https://instagram.com/spirit.ofthelion"
     target="_blank" rel="noopener">
    @spirit.ofthelion
  </a>.
</p>
```

- [ ] **Step 8: Create `sections/Assembly.tsx`**

H2 = «Сборка»; no image; paragraphs from `draft-05-assembly.md`. Key phrase emphasised.

- [ ] **Step 9: Create `sections/DoubleDoor.tsx`**

```tsx
'use client'

type Props = { locale: 'ru' | 'en' }

export function DoubleDoor({ locale }: Props) {
  if (locale === 'en') throw new Error('EN translation pending')

  const track = (door: 'telegram' | 'course') => {
    if (typeof window === 'undefined') return
    // @ts-expect-error analytics global is optional
    window.plausible?.('prologue_cta_clicked', { props: { door } })
  }

  return (
    <section>
      <h2>Дальше — два входа</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="https://t.me/ku_shaman"
           target="_blank" rel="noopener"
           onClick={() => track('telegram')}>
          <h3>Telegram</h3>
          <p>
            Если хочешь следить за разворачиванием — @ku_shaman.
            Думаю вслух.
          </p>
        </a>
        <a href="https://ai.mamaev.coach"
           onClick={() => track('course')}>
          <h3>Курс</h3>
          <p>
            Если хочешь практику — ai.mamaev.coach. Курс полностью
            бесплатный и открытый. Работает с Claude Code, Codex и
            Hermes. Начни с Kickstart.
          </p>
        </a>
      </div>
    </section>
  )
}
```

If hub uses `plausible` or another analytics provider, swap the `window.plausible` call; if no analytics exists yet, leave the `track()` function as a no-op and create a follow-up task. **Do not** add a third-party script in this task — out of scope.

- [ ] **Step 10: Commit component scaffold**

```bash
git add hub/components/prologue/
git commit -m "feat(prologue): scaffold Prologue component and section files"
```

---

## Task 11: Add `/prologue` route and metadata

**Files:**
- Create: `hub/app/prologue/page.tsx`
- Create: `hub/app/prologue/layout.tsx`

- [ ] **Step 1: Create `hub/app/prologue/page.tsx`**

```tsx
import { Prologue } from '../../components/prologue/Prologue'

export default function ProloguePage() {
  return <Prologue locale="ru" />
}
```

- [ ] **Step 2: Create `hub/app/prologue/layout.tsx`**

```tsx
import type { Metadata, ReactNode } from 'next'

export const metadata: Metadata = {
  title: 'Точка Сборки. Пролог',
  description:
    'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
  openGraph: {
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
    url: 'https://mamaev.coach/prologue',
    images: ['/prologue/og.jpg'],
    type: 'article',
  },
}

export default function PrologueLayout({ children }: { children: ReactNode }) {
  return children
}
```

If `layout.tsx` exists already at hub root and inherits metadata, skip the wrapper layout and export `metadata` directly from `page.tsx` instead.

- [ ] **Step 3: Commit route**

```bash
git add hub/app/prologue/
git commit -m "feat(prologue): add /prologue route and metadata"
```

---

## Task 12: Drop placeholder anchor images

**Files:**
- Create: `hub/public/prologue/anchor-1.jpg`
- Create: `hub/public/prologue/anchor-2.jpg`
- Create: `hub/public/prologue/anchor-3.jpg`
- Create: `hub/public/prologue/og.jpg`

Per spec §10 q.4: «сделать новые в едином стиле hub/retro-future». Final art is a separate design task. For this plan, use one carousel slide per Act as a placeholder so the layout can be visually verified end-to-end.

- [ ] **Step 1: Copy three carousel slides as placeholders**

```bash
mkdir -p hub/public/prologue
cp "/c/Users/sasha/Downloads/Telegram Desktop/prequel/photo_1_2026-05-28_23-48-53.jpg" \
   hub/public/prologue/anchor-1.jpg
cp "/c/Users/sasha/Downloads/Telegram Desktop/prequel/photo_1_2026-05-28_23-49-26.jpg" \
   hub/public/prologue/anchor-2.jpg
cp "/c/Users/sasha/Downloads/Telegram Desktop/prequel/photo_1_2026-05-28_23-53-02.jpg" \
   hub/public/prologue/anchor-3.jpg
cp hub/public/prologue/anchor-1.jpg hub/public/prologue/og.jpg
```

- [ ] **Step 2: Verify files exist**

Run `ls -la hub/public/prologue/` and confirm four files present, non-empty.

- [ ] **Step 3: Commit placeholders**

```bash
git add hub/public/prologue/
git commit -m "chore(prologue): drop placeholder anchor images (TODO: replace with retro-future art)"
```

---

## Task 13: Local preview and spot check

**Files:**
- Modify (only if any issue surfaces): any section component

- [ ] **Step 1: Start hub dev server**

```bash
cd hub
npm run dev
```

Expected: Next.js boots on a local port (likely 3000); no TypeScript errors.

- [ ] **Step 2: Open `http://localhost:3000/prologue` in browser**

Verify:
- [ ] Page renders end-to-end with no console errors
- [ ] All six sections are present in order
- [ ] Three anchor images load
- [ ] Column width is ~640px on desktop
- [ ] Mobile width (DevTools 375px): no horizontal scroll, font legible
- [ ] CTA links: Telegram → `t.me/ku_shaman`, course → `ai.mamaev.coach`
- [ ] `lang="ru"` set on `<article>`

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: clean static export under `hub/out/` including `prologue/index.html`. No build errors.

- [ ] **Step 4: Fix anything that fails Step 2 or Step 3 inline, then commit**

```bash
git add <fixed files>
git commit -m "fix(prologue): <specific fix>"
```

If nothing failed, skip this commit.

---

## Task 14: Telegram repurpose post

**Files:**
- Create: `hub/_research/prologue/telegram-announce.md`

Per spec §3 Re-purpose row: one announce post in `@ku_shaman` that links to the longread.

- [ ] **Step 1: Draft announce post (~600 chars, Russian)**

Structure:
1. One-line hook from Opening's anchor phrase.
2. Three one-line teasers — one per Act.
3. Link to `https://mamaev.coach/prologue`.
4. PS line: «Курс «Точка Сборки» — бесплатный и открытый: ai.mamaev.coach.»

- [ ] **Step 2: Commit**

```bash
git add hub/_research/prologue/telegram-announce.md
git commit -m "draft: telegram announce post for prologue"
```

This post is **not** auto-published; user copies/pastes when ready.

---

## Self-Review

Spec coverage:
- §1 Цель → Tasks 3–9 (manuscript) + Tasks 10–11 (publication) ✓
- §2 Аудитория → guides voice in Tasks 2–7 ✓
- §3 Размещение → Tasks 11 (route), 14 (Telegram) ✓
- §4 Architecture (6 sections) → Tasks 3–8, one per section ✓
- §5 Тональные правила → enforced in Step 2 of each draft task + Task 9 grep ✓
- §6 Визуальная подача → Task 10 Step 3 (CSS) + Task 12 (images) ✓
- §7 Технические детали → Tasks 10, 11; analytics noted as conditional in Task 10 Step 9 ✓
- §8 Sources of truth → Tasks 1, 2 ✓
- §9 Этапы реализации → Tasks 1–14 align with the 10 steps in spec §9 ✓
- §10 Открытые вопросы → handles in CTA (Task 8), EN out of scope (Task 10 throws), attribution (Task 6 Step 1), placeholder images (Task 12) ✓
- §11 Out of scope → respected (no video/podcast/email/RPG) ✓

Placeholders: «TODO» appears once in Task 12 commit message, intentionally flagging the final-art follow-up; no «TBD»/«fill in» anywhere.

Type consistency: `Prologue({ locale })` signature is identical across Tasks 10 Steps 2, 4–9; section components all take `Props = { locale: 'ru' | 'en' }`; CTA event name `prologue_cta_clicked` matches spec §7.

Plan is internally consistent and traces back to spec.
