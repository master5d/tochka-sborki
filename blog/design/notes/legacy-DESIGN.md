# blog — DESIGN.md

> Наследует `GLOBAL_DESIGN.md` NAUTILUS (C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\GLOBAL_DESIGN.md).
> Локальные расширения фиксируют ФАКТИЧЕСКУЮ визуальную ДНК проекта; core brand
> identity не переопределяется без justification (DesOps-Standard.md §4 File Organization).

## Inherited
- Tokens: см. `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\tokens.json` (seed #00D1FF, Inter/JetBrains Mono, spacing unit 4px)

## Local Identity (onboarded 2026-07-07)

Sources: `themes/model-kit.css` (SHARED CHROME — зеркало hub/themes/model-kit.css),
`app/globals.css`, `app/layout.tsx`, `components/blog/blog-prose.module.css`,
`components/blog/post-layout.tsx`.

**«Model kit / long-read»** — отдельный Next-апп блога mamaev.coach/blog/*, визуально
= hub (канонический токен-слой см. `../hub/DESIGN.md`): та же двух-темная палитра
(`--bg-primary #0a0a0f` dark / `#f4f1ea` light, accent `#00d1ff`/`#0077cc`,
phase-ряд, `--radius 4px`, `--content-max 1100px`).

**Дивергенции от hub (delta-only):**
- `themes/model-kit.css` = копия hub-версии МИНУС hub-only `--accent-gradient` /
  `--hero-glow` (hero-эффекты в блоге не используются). Sync вручную, маркер
  `// SHARED CHROME`.
- **+Display-шрифт Unbounded** (`--font-display`, next/font) для заголовков
  постов — «constructivist plates»: `h2` weight 900, `clamp(1.6rem,4vw,2.4rem)`,
  letter-spacing −0.035em, hairline `border-top`; body Geist `1.125rem/1.62`
  (long-read просодия), lead-строка `clamp(1.5rem,4vw,2.1rem)`.
- Проза — CSS-modules (`blog-prose.module.css`, `Prologue.module.css`), не
  Tailwind-утилиты; emphasis приглушён (`strong` c `border-bottom` вместо цвета).
- Пост-графика: knowledge-graph `/blog/graph`, цвет узлов по `tags[0]`.
- **Identity preserved** — акцент уже = SOVRN-cyan; будущие визуальные дивергенции
  от hub логировать здесь delta-only.