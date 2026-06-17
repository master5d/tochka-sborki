# Syllabus + Course Materials как LMS-scaffold

**Тикет:** `fb_f4e32117942e` (feature, sev medium, impact 7 × urgency 5, area lms)
**Дата:** 2026-06-17
**Контекст:** не хардкод под tochka-sborki — переиспользуемая LMS-архитектура для будущих курсов. Первый scaffold-кирпич извлечения движок↔данные.
**Follow-up:** `fb_8f1a05ce1150` (извлечь RPG/intake/showcase в course-data), `fb_31371f4dfd19` (LMS/_template/ boilerplate).

## Назначение
1. **Syllabus** — полное дерево модуль→юнит (чего нет на home, где только модули) — обзор всей программы; generic из `getAllModules`.
2. **Course Materials** — учебные ресурсы в одном месте через **декларативный манифест** (любой курс наполняет данные, рендер общий).
3. **`lib/course.ts`** — первый центральный course-config (бренд/домен/локали), де-дублирует домен, захардкоженный в sitemap/robots/manifest.

## Файлы

### 1. `lib/course.ts` — центральный course-config (scaffold-ядро)
```ts
export interface Bi { ru: string; en: string }
export const COURSE = {
  name: 'Точка Сборки' as string,
  fullName: { ru: 'Точка Сборки — курс по vibe-кодингу', en: '…' } as Bi,
  domain: 'https://ai.mamaev.coach' as string,
  locales: ['ru', 'en'] as const,
  publisher: 'Mamaev Institute for AI' as string,
}
```
Заменить хардкод `'https://ai.mamaev.coach'` в `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx` (metadataBase) на `COURSE.domain`. (Точечно — не все 23 brand-вхождения; только домен в новых SEO-файлах + manifest, чтобы единый источник.)

### 2. `lib/materials.ts` — модель + манифест
```ts
import type { Bi } from './course'
export type MaterialKind = 'template' | 'link' | 'tool'
export interface Material { kind: MaterialKind; title: Bi; description?: Bi; href: string; external?: boolean }
export interface MaterialGroup { label: Bi; items: Material[] }
export const COURSE_MATERIALS: MaterialGroup[]
export function isExternalHref(href: string): boolean   // http(s):// → true
```
Группы (3 категории):
- **Шаблоны** (`kind:'template'`): `/materials/agent-charter.md`, `/materials/automation-recipes.md` (скопированы в public/).
- **Из курса** (`kind:'link'`): Шпаргалка `/cheatsheet/`, Roadmap `/roadmap/`, install Claude `/install.sh` + `/install.ps1`, GFW `/install-gfw.sh`.
- **Инструменты** (`kind:'tool'`, external): Claude Code, Codex, OpenRouter, LiteLLM (стартовый набор).

### 3. `public/materials/*.md`
Копии `../../my-templates/{agent-charter,automation-recipes}.md` → `web/public/materials/`. Раздаются на скачивание.

### 4. `components/materials-section.tsx` (generic, server)
Рендерит `MaterialGroup[]`: заголовок группы, список items; иконка по `kind` (📄 template / 🔗 link / 🛠 tool); `external`→`target=_blank rel=noopener`, template→`download`. Переиспользуем любым курсом.

### 5. `components/syllabus-tree.tsx` (generic, server)
Принимает `modules: ModuleMeta[]`, `locale`. Рендерит дерево: модуль (title/описание/длительность/уровень) → юниты-ссылки на `/lessons/<slug>/<unit>/`. Номер модуля/юнита.

### 6. `app/syllabus/page.tsx` + `app/en/syllabus/page.tsx` (server)
`getAllModules(locale)` → `<Nav>` + заголовок + `<SyllabusTree modules locale>` + `<MaterialsSection groups={COURSE_MATERIALS} locale>`. metadata title/description.

### 7. nav-вкладка
`dictionaries.nav.syllabus` (интерфейс + ru 'Программа' + en 'Syllabus'). В `nav.tsx` — публичная ссылка (без email-гейта), рядом с roadmap.

## Тесты (vitest env=node)
- `lib/course.test.ts`: COURSE.domain — валидный https URL; locales включают ru/en; name непустой.
- `lib/materials.test.ts`: манифест непустой; каждая group `label.ru/en` + ≥1 item; каждый item `href` + `title.ru/en`; `isExternalHref('https://x')===true`, `isExternalHref('/x')===false`; tool-items внешние.
- syllabus-tree / materials-section / страницы — без рендер-теста; tsc + `next build`.

## Гейты
vitest · web tsc · workers tsc (Gotcha 2) · wrangler (Gotcha 1) · `next build` → `out/syllabus/index.html`, `out/en/syllabus/index.html`, `out/materials/agent-charter.md` присутствуют.

## Вне scope
- UI-загрузка/редактирование материалов, поиск, версионирование (CMS-слой — позже).
- Полное извлечение RPG/intake данных (`fb_8f1a05ce1150`).
- Шаблон нового курса (`fb_31371f4dfd19`).
- Рефактор всех 23 brand-вхождений (только домен в SEO/manifest сейчас).

## Критерий готовности
`/syllabus` (RU+EN) в nav: дерево 9 модулей / 38 юнитов + Course Materials (шаблоны+ссылки+инструменты). `lib/course.ts` — единый источник домена для SEO/manifest. Чистые `course`/`materials` покрыты; артефакты в `out/`; все гейты зелёные.
