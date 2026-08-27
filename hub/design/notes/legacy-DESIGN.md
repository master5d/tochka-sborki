# hub — DESIGN.md

> Наследует `GLOBAL_DESIGN.md` NAUTILUS (C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\GLOBAL_DESIGN.md).
> Локальные расширения фиксируют ФАКТИЧЕСКУЮ визуальную ДНК проекта; core brand
> identity не переопределяется без justification (DesOps-Standard.md §4 File Organization).

## Inherited
- Tokens: см. `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\tokens.json` (seed #00D1FF, Inter/JetBrains Mono, spacing unit 4px)

## Local Identity (onboarded 2026-07-07)

Sources: `themes/model-kit.css` (единый токен-слой, тема через `data-theme`),
`app/globals.css` (импортит `@desops/ui-kit/globals.css`), `components/site-header.tsx`,
`components/home-page.tsx`.

**«Model kit»** — двух-темный (dark default + light «constructivist paper») лендинг
mamaev.coach. Уже частично на DesOps-рельсах: потребляет `@desops/ui-kit`
(ThemeToggle + globals). Hex ниже = документация существующей ДНК.

- **Palette dark:** ground `--bg-primary #0a0a0f` → `--bg-secondary #111118` →
  `--bg-surface #16161f`; text `#f0f0f5` / secondary `#8e8ea0`; accent
  `--text-accent #00d1ff` («Cyber Blue» — СОВПАДАЕТ с GLOBAL_DESIGN seed #00D1FF);
  crit `#ff6b5b`; phase-ряд `#00d1ff/#5e5ce6/#ff9900/#ff44aa`;
  hub-only градиент-токены `--accent-gradient` (phase-1→2) + `--hero-glow`.
- **Palette light («тёплая модельная бумага»):** `#f4f1ea/#eae6dc/#fbf9f4`, text
  `#15151a/#5a5a6a`, accent `#0077cc` (deep blue для контраста, WCAG-guard в LMS),
  phase-ряд затемнён. Обе темы полные — токены в `[data-theme="dark"/"light"]`.
- **Typography:** Geist Sans (body, `--font-geist-sans`) + Geist Mono
  (wordmark/микро-лейблы `0.7–0.8rem`, letter-spacing); display-шкала
  `clamp(2.8rem,7vw,6.5rem)`, гигантские номера секций `clamp(5rem,14vw,11rem)`.
  Расхождение с GLOBAL_DESIGN Inter/JetBrains — осознанная Geist-идентичность.
- **Density/shape:** `--radius 4px` (резче глобальных), `--content-max 1100px`,
  `--section-gap 5rem`, `--accent-line 3px solid accent`; sticky header
  `rgba(bg,0.85)+blur(12px)`; **стилизация преимущественно inline `style={{}}`
  на CSS-переменных**, НЕ Tailwind-утилиты — semgrep-правила почти не имеют
  поверхности, дрейф ловится по токенам.
- **SHARED CHROME:** `themes/model-kit.css` зеркалится в blog/LMS/mentor
  (4 копии, sync вручную) — hub-копия несёт +2 hub-only градиент-токена.
- **Identity preserved** — акцент уже = SOVRN-cyan; re-skin не требуется и не выполнялся.