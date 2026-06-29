# Research-with-AI Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third opt-in `/exercises` track — "Поиск с ИИ" / "Research with AI" — teaching research-with-AI as a hands-on loop with source verification as its spine.

**Architecture:** Content-track-on-live-surface (no engine change): append one track (mirroring the existing automate track) to `content/{ru,en}/exercises.mdx`, extend the frontmatter `description`, and guard it with a content-presence test mirroring `automate-track.test.ts`.

**Tech Stack:** MDX content (Next.js 16 `output: 'export'`), Vitest. No new dependencies.

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Scoped: `npm run test -- lib/content/research-track.test.ts`.
- Content is bilingual: every RU addition has a mirrored EN addition. Use the exact prose from the spec, character-for-character (proper Cyrillic diacritics, `«»` guillemets, em-dashes, backticked save-anchors).
- The five save-anchors are exactly: `my-experiments/research-1-question.md`, `research-2-loop.md`, `research-3-deep.md`, `research-4-verify.md`, `research-5-synthesis.md`.
- Track headings: ru `## 🔎 Трек (опционально): Поиск с ИИ`, en `## 🔎 Track (optional): Research with AI`.
- Bilingual markers (must appear verbatim): ru `не верь без источника`, en `don't trust the unsourced`.
- Authenticity: verification is the spine; de-guru, de-hustle; no scarcity. (Already baked into the spec prose — transcribe it, don't embellish.)
- The track appends at the END of each file (both files currently end with the automate track's closing blockquote). Pure additive — do not modify any existing exercise or the prior two tracks.
- Commit directly to `main` (trunk-based). Do NOT create a feature branch.
- No new dependencies.

---

### Task 1: Append the research-with-AI track (RU + EN) + frontmatter + guard test

**Files:**
- Create: `lib/content/research-track.test.ts`
- Modify: `content/ru/exercises.mdx` (frontmatter `description` line 3; append track at EOF)
- Modify: `content/en/exercises.mdx` (frontmatter `description` line 3; append track at EOF)

**Interfaces:**
- Consumes: nothing (content + a self-contained test reading raw MDX).
- Produces: nothing importable — a content track + a presence-guard test.

- [ ] **Step 1: Write the failing test**

Create `lib/content/research-track.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT = join(HERE, '..', '..', 'content') // web/content
const read = (loc: 'ru' | 'en') => readFileSync(join(CONTENT, loc, 'exercises.mdx'), 'utf8')

const ANCHORS = [
  'research-1-question.md', 'research-2-loop.md', 'research-3-deep.md',
  'research-4-verify.md', 'research-5-synthesis.md',
]

describe('research-with-AI track', () => {
  it('ru exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('ru')
    expect(src).toContain('Поиск с ИИ')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('en exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('en')
    expect(src).toContain('Research with AI')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('the ru and en verification markers differ (bilingual, not a copy)', () => {
    expect(read('ru')).toContain('не верь без источника')
    expect(read('en')).toContain('don’t trust the unsourced')
  })
})
```

> Note: the en marker uses a curly apostrophe (`don’t`) to match the spec prose. The `’` escape in the test is that exact character — Step 3's EN prose must use the same curly `’`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/content/research-track.test.ts`
Expected: FAIL — the anchors / heading are not in the MDX yet (assertions throw).

- [ ] **Step 3: Append the RU track**

Append the following to the END of `content/ru/exercises.mdx` (after the final `> Готово. Ты не заменил себя…` blockquote, preceded by one blank line):

```mdx
## 🔎 Трек (опционально): Поиск с ИИ

> «Перестань вспоминать операторы поиска — научись исследовать вместе с ИИ.»

Раньше «уметь искать» значило помнить операторы Google. Теперь — уметь вести исследование вместе с ИИ и **проверять** то, что он выдаёт. ИИ ускоряет поиск, но может уверенно ошибаться и выдумывать источники — поэтому правило трека простое: **не верь без источника**. Делай по одному шагу, сохраняй результат в `my-experiments/`.

### Шаг 1. Выбери настоящий вопрос

**Цель:** реальный вопрос, а не «потренироваться».

Возьми вопрос, который ты бы и так загуглил(а) на этой неделе — рабочий, бытовой, любой настоящий. Сформулируй его одним предложением, как задал(а) бы живому эксперту. Запиши вопрос в `my-experiments/research-1-question.md`.

### Шаг 2. Спроси AI-поисковик и веди цикл уточнений

**Цель:** не первый ответ, а разговор.

Задай вопрос AI-поисковику — Perplexity, поиск в ChatGPT или Gemini. Не останавливайся на первом ответе: уточняй, переспрашивай, проси сузить или копнуть глубже. Хороший research — это цикл, а не один запрос. Сохрани вопросы и ключевые ответы в `my-experiments/research-2-loop.md`.

### Шаг 3. Включи режим deep research

**Цель:** глубина там, где она важна.

Для вопроса, который правда важен, включи режим глубокого исследования (deep research в ChatGPT, Gemini или Perplexity). Дай ему время пройтись вширь и собрать отчёт. Сохрани, что он нашёл — вместе со списком источников — в `my-experiments/research-3-deep.md`.

### Шаг 4. Заземлись и ПРОВЕРЬ источники

**Цель:** отделить правду от уверенного вымысла.

Открой настоящие источники, на которые ссылается ИИ, и сверь утверждения. Ссылка не открывается, источник не подтверждает мысль или его вовсе нет — вычеркни этот кусок. Это сердце трека: **не верь без источника**, даже когда звучит убедительно. Отметь, что подтвердилось, а что нет, в `my-experiments/research-4-verify.md`.

### Шаг 5. Синтез: веб-поиск × ИИ

**Цель:** свой обоснованный ответ, а не чужой пересказ.

Соедини обычный веб-поиск с AI-синтезом: где-то быстрее открыть пару живых страниц самому, где-то — дать ИИ собрать картину. Собери из проверенного свой короткий ответ на исходный вопрос и отметь, где ИИ ошибался. Сохрани итог в `my-experiments/research-5-synthesis.md`.

> Готово. Теперь ты не вспоминаешь операторы поиска — ты ведёшь исследование с ИИ и держишь источники под рукой.
```

- [ ] **Step 4: Append the EN track**

Append the following to the END of `content/en/exercises.mdx` (after the final `> Done. You didn't replace yourself…` blockquote, preceded by one blank line). Use the curly apostrophe `’` in "don’t" exactly as written:

```mdx
## 🔎 Track (optional): Research with AI

> "Stop memorizing search operators — learn to research with AI."

"Knowing how to search" used to mean remembering Google operators. Now it means running a research loop with AI and **verifying** what it gives back. AI speeds up the search but can be confidently wrong and invent sources — so the rule of this track is simple: **don’t trust the unsourced**. Take one step at a time and save your work to `my-experiments/`.

### Step 1. Pick a real question

**Goal:** a real question, not a "practice" one.

Take a question you'd google this week anyway — work, life, anything real. Phrase it in one sentence, the way you'd ask a live expert. Write the question down in `my-experiments/research-1-question.md`.

### Step 2. Ask an AI search engine and run a follow-up loop

**Goal:** not the first answer, but a conversation.

Ask your question to an AI search engine — Perplexity, ChatGPT search, or Gemini. Don't stop at the first answer: refine, re-ask, ask it to narrow down or dig deeper. Good research is a loop, not a single query. Save your follow-ups and the key answers to `my-experiments/research-2-loop.md`.

### Step 3. Use deep-research mode

**Goal:** depth where it matters.

For a question that genuinely matters, switch on a deep-research mode (deep research in ChatGPT, Gemini, or Perplexity). Give it time to go wide and assemble a report. Save what it found — together with its source list — to `my-experiments/research-3-deep.md`.

### Step 4. Ground it and VERIFY the sources

**Goal:** separate truth from confident fiction.

Open the actual sources the AI cites and check the claims against them. If a link doesn't open, a source doesn't back the claim, or there's no source at all — strike that piece out. This is the heart of the track: **don’t trust the unsourced**, even when it sounds convincing. Note what held up and what didn't in `my-experiments/research-4-verify.md`.

### Step 5. Synthesis: web search × AI

**Goal:** your own grounded answer, not someone's paraphrase.

Combine classic web search with AI synthesis: sometimes it's faster to open a couple of live pages yourself, sometimes to let the AI assemble the picture. Build your own short answer to the original question out of what you verified, and note where the AI got it wrong. Save the result to `my-experiments/research-5-synthesis.md`.

> Done. You're not recalling search operators anymore — you run a research loop with AI and keep the sources in hand.
```

- [ ] **Step 5: Update both frontmatter descriptions**

In `content/ru/exercises.mdx`, replace the frontmatter `description` line:

```
description: "8 упражнений для закрепления уровней 1–4 + опциональные треки: «упакуй экспертизу» и «автоматизируй практику»"
```
with:
```
description: "8 упражнений для закрепления уровней 1–4 + опциональные треки: «упакуй экспертизу», «автоматизируй практику» и «поиск с ИИ»"
```

In `content/en/exercises.mdx`, replace the frontmatter `description` line:

```
description: "8 exercises to consolidate levels 1–4 + optional tracks: \"package your expertise\" and \"automate your practice\""
```
with:
```
description: "8 exercises to consolidate levels 1–4 + optional tracks: \"package your expertise\", \"automate your practice\", and \"research with AI\""
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- lib/content/research-track.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Build + full suite (no regressions)**

Run: `npm run build`
Expected: build succeeds — the `/exercises` page (both locales) renders the new track.

Run: `npm run test`
Expected: PASS — all existing tests + the 3 new track tests; the two prior track tests untouched.

- [ ] **Step 8: Commit**

```bash
git add content/ru/exercises.mdx content/en/exercises.mdx lib/content/research-track.test.ts
git commit -m "feat(course): research-with-AI optional /exercises track (fb_b5457149f581)"
```

---

## Self-Review

**1. Spec coverage:**
- Third opt-in track on `/exercises`, mirroring the automate track shape → Task 1 Steps 3-4. ✅
- RU + EN full prose (5 steps, intro/closing blockquotes, save-anchors), verification as spine → Task 1 Steps 3-4 (verbatim from spec). ✅
- Frontmatter `description` extended in both locales → Task 1 Step 5. ✅
- Guard test (heading + 5 anchors + differing bilingual markers) → Task 1 Step 1. ✅
- Authenticity (verification spine, de-guru/de-hustle) → baked into the transcribed prose + Global Constraints. ✅
- Backward compat (pure additive, prior tracks untouched) → Global Constraints + Step 7. ✅
- No new deps → Tech Stack + Global Constraints. ✅

**2. Placeholder scan:** No TBD/TODO. Every content block is the full verbatim prose; the test is complete code.

**3. Type/consistency:** The test's 5 anchors and heading markers exactly match the prose in Steps 3-4. The bilingual markers in the test (`не верь без источника` / `don’t trust the unsourced`, with curly apostrophe) match the prose verbatim — the curly-apostrophe note in Step 1 and Step 4 prevents an ASCII/Unicode mismatch that would fail the test.
