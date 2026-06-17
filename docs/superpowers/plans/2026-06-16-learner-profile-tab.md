# Вкладка «Профиль ученика» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development или executing-plans. Checkbox-шаги.

**Goal:** `/character` → консолидированный «Профиль»: лист героя + WorldMap (перенос с dashboard) + charter-карточка; таб в nav (`fb_2489d7b7a924`).

**Spec:** `docs/superpowers/specs/2026-06-16-learner-profile-tab-design.md`
**Пути:** от `LMS/tochka-sborki/web/`. Тесты: `npx vitest run <path>`.

---

## Task 1: profileToCharter + тест

**Files:** Modify `lib/intake/charter.ts`; Create `lib/intake/charter.test.ts`

- [ ] **Step 1:** в конец `lib/intake/charter.ts` добавить (импорты — вверх файла):
```ts
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { parseOutcome } from './parse-outcome'
import { deriveMbti, relationalStyle } from './mbti'

export function profileToCharter(profile: any, locale: Locale): string {
  let answers: Record<string, unknown> = {}
  try { answers = JSON.parse(profile?.answers ?? '{}') } catch { answers = {} }
  const meta = SKINS_META[profile?.world_skin as keyof typeof SKINS_META]
  return buildCompanionCharter({
    locale,
    skinName: meta?.displayName[locale] ?? null,
    mentorName: meta?.mentor?.name[locale] ?? null,
    niche: profile?.niche ?? null,
    outcome: parseOutcome(profile),
    mbti: deriveMbti(answers as any),
    relational: relationalStyle(answers as any),
  })
}
```
(`Locale` уже импортирован в charter.ts через `CharterInput`; если нет — добавить в существующий импорт типов.)

- [ ] **Step 2:** создать `lib/intake/charter.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { profileToCharter } from './charter'

const row = {
  world_skin: 'space-opera',
  niche: 'coach',
  answers: JSON.stringify({ V_OUTCOME: 'собрать лендинг', V_RHYTHM: 'fuego', V_ERR: 'calm' }),
}

describe('profileToCharter', () => {
  it('строит непустой устав с niche (ru/en)', () => {
    for (const loc of ['ru', 'en'] as const) {
      const c = profileToCharter(row, loc)
      expect(c.length).toBeGreaterThan(0)
      expect(c).toContain('coach')
    }
  })
  it('битый answers не роняет', () => {
    expect(() => profileToCharter({ world_skin: 'wanderer', answers: '{bad' }, 'ru')).not.toThrow()
  })
})
```

- [ ] **Step 3:** `npx vitest run lib/intake/charter.test.ts` → PASS.
- [ ] **Step 4: Commit**
```bash
git add LMS/tochka-sborki/web/lib/intake/charter.ts LMS/tochka-sborki/web/lib/intake/charter.test.ts
git commit -m "feat(intake): profileToCharter — пересбор устава из профиля (fb_2489d7b7a924)"
```

---

## Task 2: CharacterSheet — опц. profile-проп

**Files:** Modify `components/character-sheet.tsx`

- [ ] **Step 1:** заменить начало компонента:
```tsx
export function CharacterSheet({ locale, profile }: { locale: Locale; profile?: any }) {
  const [fetched, setFetched] = useState<any>(null)
  useEffect(() => {
    if (profile) return
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null).then(setFetched).catch(() => {})
  }, [profile])
  const p = profile ?? fetched
  if (!p) return null
```
(остальное тело без изменений.)

- [ ] **Step 2:** `npx tsc --noEmit` → rc 0.
- [ ] **Step 3: Commit**
```bash
git add LMS/tochka-sborki/web/components/character-sheet.tsx
git commit -m "refactor(profile): CharacterSheet принимает опц. profile (без двойного fetch) (fb_2489d7b7a924)"
```

---

## Task 3: CharterCard

**Files:** Create `components/intake/charter-card.tsx`

- [ ] **Step 1:** создать `components/intake/charter-card.tsx`:
```tsx
'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/intake/types'
import { profileToCharter } from '@/lib/intake/charter'
import { buildSelfProfilePrompt } from '@/lib/intake/self-profile-prompt'

export function CharterCard({ profile, locale }: { profile: any; locale: Locale }) {
  const [copied, setCopied] = useState(false)
  const [profileCopied, setProfileCopied] = useState(false)
  const charter = profileToCharter(profile, locale)
  const t = locale === 'en'
    ? { title: 'Companion charter', copy: 'Copy charter', copied: 'Copied ✓', profile: 'Build my learning profile with AI', profileCopied: 'Copied ✓' }
    : { title: 'Устав напарника', copy: 'Скопировать устав', copied: 'Скопировано ✓', profile: 'Собрать мой профиль обучения с ИИ', profileCopied: 'Скопировано ✓' }
  const btn: React.CSSProperties = { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <section style={{ maxWidth: 640, margin: '2rem auto 0', padding: '0 1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '.6rem' }}>{t.title}</h2>
      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', overflowX: 'auto', fontSize: '.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{charter}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: '1rem', flexWrap: 'wrap' }}>
        <button style={btn} onClick={async () => { try { await navigator.clipboard.writeText(charter); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }}>{copied ? t.copied : t.copy}</button>
        <button style={btn} onClick={async () => { try { await navigator.clipboard.writeText(buildSelfProfilePrompt(charter, locale)); setProfileCopied(true); setTimeout(() => setProfileCopied(false), 2000) } catch {} }}>{profileCopied ? t.profileCopied : t.profile}</button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add LMS/tochka-sborki/web/components/intake/charter-card.tsx
git commit -m "feat(profile): CharterCard — устав из профиля + copy/self-profile (fb_2489d7b7a924)"
```

---

## Task 4: ProfileClient + страницы

**Files:** Create `app/character/profile-client.tsx`; Modify `app/character/page.tsx`, `app/en/character/page.tsx`

- [ ] **Step 1:** создать `app/character/profile-client.tsx`:
```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import { buildQuestLog } from '@/lib/rpg/quest-log'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { WorldMap } from '@/components/rpg/world-map'
import { CharacterSheet } from '@/components/character-sheet'
import { CharterCard } from '@/components/intake/charter-card'
import { useNicheDungeonCleared } from '@/lib/dungeon/use-dungeon'
import wandererPack from '@/lib/rpg/skins/wanderer.json'
import type { SkinPack } from '@/lib/rpg/types'
import type { Locale } from '@/lib/intake/types'

interface Props {
  modules: Record<string, { title: string; duration: string }>
  unitsByModule: Record<string, { slug: string; title: string }[]>
  locale: Locale
}

export function ProfileClient({ modules, locale }: Props) {
  const router = useRouter()
  const { getState, loaded } = useProgress()
  const [profile, setProfile] = useState<any>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)
  const nicheDungeonCleared = useNicheDungeonCleared(profile?.niche ?? null)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p || p.status !== 'completed') { router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'); return }
        setProfile(p)
        try { const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`); setPack(mod.default as SkinPack) }
        catch { setPack(wandererPack as SkinPack) }
      })
      .catch(() => router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'))
  }, [router, locale])

  if (!profile || !loaded) return (<><Nav locale={locale} /><main style={{ maxWidth: 660, margin: '0 auto', padding: '4rem 1.5rem' }}><p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>…</p></main></>)

  const accent = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.accent ?? 'var(--text-accent)'
  const glyph = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.glyph ?? '⬡'
  const completed = Object.keys(modules).filter(s => getState(s) === 'completed')
  const vm = buildQuestLog(profile, modules, completed, getState as any, pack, locale)

  return (
    <>
      <Nav locale={locale} />
      <CharacterSheet locale={locale} profile={profile} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ margin: '1.5rem 0' }}>
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} nicheDungeonCleared={nicheDungeonCleared} />
        </div>
      </main>
      <CharterCard profile={profile} locale={locale} />
    </>
  )
}
```

- [ ] **Step 2:** заменить `app/character/page.tsx`:
```tsx
import { getAllModules } from '@/lib/content'
import { ProfileClient } from './profile-client'

export default function Page() {
  const mods = getAllModules('ru')
  const modules = Object.fromEntries(mods.map(m => [m.slug, { title: m.title, duration: m.duration }]))
  const unitsByModule = Object.fromEntries(mods.map(m => [m.slug, m.units]))
  return <ProfileClient modules={modules} unitsByModule={unitsByModule} locale="ru" />
}
```

- [ ] **Step 3:** EN-зеркало `app/en/character/page.tsx` (создать, если есть `app/en/character/`; если каталога нет — создать):
```tsx
import { getAllModules } from '@/lib/content'
import { ProfileClient } from '@/app/character/profile-client'

export default function Page() {
  const mods = getAllModules('en')
  const modules = Object.fromEntries(mods.map(m => [m.slug, { title: m.title, duration: m.duration }]))
  const unitsByModule = Object.fromEntries(mods.map(m => [m.slug, m.units]))
  return <ProfileClient modules={modules} unitsByModule={unitsByModule} locale="en" />
}
```

- [ ] **Step 4: Commit**
```bash
git add LMS/tochka-sborki/web/app/character/profile-client.tsx "LMS/tochka-sborki/web/app/character/page.tsx" "LMS/tochka-sborki/web/app/en/character/page.tsx"
git commit -m "feat(profile): ProfileClient (лист героя + WorldMap + charter) + страницы ru/en (fb_2489d7b7a924)"
```

---

## Task 5: убрать WorldMap с dashboard

**Files:** Modify `app/dashboard/dashboard-client.tsx`

- [ ] **Step 1:** удалить блок (строки ~110-113):
```tsx
        <div style={{ margin: '1.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.25rem' }}><HelpTip id="world-map" locale={locale} align="right" /></div>
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} nicheDungeonCleared={nicheDungeonCleared} />
        </div>
```
- [ ] **Step 2:** удалить импорт `import { WorldMap } from '@/components/rpg/world-map'`. **НЕ трогать** `vm`/`nicheDungeonCleared`/`glyph` — `vm` нужен `<QuestFeed>` (строка 114); если `glyph`/`nicheDungeonCleared` больше нигде не используются — TS выдаст unused-var → удалить ИХ объявления тоже (проверить `tsc`). `accent` остаётся (используется широко).
- [ ] **Step 3:** `npx tsc --noEmit` → rc 0 (без unused-var ошибок).
- [ ] **Step 4: Commit**
```bash
git add LMS/tochka-sborki/web/app/dashboard/dashboard-client.tsx
git commit -m "refactor(dashboard): убрать WorldMap (переехал в Профиль); QuestFeed/vm целы (fb_2489d7b7a924)"
```

---

## Task 6: таб «Профиль» в nav

**Files:** Modify `lib/dictionaries.ts`, `components/nav.tsx`

- [ ] **Step 1:** в `lib/dictionaries.ts` — в интерфейс `nav` добавить `profile: string`; в RU-блок `nav` добавить `profile: 'Профиль',`; в EN-блок `profile: 'Profile',`.
- [ ] **Step 2:** в `components/nav.tsx` — рядом со ссылкой questLog (строка ~89) добавить:
```tsx
        {email && (() => { const h = `${locale === 'en' ? '/en' : ''}/character/`; return <Link href={h} style={navLinkStyle(h)}>{t.nav.profile}</Link> })()}
```
(под gate `email` — как questLog; профиль доступен залогиненному.)
- [ ] **Step 3:** `npx tsc --noEmit` → rc 0.
- [ ] **Step 4: Commit**
```bash
git add LMS/tochka-sborki/web/lib/dictionaries.ts LMS/tochka-sborki/web/components/nav.tsx
git commit -m "feat(profile): таб «Профиль» в nav (ru/en) (fb_2489d7b7a924)"
```

---

## Task 7: Верификация + write-back

- [ ] **Step 1:** `npx vitest run` (вся LMS-сьюta) → зелёная.
- [ ] **Step 2:** `npx tsc --noEmit` → rc 0.
- [ ] **Step 3: Write-back:**
```bash
node feedback/scripts/fb.mjs status fb_2489d7b7a924 done
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): fb_2489d7b7a924 done — вкладка Профиль ученика"
```

## Самопроверка плана
- **Покрытие спеки:** profileToCharter+тест T1 ✓ · CharacterSheet опц.profile T2 ✓ · CharterCard T3 ✓ · ProfileClient+страницы ru/en T4 ✓ · убрать WorldMap с dashboard (vm цел) T5 ✓ · nav-таб ru/en T6 ✓ · verify+writeback T7 ✓.
- **Консистентность:** `profileToCharter(profile,locale)` (T1) = вызов в CharterCard (T3); `CharacterSheet({locale,profile?})` (T2) = вызов в ProfileClient (T4); `ProfileClient` props (T4) = передача из page.tsx; WorldMap props (T4/T5) идентичны.
- **Плейсхолдеров нет.**
