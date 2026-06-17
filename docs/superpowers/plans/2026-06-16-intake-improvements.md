# Intake improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** 3 живых intake-фикса — V_OUTCOME beginner-friendly, self-profile prompt на charter-reveal, multi-select для V_HOOK/V_MODE (`fb_adb8fed30580`, `fb_dd4e6e89c431`, `fb_bb96d47cbe4d`).

**Architecture:** Точечные правки V2-инструмента + scoring; новый pure-билдер self-profile; copy-кнопка на charter-reveal. Renderer `multi` уже готов.

**Spec:** `docs/superpowers/specs/2026-06-16-intake-improvements-design.md`
**Пути:** от `LMS/tochka-sborki/web/`. Тесты: `npx vitest run <path>`.

---

## Part A — Task 1: V_OUTCOME beginner-friendly

**Files:** Modify `lib/intake/types.ts`, `components/intake/question-renderer.tsx`, `lib/intake/questions.v2.ts`

- [ ] **Step 1:** в `lib/intake/types.ts` в интерфейс `Question` добавить поле (после `options?`):
```ts
  placeholder?: { ru: string; en: string }
```

- [ ] **Step 2:** в `components/intake/question-renderer.tsx`, в ветке `if (q.format === 'text')`, добавить в `<textarea>` проп:
```tsx
        placeholder={q.placeholder?.[locale]}
```
(рядом с `value=`/`onChange=`; `locale` уже в пропсах компонента.)

- [ ] **Step 3:** в `lib/intake/questions.v2.ts` заменить объект `V_OUTCOME` (id: 'V_OUTCOME') на:
```ts
  {
    id: 'V_OUTCOME', module: 'V', format: 'text', required: false,
    prompt: {
      ru: 'Один результат от ИИ, который в ближайшие 60 дней принёс бы деньги или сэкономил время? Если пока не знаешь — пропусти, вернёмся к этому позже.',
      en: "One AI outcome that would make you money or save time in the next 60 days? If you don't know yet, skip it — we'll come back to it.",
    },
    placeholder: {
      ru: 'напр.: собрать лендинг · автоматизировать отчёты · писать посты быстрее',
      en: 'e.g.: build a landing page · automate reports · write posts faster',
    },
  },
```

- [ ] **Step 4:** typecheck. Run: `npx tsc --noEmit` → rc 0.
- [ ] **Step 5: Commit**
```bash
git add LMS/tochka-sborki/web/lib/intake/types.ts LMS/tochka-sborki/web/components/intake/question-renderer.tsx LMS/tochka-sborki/web/lib/intake/questions.v2.ts
git commit -m "feat(intake): V_OUTCOME — мягкий prompt + placeholder + явный skip (fb_adb8fed30580)"
```

---

## Part C — Task 2: multi-select V_HOOK/V_MODE + scoring

**Files:** Modify `lib/intake/scoring-v2.ts`, `lib/intake/questions.v2.ts`; Create/extend `lib/intake/scoring-v2.test.ts`

- [ ] **Step 1:** в `lib/intake/scoring-v2.ts` заменить хелпер `num` (строки ~5-7):
```ts
const num = (a: Answers, id: string, table: Record<string, number>) => {
  const v = a[id]
  if (Array.isArray(v)) return v.reduce((m, k) => Math.max(m, table[k as string] ?? 0), 0)
  return (typeof v === 'string' && table[v] != null) ? table[v] : 0
}
```

- [ ] **Step 2:** в `lib/intake/questions.v2.ts` — у `V_HOOK` и `V_MODE` сменить `format: 'single'` → `format: 'multi'` (только эти два; строки с `id: 'V_HOOK'` и `id: 'V_MODE'`).

- [ ] **Step 3: Тест** — создать (или дополнить) `lib/intake/scoring-v2.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { scoreProfileV2 } from './scoring-v2'

describe('scoreProfileV2 multi-select V_HOOK', () => {
  it('берёт max замапленного веса по массиву (не сумму)', () => {
    const multi = scoreProfileV2({ V_HOOK: ['understand', 'talk'] }, 'ru')   // understand=6, talk=2
    const single = scoreProfileV2({ V_HOOK: 'understand' }, 'ru')             // 6
    expect(multi.int).toBe(single.int)
  })
  it('одиночный V_HOOK по-прежнему работает', () => {
    const r = scoreProfileV2({ V_HOOK: 'build' }, 'ru')
    expect(r.int).toBeGreaterThan(0)
  })
  it('пустой массив → нулевой вклад, не падает', () => {
    expect(() => scoreProfileV2({ V_HOOK: [] }, 'ru')).not.toThrow()
  })
})
```

- [ ] **Step 4:** Run: `npx vitest run lib/intake/scoring-v2.test.ts` → PASS.
- [ ] **Step 5: Commit**
```bash
git add LMS/tochka-sborki/web/lib/intake/scoring-v2.ts LMS/tochka-sborki/web/lib/intake/scoring-v2.test.ts LMS/tochka-sborki/web/lib/intake/questions.v2.ts
git commit -m "feat(intake): multi-select V_HOOK/V_MODE + num() max-по-массиву (fb_bb96d47cbe4d)"
```

---

## Part B — Task 3: self-profile prompt + charter-reveal кнопка

**Files:** Create `lib/intake/self-profile-prompt.ts`, `lib/intake/self-profile-prompt.test.ts`; Modify `components/intake/charter-reveal.tsx`

- [ ] **Step 1:** создать `lib/intake/self-profile-prompt.ts`:
```ts
import type { Locale } from './types'

/** Оборачивает companion-charter в запрос на лингвистический/учебный профиль. Copy-only. */
export function buildSelfProfilePrompt(charter: string, locale: Locale): string {
  if (locale === 'en') {
    return [
      'Here is my co-thinking profile:',
      '',
      charter,
      '',
      '---',
      'Based on this profile, build my **linguistic and learning profile**: how to best explain things to me, at what pace, through which kinds of examples and metaphors. Then propose a hyper-individualized path for learning AI tools tailored to me.',
      'Start by asking me 1–2 clarifying questions before you write the profile.',
    ].join('\n')
  }
  return [
    'Вот мой профиль со-мышления:',
    '',
    charter,
    '',
    '---',
    'На основе этого профиля собери мой **лингвистический и учебный профиль**: как со мной лучше объяснять, в каком темпе, через какие примеры и метафоры. Затем предложи гипериндивидуализированный путь освоения AI-инструментов под меня.',
    'Сначала задай мне 1–2 уточняющих вопроса, прежде чем писать профиль.',
  ].join('\n')
}
```

- [ ] **Step 2: Тест** `lib/intake/self-profile-prompt.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildSelfProfilePrompt } from './self-profile-prompt'

describe('buildSelfProfilePrompt', () => {
  const charter = '# Agent Charter\nField: coaching'
  it('встраивает charter и запрос профиля (ru)', () => {
    const p = buildSelfProfilePrompt(charter, 'ru')
    expect(p).toContain(charter)
    expect(p.toLowerCase()).toContain('профиль')
    expect(p.length).toBeGreaterThan(charter.length)
  })
  it('встраивает charter и запрос профиля (en)', () => {
    const p = buildSelfProfilePrompt(charter, 'en')
    expect(p).toContain(charter)
    expect(p.toLowerCase()).toContain('profile')
  })
  it('ru и en различаются', () => {
    expect(buildSelfProfilePrompt(charter, 'ru')).not.toBe(buildSelfProfilePrompt(charter, 'en'))
  })
})
```

- [ ] **Step 3:** Run: `npx vitest run lib/intake/self-profile-prompt.test.ts` → PASS (3).

- [ ] **Step 4:** в `components/intake/charter-reveal.tsx`:
  - (a) добавить импорт вверху:
```tsx
import { buildSelfProfilePrompt } from '@/lib/intake/self-profile-prompt'
```
  - (b) добавить второй state рядом с `const [copied, setCopied] = useState(false)`:
```tsx
  const [profileCopied, setProfileCopied] = useState(false)
```
  - (c) расширить объект `t` — в EN-ветку добавить `profile: 'Build my learning profile with AI', profileCopied: 'Copied ✓'`; в RU-ветку `profile: 'Собрать мой профиль обучения с ИИ', profileCopied: 'Скопировано ✓'`.
  - (d) в блоке кнопок (`<div style={{ display: 'flex', gap: 12, ... }}>`) добавить ПЕРЕД кнопкой `btnPrimary` (onContinue) новую кнопку:
```tsx
        <button style={btn} onClick={async () => { try { await navigator.clipboard.writeText(buildSelfProfilePrompt(charter, locale)); setProfileCopied(true); setTimeout(() => setProfileCopied(false), 2000) } catch {} }}>{profileCopied ? t.profileCopied : t.profile}</button>
```

- [ ] **Step 5:** typecheck. Run: `npx tsc --noEmit` → rc 0.
- [ ] **Step 6: Commit**
```bash
git add LMS/tochka-sborki/web/lib/intake/self-profile-prompt.ts LMS/tochka-sborki/web/lib/intake/self-profile-prompt.test.ts LMS/tochka-sborki/web/components/intake/charter-reveal.tsx
git commit -m "feat(intake): self-profile prompt + copy-кнопка на charter-reveal (fb_dd4e6e89c431)"
```

---

## Task 4: Верификация + write-back (оркестратор)

- [ ] **Step 1:** `npx vitest run lib/intake/scoring-v2.test.ts lib/intake/self-profile-prompt.test.ts` → PASS.
- [ ] **Step 2:** `npx vitest run` (вся LMS-сьюta) → зелёная.
- [ ] **Step 3:** `npx tsc --noEmit` → rc 0.
- [ ] **Step 4: Write-back** трёх тикетов:
```bash
node feedback/scripts/fb.mjs status fb_adb8fed30580 done
node feedback/scripts/fb.mjs status fb_dd4e6e89c431 done
node feedback/scripts/fb.mjs status fb_bb96d47cbe4d done
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): 3 intake improvements done (V_OUTCOME/self-profile/multi-select)"
```

## Самопроверка плана
- **Покрытие спеки:** A (placeholder тип+рендер+V_OUTCOME) T1 ✓ · C (num массив + V_HOOK/V_MODE multi + тест) T2 ✓ · B (билдер+тест+charter-reveal кнопка) T3 ✓ · verify+writeback T4 ✓.
- **Плейсхолдеров-нарушений нет:** тексты финальные (placeholder-поле — фича).
- **Консистентность:** `placeholder?:{ru,en}` (T1 тип) = использование в renderer/V_OUTCOME; `num` массив (T2) ↔ V_HOOK multi; `buildSelfProfilePrompt(charter,locale)` (T3) сигнатура = вызов в charter-reveal.
```
