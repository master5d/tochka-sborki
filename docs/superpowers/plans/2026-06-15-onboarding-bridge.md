# Онбординг-мост перед квест-логом — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вставить skin-aware онбординг-мост между «Уставом напарника» и квест-логом, чтобы нонгеймер не тонул в RPG-жаргоне (`fb_456c0742d840`).

**Architecture:** Вся текстовая/доменная логика моста — в чистом билдере `buildBridgeContent(skin, locale)` (тестируется в node-env). Презентационный `.tsx` рендерит его VM. Интеграция — новая стадия `bridge` в `intake-wizard`. RU+EN паритет. Без сервера и без localStorage (мост линеен, один раз по построению).

**Tech Stack:** Next.js 16, React, TypeScript, Vitest (env `node` — компоненты НЕ рендерятся в тестах, только pure-функции).

**Spec:** `docs/superpowers/specs/2026-06-15-onboarding-bridge-design.md`

**Рабочая директория для всех путей ниже:** `LMS/tochka-sborki/web/`
**Запуск тестов:** из `LMS/tochka-sborki/web/` → `npx vitest run <path>`

---

## Общий контракт (используется треками A и B — НЕ менять сигнатуры)

```ts
// lib/intake/onboarding-bridge-content.ts
import type { WorldSkin, Locale } from '@/lib/intake/types'

export interface BridgeGlossaryItem { icon: string; term: string; desc: string }
export interface BridgeContent {
  title: string
  decoder: string                 // из skinDecoder(skin, locale)
  glossary: BridgeGlossaryItem[]  // ровно 5 элементов
  reassurance: string
  enterLabel: string
}
export function buildBridgeContent(skin: WorldSkin, locale: Locale): BridgeContent
```

```ts
// lib/rpg/skins-meta.ts
export function skinDecoder(skin: WorldSkin, locale: Locale): string
```

---

## Track A (данные + чистая логика, TDD) — Tasks 1–2

### Task 1: decoder в SKINS_META + хелпер skinDecoder

**Files:**
- Modify: `lib/rpg/types.ts` (интерфейс `SkinMeta`)
- Modify: `lib/rpg/skins-meta.ts` (8 строк `decoder` + функция `skinDecoder`)
- Test: `lib/rpg/skins-meta.test.ts` (новый)

- [ ] **Step 1: Добавить поле `decoder` в тип `SkinMeta`**

В `lib/rpg/types.ts`, в интерфейсе `SkinMeta` (после `mentor?`):
```ts
  decoder?: Bi   // plain-language «что одевает твой мир» — для онбординг-моста
```

- [ ] **Step 2: Написать падающий тест**

Создать `lib/rpg/skins-meta.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { SKINS_META, skinDecoder } from './skins-meta'

const SKINS = Object.keys(SKINS_META) as (keyof typeof SKINS_META)[]

describe('skinDecoder', () => {
  it('возвращает непустую строку для каждого скина в обоих локалях', () => {
    for (const s of SKINS) {
      expect(skinDecoder(s, 'ru').length, `ru ${s}`).toBeGreaterThan(10)
      expect(skinDecoder(s, 'en').length, `en ${s}`).toBeGreaterThan(10)
    }
  })
  it('каждый из 8 скинов имеет явный decoder (не fallback)', () => {
    for (const s of SKINS) {
      expect(SKINS_META[s].decoder, `decoder ${s}`).toBeTruthy()
    }
  })
  it('даёт непустой fallback, если decoder отсутствует', () => {
    const meta = { ...SKINS_META['wanderer'], decoder: undefined }
    const orig = SKINS_META['wanderer'].decoder
    ;(SKINS_META as any)['wanderer'].decoder = undefined
    expect(skinDecoder('wanderer', 'ru').length).toBeGreaterThan(10)
    ;(SKINS_META as any)['wanderer'].decoder = orig
  })
})
```

- [ ] **Step 3: Запустить тест — убедиться, что падает**

Run: `npx vitest run lib/rpg/skins-meta.test.ts`
Expected: FAIL — `skinDecoder is not a function`.

- [ ] **Step 4: Добавить `decoder` каждому из 8 скинов**

В `lib/rpg/skins-meta.ts` добавить поле `decoder` в каждый объект (значения финальные, не placeholder):

```
'slavic-myth':   decoder: { ru: 'Твой мир — Славянский Миф: уроки звучат как сказ, наставник — Домовой, агенты — помощники у очага. Это лишь образ — под ним обычный курс.', en: "Your world is Slavic Myth: lessons sound like folk tales, your mentor is the House-Spirit, agents are hearth-helpers. It's just imagery — underneath is a normal course." }
'dark-fantasy':  decoder: { ru: 'Твой мир — Тёмное Фэнтези: модули — Искажённые Земли, навыки — Печати, наставник — Хранитель. Это лишь антураж — под ним обычный курс.', en: "Your world is Dark Fantasy: modules are Blighted Lands, skills are Seals, your mentor is the Keeper. It's just set dressing — underneath is a normal course." }
'cyber-noir':    decoder: { ru: 'Твой мир — Кибер-Нуар: локации — притоны и мастерские, наставник — Фиксер. Это лишь стиль — под ним обычный курс.', en: "Your world is Cyber Noir: locations are dens and workshops, your mentor is the Fixer. It's just style — underneath is a normal course." }
'space-opera':   decoder: { ru: 'Твой мир — Космическая Опера: тебя зовут кадетом, задания — миссии, ошибки — аномалии, наставник — Бортовой ИИ. Это лишь декорация — под ней обычный курс.', en: "Your world is Space Opera: you're the cadet, tasks are missions, mistakes are anomalies, your mentor is the Ship AI. It's just decoration — underneath is a normal course." }
'anime-quest':   decoder: { ru: 'Твой мир — Аниме-Квест: уроки — арки и битвы, наставник — Сэнсэй. Это лишь подача — под ней обычный курс.', en: "Your world is Anime Quest: lessons are arcs and battles, your mentor is the Sensei. It's just presentation — underneath is a normal course." }
'soviet-heroic': decoder: { ru: 'Твой мир — Советский Героизм: курс — производственный план, наставник — Бригадир. Это лишь стилистика — под ней обычный курс.', en: "Your world is Soviet Heroic: the course is a production plan, your mentor is the Foreman. It's just styling — underneath is a normal course." }
'mystic-arcane': decoder: { ru: 'Твой мир — Мистическая Аркана: навыки — руны и заклинания, наставник — Оракул. Это лишь образность — под ней обычный курс.', en: "Your world is Mystic Arcane: skills are runes and spells, your mentor is the Oracle. It's just imagery — underneath is a normal course." }
'wanderer':      decoder: { ru: 'Твой мир — Странник: спокойный нейтральный стиль, наставник — Проводник. Под ним — обычный курс, без лишней мишуры.', en: "Your world is Wanderer: a calm, neutral style, your mentor is the Guide. Underneath is a normal course, with no extra frills." }
```

- [ ] **Step 5: Добавить хелпер `skinDecoder` в конец `lib/rpg/skins-meta.ts`**

```ts
import type { Locale } from '@/lib/intake/types'

export function skinDecoder(skin: WorldSkin, locale: Locale): string {
  const meta = SKINS_META[skin]
  if (meta?.decoder) return meta.decoder[locale]
  // fallback для будущих скинов без явного decoder
  const name = meta?.displayName[locale] ?? skin
  const mentor = meta?.mentor?.name[locale]
  return locale === 'en'
    ? `Your world is ${name}: it's just styling — underneath is a normal course${mentor ? `; your mentor is ${mentor}` : ''}.`
    : `Твой мир — ${name}: это лишь оформление, под ним обычный курс${mentor ? `, наставник — ${mentor}` : ''}.`
}
```
(`WorldSkin` уже импортирован в файле; добавить импорт `Locale`, если его нет.)

- [ ] **Step 6: Запустить тест — убедиться, что проходит**

Run: `npx vitest run lib/rpg/skins-meta.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 7: Commit**

```bash
git add lib/rpg/types.ts lib/rpg/skins-meta.ts lib/rpg/skins-meta.test.ts
git commit -m "feat(rpg): skin decoder strings + skinDecoder helper (fb_456c0742d840)"
```

---

### Task 2: чистый билдер контента моста

**Files:**
- Create: `lib/intake/onboarding-bridge-content.ts`
- Test: `lib/intake/onboarding-bridge-content.test.ts`

- [ ] **Step 1: Написать падающий тест**

Создать `lib/intake/onboarding-bridge-content.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildBridgeContent } from './onboarding-bridge-content'
import { skinDecoder } from '@/lib/rpg/skins-meta'

describe('buildBridgeContent', () => {
  it('возвращает decoder выбранного скина', () => {
    const c = buildBridgeContent('space-opera', 'ru')
    expect(c.decoder).toBe(skinDecoder('space-opera', 'ru'))
    expect(c.decoder).toContain('кадет')
  })
  it('содержит ровно 5 терминов глоссария с непустыми desc', () => {
    const c = buildBridgeContent('wanderer', 'ru')
    expect(c.glossary).toHaveLength(5)
    for (const g of c.glossary) {
      expect(g.term.length).toBeGreaterThan(0)
      expect(g.desc.length).toBeGreaterThan(0)
      expect(g.icon.length).toBeGreaterThan(0)
    }
  })
  it('даёт непустые title/reassurance/enterLabel в обоих локалях', () => {
    for (const loc of ['ru', 'en'] as const) {
      const c = buildBridgeContent('anime-quest', loc)
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.reassurance.length).toBeGreaterThan(0)
      expect(c.enterLabel.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Запустить — убедиться, что падает**

Run: `npx vitest run lib/intake/onboarding-bridge-content.test.ts`
Expected: FAIL — модуль не найден.

- [ ] **Step 3: Реализовать билдер**

Создать `lib/intake/onboarding-bridge-content.ts`:
```ts
import type { WorldSkin, Locale } from '@/lib/intake/types'
import { skinDecoder } from '@/lib/rpg/skins-meta'
import { HELP_TIPS } from '@/lib/help/help-content'

export interface BridgeGlossaryItem { icon: string; term: string; desc: string }
export interface BridgeContent {
  title: string
  decoder: string
  glossary: BridgeGlossaryItem[]
  reassurance: string
  enterLabel: string
}

const T = {
  title:       { ru: 'Прежде чем войти', en: 'Before you enter' },
  reassurance: { ru: 'Ты проходишь курс. Игровая обёртка — чтобы было живее; её можно игнорировать.', en: "You're taking a course. The game wrapper is there to make it livelier — you can ignore it." },
  enter:       { ru: 'Понятно, войти →', en: 'Got it, enter →' },
  terms: {
    shards:    { ru: 'шарды', en: 'shards' },
    mode:      { ru: 'режим', en: 'mode' },
    map:       { ru: 'карта', en: 'map' },
    challenge: { ru: 'прикладной вызов', en: 'applied challenge' },
    dungeon:   { ru: 'подземелье', en: 'dungeon' },
  },
  challengeDesc: { ru: 'Практическое задание в конце юнита — под твою нишу и цель.', en: 'A hands-on task at the end of a unit — tailored to your niche and goal.' },
} as const

export function buildBridgeContent(skin: WorldSkin, locale: Locale): BridgeContent {
  const glossary: BridgeGlossaryItem[] = [
    { icon: '💎', term: T.terms.shards[locale],    desc: HELP_TIPS['shards'].body[locale] },
    { icon: '🎚', term: T.terms.mode[locale],      desc: HELP_TIPS['wizard-modes'].body[locale] },
    { icon: '🗺', term: T.terms.map[locale],       desc: HELP_TIPS['world-map'].body[locale] },
    { icon: '🎯', term: T.terms.challenge[locale], desc: T.challengeDesc[locale] },
    { icon: '🏛', term: T.terms.dungeon[locale],   desc: HELP_TIPS['dungeon-card'].body[locale] },
  ]
  return {
    title: T.title[locale],
    decoder: skinDecoder(skin, locale),
    glossary,
    reassurance: T.reassurance[locale],
    enterLabel: T.enter[locale],
  }
}
```

- [ ] **Step 4: Запустить — убедиться, что проходит**

Run: `npx vitest run lib/intake/onboarding-bridge-content.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Commit**

```bash
git add lib/intake/onboarding-bridge-content.ts lib/intake/onboarding-bridge-content.test.ts
git commit -m "feat(intake): pure buildBridgeContent для онбординг-моста (fb_456c0742d840)"
```

---

## Track B (презентация + интеграция) — Tasks 3–4

> Кодируется против контракта `buildBridgeContent` / `BridgeContent` выше. Компоненты в этом репо НЕ покрываются unit-тестами (vitest env `node`) — проверка через typecheck/build в Task 5.

### Task 3: презентационный компонент OnboardingBridge

**Files:**
- Create: `components/intake/onboarding-bridge.tsx`

- [ ] **Step 1: Создать компонент**

Создать `components/intake/onboarding-bridge.tsx` (эталон стиля — `components/intake/charter-reveal.tsx`: self-contained inline-стили, токены `var(--...)`, ранний возврат `<main>`):
```tsx
'use client'
import type { Locale, WorldSkin } from '@/lib/intake/types'
import { buildBridgeContent } from '@/lib/intake/onboarding-bridge-content'

export function OnboardingBridge({ skin, locale, onEnter }: { skin: WorldSkin; locale: Locale; onEnter: () => void }) {
  const c = buildBridgeContent(skin, locale)
  const btnPrimary: React.CSSProperties = {
    background: 'var(--text-accent)', color: 'var(--text-on-accent)',
    border: '1px solid var(--text-accent)', borderRadius: 8,
    padding: '12px 20px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
  }
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.8rem' }}>{c.title}</h1>
      <p style={{ color: 'var(--text-primary)', marginBottom: '1.4rem', lineHeight: 1.55 }}>{c.decoder}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.4rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
        {c.glossary.map((g) => (
          <li key={g.term} style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline' }}>
            <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{g.icon}</span>
            <span style={{ lineHeight: 1.5 }}>
              <strong>{g.term}</strong>
              <span style={{ color: 'var(--text-secondary)' }}> — {g.desc}</span>
            </span>
          </li>
        ))}
      </ul>
      <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: '1.4rem', lineHeight: 1.5 }}>{c.reassurance}</p>
      <button style={btnPrimary} onClick={onEnter}>{c.enterLabel}</button>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/intake/onboarding-bridge.tsx
git commit -m "feat(intake): OnboardingBridge презентационный компонент (fb_456c0742d840)"
```

### Task 4: интеграция стадии bridge в intake-wizard

**Files:**
- Modify: `components/intake/intake-wizard.tsx`

Текущее (строка ~92):
```tsx
if (charter) return <CharterReveal charter={charter} locale={locale} onContinue={() => { if (pendingHref) window.location.replace(pendingHref) }} />
```

- [ ] **Step 1: Добавить импорт и стадию**

В шапку импортов файла:
```tsx
import { OnboardingBridge } from './onboarding-bridge'
```
Рядом с другими `useState` (после `pendingHref`):
```tsx
const [showBridge, setShowBridge] = useState(false)
```

- [ ] **Step 2: Заменить ранний возврат на двухстадийный**

Заменить строку с `if (charter) return <CharterReveal ... />` на:
```tsx
if (charter && showBridge) {
  const skinKey = answers['V_SKIN'] as WorldSkin | undefined
  return <OnboardingBridge skin={skinKey ?? 'wanderer'} locale={locale} onEnter={() => { if (pendingHref) window.location.replace(pendingHref) }} />
}
if (charter) return <CharterReveal charter={charter} locale={locale} onContinue={() => setShowBridge(true)} />
```
(`WorldSkin` уже импортирован в файле — он используется в `setCharter`-блоке. Если нет — добавить в существующий импорт из `@/lib/intake/types`.)

- [ ] **Step 3: Commit**

```bash
git add components/intake/intake-wizard.tsx
git commit -m "feat(intake): стадия bridge после устава перед квест-логом (fb_456c0742d840)"
```

---

## Task 5: Интеграционная верификация (выполняет оркестратор после слияния треков)

**Files:** —

- [ ] **Step 1: Прогнать все затронутые тесты**

Run: `npx vitest run lib/rpg/skins-meta.test.ts lib/intake/onboarding-bridge-content.test.ts`
Expected: PASS (6 тестов).

- [ ] **Step 2: Typecheck/build (ловит ошибки компонента — unit-тестов на него нет)**

Run: `npx tsc --noEmit` (или `npm run build`, если tsc-скрипта нет)
Expected: без ошибок типов в `onboarding-bridge.tsx` и `intake-wizard.tsx`.

- [ ] **Step 3: Полный прогон тест-сьюта (нет регрессий)**

Run: `npx vitest run`
Expected: вся существующая сьюта зелёная.

- [ ] **Step 4: Write-back статуса тикета в done**

Из корня репо:
```bash
node feedback/scripts/fb.mjs status fb_456c0742d840 done
```

- [ ] **Step 5: Финальный commit (если write-back изменил jsonl/canvas)**

```bash
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): fb_456c0742d840 done — онбординг-мост"
```

---

## Параллельный запуск

Файлы треков **не пересекаются** → безопасно в одном рабочем дереве:
- **Track A** (Tasks 1–2): `lib/rpg/types.ts`, `lib/rpg/skins-meta.ts`(+test), `lib/intake/onboarding-bridge-content.ts`(+test)
- **Track B** (Tasks 3–4): `components/intake/onboarding-bridge.tsx`, `components/intake/intake-wizard.tsx`

Track B импортирует символы Track A (`buildBridgeContent`) — резолвится на интеграции (Task 5). Оркестратор сливает и гоняет Task 5.

## Самопроверка плана
- **Покрытие спеки:** decoder ×8 (T1) ✓ · skinDecoder fallback (T1) ✓ · pure-билдер + глоссарий 5 механик из HELP_TIPS (T2) ✓ · компонент (T3) ✓ · стадия bridge в wizard, V2-флоу (T4) ✓ · тесты (T1,T2,T5) ✓ · write-back done (T5) ✓.
- **Плейсхолдеров нет:** decoder-строки и весь код финальные.
- **Консистентность типов:** `buildBridgeContent(skin,locale): BridgeContent`, `skinDecoder(skin,locale): string`, `BridgeGlossaryItem{icon,term,desc}` — едины в T2/T3 и в контракте.
