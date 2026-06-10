# Value Clarity LMS Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Лендинг `ai.mamaev.coach` отвечает на три вопроса не-технаря («что изменится в моей жизни», «чем лучше моего чата», «о чём можно мечтать») — новый hero-спайн + три новые секции + три FAQ-возражения, RU+EN.

**Architecture:** Подход A из спеки `docs/superpowers/specs/2026-06-10-value-clarity-design.md` — весь текст в `lib/dictionaries.ts` (интерфейс `Dictionary` типизирует обе локали), каждая новая секция — серверный компонент (паттерн `ProgramVenn`), `home-page.tsx` только компонует. Тикет: `fb_8423715c58e2`.

**Tech Stack:** Next.js 16 App Router (static export), TypeScript, Vitest, inline styles + CSS custom properties (как существующие секции).

**Working dir:** все пути ниже — от `LMS/tochka-sborki/web/` внутри репо `C:\telo\Efforts\Ongoing\mc_hub`. Команды запускать из `LMS/tochka-sborki/web/`.

**Branch:** работа в ветке `value-clarity-landing` от `main` (создаётся в Task 1, Step 0).

---

### Task 1: Словарь — типы, RU/EN данные, parity-тест

**Files:**
- Create: `LMS/tochka-sborki/web/lib/dictionaries.test.ts`
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts`

- [ ] **Step 0: Создать ветку**

```bash
git checkout -b value-clarity-landing
```

- [ ] **Step 1: Написать failing parity-тест**

Создать `lib/dictionaries.test.ts` с содержимым:

```ts
import { describe, expect, it } from 'vitest'
import { getDictionary } from './dictionaries'

const ru = getDictionary('ru')
const en = getDictionary('en')

describe('value-clarity dictionary parity (fb_8423715c58e2)', () => {
  it('chatVsSystem has 4 rows in both locales', () => {
    expect(ru.chatVsSystem.rows).toHaveLength(4)
    expect(en.chatVsSystem.rows).toHaveLength(ru.chatVsSystem.rows.length)
  })

  it('beforeAfter has 3 items in both locales', () => {
    expect(ru.beforeAfter.items).toHaveLength(3)
    expect(en.beforeAfter.items).toHaveLength(ru.beforeAfter.items.length)
  })

  it('dreams has 6 items in both locales', () => {
    expect(ru.dreams.items).toHaveLength(6)
    expect(en.dreams.items).toHaveLength(ru.dreams.items.length)
  })

  it('faq includes the three objection pairs in both locales', () => {
    expect(ru.faq.items).toHaveLength(7)
    expect(en.faq.items).toHaveLength(7)
  })

  it('hero subtitle carries the spine (no jargon)', () => {
    expect(ru.hero.subtitle).toContain('доводит до конца')
    expect(en.hero.subtitle).toContain('carries to the finish')
    for (const s of [ru.hero.subtitle, en.hero.subtitle]) {
      expect(s).not.toMatch(/MCP|agentic|оркестрац|orchestrat/i)
    }
  })
})
```

- [ ] **Step 2: Убедиться, что тест падает**

Run: `npx vitest run lib/dictionaries.test.ts`
Expected: FAIL — TypeScript/поля `chatVsSystem`, `beforeAfter`, `dreams` не существуют, faq длина 4, subtitle старый.

- [ ] **Step 3: Добавить типы в `Dictionary`**

В `lib/dictionaries.ts` в `export type Dictionary` после строки `forWho: { title: string; body: string }[]` (строка ~29) вставить:

```ts
  chatVsSystem: {
    label: string
    heading: string
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

- [ ] **Step 4: RU-данные**

4a. Заменить RU `hero.subtitle` (строка ~164):

старое:
```ts
      subtitle: 'Курс по agentic AI в потоке. От нонкодера до AI-generalist’а — Claude Code, Hermes/Aider, локальные модели, MCP, оркестрация. Твой стек на выбор.',
```
новое:
```ts
      subtitle: 'Сейчас AI тебе советует — а делаешь ты всё равно руками. Курс научит превращать замыслы в задачи, которые AI доводит до конца. Без кода. На твоём языке.',
```

4b. После закрытия RU-массива `forWho` (строка `],` перед `program: {`, ~строка 182) вставить:

```ts
    chatVsSystem: {
      label: '// чат vs система',
      heading: 'Чат отвечает.\nСистема делает.',
      hook: 'Ты пользуешься AI каждый день — и всё равно делаешь руками то, что он мог бы сделать за тебя. С этого разрыва начинается путь.',
      chatColLabel: 'Твой чат сейчас',
      systemColLabel: 'После курса',
      rows: [
        { chat: 'Советует — а делаешь ты руками', system: 'Поручаешь — и получаешь готовый результат' },
        { chat: 'Каждый раз объясняешь всё заново', system: 'Твой проект и контекст он уже знает' },
        { chat: 'Один вопрос — один ответ', system: 'Один замысел — многошаговая работа до конца' },
        { chat: 'Результат живёт во вкладке, копируешь сам', system: 'Результат появляется там, где он нужен: в файлах, письмах, таблицах' },
      ],
    },
    beforeAfter: {
      label: '// что изменится',
      heading: 'Что изменится за курс',
      beforeLabel: 'Было',
      afterLabel: 'Стало',
      items: [
        { before: 'Вечер уходит на отчёт: собираешь данные из пяти источников руками.', after: 'Агент собирает черновик за 10 минут — ты проверяешь и отправляешь.' },
        { before: '30 вкладок исследования, половина теряется.', after: 'Поручил агенту — получил выжимку с источниками одним файлом.' },
        { before: 'Каждую неделю одни и те же рутинные шаги.', after: 'Описал процесс один раз — система повторяет сама.' },
      ],
    },
    dreams: {
      label: '// о чём можно мечтать',
      heading: 'Люди без кода строят это',
      items: [
        { niche: 'Коуч', build: 'Ассистент готовит саммари сессий и план следующей встречи — клиент получает письмо сам.' },
        { niche: 'Музыкант', build: 'Пайплайн релиза: обложки, описания, рассылка по площадкам — из одной папки с треком.' },
        { niche: 'Нон-профит', build: 'Грантовые заявки: агент собирает черновик из базы проектов под требования фонда.' },
        { niche: 'Рисёрчер', build: 'Обзор литературы за вечер: скрапинг, выжимки, таблица источников.' },
        { niche: 'Предприниматель', build: 'CRM из писем и встреч обновляется сама: ты видишь картину, не вбиваешь данные.' },
        { niche: 'Контент-мейкер', build: 'Из одного длинного видео: посты, сценарии шортсов и рассылка в твоём стиле.' },
      ],
    },
```

4c. В RU `faq.items` после элемента `{ q: 'Чем отличается от других AI-курсов?', ... }` добавить:

```ts
        { q: 'Почему не нанять фрилансера?', a: 'Фрилансер сделает один раз и уйдёт. Система остаётся у тебя, работает каждый день и переделывается за минуты, а не за новый бюджет.' },
        { q: 'Мой чат и так всё помнит', a: 'Память чата — это заметки о тебе. Система помнит проект целиком: файлы, историю решений, процессы — и действует на их основе.' },
        { q: 'Почему бесплатно? Где подвох?', a: 'Подвоха нет: курс бесплатный целиком. Это открытая часть моей практики — дальше у меня есть коучинг и работа с командами, и курс — лучшее знакомство. Ты ничего не должен.' },
```

- [ ] **Step 5: EN-данные**

5a. Заменить EN `hero.subtitle` (строка ~352):

старое:
```ts
      subtitle: 'An agentic-AI course in flow. From non-coder to AI generalist — Claude Code, Hermes/Aider, local models, MCP, orchestration. Pick your stack.',
```
новое:
```ts
      subtitle: 'Right now AI gives you advice — and you still do everything by hand. This course teaches you to turn your ideas into tasks AI carries to the finish. No code. In your own words.',
```

5b. После закрытия EN-массива `forWho` (строка `],` перед `program: {`, ~строка 370) вставить:

```ts
    chatVsSystem: {
      label: '// chat vs system',
      heading: 'A chat answers.\nA system gets it done.',
      hook: 'You use AI every day — and still do by hand what it could do for you. That gap is where this course begins.',
      chatColLabel: 'Your chat today',
      systemColLabel: 'After the course',
      rows: [
        { chat: 'Gives advice — you do the work by hand', system: 'You delegate — and get the finished result' },
        { chat: 'You explain everything from scratch every time', system: 'It already knows your project and context' },
        { chat: 'One question — one answer', system: 'One idea — multi-step work carried to the end' },
        { chat: 'Results live in a browser tab, you copy them out', system: 'Results land where they belong: files, emails, spreadsheets' },
      ],
    },
    beforeAfter: {
      label: '// what changes',
      heading: 'What changes after the course',
      beforeLabel: 'Before',
      afterLabel: 'After',
      items: [
        { before: 'An evening goes into a report: you gather data from five sources by hand.', after: 'An agent drafts it in 10 minutes — you review and send.' },
        { before: '30 research tabs, half of them lost.', after: 'Delegate it — get a digest with sources in a single file.' },
        { before: 'The same routine steps every week.', after: 'Describe the process once — the system repeats it on its own.' },
      ],
    },
    dreams: {
      label: '// what to dream about',
      heading: 'People with no code background build this',
      items: [
        { niche: 'Coach', build: 'An assistant preps session summaries and next-meeting plans — the client gets the email automatically.' },
        { niche: 'Musician', build: 'A release pipeline: covers, descriptions, distribution to platforms — from one folder with a track.' },
        { niche: 'Non-profit', build: 'Grant applications: an agent drafts them from your project base to fit each fund’s requirements.' },
        { niche: 'Researcher', build: 'A literature review in one evening: scraping, digests, a table of sources.' },
        { niche: 'Founder', build: 'A CRM that updates itself from emails and meetings — you see the picture, not type the data.' },
        { niche: 'Content creator', build: 'From one long video: posts, shorts scripts, and a newsletter in your voice.' },
      ],
    },
```

5c. В EN `faq.items` после `{ q: 'How is this different from other AI courses?', ... }` добавить:

```ts
        { q: 'Why not just hire a freelancer?', a: 'A freelancer does it once and leaves. A system stays with you, works every day, and gets reworked in minutes — not for another budget.' },
        { q: 'My chat already remembers everything', a: 'Chat memory is notes about you. A system remembers the whole project — files, decision history, processes — and acts on them.' },
        { q: 'Why free? What’s the catch?', a: 'No catch: the course is fully free. It’s the open part of my practice — I also do coaching and work with teams, and the course is the best introduction. You owe nothing.' },
```

- [ ] **Step 6: Тест зелёный + существующие тесты целы**

Run: `npx vitest run`
Expected: PASS все файлы, включая `lib/dictionaries.test.ts` (5 tests) и существующие `lib/content.test.ts` и др.

- [ ] **Step 7: Commit**

```bash
git add lib/dictionaries.ts lib/dictionaries.test.ts
git commit -m "feat(lms): словарь ясности ценности — hero-спайн, чат vs система, before/after, мечты, FAQ-возражения (fb_8423715)"
```

---

### Task 2: Компонент ChatVsSystem

**Files:**
- Create: `LMS/tochka-sborki/web/components/chat-vs-system.tsx`

- [ ] **Step 1: Создать компонент** (полное содержимое файла):

```tsx
import { getDictionary, type Locale } from '@/lib/dictionaries'

interface Props { locale: Locale }

export function ChatVsSystem({ locale }: Props) {
  const t = getDictionary(locale).chatVsSystem

  return (
    <section className="home-section" style={{
      padding: 'var(--section-gap) 2rem',
      borderTop: '1px solid var(--border-color)',
    }}>
      <style>{`
        .cvs-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }
        .cvs-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid var(--border-color);
        }
        .cvs-cell-label { display: none; }
        @media (max-width: 720px) {
          .cvs-header { display: none; }
          .cvs-row { grid-template-columns: 1fr; gap: 0.75rem; padding: 1.5rem 0; }
          .cvs-cell-label {
            display: block;
            font-family: var(--font-mono);
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.35rem;
          }
        }
      `}</style>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          {t.label}
        </div>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 1,
          marginBottom: '1.5rem',
          whiteSpace: 'pre-line',
        }}>
          {t.heading}
        </h2>
        <p style={{
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '3rem',
        }}>
          {t.hook}
        </p>
        <div className="cvs-header">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t.chatColLabel}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {t.systemColLabel}
          </div>
        </div>
        {t.rows.map(row => (
          <div key={row.chat} className="cvs-row">
            <div>
              <span className="cvs-cell-label" style={{ color: 'var(--text-secondary)' }}>{t.chatColLabel}</span>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{row.chat}</p>
            </div>
            <div>
              <span className="cvs-cell-label" style={{ color: 'var(--text-accent)' }}>{t.systemColLabel}</span>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 600 }}>{row.system}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Тайпчек**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/chat-vs-system.tsx
git commit -m "feat(lms): секция «Чат vs Система» — хук + контраст разрыва (fb_8423715)"
```

---

### Task 3: Компонент BeforeAfter

**Files:**
- Create: `LMS/tochka-sborki/web/components/before-after.tsx`

- [ ] **Step 1: Создать компонент** (полное содержимое файла):

```tsx
import { getDictionary, type Locale } from '@/lib/dictionaries'

interface Props { locale: Locale }

export function BeforeAfter({ locale }: Props) {
  const t = getDictionary(locale).beforeAfter

  return (
    <section className="home-section" style={{
      padding: 'var(--section-gap) 2rem',
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
          {t.label}
        </div>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: '3rem',
          lineHeight: 1,
        }}>
          {t.heading}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
        }}>
          {t.items.map(item => (
            <div key={item.before} style={{ paddingTop: '1rem', borderTop: 'var(--accent-line)' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
              }}>
                {t.beforeLabel}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                {item.before}
              </p>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.5rem',
              }}>
                {t.afterLabel}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 600 }}>
                {item.after}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

(Без `borderTop` у секции: предыдущая секция «Для кого» уже даёт `borderBottom`.)

- [ ] **Step 2: Тайпчек**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/before-after.tsx
git commit -m "feat(lms): секция «Что изменится за курс» — before/after виньетки (fb_8423715)"
```

---

### Task 4: Компонент DreamScenarios

**Files:**
- Create: `LMS/tochka-sborki/web/components/dream-scenarios.tsx`

- [ ] **Step 1: Создать компонент** (полное содержимое файла):

```tsx
import { getDictionary, type Locale } from '@/lib/dictionaries'

interface Props { locale: Locale }

export function DreamScenarios({ locale }: Props) {
  const t = getDictionary(locale).dreams

  return (
    <section className="home-section" style={{
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
          marginBottom: '1rem',
        }}>
          {t.label}
        </div>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          marginBottom: '3rem',
          lineHeight: 1,
        }}>
          {t.heading}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
        }}>
          {t.items.map(item => (
            <div key={item.niche} style={{ paddingTop: '1rem', borderTop: 'var(--accent-line)' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
                letterSpacing: '0.03em',
              }}>
                {item.niche}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.build}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Тайпчек**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/dream-scenarios.tsx
git commit -m "feat(lms): секция «О чём можно мечтать» — 6 ниш, задел галереи кейсов (fb_8423715)"
```

---

### Task 5: Интеграция в home-page + сборка

**Files:**
- Modify: `LMS/tochka-sborki/web/components/pages/home-page.tsx`

- [ ] **Step 1: Импорты**

После строки `import { HeroSecondaryCta } from '@/components/hero-secondary-cta'` добавить:

```tsx
import { ChatVsSystem } from '@/components/chat-vs-system'
import { BeforeAfter } from '@/components/before-after'
import { DreamScenarios } from '@/components/dream-scenarios'
```

- [ ] **Step 2: Вставка секций** (порядок из спеки)

2a. Сразу после закрытия hero-секции (`</section>` после блока с `<HeroSecondaryCta locale={locale} />`, перед комментарием `{/* ── ДЛЯ КОГО ─...`) вставить:

```tsx
      <ChatVsSystem locale={locale} />
```

2b. После закрытия секции «ДЛЯ КОГО» (`</section>` перед `<ProgramVenn locale={locale} />`) вставить:

```tsx
      <BeforeAfter locale={locale} />
```

2c. После закрытия секции «ПРОГРАММА» (`</section>` перед комментарием `{/* ── ОБ АВТОРЕ ─...`) вставить:

```tsx
      <DreamScenarios locale={locale} />
```

- [ ] **Step 3: Сборка и тесты**

Run (из `LMS/tochka-sborki/web/`): `npm run build && npx vitest run`
Expected: build OK (static export, RU `/` + EN `/en/` сгенерированы), все тесты PASS.

- [ ] **Step 4: Commit**

```bash
git add components/pages/home-page.tsx
git commit -m "feat(lms): интеграция секций ясности ценности в лендинг (fb_8423715)"
```

---

### Task 6: Финальная верификация и закрытие тикета

- [ ] **Step 1: Визуальная проверка** (опционально, если есть браузер): `npx serve out` → проверить `/` и `/en/`: порядок секций, стек контраст-таблицы на ≤720px, light/dark.

- [ ] **Step 2: Прогон всего тест-сьюта ещё раз из чистого состояния**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 3: Статус тикета** (из корня репо):

```bash
node feedback/scripts/fb.mjs status fb_8423715 done
```

(Выполнять после мержа в main — оставить на финальный шаг finishing-a-development-branch.)
