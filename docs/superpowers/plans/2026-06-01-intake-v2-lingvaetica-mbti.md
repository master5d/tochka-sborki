# Intake v2 — LINGVÆTICA + MBTI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a short, sensory v2 intake instrument (LINGVÆTICA voice) with MBTI capture and a relational bonding profile, while freezing the existing 63-question v1 for any student already mid-survey — zero reset, zero answer-data migration.

**Architecture:** Version-snapshot via a new `instrument_version` column (additive migration; existing rows default to 1, frozen). v1 questions stay untouched in `questions.ts`; v2 lives in `questions.v2.ts`. Wizard, REQUIRED-check, and scoring are all routed by version. v2's short core derives the same downstream fields (niche/world-skin/os/cogTier/attributes) the RPG layer already consumes; MBTI + rhythm + error-style compose a relational profile fed into the companion prompt. The intake's payoff is the student's generated 7-block companion charter.

**Tech Stack:** Next.js 16 (static export), TypeScript, Vitest, Cloudflare Worker + D1 (SQLite), shared `web/lib/intake/*` imported by the worker.

**Spec:** `docs/superpowers/specs/2026-05-31-intake-v2-lingvaetica-mbti-design.md`

---

## File Structure

**Create:**
- `web/lib/intake/questions.v2.ts` — the v2 instrument (core + MBTI + depth) + v2 module intros.
- `web/lib/intake/instrument.ts` — `getQuestions(version)` / `getModuleIntros(version)` / `requiredIds(version)` router.
- `web/lib/intake/mbti.ts` — `deriveMbti(answers)` + `relationalStyle(answers)` (pure).
- `web/lib/intake/scoring-v2.ts` — `scoreProfileV2(answers, locale)` → same `ScoreResult` shape.
- Test files: `questions.v2.test.ts`, `mbti.test.ts`, `scoring-v2.test.ts`, `instrument.test.ts`.
- `workers/migrations/0006_instrument_version.sql` — additive columns.
- `web/components/intake/charter-reveal.tsx` — post-submit charter payoff.

**Modify:**
- `web/lib/intake/types.ts` — extend `worldSkinSource` union; add `MbtiType`, `RelationalStyle` types; extend `ScoreResult` (mbti, relationalStyle).
- `web/lib/intake/learn-prompt.ts` — accept `mbti?` + `relational?`, add directive blocks (RU+EN).
- `web/components/intake/intake-wizard.tsx` — load `instrument_version`, route question set, send `instrumentVersion` on progress.
- `workers/src/handlers/intake.ts` — version-routed REQUIRED + scoring; stamp/freeze version; persist mbti + relational_style.
- `workers/src/index.ts` — pass `instrumentVersion` through the progress route.
- `web/components/unit-wizard.tsx` — pass `mbti` + `relational` into `buildLearnPrompt`.

**Frozen (never edit again):** `web/lib/intake/questions.ts` (v1), `web/lib/intake/scoring.ts` (`scoreProfile` = v1).

---

## Phase 1 — Types + v2 instrument data

### Task 1: Extend shared types

**Files:**
- Modify: `web/lib/intake/types.ts`

- [ ] **Step 1: Add types** — append to `web/lib/intake/types.ts`:

```typescript
export type InstrumentVersion = 1 | 2

export type MbtiAxis = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P'
export type MbtiType = string // 4-letter, e.g. 'INTJ'

export interface RelationalStyle {
  rhythm: 'suave' | 'fuego' | 'libre' | 'ritual' | null
  errorStyle: 'calm' | 'lose_motivation' | 'soft_feedback' | 'fix_immediately' | null
  anchor: 'support' | 'topics' | 'quick_wins' | 'structure' | 'freedom' | null
  attention: 'short' | 'mid' | 'long' | null
}
```

- [ ] **Step 2: Extend `worldSkinSource` + `ScoreResult`** — in the `ScoreResult` interface change the `worldSkinSource` line and add two fields:

```typescript
  worldSkinSource: 'g9' | 'g3' | 'wanderer-fallback' | 'v2'
  // ...existing fields...
  mbti: MbtiType | null
  relationalStyle: RelationalStyle | null
```

- [ ] **Step 3: Verify compile**

Run: `cd web && npx tsc --noEmit`
Expected: errors only in `scoring.ts` (v1 doesn't set `mbti`/`relationalStyle` yet) — fixed in Task 2.

- [ ] **Step 4: Make v1 scoring satisfy the type** — in `web/lib/intake/scoring.ts`, in the object returned by `scoreProfile`, add before the closing brace:

```typescript
    mbti: null,
    relationalStyle: null,
```

- [ ] **Step 5: Verify compile clean**

Run: `cd web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add web/lib/intake/types.ts web/lib/intake/scoring.ts
git commit -m "feat(intake): types for instrument versioning, MBTI, relational style"
```

### Task 2: Author the v2 instrument

**Files:**
- Create: `web/lib/intake/questions.v2.ts`
- Test: `web/lib/intake/questions.v2.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/intake/questions.v2.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { QUESTIONS_V2, MODULE_INTROS_V2 } from './questions.v2'

const NICHE = new Set(['coach','massage','astrology','content','ecommerce','service','tech','other'])
const SKIN = new Set(['slavic-myth','dark-fantasy','cyber-noir','space-opera','anime-quest','soviet-heroic','mystic-arcane'])

describe('QUESTIONS_V2', () => {
  it('every question is bilingual and optional', () => {
    for (const q of QUESTIONS_V2) {
      expect(q.prompt.ru, q.id).toBeTruthy()
      expect(q.prompt.en, q.id).toBeTruthy()
      expect(q.required, `${q.id} must be optional`).toBe(false)
    }
  })
  it('every showIf points at a real question', () => {
    const ids = new Set(QUESTIONS_V2.map(q => q.id))
    for (const q of QUESTIONS_V2) if (q.showIf) expect(ids.has(q.showIf.questionId), q.id).toBe(true)
  })
  it('niche + skin options reuse the canonical enums', () => {
    const niche = QUESTIONS_V2.find(q => q.id === 'V_NICHE')!
    const skin = QUESTIONS_V2.find(q => q.id === 'V_SKIN')!
    expect(niche.options!.every(o => NICHE.has(o.value))).toBe(true)
    expect(skin.options!.every(o => SKIN.has(o.value))).toBe(true)
  })
  it('MBTI: self-report + 4 axis pairs gated on unknown', () => {
    for (const axis of ['V_MBTI_EI','V_MBTI_SN','V_MBTI_TF','V_MBTI_JP']) {
      const q = QUESTIONS_V2.find(x => x.id === axis)!
      expect(q.showIf).toEqual({ questionId: 'V_MBTI_SR', equals: 'unknown' })
      expect(q.options!.length).toBe(2)
    }
  })
  it('depth battery is gated behind V_DEEPEN == yes', () => {
    const depth = QUESTIONS_V2.filter(q => q.id.startsWith('VD_'))
    expect(depth.length).toBeGreaterThanOrEqual(5)
    for (const q of depth) expect(q.showIf).toEqual({ questionId: 'V_DEEPEN', equals: 'yes' })
  })
  it('one module intro per distinct module id', () => {
    const mods = new Set(QUESTIONS_V2.map(q => q.module))
    for (const m of mods) expect(MODULE_INTROS_V2.some(i => i.id === m)).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `cd web && npx vitest run lib/intake/questions.v2.test.ts`
Expected: FAIL — cannot find module `./questions.v2`.

- [ ] **Step 3: Create the v2 instrument** — `web/lib/intake/questions.v2.ts`. (`ModuleId` widening: v2 uses two module ids, `'V'` and `'VD'`; widen the type in `types.ts` `ModuleId` union to include `'V' | 'VD'` first — do that edit as part of this step.)

In `types.ts` change:
```typescript
export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'V' | 'VD'
```

Then create `web/lib/intake/questions.v2.ts`:

```typescript
// web/lib/intake/questions.v2.ts
// v2 instrument — short sensory core (LINGVÆTICA voice) + adaptive MBTI + optional depth.
// Every question is optional. Value keys for niche/skin/os reuse the canonical v1 enums
// so the RPG layer + companion consume the same fields. New question IDs never collide
// with v1 (A1..G12, OS). Scored by scoring-v2.ts, never by v1 scoring.ts.
import type { Question, ModuleIntro } from './types'

export const MODULE_INTROS_V2: ModuleIntro[] = [
  {
    id: 'V',
    title: { ru: 'Настройка поля', en: 'Tuning the field' },
    intro: {
      ru: 'Коротко и без экзамена. Несколько вопросов, чтобы собрать твоего напарника по со-мышлению под тебя. Любой можно пропустить — отвечай на то, что откликается.',
      en: "Short, no exam. A few questions to assemble your co-thinking partner around you. Skip any that don't resonate — answer what lands.",
    },
  },
  {
    id: 'VD',
    title: { ru: 'Точнее собрать персонажа', en: 'Sharpen your character' },
    intro: {
      ru: 'Пара минут — и атрибуты персонажа станут острее. Можно пропустить: тогда соберём по тому, что уже есть.',
      en: "A couple of minutes makes your character's attributes sharper. Skippable — we'll derive from what we already have.",
    },
  },
]

export const QUESTIONS_V2: Question[] = [
  {
    id: 'V_WHY', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Зачем тебе это сейчас?', en: 'Why this, why now?' },
    options: [
      { value: 'money_time', label: { ru: 'Деньги или время — практичный результат', en: 'Money or time — a practical result' } },
      { value: 'project', label: { ru: 'Есть проект, который давно хочу собрать', en: "There's a project I've wanted to build" } },
      { value: 'curiosity', label: { ru: 'Внутренний интерес, тянет разобраться', en: 'Inner pull, I want to get it' } },
      { value: 'community', label: { ru: 'Люди, общение, быть в потоке', en: 'People, connection, being in the flow' } },
      { value: 'edge', label: { ru: 'Не отстать, держать край', en: "To not fall behind, keep my edge" } },
    ],
  },
  {
    id: 'V_HOOK', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Что цепляет сильнее?', en: 'What pulls you more?' },
    options: [
      { value: 'build', label: { ru: 'Собирать, делать вещи', en: 'Building, making things' } },
      { value: 'talk', label: { ru: 'Говорить, объяснять, вести', en: 'Talking, explaining, leading' } },
      { value: 'order', label: { ru: 'Наводить порядок в хаосе', en: 'Bringing order to chaos' } },
      { value: 'create', label: { ru: 'Создавать контент, образы', en: 'Creating content, images' } },
      { value: 'understand', label: { ru: 'Понимать, как всё устроено', en: 'Understanding how things work' } },
    ],
  },
  {
    id: 'V_NICHE', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Где ты себя видишь — твоя сфера?', en: 'Where do you see yourself — your field?' },
    options: [
      { value: 'coach', label: { ru: 'Коучинг, психология, сопровождение', en: 'Coaching, psychology, guidance' } },
      { value: 'massage', label: { ru: 'Тело, практики, массаж', en: 'Body, practices, bodywork' } },
      { value: 'astrology', label: { ru: 'Астрология, духовное', en: 'Astrology, spiritual' } },
      { value: 'content', label: { ru: 'Контент, блог, медиа', en: 'Content, blogging, media' } },
      { value: 'ecommerce', label: { ru: 'Торговля, продукты', en: 'Commerce, products' } },
      { value: 'service', label: { ru: 'Сервис, услуги (другое)', en: 'Service business (other)' } },
      { value: 'tech', label: { ru: 'Технологии, разработка', en: 'Tech, development' } },
      { value: 'other', label: { ru: 'Другое', en: 'Other' } },
    ],
  },
  {
    id: 'V_OUTCOME', module: 'V', format: 'text', required: false,
    prompt: {
      ru: 'Один результат от ИИ, который в ближайшие 60 дней принёс бы деньги или сэкономил время?',
      en: 'One AI outcome that would make you money or save time in the next 60 days?',
    },
  },
  {
    id: 'V_RHYTHM', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Выбери свой ритм.', en: 'Pick your rhythm.' },
    options: [
      { value: 'suave', label: { ru: 'suave · мягко, без нажима', en: 'suave · soft, no pressure' } },
      { value: 'fuego', label: { ru: 'fuego · интенсивно, на огне', en: 'fuego · intense, on fire' } },
      { value: 'libre', label: { ru: 'libre · свободно, как пойдёт', en: 'libre · free, as it flows' } },
      { value: 'ritual', label: { ru: 'ritual · регулярно, по ритму', en: 'ritual · regular, on a beat' } },
    ],
  },
  {
    id: 'V_ERR', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Как ты реагируешь на ошибку?', en: 'How do you react to a mistake?' },
    options: [
      { value: 'calm', label: { ru: 'Спокойно, ошибка = настройка', en: 'Calmly — a mistake is just tuning' } },
      { value: 'lose_motivation', label: { ru: 'Падает мотивация', en: 'I lose motivation' } },
      { value: 'soft_feedback', label: { ru: 'Нужен мягкий фидбек', en: 'I need gentle feedback' } },
      { value: 'fix_immediately', label: { ru: 'Люблю сразу исправлять', en: 'I like to fix it right away' } },
    ],
  },
  {
    id: 'V_ATTN', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Сколько внимания держится комфортно?', en: 'How long does your focus hold comfortably?' },
    options: [
      { value: 'short', label: { ru: '3–5 минут', en: '3–5 minutes' } },
      { value: 'mid', label: { ru: '10–15 минут', en: '10–15 minutes' } },
      { value: 'long', label: { ru: '20+ минут', en: '20+ minutes' } },
    ],
  },
  {
    id: 'V_MODE', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Как тебе легче воспринимать?', en: 'What format lands easiest?' },
    options: [
      { value: 'video', label: { ru: 'Видео', en: 'Video' } },
      { value: 'audio', label: { ru: 'Короткое аудио', en: 'Short audio' } },
      { value: 'visual', label: { ru: 'Визуал, схемы', en: 'Visuals, diagrams' } },
      { value: 'dialogue', label: { ru: 'Диалоги', en: 'Dialogue' } },
      { value: 'game', label: { ru: 'Игра, квесты', en: 'Game, quests' } },
    ],
  },
  {
    id: 'V_ANCHOR', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Что помогает тебе не бросать?', en: 'What keeps you from quitting?' },
    options: [
      { value: 'support', label: { ru: 'Поддержка', en: 'Support' } },
      { value: 'topics', label: { ru: 'Интересные темы', en: 'Interesting topics' } },
      { value: 'quick_wins', label: { ru: 'Быстрые победы', en: 'Quick wins' } },
      { value: 'structure', label: { ru: 'Чёткая структура', en: 'Clear structure' } },
      { value: 'freedom', label: { ru: 'Свобода выбора', en: 'Freedom of choice' } },
    ],
  },
  {
    id: 'V_MBTI_SR', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Знаешь свой психотип (MBTI)?', en: 'Do you know your MBTI type?' },
    options: [
      { value: 'INTJ', label: { ru: 'INTJ', en: 'INTJ' } }, { value: 'INTP', label: { ru: 'INTP', en: 'INTP' } },
      { value: 'ENTJ', label: { ru: 'ENTJ', en: 'ENTJ' } }, { value: 'ENTP', label: { ru: 'ENTP', en: 'ENTP' } },
      { value: 'INFJ', label: { ru: 'INFJ', en: 'INFJ' } }, { value: 'INFP', label: { ru: 'INFP', en: 'INFP' } },
      { value: 'ENFJ', label: { ru: 'ENFJ', en: 'ENFJ' } }, { value: 'ENFP', label: { ru: 'ENFP', en: 'ENFP' } },
      { value: 'ISTJ', label: { ru: 'ISTJ', en: 'ISTJ' } }, { value: 'ISFJ', label: { ru: 'ISFJ', en: 'ISFJ' } },
      { value: 'ESTJ', label: { ru: 'ESTJ', en: 'ESTJ' } }, { value: 'ESFJ', label: { ru: 'ESFJ', en: 'ESFJ' } },
      { value: 'ISTP', label: { ru: 'ISTP', en: 'ISTP' } }, { value: 'ISFP', label: { ru: 'ISFP', en: 'ISFP' } },
      { value: 'ESTP', label: { ru: 'ESTP', en: 'ESTP' } }, { value: 'ESFP', label: { ru: 'ESFP', en: 'ESFP' } },
      { value: 'unknown', label: { ru: 'Не знаю / не уверен — подскажите', en: "Don't know / not sure — guide me" } },
    ],
  },
  {
    id: 'V_MBTI_EI', module: 'V', format: 'single', required: false,
    showIf: { questionId: 'V_MBTI_SR', equals: 'unknown' },
    prompt: { ru: 'После плотного дня тебя заряжает…', en: 'After a full day, you recharge by…' },
    options: [
      { value: 'E', label: { ru: 'Быть среди людей', en: 'Being around people' } },
      { value: 'I', label: { ru: 'Побыть одному', en: 'Being on your own' } },
    ],
  },
  {
    id: 'V_MBTI_SN', module: 'V', format: 'single', required: false,
    showIf: { questionId: 'V_MBTI_SR', equals: 'unknown' },
    prompt: { ru: 'Тебе ближе…', en: 'You lean toward…' },
    options: [
      { value: 'S', label: { ru: 'Конкретика и факты', en: 'Concrete facts' } },
      { value: 'N', label: { ru: 'Идеи и возможности', en: 'Ideas and possibilities' } },
    ],
  },
  {
    id: 'V_MBTI_TF', module: 'V', format: 'single', required: false,
    showIf: { questionId: 'V_MBTI_SR', equals: 'unknown' },
    prompt: { ru: 'Решая, ты опираешься на…', en: 'Deciding, you rely on…' },
    options: [
      { value: 'T', label: { ru: 'Логику', en: 'Logic' } },
      { value: 'F', label: { ru: 'Ценности и людей', en: 'Values and people' } },
    ],
  },
  {
    id: 'V_MBTI_JP', module: 'V', format: 'single', required: false,
    showIf: { questionId: 'V_MBTI_SR', equals: 'unknown' },
    prompt: { ru: 'Тебе комфортнее, когда…', en: "You're more comfortable when…" },
    options: [
      { value: 'J', label: { ru: 'Есть план', en: "There's a plan" } },
      { value: 'P', label: { ru: 'Всё открыто', en: 'Things stay open' } },
    ],
  },
  {
    id: 'V_SKIN', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Какой мир тебе ближе?', en: 'Which world feels closer?' },
    options: [
      { value: 'slavic-myth', label: { ru: 'Славянский миф', en: 'Slavic Myth' } },
      { value: 'dark-fantasy', label: { ru: 'Тёмное фэнтези', en: 'Dark Fantasy' } },
      { value: 'cyber-noir', label: { ru: 'Кибер-нуар', en: 'Cyber Noir' } },
      { value: 'space-opera', label: { ru: 'Космическая опера', en: 'Space Opera' } },
      { value: 'anime-quest', label: { ru: 'Аниме-квест', en: 'Anime Quest' } },
      { value: 'soviet-heroic', label: { ru: 'Советский героизм', en: 'Soviet Heroic' } },
      { value: 'mystic-arcane', label: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' } },
    ],
  },
  {
    id: 'V_OS', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Твоя основная ОС?', en: 'Your main OS?' },
    options: [
      { value: 'mac', label: { ru: 'macOS', en: 'macOS' } },
      { value: 'windows', label: { ru: 'Windows', en: 'Windows' } },
      { value: 'linux', label: { ru: 'Linux', en: 'Linux' } },
    ],
  },
  {
    id: 'V_DEEPEN', module: 'V', format: 'single', required: false,
    prompt: { ru: 'Хочешь точнее собрать персонажа?', en: 'Want to sharpen your character?' },
    options: [
      { value: 'yes', label: { ru: 'Да, ещё пару минут', en: 'Yes, a couple more minutes' } },
      { value: 'no', label: { ru: 'Нет, достаточно', en: 'No, this is enough' } },
    ],
  },
  // ── Optional depth battery (showIf V_DEEPEN == yes), one per attribute axis ──
  {
    id: 'VD_INT', module: 'VD', format: 'single', required: false,
    showIf: { questionId: 'V_DEEPEN', equals: 'yes' },
    prompt: { ru: 'Насколько ты сейчас на «ты» с ИИ-инструментами?', en: 'How comfortable are you with AI tools today?' },
    options: [
      { value: 'never', label: { ru: 'Почти не трогал', en: 'Barely touched them' } },
      { value: 'basic', label: { ru: 'Базово, по чуть-чуть', en: 'Basics, a little' } },
      { value: 'scripts', label: { ru: 'Уверенно, делаю своё', en: 'Confident, build my own' } },
      { value: 'comfortable', label: { ru: 'Очень свободно', en: 'Very fluent' } },
    ],
  },
  {
    id: 'VD_WIS', module: 'VD', format: 'single', required: false,
    showIf: { questionId: 'V_DEEPEN', equals: 'yes' },
    prompt: { ru: 'Узнав что-то новое, ты…', en: 'After learning something new, you…' },
    options: [
      { value: 'do_now', label: { ru: 'Сразу пробуешь руками', en: 'Try it hands-on right away' } },
      { value: 'teach', label: { ru: 'Объясняешь кому-то', en: 'Explain it to someone' } },
      { value: 'notes', label: { ru: 'Записываешь для себя', en: 'Write it down' } },
      { value: 'review', label: { ru: 'Возвращаешься позже', en: 'Come back to it later' } },
    ],
  },
  {
    id: 'VD_CON', module: 'VD', format: 'single', required: false,
    showIf: { questionId: 'V_DEEPEN', equals: 'yes' },
    prompt: { ru: 'Как долго ты обычно держишь новую привычку?', en: 'How long do you usually keep a new habit?' },
    options: [
      { value: 'lt_week', label: { ru: 'Меньше недели', en: 'Less than a week' } },
      { value: 'w1_4', label: { ru: '1–4 недели', en: '1–4 weeks' } },
      { value: 'm1_3', label: { ru: '1–3 месяца', en: '1–3 months' } },
      { value: 'm6_plus', label: { ru: 'Полгода и дольше', en: 'Six months or more' } },
    ],
  },
  {
    id: 'VD_DEX', module: 'VD', format: 'single', required: false,
    showIf: { questionId: 'V_DEEPEN', equals: 'yes' },
    prompt: { ru: 'Сколько часов в неделю реально есть на это?', en: 'Realistic hours per week for this?' },
    options: [
      { value: 'lt2h', label: { ru: 'Меньше 2', en: 'Under 2' } },
      { value: 'h2_5', label: { ru: '2–5', en: '2–5' } },
      { value: 'h5_plus', label: { ru: '5+', en: '5+' } },
    ],
  },
  {
    id: 'VD_STR', module: 'VD', format: 'single', required: false,
    showIf: { questionId: 'V_DEEPEN', equals: 'yes' },
    prompt: { ru: 'Ты работаешь один или с командой?', en: 'Solo or with a team?' },
    options: [
      { value: 'solo', label: { ru: 'Полностью один', en: 'Fully solo' } },
      { value: 'helpers', label: { ru: '1–2 помощника', en: '1–2 helpers' } },
      { value: 'small', label: { ru: 'Команда 3–10', en: 'Team of 3–10' } },
      { value: 'large', label: { ru: 'Крупная организация', en: 'Larger org' } },
    ],
  },
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/intake/questions.v2.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/types.ts web/lib/intake/questions.v2.ts web/lib/intake/questions.v2.test.ts
git commit -m "feat(intake): v2 instrument — sensory core + adaptive MBTI + optional depth"
```

### Task 3: Instrument router

**Files:**
- Create: `web/lib/intake/instrument.ts`
- Test: `web/lib/intake/instrument.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/intake/instrument.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getQuestions, getModuleIntros, requiredIds } from './instrument'

describe('instrument router', () => {
  it('returns the v1 bank for version 1', () => {
    expect(getQuestions(1).some(q => q.id === 'A1')).toBe(true)
    expect(getQuestions(1).some(q => q.id === 'V_WHY')).toBe(false)
  })
  it('returns the v2 bank for version 2', () => {
    expect(getQuestions(2).some(q => q.id === 'V_WHY')).toBe(true)
    expect(getQuestions(2).some(q => q.id === 'A1')).toBe(false)
  })
  it('requiredIds for v2 is empty (all optional)', () => {
    expect(requiredIds(2)).toEqual([])
  })
  it('requiredIds for v1 is non-empty', () => {
    expect(requiredIds(1).length).toBeGreaterThan(0)
  })
  it('module intros track the version', () => {
    expect(getModuleIntros(2).some(i => i.id === 'V')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `cd web && npx vitest run lib/intake/instrument.test.ts`
Expected: FAIL — cannot find module `./instrument`.

- [ ] **Step 3: Create the router** — `web/lib/intake/instrument.ts`:

```typescript
import { QUESTIONS, MODULE_INTROS } from './questions'
import { QUESTIONS_V2, MODULE_INTROS_V2 } from './questions.v2'
import type { InstrumentVersion, Question, ModuleIntro } from './types'

export function getQuestions(v: InstrumentVersion): Question[] {
  return v === 2 ? QUESTIONS_V2 : QUESTIONS
}
export function getModuleIntros(v: InstrumentVersion): ModuleIntro[] {
  return v === 2 ? MODULE_INTROS_V2 : MODULE_INTROS
}
export function requiredIds(v: InstrumentVersion): string[] {
  return getQuestions(v).filter(q => q.required).map(q => q.id)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/intake/instrument.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/instrument.ts web/lib/intake/instrument.test.ts
git commit -m "feat(intake): version-routed instrument selector"
```

---

## Phase 2 — MBTI + relational derivation

### Task 4: MBTI + relational style (pure)

**Files:**
- Create: `web/lib/intake/mbti.ts`
- Test: `web/lib/intake/mbti.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/intake/mbti.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { deriveMbti, relationalStyle } from './mbti'

describe('deriveMbti', () => {
  it('uses self-report when a real type is chosen', () => {
    expect(deriveMbti({ V_MBTI_SR: 'ENFP' })).toBe('ENFP')
  })
  it('assembles from the 4 axes when self-report is unknown', () => {
    expect(deriveMbti({ V_MBTI_SR: 'unknown', V_MBTI_EI: 'I', V_MBTI_SN: 'N', V_MBTI_TF: 'T', V_MBTI_JP: 'J' })).toBe('INTJ')
  })
  it('returns null when nothing usable', () => {
    expect(deriveMbti({})).toBeNull()
    expect(deriveMbti({ V_MBTI_SR: 'unknown' })).toBeNull()
  })
})

describe('relationalStyle', () => {
  it('captures rhythm / error / anchor / attention', () => {
    expect(relationalStyle({ V_RHYTHM: 'fuego', V_ERR: 'soft_feedback', V_ANCHOR: 'quick_wins', V_ATTN: 'short' }))
      .toEqual({ rhythm: 'fuego', errorStyle: 'soft_feedback', anchor: 'quick_wins', attention: 'short' })
  })
  it('nulls absent fields', () => {
    expect(relationalStyle({})).toEqual({ rhythm: null, errorStyle: null, anchor: null, attention: null })
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `cd web && npx vitest run lib/intake/mbti.test.ts`
Expected: FAIL — cannot find module `./mbti`.

- [ ] **Step 3: Implement** — `web/lib/intake/mbti.ts`:

```typescript
import type { Answers, MbtiType, RelationalStyle } from './types'

const SIXTEEN = new Set([
  'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP',
])

export function deriveMbti(a: Answers): MbtiType | null {
  const sr = a['V_MBTI_SR']
  if (typeof sr === 'string' && SIXTEEN.has(sr)) return sr
  const ei = a['V_MBTI_EI'], sn = a['V_MBTI_SN'], tf = a['V_MBTI_TF'], jp = a['V_MBTI_JP']
  if (typeof ei === 'string' && typeof sn === 'string' && typeof tf === 'string' && typeof jp === 'string') {
    const t = `${ei}${sn}${tf}${jp}`
    return SIXTEEN.has(t) ? t : null
  }
  return null
}

export function relationalStyle(a: Answers): RelationalStyle {
  const pick = <T extends string>(id: string): T | null => (typeof a[id] === 'string' ? (a[id] as T) : null)
  return {
    rhythm: pick<RelationalStyle['rhythm'] & string>('V_RHYTHM'),
    errorStyle: pick<RelationalStyle['errorStyle'] & string>('V_ERR'),
    anchor: pick<RelationalStyle['anchor'] & string>('V_ANCHOR'),
    attention: pick<RelationalStyle['attention'] & string>('V_ATTN'),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/intake/mbti.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/mbti.ts web/lib/intake/mbti.test.ts
git commit -m "feat(intake): MBTI derivation + relational style (pure)"
```

---

## Phase 3 — v2 scoring

### Task 5: v2 scoring

**Files:**
- Create: `web/lib/intake/scoring-v2.ts`
- Test: `web/lib/intake/scoring-v2.test.ts`

**Design:** `scoreProfileV2` returns the same `ScoreResult` shape. Direct maps: niche=`V_NICHE`, worldSkin=`V_SKIN` (source `'v2'`; fallback `'wanderer'`/`'wanderer-fallback'`), os=`V_OS`, cogTier from `V_ATTN` (short→1, mid→2, long→3, default 2). Attributes use small proxy weights from core, sharpened by the depth battery when present. `strLowConfidence = true` whenever the depth battery wasn't completed. Always sets `mbti` + `relationalStyle`. register `'adaptive'`; sheetLanguage from `locale`.

- [ ] **Step 1: Write the failing test** — `web/lib/intake/scoring-v2.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { scoreProfileV2 } from './scoring-v2'

const core = {
  V_WHY: 'project', V_HOOK: 'build', V_NICHE: 'coach', V_RHYTHM: 'fuego',
  V_ERR: 'calm', V_ATTN: 'mid', V_MODE: 'game', V_ANCHOR: 'quick_wins',
  V_SKIN: 'cyber-noir', V_OS: 'mac', V_MBTI_SR: 'ENFP',
}

describe('scoreProfileV2', () => {
  it('maps direct fields from the core', () => {
    const s = scoreProfileV2(core, 'ru')
    expect(s.niche).toBe('coach')
    expect(s.worldSkin).toBe('cyber-noir')
    expect(s.worldSkinSource).toBe('v2')
    expect(s.os).toBe('mac')
    expect(s.cogTier).toBe(2)
    expect(s.mbti).toBe('ENFP')
    expect(s.relationalStyle?.rhythm).toBe('fuego')
  })
  it('core-only is low confidence', () => {
    expect(scoreProfileV2(core, 'ru').strLowConfidence).toBe(true)
  })
  it('depth battery raises confidence and returns valid attributes', () => {
    const s = scoreProfileV2({ ...core, V_DEEPEN: 'yes', VD_INT: 'comfortable', VD_WIS: 'do_now', VD_CON: 'm6_plus', VD_DEX: 'h5_plus', VD_STR: 'small' }, 'ru')
    expect(s.strLowConfidence).toBe(false)
    for (const v of [s.int, s.wis, s.con, s.dex, s.cha, s.str]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(30)
    }
    expect(['artificer','mage','operator','healer','sovereign','wanderer']).toContain(s.charClass)
  })
  it('empty answers degrade gracefully', () => {
    const s = scoreProfileV2({}, 'en')
    expect(s.niche).toBeNull()
    expect(s.worldSkin).toBe('wanderer')
    expect(s.worldSkinSource).toBe('wanderer-fallback')
    expect(s.mbti).toBeNull()
    expect(s.sheetLanguage).toBe('en')
  })
})
```

- [ ] **Step 2: Run it to verify failure**

Run: `cd web && npx vitest run lib/intake/scoring-v2.test.ts`
Expected: FAIL — cannot find module `./scoring-v2`.

- [ ] **Step 3: Implement** — `web/lib/intake/scoring-v2.ts`:

```typescript
import { assignClass, type Attributes } from './scoring'
import { deriveMbti, relationalStyle } from './mbti'
import type { Answers, Locale, ScoreResult, WorldSkin } from './types'

const num = (a: Answers, id: string, table: Record<string, number>) => {
  const v = a[id]; return (typeof v === 'string' && table[v] != null) ? table[v] : 0
}

// Core proxy points (small, always available). 0..~10 raw per attribute before depth.
function coreAttributes(a: Answers): Attributes {
  const int = num(a, 'V_HOOK', { understand: 6, build: 5, order: 4, create: 3, talk: 2 })
  const wis = num(a, 'V_ANCHOR', { structure: 6, topics: 4, support: 3, quick_wins: 2, freedom: 3 })
  const con = num(a, 'V_RHYTHM', { ritual: 6, fuego: 4, suave: 3, libre: 2 })
  const dex = num(a, 'V_ATTN', { long: 6, mid: 4, short: 2 })
  const cha = num(a, 'V_NICHE', { content: 6, coach: 5, astrology: 5, massage: 4, service: 3, ecommerce: 3, tech: 1, other: 2 })
  const str = num(a, 'V_WHY', { money_time: 6, project: 5, edge: 4, community: 3, curiosity: 2 })
  return { int, wis, con, dex, cha, str }
}

// Depth points (sharper). Reuse v1-equivalent weight tables, keyed by VD_* ids.
function depthAttributes(a: Answers): Attributes {
  return {
    int: num(a, 'VD_INT', { never: 0, basic: 4, scripts: 8, comfortable: 12 }),
    wis: num(a, 'VD_WIS', { do_now: 8, teach: 6, notes: 4, review: 2 }),
    con: num(a, 'VD_CON', { lt_week: 1, w1_4: 4, m1_3: 7, m6_plus: 10 }),
    dex: num(a, 'VD_DEX', { lt2h: 2, h2_5: 6, h5_plus: 10 }),
    cha: 0,
    str: num(a, 'VD_STR', { solo: 2, helpers: 5, small: 8, large: 12 }),
  }
}

const RANGE = 30
const RAWMAX = { int: 18, wis: 16, con: 16, dex: 16, cha: 6, str: 18 } as const

export function scoreProfileV2(answers: Answers, locale: Locale): ScoreResult {
  const hasDepth = answers['V_DEEPEN'] === 'yes'
  const core = coreAttributes(answers)
  const depth = hasDepth ? depthAttributes(answers) : { int: 0, wis: 0, con: 0, dex: 0, cha: 0, str: 0 }
  const attrs = {} as Attributes
  ;(['int','wis','con','dex','cha','str'] as const).forEach(k => {
    const raw = core[k] + depth[k]
    attrs[k] = Math.min(RANGE, Math.round((raw / RAWMAX[k]) * RANGE))
  })

  const skinAns = answers['V_SKIN']
  const skin: WorldSkin = (typeof skinAns === 'string' ? skinAns : 'wanderer') as WorldSkin
  const cog = { short: 1, mid: 2, long: 3 }[answers['V_ATTN'] as string] ?? 2

  return {
    int: attrs.int, wis: attrs.wis, con: attrs.con, dex: attrs.dex, cha: attrs.cha, str: attrs.str,
    charClass: assignClass(attrs),
    charLevel: hasDepth ? num(answers, 'VD_INT', { never: 0, basic: 1, scripts: 2, comfortable: 3 }) : 0,
    worldSkin: skin,
    worldSkinSource: typeof skinAns === 'string' ? 'v2' : 'wanderer-fallback',
    cogTier: cog,
    register: 'adaptive',
    sheetLanguage: locale === 'en' ? 'en' : 'ru-tech',
    niche: (answers['V_NICHE'] as string) ?? null,
    os: (answers['V_OS'] as string) ?? null,
    strLowConfidence: !hasDepth,
    mbti: deriveMbti(answers),
    relationalStyle: relationalStyle(answers),
  }
}
```

(Note: `Attributes` and `assignClass` are already exported from `scoring.ts`. `assignClass` is exported; confirm `Attributes` is too — it is: `export interface Attributes`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/intake/scoring-v2.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/scoring-v2.ts web/lib/intake/scoring-v2.test.ts
git commit -m "feat(intake): v2 scoring — core proxies + optional depth, same ScoreResult"
```

---

## Phase 4 — Versioning infrastructure (D1 + worker)

### Task 6: Additive migration

**Files:**
- Create: `workers/migrations/0006_instrument_version.sql`

- [ ] **Step 1: Write the migration**

```sql
-- workers/migrations/0006_instrument_version.sql
-- Additive only. Existing rows default to v1 (frozen on the old instrument).
ALTER TABLE intake_profiles ADD COLUMN instrument_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE intake_profiles ADD COLUMN mbti TEXT;
ALTER TABLE intake_profiles ADD COLUMN relational_style TEXT;
```

- [ ] **Step 2: Apply to the remote D1** (per project memory: apply via `execute --file`, not `migrations apply`)

Run: `cd workers && npx wrangler d1 execute tochka-sborki-db --remote --file ./migrations/0006_instrument_version.sql`
Expected: 3 statements, success. (Coordinate with the user before running against prod.)

- [ ] **Step 3: Commit**

```bash
git add workers/migrations/0006_instrument_version.sql
git commit -m "feat(db): instrument_version + mbti + relational_style columns (additive)"
```

### Task 7: Version-routed worker handlers

**Files:**
- Modify: `workers/src/handlers/intake.ts`
- Modify: `workers/src/index.ts`
- Test: `workers/src/handlers/intake.test.ts`

- [ ] **Step 1: Add failing tests** — append to `workers/src/handlers/intake.test.ts`:

```typescript
import { handleProgress, handleSubmit } from './intake'

function fakeDbV2() {
  const rows: Record<string, any> = {}
  return {
    _rows: rows,
    prepare(sql: string) {
      const binds: any[] = []
      const stmt: any = {
        bind: (...a: any[]) => { binds.push(...a); return stmt },
        first: async () => rows['user1'] ?? null,
        run: async () => {
          if (sql.startsWith('INSERT INTO intake_profiles')) {
            const uid = binds[0]
            const prev = rows[uid] ?? {}
            // progress insert binds: (uid, version, answers, step, now, now)
            if (sql.includes('current_step, created_at')) {
              rows[uid] = { user_id: uid, instrument_version: prev.instrument_version ?? binds[1], answers: binds[2], current_step: binds[3] }
            }
          }
          return { success: true }
        },
      }
      return stmt
    },
  } as any
}

describe('versioning', () => {
  it('progress stamps version on first write and freezes it', async () => {
    const db = fakeDbV2()
    await handleProgress(db, 'user1', { answers: { V_WHY: 'project' }, currentStep: 1, instrumentVersion: 2 })
    expect(db._rows['user1'].instrument_version).toBe(2)
    // a later write claiming v1 must not flip it
    await handleProgress(db, 'user1', { answers: { V_WHY: 'project' }, currentStep: 2, instrumentVersion: 1 })
    expect(db._rows['user1'].instrument_version).toBe(2)
  })
  it('v2 submit accepts empty required and scores via v2', async () => {
    const db = fakeDbV2()
    db._rows['user1'] = { user_id: 'user1', instrument_version: 2, current_step: 5, answers: '{}' }
    const res = await handleSubmit(db, 'user1', { answers: { V_NICHE: 'coach', V_SKIN: 'cyber-noir' } }, 'key', vi.fn() as any)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd workers && npx vitest run src/handlers/intake.test.ts`
Expected: FAIL — `handleProgress` doesn't accept `instrumentVersion`; submit not version-aware.

- [ ] **Step 3: Rewrite the handler** — replace `workers/src/handlers/intake.ts` with:

```typescript
import { scoreProfile } from '../../../web/lib/intake/scoring'
import { scoreProfileV2 } from '../../../web/lib/intake/scoring-v2'
import { requiredIds } from '../../../web/lib/intake/instrument'
import { generateSheetProse, classifyFilmSkin } from '../lib/gemini'
import type { Answers, InstrumentVersion, Locale } from '../../../web/lib/intake/types'

export async function handleMe(db: D1Database, userId: string): Promise<Response> {
  const row = await db.prepare('SELECT * FROM intake_profiles WHERE user_id = ?').bind(userId).first()
  if (!row) return new Response(null, { status: 404 })
  return Response.json(row)
}

export async function handleProgress(
  db: D1Database,
  userId: string,
  body: { answers: Answers; currentStep: number; instrumentVersion?: InstrumentVersion },
): Promise<Response> {
  const now = Date.now()
  const version = body.instrumentVersion === 2 ? 2 : 1
  // instrument_version is set on first insert and NEVER updated on conflict — the version freezes.
  await db.prepare(
    `INSERT INTO intake_profiles (user_id, instrument_version, answers, current_step, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET answers=excluded.answers, current_step=excluded.current_step, updated_at=excluded.updated_at`,
  ).bind(userId, version, JSON.stringify(body.answers), body.currentStep, now, now).run()
  return Response.json({ ok: true })
}

export async function handleSubmit(
  db: D1Database,
  userId: string,
  body: { answers: Answers; locale?: Locale },
  geminiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const answers = body.answers ?? {}
  const existing = await db.prepare('SELECT instrument_version FROM intake_profiles WHERE user_id = ?').bind(userId).first<{ instrument_version: number }>()
  const version: InstrumentVersion = existing?.instrument_version === 2 ? 2 : 1
  const locale: Locale = body.locale === 'en' ? 'en' : 'ru'

  const missing = requiredIds(version).filter(id => answers[id] == null || answers[id] === '')
  if (missing.length) return Response.json({ error: 'missing_required', missing }, { status: 400 })

  const score = version === 2 ? scoreProfileV2(answers, locale) : scoreProfile(answers)
  if (score.worldSkinSource === 'g3' && typeof answers['G3'] === 'string') {
    score.worldSkin = (await classifyFilmSkin(answers['G3'] as string, geminiKey, fetchImpl)) as any
  }
  const prose = await generateSheetProse({
    charClass: score.charClass, worldSkin: score.worldSkin, language: score.sheetLanguage,
    register: score.register, niche: score.niche,
    attributes: { int: score.int, wis: score.wis, con: score.con, dex: score.dex, cha: score.cha, str: score.str },
    aspirational: (answers['G11'] ?? answers['V_OUTCOME']) as string,
    firstWin: (answers['A2'] ?? answers['V_OUTCOME']) as string,
    successDef: (answers['A10'] ?? answers['V_OUTCOME']) as string,
  }, geminiKey, fetchImpl)

  const now = Date.now()
  await db.prepare(
    `INSERT INTO intake_profiles
       (user_id, status, instrument_version, answers, current_step, int_score, wis_score, con_score, dex_score, cha_score, str_score,
        char_class, char_level, world_skin, cog_tier, register, sheet_language, niche, os, mbti, relational_style,
        legendary_title, backstory, first_quest, final_boss, prose_source, created_at, updated_at, completed_at)
     VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET status='completed', answers=excluded.answers,
        int_score=excluded.int_score, wis_score=excluded.wis_score, con_score=excluded.con_score,
        dex_score=excluded.dex_score, cha_score=excluded.cha_score, str_score=excluded.str_score,
        char_class=excluded.char_class, char_level=excluded.char_level, world_skin=excluded.world_skin,
        cog_tier=excluded.cog_tier, register=excluded.register, sheet_language=excluded.sheet_language,
        niche=excluded.niche, os=excluded.os, mbti=excluded.mbti, relational_style=excluded.relational_style,
        legendary_title=excluded.legendary_title, backstory=excluded.backstory, first_quest=excluded.first_quest,
        final_boss=excluded.final_boss, prose_source=excluded.prose_source, updated_at=excluded.updated_at, completed_at=excluded.completed_at`,
  ).bind(
    userId, version, JSON.stringify(answers), 0, score.int, score.wis, score.con, score.dex, score.cha, score.str,
    score.charClass, score.charLevel, score.worldSkin, score.cogTier, score.register, score.sheetLanguage,
    score.niche, score.os, score.mbti, score.relationalStyle ? JSON.stringify(score.relationalStyle) : null,
    prose.legendaryTitle, prose.backstory, prose.firstQuest, prose.finalBoss, prose.source, now, now, now,
  ).run()

  return Response.json({ ok: true, redirect: '/character' })
}
```

- [ ] **Step 4: Wire `instrumentVersion` + `locale` through the router** — in `workers/src/index.ts`:

  - progress branch: change the body type to `{ answers?: any; currentStep?: number; instrumentVersion?: number }` and the call to
    `handleProgress(env.DB, auth.sub, { answers: body.answers ?? {}, currentStep: body.currentStep ?? 0, instrumentVersion: body.instrumentVersion === 2 ? 2 : 1 })`.
  - submit branch: change the body type to `{ answers?: any; locale?: 'ru' | 'en' }` and the call to
    `handleSubmit(env.DB, auth.sub, { answers: body.answers ?? {}, locale: body.locale }, env.GEMINI_API_KEY)`.

- [ ] **Step 5: Run tests to verify pass**

Run: `cd workers && npx vitest run src/handlers/intake.test.ts`
Expected: PASS (existing tests + 2 new).

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/intake.ts workers/src/index.ts workers/src/handlers/intake.test.ts
git commit -m "feat(worker): version-routed intake — freeze version, v2 scoring, persist MBTI"
```

---

## Phase 5 — Client wizard routing

### Task 8: Wizard loads + routes by version

**Files:**
- Modify: `web/components/intake/intake-wizard.tsx`

- [ ] **Step 1: Replace the imports + data source** — change the top of `intake-wizard.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { getQuestions, getModuleIntros } from '@/lib/intake/instrument'
import { visibleQuestions } from '@/lib/intake/visible'
import { QuestionRenderer } from './question-renderer'
import type { Answers, AnswerValue, InstrumentVersion, Locale } from '@/lib/intake/types'
```

- [ ] **Step 2: Add version state + default new students to v2** — replace the state block + `me` effect:

```typescript
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [version, setVersion] = useState<InstrumentVersion>(2) // new students default to v2

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.instrument_version === 1) setVersion(1) // returning v1 student stays on v1
        if (d.answers) { setAnswers(JSON.parse(d.answers)); setStep(d.current_step ?? 0) }
      })
      .catch(() => {})
  }, [])

  const QUESTIONS = getQuestions(version)
  const MODULE_INTROS = getModuleIntros(version)
```

- [ ] **Step 3: Send the version on progress + locale on submit** — update `persist` and `finish`:

```typescript
  function persist(a: Answers, s: number) {
    fetch('/api/intake/progress', { method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: a, currentStep: s, instrumentVersion: version }) }).catch(() => {})
  }
```

In `finish`, change the submit body to include locale:

```typescript
    const res = await fetch('/api/intake/submit', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, locale }) })
```

- [ ] **Step 4: Verify build**

Run: `cd web && npm run build`
Expected: compiles; `/quest-intake` route generated.

- [ ] **Step 5: Commit**

```bash
git add web/components/intake/intake-wizard.tsx
git commit -m "feat(intake): wizard routes by instrument version, v2 default for new students"
```

---

## Phase 6 — Companion bonding

### Task 9: Feed MBTI + relational style into the companion prompt

**Files:**
- Modify: `web/lib/intake/learn-prompt.ts` (NOTE: file is at `web/lib/learn-prompt.ts`)
- Modify: `web/components/unit-wizard.tsx`
- Test: `web/lib/learn-prompt.test.ts`

- [ ] **Step 1: Add failing tests** — append to `web/lib/learn-prompt.test.ts`:

```typescript
  it('adds a bonding directive from MBTI + relational style', () => {
    const p = buildLearnPrompt({ ...base, mbti: 'INFP', relational: { rhythm: 'suave', errorStyle: 'soft_feedback', anchor: 'support', attention: 'short' } })
    expect(p).toContain('INFP')
    expect(p).toMatch(/мягк/i)        // soft feedback → gentle correction
    expect(p).toMatch(/корот|3–5|мелк/) // short attention → short turns
  })
  it('omits the bonding block entirely when absent', () => {
    const p = buildLearnPrompt(base)
    expect(p).not.toContain('MBTI')
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web && npx vitest run lib/learn-prompt.test.ts`
Expected: FAIL — `mbti`/`relational` not on the input type.

- [ ] **Step 3: Extend the prompt builder** — in `web/lib/learn-prompt.ts`:

  - Add to `LearnPromptInput`:
```typescript
  mbti?: import('./intake/mbti') extends never ? never : (string | null)
  relational?: import('./intake/types').RelationalStyle | null
```
  (Simpler: `mbti?: string | null` and `relational?: RelationalStyle | null` with a top `import type { RelationalStyle } from './intake/types'`.)

  - Build a bonding line (RU + EN) and insert it after the stage/mode line. Add this helper above `buildLearnPrompt`:

```typescript
function bondingLine(i: LearnPromptInput, ru: boolean): string {
  if (!i.mbti && !i.relational) return ''
  const r = i.relational
  const errMap = {
    ru: { soft_feedback: 'правь мягко', lose_motivation: 'береги мотивацию, хвали за попытку', calm: 'правь прямо, без смягчения', fix_immediately: 'давай сразу точную правку' },
    en: { soft_feedback: 'correct gently', lose_motivation: 'protect motivation, praise the attempt', calm: 'correct directly', fix_immediately: 'give the exact fix immediately' },
  }
  const attnMap = {
    ru: { short: 'короткими ходами по 3–5 минут', mid: 'блоками по 10–15 минут', long: 'можно длинными заходами' },
    en: { short: 'in short 3–5 minute turns', mid: 'in 10–15 minute blocks', long: 'longer stretches are fine' },
  }
  const parts: string[] = []
  if (i.mbti) parts.push(ru ? `мой психотип — ${i.mbti} (учитывай его в тоне и подаче)` : `my MBTI is ${i.mbti} (factor it into tone and delivery)`)
  if (r?.errorStyle) parts.push((ru ? errMap.ru : errMap.en)[r.errorStyle])
  if (r?.attention) parts.push((ru ? attnMap.ru : attnMap.en)[r.attention])
  if (!parts.length) return ''
  return (ru ? 'Под привязку: ' : 'For bonding: ') + parts.join('; ') + '.'
}
```

  Then in both the RU and EN `lines` arrays, add `bondingLine(i, ru)` (or `bondingLine(i, false)`) right after the `modeLine` entry.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd web && npx vitest run lib/learn-prompt.test.ts`
Expected: PASS (existing 5 + 2 new).

- [ ] **Step 5: Pass the data from unit-wizard** — in `web/components/unit-wizard.tsx`, where the profile is loaded and `buildLearnPrompt({...})` is called, add `mbti` + `relational` from the profile (the `/api/intake/me` row exposes `mbti` and `relational_style`; parse `relational_style` JSON). Add to the `buildLearnPrompt` argument object:

```typescript
        mbti: profile?.mbti ?? null,
        relational: profile?.relational_style ? JSON.parse(profile.relational_style) : null,
```

(Match the existing variable name the component uses for the loaded profile row; if it loads via a hook, thread `mbti` + `relational_style` through that hook's returned shape.)

- [ ] **Step 6: Verify build**

Run: `cd web && npm run build`
Expected: compiles.

- [ ] **Step 7: Commit**

```bash
git add web/lib/learn-prompt.ts web/lib/learn-prompt.test.ts web/components/unit-wizard.tsx
git commit -m "feat(companion): MBTI + relational bonding directive in learn prompt"
```

---

## Phase 7 — Charter reveal payoff

### Task 10: Generate + show the companion charter on submit

**Files:**
- Create: `web/lib/intake/charter.ts`
- Test: `web/lib/intake/charter.test.ts`
- Create: `web/components/intake/charter-reveal.tsx`
- Modify: `web/components/intake/intake-wizard.tsx` (show reveal before redirect on v2)

- [ ] **Step 1: Write the failing test** — `web/lib/intake/charter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildCompanionCharter } from './charter'

describe('buildCompanionCharter', () => {
  it('fills the 7 blocks from a v2 profile', () => {
    const c = buildCompanionCharter({
      locale: 'ru', skinName: 'Кибер-Нуар', mentorName: 'Фиксер', niche: 'coach',
      outcome: 'выйти на первых клиентов', mbti: 'INFP',
      relational: { rhythm: 'suave', errorStyle: 'soft_feedback', anchor: 'support', attention: 'short' },
    })
    expect(c).toContain('Identity')
    expect(c).toContain('Goal')
    expect(c).toContain('выйти на первых клиентов')
    expect(c).toContain('INFP')
  })
  it('degrades when fields are missing', () => {
    const c = buildCompanionCharter({ locale: 'en' })
    expect(c).toContain('Identity')
    expect(c).toContain('Goal')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web && npx vitest run lib/intake/charter.test.ts`
Expected: FAIL — cannot find module `./charter`.

- [ ] **Step 3: Implement** — `web/lib/intake/charter.ts`:

```typescript
import type { Locale, RelationalStyle } from './types'

export interface CharterInput {
  locale: Locale
  skinName?: string | null
  mentorName?: string | null
  niche?: string | null
  outcome?: string | null
  mbti?: string | null
  relational?: RelationalStyle | null
}

export function buildCompanionCharter(i: CharterInput): string {
  const ru = i.locale !== 'en'
  const id = i.mentorName ?? (ru ? 'твой со-мыслящий напарник' : 'your co-thinking partner')
  const world = i.skinName ? (ru ? ` из мира «${i.skinName}»` : ` from the world "${i.skinName}"`) : ''
  const tone = i.relational?.errorStyle === 'soft_feedback' || i.relational?.errorStyle === 'lose_motivation'
    ? (ru ? 'мягко, без давления' : 'gently, no pressure')
    : (ru ? 'прямо и по делу' : 'direct and to the point')
  const pace = i.relational?.attention === 'short' ? (ru ? 'короткими ходами' : 'in short turns') : (ru ? 'спокойным темпом' : 'at a steady pace')
  const goal = i.outcome ?? (ru ? 'двигать меня к моему результату' : 'move me toward my outcome')
  return [
    `# Agent Charter`,
    ``,
    `## Identity`,
    ru ? `${id}${world} — со-мыслящий напарник, не «сделай за меня».` : `${id}${world} — a co-thinking partner, not a "do-it-for-me".`,
    ``,
    `## Profile`,
    `- ${ru ? 'Сфера' : 'Field'}: ${i.niche ?? '—'}`,
    i.mbti ? `- MBTI: ${i.mbti}` : `- MBTI: —`,
    `- ${ru ? 'Ритм' : 'Rhythm'}: ${i.relational?.rhythm ?? '—'}`,
    ``,
    `## Principles`,
    ru ? `- Веди ${tone}; ошибка — это настройка.` : `- Guide ${tone}; a mistake is just tuning.`,
    ru ? `- Один фокус за ход, ${pace}.` : `- One focus per turn, ${pace}.`,
    ``,
    `## Use / Avoid`,
    ru ? `- Звать на со-мышление и разбор; не звать, чтобы писать за меня.` : `- Call for co-thinking and review; don't call to write for me.`,
    ``,
    `## Loop`,
    ru ? `1. спроси, где я сейчас → 2. предложи шаг → 3. оставь выбор за мной.` : `1. ask where I am → 2. offer a step → 3. leave the choice to me.`,
    ``,
    `## Laws`,
    ru ? `- Никогда не отнимай решение. Всегда держи мой голос.` : `- Never take the decision. Always keep my voice.`,
    ``,
    `## Goal`,
    ru ? `Помочь мне: ${goal}.` : `Help me: ${goal}.`,
  ].join('\n')
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd web && npx vitest run lib/intake/charter.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Create the reveal component** — `web/components/intake/charter-reveal.tsx`:

```typescript
'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/intake/types'

export function CharterReveal({ charter, locale, onContinue }: { charter: string; locale: Locale; onContinue: () => void }) {
  const [copied, setCopied] = useState(false)
  const t = locale === 'en'
    ? { title: 'Your companion charter', body: 'This is the charter your co-thinking partner runs on. Copy it into any agent — or just continue.', copy: 'Copy charter', copied: 'Copied ✓', go: 'Meet your character →' }
    : { title: 'Устав твоего напарника', body: 'Это устав, на котором работает твой со-мыслящий напарник. Скопируй его в любого агента — или просто продолжи.', copy: 'Скопировать устав', copied: 'Скопировано ✓', go: 'К твоему персонажу →' }
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.6rem' }}>{t.title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>{t.body}</p>
      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', overflowX: 'auto', fontSize: '.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{charter}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: '1.4rem', flexWrap: 'wrap' }}>
        <button className="intake-nav-btn" onClick={async () => { try { await navigator.clipboard.writeText(charter); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }}>{copied ? t.copied : t.copy}</button>
        <button className="intake-nav-btn primary" onClick={onContinue}>{t.go}</button>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Show the reveal on v2 finish** — in `intake-wizard.tsx`:

  - import: `import { CharterReveal } from './charter-reveal'` and `import { buildCompanionCharter } from '@/lib/intake/charter'`, plus the skin meta the file already uses elsewhere (`SKINS_META`) if available; otherwise pass `skinName`/`mentorName` from the chosen `V_SKIN` value.
  - add state: `const [charter, setCharter] = useState<string | null>(null)`
  - in `finish`, after a successful submit, for v2 build the charter and show it instead of redirecting immediately:

```typescript
    if (res.ok) {
      const { redirect } = await res.json()
      const go = () => window.location.replace(locale === 'en' ? '/en' + redirect : redirect)
      if (version === 2) {
        setCharter(buildCompanionCharter({
          locale,
          niche: answers['V_NICHE'] as string | undefined,
          outcome: answers['V_OUTCOME'] as string | undefined,
          mbti: null, // derived server-side; for the reveal, recompute client-side:
          relational: { rhythm: (answers['V_RHYTHM'] as any) ?? null, errorStyle: (answers['V_ERR'] as any) ?? null, anchor: (answers['V_ANCHOR'] as any) ?? null, attention: (answers['V_ATTN'] as any) ?? null },
        }))
        // hold redirect; CharterReveal's onContinue calls go()
        ;(window as any).__intakeGo = go
      } else go()
    } else setSubmitting(false)
```

  (For MBTI in the reveal, import `deriveMbti` from `@/lib/intake/mbti` and pass `mbti: deriveMbti(answers)`.)

  - at the top of the render, before the wizard `main`, short-circuit:

```typescript
  if (charter) return <CharterReveal charter={charter} locale={locale} onContinue={() => (window as any).__intakeGo?.()} />
```

- [ ] **Step 7: Verify build + full intake test sweep**

Run: `cd web && npx vitest run lib/intake && npm run build`
Expected: all intake tests pass; build compiles.

- [ ] **Step 8: Commit**

```bash
git add web/lib/intake/charter.ts web/lib/intake/charter.test.ts web/components/intake/charter-reveal.tsx web/components/intake/intake-wizard.tsx
git commit -m "feat(intake): v2 charter reveal payoff on finish"
```

---

## Phase 8 — Full verification

### Task 11: Cross-cutting checks

- [ ] **Step 1: Worker tests**

Run: `cd workers && npx vitest run`
Expected: all pass.

- [ ] **Step 2: Web tests + typecheck + build**

Run: `cd web && npx vitest run && npx tsc --noEmit && npm run build`
Expected: all green; `/quest-intake` generated.

- [ ] **Step 3: Manual smoke (local)** — note for the executor:
  - New session (no intake row) → wizard shows v2 (`Настройка поля`), ~12 visible questions, MBTI collapses to 1 when a type is chosen.
  - Simulate a v1 row (`instrument_version=1`, `current_step>0`) via local D1 → wizard shows v1 (Module A…), resumes at the saved step.
  - v2 finish → charter reveal → continue → `/character`.

- [ ] **Step 4: Push**

```bash
GIT_TERMINAL_PROMPT=0 git -c credential.helper='!gh auth git-credential' push origin main
```

---

## Self-Review notes (author)

- **Spec coverage:** §4 core → Task 2; §4.2 depth → Task 2 (VD_*) + Task 5 scoring; §5 MBTI→companion → Tasks 4, 9; §6 charter reveal → Task 10; §7 versioning → Tasks 1, 3, 6, 7, 8; §8 data model → Task 6; §10 testing → tasks throughout + Task 11.
- **Type consistency:** `scoreProfileV2(answers, locale)` signature is consistent across Tasks 5/7; `handleProgress(... instrumentVersion)` consistent Tasks 7/8; `RelationalStyle` shape consistent across types/mbti/scoring-v2/learn-prompt/charter.
- **Open follow-ups (not blocking):** `unit-wizard.tsx` profile-load shape (Task 9 Step 5) must match the component's existing fetch — executor confirms the variable name; demand-radar (`workers/src/handlers/demand.ts`) reads `F3`/`F2__other`, so add `V_OUTCOME`/`V_NICHE` as fallback sources in a later pass if v2 demand signals are wanted.
