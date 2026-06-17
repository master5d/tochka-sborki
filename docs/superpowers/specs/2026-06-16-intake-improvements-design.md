# Intake improvements — 3 живых тикета (V_OUTCOME, self-profile, multi-select)

**Тикеты:** `fb_adb8fed30580` (V_OUTCOME beginner), `fb_dd4e6e89c431` (self-profiling prompt), `fb_bb96d47cbe4d` (multi-select)
**Дата:** 2026-06-16
**Контекст:** 8 других intake-тикетов закрыты как resolved-by-V2-rewrite (вопросы удалены при переписывании). Эти 3 — реально применимы к текущему V2 (`lib/intake/questions.v2.ts`).

## Part A — V_OUTCOME beginner-friendly (fb_adb8fed30580)

60-day outcome-вопрос (`V_OUTCOME`, `format: 'text'`) жив и пугает новичка («с позиции чайника ответить нечего»). Он уже optional/skippable, но формулировка интимидирует.

- **`lib/intake/types.ts`** — в `Question` добавить опц. `placeholder?: { ru: string; en: string }`.
- **`components/intake/question-renderer.tsx`** — в ветке `format === 'text'` прокинуть `placeholder={q.placeholder?.[locale]}` в `<textarea>`.
- **`questions.v2.ts` → `V_OUTCOME`**:
  - prompt RU: `'Один результат от ИИ, который в ближайшие 60 дней принёс бы деньги или сэкономил время? Если пока не знаешь — пропусти, вернёмся к этому позже.'`
  - prompt EN: `'One AI outcome that would make you money or save time in the next 60 days? If you don\'t know yet, skip it — we\'ll come back to it.'`
  - placeholder RU: `'напр.: собрать лендинг · автоматизировать отчёты · писать посты быстрее'`
  - placeholder EN: `'e.g.: build a landing page · automate reports · write posts faster'`

## Part B — Self-profiling prompt (fb_dd4e6e89c431)

Ученик скармливает свой профиль своему ИИ → получает лингвистический/учебный профиль для гипериндивидуализации. **Copy-only** (вставляет в свой ИИ — без deep-link, без `?q=` лимита). Размещение — только `charter-reveal` (экран завершения анкеты).

- **`lib/intake/self-profile-prompt.ts`** (новый):
  ```ts
  import type { Locale } from './types'
  export function buildSelfProfilePrompt(charter: string, locale: Locale): string
  ```
  Оборачивает уже построенный companion-charter в запрос: «Вот мой профиль со-мышления: {charter}. На его основе собери мой **лингвистический и учебный профиль**: как со мной лучше объяснять, в каком темпе, через какие примеры; предложи гипериндивидуализированный путь освоения AI. Сначала задай 1–2 уточняющих вопроса.» (RU + EN).
- **`components/intake/charter-reveal.tsx`** — добавить третье действие рядом с «Скопировать устав»: кнопку **«Собрать мой профиль обучения с ИИ»** → копирует `buildSelfProfilePrompt(charter, locale)` в буфер (паттерн существующей copy-кнопки: `navigator.clipboard.writeText` + «Скопировано ✓»). `charter` уже есть в пропсах.
- **Тест** `lib/intake/self-profile-prompt.test.ts`: для ru/en — результат непустой, содержит переданный `charter`, содержит маркер запроса профиля (напр. «профиль» / «profile»), отличается по локали.

## Part C — Multi-select (fb_bb96d47cbe4d)

«Что из этого вам подходит — хочется несколько». Renderer `multi` **уже реализован** (`question-renderer.tsx`, чекбокс-toggle) — фронт не трогаем. Безопасно конвертировать только вопросы, что НЕ читаются как одиночная строка дальше:
- **V_HOOK** — потребляется только `scoring-v2` (`num→int`). ✅
- **V_MODE** — не потребляется нигде. ✅
- V_ANCHOR/V_RHYTHM/V_ERR — кормят `relationalStyle` как single → **оставить single**. V_NICHE/V_WHY → single (skin/niche/scoring как одиночные).

Изменения:
- **`questions.v2.ts`** — `V_HOOK` и `V_MODE`: `format: 'single'` → `format: 'multi'`.
- **`scoring-v2.ts` → `num()`** — принять массив: если значение — `string[]`, брать **max** из замапленных весов (multi-V_HOOK всё ещё даёт INT, без инфляции сверх RAWMAX; пустой массив → 0):
  ```ts
  const num = (a: Answers, id: string, table: Record<string, number>) => {
    const v = a[id]
    if (Array.isArray(v)) return v.reduce((m, k) => Math.max(m, table[k as string] ?? 0), 0)
    return (typeof v === 'string' && table[v] != null) ? table[v] : 0
  }
  ```
- **Тест** `scoring-v2.test.ts` (дополнить или новый): `num`/`scoreProfileV2` с `V_HOOK: ['understand','talk']` → INT берёт max (understand=6), не сумму; одиночный V_HOOK по-прежнему работает.

## Совместимость / стейт

- Multi-значения сохраняются как `string[]` (тип `AnswerValue` уже включает `string[]`). Визард персистит answers как есть (JSON) — массивы переживают сохранение/восстановление.
- `V_HOOK`/`V_MODE` нигде не читаются как `answers['V_HOOK'] as string` вне `num()` (проверено grep'ом) — конверсия безопасна.
- Charter consumption: charter строит из V_NICHE/V_OUTCOME/MBTI/relational — не из V_HOOK/V_MODE; Part C не влияет на charter/Part B.

## Тестирование

vitest (env node): `self-profile-prompt.test.ts` (Part B), `scoring-v2` multi (Part C). Part A (тип+placeholder+prompt) — покрывается tsc + полной сьютой (рендер — server build, content-видимое в ручном прогоне). Полная LMS-сьюta + `tsc --noEmit` зелёные.

## Вне scope
- Перевод V_ANCHOR/RHYTHM/ERR в multi (сломает relational single-consume).
- Deep-link для self-profile (copy-only достаточно).
- learn-with-AI на уроках (`fb_e60901c90115`).

## Критерий готовности
- V_OUTCOME: мягкий prompt + placeholder-пример + явный skip (RU+EN).
- charter-reveal: кнопка «Собрать профиль обучения с ИИ» копирует self-profile-промпт.
- V_HOOK/V_MODE: можно выбрать несколько; скоринг V_HOOK берёт max, не ломается.
- Все тесты + tsc зелёные. Bilingual.
