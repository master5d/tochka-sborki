# Assembly Point S1 — Essay Manifesto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Опубликовать в blog эссе-манифест переплавленной рамки (Borrowed Tools → Personal Practice → Sovereign Practice, Practice OS, rough draft first) — слайс S1 эпика Assembly Point (тикет fb_74314d66685d).

**Architecture:** Обычный blog-пост по штатному конвейеру: CLI-scaffolder генерит component + 2 route, проза вписывается в component (обе локали), запись добавляется в реестр `blog/lib/posts.ts` — все производные (index, RSS, sitemap, graph, manifest) выводятся из реестра сами. Никакого нового движка.

**Tech Stack:** Next.js (blog-апп mc_hub), vitest, tsc.

## Global Constraints

- Спека: `docs/superpowers/specs/2026-08-09-assembly-point-offline-practice-design.md`
- **Проза = owner-approved verbatim**: тексты в Task 2 переносить character-for-character, НЕ улучшать, НЕ перефразировать. Правки — только владельцем в этом файле до старта.
- Де-хастл: без scarcity/countdown/обещаний дохода/vanity-метрик. Индустриальный термин «AI Native» упоминается ровно один раз (SEO-мост).
- Sole-prop sacred: никаких nonprofit-фреймов.
- Рабочая директория blog-задач: `blog/` (пути ниже — от корня mc_hub).
- Коммиты из корня mc_hub: `git -C <mc_hub> ...`, файлы поимённо (не `add -A`).
- ⚠ type-ошибка в `*.test.ts` не роняет vitest/next-build → после правок гонять и `npx tsc --noEmit`.

---

### Task 1: Scaffold поста

**Files:**
- Create (генерятся CLI): `blog/components/blog/posts/assembly-point.tsx`, `blog/app/blog/assembly-point/page.tsx`, `blog/app/en/blog/assembly-point/page.tsx`

**Interfaces:**
- Produces: компонент `AssemblyPoint({ locale })` (имя генерит scaffolder из слага) + два route; registry-stub в stdout (НЕ вставлять — Task 3 даёт готовую запись).

- [x] **Step 1: Прогнать scaffolder**

```bash
cd blog && npm run new:post -- assembly-point
```

Expected: три строки `✓ ...` (component + 2 routes) и напечатанный Post-stub. Если `✗ exists` — остановиться и разобраться (no-overwrite guard).

- [x] **Step 2: Commit**

```bash
git -C . add blog/components/blog/posts/assembly-point.tsx blog/app/blog/assembly-point/page.tsx blog/app/en/blog/assembly-point/page.tsx
git commit -m "feat(blog): scaffold assembly-point essay (Assembly Point S1, fb_74314d6)"
```

---

### Task 2: Проза (verbatim из этого плана)

**Files:**
- Modify: `blog/components/blog/posts/assembly-point.tsx` (заменить оба TODO-блока)

**Interfaces:**
- Consumes: компонент из Task 1 (структура `if (locale === 'en') {...}` + RU-ветка, обёртки `<div className={styles.prose}>` сохранить, `styles.lead` на первом абзаце).
- Produces: готовый контент обеих локалей для Task 3/4.

- [x] **Step 1: EN-ветка — вставить verbatim**

Разметка: первый `<p className={styles.lead}>`, далее `<h2>`/`<p>` по структуре. Текст:

> Castaneda had a name for the place where a person's world gets put together: the assembly point. Shift it, he wrote, and the world itself re-assembles. I never expected a term from a sorcery book to become the most precise way to describe what is happening to us with AI. But here we are.
>
> **Three ways to hold the same tool**
>
> Watch how people actually work with AI and you will see three postures. They are not levels of talent. They are positions of the assembly point.
>
> The first posture is **borrowed tools**. You open a chat window somebody else built, type a question, copy the answer, close the tab. The tool remembers nothing about you, and tomorrow you will introduce yourself again. The market has a flattering name for the far end of this road — "AI Native" — but the label matters less than the posture: at this stage the tool is a vending machine. Useful, impersonal, and entirely someone else's.
>
> The second posture is **personal practice**. At some point you stop visiting the machine and start furnishing a room. You write down, once, who you are, how you work, what your red lines are — and the tool starts carrying that with you. Your notes become a knowledge base it can read. Your repeating chores become small automations. The conversations stop starting from zero. This is where most of the real gain lives, and almost nobody I meet has crossed into it.
>
> The third posture is **sovereign practice**, and it is quieter than it sounds. The memory, the knowledge base, the automations — they live where you can see them, copy them, move them. Plain files on your own disk, not a subscription's goodwill. If the vendor disappears tomorrow, your practice does not. Sovereignty is not a bunker; it is simply knowing that the room you furnished is yours.
>
> **A Practice OS**
>
> The thing you build across these postures has a shape, and I call it a Practice OS: the memory, the knowledge, the helpers and the routines of your work, assembled so that they compound instead of evaporating. For a therapist it might hold intake notes structure, session-prep rituals, the wording she trusts for hard conversations. For a writer, the voice files and the research trails. It is not a product you buy. It is a room you furnish — one honest shelf at a time.
>
> **Rough draft first**
>
> One rule does most of the work: let the tool take a thing to eighty percent, then take it to a hundred yourself. Never ask it for the final twenty first. The draft is the machine's job; the judgment, the voice, the signature — those stay yours. People who reverse this order get the uncanny, airbrushed output everyone has learned to distrust. People who keep it produce more of their own work, faster, and it still sounds like them.
>
> **Why I care about the sovereignty part**
>
> I spent years as a kundalini yoga teacher before I built software. The thing I am proudest of from that life is the students who stopped needing me. A teacher grows teachers — that was the whole ethic. I hold tools to the same standard. An AI setup that deepens your dependence on it has failed you the same way a guru who cultivates followers has. The assembly point should end up in your hands.
>
> That is the frame. The practice of moving the point — that is slower, more personal work, and it is what I do now.

- [x] **Step 2: RU-ветка — вставить verbatim**

> У Кастанеды было имя для места, где собирается мир человека: точка сборки. Сдвинь её — и мир пересоберётся. Я не ожидал, что термин из книги о магии окажется самым точным словом для того, что происходит с нами и AI. Но вот мы здесь.
>
> **Три способа держать один и тот же инструмент**
>
> Посмотрите, как люди на самом деле работают с AI, и вы увидите три позы. Это не уровни таланта. Это положения точки сборки.
>
> Первая поза — **чужие инструменты**. Ты открываешь чат, который построил кто-то другой, задаёшь вопрос, копируешь ответ, закрываешь вкладку. Инструмент ничего о тебе не помнит, и завтра ты будешь представляться заново. У рынка есть льстивое имя для дальнего конца этой дороги — «AI Native», — но поза важнее ярлыка: на этой стадии инструмент — торговый автомат. Полезный, безличный и целиком чей-то чужой.
>
> Вторая поза — **личная практика**. В какой-то момент ты перестаёшь ходить к автомату и начинаешь обставлять комнату. Ты один раз записываешь, кто ты, как работаешь, где твои красные линии, — и инструмент начинает носить это с собой. Твои заметки становятся базой знаний, которую он умеет читать. Повторяющаяся рутина — маленькими автоматизациями. Разговоры перестают начинаться с нуля. Здесь живёт почти вся настоящая выгода — и почти никто из тех, кого я встречаю, сюда не перешёл.
>
> Третья поза — **суверенная практика**, и она тише, чем звучит. Память, база знаний, автоматизации живут там, где ты можешь их увидеть, скопировать, унести. Обычные файлы на твоём диске, а не добрая воля подписки. Если вендор завтра исчезнет — твоя практика нет. Суверенность — не бункер; это просто знание, что обставленная комната — твоя.
>
> **Practice OS**
>
> У того, что собирается через эти позы, есть форма, и я зову её Practice OS: память, знания, помощники и ритуалы твоей работы, собранные так, чтобы накапливаться, а не испаряться. У терапевта там может жить структура интейк-заметок, ритуал подготовки к сессии, формулировки для трудных разговоров, которым она доверяет. У пишущего — файлы голоса и следы исследований. Это не продукт, который покупают. Это комната, которую обставляют — по одной честной полке.
>
> **Сначала черновик**
>
> Одно правило делает большую часть работы: дай инструменту довести вещь до восьмидесяти процентов — и доведи до ста сам. Никогда не проси у него последние двадцать первыми. Черновик — работа машины; суждение, голос, подпись — твои. Кто переворачивает порядок, получает тот прилизанный, неживой выхлоп, которому все уже научились не верить. Кто держит порядок — делает больше своей работы, быстрее, и она всё ещё звучит как он сам.
>
> **Почему мне важна часть про суверенность**
>
> До того как строить софт, я годами преподавал кундалини-йогу. Из той жизни я больше всего горжусь учениками, которым я перестал быть нужен. Учитель растит учителей — в этом была вся этика. К инструментам у меня та же мерка. AI-сетап, углубляющий твою зависимость от себя, подвёл тебя так же, как гуру, выращивающий последователей. Точка сборки должна оказаться в твоих руках.
>
> Это рамка. Сдвигать точку — работа медленнее и личнее, и именно ей я теперь занимаюсь.

- [x] **Step 3: Проверка сборки компонента**

```bash
cd blog && npx tsc --noEmit && npx vitest run
```

Expected: tsc чистый; vitest зелёный (posts.test.ts ещё не знает пост — падать не должен, реестр не тронут).

- [x] **Step 4: Commit**

```bash
git -C . add blog/components/blog/posts/assembly-point.tsx
git commit -m "feat(blog): assembly-point essay prose, RU+EN (owner-approved verbatim)"
```

---

### Task 3: Запись в реестр

**Files:**
- Modify: `blog/lib/posts.ts` (append в массив `posts`)

**Interfaces:**
- Consumes: тип `Post` (slug/title/description/date/author/readingTime/tags/related/en).
- Produces: пост виден index/RSS/sitemap/graph/manifest (всё выводится из реестра).

- [x] **Step 1: Добавить запись (точный литерал)**

```ts
{
  slug: 'assembly-point',
  title: 'Точка сборки: от чужих инструментов к суверенной практике',
  description:
    'Три позы работы с AI — чужие инструменты, личная практика, суверенная практика. Practice OS, правило «сначала черновик» и почему учитель растит учителей, а не последователей.',
  date: '2026-08-09',
  author: 'Александр Мамаев',
  readingTime: '~6 мин',
  tags: ['AI', 'практика', 'суверенность', 'Точка Сборки'],
  related: ['charter', 'prologue'],
  en: {
    title: 'The Assembly Point: from borrowed tools to a sovereign practice',
    description:
      'Three postures of working with AI — borrowed tools, personal practice, sovereign practice. The Practice OS, the rough-draft-first rule, and why a teacher grows teachers, not followers.',
    readingTime: '~6 min',
  },
},
```

- [x] **Step 2: Тесты + сборка**

```bash
cd blog && npx vitest run && npx tsc --noEmit && npm run build
```

Expected: всё зелёное; build эмитит `/blog/assembly-point/` и `/en/blog/assembly-point/` в `out/`.

- [x] **Step 3: Глазная проверка рендера** (канон verify_rendered_output_visually)

Поднять статик локально, открыть обе локали, прочитать глазами (заголовок, lead, h2-структура, отсутствие TODO):

```bash
cd blog && npx serve out -l 4711
```

⚠ после проверки процесс `serve` УБИТЬ — stale serve держит `out/` и роняет следующий build (EBUSY).

- [x] **Step 4: Commit**

```bash
git -C . add blog/lib/posts.ts
git commit -m "feat(blog): register assembly-point essay (Assembly Point S1, fb_74314d6)"
```

---

### Task 4: Закрыть тикет

- [x] **Step 1: Статус на доске**

```bash
cd feedback && node scripts/fb.mjs status fb_74314d66685d done
```

- [x] **Step 2: Commit доски**

```bash
git -C . add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): Assembly Point S1 essay -> done (fb_74314d6)"
```

Деплой — автоматом на `git push main` (job deploy-hub: blog→hub→merge). Пуш — только по команде владельца.
