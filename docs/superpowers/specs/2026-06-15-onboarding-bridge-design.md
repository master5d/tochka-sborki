# Онбординг-мост перед квест-логом

**Тикет:** `fb_456c0742d840` (severity: high, impact 8 × urgency 7, area: lms, cat: ux)
**Дата:** 2026-06-15

## Проблема

После анкеты (intake) нонгеймер попадает прямо в квест-лог (`/dashboard`) — плотный RPG-интерфейс с необъяснённым жаргоном: шарды, режимы, прикладной вызов, плюс skin-специфичная лексика (кадет, аномалия — из `space-opera`). Дословно из фидбэка:

> «после анкеты enter your quest log — нажала кнопочку и полный шок, хочется бежать; шарды, режимы, прикладной вызов, кадет, аномалия на картах — не играла в компьютерные игры, не знакома с language, не понимаю — я прохожу курс или компьютерную игру».

Существующая help-система (`IntroCard` + `HelpTip` ⓘ на дашборде) недостаточна: она dismissible и конкурирует с уже плотным экраном. Моста между анкетой и квест-логом нет.

## Решение

Новый инлайн-шаг визарда между «Уставом напарника» (`CharterReveal`) и редиректом в квест-лог: один спокойный полноэкранный «Rosetta stone», который **(а)** называет мир юзера и разоружает его жаргон (skin-aware decoder), **(б)** переводит 5 ключевых механик на человеческий язык, **(в)** успокаивает («ты проходишь курс, обёртка — украшение»). Дальше юзер входит в дашборд уже сориентированным.

### Изменение потока

```
до:    вопросы → CharterReveal → (onContinue) → redirect /dashboard
после: вопросы → CharterReveal → (onContinue) → OnboardingBridge → (onEnter) → redirect /dashboard
```

Сейчас `CharterReveal.onContinue` сразу делает `window.location.replace(pendingHref)`. Меняем: `onContinue` переключает визард в стадию `bridge`. Кнопка моста «Понятно, войти →» (`onEnter`) выполняет редирект. Только V2-флоу (`version === 2`); V1 не трогаем.

## Единицы

### 1. `components/intake/onboarding-bridge.tsx` (новый, ~90 строк)

- **Props:** `{ skin: WorldSkin; locale: Locale; onEnter: () => void }`
- Self-contained inline-стили (как `CharterReveal` — стили визарда тут не смонтированы, ранний возврат).
- **Что зависит от:** `SKINS_META` (decoder + displayName), `HELP_TIPS` из `lib/help/help-content.ts` (переиспользуем plain-language тела механик — single source of truth, не дублируем).
- **Структура UI:**
  - Заголовок: «Прежде чем войти» / "Before you enter"
  - **Decoder-блок** (skin-aware): строка из `SKINS_META[skin].decoder` (fallback ниже).
  - **Глоссарий 5 механик** (универсальный plain-language список): 💎 шарды · режим · карта · вызов · подземелье — тела берём из `HELP_TIPS` (`shards`, `wizard-modes`, `world-map`, `dungeon-card`) + одна строка про «прикладной вызов».
  - Reassurance: «Ты проходишь курс. Игровая обёртка — чтобы было живее; её можно игнорировать.» / "You're taking a course. The game wrapper is there to make it livelier; you can ignore it."
  - Кнопка `onEnter`: «Понятно, войти →» / "Got it, enter →"

### 2. `lib/rpg/types.ts`

Добавить опциональное поле в `SkinMeta`:
```ts
decoder?: Bi   // plain-language «что твой мир одевает» — для онбординг-моста
```

### 3. `lib/rpg/skins-meta.ts`

Добавить `decoder` каждому из 8 скинов (RU+EN). Драфт (финальный, не placeholder):

| skin | decoder.ru | decoder.en |
|---|---|---|
| slavic-myth | Твой мир — Славянский Миф: уроки звучат как сказ, наставник — Домовой, агенты — помощники у очага. Это лишь образ — под ним обычный курс. | Your world is Slavic Myth: lessons sound like folk tales, your mentor is the House-Spirit, agents are hearth-helpers. It's just imagery — underneath is a normal course. |
| dark-fantasy | Твой мир — Тёмное Фэнтези: модули — Искажённые Земли, навыки — Печати, наставник — Хранитель. Это лишь антураж — под ним обычный курс. | Your world is Dark Fantasy: modules are Blighted Lands, skills are Seals, your mentor is the Keeper. It's just set dressing — underneath is a normal course. |
| cyber-noir | Твой мир — Кибер-Нуар: локации — притоны и мастерские, наставник — Фиксер. Это лишь стиль — под ним обычный курс. | Your world is Cyber Noir: locations are dens and workshops, your mentor is the Fixer. It's just style — underneath is a normal course. |
| space-opera | Твой мир — Космическая Опера: тебя зовут кадетом, задания — миссии, ошибки — аномалии, наставник — Бортовой ИИ. Это лишь декорация — под ней обычный курс. | Your world is Space Opera: you're the cadet, tasks are missions, mistakes are anomalies, your mentor is the Ship AI. It's just decoration — underneath is a normal course. |
| anime-quest | Твой мир — Аниме-Квест: уроки — арки и битвы, наставник — Сэнсэй. Это лишь подача — под ней обычный курс. | Your world is Anime Quest: lessons are arcs and battles, your mentor is the Sensei. It's just presentation — underneath is a normal course. |
| soviet-heroic | Твой мир — Советский Героизм: курс — производственный план, наставник — Бригадир. Это лишь стилистика — под ней обычный курс. | Your world is Soviet Heroic: the course is a production plan, your mentor is the Foreman. It's just styling — underneath is a normal course. |
| mystic-arcane | Твой мир — Мистическая Аркана: навыки — руны и заклинания, наставник — Оракул. Это лишь образность — под ней обычный курс. | Your world is Mystic Arcane: skills are runes and spells, your mentor is the Oracle. It's just imagery — underneath is a normal course. |
| wanderer | Твой мир — Странник: спокойный нейтральный стиль, наставник — Проводник. Под ним — обычный курс, без лишней мишуры. | Your world is Wanderer: a calm, neutral style, your mentor is the Guide. Underneath is a normal course, with no extra frills. |

**Fallback** (если `decoder` отсутствует — на будущие скины): генерик из `displayName` + `mentor.name`:
> «Твой мир — {displayName}: это лишь оформление, под ним обычный курс{, наставник — mentor.name}.»

Вынести fallback в чистый хелпер `skinDecoder(skin, locale): string` в `skins-meta.ts` (или рядом), чтобы компонент не знал про fallback-логику.

### 4. `components/intake/intake-wizard.tsx`

- Новый локальный стейт стадии: `const [stage, setStage] = useState<'wizard' | 'bridge'>('wizard')` (или производный флаг `entered`).
- `CharterReveal.onContinue` → `setStage('bridge')` (вместо немедленного редиректа).
- Когда `stage === 'bridge'` и есть `pendingHref`: рендер `<OnboardingBridge skin={skinKey} locale={locale} onEnter={() => window.location.replace(pendingHref)} />`.
- `skinKey` уже доступен (`answers['V_SKIN']`).

## Данные / стейт

Без сервера и без localStorage-флага: мост — часть линейного intake-потока, показывается ровно один раз по построению (сразу после анкеты). Повторно в него не попасть, и не нужно — на дашборде для возврата к справке уже есть `IntroCard` + `HelpTip` ⓘ.

## Тесты (Vitest)

- `components/intake/onboarding-bridge.test.tsx`:
  - рендерит decoder-строку для заданного скина в RU и в EN;
  - содержит все 5 терминов глоссария;
  - клик по кнопке вызывает `onEnter`.
- `lib/rpg/skins-meta.test.ts` (новый или дополнение): `skinDecoder()` возвращает непустую строку для каждого из 8 скинов в обоих локалях; для скина без поля `decoder` — непустой fallback.

## Локализация

Весь UI-текст моста (заголовок, глоссарий-обвязка, reassurance, кнопка) — bilingual в самом компоненте через `locale` (паттерн `CharterReveal`). Decoder-тексты — в `SKINS_META`.

## Вне scope (YAGNI)

- Plain-mode тумблер по всему LMS (отдельное направление/тикет).
- Изменение плотности самого дашборда (мост готовит к нему, не переделывает его).
- Guided-tour coachmarks поверх дашборда.

## Критерий готовности

Нонгеймер после анкеты видит один спокойный экран, который называет его мир, переводит 5 механик на человеческий и явно говорит «это курс, обёртка — украшение», и лишь затем входит в квест-лог. Все тесты зелёные. RU+EN паритет.
