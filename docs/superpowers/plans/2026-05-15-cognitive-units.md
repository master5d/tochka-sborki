# Cognitive Units — Implementation Plan (Plan 1: Infrastructure + M1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Реструктурировать LMS под модель Цикла Колба: meeting'и → папки с unit-файлами, каждый unit — 4-шаговый wizard (Активация→Рефлексия→Концепция→Практика), прогресс в localStorage, вложенная навигация в sidebar. Plan 1 строит всю инфраструктуру и мигрирует M1 (01-introduction) как proof of concept.

**Architecture:** Новый роут `[slug]/[unit]/page.tsx` рядом с существующим `[slug]/page.tsx`. `content.ts` получает функции для чтения папочной структуры (`_meta.json` + unit MDX). `UnitWizard` (client) предоставляет `UnitWizardContext`, `Phase` (client) читает контекст и показывает себя только на нужном шаге. Unit-прогресс — отдельный localStorage-ключ `unit_progress`, параллельный существующему API-based progress.

**Tech Stack:** Next.js 16 App Router, `next-mdx-remote/rsc`, TypeScript, Vitest, localStorage.

---

## File Map

| Действие | Файл | Ответственность |
|----------|------|----------------|
| Изменить | `web/lib/content.ts` | Новые типы и функции для meetings/units |
| Изменить | `web/lib/content.test.ts` | Тесты для новых функций |
| Создать | `web/lib/unit-progress.ts` | localStorage hook для unit-прогресса |
| Создать | `web/components/unit-wizard-context.tsx` | React context для текущего шага |
| Создать | `web/components/phase.tsx` | Фаза Колба: читает context, show/hide |
| Создать | `web/components/unit-wizard.tsx` | Wizard: прогресс-бар, Далее, Отметить |
| Создать | `web/components/meeting-redirect.tsx` | Client redirect на первый незавершённый unit |
| Изменить | `web/components/mdx-components.tsx` | Зарегистрировать Phase |
| Изменить | `web/components/sidebar.tsx` | Поддержка NavigationItem + unit sub-items |
| Изменить | `web/components/lesson-layout.tsx` | Передавать navItems вместо lessons |
| Изменить | `web/app/lessons/[slug]/page.tsx` | Обнаруживать meeting → MeetingRedirect |
| Создать | `web/app/lessons/[slug]/[unit]/page.tsx` | Unit-страница с UnitWizard |
| Создать | `web/content/ru/01-introduction/_meta.json` | Метаданные + порядок unit'ов M1 |
| Создать | `web/content/ru/01-introduction/u1-activation.mdx` | Unit 1: Твой опыт с AI |
| Создать | `web/content/ru/01-introduction/u2-four-shifts.mdx` | Unit 2: Четыре сдвига |
| Создать | `web/content/ru/01-introduction/u3-clones.mdx` | Unit 3: Пять клонов |
| Создать | `web/content/ru/01-introduction/u4-practice.mdx` | Unit 4: Первый промпт |
| Удалить | `web/content/ru/01-introduction.mdx` | Заменён папкой |

---

## Task 1: content.ts — новые типы и базовые функции

**Files:**
- Modify: `web/lib/content.ts`

- [ ] **Step 1: Добавить новые типы и isMeeting в content.ts**

Открой `web/lib/content.ts`. После строки `export interface PageMeta` добавь:

```typescript
export interface UnitMeta {
  slug: string
  title: string
  unit: number
  meeting: number
  duration: string
}

export interface MeetingMeta {
  slug: string
  meeting: number
  title: string
  description: string
  duration: string
  level: number
  units: { slug: string; title: string }[]
}

export interface NavigationItem {
  slug: string
  title: string
  level: number
  type: 'lesson' | 'meeting'
  order: number
  units?: { slug: string; title: string }[]
}
```

- [ ] **Step 2: Добавить isMeeting, getMeetingMeta, getUnitContent**

После `getPageContent` добавь:

```typescript
export function isMeeting(slug: string, locale = 'ru'): boolean {
  const dirPath = path.join(contentDir(locale), slug)
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch {
    return false
  }
}

export function getMeetingMeta(slug: string, locale = 'ru'): MeetingMeta {
  const metaPath = path.join(contentDir(locale), slug, '_meta.json')
  if (!fs.existsSync(metaPath)) throw new Error(`Meeting not found: ${slug}`)
  const raw = fs.readFileSync(metaPath, 'utf8')
  return { slug, ...JSON.parse(raw) } as MeetingMeta
}

export function getUnitContent(
  meetingSlug: string,
  unitSlug: string,
  locale = 'ru'
): { unitMeta: UnitMeta; content: string } {
  const filepath = path.join(contentDir(locale), meetingSlug, `${unitSlug}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Unit not found: ${meetingSlug}/${unitSlug}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { unitMeta: { slug: unitSlug, ...data } as UnitMeta, content }
}
```

- [ ] **Step 3: Добавить getAllMeetings и getNavigationItems**

```typescript
export function getAllMeetings(locale = 'ru'): MeetingMeta[] {
  const dir = contentDir(locale)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries
    .filter(e => e.isDirectory() && /^\d{2}-/.test(e.name))
    .map(e => getMeetingMeta(e.name, locale))
    .sort((a, b) => a.meeting - b.meeting)
}

export function getNavigationItems(locale = 'ru'): NavigationItem[] {
  const dir = contentDir(locale)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const items: NavigationItem[] = []

  for (const entry of entries) {
    if (entry.isDirectory() && /^\d{2}-/.test(entry.name)) {
      const meta = getMeetingMeta(entry.name, locale)
      items.push({
        slug: entry.name,
        title: meta.title,
        level: meta.level,
        order: meta.meeting,
        type: 'meeting',
        units: meta.units,
      })
    } else if (entry.isFile() && entry.name.endsWith('.mdx') && /^\d{2}-/.test(entry.name)) {
      const slug = entry.name.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(dir, entry.name), 'utf8')
      const { data } = matter(raw)
      items.push({
        slug,
        title: data.title as string,
        level: (data.level as number) ?? 0,
        order: (data.order as number) ?? 0,
        type: 'lesson',
      })
    }
  }

  return items.sort((a, b) => a.order - b.order)
}
```

- [ ] **Step 4: Убедиться что файл компилируется**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 5: Commit**

```bash
git add web/lib/content.ts
git commit -m "feat: add meeting/unit content functions to content.ts"
```

---

## Task 2: content.test.ts — тесты для новых функций

**Files:**
- Modify: `web/lib/content.test.ts`

> Примечание: тесты `getAllLessons` пока не трогаем — `01-introduction.mdx` ещё существует, они будут проходить. Мы обновим их в Task 13 после удаления файла.

- [ ] **Step 1: Написать failing тесты для getMeetingMeta и getUnitContent**

Добавь в конец `web/lib/content.test.ts`:

```typescript
describe('isMeeting', () => {
  it('returns false for flat lesson slug', () => {
    const { isMeeting } = require('./content')
    expect(isMeeting('cheatsheet')).toBe(false)
  })
})

describe('getMeetingMeta', () => {
  it('throws for unknown meeting', () => {
    const { getMeetingMeta } = require('./content')
    expect(() => getMeetingMeta('99-nonexistent')).toThrow()
  })
})

describe('getNavigationItems', () => {
  it('returns array of NavigationItem', () => {
    const { getNavigationItems } = require('./content')
    const items = getNavigationItems()
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(['lesson', 'meeting']).toContain(item.type)
      expect(typeof item.slug).toBe('string')
      expect(typeof item.title).toBe('string')
    }
  })

  it('items are sorted by order', () => {
    const { getNavigationItems } = require('./content')
    const items = getNavigationItems()
    for (let i = 1; i < items.length; i++) {
      expect(items[i].order).toBeGreaterThanOrEqual(items[i - 1].order)
    }
  })
})
```

- [ ] **Step 2: Запустить тесты — убедиться что failing тесты корректно падают**

```bash
cd web && npx vitest run lib/content.test.ts
```

Ожидаем: `isMeeting('cheatsheet') returns false` — FAIL (функция ещё не видна через require, но TypeScript импорты работают). Переключи `require` на `import` в тестах — тесты используют vitest с ESM.

Исправь тесты — убери `require`, используй top-level import (добавь в существующий import):

```typescript
import { describe, it, expect } from 'vitest'
import {
  getAllLessons, getLessonBySlug, getPageContent,
  isMeeting, getMeetingMeta, getNavigationItems, getUnitContent
} from './content'
```

И перепиши тесты без `require`:

```typescript
describe('isMeeting', () => {
  it('returns false for flat lesson slug', () => {
    expect(isMeeting('cheatsheet')).toBe(false)
  })
})

describe('getMeetingMeta', () => {
  it('throws for unknown meeting', () => {
    expect(() => getMeetingMeta('99-nonexistent')).toThrow()
  })
})

describe('getNavigationItems', () => {
  it('returns array of NavigationItem', () => {
    const items = getNavigationItems()
    expect(Array.isArray(items)).toBe(true)
    for (const item of items) {
      expect(['lesson', 'meeting']).toContain(item.type)
      expect(typeof item.slug).toBe('string')
      expect(typeof item.title).toBe('string')
    }
  })

  it('items are sorted by order', () => {
    const items = getNavigationItems()
    for (let i = 1; i < items.length; i++) {
      expect(items[i].order).toBeGreaterThanOrEqual(items[i - 1].order)
    }
  })
})
```

- [ ] **Step 3: Запустить тесты — убедиться что они проходят**

```bash
cd web && npx vitest run lib/content.test.ts
```

Ожидаем: все тесты PASS (включая старые 7 + новые 4 = 11 total).

- [ ] **Step 4: Commit**

```bash
git add web/lib/content.test.ts
git commit -m "test: add tests for meeting/unit content functions"
```

---

## Task 3: lib/unit-progress.ts — localStorage hook

**Files:**
- Create: `web/lib/unit-progress.ts`

- [ ] **Step 1: Создать файл**

```typescript
// web/lib/unit-progress.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

type UnitProgressMap = Record<string, Record<string, boolean>>

const STORAGE_KEY = 'unit_progress'

function readProgress(): UnitProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UnitProgressMap) : {}
  } catch {
    return {}
  }
}

function writeProgress(map: UnitProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function useUnitProgress() {
  const [progress, setProgress] = useState<UnitProgressMap>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setProgress(readProgress())
    setReady(true)
  }, [])

  const isCompleted = useCallback(
    (meetingSlug: string, unitSlug: string): boolean =>
      progress[meetingSlug]?.[unitSlug] === true,
    [progress]
  )

  const markCompleted = useCallback((meetingSlug: string, unitSlug: string) => {
    setProgress(prev => {
      const next: UnitProgressMap = {
        ...prev,
        [meetingSlug]: { ...(prev[meetingSlug] ?? {}), [unitSlug]: true },
      }
      writeProgress(next)
      return next
    })
  }, [])

  return { isCompleted, markCompleted, ready }
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add web/lib/unit-progress.ts
git commit -m "feat: add useUnitProgress localStorage hook"
```

---

## Task 4: UnitWizardContext + Phase component

**Files:**
- Create: `web/components/unit-wizard-context.tsx`
- Create: `web/components/phase.tsx`

- [ ] **Step 1: Создать unit-wizard-context.tsx**

```typescript
// web/components/unit-wizard-context.tsx
'use client'

import { createContext, useContext } from 'react'

interface UnitWizardContextValue {
  currentStep: number
  totalSteps: number
}

export const UnitWizardContext = createContext<UnitWizardContextValue>({
  currentStep: 0,
  totalSteps: 4,
})

export function useUnitWizard(): UnitWizardContextValue {
  return useContext(UnitWizardContext)
}
```

- [ ] **Step 2: Создать phase.tsx**

```typescript
// web/components/phase.tsx
'use client'

import { useUnitWizard } from './unit-wizard-context'

const PHASE_ORDER = ['activation', 'reflection', 'concept', 'practice'] as const
type PhaseType = (typeof PHASE_ORDER)[number]

const PHASE_META: Record<PhaseType, { label: string; icon: string; color: string }> = {
  activation: { label: 'Активация', icon: '⚡', color: '#00ff88' },
  reflection: { label: 'Рефлексия', icon: '👁', color: '#00aaff' },
  concept: { label: 'Концепция', icon: '💡', color: '#ff9900' },
  practice: { label: 'Практика', icon: '🛠', color: '#ff44aa' },
}

interface Props {
  type: PhaseType
  children: React.ReactNode
}

export function Phase({ type, children }: Props) {
  const { currentStep } = useUnitWizard()
  const stepIndex = PHASE_ORDER.indexOf(type)

  if (stepIndex !== currentStep) return null

  const { label, icon, color } = PHASE_META[type]

  return (
    <div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: `${color}18`,
        borderLeft: `3px solid ${color}`,
        padding: '4px 14px',
        borderRadius: '0 4px 4px 0',
        marginBottom: '1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
      }}>
        {icon} {label}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add web/components/unit-wizard-context.tsx web/components/phase.tsx
git commit -m "feat: add UnitWizardContext and Phase component"
```

---

## Task 5: UnitWizard component

**Files:**
- Create: `web/components/unit-wizard.tsx`

- [ ] **Step 1: Создать unit-wizard.tsx**

```typescript
// web/components/unit-wizard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitWizardContext } from './unit-wizard-context'
import { useUnitProgress } from '@/lib/unit-progress'

const PHASE_COLORS = ['#00ff88', '#00aaff', '#ff9900', '#ff44aa']
const PHASE_LABELS = ['Активация', 'Рефлексия', 'Концепция', 'Практика']
const TOTAL_STEPS = 4

interface Props {
  meetingSlug: string
  unitSlug: string
  nextUnitSlug: string | null
  meetingTitle: string
  unitIndex: number
  totalUnits: number
  children: React.ReactNode
}

export function UnitWizard({
  meetingSlug,
  unitSlug,
  nextUnitSlug,
  meetingTitle,
  unitIndex,
  totalUnits,
  children,
}: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [done, setDone] = useState(false)
  const { markCompleted } = useUnitProgress()
  const router = useRouter()

  function handleNext() {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function handleComplete() {
    markCompleted(meetingSlug, unitSlug)
    setDone(true)
  }

  function handleNextUnit() {
    if (nextUnitSlug) {
      router.push(`/lessons/${meetingSlug}/${nextUnitSlug}/`)
    } else {
      router.push(`/lessons/${meetingSlug}/`)
    }
  }

  return (
    <UnitWizardContext.Provider value={{ currentStep, totalSteps: TOTAL_STEPS }}>
      {/* Meeting + unit breadcrumb */}
      <div style={{
        marginBottom: '0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
      }}>
        {meetingTitle} · Unit {unitIndex + 1} из {totalUnits}
      </div>

      {/* Phase progress bar */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '2rem' }}>
        {PHASE_LABELS.map((label, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: '3px',
              background: i <= currentStep ? PHASE_COLORS[i] : 'var(--border-color)',
              borderRadius: '2px',
              marginBottom: '5px',
              transition: 'background 0.2s',
            }} />
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: i === currentStep ? PHASE_COLORS[i] : 'var(--text-secondary)',
              opacity: i > currentStep ? 0.4 : 1,
              transition: 'opacity 0.2s',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Phase content (controlled by UnitWizardContext) */}
      <div style={{ minHeight: '40vh' }}>
        {children}
      </div>

      {/* Actions */}
      <div style={{
        marginTop: '2.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '1rem',
      }}>
        {done ? (
          <>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
            }}>
              ● Пройдено
            </span>
            <button
              onClick={handleNextUnit}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--text-accent)',
                color: '#000',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              {nextUnitSlug ? 'Следующий unit →' : 'Встреча завершена →'}
            </button>
          </>
        ) : currentStep < TOTAL_STEPS - 1 ? (
          <button
            onClick={handleNext}
            style={{
              padding: '0.75rem 1.5rem',
              background: PHASE_COLORS[currentStep],
              color: '#000',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Далее →
          </button>
        ) : (
          <button
            onClick={handleComplete}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              border: '1px solid var(--text-accent)',
              color: 'var(--text-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
            }}
          >
            Отметить пройденным ✓
          </button>
        )}
      </div>
    </UnitWizardContext.Provider>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add web/components/unit-wizard.tsx
git commit -m "feat: add UnitWizard component"
```

---

## Task 6: MeetingRedirect component

**Files:**
- Create: `web/components/meeting-redirect.tsx`

- [ ] **Step 1: Создать meeting-redirect.tsx**

```typescript
// web/components/meeting-redirect.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUnitProgress } from '@/lib/unit-progress'

interface Props {
  meetingSlug: string
  units: { slug: string; title: string }[]
}

export function MeetingRedirect({ meetingSlug, units }: Props) {
  const router = useRouter()
  const { isCompleted, ready } = useUnitProgress()

  useEffect(() => {
    if (!ready) return
    const firstIncomplete = units.find(u => !isCompleted(meetingSlug, u.slug))
    const target = firstIncomplete ?? units[0]
    router.replace(`/lessons/${meetingSlug}/${target.slug}/`)
  }, [ready, meetingSlug, units, isCompleted, router])

  return null
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add web/components/meeting-redirect.tsx
git commit -m "feat: add MeetingRedirect component"
```

---

## Task 7: mdx-components.tsx + Sidebar

**Files:**
- Modify: `web/components/mdx-components.tsx`
- Modify: `web/components/sidebar.tsx`

- [ ] **Step 1: Зарегистрировать Phase в mdx-components.tsx**

В файле `web/components/mdx-components.tsx` добавь импорт:

```typescript
import { Phase } from './phase'
```

И в объект `mdxComponents` добавь после `OsBlock`:

```typescript
  Phase,
```

Итого объект должен заканчиваться:

```typescript
  OsBlock,
  Phase,
}
```

- [ ] **Step 2: Обновить Sidebar под NavigationItem**

Заменить весь файл `web/components/sidebar.tsx`:

```typescript
// web/components/sidebar.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { NavigationItem } from '@/lib/content'
import { useProgress } from './progress-provider'
import { useUnitProgress } from '@/lib/unit-progress'

interface SidebarProps {
  navItems: NavigationItem[]
  currentSlug?: string
  currentUnit?: string
}

function LessonIcon({ state }: { state: 'completed' | 'viewed' | 'none' }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)' }}>●</span>
  if (state === 'viewed') return <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>◐</span>
  return <span style={{ color: 'var(--border-color)' }}>○</span>
}

function UnitIcon({ state }: { state: 'completed' | 'current' | 'none' }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)', fontSize: '0.7rem' }}>✓</span>
  if (state === 'current') return <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem' }}>→</span>
  return <span style={{ color: 'var(--border-color)', fontSize: '0.7rem' }}>○</span>
}

export function Sidebar({ navItems, currentSlug, currentUnit }: SidebarProps) {
  const { getState } = useProgress()
  const { isCompleted: isUnitCompleted, ready } = useUnitProgress()
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (ready) forceRender(n => n + 1)
  }, [ready])

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Уроки курса
        </span>
      </div>

      {navItems.map(item => {
        const isActiveMeeting = item.slug === currentSlug
        const isActiveLesson = item.type === 'lesson' && item.slug === currentSlug

        if (item.type === 'lesson') {
          const state = getState(item.slug)
          return (
            <Link key={item.slug} href={`/lessons/${item.slug}/`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: isActiveLesson ? 'var(--text-accent)' : 'var(--text-secondary)',
              background: isActiveLesson ? 'var(--border-accent)' : 'transparent',
              borderLeft: isActiveLesson ? '2px solid var(--text-accent)' : '2px solid transparent',
            }}>
              <LessonIcon state={state} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                L{item.level}
              </span>
              <span style={{ flex: 1 }}>{item.title}</span>
            </Link>
          )
        }

        // type === 'meeting'
        return (
          <div key={item.slug}>
            <Link href={`/lessons/${item.slug}/`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: isActiveMeeting ? 'var(--text-accent)' : 'var(--text-secondary)',
              background: isActiveMeeting ? 'var(--border-accent)' : 'transparent',
              borderLeft: isActiveMeeting ? '2px solid var(--text-accent)' : '2px solid transparent',
            }}>
              <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>⬡</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                M{item.level}
              </span>
              <span style={{ flex: 1 }}>{item.title}</span>
            </Link>

            {/* Unit sub-items — visible when this meeting is active */}
            {isActiveMeeting && item.units && (
              <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)', marginLeft: '1rem' }}>
                {item.units.map(unit => {
                  const isCurrent = unit.slug === currentUnit
                  const completed = ready && isUnitCompleted(item.slug, unit.slug)
                  const unitState = completed ? 'completed' : isCurrent ? 'current' : 'none'

                  return (
                    <Link key={unit.slug} href={`/lessons/${item.slug}/${unit.slug}/`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isCurrent ? 'var(--bg-surface)' : 'transparent',
                      borderRadius: '4px',
                      margin: '1px 4px',
                    }}>
                      <UnitIcon state={unitState} />
                      <span style={{ flex: 1, fontSize: '0.75rem' }}>{unit.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 3: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add web/components/mdx-components.tsx web/components/sidebar.tsx
git commit -m "feat: register Phase in MDX, update Sidebar for NavigationItem"
```

---

## Task 8: lesson-layout.tsx — переход на navItems

**Files:**
- Modify: `web/components/lesson-layout.tsx`

- [ ] **Step 1: Обновить LessonLayout**

В `web/components/lesson-layout.tsx` измени импорт:

```typescript
import type { LessonMeta, NavigationItem } from '@/lib/content'
```

Измени interface:

```typescript
interface LessonLayoutProps {
  meta: LessonMeta
  navItems: NavigationItem[]
  children: React.ReactNode
}
```

Измени деструктуризацию и вызов Sidebar (строка `const idx = ...` и `<Sidebar ...>`):

```typescript
export function LessonLayout({ meta, navItems, children }: LessonLayoutProps) {
  // убрать: const idx = lessons.findIndex(...)
  // убрать: const prev = lessons[idx - 1]
  // убрать: const next = lessons[idx + 1]
  const { getState, markViewed, markCompleted } = useProgress()
  const state = getState(meta.slug)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    markViewed(meta.slug)
  }, [meta.slug, markViewed])

  async function handleComplete() {
    setCompleting(true)
    await markCompleted(meta.slug)
    setCompleting(false)
  }

  return (
    <AuthGuard>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar navItems={navItems} currentSlug={meta.slug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <div style={{
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-accent)',
          }}>
            Level {meta.level} · {meta.duration}
          </div>
          {children}
          {meta.assignment && <AssignmentBlock text={meta.assignment} />}

          {/* Complete button */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            {state === 'completed' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--text-accent)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}>
                ● Урок завершён
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: completing ? 'wait' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {completing ? '...' : '○ Отметить как пройденный'}
              </button>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
```

> Убрали prev/next навигацию между meeting'ами — она теряет смысл когда meeting'и стали папками. Flat-уроки (cheatsheet, roadmap) navigated через sidebar.

- [ ] **Step 2: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: ошибки в `[slug]/page.tsx` (передаёт `lessons` вместо `navItems`) — это нормально, исправим в Task 9.

- [ ] **Step 3: Commit (с ошибками — промежуточное состояние)**

```bash
git add web/components/lesson-layout.tsx
git commit -m "refactor: LessonLayout accepts navItems instead of lessons"
```

---

## Task 9: [slug]/page.tsx — обнаружение meeting + MeetingRedirect

**Files:**
- Modify: `web/app/lessons/[slug]/page.tsx`

- [ ] **Step 1: Заменить содержимое файла**

```typescript
// web/app/lessons/[slug]/page.tsx
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllLessons,
  getAllMeetings,
  getNavigationItems,
  getLessonBySlug,
  getMeetingMeta,
  isMeeting,
} from '@/lib/content'
import { LessonLayout } from '@/components/lesson-layout'
import { MeetingRedirect } from '@/components/meeting-redirect'
import { Nav } from '@/components/nav'
import { Sidebar } from '@/components/sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const lessons = getAllLessons()
  const meetings = getAllMeetings()
  return [
    ...lessons.map(l => ({ slug: l.slug })),
    ...meetings.map(m => ({ slug: m.slug })),
  ]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (isMeeting(slug)) {
    const meta = getMeetingMeta(slug)
    return { title: `${meta.title} — Точка Сборки`, description: meta.description }
  }
  const { meta } = getLessonBySlug(slug)
  return { title: `${meta.title} — Точка Сборки`, description: meta.description }
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params
  const navItems = getNavigationItems()

  if (isMeeting(slug)) {
    const meetingMeta = getMeetingMeta(slug)
    return (
      <AuthGuard>
        <Nav />
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
          <Sidebar navItems={navItems} currentSlug={slug} />
          <main style={{ flex: 1, padding: '2rem 3rem' }}>
            <MeetingRedirect meetingSlug={slug} units={meetingMeta.units} />
          </main>
        </div>
      </AuthGuard>
    )
  }

  const { meta, content } = getLessonBySlug(slug)

  return (
    <LessonLayout meta={meta} navItems={navItems}>
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </LessonLayout>
  )
}
```

- [ ] **Step 2: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 3: Commit**

```bash
git add web/app/lessons/[slug]/page.tsx
git commit -m "feat: [slug]/page.tsx detects meeting and renders MeetingRedirect"
```

---

## Task 10: [slug]/[unit]/page.tsx — unit-страница

**Files:**
- Create: `web/app/lessons/[slug]/[unit]/page.tsx`

- [ ] **Step 1: Создать папку и файл**

```bash
mkdir -p "web/app/lessons/[slug]/[unit]"
```

- [ ] **Step 2: Создать page.tsx**

```typescript
// web/app/lessons/[slug]/[unit]/page.tsx
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllMeetings,
  getMeetingMeta,
  getUnitContent,
  getNavigationItems,
} from '@/lib/content'
import { Nav } from '@/components/nav'
import { Sidebar } from '@/components/sidebar'
import { UnitWizard } from '@/components/unit-wizard'
import { AuthGuard } from '@/components/auth-guard'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string; unit: string }>
}

export async function generateStaticParams() {
  const meetings = getAllMeetings()
  return meetings.flatMap(m =>
    m.units.map(u => ({ slug: m.slug, unit: u.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, unit } = await params
  const { unitMeta } = getUnitContent(slug, unit)
  const meetingMeta = getMeetingMeta(slug)
  return {
    title: `${unitMeta.title} — ${meetingMeta.title} — Точка Сборки`,
    description: meetingMeta.description,
  }
}

export default async function UnitPage({ params }: Props) {
  const { slug: meetingSlug, unit: unitSlug } = await params
  const meetingMeta = getMeetingMeta(meetingSlug)
  const { content } = getUnitContent(meetingSlug, unitSlug)
  const navItems = getNavigationItems()

  const unitIndex = meetingMeta.units.findIndex(u => u.slug === unitSlug)
  const nextUnit = meetingMeta.units[unitIndex + 1] ?? null

  return (
    <AuthGuard>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar navItems={navItems} currentSlug={meetingSlug} currentUnit={unitSlug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <UnitWizard
            meetingSlug={meetingSlug}
            unitSlug={unitSlug}
            nextUnitSlug={nextUnit?.slug ?? null}
            meetingTitle={meetingMeta.title}
            unitIndex={unitIndex}
            totalUnits={meetingMeta.units.length}
          >
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </UnitWizard>
        </main>
      </div>
    </AuthGuard>
  )
}
```

- [ ] **Step 3: Проверить TypeScript**

```bash
cd web && npx tsc --noEmit
```

Ожидаем: 0 ошибок.

- [ ] **Step 4: Запустить тесты**

```bash
cd web && npx vitest run
```

Ожидаем: все тесты PASS.

- [ ] **Step 5: Commit**

```bash
git add "web/app/lessons/[slug]/[unit]/page.tsx"
git commit -m "feat: add [slug]/[unit]/page.tsx unit route"
```

---

## Task 11: M1 content — _meta.json + 4 unit MDX файла

**Files:**
- Create: `web/content/ru/01-introduction/_meta.json`
- Create: `web/content/ru/01-introduction/u1-activation.mdx`
- Create: `web/content/ru/01-introduction/u2-four-shifts.mdx`
- Create: `web/content/ru/01-introduction/u3-clones.mdx`
- Create: `web/content/ru/01-introduction/u4-practice.mdx`

- [ ] **Step 1: Создать папку и _meta.json**

```bash
mkdir -p "web/content/ru/01-introduction"
```

Создать `web/content/ru/01-introduction/_meta.json`:

```json
{
  "meeting": 1,
  "title": "M1: Знакомство",
  "description": "Software 3.0 и почему это меняет всё",
  "duration": "30 мин",
  "level": 1,
  "units": [
    { "slug": "u1-activation", "title": "Твой опыт с AI" },
    { "slug": "u2-four-shifts", "title": "Четыре сдвига" },
    { "slug": "u3-clones", "title": "Пять клонов" },
    { "slug": "u4-practice", "title": "Первый промпт" }
  ]
}
```

- [ ] **Step 2: Создать u1-activation.mdx**

```mdx
---
title: "Твой опыт с AI"
unit: 1
meeting: 1
duration: "5 мин"
---

<Phase type="activation">

Вспомни последний раз, когда ты пробовал что-то сделать с помощью AI (ChatGPT, Claude, Gemini — неважно).

**Что именно ты просил?** Что получил в ответ?

</Phase>

<Phase type="reflection">

Посмотри на этот опыт честно:

- Ты получил то, что хотел — с первого раза?
- Если нет — почему? Что было неясно в твоём запросе?
- Что бы ты изменил, если бы мог сформулировать запрос заново?

Большинство людей на этом месте понимают: **проблема не в AI, а в том, как мы с ним разговариваем.**

</Phase>

<Phase type="concept">

## Три эпохи программирования

**Software 1.0** — мы писали код вручную, строчка за строчкой. Компьютер делал ровно то, что сказали.

**Software 2.0** — машины начали учиться на данных. Нейросети. Мы задаём примеры, а не правила.

**Software 3.0** — **агенты за нас пишут код.** Мы управляем, делегируем, проверяем результат.

| Было | Стало |
|------|-------|
| Я пишу код → машина выполняет | Я пишу промпт → агент пишет код → я проверяю |
| Я решаю ВСЕ проблемы сам | Я выбираю: что решаю сам, что делегирую |
| Инструменты помогают мне писать | Инструменты пишут вместо меня |

> 💡 AI-агент — это не калькулятор. Это джуниор-коллега. Ему нужен контекст, цель, и немного доверия.

</Phase>

<Phase type="practice">

Открой Claude (claude.ai или Claude Code в терминале).

Напиши этот промпт:

```
Объясни разницу между Software 1.0, 2.0 и 3.0 — тремя примерами из реальной жизни.
Мне важно понять, что именно изменилось в моей работе.
```

Сохрани ответ в `my-experiments/u1-software-3.md`

</Phase>
```

- [ ] **Step 3: Создать u2-four-shifts.mdx**

```mdx
---
title: "Четыре сдвига"
unit: 2
meeting: 1
duration: "10 мин"
---

<Phase type="activation">

Возьми любую задачу, которую ты недавно давал AI. Или придумай прямо сейчас:

> «Напиши мне текст для Instagram про мой курс»

Что не так с этим промптом? Что AI не знает, чтобы дать хороший ответ?

</Phase>

<Phase type="reflection">

Вот что AI не знает из этого запроса:

- Кто твоя аудитория?
- Какой стиль — формальный, живой, с юмором?
- Какая цель поста — продажи, охваты, engagement?
- Сколько слов? Нужны ли хэштеги?

**Вывод:** AI делает предположения там, где ты не дал информации. Чем меньше контекста — тем больше угадывания.

</Phase>

<Phase type="concept">

## Четыре сдвига в работе с AI-агентами

### 1️⃣ От команд → к делегированию

**Было:** `Напиши функцию`
**Стало:** `Мне нужен модуль валидации email с логированием ошибок для продакшн-проекта`

Агент — не робот, которому даёшь команды. Это коллега, которому объясняешь задачу.

### 2️⃣ От результата → к эксперименту

Первый ответ — черновик, не приговор. Неудачный промпт — это данные, а не провал. Итерируй.

### 3️⃣ От действий → к спецификациям

Промпт — это ТЗ, не команда. Хорошее ТЗ содержит: **Кто** / **Что** / **Зачем** / **Как** / **Чего не делать**.

### 4️⃣ От «всё сам» → к управлению вниманием

Делегируй агенту: рутину, первый черновик, поиск.
Решай сам: стратегию, финальную проверку, этику.

</Phase>

<Phase type="practice">

Возьми свой старый промпт (из Активации) и перепиши его применяя сдвиги:

1. Добавь **контекст** (кто ты, для кого, зачем)
2. Добавь **критерии** (формат, объём, тон)
3. Добавь **ограничения** (чего не делать)

Сохрани оба варианта в `my-experiments/u2-shifts-before-after.md`

Сравни результаты Claude на оба варианта.

</Phase>
```

- [ ] **Step 4: Создать u3-clones.mdx**

```mdx
---
title: "Пять клонов"
unit: 3
meeting: 1
duration: "8 мин"
---

<Phase type="activation">

Где ты теряешь больше всего времени каждую неделю?

Выбери одно:

- Ответы на письма и сообщения
- Подготовка встреч и follow-up
- Создание контента (посты, тексты, идеи)
- Поиск и систематизация информации
- Рутинные повторяющиеся задачи

</Phase>

<Phase type="reflection">

Теперь представь: эту задачу делает кто-то другой. Каждый день. Хорошо.

Что ты мог бы делать вместо этого? На что у тебя освободилось бы внимание?

Именно так работает идея **AI-клонов** — специализированных агентов под конкретные задачи.

</Phase>

<Phase type="concept">

## Пять типов AI-клонов

| Клон | Что делает | Экономит |
|------|-----------|----------|
| **Communication** | Отвечает на письма в твоём стиле | 2–4 ч/день |
| **Meeting Intelligence** | Суммирует встречи, пишет задачи | 30 мин/встреча |
| **Content** | Генерирует посты, нарезки, идеи | 5–10 ч/нед |
| **Learning** | Учит тебя новому по расписанию | Качество жизни |
| **Automation** | Pipeline: данные → отчёт, URL → summary | 5–15 ч/нед |

**Цикл построения:** Capture → Build → Test → Refine.

> 💡 Не строй все пять сразу. Выбери того, на котором теряешь больше всего. Meeting 5 и 6 покажут как это делается технически.

</Phase>

<Phase type="practice">

Вернись к своему ответу из Активации — где ты теряешь больше всего времени.

Опиши своего первого клона в `my-experiments/u3-my-clone.md`:

```
Клон: [название]
Задача: [что он делает каждый день]
Входные данные: [что ему нужно знать]
Ожидаемый результат: [что он должен выдавать]
```

Это станет твоим первым реальным AI-проектом к концу курса.

</Phase>
```

- [ ] **Step 5: Создать u4-practice.mdx**

```mdx
---
title: "Первый промпт"
unit: 4
meeting: 1
duration: "7 мин"
---

<Phase type="activation">

Ты уже знаешь четыре сдвига и пять клонов.

Какой из сдвигов был для тебя самым неожиданным? Что ты не ожидал услышать?

</Phase>

<Phase type="reflection">

Подумай о своей текущей работе или проектах:

- Где ты сейчас всё ещё работаешь в режиме Software 1.0 (делаю всё руками)?
- Какая одна задача, если бы ты её делегировал агенту, освободила бы больше всего времени?

Запомни этот ответ — он станет твоим ориентиром на весь курс.

</Phase>

<Phase type="concept">

## Что дальше: карта курса

Ты прошёл Meeting 1. Вот что впереди:

- **M2 — Setup:** Настроишь Claude Code, Git, всё что нужно для работы
- **M3 — Промпты:** Научишься писать промпты как профессионал
- **M4 — Контекст:** Поймёшь как AI «помнит» и как этим управлять
- **M5 — Pipeline:** Построишь свой первый автоматизированный workflow
- **M6 — Tools:** MCP, Hooks, Skills — суперсилы Claude Code

Каждая встреча — конкретный результат, не просто теория.

</Phase>

<Phase type="practice">

Финальное задание Meeting 1:

1. Открой `my-experiments/u3-my-clone.md` — описание твоего клона
2. Спроси Claude: *«Как мне построить этого клона с помощью Claude Code? Что мне нужно освоить сначала?»*
3. Сохрани ответ рядом как `my-experiments/u4-clone-roadmap.md`

Это твой персональный план внутри курса.

</Phase>
```

- [ ] **Step 6: Проверить что папка создана правильно**

```bash
ls "web/content/ru/01-introduction/"
```

Ожидаем: `_meta.json  u1-activation.mdx  u2-four-shifts.mdx  u3-clones.mdx  u4-practice.mdx`

- [ ] **Step 7: Commit**

```bash
git add web/content/ru/01-introduction/
git commit -m "content: add M1 cognitive units (u1-u4) with Kolb cycle structure"
```

---

## Task 12: Удалить 01-introduction.mdx, обновить тесты, финальная сборка

**Files:**
- Delete: `web/content/ru/01-introduction.mdx`
- Modify: `web/lib/content.test.ts`

- [ ] **Step 1: Проверить что unit-страницы будут работать**

```bash
cd web && npx next build 2>&1 | tail -20
```

Ожидаем: успешная сборка, новые роуты `/lessons/01-introduction/u1-activation/` и т.д. в выводе.

- [ ] **Step 2: Удалить старый плоский файл**

```bash
git rm web/content/ru/01-introduction.mdx
```

- [ ] **Step 3: Обновить тест getAllLessons**

В `web/lib/content.test.ts` найди:

```typescript
it('returns only numbered lesson files (00-06)', () => {
  const lessons = getAllLessons()
  expect(lessons.length).toBe(7)
```

Измени на:

```typescript
it('returns only flat numbered lesson files', () => {
  const lessons = getAllLessons()
  expect(lessons.length).toBe(6)  // 01-introduction теперь папка, не файл
```

Также найди и удали тест:

```typescript
it('returns content and meta for 01-introduction', () => {
  const result = getLessonBySlug('01-introduction')
  expect(result.content).toBeTruthy()
  expect(result.meta.title).toBe('Meeting 1: Знакомство')
  expect(result.meta.order).toBe(1)
})
```

Замени его тестом для unit:

```typescript
it('returns content and meta for 01-introduction unit', () => {
  const result = getUnitContent('01-introduction', 'u1-activation')
  expect(result.content).toBeTruthy()
  expect(result.unitMeta.title).toBe('Твой опыт с AI')
  expect(result.unitMeta.unit).toBe(1)
})

it('getMeetingMeta returns correct data for 01-introduction', () => {
  const meta = getMeetingMeta('01-introduction')
  expect(meta.title).toBe('M1: Знакомство')
  expect(meta.units).toHaveLength(4)
  expect(meta.units[0].slug).toBe('u1-activation')
})
```

Добавь `getUnitContent, getMeetingMeta` в import если ещё не добавлены.

- [ ] **Step 4: Запустить все тесты**

```bash
cd web && npx vitest run
```

Ожидаем: все тесты PASS (было 11, теперь тоже проходят с обновлённым счётчиком).

- [ ] **Step 5: Финальная сборка**

```bash
cd web && npx next build
```

Ожидаем:
- Сборка успешна
- В выводе: `/lessons/01-introduction/u1-activation`, `/lessons/01-introduction/u2-four-shifts` и т.д.
- `/lessons/01-introduction/` — страница-редирект (MeetingRedirect)
- Нет 404 на старом `/lessons/01-introduction/`

- [ ] **Step 6: Финальный commit**

```bash
git add web/lib/content.test.ts
git commit -m "feat: complete cognitive units infrastructure + M1 migration

- New route [slug]/[unit]/page.tsx for unit pages
- UnitWizard 4-phase wizard with Kolb cycle
- Phase component with UnitWizardContext
- useUnitProgress localStorage hook
- Sidebar with nested unit sub-items
- MeetingRedirect for meeting landing pages
- M1 (01-introduction) fully migrated to 4 cognitive units
- Tests updated for new content structure"
```

---

## Что дальше

**Plan 2 (отдельный план):** Миграция M0, M2, M3, M4, M5, M6 по тому же шаблону что и M1. Для каждого meeting:
1. Создать папку + `_meta.json`
2. Написать unit-файлы (3–5 штук)
3. Удалить плоский `.mdx`-файл
4. Обновить тест на счётчик `getAllLessons`

Порядок приоритета: M3 (Prompt Engineering, самый длинный, нужна реструктуризация) → M2 (Setup Guide) → M4, M5, M6 → M0.
