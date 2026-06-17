# Вкладка «Профиль ученика» (fb_2489d7b7a924)

**Тикет:** `fb_2489d7b7a924` (severity: medium, impact 7 × urgency 6, area: lms, cat: feature)
**Дата:** 2026-06-16

## Проблема / задача

Авторская корректировка брифа: отдельная вкладка «Профиль ученика», консолидирующая **лист героя + quest-log roadmap (WorldMap) + карточку companion charter**. Сейчас: `/character` (лист героя, НЕ в nav), WorldMap живёт на `/dashboard`, charter доступен только на intake-завершении (`charter-reveal`).

## Решение

`/character` расширяется в консолидированный **«Профиль»**: лист героя + WorldMap (**перенесён** с dashboard) + карточка устава напарника. Таб «Профиль» добавляется в nav. Решения автора: расширить `/character` (не новый роут) + **полный перенос** WorldMap (живёт только в профиле).

## Единицы

### 1. `app/character/page.tsx` → server-компонент с данными
Сейчас рендерит `<CharacterSheet locale="ru" />`. Станет (зеркало `dashboard/page.tsx`):
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
EN-зеркало `app/en/character/page.tsx` — `locale="en"`.

### 2. `app/character/profile-client.tsx` (новый client-компонент)
- Один `fetch('/api/intake/me')` + `useProgress()`; редирект на quest-intake если профиль не `completed` (как dashboard).
- Грузит skin-pack (`@/lib/rpg/skins/<world_skin>.json`, fallback wanderer) — как dashboard.
- Рендер: `<CharacterSheet locale profile={p} />` (лист героя) → `<WorldMap vm={vm} .../>` (VM через `buildQuestLog(profile, modules, completed, getState, pack, locale)` — тот же пайплайн, что был на dashboard) → `<CharterCard profile={p} locale={locale} />`.

### 3. `components/character-sheet.tsx` — принять опц. `profile`
- Сигнатура: `CharacterSheet({ locale, profile }: { locale: Locale; profile?: any })`. Если `profile` передан — использовать его (не фетчить); иначе — текущий self-fetch (обратная совместимость). Избегаем двойного `/api/intake/me`.

### 4. `components/intake/charter-card.tsx` (новый)
- Пропсы `{ profile, locale }`. Через `profileToCharter(profile, locale)` строит устав; карточка: заголовок «Устав напарника» + `<pre>{charter}</pre>` + copy-кнопка + кнопка «Собрать профиль обучения с ИИ» (переиспользует `buildSelfProfilePrompt(charter, locale)`).
- `'use client'` (clipboard).

### 5. `lib/intake/charter.ts` → `profileToCharter` (новый pure-хелпер)
```ts
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { parseOutcome } from './parse-outcome'
import { deriveMbti, relationalStyle } from './mbti'
export function profileToCharter(profile: any, locale: Locale): string {
  const answers = (() => { try { return JSON.parse(profile?.answers ?? '{}') } catch { return {} } })()
  const meta = SKINS_META[profile?.world_skin as keyof typeof SKINS_META]
  return buildCompanionCharter({
    locale,
    skinName: meta?.displayName[locale] ?? null,
    mentorName: meta?.mentor?.name[locale] ?? null,
    niche: profile?.niche ?? null,
    outcome: parseOutcome(profile),
    mbti: deriveMbti(answers),
    relational: relationalStyle(answers),
  })
}
```
(`buildCompanionCharter` уже есть; `SKINS_META`/parse/derive — существующие.)

### 6. `app/dashboard/dashboard-client.tsx` — убрать `<WorldMap>`
- Удалить рендер секции `<WorldMap … />` + импорт `WorldMap`. **`vm` остаётся** (его потребляет `<QuestFeed>` — не трогать). Опц. лёгкая ссылка «полная карта — в Профиле» (необязательно).

### 7. `components/nav.tsx` + `lib/dictionaries.ts` — таб «Профиль»
- В `t.nav` добавить `profile` (RU «Профиль», EN «Profile»); в nav добавить ссылку на `${locale==='en'?'/en':''}/character/` рядом с questLog. Bilingual (оба dict-блока).

## Данные / стейт
Всё клиентское: `/api/intake/me` (профиль + raw `answers`) → пересбор charter (`profileToCharter`) + VM (`buildQuestLog`). Прогресс — `useProgress`. Новых серверных эндпоинтов/полей нет.

## Тесты
`lib/intake/charter.test.ts` (дополнить/создать): `profileToCharter` для ru/en на фикстуре profile-row (с `answers` JSON, `world_skin`, `niche`) → непустой charter, содержит niche; парсинг битого `answers` не падает.

## Вне scope (YAGNI)
- OAuth для профилей (`fb_25d8fa04c141` — отдельный тикет).
- Редактирование профиля / переанкетирование с вкладки.
- Новые серверные поля/эндпоинты.

## Критерий готовности
Таб «Профиль» в nav → `/character` показывает лист героя + WorldMap-roadmap + карточку устава (copy + self-profile). WorldMap убран с dashboard (QuestFeed цел). Bilingual RU+EN. `profileToCharter`-тест + полная сьюta + tsc зелёные.
