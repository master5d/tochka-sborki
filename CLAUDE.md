# Project Context

## Проект
Точка Сборки — открытый курс по вайб-кодингу в потоке. Освоение Claude Code и агентного программирования. 7 встреч + упражнения + шпаргалка. Язык контента — русский.

## Структура
```
ROADMAP.md              — Карта 7 уровней Vibe Coder / AI Generalist
00-kickstart.md         — Meeting 0 (опционально): карта местности для нонкодеров
01-introduction.md      — Meeting 1: Software 3.0, четыре сдвига
02-setup-guide.md       — Meeting 2: Установка инструментов (Warp, Claude Code, Git, Marp)
03-prompt-engineering.md — Meeting 3: Промпт-инжиниринг, магические слова
04-context-memory.md    — Meeting 4: Контекст, память, агенты
05-audio-pipeline.md    — Meeting 5: Pipeline скрапинг → анализ → insights
06-tools.md             — Meeting 6: MCP-серверы, Agent Skills, Hooks, Superpowers
EXERCISES.md            — 8 практических упражнений
CHEATSHEET.md           — Быстрая справка по командам
INDEX.md                — Полный навигатор по курсу
README.md               — Обзор и путь обучения
PERSONAL-CONTEXT.md     — Шаблон профиля студента
my-experiments/         — Рабочая папка студента (шаблоны, результаты)
my-templates/           — Шаблоны для работы
course-feedback/        — Author layer feedback-петли (submissions/, digests/, README)
docs/superpowers/       — Spec'ы и планы (brainstorming, writing-plans)
web/                    — Next.js 16 LMS сайт (mamaev.coach), см. web/README.md
  web/app/              — App Router страницы
  web/content/ru/       — MDX-версии уроков с frontmatter
  web/components/       — Nav, Sidebar, LessonLayout, MDX-компоненты
  web/lib/              — content.ts (getAllLessons), тесты
  web/public/           — статика (author.jpg)
.github/workflows/      — deploy.yml: GitHub Actions → CF Pages CI/CD
```

## Стек

### Контент (Markdown)
- Markdown (весь контент курса)
- Marp (конвертация .md → слайды HTML/PDF/PPTX)
- Firecrawl (веб-скрапинг в Meeting 5)

### Web / LMS (папка `web/`)
- Next.js 16 App Router, `output: 'export'` (статичный сайт)
- MDX (`next-mdx-remote`) — контент из `web/content/ru/*.mdx`
- CSS Custom Properties + Tailwind 4 — темы через `data-theme` атрибут
- Geist Mono — основной моноширинный шрифт
- Cloudflare Pages — хостинг (`mamaev.coach`)
- GitHub Actions — CI/CD (`.github/workflows/deploy.yml`)
- Vitest — тесты (`web/lib/content.test.ts`)

Контент `.mdx` в `web/content/ru/` — копии уроков с frontmatter (title, description, level, duration, order).

## Инструкции для Claude Code
- Весь контент пишется на **русском языке**
- Формат файлов — Markdown с emoji-заголовками
- Нумерация файлов: `XX-topic.md` (01, 02, 03...)
- Студенческие файлы → `my-experiments/`
- Шаблоны → `my-templates/`
- При добавлении нового Meeting обновлять: INDEX.md, README.md
- Сохранять единый стиль: секции с emoji, таблицы, чеклисты `- [ ]`, blockquote tips `> 💡`
- Лимит CLAUDE.md ~200 строк
- При обновлении урока (.md) — обновить соответствующий .mdx в `web/content/ru/`
- Деплой автоматический: `git push main` → CI запускается автоматически
