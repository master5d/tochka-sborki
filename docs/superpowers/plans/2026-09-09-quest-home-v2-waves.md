# Quest Home v2 — план волн

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Волны идут по очереди; внутри волны шаги отмечаются чекбоксом.

**Goal:** превратить страницу из документа с иллюстрациями в путешествие по миру, который меняется с дня на ночь по переключателю темы.

**Architecture:** высокий кадр мира панорамируется по прогрессу главы; на развилках мир расходится на две полосы; состояние дня и ночи выбирается темой читателя, картинка через `<picture>` с медиа-запросом, петля подменой источника кодом.

**Tech Stack:** Next.js 16 static export, React 19, Vitest, CSS custom properties, IntersectionObserver; генерация через `pool.py --tier edit` на гейтвее; петли через Codex `gpt-6-astra` + HyperFrames 0.8.31.

**Spec:** `docs/superpowers/specs/2026-09-09-quest-home-v2-world.md`

## Global Constraints

- Ветка `feat/quest-home` в `C:\telo\Efforts\Ongoing\mc_hub`; в `main` не мержить (мерж = прод-деплой).
- Коммит по явным путям, трейлер `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Никаких новых npm-зависимостей, никаких CDN и внешних шрифтов.
- Любой вызов модели — только через гейтвей `https://sovrn-mini.taile5b8dd.ts.net/v1`, `LITELLM_KEY` из User-реестра Windows, ключ не печатать.
- `prefers-reduced-motion: reduce` — ни панорамы, ни петель, ни реплик.
- Контраст: основной текст ≥ 4.5, акцент ≥ 4.5, вторичный ≥ 3.0 на каждом фоне главы, в каждом из четырёх блоков темы.
- Потолок `hub/public/quest/` — 24 МБ.
- Работа NAUTILUS ведётся в worktree от `origin/main`, главное дерево не переключать.

---

## Волна A — «в край» (в работе)

Полный текст — в спеке, § «Волна A». Итог: рисунок без рамки в край главы, насыщенные фоны глав, ритм финала по содержимому, мир в первом экране.

## Волна B — мир в вертикали, день и ночь (в работе)

Полный текст — в спеке, § «Волна B». Итог: `style.md` v3 с правилами ночи, `scenes-v3.json` (7 сцен, 1024x1536, два промпта на сцену), `run_world.py --variant day|night`, 14 принятых кадров в `_media/world-v3/`, два контактных листа.

---

## Волна C — лента

**Files:**
- Modify: `hub/lib/quest/scenes.ts` (реестр: высокий кадр, два состояния)
- Modify: `hub/components/quest/scene-loop.tsx` (панорама, `<picture>`, подмена источника по теме)
- Create: `hub/components/quest/use-theme-state.ts` (текущее состояние мира: day | night)
- Create: `hub/components/quest/use-chapter-progress.ts` (прогресс главы 0…1)
- Modify: `hub/themes/quest.css`, `hub/scripts/quest-assets.ps1`, `hub/lib/quest/assets.test.ts`
- Create: `hub/components/quest/use-chapter-progress.test.ts`, `hub/components/quest/use-theme-state.test.ts`

**Interfaces:**
- Produces: `sceneAssets(id, state: 'day' | 'night')`, `useThemeState(): 'day' | 'night'`, `useChapterProgress(ref): number`, чистые `clampProgress(top, height, viewport)` и `panOffset(progress)`.

- [ ] **Шаг 1: тесты чистых функций.** `clampProgress` даёт 0 до входа главы в кадр, 1 после выхода, монотонна внутри; `panOffset(0)` = `0%`, `panOffset(1)` = `100%`, середина = `50%`; `sceneAssets('02-camp','night').poster` = `/quest/scenes/02-camp-night.webp`. Прогнать, увидеть падение.
- [ ] **Шаг 2: реестр.** `Scene.width/height` = 1024/1536; `sceneAssets` принимает состояние; альты не меняются (место одно, свет разный); `assets.test.ts` проверяет наличие и бюджет 14 постеров и 14 петель, потолок каталога 24 МБ.
- [ ] **Шаг 3: панорама.** Кадр в прилипшей колонке выше своего окна; `object-position: 50% calc(var(--pan) * 100%)` (или `translate3d`), `--pan` ставится из `useChapterProgress`. При `prefers-reduced-motion` `--pan` фиксируется на `0.33`.
- [ ] **Шаг 4: состояние мира.** `useThemeState` читает `document.documentElement.dataset.theme`, при его отсутствии — `matchMedia('(prefers-color-scheme: dark)')`, и подписывается на оба источника (`MutationObserver` на атрибут + событие медиа-запроса). До монтирования — `day`.
- [ ] **Шаг 5: картинка и петля.** Постер через `<picture>` с `<source media="(prefers-color-scheme: dark)" srcset="…-night.webp">`; после монтирования явный выбор темы перекрывает выбор кодом. Петля: `src` ставится кодом; при смене состояния новая дорожка стартует с `currentTime` старой.
- [ ] **Шаг 6: ассеты.** `quest-assets.ps1` кодирует 14 постеров и (после волны E) 14 петель, имена `<id>-<state>`; старые горизонтальные файлы удаляются из `public/`.
- [ ] **Шаг 7: сборка, смок, тесты, скрины ×2 темы, вайб-чек.** Коммит `feat(quest): лента мира — высокий кадр, панорама по главе, день и ночь по теме`.

## Волна D — две дороги

**Files:**
- Create: `hub/components/quest/road-strip.tsx`
- Modify: `hub/components/quest/path-fork.tsx`, `hub/lib/quest/scenes.ts`, `hub/themes/quest.css`
- Modify (NAUTILUS): `core/image-pool/worlds/mamaev-quest/roads.json`, генерация 12 полос
- Create: `hub/lib/quest/roads.test.ts`

**Interfaces:**
- Consumes: `Fork['id']`, `Guide`. Produces: `ROAD_STRIPS: Record<ForkId, Record<Guide, string>>`, `roadStrip(forkId, guide, state)`.

- [ ] **Шаг 1: тест реестра полос.** Три развилки × два проводника × два состояния = двенадцать путей вида `/quest/roads/<fork>-<guide>-<state>.webp`, все различны, ни одного пустого.
- [ ] **Шаг 2: генерация.** План `roads.json` (768x1536): у привычной дороги мир Скроллера (лента, экраны, круг), у обходной — мир Сборщицы (ступени, инструменты, свет мастерской); тот же стиль, те же герои, оба состояния. Гейт экземпляров как в сценах.
- [ ] **Шаг 3: `RoadStrip`.** Узкая полоса под карточкой пути, продолжает карточку: общий фон, без зазора, без рамки. На узком экране полоса становится тонкой лентой поверх карточки.
- [ ] **Шаг 4: сборка, скрины развилок ×2 темы, вайб-чек.** Коммит `feat(quest): две дороги — полосы мира под карточками путей`.

## Волна E — петли заново (Astra)

- [ ] **Шаг 1: бриф.** `core/image-pool/worlds/mamaev-quest/loops-v3/BRIEF.md`: вертикальный кадр, два состояния, что движется днём (искры, блики, экран) и что ночью (пульс порталов, огонь, окна, экран), 8 с при 30 fps, бесшовность, `prefers-reduced-motion` останавливает на первом кадре.
- [ ] **Шаг 2: прогон.** `codex exec --model gpt-6-astra --approve-for-me --skip-git-repo-check` из `.cmd`-скрипта, HyperFrames `npx -y hyperframes@0.8.31`, окружение `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1`; ни `publish`, ни `skills add`, ни `curl | bash`. Решения класть в промпт заранее: exec останавливается на вопросе.
- [ ] **Шаг 3: проверка кодом.** ffprobe: 240 кадров, кадр 0 равен последнему (порог по пикселям), вес ≤ 900 КБ. Сводку пишет скрипт, не модель: у Astra кончается квота на финальном шаге.
- [ ] **Шаг 4: приёмка.** Коммит исходников композиций; бинарники в `_media/world-v3/loops/`. `feat(loops): петли под вертикальный кадр, день и ночь`.

## Волна F — читатель в кадре

**Files:**
- Create: `hub/components/quest/use-path-choice.ts`, `hub/components/quest/path-choice.tsx`, `hub/components/quest/use-scroll-mood.ts`
- Modify: `hub/components/quest/path-fork.tsx`, `hub/components/quest/quest-home.tsx`, `hub/lib/quest/content.ts` (реплики Скроллера и строки подписи петель — ТОЛЬКО из канона LF, новых формулировок не сочинять)
- Create: тесты на чистые части

- [ ] **Шаг 1: выбор пути.** `useChoice(forkId)` пишет в `localStorage` под одним ключом, все чтения и записи в `try/catch`; отсутствие хранилища = отсутствие выбора, финал читается как сегодня. Тест на чистый редьюсер маршрута: три выбора → строка маршрута; ноль выборов → `null`.
- [ ] **Шаг 2: финал собирает маршрут.** Текст маршрута берётся из канона; ни одной новой авторской фразы — если нужной фразы в каноне нет, завести правку в Logos Foundry и оставить пропуск.
- [ ] **Шаг 3: реакция на скорость.** `useScrollMood` меряет пиксели в секунду по `requestAnimationFrame`, порог и гистерезис — чистая функция под тестом; реплика не чаще одной на главу, гаснет за пять секунд, отключена при `prefers-reduced-motion`.
- [ ] **Шаг 4: подписи к петлям.** Одна строка на сцену в обеих локалях, из пометок `[петля: …]` канона.
- [ ] **Шаг 5: сборка, скрины, приёмка.** Коммит `feat(quest): выбор пути с памятью, реакция на скролл, подписи к петлям`.

---

## Self-review

- Покрытие спеки: § «Волна A» → волна A; § «Волна B» → волна B; § «Волна C» → волна C шаги 1–7; § «Волна D» → волна D; § «Волна E» → волна E; § «Волна F» → волна F; § «Переключение дня и ночи» → волна C шаги 4–5; § «Ассеты и бюджет» → волна C шаг 6 и волна D шаг 2; § «Приёмка» → последний шаг каждой волны.
- Плейсхолдеров нет: каждая волна называет файлы, интерфейсы и проверку. Точные промпты генерации живут в планах `scenes-v3.json` и `roads.json`, а не здесь, потому что их пишет и правит прогонщик.
- Согласование имён: `sceneAssets(id, state)`, `useThemeState`, `useChapterProgress`, `panOffset`, `roadStrip(forkId, guide, state)` — одни и те же в волнах C, D и F.
