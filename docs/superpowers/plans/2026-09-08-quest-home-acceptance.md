# Quest Home — acceptance shots and trend vibe-check (Task 7)

Acceptance evidence for the "Quest Home" page (`hub/out/`, RU `/` + EN `/en/`), chapter anchors
`#hero #intro #boulder #temple #gates #finale #about`.

## Screenshot inventory

Script: `hub/scripts/quest-shots.mjs` (Playwright, resolved from `hub/` — did not need the
NAUTILUS fallback). Served `hub/out` with `npx -y serve out -l 4173`, shot against
`http://localhost:4173/` and `http://localhost:4173/en/` (trailing slash required by the
static export). Server killed by PID after the run.

28 PNG files written to
`C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\quest-home\` (outside git):
`{ru,en}-{desktop,mobile}-{hero,intro,boulder,temple,gates,finale,about}.png`.

## Visual observations (Read tool)

- **`ru-desktop-gates.png` / `en-desktop-gates.png`** — the two wooden plaque signs are mounted
  on the castle towers, inside/on the boards, not floating beside them. RU reads two lines
  (small at this resolution but legible on zoom: "open · бесплатно" style copy on the left
  board, "b2b · по запросу" style on the right); EN mirrors with English copy. No overlap or
  clipping observed. No defect found here.
- **`en-mobile-boulder.png`** — the sticky scene (boulder illustration) sits above the
  "The habit road" heading and body text as a fixed block; text flows below it uncovered, no
  overlap. No defect found.
- **`ru-desktop-hero.png`** — this landed on the bio/hero-copy block ("Два года по side
  quest'ам..."), dark text on a light lavender background — readable, not black-on-black.
  Toggle button correctly shows "EN" (i.e. current locale is RU). No defect found.

No open visual items from this sample of four. (Only these four shots were inspected per the
brief; the remaining 24 were generated but not manually reviewed.)

## Vibe-check against the Adweek/Twitch trend sample

Ran from a worktree of `origin/main` (`NAUTILUS` sits on `feat/taste-loop-ledger` locally, not
switched): `git -C NAUTILUS worktree add .worktrees/quest-check origin/main`, worktree left in
place. `LITELLM_KEY` pulled from the Windows User registry into the session env, never printed.
Note: `core/desops/taste/_media/**` and `_derived/**` are gitignored, so they exist only in the
original NAUTILUS tree, not the worktree — commands pointed `--source`/`--out`/`--index` at
absolute paths in the main tree while running the scripts from the worktree checkout.

```
python taste_embed.py run --source .../taste/_media/adweek-twitch/shots --out .../taste/_derived/quest-trend --view both --kind screen
→ картинок 21, посчитано 21, уже были 0, отказов 0, без семантики 0, без фактуры 0
python taste_mood.py centroid --index .../taste/_derived/quest-trend --from-selection selection.json (all 21 shots)
→ sel-f17539f2f970: картинок 21, r90=0.268, взгляд both
```

**Centroid ref:** `sel-f17539f2f970` · **r90:** 0.268 · view: both.

`taste_mood.py check` against all 14 `*-desktop-*.png` shots, ref `sel-f17539f2f970`:

| shot | verdict | dist |
|---|---|---|
| en-desktop-about.png | outside | 0.3373 |
| en-desktop-boulder.png | edge | 0.3112 |
| en-desktop-finale.png | edge | 0.2968 |
| en-desktop-gates.png | outside | 0.3406 |
| en-desktop-hero.png | edge | 0.3207 |
| en-desktop-intro.png | edge | 0.3114 |
| en-desktop-temple.png | edge | 0.2991 |
| ru-desktop-about.png | outside | 0.3481 |
| ru-desktop-boulder.png | **FAILED** | gateway HTTP 500 on the semantic embed batch, reproduced on 3 attempts (immediate retry + retry after 5s pause) — no distance recorded, not fabricated |
| ru-desktop-finale.png | edge | 0.2854 |
| ru-desktop-gates.png | outside | 0.3485 |
| ru-desktop-hero.png | outside | 0.3423 |
| ru-desktop-intro.png | edge | 0.2864 |
| ru-desktop-temple.png | edge | 0.3095 |

13 of 14 shots returned a distance; all 13 land `edge` or `outside` relative to r90=0.2677,
none `inside`. **The threshold is uncalibrated — this is the first calibration point**, so
"nothing scored inside" is not by itself a verdict on the page; it says the Quest Home chapters
sit measurably outside the Adweek/Twitch trend centroid by this metric, with `edge` (boulder,
finale, hero-en, intro, temple — the illustration-heavy narrative chapters) closer than
`outside` (about, gates, hero-ru — the text/plaque-heavy chapters). `ru-desktop-boulder.png`
should be re-run once the gateway's semantic-embed path is confirmed healthy; no verdict is
recorded for it either way.

## Open items

- `ru-desktop-boulder.png` has no vibe-check result (gateway 500, reproduced 3×) — re-run
  needed, no fix to the page implied by this.
- Only 4 of 28 screenshots were visually reviewed by hand (per brief scope); the other 24 exist
  on disk but are unverified.
- Vibe-check threshold (r90=0.2677 around `sel-f17539f2f970`) is the first calibration point for
  this trend sample — no adopt/reject verdict should be drawn from a single uncalibrated pass.

## Как переснять

`scripts/quest-shots.mjs` needs Playwright on the machine (not an `hub/package.json` dependency
— see the comment block at the top of the script) and a served copy of the static export:

```
npx -y serve hub/out -l 4173
node hub/scripts/quest-shots.mjs http://localhost:4173 <outDir>
```

## Повторный замер по текущей странице (2026-09-09)

Скрины первой приёмки сняты ДО волны правок. Набор `quest-home-v3` снят после неё
(`_media/quest-home-v3/`, те же 28 файлов) и промерен тем же центроидом `sel-f17539f2f970`,
r90 = 0.2677, взгляд both:

| глава | RU | EN |
|---|---|---|
| hero | edge 0.3142 | edge 0.3274 |
| intro | edge 0.3011 | edge 0.3042 |
| boulder | outside 0.3548 | outside 0.3376 |
| temple | edge 0.3184 | edge 0.3174 |
| gates | edge 0.3266 | edge 0.3196 |
| finale | outside 0.3360 | edge 0.3101 |
| about | outside 0.3443 | edge 0.3345 |

14 кадров из 14; расклад тот же, что в первом проходе: иллюстративные главы ближе к образцу,
текстовые дальше, ни один не `inside`. Порог по-прежнему НЕ калиброван — это вторая точка, а не
вердикт о макете.

Оба прежних отказа прибора ЗАКРЫТЫ в тот же день, набор промерен целиком. Кадр `ru-desktop-hero.png`
ронял эмбеддер зверя воспроизводимо (4 из 4): модель на fp16 отдавала вектор целиком из NaN, а
сериализатор ответа на NaN падал, и клиент видел пустой 500. В сервере (`garage/jina-v4/embed_server.py`,
NAUTILUS `09f189bc`) добавлены проверка конечности вектора, спуск по масштабу с округлением до
кратного 28 и честный 422, если не помогает; этот кадр теперь спасается на 476×280. Побочно закрыт
наследуемый фолбэк (`a0d3fe47`): пул эмбеддингов спрашивал вектор у чат-моделей и отдавал клиенту
три отказа вместо одного.

## Третий замер: страница после итерации v2 (2026-09-11)

Тот же центроид `sel-f17539f2f970`, r90 = 0.2677, взгляд both. Снято по середине каждой главы,
десктоп 1440, светлая тема, английская локаль (`_media/quest-final/`).

| глава | было (09-09) | стало | сдвиг |
|---|---|---|---|
| hero | edge 0.3274 | **inside 0.2348** | −0.093 |
| temple | edge 0.3174 | edge 0.2694 | −0.048 |
| finale | edge 0.3101 | edge 0.2680 | −0.042 |
| boulder | outside 0.3376 | edge 0.2775 | −0.060 |
| gates | edge 0.3196 | edge 0.3238 | +0.004 |
| about | edge 0.3345 | outside 0.3397 | +0.005 |
| intro | edge 0.3042 | outside 0.3414 | +0.037 |

**Впервые кадр попал ВНУТРЬ центроида** — хиро, после того как мир занял первый экран в полную
силу, а текст переехал на собственную панель.

Расклад читается связно: четыре главы, где мир занимает экран, ушли к образцу; три, где
доминирует текст на плоском фоне (вступление с узкой колонкой прозы, «о проекте» с карточками,
ворота с текстом между полосами), ушли от него. Образец арт-доминантный, и метрика это видит.

Оговорки те же: порог по-прежнему НЕ калиброван, и выборка тут — середина главы, тогда как
09-09 снималось по якорю главы. Сравнение индикативное, а не приговор. Ни одна цифра сама по
себе не говорит «лучше»; она говорит «ближе к образцу», а это разные вещи.

