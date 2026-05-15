# mamaev.coach LMS Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Запустить публичный сайт курса «Точка Сборки» на `mamaev.coach` — Next.js 15 + MDX контент + тема "Модель для сборки" + Cloudflare Pages auto-deploy.

**Architecture:** Проект разделён на 3 ACE-слоя без нумерации. **Knowledge layer** — корневые `.md` файлы (source of truth курса, не трогаем). **Execution layer** — `web/` подпапка со всем Next.js кодом (`output: 'export'`), self-contained. **Meta layer** — `skills/`, `docs/`, `meta.json`. Контент мигрирует в `web/content/ru/*.mdx`. CF Pages запускает build из `web/`.

**Design direction:** ELVTR-hybrid — layout patterns и typography scale взяты с elvtr.com (editorial sections, huge decorative numbers, uppercase labels, split layouts, accordion syllabus, FAQ expand) + тёмная палитра model-kit (`#0a0a0f` bg, `#00ff88` neon accent вместо magenta). Шрифт — Geist Black (900) вместо проприетарного Nekst.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, next-mdx-remote v5 (RSC), gray-matter, lucide-react, Geist font, Cloudflare Pages, Vitest

---

## File Map (ACE Layers)

```
C:\telo\Efforts\Ongoing\MDS_AI_COURSE\
│
│  ── KNOWLEDGE LAYER (source of truth, не трогаем) ──
├── 00-kickstart.md … 06-tools.md
├── CHEATSHEET.md, EXERCISES.md, ROADMAP.md
├── README.md, INDEX.md, PERSONAL-CONTEXT.md
├── my-experiments/, my-templates/, course-feedback/
│
│  ── EXECUTION LAYER (новый, self-contained Next.js) ──
├── web/
│   ├── app/
│   │   ├── layout.tsx                     ← root layout, Geist, data-theme="model-kit"
│   │   ├── globals.css                    ← Tailwind + base resets
│   │   ├── page.tsx                       ← /
│   │   ├── roadmap/page.tsx               ← /roadmap
│   │   ├── lessons/[slug]/page.tsx        ← /lessons/[slug]
│   │   ├── cheatsheet/page.tsx            ← /cheatsheet
│   │   ├── exercises/page.tsx             ← /exercises
│   │   └── feedback/page.tsx              ← /feedback
│   ├── components/
│   │   ├── nav.tsx
│   │   ├── sidebar.tsx
│   │   ├── lesson-layout.tsx
│   │   └── mdx-components.tsx
│   ├── content/                           ← locale-namespaced MDX
│   │   └── ru/                          ← Russian (default). EN → добавить content/en/ + next-intl
│   │       ├── 00-kickstart.mdx … 06-tools.mdx
│   │       ├── cheatsheet.mdx
│   │       ├── exercises.mdx
│   │       └── roadmap.mdx
│   ├── lib/
│   │   ├── content.ts
│   │   └── content.test.ts
│   ├── themes/
│   │   └── model-kit.css
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── postcss.config.mjs
│
│  ── META LAYER ──
├── skills/tochka-sborki-update/SKILL.md  ← fix type/execution (Task 9)
├── docs/superpowers/specs/ + plans/
├── CLAUDE.md
└── meta.json                              ← ENERV registration (Task 9)
```

> **ACE принцип:** Knowledge layer (`.md`) — source of truth для SKILL.md updater.  
> Execution layer (`web/`) — self-contained, имеет свой `package.json` и `git`.  
> При обновлении урока: обновляется `.md` в корне + `.mdx` в `web/content/ru/`.
>
> **i18n принцип:** контент locale-namespaced (`content/ru/`). Routes плоские (`/lessons/[slug]`).  
> При добавлении EN: создать `content/en/` + подключить `next-intl` с `localePrefix: 'as-needed'`.

---

## Task 1: Создать Execution Layer (web/)

**Files:**
- Create: `web/package.json`
- Create: `web/next.config.ts`
- Create: `web/tsconfig.json`
- Create: `web/postcss.config.mjs`
- Create: `web/.gitignore`

- [ ] **Step 1: Создать папку и `web/package.json`**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
mkdir web
```

Создать файл `web/package.json`:

```json
{
  "name": "mamaev-coach",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Установить зависимости**

```bash
cd web
npm install next@latest react@latest react-dom@latest
npm install next-mdx-remote gray-matter lucide-react geist
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D tailwindcss @tailwindcss/postcss postcss
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: Создать `web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Создать `web/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default config
```

- [ ] **Step 5: Создать `web/postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

- [ ] **Step 6: Создать `web/.gitignore`**

```
node_modules/
.next/
out/
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 7: Добавить vitest config в `package.json`**

Добавить после `"devDependencies"`:

```json
,
"vitest": {
  "environment": "node"
}
```

- [ ] **Step 8: Проверить что Next.js стартует**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run dev
```

Ожидается: `Next.js 15 ready on http://localhost:3000` (страница 404 — нормально, app/ пустой).

- [ ] **Step 9: git init в web/**

```bash
git init
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs .gitignore
git commit -m "chore: init Next.js 15 execution layer"
```

---

## Task 2: Theme system

**Files:**
- Create: `web/themes/model-kit.css`
- Create: `web/lib/themes.ts`
- Create: `web/app/globals.css`
- Create: `web/app/layout.tsx`

Все команды выполнять из `C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web\`.

- [ ] **Step 1: Создать `web/themes/model-kit.css`**

```css
[data-theme="model-kit"] {
  /* Core palette */
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-surface: #16161f;
  --text-primary: #e8e8f0;
  --text-secondary: #9090a8;
  --text-accent: #00ff88;
  --border-color: #2a2a3a;
  --border-accent: #00ff8840;
  --font-mono: 'Geist Mono', monospace;
  --radius: 4px;

  /* ELVTR-hybrid: editorial layout tokens */
  --display-size: clamp(2.8rem, 7vw, 6.5rem);  /* hero h1 */
  --section-label-size: 0.7rem;                  /* uppercase section labels */
  --number-size: clamp(5rem, 14vw, 11rem);       /* decorative syllabus numbers */
  --section-gap: 5rem;                           /* breathing room between sections */
  --accent-line: 3px solid var(--text-accent);   /* thin neon line before card titles */
  --content-max: 1100px;
}
```

- [ ] **Step 2: Создать `web/lib/themes.ts`**

```typescript
export interface Theme {
  id: string
  label: string
}

export const themes: Theme[] = [
  { id: 'model-kit', label: 'Модель для сборки' },
]

export const defaultTheme = 'model-kit'
```

- [ ] **Step 3: Создать `web/app/globals.css`**

```css
@import "tailwindcss";
@import "../themes/model-kit.css";

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

a {
  color: var(--text-accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

pre, code {
  font-family: var(--font-mono);
}
```

- [ ] **Step 4: Создать `web/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { defaultTheme } from '@/lib/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={defaultTheme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Проверить build**

```bash
npm run build
```

Ожидается: успешный build, `out/` создан.

- [ ] **Step 6: Коммит**

```bash
git add app/ themes/ lib/themes.ts
git commit -m "feat: theme system + model-kit CSS + root layout"
```

---

## Task 3: Миграция контента (MD → MDX с frontmatter)

Оригинальные `.md` файлы остаются в корне (Knowledge layer) нетронутыми. В `web/content/ru/` создаём `.mdx` копии с frontmatter. Папка `ru/` — первый locale, структура готова к добавлению `en/` без рефактора.

**Files:**
- Create: `web/content/ru/01-introduction.mdx` (первым — нужен для тестов в Task 4)
- Create: `web/content/ru/00-kickstart.mdx`
- Create: `web/content/ru/02-setup-guide.mdx` … `web/content/ru/06-tools.mdx`
- Create: `web/content/ru/cheatsheet.mdx`
- Create: `web/content/ru/exercises.mdx`
- Create: `web/content/ru/roadmap.mdx`

- [ ] **Step 1: Создать `web/content/ru/01-introduction.mdx`**

Скопировать содержимое `../01-introduction.md` (Knowledge layer), добавить frontmatter:

```mdx
---
title: "Meeting 1: Знакомство"
description: "Software 3.0 и почему это меняет всё"
order: 1
duration: "30 мин"
level: 1
assignment: "Открой Claude Code и напиши свой первый промпт. Попроси его объяснить разницу между Software 1.0, 2.0 и 3.0. Сохрани ответ в my-experiments/01-first-prompt.md"
---

[содержимое 01-introduction.md без изменений]
```

- [ ] **Step 2: Создать остальные lesson файлы**

`web/content/ru/00-kickstart.mdx` — скопировать из `../00-kickstart.md`:
```yaml
---
title: "Meeting 0: Kickstart"
description: "Карта местности для нонкодеров"
order: 0
duration: "20–30 мин"
level: 0
assignment: "Установи Claude.ai на телефон. Задай ему один вопрос о своей работе и посмотри, насколько полезен ответ."
---
```

`web/content/ru/02-setup-guide.mdx` — скопировать из `../02-setup-guide.md`:
```yaml
---
title: "Meeting 2: Базовый сетап"
description: "Настройка рабочей среды от А до Я"
order: 2
duration: "2–3 часа"
level: 2
assignment: "Установи все инструменты из чеклиста Meeting 2. Сделай скриншот терминала с запущенным Claude Code и сохрани в my-experiments/02-setup-done.png"
---
```

`web/content/ru/03-prompt-engineering.mdx` — скопировать из `../03-prompt-engineering.md`:
```yaml
---
title: "Meeting 3: Промпт-инжиниринг"
description: "Четыре сдвига в работе с агентами"
order: 3
duration: "1–2 часа"
level: 3
assignment: "Напиши промпт для задачи из своей реальной работы, используя структуру Role + Context + Task + Format. Сравни результат с обычным запросом. Сохрани оба варианта в my-experiments/03-prompt-comparison.md"
---
```

`web/content/ru/04-context-memory.mdx` — скопировать из `../04-context-memory.md`:
```yaml
---
title: "Meeting 4: Контекст и память"
description: "Как агенты удерживают информацию"
order: 4
duration: "1 час"
level: 4
assignment: "Создай свой CLAUDE.md в рабочей папке с личным контекстом (кто ты, что делаешь, стиль ответов). Протестируй как он меняет поведение агента."
---
```

`web/content/ru/05-audio-pipeline.mdx` — скопировать из `../05-audio-pipeline.md`:
```yaml
---
title: "Meeting 5: Audio-to-Text Pipeline"
description: "Практический pipeline: скрапинг → анализ → insights"
order: 5
duration: "2–3 часа"
level: 5
assignment: "Собери свой pipeline: возьми любую публичную страницу (статья, блог), скрапи через Firecrawl, попроси агента выделить 3 ключевых инсайта. Сохрани результат в my-experiments/05-pipeline-result.md"
---
```

`web/content/ru/06-tools.mdx` — скопировать из `../06-tools.md`:
```yaml
---
title: "Meeting 6: Инструменты расширения"
description: "MCP-серверы, Agent Skills, Hooks и Superpowers workflow"
order: 6
duration: "2–3 часа"
level: 6
assignment: "Подключи один MCP-сервер на выбор (GitHub, Notion, или любой другой). Напиши skill-файл для задачи из своей работы и протестируй его через /skill."
---
```

`web/content/ru/cheatsheet.mdx` — скопировать из `../CHEATSHEET.md`:
```yaml
---
title: "Шпаргалка"
description: "Быстрая справка по командам и паттернам Claude Code"
order: 100
duration: ""
level: 0
---
```

`web/content/ru/exercises.mdx` — скопировать из `../EXERCISES.md`:
```yaml
---
title: "Практические упражнения"
description: "8 упражнений для закрепления уровней 1–4"
order: 101
duration: ""
level: 0
---
```

`web/content/ru/roadmap.mdx` — скопировать из `../ROADMAP.md`:
```yaml
---
title: "Roadmap: Vibe Coder / AI Generalist"
description: "Карта пути от нонкодера до AI-generalist'а — 7 уровней"
order: 99
duration: ""
level: 0
---
```

- [ ] **Step 3: Коммит**

```bash
git add content/
git commit -m "feat: migrate course content to MDX with frontmatter"
```

---

## Task 4: lib/content.ts — TDD

**Files:**
- Create: `web/lib/content.test.ts`
- Create: `web/lib/content.ts`

Все команды выполнять из `web/`.

- [ ] **Step 1: Написать падающие тесты**

Создать `lib/content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getAllLessons, getLessonBySlug, getPageContent } from './content'

describe('getAllLessons', () => {
  it('returns only numbered lesson files (00-06)', () => {
    const lessons = getAllLessons()
    expect(lessons.length).toBe(7)
    for (const lesson of lessons) {
      expect(lesson.slug).toMatch(/^\d{2}-/)
    }
  })

  it('lessons are sorted by order ascending', () => {
    const lessons = getAllLessons()
    for (let i = 1; i < lessons.length; i++) {
      expect(lessons[i].order).toBeGreaterThan(lessons[i - 1].order)
    }
  })

  it('each lesson has required fields', () => {
    const lessons = getAllLessons()
    for (const lesson of lessons) {
      expect(typeof lesson.slug).toBe('string')
      expect(typeof lesson.title).toBe('string')
      expect(typeof lesson.description).toBe('string')
      expect(typeof lesson.order).toBe('number')
      expect(typeof lesson.duration).toBe('string')
      expect(typeof lesson.level).toBe('number')
    }
  })
})

describe('getLessonBySlug', () => {
  it('returns content and meta for 01-introduction', () => {
    const result = getLessonBySlug('01-introduction')
    expect(result.content).toBeTruthy()
    expect(result.meta.title).toBe('Meeting 1: Знакомство')
    expect(result.meta.order).toBe(1)
  })

  it('throws for unknown slug', () => {
    expect(() => getLessonBySlug('99-nonexistent')).toThrow()
  })
})

describe('getPageContent', () => {
  it('returns content and meta for cheatsheet', () => {
    const result = getPageContent('cheatsheet')
    expect(result.content).toBeTruthy()
    expect(result.meta.title).toBeTruthy()
  })

  it('returns content and meta for roadmap', () => {
    const result = getPageContent('roadmap')
    expect(result.content).toBeTruthy()
  })
})
```

- [ ] **Step 2: Запустить — убедиться что падает**

```bash
npm test
```

Ожидается: `FAIL — Cannot find module './content'`

- [ ] **Step 3: Реализовать `lib/content.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

function contentDir(locale: string) {
  return path.join(process.cwd(), 'content', locale)
}

export interface LessonMeta {
  slug: string
  title: string
  description: string
  order: number
  duration: string
  level: number
}

export interface PageMeta {
  title: string
  description?: string
  [key: string]: unknown
}

export function getAllLessons(locale = 'ru'): LessonMeta[] {
  const dir = contentDir(locale)
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx') && /^\d{2}-/.test(f))

  return files
    .map(filename => {
      const slug = filename.replace('.mdx', '')
      const raw = fs.readFileSync(path.join(dir, filename), 'utf8')
      const { data } = matter(raw)
      return { slug, ...data } as LessonMeta
    })
    .sort((a, b) => a.order - b.order)
}

export function getLessonBySlug(slug: string, locale = 'ru'): { meta: LessonMeta; content: string } {
  const filepath = path.join(contentDir(locale), `${slug}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Lesson not found: ${slug}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { meta: { slug, ...data } as LessonMeta, content }
}

export function getPageContent(name: string, locale = 'ru'): { meta: PageMeta; content: string } {
  const filepath = path.join(contentDir(locale), `${name}.mdx`)
  if (!fs.existsSync(filepath)) {
    throw new Error(`Page not found: ${name}`)
  }
  const raw = fs.readFileSync(filepath, 'utf8')
  const { data, content } = matter(raw)
  return { meta: data as PageMeta, content }
}
```

- [ ] **Step 4: Запустить — убедиться что зелёные**

```bash
npm test
```

Ожидается: `7 tests passed`

- [ ] **Step 5: Коммит**

```bash
git add lib/
git commit -m "feat: content lib with getAllLessons, getLessonBySlug, getPageContent"
```

---

## Task 5: Компоненты — Nav, Sidebar, LessonLayout, MDX, AssignmentBlock

**Files:**
- Create: `web/components/nav.tsx`
- Create: `web/components/sidebar.tsx`
- Create: `web/components/lesson-layout.tsx`
- Create: `web/components/mdx-components.tsx`
- Create: `web/components/assignment-block.tsx`

Все команды из `web/`.

Также обновить `LessonMeta` в `lib/content.ts` — добавить поле `assignment?: string`.

- [ ] **Step 1: Создать `components/nav.tsx`**

```typescript
import Link from 'next/link'

export function Nav() {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '0 1.5rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ Точка Сборки
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
        <Link href="/roadmap/" style={{ color: 'var(--text-secondary)' }}>Roadmap</Link>
        <Link href="/cheatsheet/" style={{ color: 'var(--text-secondary)' }}>Шпаргалка</Link>
        <Link href="/feedback/" style={{ color: 'var(--text-secondary)' }}>Фидбек</Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Создать `components/sidebar.tsx`**

```typescript
import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'

interface SidebarProps {
  lessons: LessonMeta[]
  currentSlug?: string
}

export function Sidebar({ lessons, currentSlug }: SidebarProps) {
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
      {lessons.map(lesson => {
        const active = lesson.slug === currentSlug
        return (
          <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
            display: 'block',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
            background: active ? 'var(--border-accent)' : 'transparent',
            borderLeft: active ? '2px solid var(--text-accent)' : '2px solid transparent',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', marginRight: '0.5rem', fontSize: '0.75rem' }}>
              L{lesson.level}
            </span>
            {lesson.title}
          </Link>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 3: Создать `components/lesson-layout.tsx`**

```typescript
import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'
import { Nav } from './nav'
import { Sidebar } from './sidebar'

interface LessonLayoutProps {
  meta: LessonMeta
  lessons: LessonMeta[]
  children: React.ReactNode
}

export function LessonLayout({ meta, lessons, children }: LessonLayoutProps) {
  const idx = lessons.findIndex(l => l.slug === meta.slug)
  const prev = lessons[idx - 1]
  const next = lessons[idx + 1]

  return (
    <>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar lessons={lessons} currentSlug={meta.slug} />
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
          }}>
            {prev
              ? <Link href={`/lessons/${prev.slug}/`} style={{ fontSize: '0.875rem' }}>← {prev.title}</Link>
              : <span />}
            {next
              ? <Link href={`/lessons/${next.slug}/`} style={{ fontSize: '0.875rem' }}>{next.title} →</Link>
              : <span />}
          </div>
        </main>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Создать `components/mdx-components.tsx`**

```typescript
import type { MDXComponents } from 'mdx/types'

export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: '1.375rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-accent)' }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ lineHeight: 1.75, marginBottom: '1rem', color: 'var(--text-primary)' }}>{children}</p>
  ),
  code: ({ children }) => (
    <code style={{
      fontFamily: 'var(--font-mono)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: '3px',
      padding: '0.1em 0.4em',
      fontSize: '0.875em',
      color: 'var(--text-accent)',
    }}>{children}</code>
  ),
  pre: ({ children }) => (
    <pre style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius)',
      padding: '1rem',
      overflow: 'auto',
      marginBottom: '1rem',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.875rem',
    }}>{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote style={{
      borderLeft: '3px solid var(--text-accent)',
      paddingLeft: '1rem',
      margin: '1rem 0',
      color: 'var(--text-secondary)',
      fontStyle: 'italic',
    }}>{children}</blockquote>
  ),
  ul: ({ children }) => (
    <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem', lineHeight: 1.75 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ paddingLeft: '1.5rem', marginBottom: '1rem', lineHeight: 1.75 }}>{children}</ol>
  ),
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ borderBottom: '2px solid var(--border-color)', padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{children}</td>
  ),
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

Ожидается: нет ошибок.

- [ ] **Step 5.5: Создать `components/assignment-block.tsx`**

```typescript
interface AssignmentBlockProps {
  text: string
}

export function AssignmentBlock({ text }: AssignmentBlockProps) {
  return (
    <div style={{
      marginTop: '3rem',
      padding: '1.5rem',
      background: 'var(--bg-surface)',
      border: 'var(--accent-line)',
      borderRadius: 'var(--radius)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--section-label-size)',
        color: 'var(--text-accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: '0.75rem',
      }}>
        ⬡ Практика
      </div>
      <p style={{ color: 'var(--text-primary)', lineHeight: 1.7 }}>{text}</p>
    </div>
  )
}
```

В `components/lesson-layout.tsx` импортировать `AssignmentBlock` и добавить после `{children}`:

```typescript
import { AssignmentBlock } from './assignment-block'

// внутри LessonLayout после {children}:
{meta.assignment && <AssignmentBlock text={meta.assignment} />}
```

В `lib/content.ts` добавить `assignment?: string` в `LessonMeta`:

```typescript
export interface LessonMeta {
  slug: string
  title: string
  description: string
  order: number
  duration: string
  level: number
  assignment?: string
}
```

- [ ] **Step 6: Коммит**

```bash
git add components/
git commit -m "feat: Nav, Sidebar, LessonLayout, MDX components, AssignmentBlock"
```

---

## Task 6: Lessons route — /lessons/[slug]

**Files:**
- Create: `web/app/lessons/[slug]/page.tsx`

- [ ] **Step 1: Создать `app/lessons/[slug]/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllLessons, getLessonBySlug } from '@/lib/content'
import { LessonLayout } from '@/components/lesson-layout'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllLessons().map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { meta } = getLessonBySlug(slug)
  return { title: `${meta.title} — Точка Сборки`, description: meta.description }
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params
  const { meta, content } = getLessonBySlug(slug)
  const lessons = getAllLessons()

  return (
    <LessonLayout meta={meta} lessons={lessons}>
      <MDXRemote source={content} components={mdxComponents} />
    </LessonLayout>
  )
}
```

- [ ] **Step 2: Проверить build**

```bash
npm run build
```

Ожидается: `out/lessons/00-kickstart/`, `out/lessons/01-introduction/` … `out/lessons/06-tools/` созданы.

- [ ] **Step 3: Проверить dev**

```bash
npm run dev
```

Открыть `http://localhost:3000/lessons/01-introduction/` — тёмный сайт с контентом и sidebar.

- [ ] **Step 4: Коммит**

```bash
git add app/lessons/
git commit -m "feat: lessons dynamic route with MDX + LessonLayout"
```

---

## Task 7: Home page (/) и Roadmap — ELVTR-hybrid dark layout

**Files:**
- Create: `web/app/page.tsx`
- Create: `web/app/roadmap/page.tsx`

Структура home page (ELVTR sections, тёмная палитра):
1. **Hero** — огромный заголовок + stats bar + CTA кнопка
2. **"Этот курс для тебя, если..."** — 2-col grid с neon accent line
3. **Программа** — ELVTR syllabus: большой серый номер + neon label + заголовок + accordion
4. **FAQ** — expand/collapse, тот же паттерн
5. **Об авторе** — split layout

- [ ] **Step 1: Создать `app/page.tsx`**

```typescript
import Link from 'next/link'
import { getAllLessons } from '@/lib/content'
import { Nav } from '@/components/nav'

const FOR_WHO = [
  {
    title: 'Хочешь понять AI изнутри',
    body: 'Не просто пользоваться ChatGPT, а строить с ним — pipeline\'ы, агентов, автоматизации.',
  },
  {
    title: 'Уже пробовал, но не систематизировал',
    body: 'Промпты работают хаотично. Хочешь выстроить процесс, который масштабируется.',
  },
  {
    title: 'Строишь AI-продукт',
    body: 'Нужен практический фундамент: Claude Code, MCP, агенты, деплой — без воды.',
  },
  {
    title: 'Ценишь суверенитет',
    body: 'Walk-away экономика, open-source стек, никаких lock-in платформ.',
  },
]

const FAQ = [
  {
    q: 'Нужно ли уметь программировать?',
    a: 'Нет. Vibe coding — это подход где AI пишет код, а ты управляешь. Мы начинаем с нуля.',
  },
  {
    q: 'Что такое vibe coding?',
    a: 'Разработка в потоке: ты описываешь задачу, AI реализует, ты итерируешь. Скорость ×10.',
  },
  {
    q: 'Сколько времени нужно в неделю?',
    a: '30–60 минут на встречу + практика. Курс самостоятельный, без дедлайнов.',
  },
  {
    q: 'Чем отличается от других AI-курсов?',
    a: 'Мы не обзор нейросетей. Мы — практический стек: Claude Code, MCP, агенты, деплой, автоматизация.',
  },
]

export default function HomePage() {
  const lessons = getAllLessons()

  return (
    <>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          ⬡ Открытый курс · Бесплатно
        </div>
        <h1 style={{
          fontSize: 'var(--display-size)',
          fontWeight: 900,
          lineHeight: 0.95,
          color: 'var(--text-primary)',
          marginBottom: '2rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
        }}>
          Точка<br />Сборки
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          Курс по vibe-кодингу в потоке. От нонкодера до AI-generalist&apos;а — Claude Code, агенты, автоматизация, деплой.
        </p>

        {/* Stats bar */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {[
            ['7', 'встреч'],
            ['~12', 'часов'],
            ['8', 'упражнений'],
            ['$0', 'стоимость'],
          ].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-accent)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>

        <Link href={`/lessons/${lessons[0].slug}/`} style={{
          display: 'inline-block',
          padding: '0.875rem 2.5rem',
          background: 'var(--text-accent)',
          color: '#000',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius)',
        }}>
          Начать →
        </Link>
      </section>

      {/* ── ДЛЯ КОГО ─────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            Для кого
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '3rem',
            lineHeight: 1,
          }}>
            Этот курс для тебя, если...
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {FOR_WHO.map(item => (
              <div key={item.title} style={{ paddingTop: '1rem', borderTop: 'var(--accent-line)' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.03em',
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПРОГРАММА (ELVTR syllabus) ───────────────────────── */}
      <section style={{ padding: 'var(--section-gap) 2rem' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '3rem',
          }}>
            Программа курса · {lessons.length} встреч
          </div>
          {lessons.map(lesson => (
            <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
              display: 'grid',
              gridTemplateColumns: '6rem 1fr auto',
              gap: '1.5rem',
              alignItems: 'start',
              padding: '1.5rem 0',
              borderBottom: '1px solid var(--border-color)',
              color: 'inherit',
              transition: 'opacity 0.2s',
            }}>
              <span style={{
                fontSize: 'var(--number-size)',
                fontWeight: 900,
                color: 'var(--border-color)',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
                userSelect: 'none',
              }}>
                {String(lesson.level).padStart(2, '0')}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--section-label-size)',
                  color: 'var(--text-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '0.4rem',
                }}>
                  Level {lesson.level} · {lesson.duration}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem',
                }}>
                  {lesson.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lesson.description}</p>
              </div>
              <span style={{ color: 'var(--text-accent)', fontSize: '1.5rem', lineHeight: 1 }}>+</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '2rem',
          }}>
            Вопросы
          </div>
          {FAQ.map(item => (
            <details key={item.q} style={{
              borderBottom: '1px solid var(--border-color)',
              padding: '1.25rem 0',
            }}>
              <summary style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                {item.q}
                <span style={{ color: 'var(--text-accent)', fontSize: '1.25rem' }}>+</span>
              </summary>
              <p style={{
                marginTop: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                fontSize: '0.9rem',
              }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── ОБ АВТОРЕ ────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--section-label-size)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '1rem',
            }}>
              Об авторе
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 0.95,
              marginBottom: '1.5rem',
            }}>
              Саша<br />Мамаев
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' }}>
              Vibe coder, AI builder, коуч. Строю системы на Claude Code + агентах. Курс — дистилляция того, что работает на практике.
            </p>
            <Link href="/feedback/" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Оставить фидбек →
            </Link>
          </div>
          <div style={{
            aspectRatio: '4/5',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
          }}>
            [фото]
          </div>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 2: Создать `app/roadmap/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageContent } from '@/lib/content'
import { Nav } from '@/components/nav'
import { mdxComponents } from '@/components/mdx-components'

export const metadata: Metadata = {
  title: 'Roadmap — Точка Сборки',
  description: 'Карта пути от нонкодера до AI-generalist\'а — 7 уровней',
}

export default async function RoadmapPage() {
  const { content } = getPageContent('roadmap')
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 3rem' }}>
        <MDXRemote source={content} components={mdxComponents} />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Dev check**

```bash
npm run dev
```

Проверить: `http://localhost:3000/` — hero с большими числами, секция "для кого" с neon lines, ELVTR-syllabus с огромными номерами, FAQ expand, секция автора. `http://localhost:3000/roadmap/` — таблица уровней.

- [ ] **Step 4: Коммит**

```bash
git add app/page.tsx app/roadmap/
git commit -m "feat: ELVTR-hybrid dark home page — hero, для кого, syllabus, FAQ, автор"
```

---

## Task 8: Вторичные страницы

**Files:**
- Create: `web/app/cheatsheet/page.tsx`
- Create: `web/app/exercises/page.tsx`
- Create: `web/app/feedback/page.tsx`

- [ ] **Step 1: Создать `app/cheatsheet/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageContent } from '@/lib/content'
import { Nav } from '@/components/nav'
import { mdxComponents } from '@/components/mdx-components'

export const metadata: Metadata = {
  title: 'Шпаргалка — Точка Сборки',
  description: 'Быстрая справка по командам и паттернам Claude Code',
}

export default async function CheatsheetPage() {
  const { content } = getPageContent('cheatsheet')
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 3rem' }}>
        <MDXRemote source={content} components={mdxComponents} />
      </main>
    </>
  )
}
```

- [ ] **Step 2: Создать `app/exercises/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageContent } from '@/lib/content'
import { Nav } from '@/components/nav'
import { mdxComponents } from '@/components/mdx-components'

export const metadata: Metadata = {
  title: 'Упражнения — Точка Сборки',
  description: '8 практических упражнений для закрепления уровней 1–4',
}

export default async function ExercisesPage() {
  const { content } = getPageContent('exercises')
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 3rem' }}>
        <MDXRemote source={content} components={mdxComponents} />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Создать `app/feedback/page.tsx`**

Форма по структуре Post-Class Evaluation Survey (из OneDrive/Eval block). Phase 1 — HTML form с `action` заглушкой; Phase 2 — POST → n8n webhook.

```typescript
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'

export const metadata: Metadata = {
  title: 'Фидбек — Точка Сборки',
  description: 'Оставь отзыв о курсе',
}

const LIKERT = ['1', '2', '3', '4', '5']

function LikertScale({ name, label }: { name: string; label: string }) {
  return (
    <fieldset style={{ border: 'none', marginBottom: '2rem' }}>
      <legend style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '5rem' }}>Не согласен</span>
        {LIKERT.map(v => (
          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input type="radio" name={name} value={v} required style={{ accentColor: 'var(--text-accent)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>
          </label>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '4rem' }}>Согласен</span>
      </div>
    </fieldset>
  )
}

export default function FeedbackPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Фидбек
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
        }}>
          Оцени<br />курс
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.75 }}>
          Твой отзыв помогает курсу самообновляться. 2 минуты — и урок станет лучше для следующего студента.
        </p>

        {/* Phase 1: static form, Phase 2: action → n8n webhook */}
        <form action="#" method="POST" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Q1 */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Какую встречу ты только что прошёл?
            </label>
            <select name="lesson" required style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
            }}>
              <option value="">— выбери встречу —</option>
              {['Meeting 0: Kickstart', 'Meeting 1: Знакомство', 'Meeting 2: Сетап',
                'Meeting 3: Промпты', 'Meeting 4: Контекст', 'Meeting 5: Pipeline',
                'Meeting 6: Инструменты'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Q2-Q4: Likert */}
          <LikertScale name="recommend" label='"Я бы порекомендовал этот курс другим."' />
          <LikertScale name="impact" label='"То, что я узнал, положительно повлияет на мою работу."' />
          <LikertScale name="apply" label='"Я смогу применить это на практике уже сейчас."' />

          {/* Q5: open */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Что было непонятно или что стоит улучшить?
            </label>
            <textarea name="unclear" rows={4} style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }} />
          </div>

          {/* Q6: open */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Любые другие мысли (опционально)
            </label>
            <textarea name="other" rows={3} style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }} />
          </div>

          <button type="submit" style={{
            padding: '0.875rem 2.5rem',
            background: 'var(--text-accent)',
            color: '#000',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}>
            Отправить →
          </button>
        </form>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Полный build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: в `web/out/` есть `index.html`, `roadmap/`, `lessons/`, `cheatsheet/`, `exercises/`, `feedback/`.

- [ ] **Step 5: Коммит**

```bash
git add app/cheatsheet/ app/exercises/ app/feedback/
git commit -m "feat: cheatsheet, exercises, feedback pages"
```

---

## Task 9: DeepVista Compliance (Meta layer)

**Files:**
- Modify: `skills/tochka-sborki-update/SKILL.md` ← в корне MDS_AI_COURSE
- Create: `meta.json` ← в корне MDS_AI_COURSE

- [ ] **Step 1: Починить SKILL.md**

В `skills/tochka-sborki-update/SKILL.md` заменить frontmatter:

```yaml
---
name: tochka-sborki-update
type: workflow
execution: stateless
description: >
  Update, edit, and extend the Точка Сборки course project — add new Meetings, insert sections into existing lessons,
  fix formatting, and automatically cascade changes to INDEX.md, README.md, CHEATSHEET.md, and version metadata.
  Use this skill whenever the user wants to add content to Точка Сборки, create a new Meeting, update course structure,
  fix a lesson, add exercises, update the cheatsheet, or make any modification to the course files.
  Also trigger when the user mentions "добавь в курс", "новый Meeting", "обнови индекс", "поправь урок",
  "добавь секцию", "обнови шпаргалку", or references any XX-topic.md file in the Точка Сборки project.
---
```

- [ ] **Step 2: Создать `meta.json`**

```json
{
  "name": "tochka-sborki",
  "type": "project",
  "team": "ai",
  "status": "active",
  "priority": "P1",
  "domain": ["education", "web"],
  "tech": ["nextjs", "mdx", "cloudflare", "typescript", "markdown"],
  "confidentiality": "public"
}
```

- [ ] **Step 3: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
git add ../skills/ ../meta.json
git commit -m "chore: DeepVista compliance — SKILL.md type/execution + ENERV meta.json"
```

---

## Task 10: GitHub + Cloudflare Pages deploy

- [ ] **Step 1: Создать GitHub репо и запушить**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
gh repo create master5d/tochka-sborki --public --source=. --push
```

Если `gh` не установлен: GitHub.com → New repo → `tochka-sborki` → public, затем:

```bash
git remote add origin https://github.com/master5d/tochka-sborki.git
git push -u origin main
```

- [ ] **Step 2: Подключить CF Pages**

1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages
2. Connect to Git → `master5d/tochka-sborki`
3. Build settings:
   - **Framework preset:** None (custom)
   - **Root directory:** `web`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
4. Save and Deploy → дождаться (~2 мин)
5. Скопировать URL: `tochka-sborki.pages.dev`

- [ ] **Step 3: DNS в Cloudflare**

1. CF Dashboard → mamaev.coach → DNS → Add record:
   - Type: `CNAME`, Name: `@`, Target: `tochka-sborki.pages.dev`, Proxy: ✅
2. CF Pages → Custom Domains → Add → `mamaev.coach`

- [ ] **Step 4: Проверить**

```bash
curl -I https://mamaev.coach
```

Ожидается: `HTTP/2 200`. Открыть в браузере — тёмный сайт курса.

- [ ] **Step 5: Проверить auto-deploy**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
echo "" >> README.md
git add README.md && git commit -m "chore: test auto-deploy" && git push
```

CF Pages Dashboard — новый деплой запустился автоматически.

---

## Self-review — покрытие спека

| Требование | Task |
|------------|------|
| Next.js 15 + `output: 'export'` | 1 |
| Тема "Модель для сборки" | 2 |
| Themes через CSS custom props | 2 |
| Контент MD → MDX с frontmatter | 3 |
| lib/content.ts с тестами (TDD) | 4 |
| Nav + Sidebar + LessonLayout + prev/next | 5 |
| `/lessons/[slug]` + generateStaticParams | 6 |
| `/` (home + hero) + `/roadmap` | 7 |
| `/cheatsheet` + `/exercises` + `/feedback` | 8 |
| DeepVista SKILL.md fix + meta.json | 9 |
| GitHub → CF Pages CI/CD + DNS | 10 |
| Geist font | 2 |
| SEO metadata | 6–8 |
| Feedback форма (Phase 1 статичная) | 8 |
| Оригинальные .md файлы не тронуты (Knowledge layer) | 3 |
| ACE layers: Knowledge / Execution / Meta | File Map |
