# UI/UX: Niche Slot-Word Fix + Help System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a readable niche word instead of the raw F2 enum in every `{niche}` slot, and add a lightweight, mobile-first help system (tap-popover `HelpTip` × 9 + one-time re-openable `IntroCard` × 3) across the grown RPG interface.

**Architecture:** All client-side, static-export safe, no third-party tooltip/positioning library. Part 1 adds a `NICHE_SLOT` map and routes `{niche}` substitution through it in the existing `fillNicheSlots`. Part 2 adds pure `web/lib/help/*` (content + localStorage seen-state) and two presentational components, wired into the dashboard, unit wizard, and dungeon view.

**Tech Stack:** Next.js 16 App Router (`'use client'`), TypeScript, Vitest (pure logic only), localStorage.

**Spec:** `docs/superpowers/specs/2026-05-24-ui-ux-help-niche-design.md`

**Conventions:** `Bi = { ru: string; en: string }` from `@/lib/rpg/types`; `Locale` from `@/lib/intake/types`. Help copy lives in `web/lib/help/help-content.ts`. Run tests/typecheck from `web/`; full suite via `npx vitest run --no-file-parallelism` (pool-fork flakiness otherwise). `git add` repo-relative from repo root. Preserve Cyrillic exactly.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `web/lib/rpg/niche-map.ts` | (modify) add `NICHE_SLOT: Record<string, Bi>` |
| `web/lib/cs/applied-challenge.ts` | (modify) route `{niche}` through `NICHE_SLOT` in `fillNicheSlots` |
| `web/lib/cs/applied-challenge.test.ts` | (modify) update niche assertions to known enums |
| `web/lib/quests/build-daily.test.ts` | (modify) update niche assertions to known enums |
| `web/lib/help/types.ts` | `HelpEntry { title: Bi; body: Bi }` |
| `web/lib/help/help-content.ts` | `HELP_TIPS` (9) + `INTRO_CARDS` (3) |
| `web/lib/help/use-help-seen.ts` | localStorage `help_seen`; pure helpers + `useHelpSeen` hook |
| `web/components/help/help-tip.tsx` | `<HelpTip id locale align? />` tap-popover |
| `web/components/help/intro-card.tsx` | `<IntroCard page locale accent />` |
| `web/components/cs/mode-selector.tsx` | (modify) optional `helpId?` next to heading |
| `web/components/quests/daily-panel.tsx` | (modify) optional `helpId?` next to heading |
| `web/components/cs/vault.tsx` | (modify) optional `helpId?` next to title |
| `web/components/dungeon/dungeon-card.tsx` | (modify) optional `helpId?` next to title |
| `web/components/dungeon/dungeon-view.tsx` | (modify) IntroCard + `dungeon-stages` tip |
| `web/app/dashboard/dashboard-client.tsx` | (modify) IntroCard + tips (shards/character/world-map) + pass helpIds |
| `web/components/unit-wizard.tsx` | (modify) IntroCard + `wizard-phases` tip + ModeSelector helpId |

---

## Task 1: Niche slot-word fix

**Files:** Modify `web/lib/rpg/niche-map.ts`, `web/lib/cs/applied-challenge.ts`, `web/lib/cs/applied-challenge.test.ts`, `web/lib/quests/build-daily.test.ts`

- [ ] **Step 1: Update the failing tests first (TDD)**

Replace the entire contents of `web/lib/cs/applied-challenge.test.ts` with (niche assertions now expect the slot word for a known enum, fallback for unknown/null):

```ts
import { describe, it, expect } from 'vitest'
import { getAppliedChallenge, fillNicheSlots } from './applied-challenge'

const M = '04-prompt-engineering'

describe('getAppliedChallenge', () => {
  it('slot-fills {niche} with the niche word for the task tier', () => {
    const out = getAppliedChallenge({ niche: 'coach', outcome: null }, M, 'task', 'ru')
    expect(out).toContain('коучинге')
    expect(out).not.toContain('{niche}')
    expect(out).not.toContain('coach')
  })

  it('slot-fills {niche} for the process tier (en)', () => {
    const out = getAppliedChallenge({ niche: 'coach', outcome: null }, M, 'process', 'en')
    expect(out).toContain('coaching')
    expect(out).not.toContain('{niche}')
  })

  it('slot-fills {outcome} for the outcome tier when F3 is present', () => {
    const out = getAppliedChallenge(
      { niche: 'coach', outcome: 'cut review time in half' }, M, 'outcome', 'en',
    )
    expect(out).toContain('cut review time in half')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the niche-generic line (with niche word) when F3 outcome is empty', () => {
    const out = getAppliedChallenge({ niche: 'coach', outcome: '   ' }, M, 'outcome', 'en')
    expect(out).toContain('coaching')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the task framing when both niche and outcome are absent (outcome tier)', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'outcome', 'ru')
    const taskNoSlot = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'ru')
    expect(out).toBe(taskNoSlot)
  })

  it('uses the neutral niche word when niche is absent', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'en')
    expect(out).toContain('your field')
    expect(out).not.toContain('{niche}')
  })

  it('uses the neutral niche word for an unknown niche (e.g. "other")', () => {
    const out = getAppliedChallenge({ niche: 'other', outcome: null }, M, 'task', 'ru')
    expect(out).toContain('твоей сфере')
  })

  it('returns null for an unknown module', () => {
    expect(getAppliedChallenge({ niche: 'coach', outcome: 'y' }, 'no-such-module', 'task', 'ru')).toBeNull()
  })
})

describe('fillNicheSlots', () => {
  it('maps a known niche to its slot word and fills {outcome}', () => {
    expect(fillNicheSlots('do {niche} → {outcome}', 'coach', 'win', 'en')).toBe('do coaching → win')
  })
  it('falls back to the locale niche word for unknown/empty niche, and {outcome} to empty', () => {
    expect(fillNicheSlots('for {niche}: {outcome}', 'other', null, 'en')).toBe('for your field: ')
    expect(fillNicheSlots('для {niche}', null, null, 'ru')).toBe('для твоей сфере')
  })
})
```

In `web/lib/quests/build-daily.test.ts`: change the `base()` fixture default `niche: 'legal'` to `niche: 'coach'`; change the tier-2 practice assertion `expect(practice!.body).toContain('legal')` to `expect(practice!.body).toContain('коучинге')` (that test runs in `ru`); and change the EN practice test `base({ cogTier: 2, locale: 'en', niche: 'design' })` / `expect(practice!.body).toContain('design')` to `niche: 'coach'` / `expect(practice!.body).toContain('coaching')`. Leave all other assertions (retrieval mentor name, determinism, counts) unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts lib/quests/build-daily.test.ts`
Expected: FAIL (current `fillNicheSlots` echoes the raw enum / doesn't map to slot words).

- [ ] **Step 3: Add `NICHE_SLOT` to `web/lib/rpg/niche-map.ts`**

Append (add the `Bi` import at the top):

```ts
import type { Bi } from './types'

// niche (F2 value) -> readable slot word for {niche} substitution. Locative-optimized for the
// dominant "в {niche}" phrasing; `other`/unknown/null intentionally absent -> NICHE_FALLBACK.
export const NICHE_SLOT: Record<string, Bi> = {
  coach:     { ru: 'коучинге',   en: 'coaching' },
  massage:   { ru: 'массаже',    en: 'massage' },
  astrology: { ru: 'астрологии', en: 'astrology' },
  content:   { ru: 'контенте',   en: 'content' },
  ecommerce: { ru: 'e-commerce', en: 'e-commerce' },
  service:   { ru: 'услугах',    en: 'services' },
  tech:      { ru: 'разработке', en: 'tech' },
}
```

- [ ] **Step 4: Route `{niche}` through `NICHE_SLOT` in `web/lib/cs/applied-challenge.ts`**

Add the import and update `fillNicheSlots`. Add at the top (after the existing imports):

```ts
import { NICHE_SLOT } from '@/lib/rpg/niche-map'
```

Replace the `fillNicheSlots` function with:

```ts
// Shared {niche}/{outcome} slot-fill: {niche} → the niche's readable slot word (or the locale
// fallback word for unknown/absent niche); {outcome} → value or ''.
export function fillNicheSlots(text: string, niche: string | null, outcome: string | null, locale: Locale): string {
  const n = clean(niche)
  const o = clean(outcome)
  const nicheWord = (n && NICHE_SLOT[n]?.[locale]) ?? NICHE_FALLBACK[locale]
  return text.replace(/\{niche\}/g, nicheWord).replace(/\{outcome\}/g, o ?? '')
}
```

(`getAppliedChallenge` already delegates to `fillNicheSlots`, so it inherits the fix. Its internal `clean(profile.niche)` for tier branching is unchanged.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts lib/quests/build-daily.test.ts lib/dungeon/build-dungeon.test.ts`
Expected: PASS (dungeon tests unaffected — they assert outcome text + non-empty bodies, not raw niche).

- [ ] **Step 6: Typecheck + commit**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

```bash
git add web/lib/rpg/niche-map.ts web/lib/cs/applied-challenge.ts web/lib/cs/applied-challenge.test.ts web/lib/quests/build-daily.test.ts
git commit -m "fix(niche): render readable niche slot word instead of raw F2 enum"
```

---

## Task 2: Help content

**Files:** Create `web/lib/help/types.ts`, `web/lib/help/help-content.ts`; Test `web/lib/help/help-content.test.ts`

- [ ] **Step 1: Write the types**

```ts
// web/lib/help/types.ts
import type { Bi } from '@/lib/rpg/types'
export interface HelpEntry { title: Bi; body: Bi }
```

- [ ] **Step 2: Write the failing coverage test**

```ts
// web/lib/help/help-content.test.ts
import { describe, it, expect } from 'vitest'
import { HELP_TIPS, INTRO_CARDS } from './help-content'

const TIP_IDS = ['shards', 'character', 'world-map', 'daily', 'dungeon-card', 'vault', 'wizard-phases', 'wizard-modes', 'dungeon-stages']
const PAGE_IDS = ['dashboard', 'unit', 'dungeon']

describe('help-content', () => {
  it('defines all 9 referenced tip ids with both locales', () => {
    for (const id of TIP_IDS) {
      expect(HELP_TIPS[id], `missing tip "${id}"`).toBeTruthy()
      expect(HELP_TIPS[id].title.ru.length).toBeGreaterThan(0)
      expect(HELP_TIPS[id].title.en.length).toBeGreaterThan(0)
      expect(HELP_TIPS[id].body.ru.length).toBeGreaterThan(0)
      expect(HELP_TIPS[id].body.en.length).toBeGreaterThan(0)
    }
  })
  it('defines all 3 intro-card pages with both locales', () => {
    for (const p of PAGE_IDS) {
      expect(INTRO_CARDS[p], `missing intro "${p}"`).toBeTruthy()
      expect(INTRO_CARDS[p].title.ru.length).toBeGreaterThan(0)
      expect(INTRO_CARDS[p].body.en.length).toBeGreaterThan(0)
    }
  })
})
```

Run: `cd web && npx vitest run lib/help/help-content.test.ts` → FAIL (module not found).

- [ ] **Step 3: Write the content**

```ts
// web/lib/help/help-content.ts
import type { HelpEntry } from './types'

export const HELP_TIPS: Record<string, HelpEntry> = {
  shards: {
    title: { ru: 'Когнитивные шарды (💎)', en: 'Cognitive Shards (💎)' },
    body: { ru: 'Твой счёт и валюта. Зарабатывай, проходя юниты и задания; трать в Хранилище на новые миры.', en: 'Your score and your currency. Earn them by completing units and quests; spend them in the Vault on new worlds.' },
  },
  character: {
    title: { ru: 'Лист героя', en: 'Hero strip' },
    body: { ru: 'Твой легендарный титул, класс, уровень и сколько зон курса пройдено (X/9).', en: 'Your legendary title, class, level, and how many course zones you have cleared (X/9).' },
  },
  'world-map': {
    title: { ru: 'Карта мира', en: 'World map' },
    body: { ru: 'Курс как карта: каждый узел — зона. Текущая подсвечена, пройденные отмечены, заблокированные приглушены. Нажми на узел, чтобы перейти к нему.', en: 'The course as a map: each node is a zone. The current one is highlighted, cleared ones marked, locked ones dimmed. Tap a node to jump to it.' },
  },
  daily: {
    title: { ru: 'Сегодня', en: 'Today' },
    body: { ru: 'Ежедневные задания под твой запас времени: одно на продвижение по курсу плюс практика и повторение. Обновляются каждый день.', en: 'Daily quests sized to your time budget: one to advance the course plus practice and recall. They refresh each day.' },
  },
  'dungeon-card': {
    title: { ru: 'Подземелье ниши', en: 'Niche Dungeon' },
    body: { ru: 'Прикладной маршрут под твою нишу. Открывается, когда пройдёшь ключевой модуль своей ниши.', en: 'A hands-on arc tailored to your niche. It unlocks once you finish your niche\'s core module.' },
  },
  vault: {
    title: { ru: 'Хранилище', en: 'Vault' },
    body: { ru: 'Трать шарды, чтобы открыть альтернативные миры-темы. Твой стартовый мир — бесплатный.', en: 'Spend shards to unlock alternate world themes. Your starting world is free.' },
  },
  'wizard-phases': {
    title: { ru: 'Четыре фазы', en: 'Four phases' },
    body: { ru: 'Каждый юнит идёт по циклу: Активация → Рефлексия → Концепция → Практика. Больше всего шардов — за фазы размышления.', en: 'Each unit runs a loop: Activation → Reflection → Concept → Practice. The thinking phases pay the most shards.' },
  },
  'wizard-modes': {
    title: { ru: 'Режим прохождения', en: 'Your mode' },
    body: { ru: 'Командир / Со-пилот / Архимаг: чем меньше помощи берёшь, тем больше шардов. У Архимага подсказка наставника скрыта.', en: 'Commander / Co-Pilot / Archmage: the less help you take, the more shards you earn. On Archmage the mentor hint is hidden.' },
  },
  'dungeon-stages': {
    title: { ru: 'Этапы и босс', en: 'Stages & boss' },
    body: { ru: 'Этапы усложняются: задача → процесс → результат. Босс — синтез: собрать навык в реальный результат для своей ниши.', en: 'Stages escalate: task → process → outcome. The boss is a synthesis — combine the skill into a real result for your niche.' },
  },
}

export const INTRO_CARDS: Record<string, HelpEntry> = {
  dashboard: {
    title: { ru: 'Что это за страница?', en: 'What is this page?' },
    body: { ru: 'Это твой Квест-лог: карта курса, ежедневные задания, подземелье ниши и награды-шарды. Нажимай ⓘ рядом с элементами, чтобы понять, что есть что.', en: 'This is your Quest Log: the course map, daily quests, your niche dungeon, and shard rewards. Tap the ⓘ next to anything to learn what it is.' },
  },
  unit: {
    title: { ru: 'Как проходить юнит', en: 'How a unit works' },
    body: { ru: 'Юнит идёт по четырём фазам. Сначала выбери режим — сколько помощи брать; от него зависят шарды и подсказки. В конце ждёт прикладной вызов под твою нишу.', en: 'A unit runs in four phases. First pick a mode — how much help to take; it sets your shards and hints. At the end there is an applied challenge for your niche.' },
  },
  dungeon: {
    title: { ru: 'Подземелье ниши', en: 'The Niche Dungeon' },
    body: { ru: 'Маршрут из трёх усложняющихся этапов и босса — всё под твою нишу. Отмечай этапы по мере выполнения; за прохождение дают шарды.', en: 'A run of three escalating stages and a boss — all tailored to your niche. Mark stages as you go; clearing them earns shards.' },
  },
}
```

- [ ] **Step 4: Run → PASS** — `cd web && npx vitest run lib/help/help-content.test.ts` (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/help/types.ts web/lib/help/help-content.ts web/lib/help/help-content.test.ts
git commit -m "feat(help): add help-tip + intro-card content (9 tips, 3 cards)"
```

---

## Task 3: `useHelpSeen` (localStorage)

**Files:** Create `web/lib/help/use-help-seen.ts`; Test `web/lib/help/use-help-seen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/help/use-help-seen.test.ts
import { describe, it, expect } from 'vitest'
import { markSeen, isSeen } from './use-help-seen'

describe('markSeen / isSeen', () => {
  it('marks a page seen', () => {
    const m = markSeen({}, 'dashboard')
    expect(isSeen(m, 'dashboard')).toBe(true)
  })
  it('is idempotent and immutable', () => {
    const base = { dashboard: true }
    const next = markSeen(base, 'dashboard')
    expect(next).toEqual({ dashboard: true })
    expect(isSeen(base, 'unit')).toBe(false)
  })
  it('does not mutate the input', () => {
    const base: Record<string, boolean> = {}
    markSeen(base, 'unit')
    expect(base).toEqual({})
  })
})
```

Run: `cd web && npx vitest run lib/help/use-help-seen.test.ts` → FAIL.

- [ ] **Step 2: Write the implementation**

```ts
// web/lib/help/use-help-seen.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

export type SeenMap = Record<string, boolean>

const STORAGE_KEY = 'help_seen'

export function markSeen(map: SeenMap, page: string): SeenMap {
  if (map[page]) return map
  return { ...map, [page]: true }
}

export function isSeen(map: SeenMap, page: string): boolean {
  return map[page] === true
}

function readSeen(): SeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as SeenMap) : {}
  } catch {
    return {}
  }
}

function writeSeen(map: SeenMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function useHelpSeen(page: string) {
  const [map, setMap] = useState<SeenMap | null>(null)

  useEffect(() => {
    setMap(readSeen())
  }, [])

  const dismiss = useCallback(() => {
    setMap(prev => {
      const next = markSeen(prev ?? {}, page)
      writeSeen(next)
      return next
    })
  }, [page])

  return { seen: map ? isSeen(map, page) : false, dismiss, ready: map !== null }
}
```

- [ ] **Step 3: Run → PASS** (3 tests). 

- [ ] **Step 4: Commit**

```bash
git add web/lib/help/use-help-seen.ts web/lib/help/use-help-seen.test.ts
git commit -m "feat(help): add useHelpSeen localStorage hook"
```

---

## Task 4: `HelpTip` component

**Files:** Create `web/components/help/help-tip.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/help/help-tip.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import type { Locale } from '@/lib/intake/types'
import { HELP_TIPS } from '@/lib/help/help-content'

export function HelpTip({ id, locale, align = 'left' }: { id: string; locale: Locale; align?: 'left' | 'right' }) {
  const entry = HELP_TIPS[id]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!entry) return null

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={entry.title[locale]}
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          width: '1.1rem', height: '1.1rem', lineHeight: '1.1rem', padding: 0,
          borderRadius: '50%', border: '1px solid var(--border-color)', background: 'transparent',
          color: 'var(--text-secondary)', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-mono)',
        }}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={entry.title[locale]}
          style={{
            position: 'absolute', top: '1.5rem', [align === 'right' ? 'right' : 'left']: 0, zIndex: 30,
            width: 'min(260px, 72vw)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderRadius: 8, padding: '0.7rem 0.85rem', boxShadow: '0 6px 24px rgba(0,0,0,0.35)', textAlign: 'left',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-accent)', marginBottom: '0.3rem' }}>
            {entry.title[locale]}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {entry.body[locale]}
          </div>
        </div>
      )}
    </span>
  )
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/components/help/help-tip.tsx
git commit -m "feat(help): add tap-popover HelpTip component"
```

---

## Task 5: `IntroCard` component

**Files:** Create `web/components/help/intro-card.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/help/intro-card.tsx
'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/intake/types'
import { INTRO_CARDS } from '@/lib/help/help-content'
import { useHelpSeen } from '@/lib/help/use-help-seen'

const HELP_LABEL: Record<Locale, string> = { ru: 'Подсказка', en: 'Help' }
const CLOSE_LABEL: Record<Locale, string> = { ru: 'Скрыть', en: 'Dismiss' }

export function IntroCard({ page, locale, accent }: { page: string; locale: Locale; accent: string }) {
  const entry = INTRO_CARDS[page]
  const { seen, dismiss, ready } = useHelpSeen(page)
  const [manual, setManual] = useState<boolean | null>(null)

  if (!entry || !ready) return null

  const open = manual ?? !seen

  return (
    <div style={{ marginBottom: '1rem' }}>
      {!open && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            aria-label={HELP_LABEL[locale]}
            onClick={() => setManual(true)}
            style={{ width: '1.4rem', height: '1.4rem', borderRadius: '50%', border: `1px solid ${accent}`, background: 'transparent', color: accent, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          >
            <span aria-hidden="true">?</span>
          </button>
        </div>
      )}
      {open && (
        <section style={{ border: `1px solid ${accent}`, borderRadius: 12, padding: '1rem 1.1rem', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem' }}>
            <strong style={{ fontFamily: 'var(--font-mono)', color: accent }}>{entry.title[locale]}</strong>
            <button
              type="button"
              aria-label={CLOSE_LABEL[locale]}
              onClick={() => { setManual(false); if (!seen) dismiss() }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.4rem', lineHeight: 1.45 }}>
            {entry.body[locale]}
          </p>
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/components/help/intro-card.tsx
git commit -m "feat(help): add re-openable IntroCard component"
```

---

## Task 6: Add optional `helpId` to shared components

**Files:** Modify `web/components/cs/mode-selector.tsx`, `web/components/quests/daily-panel.tsx`, `web/components/cs/vault.tsx`, `web/components/dungeon/dungeon-card.tsx`

For each: READ the file, add `helpId?: string` to its `Props`, import `HelpTip`, and render `{helpId && <HelpTip id={helpId} locale={locale} />}` immediately after the component's title/heading text (each already has `locale` in scope).

- [ ] **Step 1: `mode-selector.tsx`** — add `helpId?: string` to the props type; import `import { HelpTip } from '@/components/help/help-tip'`. The heading is `<div …>{HEADING[locale]}</div>`. Wrap so the tip sits after the text — change that div's content to:
```tsx
        {HEADING[locale]} {helpId && <HelpTip id={helpId} locale={locale} />}
```

- [ ] **Step 2: `daily-panel.tsx`** — add `helpId?: string` to `Props`; import `HelpTip`. The heading span (line ~46) is `<span …><span aria-hidden="true">☀</span> {HEADING[locale]}</span>`. Change to:
```tsx
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: accent }}><span aria-hidden="true">☀</span> {HEADING[locale]} {helpId && <HelpTip id={helpId} locale={locale} />}</span>
```

- [ ] **Step 3: `vault.tsx`** — add `helpId?: string` to its `Props`; import `HelpTip`. The title (line ~29) is `<h2 …>{TITLE[locale]}</h2>`. Change to:
```tsx
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', marginBottom: '0.25rem' }}>{TITLE[locale]} {helpId && <HelpTip id={helpId} locale={locale} />}</h2>
```

- [ ] **Step 4: `dungeon-card.tsx`** — add `helpId?: string` to `Props`; import `HelpTip`. The title line (line ~34) is `<span aria-hidden="true">{view.locked ? '🔒' : '🗝'}</span> {view.dungeonName}`. Change to:
```tsx
          <span aria-hidden="true">{view.locked ? '🔒' : '🗝'}</span> {view.dungeonName} {helpId && <HelpTip id={helpId} locale={locale} />}
```

- [ ] **Step 5: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 6: Commit**

```bash
git add web/components/cs/mode-selector.tsx web/components/quests/daily-panel.tsx web/components/cs/vault.tsx web/components/dungeon/dungeon-card.tsx
git commit -m "feat(help): add optional helpId slot to mode-selector/daily/vault/dungeon-card"
```

---

## Task 7: Wire help into the dashboard

**Files:** Modify `web/app/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { HelpTip } from '@/components/help/help-tip'
import { IntroCard } from '@/components/help/intro-card'
```

- [ ] **Step 2: IntroCard at the top of `<main>`**

Immediately after `<main …>` opening tag (before the ShardBalance row), insert:
```tsx
        <IntroCard page="dashboard" locale={locale} accent={accent} />
```

- [ ] **Step 3: Shard balance tip**

The shard row is `<div style={{ display: 'flex', justifyContent: 'flex-end', … }}><ShardBalance accent={accent} /></div>`. Change its inner content to include the tip:
```tsx
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <ShardBalance accent={accent} />
          <HelpTip id="shards" locale={locale} align="right" />
        </div>
```

- [ ] **Step 4: Character + World Map tips**

Wrap CharacterStrip with a trailing tip and add a tip to the WorldMap wrapper. Replace the `<CharacterStrip … />` line with:
```tsx
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
          <div style={{ flex: 1 }}><CharacterStrip summary={vm.summary} accent={accent} locale={locale} /></div>
          <HelpTip id="character" locale={locale} align="right" />
        </div>
```
And change the WorldMap wrapper line to add a right-aligned tip above it:
```tsx
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}><HelpTip id="world-map" locale={locale} align="right" /></div>
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} nicheDungeonCleared={nicheDungeonCleared} />
        </div>
```

- [ ] **Step 5: Pass helpIds to DailyPanel / DungeonCard / Vault**

Add `helpId="daily"` to the `<DailyPanel …>` props, `helpId="dungeon-card"` to `<DungeonCard …>`, and `helpId="vault"` to `<Vault …>` (Vault currently receives `activeSkin` + `locale`; add `helpId="vault"`).

- [ ] **Step 6: Typecheck + build**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: PASS — `/dashboard` + `/en/dashboard` prerender.

- [ ] **Step 7: Commit**

```bash
git add web/app/dashboard/dashboard-client.tsx
git commit -m "feat(help): wire IntroCard + HelpTips into the dashboard"
```

---

## Task 8: Wire help into the Unit Wizard

**Files:** Modify `web/components/unit-wizard.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { HelpTip } from '@/components/help/help-tip'
import { IntroCard } from '@/components/help/intro-card'
```

- [ ] **Step 2: IntroCard near the breadcrumb**

READ the file. After the breadcrumb block's closing `</div>` (the one showing `{moduleTitle} · {t.unit(...)}`) and before the ModeSelector block, insert:
```tsx
      <IntroCard page="unit" locale={locale} accent={skin ? (SKINS_META[skin]?.accent ?? 'var(--text-accent)') : 'var(--text-accent)'} />
```
(Reuse the existing `accent` const if one is already derived at the top of the component — there is one from the SP3 work; use that instead of re-deriving.)

- [ ] **Step 3: `wizard-modes` tip via ModeSelector helpId**

The ModeSelector render (added in SP3) is `<ModeSelector locale={locale} accent={accent} selected={chosenMode} onSelect={...} />`. Add `helpId="wizard-modes"` to it.

- [ ] **Step 4: `wizard-phases` tip on the phase bar**

Find the phase progress bar block (the `<div style={{ display: 'flex', gap: '6px', marginBottom: '2rem' }}>` mapping `PHASE_LABELS`). Immediately before it, insert a right-aligned tip:
```tsx
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
        <HelpTip id="wizard-phases" locale={locale} align="right" />
      </div>
```

- [ ] **Step 5: Typecheck + build**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/components/unit-wizard.tsx
git commit -m "feat(help): wire IntroCard + phase/mode HelpTips into the Unit Wizard"
```

---

## Task 9: Wire help into the Dungeon view

**Files:** Modify `web/components/dungeon/dungeon-view.tsx`

- [ ] **Step 1: Add imports**

```tsx
import { HelpTip } from '@/components/help/help-tip'
import { IntroCard } from '@/components/help/intro-card'
```

- [ ] **Step 2: IntroCard + stages tip (unlocked branch only)**

In the unlocked-branch return (the `<section>` with the `<h1>` title), insert the IntroCard right after `<section>` opens, and add the `dungeon-stages` tip next to the `<h1>` title. Change the title `<h1>…</h1>` block region to:
```tsx
    <section>
      <IntroCard page="dungeon" locale={locale} accent={accent} />
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: accent, marginBottom: '0.4rem' }}>
        <span aria-hidden="true">🗝</span> {view.dungeonName} <HelpTip id="dungeon-stages" locale={locale} />
      </h1>
```
(Leave the locked-branch teaser unchanged — no tip/intro there.)

- [ ] **Step 3: Typecheck + build**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: PASS — `/dungeon` + `/en/dungeon` prerender.

- [ ] **Step 4: Commit**

```bash
git add web/components/dungeon/dungeon-view.tsx
git commit -m "feat(help): wire IntroCard + stages HelpTip into the Dungeon view"
```

---

## Task 10: Record follow-up + final verification

**Files:** Modify `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`

- [ ] **Step 1: Record the legendary-title follow-up + this UX slice**

Read the file. Add a dated **Current position** entry (near the others) noting: (a) shipped a UX slice — niche slot-word fix (`NICHE_SLOT`) + help system (HelpTip ×9 + IntroCard ×3), links to spec `./2026-05-24-ui-ux-help-niche-design.md` + plan `../plans/2026-05-24-ui-ux-help-niche.md`; (b) **OPEN FOLLOW-UP:** `legendary_title` embeds the raw skin slug (e.g. "«slavic-myth»") — needs a Worker intake-title generation fix + D1 backfill of existing `intake_profiles` rows. Match the existing prose format.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md
git commit -m "docs: record UX slice shipped + legendary_title leak follow-up"
```

- [ ] **Step 3: Final verification**

Run: `cd web && npx tsc --noEmit && npx vitest run --no-file-parallelism && npx next build`
Expected: tsc clean; all suites pass (existing + new `lib/help/*` + updated niche tests); build succeeds (`/dashboard`, `/en/dashboard`, `/dungeon`, `/en/dungeon`, lessons all prerender).

- [ ] **Step 4: Request code review** via superpowers:requesting-code-review against the spec.

---

## Self-Review notes (author)

- **Spec coverage:** Part 1 niche fix → Task 1 (`NICHE_SLOT` + `fillNicheSlots` + test ripple across applied-challenge + build-daily; dungeon tests verified unaffected). Part 2: content (Q5) → Task 2; seen-state (Q4 persistence) → Task 3; tap-popover HelpTip (Q1/Q2) → Task 4; re-openable IntroCard (Q4) → Task 5; helpId slots → Task 6; wiring (Q3 coverage: 9 tips across dashboard/wizard/dungeon + 3 intro cards) → Tasks 7,8,9. Follow-up record (Q6) → Task 10.
- **Tip-id coverage:** the 9 ids (`shards`,`character`,`world-map`,`daily`,`dungeon-card`,`vault`,`wizard-phases`,`wizard-modes`,`dungeon-stages`) are each defined in Task 2 and wired exactly once in Tasks 7–9; the 3 intro pages (`dashboard`,`unit`,`dungeon`) defined in Task 2, rendered in Tasks 7,8,9.
- **Type consistency:** `HelpEntry`, `HELP_TIPS`/`INTRO_CARDS`, `useHelpSeen`/`markSeen`/`isSeen`/`SeenMap`, `<HelpTip id locale align?>`, `<IntroCard page locale accent>`, `helpId?: string` prop — consistent across tasks. `NICHE_SLOT` keys are the 7 non-`other` niches; `other`/null → fallback (Task 1 tests assert both).
- **Open assumptions for executor:** (a) Tasks 8–9 — match the real current JSX around the breadcrumb / phase bar / dungeon `<h1>` (line numbers approximate); the unit wizard already has an `accent` const from SP3 — reuse it. (b) Vault's `Props` currently has `{ activeSkin, locale }` — add `helpId?`; it already destructures `locale`.
```
