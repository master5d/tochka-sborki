# Quest Home: главная mamaev.coach как скроллителлинг — дизайн

Дата: 2026-09-08. Эпик: редизайн mamaev.coach «один к одному» по концепту Adweek × Amazon Ads
«Decisions, Decisions» (Shorthand-скроллителлинг с иллюстрированным миром). Этот пакет —
вёрстка: нарратив, сцены и петли уже есть, страницы ещё нет.

Владелец дал ход пакету 2026-09-08 («начинаем большой пакет») после закрытия предыдущих
слоёв (нарратив в Logos Foundry, стиль v2, 7 сцен, 7 петель). Решения ниже, помеченные
«(решение оператора)», приняты без владельца и подлежат пересмотру при приёмке.

## 1. Что строим

Одна страница `hub/` (Next.js 16, `output: 'export'`) в двух локалях, `/` (RU) и `/en/` (EN),
заменяющая нынешний `HomePage` (model-kit лендинг) на **QuestHome**: хиро → вступление →
три развилки → финал → два «About» → футер. Каждый блок = глава с прикреплённой сценой
(картинка + зацикленное видео), текст скроллится рядом с «прилипшей» сценой, как в образце.

Вне пакета: смена корневой локали сайта на EN (SEO, sitemap, llms.txt, мерж блога —
отдельное решение владельца; нарратив EN-первичен, но маршруты остаются `/` RU, `/en/` EN),
платный ticketing, events, store, блог.

## 2. Источники правды

| Что | Откуда | Как попадает в hub |
|---|---|---|
| Текст EN | Logos Foundry piece #262 seq 11 (id 372, принят владельцем 2026-09-08) | транскрипция в `hub/lib/quest/content.ts`, локаль `en`; в шапке файла — piece/seq |
| Текст RU | LF piece #263 seq 3 (id 375, human-база) | то же, локаль `ru` |
| Сцены | `NAUTILUS/core/desops/taste/_media/world-v2/scenes/0N-*.png` 1264×848 | `hub/public/quest/scenes/<id>.webp` |
| Петли | `NAUTILUS/core/desops/taste/_media/world-v2/loops/<id>/loop.mp4` (CRF 0, ≈1,4 МБ) | перекодировка → `hub/public/quest/loops/<id>.mp4` |
| Проводники (вырезки) | генерация `pool.py --tier edit … --key --bg '#FF00FF'` по листам `charA-sheet-v2.png` / `charB-girl-v3.png` | `hub/public/quest/guides/{scroller,builder}.png` RGBA |
| Дизайн-контракт | `hub/DESIGN.md` (model-kit, dials variance 4 / motion 2 / density 3) | тема `quest` наслаивается на model-kit, контракт получает строку решения и motion 3 |

Правило LF (HARD RULE): текст в hub — канал дистрибуции, не дом текста. Правки формулировок
делаются в LF, потом переносятся; `content.ts` не редактируется «по месту». Служебные пометки
`[scene:]`/`[loop:]`/`[сцена:]`/`[петля:]` и служебная шапка в вёрстку не идут (тест).

## 3. Структура контента (`hub/lib/quest/content.ts`)

```ts
export type Guide = 'scroller' | 'builder'
export interface Cta { label: string; href: string }
export interface Outcome { guide: Guide; value: string; text: string; source: string }
export interface PathBlock { guide: Guide; title: string; paragraphs: string[]; ctas?: Cta[] }
export interface Fork {
  id: 'boulder' | 'temple' | 'gates'
  scene: SceneId            // '03-boulder' | '04-temple' | '05-gates'
  eyebrow: string           // «Развилка 1: замена залипанию»
  obstacle: string          // «Препятствие 1. Валун»
  setup: string[]
  habit: PathBlock
  detour: PathBlock
  outcomesTitle: string
  outcomes: [Outcome, Outcome]
  cta?: Cta
  bridge: string
}
export interface QuestContent {
  seo: { title: string; description: string }        // из фронтматтера LF
  hero: { scene: '01-map'; lines: string[]; name: string; role: string; bio: string }
  intro: { scene: '02-camp'; eyebrow: string; heading: string; paragraphs: string[] }
  forks: [Fork, Fork, Fork]
  finale: { scene: '06-wall'; eyebrow: string; heading: string; paragraphs: string[]; closing: string; cta: Cta }
  about: { scene: '07-signs'; author: { heading: string; text: string; cta: Cta; links: Cta[] }; course: { heading: string; text: string; href: string } }
  labels: { habit: string; detour: string; scroller: string; builder: string; plaques: [string, string] }
  footer: string
}
export const quest: Record<Locale, QuestContent>
```

Ссылки CTA: курс → `https://ai.synergify.com/` (RU) / `https://ai.synergify.com/en/` (EN);
агентский инжиниринг → `https://mentor.mamaev.coach/` (+`en/`); блог `/blog/` (+`/en/blog/`);
события `/events/` (+`/en/events/`); GitHub `https://github.com/master5d`; email
`mailto:sasha@mamaev.coach`.

## 4. Примитивы (`hub/components/quest/`)

Все без внешних библиотек; клиентские компоненты помечены `'use client'`, серверные — нет.

- **`Chapter`** — секция-глава: `tint` (ключ токена фона главы), `eyebrow` (mono, uppercase),
  `heading` (display). Даёт `id` для якорей. Серверный.
- **`SceneLoop`** (клиент) — `<video muted loop playsInline preload="none" poster>` с
  `IntersectionObserver`: play при входе в вьюпорт, pause при выходе. При
  `prefers-reduced-motion: reduce` или без JS рендерится `<img>` постера. Атрибут `alt`
  обязателен (описание сцены из `scenes.ts`).
- **`StickyStage`** (клиент) — двухколоночная сетка: колонка сцены `position: sticky;
  top: var(--quest-stage-top)` высотой `calc(100vh - var(--quest-stage-top))`, колонка текста
  со «шагами» (`StageStep`). `useActiveStep` через `IntersectionObserver` (порог 0.5)
  отдаёт индекс активного шага; сцена по активному шагу меняет подпись-оверлей (тонкая
  mono-плашка) — самой сцены на главу одна. Ниже 900px сцена прилипает сверху высотой
  `42vh`, текст идёт под ней. Первый шаг активен при загрузке (страница «в покое» читаема).
- **`PathFork`** — две карточки «привычная дорога» / «обходная тропа» с чипом проводника
  (аватар-вырезка 40px + имя). Карточки одной высоты (grid), на мобильном — столбиком.
- **`OutcomeReveal`** (клиент) — две карточки исходов: крупное число (display), текст,
  источник (mono, `--text-xs`). Базовое состояние видимо (opacity 1); при поддержке
  `IntersectionObserver` и без reduced-motion класс `is-in` запускает 400 мс
  translateY(12px→0). Никаких «счётчиков».
- **`GatePlaques`** — сцена 05 с двумя текстовыми плашками кодом. Координаты сняты с
  `05-gates.png` (1264×848) флудом по цвету плашки:
  левая x 237–426, y 150–220 → `left 18.75% top 17.69% width 14.95% height 8.25%`;
  правая x 765–890, y 226–271 → `left 60.52% top 26.65% width 9.89% height 5.31%`.
  Текст — `labels.plaques`, mono, `font-size: clamp(7px, 1.15cqw, 18px)`, цвет `#2b1d12`,
  контейнер `container-type: inline-size`. Плашки `aria-hidden` (текст дублируется в CTA).
- **`GuideChip`** — аватар проводника (RGBA-вырезка в круге) + подпись.
- **`QuestHome`** — сборка страницы; `LangSwitcher` остаётся.

## 5. Тема `quest` (`hub/themes/quest.css`)

Наслаивается на model-kit, не заменяет его: типографика (Unbounded display, Geist), радиус
4px, `--content-max` — как есть. Новое: фоны глав и зона сцены.

```
--quest-stage-top: 3.25rem      /* высота SiteHeader */
--quest-tint-hero / -intro / -fork1 / -fork2 / -fork3 / -finale / -about
--quest-card                     /* фон карточек путей/исходов */
--quest-plaque-ink: #2b1d12
```

Light (бумага model-kit + пастель стиля v2): hero `#ece6f8` (лаванда), intro `#e4f1ea`
(мята), fork1 `#f3ecdf` (песок), fork2 `#fbe8d9` (персик), fork3 `#e3e8f5` (сталь),
finale `#e9e3f7`, about `#f4f1ea` (= bg-primary). Dark: те же оттенки, приглушённые до
`#15121f` / `#0f1a16` / `#1b1712` / `#1f1611` / `#12151f` / `#171226` / `#0a0a0f`.
Все семь тинтов объявлены в голом `:root` (fallback = light), в
`@media (prefers-color-scheme: dark) :root:not([data-theme])` и в `[data-theme="dark"]`,
как сделано в model-kit. Тест контраста: `--text-primary` на каждом тинте ≥ 4.5,
`--text-secondary` ≥ 3.0 (расширение `lib/a11y/contrast.test.ts`).

Motion: hover и reveal только; `@media (prefers-reduced-motion: reduce)` отключает
переходы reveal и видео. `DESIGN.md`: dials motion 2 → 3, строка решения
«2026-09-08: тема quest (скроллителлинг), спек 2026-09-08-quest-home-design», запись в
`logs/desops.log`.

## 6. Ассеты и бюджет

Скрипт `hub/scripts/quest-assets.ps1` (локальный, ffmpeg 8 из winget + Python Pillow;
CI его не запускает, бинарники коммитятся):
- сцены → WebP q82, 1264×848, ≤ 350 КБ каждая;
- петли → H.264 `-crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart`, без звука,
  ≤ 900 КБ каждая; первый кадр = постер (сцена), поэтому переход постер→видео без скачка;
- проводники → `pool.py --tier edit --ref <лист> --prompt "<персонаж> full body, standing,
  facing viewer, on a flat solid magenta #FF00FF background, nothing else" --key --bg '#FF00FF'`
  → PNG RGBA ≤ 200 КБ, высота 512. Если гейтвей недоступен — fallback: круглая вырезка из
  сцены 01 (координаты в скрипте), и это фиксируется в отчёте, не молча.
Итог `hub/public/quest/` ≤ 9 МБ. Тест `lib/quest/assets.test.ts`: все файлы из `scenes.ts`
существуют, размеры в бюджете.

## 7. Маршруты и метаданные

`app/page.tsx` и `app/en/page.tsx` рендерят `QuestHome`; `metadata` берёт `seo` из контента
(title ≤ 60, description ≤ 155 — тест). `components/home-page.tsx` удаляется (история в git);
словарь `lib/dictionaries.ts` остаётся (events, capture, тесты). `SiteHeader`,
`LangSuggestBanner`, темы — без изменений.

## 8. Тесты

- `lib/quest/content.test.ts`: обе локали содержат восемь фактов с числами
  (18 ч 36 мин / 2 ч 39 мин; 1 ч 47 мин; 9 модулей; 44 урока; 8,9 ч; 38 % / 46 %;
  84 % / 3,1 %; 3,13 %), 5 CTA с валидными href, ни одной строки с `[scene`/`[loop`/
  `[сцена`/`[петля`/«Служебная шапка»/«Service header», ни одной строки, начинающейся с
  `- ` или `1. ` (списков в нарративе нет), `seo` в лимитах, футер дословно
  «© 2026 · mamaev.coach · ⬡ vibe in motion».
- `lib/quest/scenes.test.ts`: 7 сцен, id уникальны, у каждой alt в обеих локалях, плашки
  ворот в пределах [0,100] и не пересекаются.
- `lib/a11y/contrast.test.ts`: расширен тинтами quest.
- `lib/quest/assets.test.ts`: наличие и бюджет файлов.
- `npm run build` (static export) проходит; `out/index.html` и `out/en/index.html`
  содержат заголовок хиро и семь `<video>`/`<img>` сцен (smoke-скрипт в плане).

## 9. Приёмка

1. Локальный `npm run dev` → скриншоты Playwright (1440×900 и 390×844, полная страница по
   главам) в `NAUTILUS/core/desops/taste/_media/quest-home/` (вне git).
2. Вайб-чек по тренду: `taste_embed.py run --source _media/adweek-twitch/shots --out
   _derived/quest-trend` → `taste_mood.py centroid --from-selection` (все 21 кадр) →
   `check --file <скриншот> --ref sel-…` для каждого скриншота. Результат информационный
   (порог не откалиброван), идёт в отчёт и в BACKLOG как первая калибровочная точка.
3. Владелец смотрит страницу глазами; решения на приёмке: мерж в `main` (= деплой на
   mamaev.coach через deploy.yml), корневая локаль, формулировки (через LF).

## 10. Ветка и деплой

Работа в ветке `feat/quest-home` репо mc_hub (main чист, чужих worktree нет). Пуш ветки —
да; мерж в `main` — только владелец (push в main = продовый деплой hub). Коммиты по путям,
без `git add -A`.

## 11. Решения оператора (пересмотреть при приёмке)

- (решение оператора) маршруты остаются `/` RU, `/en/` EN;
- (решение оператора) старый `home-page.tsx` удаляется, не сохраняется как вторая страница;
- (решение оператора) видео H.264 без WebM-дубля: бюджет важнее 15 % экономии;
- (решение оператора) плашки ворот — только текст поверх картинки, без перерисовки сцены;
- (решение оператора) вырезки проводников — две генерации (≈$0.15), fallback — вырезка из
  сцены 01.
