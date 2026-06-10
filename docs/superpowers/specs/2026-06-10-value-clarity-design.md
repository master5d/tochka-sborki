# Ясность ценности на LMS-лендинге — Design Spec

**Дата:** 2026-06-10
**Тикет:** `fb_8423715c58e2` — «Ясность ценности: лендинг и курс не отвечают "что изменится в моей жизни" и "чем лучше моего чата"» (i9×u8, Do First)
**Попутно закрывает:** `fb_a6c79aa29b07`, `fb_ed31965` (траст «где подвох»)
**Источники:**
- Пакет обратной связи 2026-06-09 (три вопроса респондента: «что изменится в моей жизни», «чем лучше моего текущего чата», «о чём вообще можно мечтать»)
- Value-prop сессия 2026-06-04…07 (проект `C:\telo`, сессия `9f376059`): двух-осевая модель, спайн, хук, семиотика «одно острое сообщение»

---

## Проблема

Hero LMS-лендинга (`ai.mamaev.coach`) говорит жаргоном: «Курс по agentic AI в потоке. От нонкодера до AI-generalist'а — Claude Code, Hermes/Aider, локальные модели, MCP, оркестрация. Твой стек на выбор.» Ни один из трёх вопросов целевого не-технаря не получает ответа. Главный враг оффера (подтверждён интервью): широкий не-технарь **не чувствует разрыва** между своим чатом и агентной системой («я и так использую AI как хочу»).

## Принятые решения (лог брейншторма)

1. **Скоуп:** только LMS-лендинг (`LMS/tochka-sborki/web/`). Hub-карточка курса — отдельный тикет. Пролог и intake-рамка — отдельные тикеты (см. «Вне скоупа»).
2. **Hero-месседж:** направление «От чата к системе», финальная формулировка — спайн из value-prop сессии.
3. **Блоки ясности:** все четыре — «Чат vs Система», «О чём можно мечтать», «Что изменится за курс», FAQ-возражения.
4. **Архитектура:** подход A — данные в `lib/dictionaries.ts` (RU+EN), каждая новая секция отдельным серверным компонентом (паттерн `ProgramVenn`), `home-page.tsx` только компонует.
5. **Морковка:** секция «О чём можно мечтать» — задел под будущую галерею кейсов (`fb_b2a67b22be2c`); ссылки на галерею пока нет.

## Принципы копирайта (из value-prop сессии — обязательны)

- **Ось 1 озвучивается, ось 2 молчит.** Value prop = функциональный скачок («поручаешь — доводит до конца»). «Точка сборки», воображение, journey — не называются в копи; «замыслы» — максимум допустимого.
- **Называем разрыв, не фичи.** Каждая строка контраста — про «делаешь руками → доводит до конца», не про MCP/память/интеграции как фичи.
- **Язык co-working:** «поручаешь», «доводит до конца» — не «agentic AI», не «оркестрация».
- **Одно острое сообщение** (семиотика бренда): все блоки бьют в один разрыв, не размывают.
- **Трение бесплатности** закрывается честно: курс — открытая часть практики, воронка в коучинг/работу с командами.

## Порядок секций на странице

```
Hero (новый сабтайтл)
→ Чат vs Система            [NEW]  — «чем лучше моего чата»
→ Для кого                  (есть)
→ Что изменится за курс     [NEW]  — «что изменится в моей жизни»
→ Venn + Программа          (есть)
→ О чём можно мечтать       [NEW]  — «о чём можно мечтать», задел галереи
→ Об авторе                 (есть)
→ FAQ (+3 возражения)       (есть, дополняется)
```

Драматургия: контраст греет сразу после hero; мечта стоит после программы как морковка; траст-возражения закрываются в самом конце.

---

## 1. Hero — замена `hero.subtitle`

Tagline `⬡ Открытый курс · Бесплатно`, заголовок ТОЧКА/СБОРКИ, stats, CTA — без изменений.

**RU:**
> Сейчас AI тебе советует — а делаешь ты всё равно руками. Курс научит превращать замыслы в задачи, которые AI доводит до конца. Без кода. На твоём языке.

**EN:**
> Right now AI gives you advice — and you still do everything by hand. This course teaches you to turn your ideas into tasks AI carries to the finish. No code. In your own words.

## 2. Секция «Чат vs Система» — `components/chat-vs-system.tsx` [NEW]

Сразу под hero. Хук курсивом над таблицей, затем две колонки: левая приглушённая (`--text-secondary`), правая акцентная. На мобиле (≤720px) — стек пар (chat-строка над system-строкой).

**RU:**
- label: `// чат vs система`
- heading: `Чат отвечает.\nСистема делает.`
- hook: «Ты пользуешься AI каждый день — и всё равно делаешь руками то, что он мог бы сделать за тебя. С этого разрыва начинается путь.»
- chatColLabel: «Твой чат сейчас» · systemColLabel: «После курса»

| Твой чат сейчас | После курса |
|---|---|
| Советует — а делаешь ты руками | Поручаешь — и получаешь готовый результат |
| Каждый раз объясняешь всё заново | Твой проект и контекст он уже знает |
| Один вопрос — один ответ | Один замысел — многошаговая работа до конца |
| Результат живёт во вкладке, копируешь сам | Результат появляется там, где он нужен: в файлах, письмах, таблицах |

**EN:**
- label: `// chat vs system`
- heading: `A chat answers.\nA system gets it done.`
- hook: "You use AI every day — and still do by hand what it could do for you. That gap is where this course begins."
- chatColLabel: "Your chat today" · systemColLabel: "After the course"

| Your chat today | After the course |
|---|---|
| Gives advice — you do the work by hand | You delegate — and get the finished result |
| You explain everything from scratch every time | It already knows your project and context |
| One question — one answer | One idea — multi-step work carried to the end |
| Results live in a browser tab, you copy them out | Results land where they belong: files, emails, spreadsheets |

## 3. Секция «Что изменится за курс» — `components/before-after.tsx` [NEW]

После «Для кого», перед Venn. Три виньетки «Было → Стало», вертикальный список или грид 3 колонки на десктопе.

**RU:** label `// что изменится`, heading «Что изменится за курс», beforeLabel «Было», afterLabel «Стало»

1. Было: «Вечер уходит на отчёт: собираешь данные из пяти источников руками.» → Стало: «Агент собирает черновик за 10 минут — ты проверяешь и отправляешь.»
2. Было: «30 вкладок исследования, половина теряется.» → Стало: «Поручил агенту — получил выжимку с источниками одним файлом.»
3. Было: «Каждую неделю одни и те же рутинные шаги.» → Стало: «Описал процесс один раз — система повторяет сама.»

**EN:** label `// what changes`, heading "What changes after the course", beforeLabel "Before", afterLabel "After"

1. "An evening goes into a report: you gather data from five sources by hand." → "An agent drafts it in 10 minutes — you review and send."
2. "30 research tabs, half of them lost." → "Delegate it — get a digest with sources in a single file."
3. "The same routine steps every week." → "Describe the process once — the system repeats it on its own."

## 4. Секция «О чём можно мечтать» — `components/dream-scenarios.tsx` [NEW]

После Программы, перед Автором. Грид карточек как «Для кого» (`repeat(auto-fit, minmax(280px, 1fr))`), 6 ниш (перекликаются с intake-нишами). Без ссылки на галерею — когда возьмём `fb_b2a67b22be2c`, секция станет точкой входа.

**RU:** label `// о чём можно мечтать`, heading «Люди без кода строят это»

1. **Коуч** — «Ассистент готовит саммари сессий и план следующей встречи — клиент получает письмо сам.»
2. **Музыкант** — «Пайплайн релиза: обложки, описания, рассылка по площадкам — из одной папки с треком.»
3. **Нон-профит** — «Грантовые заявки: агент собирает черновик из базы проектов под требования фонда.»
4. **Рисёрчер** — «Обзор литературы за вечер: скрапинг, выжимки, таблица источников.»
5. **Предприниматель** — «CRM из писем и встреч обновляется сама: ты видишь картину, не вбиваешь данные.»
6. **Контент-мейкер** — «Из одного длинного видео: посты, сценарии шортсов и рассылка в твоём стиле.»

**EN:** label `// what to dream about`, heading "People with no code background build this"

1. **Coach** — "An assistant preps session summaries and next-meeting plans — the client gets the email automatically."
2. **Musician** — "A release pipeline: covers, descriptions, distribution to platforms — from one folder with a track."
3. **Non-profit** — "Grant applications: an agent drafts them from your project base to fit each fund's requirements."
4. **Researcher** — "A literature review in one evening: scraping, digests, a table of sources."
5. **Founder** — "A CRM that updates itself from emails and meetings — you see the picture, not type the data."
6. **Content creator** — "From one long video: posts, shorts scripts, and a newsletter in your voice."

## 5. FAQ — +3 пары в существующий `t.faq.items`

Добавляются в конец списка (после «Чем отличается от других AI-курсов?»).

**RU:**
1. **«Почему не нанять фрилансера?»** — «Фрилансер сделает один раз и уйдёт. Система остаётся у тебя, работает каждый день и переделывается за минуты, а не за новый бюджет.»
2. **«Мой чат и так всё помнит»** — «Память чата — это заметки о тебе. Система помнит проект целиком: файлы, историю решений, процессы — и действует на их основе.»
3. **«Почему бесплатно? Где подвох?»** — «Подвоха нет: курс бесплатный целиком. Это открытая часть моей практики — дальше у меня есть коучинг и работа с командами, и курс — лучшее знакомство. Ты ничего не должен.»

**EN:**
1. **"Why not just hire a freelancer?"** — "A freelancer does it once and leaves. A system stays with you, works every day, and gets reworked in minutes — not for another budget."
2. **"My chat already remembers everything"** — "Chat memory is notes about you. A system remembers the whole project — files, decision history, processes — and acts on them."
3. **"Why free? What's the catch?"** — "No catch: the course is fully free. It's the open part of my practice — I also do coaching and work with teams, and the course is the best introduction. You owe nothing."

---

## Структуры данных (`lib/dictionaries.ts`, interface `Dictionary`)

```ts
chatVsSystem: {
  label: string
  heading: string        // с \n — рендерится через whiteSpace: 'pre-line'
  hook: string
  chatColLabel: string
  systemColLabel: string
  rows: { chat: string; system: string }[]
}
beforeAfter: {
  label: string
  heading: string
  beforeLabel: string
  afterLabel: string
  items: { before: string; after: string }[]
}
dreams: {
  label: string
  heading: string
  items: { niche: string; build: string }[]
}
```

Интерфейс типизирует обе локали — рассинхрон структуры RU/EN ловится тайпчеком. `faq` не меняет структуру.

## Файлы

| Файл | Изменение |
|---|---|
| `LMS/tochka-sborki/web/lib/dictionaries.ts` | `hero.subtitle` (RU+EN), новые поля `chatVsSystem`, `beforeAfter`, `dreams` (RU+EN), `faq.items` +3 (RU+EN) |
| `LMS/tochka-sborki/web/components/chat-vs-system.tsx` | NEW, серверный компонент, props `{ locale: Locale }` |
| `LMS/tochka-sborki/web/components/before-after.tsx` | NEW, серверный компонент, props `{ locale: Locale }` |
| `LMS/tochka-sborki/web/components/dream-scenarios.tsx` | NEW, серверный компонент, props `{ locale: Locale }` |
| `LMS/tochka-sborki/web/components/pages/home-page.tsx` | +3 импорта, +3 вставки секций по порядку выше |

Стилистика компонентов — как существующие секции: CSS custom properties (`--bg-secondary`, `--border-color`, `--text-accent`…), mono-лейблы секций, чередование фона секций сохраняется, мобильный брейкпоинт 720px.

## Проверка

- `npm run build` в `LMS/tochka-sborki/web/` (static export, тайпчек).
- `npx vitest run` — существующие тесты не задеты (контент статичный, новых тестов нет).
- Визуально: RU `/` и EN `/en/`, десктоп + мобила (стек таблицы контраста), light/dark темы.

## Вне скоупа (следующие тикеты)

- Hub-карточка курса на mamaev.coach — отдельный тикет (решение из скоупинга).
- Пролог курса и рамка intake — два других места приземления спайна из value-prop сессии.
- Галерея кейсов `fb_b2a67b22be2c` — секция «О чём можно мечтать» станет её точкой входа.
