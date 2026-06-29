# 'Поиск с ИИ' / Research with AI track — design (fb_b5457149f581)

**Ticket:** `fb_b5457149f581` — course content "Поиск с ИИ" / Research & Search with AI: teach learners to research **with** AI (AI search engines, research-query + follow-up loop, deep-research modes, grounding + source verification, web × AI synthesis) instead of memorizing Google operators. Bilingual RU+EN. Authenticity: source verification, no blind trust.

## Goal

Add a third opt-in `/exercises` track that teaches research-with-AI as a hands-on loop, with **source verification as the spine** — "don't trust the unsourced." Same proven content-track mechanic as the existing package + automate tracks.

## Placement decision (from design gate)

Third optional track in `content/{ru,en}/exercises.mdx`, sibling to the package + automate tracks. Not a Meeting-6 unit, not a standalone page. Lightest path, live surface immediately, fully self-contained.

## Scope

- Single app: `LMS/tochka-sborki/web/`. Content only (MDX) + one content-presence guard test.
- `lms_target: course` (Tochka content, not engine).

Out of scope: any engine/component change, a new route, a Meeting-6 unit, tooling.

## Architecture — content-track-on-live-surface (no engine change)

Append one track to `content/ru/exercises.mdx` and `content/en/exercises.mdx` (mirror), after the automate track (the current last section). Shape mirrors the automate track exactly:

```
## 🔎 Трек (опционально): <name>
> <intro blockquote>
<intro paragraph — ends "…сохраняй результат в `my-experiments/`.">
### Шаг N. <title>
**Цель:** <one-line goal>
<paragraph ending with a `my-experiments/research-N-<slug>.md` save-anchor>
… ×5 …
> <closing blockquote>
```

Plus: extend the frontmatter `description` (which already names the package + automate tracks) to name the third; add `lib/content/research-track.test.ts` mirroring `automate-track.test.ts`.

### Save-anchors (the 5 step files)

`research-1-question.md`, `research-2-loop.md`, `research-3-deep.md`, `research-4-verify.md`, `research-5-synthesis.md` (all under `my-experiments/`).

### Full content — RU (`content/ru/exercises.mdx`, appended after the automate track)

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

### Full content — EN (`content/en/exercises.mdx`, appended after the automate track)

```mdx
## 🔎 Track (optional): Research with AI

> "Stop memorizing search operators — learn to research with AI."

"Knowing how to search" used to mean remembering Google operators. Now it means running a research loop with AI and **verifying** what it gives back. AI speeds up the search but can be confidently wrong and invent sources — so the rule of this track is simple: **don't trust the unsourced**. Take one step at a time and save your work to `my-experiments/`.

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

Open the actual sources the AI cites and check the claims against them. If a link doesn't open, a source doesn't back the claim, or there's no source at all — strike that piece out. This is the heart of the track: **don't trust the unsourced**, even when it sounds convincing. Note what held up and what didn't in `my-experiments/research-4-verify.md`.

### Step 5. Synthesis: web search × AI

**Goal:** your own grounded answer, not someone's paraphrase.

Combine classic web search with AI synthesis: sometimes it's faster to open a couple of live pages yourself, sometimes to let the AI assemble the picture. Build your own short answer to the original question out of what you verified, and note where the AI got it wrong. Save the result to `my-experiments/research-5-synthesis.md`.

> Done. You're not recalling search operators anymore — you run a research loop with AI and keep the sources in hand.
```

### Frontmatter `description` update

- **ru:** `"8 упражнений для закрепления уровней 1–4 + опциональные треки: «упакуй экспертизу», «автоматизируй практику» и «поиск с ИИ»"`
- **en:** `"8 exercises to consolidate levels 1–4 + optional tracks: \"package your expertise\", \"automate your practice\", and \"research with AI\""`

## Authenticity constraints

- **Verification is the spine** (Step 4), not a footnote: "не верь без источника" / "don't trust the unsourced"; AI hallucinates and invents sources — say so plainly.
- De-guru, de-hustle: no "10x research," no scarcity, no "secret operators." It's a calm practice loop.
- Learner-owned: results saved to the learner's own `my-experiments/` (copy-out, no DB), consistent with the other tracks.

## Testing

`lib/content/research-track.test.ts` (mirror `automate-track.test.ts`):
- ru `exercises.mdx` contains heading marker `Поиск с ИИ` + all 5 anchors.
- en `exercises.mdx` contains heading marker `Research with AI` + all 5 anchors.
- bilingual markers differ: ru contains `не верь без источника`, en contains `don't trust the unsourced`.

Content-presence only; no engine logic; no new dependencies.

## Backward compatibility

Pure additive append + a frontmatter description string + a new test. Existing exercises, the two prior tracks, and all other tests are untouched.

## Task decomposition (for the plan)

Single task (TDD): write `research-track.test.ts` (red) → append the RU + EN track + update both frontmatter descriptions → test green + `npm run build`.
