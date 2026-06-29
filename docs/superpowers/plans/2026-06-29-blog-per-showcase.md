# Blog-post-per-showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish 4 deep-dive use-case blog posts (one per real showcase case) and wire each LMS real case to its post with a locale-correct, drift-guarded link.

**Architecture:** Follow the existing blog post pattern (registry entry + body component + RU route + EN route) for 4 new posts in the standalone `blog/` app; then add a locale-aware `deepDiveUrl` helper + `deepDive` slug field to the LMS `showcase.ts` and set the 4 slugs. The showcase-gallery UI already renders `href` as a link — no component change. A parametrized test on each side pins the slug contract.

**Tech Stack:** Next.js 16 (App Router, static export), React, TypeScript, Vitest. No new dependencies.

## Global Constraints

- Two apps, two test suites: blog posts under `blog/` (run `cd blog && npm run test` / `npm run build`); showcase wiring under `LMS/tochka-sborki/web/` (run `cd LMS/tochka-sborki/web && npm run test` / `npm run build`). No cross-app imports.
- Post prose is wrapped in JSX expression strings — `{"…"}` (double-quoted) with typographic quotes («» for RU, "" for EN) inside — to satisfy the repo's `react/no-unescaped-entities` lint, exactly as existing posts do. Straight apostrophes inside double-quoted strings are fine.
- All posts: `author: 'Александр Мамаев'`, `date: '2026-06-29'`, published (no `draft`), essay (no `kind`), full `en` block.
- Authenticity (sacred): grounded in real project facts only; the honest payoff paragraph reuses each case's existing `result` line; invent no metrics, testimonials, or results. De-guru, de-hustle, no scarcity/glossy.
- Slugs are the cross-app contract: `echo`, `diagram-canvas`, `the-site-itself`, `second-brain`. No collision with existing slugs (prologue, horizons, charter, desops-hub, imagination, nervous-strength, graph).
- Canonical link form: `https://mamaev.coach/blog/<slug>/` (ru), `https://mamaev.coach/en/blog/<slug>/` (en).
- Order = dark-ship discipline: posts (Tasks 1–4) exist before LMS lights the links (Task 5).
- Commit directly to `main` (trunk-based). Do NOT create a feature branch. End every commit message with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Blog post `echo`

**Files:**
- Modify: `blog/lib/posts.ts` (append registry entry)
- Create: `blog/components/blog/posts/echo.tsx`
- Create: `blog/app/blog/echo/page.tsx`
- Create: `blog/app/en/blog/echo/page.tsx`
- Test: `blog/lib/posts.test.ts` (add the parametrized contract guard, seeded with `echo`)

**Interfaces:**
- Consumes: `Post` type, `getPost`, `getAllPosts` from `blog/lib/posts.ts`; `PostLayout` from `@/components/blog/post-layout`; `styles` from `../blog-prose.module.css`.
- Produces: `export function Echo({ locale }: { locale: 'ru' | 'en' })`; registry post with `slug: 'echo'`; the `CONTRACT_SLUGS` parametrized guard (extended in later tasks).

- [ ] **Step 1: Write the failing contract guard**

Append to `blog/lib/posts.test.ts` (after the final `})` of the existing `describe`):

```ts
describe('showcase deep-dive contract', () => {
  const CONTRACT_SLUGS = ['echo']
  for (const slug of CONTRACT_SLUGS) {
    it(`${slug}: published bilingual post exists`, () => {
      const p = getPost(slug)
      expect(p, slug).toBeTruthy()
      expect(p!.draft, `${slug} must not be draft`).toBeFalsy()
      expect(p!.author).toBe('Александр Мамаев')
      expect(p!.en, `${slug} needs an en block`).toBeTruthy()
      expect(getAllPosts('ru').some(x => x.slug === slug), `${slug} in ru index`).toBe(true)
      expect(getAllPosts('en').some(x => x.slug === slug), `${slug} in en index`).toBe(true)
    })
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: FAIL — `echo` post does not exist (`getPost('echo')` is undefined).

- [ ] **Step 3: Add the registry entry**

In `blog/lib/posts.ts`, append this object to the `posts` array (after the `nervous-strength` entry, before the closing `]`):

```ts
  {
    slug: 'echo',
    title: 'Echo: голос вместо клавиатуры — и как я собрал его сам',
    description:
      'Печать всегда отставала от мысли. Я собрал офлайн-диктовку, которая понимает русский и английский вперемешку и даже сидит со мной на встречах — без команды разработки.',
    date: '2026-06-29',
    author: 'Александр Мамаев',
    readingTime: '~6 мин',
    tags: ['AI', 'Echo', 'диктовка', 'кейсы', 'Точка Сборки'],
    related: ['horizons', 'prologue'],
    en: { title: 'Echo: voice instead of keyboard — and how I built it myself', description: "Typing always lagged behind the thought. I built an offline dictation app that understands Russian and English mixed together — and even sits in on my meetings. Without a dev team.", readingTime: '~6 min' },
  },
```

- [ ] **Step 4: Create the body component**

Create `blog/components/blog/posts/echo.tsx`:

```tsx
import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function Echo({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"A thought is always faster than fingers. You catch the exact phrasing — and lose it while you finish typing the sentence."}</p>
        <h2>What hurt</h2>
        <p>{"I think out loud better than I type. But the dictation tools at hand kept letting me down: some need the internet and ship your voice to someone else's server; others stumble the moment an English word lands inside a Russian phrase. And for me every other sentence is bilingual."}</p>
        <h2>What I built</h2>
        <p>{"Echo — a desktop app that listens and turns speech into text right on your own machine. Offline, no cloud. It doesn't break when you switch Russian↔English mid-sentence, and it runs on the GPU, so it isn't slow. It can even sit in on a meeting and write the brief itself — who said what, and what was agreed."}</p>
        <h2>How — without a team</h2>
        <p>{"I don't \"know\" the Rust and Tauri it's built on. I took an open-source base and from there described to an agent, in words, what I wanted: \"let it switch languages,\" \"let it save the note to a file.\" It wrote the code, I tested it on myself. That's how a tool that would once have needed a whole team grew solo."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> speech recognition, translating intent into code, the rough meeting brief.<br />
          <b>Stays yours:</b> what exactly to say — and the final word on the text.
        </div>
        <p><strong>{"I now dictate emails, notes and code — typing took a back seat."}</strong></p>
        <p>{"This is one of the four \"doors\" I wrote about in "}<a href="/en/blog/horizons/">horizons</a>{". If you want to build your own tool for your own task — that's where the course begins."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Мысль всегда быстрее пальцев. Ты ловишь точную формулировку — и теряешь её, пока добиваешь предложение на клавиатуре."}</p>
      <h2>Что болело</h2>
      <p>{"Я думаю вслух лучше, чем печатаю. Но диктовки, что были под рукой, всё время подводили: одни требуют интернет и отправляют твой голос на чужой сервер, другие спотыкаются, как только в русскую фразу влетает английское слово. А у меня каждое второе предложение — двуязычное."}</p>
      <h2>Что я собрал</h2>
      <p>{"Echo — настольное приложение, которое слушает и превращает речь в текст прямо на твоём компьютере. Офлайн, без облака. Оно не ломается на переключении русский↔английский посреди фразы и работает на видеокарте, так что не тормозит. А ещё умеет сидеть на встрече и сам писать конспект — кто что сказал и о чём договорились."}</p>
      <h2>Как — без команды</h2>
      <p>{"Я не «знаю» Rust и Tauri, на которых оно собрано. Я взял открытую заготовку и дальше описывал агенту словами, что хочу: «пусть переключает языки», «пусть сохраняет заметку в файл». Он писал код, я проверял на себе. Так в одиночку вырос инструмент, который раньше требовал бы целой команды."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> распознавание речи, перевод намерения в код, черновой конспект встречи.<br />
        <b>Остаётся твоим:</b> что именно сказать — и финальное слово в тексте.
      </div>
      <p><strong>{"Письма, заметки и код теперь надиктовываю — печать ушла на второй план."}</strong></p>
      <p>{"Это одна из четырёх «дверей», о которых я писал в "}<a href="/blog/horizons/">горизонтах</a>{". Если хочешь собрать свой инструмент под свою задачу — с этого начинается курс."}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create the RU route**

Create `blog/app/blog/echo/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Echo } from '@/components/blog/posts/echo'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Echo: голос вместо клавиатуры — и как я собрал его сам'
const description =
  'Печать всегда отставала от мысли. Я собрал офлайн-диктовку, которая понимает русский и английский вперемешку и даже сидит со мной на встречах — без команды разработки.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/echo/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/echo/',
      'en-US': 'https://mamaev.coach/en/blog/echo/',
      'x-default': 'https://mamaev.coach/blog/echo/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/echo/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function EchoPage() {
  return (
    <PostLayout post={getPost('echo')!} locale="ru">
      <Echo locale="ru" />
    </PostLayout>
  )
}
```

- [ ] **Step 6: Create the EN route**

Create `blog/app/en/blog/echo/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Echo } from '@/components/blog/posts/echo'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Echo: voice instead of keyboard — and how I built it myself'
const description =
  "Typing always lagged behind the thought. I built an offline dictation app that understands Russian and English mixed together — and even sits in on my meetings. Without a dev team."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/echo/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/echo/',
      'en-US': 'https://mamaev.coach/en/blog/echo/',
      'x-default': 'https://mamaev.coach/blog/echo/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/echo/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function EchoPageEn() {
  return (
    <PostLayout post={getPost('echo')!} locale="en">
      <Echo locale="en" />
    </PostLayout>
  )
}
```

- [ ] **Step 7: Run the test + build**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: PASS (the `echo` contract case green).

Run: `cd blog && npm run build`
Expected: build succeeds; routes `/blog/echo/` and `/en/blog/echo/` are emitted.

- [ ] **Step 8: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts blog/components/blog/posts/echo.tsx blog/app/blog/echo blog/app/en/blog/echo
git commit -m "feat(blog): deep-dive post 'echo' + showcase contract guard (fb_83d05aa7ee6f)"
```

---

### Task 2: Blog post `diagram-canvas`

**Files:**
- Modify: `blog/lib/posts.ts` (append registry entry)
- Create: `blog/components/blog/posts/diagram-canvas.tsx`
- Create: `blog/app/blog/diagram-canvas/page.tsx`
- Create: `blog/app/en/blog/diagram-canvas/page.tsx`
- Test: `blog/lib/posts.test.ts` (extend `CONTRACT_SLUGS`)

**Interfaces:**
- Produces: `export function DiagramCanvas({ locale }: { locale: 'ru' | 'en' })`; registry post `slug: 'diagram-canvas'`.

- [ ] **Step 1: Extend the contract guard (red)**

In `blog/lib/posts.test.ts`, change the `CONTRACT_SLUGS` line to:

```ts
  const CONTRACT_SLUGS = ['echo', 'diagram-canvas']
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: FAIL — `diagram-canvas` post does not exist.

- [ ] **Step 3: Add the registry entry**

In `blog/lib/posts.ts`, append after the `echo` entry:

```ts
  {
    slug: 'diagram-canvas',
    title: 'Канвас, который рисует схемы за меня',
    description:
      'Диаграммы съедали по часу: перетаскивать прямоугольники, воевать с выравниванием — и идея остывала. Я собрал холст, где двигаешь смысл, а схему рисуют генераторы в фоне.',
    date: '2026-06-29',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['AI', 'диаграммы', 'кейсы', 'инструменты', 'Точка Сборки'],
    related: ['horizons', 'prologue'],
    en: { title: 'A canvas that draws the diagrams for me', description: "Diagrams used to eat an hour each: dragging rectangles, fighting alignment — and the idea went cold. I built a canvas where you move meaning and generators draw the diagram in the background.", readingTime: '~5 min' },
  },
```

- [ ] **Step 4: Create the body component**

Create `blog/components/blog/posts/diagram-canvas.tsx`:

```tsx
import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function DiagramCanvas({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"The idea is clear in your head — and the canvas is still empty, because you've spent an hour nudging rectangles."}</p>
        <h2>What hurt</h2>
        <p>{"Any diagram editor turns a simple thought into busywork: draw a box, align it, run an arrow, fix it when everything shifts. By the time the diagram is ready the idea has gone cold and you've forgotten half the nuances."}</p>
        <h2>What I built</h2>
        <p>{"A canvas where you don't draw — you describe the meaning, and the layout and the shapes themselves get drawn by generators running in the background. The same material can be seen as a diagram, as an outline, or as calm reading text. You move meaning, not rectangles."}</p>
        <h2>How — without a team</h2>
        <p>{"I built it the same way I describe in the course: I didn't sit down to learn graph engines, I explained to an agent what should happen, and it laid out the shapes. The boring part — alignment, coordinates — the machine does itself."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> layout, drawing, alignment.<br />
          <b>Stays yours:</b> the meaning, and how things connect.
        </div>
        <p><strong>{"Diagrams that took an hour in an editor now appear in minutes."}</strong></p>
        <p>{"It's one of the doors from "}<a href="/en/blog/horizons/">horizons</a>{" — the tool stepping in where the work was a tax on your attention, not the attention itself."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Идея ясная в голове — а на холсте всё ещё пусто, потому что ты час двигаешь прямоугольники."}</p>
      <h2>Что болело</h2>
      <p>{"Любой редактор схем превращает простую мысль в возню: нарисуй блок, выровняй, проведи стрелку, поправь, когда всё съехало. К моменту, когда схема готова, идея уже остыла, а половину нюансов ты забыл."}</p>
      <h2>Что я собрал</h2>
      <p>{"Холст, где ты не рисуешь, а описываешь смысл — а раскладку и сами фигуры дорисовывают генераторы, работающие в фоне. Один и тот же материал можно смотреть как схему, как план-структуру или как спокойный текст для чтения. Ты двигаешь смысл, а не прямоугольники."}</p>
      <h2>Как — без команды</h2>
      <p>{"Я собрал это тем же способом, что описываю в курсе: не садился учить графовые движки, а объяснял агенту, что должно происходить, и он раскладывал фигуры. Скучную часть — выравнивание, координаты — машина делает сама."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> раскладку, рисование, выравнивание.<br />
        <b>Остаётся твоим:</b> смысл и то, как связаны вещи.
      </div>
      <p><strong>{"Схемы, на которые уходил час в редакторе, рождаются за минуты."}</strong></p>
      <p>{"Это одна из дверей из "}<a href="/blog/horizons/">горизонтов</a>{" — инструмент заходит туда, где работа была налогом на внимание, а не самим вниманием."}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create the RU route**

Create `blog/app/blog/diagram-canvas/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { DiagramCanvas } from '@/components/blog/posts/diagram-canvas'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Канвас, который рисует схемы за меня'
const description =
  'Диаграммы съедали по часу: перетаскивать прямоугольники, воевать с выравниванием — и идея остывала. Я собрал холст, где двигаешь смысл, а схему рисуют генераторы в фоне.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/diagram-canvas/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/diagram-canvas/',
      'en-US': 'https://mamaev.coach/en/blog/diagram-canvas/',
      'x-default': 'https://mamaev.coach/blog/diagram-canvas/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/diagram-canvas/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function DiagramCanvasPage() {
  return (
    <PostLayout post={getPost('diagram-canvas')!} locale="ru">
      <DiagramCanvas locale="ru" />
    </PostLayout>
  )
}
```

- [ ] **Step 6: Create the EN route**

Create `blog/app/en/blog/diagram-canvas/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { DiagramCanvas } from '@/components/blog/posts/diagram-canvas'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'A canvas that draws the diagrams for me'
const description =
  "Diagrams used to eat an hour each: dragging rectangles, fighting alignment — and the idea went cold. I built a canvas where you move meaning and generators draw the diagram in the background."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/diagram-canvas/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/diagram-canvas/',
      'en-US': 'https://mamaev.coach/en/blog/diagram-canvas/',
      'x-default': 'https://mamaev.coach/blog/diagram-canvas/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/diagram-canvas/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function DiagramCanvasPageEn() {
  return (
    <PostLayout post={getPost('diagram-canvas')!} locale="en">
      <DiagramCanvas locale="en" />
    </PostLayout>
  )
}
```

- [ ] **Step 7: Run the test + build**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: PASS (`echo` + `diagram-canvas` green).

Run: `cd blog && npm run build`
Expected: build succeeds; `/blog/diagram-canvas/` and `/en/blog/diagram-canvas/` emitted.

- [ ] **Step 8: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts blog/components/blog/posts/diagram-canvas.tsx blog/app/blog/diagram-canvas blog/app/en/blog/diagram-canvas
git commit -m "feat(blog): deep-dive post 'diagram-canvas' (fb_83d05aa7ee6f)"
```

---

### Task 3: Blog post `the-site-itself`

**Files:**
- Modify: `blog/lib/posts.ts`
- Create: `blog/components/blog/posts/the-site-itself.tsx`
- Create: `blog/app/blog/the-site-itself/page.tsx`
- Create: `blog/app/en/blog/the-site-itself/page.tsx`
- Test: `blog/lib/posts.test.ts` (extend `CONTRACT_SLUGS`)

**Interfaces:**
- Produces: `export function TheSiteItself({ locale }: { locale: 'ru' | 'en' })`; registry post `slug: 'the-site-itself'`.

- [ ] **Step 1: Extend the contract guard (red)**

Change `CONTRACT_SLUGS` in `blog/lib/posts.test.ts` to:

```ts
  const CONTRACT_SLUGS = ['echo', 'diagram-canvas', 'the-site-itself']
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: FAIL — `the-site-itself` post does not exist.

- [ ] **Step 3: Add the registry entry**

In `blog/lib/posts.ts`, append after the `diagram-canvas` entry:

```ts
  {
    slug: 'the-site-itself',
    title: 'Этот сайт — мой главный пруф',
    description:
      'Обучающий продукт обычно требует команды: разработчики, дизайнеры, контент. Платформу, на которой ты сейчас, я собрал в одиночку — тем самым vibe-кодингом, которому она и учит.',
    date: '2026-06-29',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['AI', 'Точка Сборки', 'кейсы', 'vibe-coding', 'платформа'],
    related: ['prologue', 'horizons'],
    en: { title: 'This site is my main proof', description: "A learning product usually needs a team: developers, designers, content. The platform you're on right now I built solo — with the very vibe-coding it teaches.", readingTime: '~5 min' },
  },
```

- [ ] **Step 4: Create the body component**

Create `blog/components/blog/posts/the-site-itself.tsx`:

```tsx
import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function TheSiteItself({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"The most honest proof of a course isn't a screenshot or a testimonial. It's the thing you're standing on right now."}</p>
        <h2>What hurt</h2>
        <p>{"Making a real learning product is usually a team: frontend, backend, a designer, someone on content. For one person it never got off the ground — the barrier was too high."}</p>
        <h2>What I built</h2>
        <p>{"The platform you're reading this on: with an AI mentor, a world map, quests, and an intake that tunes the path to you. Not a landing page \"about the course\" — the course itself, as a living product."}</p>
        <h2>How — without a team</h2>
        <p>{"With the same vibe-coding the course teaches. The agents were my team: I held the pedagogy and the voice, they wrote the code and assembled the plumbing. What used to feel \"only for techies with a budget\" came together solo."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> the code, the plumbing, executing the design.<br />
          <b>Stays yours:</b> what to teach, in what voice, and why.
        </div>
        <p><strong>{"A whole learning product built solo, without a classic dev team."}</strong></p>
        <p>{"Where all of this began, and why the tool first felt like the enemy — I worked through it in the "}<a href="/en/blog/prologue/">prologue</a>{"."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Самый честный пруф курса — не скриншот и не отзыв. Это то, на чём ты сейчас стоишь."}</p>
      <h2>Что болело</h2>
      <p>{"Сделать настоящий обучающий продукт — это обычно команда: фронтенд, бэкенд, дизайнер, человек на контент. У одного человека до этого не доходили руки — слишком большой порог."}</p>
      <h2>Что я собрал</h2>
      <p>{"Платформу, на которой ты читаешь это: с AI-ментором, картой мира, квестами и анкетой, которая подстраивает путь под тебя. Не лендинг «о курсе», а сам курс как живой продукт."}</p>
      <h2>Как — без команды</h2>
      <p>{"Тем же vibe-кодингом, которому учит курс. Агенты были моей командой: я держал педагогику и голос, они писали код и собирали обвязку. То, что раньше казалось «только для технарей с бюджетом», собралось в одиночку."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> код, обвязку, исполнение дизайна.<br />
        <b>Остаётся твоим:</b> чему учить, каким голосом и зачем.
      </div>
      <p><strong>{"Целый обучающий продукт собран в одиночку, без классической команды разработки."}</strong></p>
      <p>{"С чего всё это началось и почему инструмент сначала казался врагом — в "}<a href="/blog/prologue/">прологе</a>{"."}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create the RU route**

Create `blog/app/blog/the-site-itself/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { TheSiteItself } from '@/components/blog/posts/the-site-itself'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Этот сайт — мой главный пруф'
const description =
  'Обучающий продукт обычно требует команды: разработчики, дизайнеры, контент. Платформу, на которой ты сейчас, я собрал в одиночку — тем самым vibe-кодингом, которому она и учит.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/the-site-itself/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/the-site-itself/',
      'en-US': 'https://mamaev.coach/en/blog/the-site-itself/',
      'x-default': 'https://mamaev.coach/blog/the-site-itself/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/the-site-itself/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function TheSiteItselfPage() {
  return (
    <PostLayout post={getPost('the-site-itself')!} locale="ru">
      <TheSiteItself locale="ru" />
    </PostLayout>
  )
}
```

- [ ] **Step 6: Create the EN route**

Create `blog/app/en/blog/the-site-itself/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { TheSiteItself } from '@/components/blog/posts/the-site-itself'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'This site is my main proof'
const description =
  "A learning product usually needs a team: developers, designers, content. The platform you're on right now I built solo — with the very vibe-coding it teaches."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/the-site-itself/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/the-site-itself/',
      'en-US': 'https://mamaev.coach/en/blog/the-site-itself/',
      'x-default': 'https://mamaev.coach/blog/the-site-itself/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/the-site-itself/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function TheSiteItselfPageEn() {
  return (
    <PostLayout post={getPost('the-site-itself')!} locale="en">
      <TheSiteItself locale="en" />
    </PostLayout>
  )
}
```

- [ ] **Step 7: Run the test + build**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: PASS (3 contract cases green).

Run: `cd blog && npm run build`
Expected: build succeeds; `/blog/the-site-itself/` and `/en/blog/the-site-itself/` emitted.

- [ ] **Step 8: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts blog/components/blog/posts/the-site-itself.tsx blog/app/blog/the-site-itself blog/app/en/blog/the-site-itself
git commit -m "feat(blog): deep-dive post 'the-site-itself' (fb_83d05aa7ee6f)"
```

---

### Task 4: Blog post `second-brain`

**Files:**
- Modify: `blog/lib/posts.ts`
- Create: `blog/components/blog/posts/second-brain.tsx`
- Create: `blog/app/blog/second-brain/page.tsx`
- Create: `blog/app/en/blog/second-brain/page.tsx`
- Test: `blog/lib/posts.test.ts` (extend `CONTRACT_SLUGS` to the full set of 4)

**Interfaces:**
- Produces: `export function SecondBrain({ locale }: { locale: 'ru' | 'en' })`; registry post `slug: 'second-brain'`. Final `CONTRACT_SLUGS = ['echo', 'diagram-canvas', 'the-site-itself', 'second-brain']`.

- [ ] **Step 1: Extend the contract guard to the full set (red)**

Change `CONTRACT_SLUGS` in `blog/lib/posts.test.ts` to:

```ts
  const CONTRACT_SLUGS = ['echo', 'diagram-canvas', 'the-site-itself', 'second-brain']
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npm run test -- lib/posts.test.ts`
Expected: FAIL — `second-brain` post does not exist.

- [ ] **Step 3: Add the registry entry**

In `blog/lib/posts.ts`, append after the `the-site-itself` entry (this is the last entry before `]`):

```ts
  {
    slug: 'second-brain',
    title: 'Второй мозг: я спрашиваю свой архив как собеседника',
    description:
      'Заметки копятся, но ты их больше не перечитываешь — идеи тонут в архиве. Я собрал граф знаний, который отвечает на вопросы по моим же записям и находит связи между ними.',
    date: '2026-06-29',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['AI', 'знание', 'граф', 'кейсы', 'Точка Сборки'],
    related: ['horizons', 'prologue'],
    en: { title: 'A second brain: I query my own archive like a person', description: "Notes pile up but you never reread them — ideas drown in the archive. I built a knowledge graph that answers questions from my own notes and finds the connections between them.", readingTime: '~5 min' },
  },
```

- [ ] **Step 4: Create the body component**

Create `blog/components/blog/posts/second-brain.tsx`:

```tsx
import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function SecondBrain({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"You have hundreds of notes — and you remember less than a tenth of them. The archive exists; the use of it doesn't."}</p>
        <h2>What hurt</h2>
        <p>{"I write down thoughts, save articles, keep notes — and almost never come back to them. The knowledge sits as dead weight: to find something you have to remember where it is, and remembering is exactly what fails."}</p>
        <h2>What I built</h2>
        <p>{"A knowledge graph — a second brain. It takes in my notes, sources and experience, links them to each other, and answers questions from them. Not a word search, but a conversation with my own archive — one that remembers what I forgot."}</p>
        <h2>How — without a team</h2>
        <p>{"Vibe-coding again: I didn't build search engines by hand, I explained to an agent how it should work — indexing, links, retrieval fell to the machine. My part is deciding what's worth putting in there in the first place."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> indexing, the connections, retrieval.<br />
          <b>Stays yours:</b> what counts as important — and the thoughts themselves.
        </div>
        <p><strong>{"Stopped losing ideas — I query my own archive like a living interlocutor."}</strong></p>
        <p>{"This is one of the four doors from "}<a href="/en/blog/horizons/">horizons</a>{": the machine extending the reach of your mind without replacing it."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"У тебя сотни заметок — и ты не помнишь и десятой части. Архив есть, а толку от него мало."}</p>
      <h2>Что болело</h2>
      <p>{"Я записываю мысли, сохраняю статьи, веду конспекты — и почти никогда к ним не возвращаюсь. Знание лежит мёртвым грузом: чтобы что-то найти, надо вспомнить, где оно, а вспомнить как раз и не получается."}</p>
      <h2>Что я собрал</h2>
      <p>{"Граф знаний — второй мозг. Он вбирает мои заметки, источники и опыт, связывает их между собой и отвечает на вопросы по ним же. Не поиск по словам, а разговор с собственным архивом, который помнит то, что забыл я."}</p>
      <h2>Как — без команды</h2>
      <p>{"Снова vibe-кодинг: я не строил поисковые движки руками, а объяснял агенту, как это должно работать, — индексация, связи, извлечение легли на машину. Моя часть — решать, что вообще стоит туда класть."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> индексацию, связи, извлечение.<br />
        <b>Остаётся твоим:</b> что считать важным — и сами мысли.
      </div>
      <p><strong>{"Перестал терять идеи — спрашиваю собственный архив как живого собеседника."}</strong></p>
      <p>{"Это одна из четырёх дверей из "}<a href="/blog/horizons/">горизонтов</a>{": машина расширяет охват ума, не подменяя его."}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create the RU route**

Create `blog/app/blog/second-brain/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { SecondBrain } from '@/components/blog/posts/second-brain'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Второй мозг: я спрашиваю свой архив как собеседника'
const description =
  'Заметки копятся, но ты их больше не перечитываешь — идеи тонут в архиве. Я собрал граф знаний, который отвечает на вопросы по моим же записям и находит связи между ними.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/second-brain/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/second-brain/',
      'en-US': 'https://mamaev.coach/en/blog/second-brain/',
      'x-default': 'https://mamaev.coach/blog/second-brain/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/second-brain/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SecondBrainPage() {
  return (
    <PostLayout post={getPost('second-brain')!} locale="ru">
      <SecondBrain locale="ru" />
    </PostLayout>
  )
}
```

- [ ] **Step 6: Create the EN route**

Create `blog/app/en/blog/second-brain/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { SecondBrain } from '@/components/blog/posts/second-brain'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'A second brain: I query my own archive like a person'
const description =
  "Notes pile up but you never reread them — ideas drown in the archive. I built a knowledge graph that answers questions from my own notes and finds the connections between them."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/second-brain/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/second-brain/',
      'en-US': 'https://mamaev.coach/en/blog/second-brain/',
      'x-default': 'https://mamaev.coach/blog/second-brain/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/second-brain/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SecondBrainPageEn() {
  return (
    <PostLayout post={getPost('second-brain')!} locale="en">
      <SecondBrain locale="en" />
    </PostLayout>
  )
}
```

- [ ] **Step 7: Run the test + full suite + build**

Run: `cd blog && npm run test`
Expected: PASS — full blog suite green, all 4 contract cases pass.

Run: `cd blog && npm run build`
Expected: build succeeds; all 4 posts' routes (ru + en) emitted.

- [ ] **Step 8: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts blog/components/blog/posts/second-brain.tsx blog/app/blog/second-brain blog/app/en/blog/second-brain
git commit -m "feat(blog): deep-dive post 'second-brain' + full 4-slug contract guard (fb_83d05aa7ee6f)"
```

---

### Task 5: LMS showcase wiring + contract guard

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.ts`
- Test: `LMS/tochka-sborki/web/lib/course/showcase.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/intake/types`; existing `getShowcase`.
- Produces: `export function deepDiveUrl(slug: string, locale: Locale): string`; `RealCase` gains `deepDive?: string`; `getShowcase(locale).real.cases[i].href` resolves to the canonical blog URL when `deepDive` is set.

- [ ] **Step 1: Write the failing test**

Append to `LMS/tochka-sborki/web/lib/course/showcase.test.ts` (after the final `})` of the existing top-level `describe`), and add `deepDiveUrl` to the import on line 2:

Change the import line to:
```ts
import { getShowcase, videoEmbedUrl, resolveVideoSource, withAutoplay, filterByCategory, CATEGORY_KEYS, deepDiveUrl } from './showcase'
```

Append:
```ts
describe('showcase deep-dive wiring', () => {
  const CONTRACT_SLUGS = ['echo', 'diagram-canvas', 'the-site-itself', 'second-brain']

  it('deepDiveUrl builds canonical ru/en blog URLs', () => {
    expect(deepDiveUrl('echo', 'ru')).toBe('https://mamaev.coach/blog/echo/')
    expect(deepDiveUrl('echo', 'en')).toBe('https://mamaev.coach/en/blog/echo/')
  })

  it('every real case links to a contract deep-dive (ru)', () => {
    const cases = getShowcase('ru').real.cases
    expect(cases.length).toBeGreaterThanOrEqual(4)
    for (const c of cases) {
      expect(c.href, c.id).toBeTruthy()
      const m = c.href!.match(/^https:\/\/mamaev\.coach\/blog\/([a-z-]+)\/$/)
      expect(m, c.href).toBeTruthy()
      expect(CONTRACT_SLUGS, c.id).toContain(m![1])
    }
  })

  it('en real cases use the /en/blog/ prefix', () => {
    for (const c of getShowcase('en').real.cases) {
      expect(c.href!).toMatch(/^https:\/\/mamaev\.coach\/en\/blog\/[a-z-]+\/$/)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npm run test -- lib/course/showcase.test.ts`
Expected: FAIL — `deepDiveUrl` is not exported; real cases have no `href`.

- [ ] **Step 3: Add the `deepDive` field, the helper, the wiring, and the slugs**

In `LMS/tochka-sborki/web/lib/course/showcase.ts`:

(a) Add `deepDive?: string` to the `RealCase` interface — change it to:
```ts
export interface RealCase {
  id: string; icon: string; title: Bi; blurb: Bi; tag: Bi; category: CategoryKey
  result: Bi      // the "обернул во благо" payoff line
  author: Bi      // attribution
  deepDive?: string // blog slug → resolved to a locale-correct deep-dive URL in getShowcase
  href?: string   // escape hatch / legacy; deepDive takes precedence
}
```

(b) Add the helper just above `export function getShowcase` (after `withAutoplay`):
```ts
export function deepDiveUrl(slug: string, locale: Locale): string {
  const prefix = locale === 'en' ? '/en/blog/' : '/blog/'
  return `https://mamaev.coach${prefix}${slug}/`
}
```

(c) Set `deepDive` on each of the 4 `REAL_CASES` entries — add the field to each object:
- `echo` case → `deepDive: 'echo',`
- `lms` case → `deepDive: 'the-site-itself',`
- `canvas` case → `deepDive: 'diagram-canvas',`
- `brain` case → `deepDive: 'second-brain',`

(d) In `getShowcase`, change the real-cases mapping so `href` resolves from `deepDive` (locale-aware, using the narrowed `L`). Replace the `real:` block with:
```ts
    real: {
      heading: REAL_HEADING[L],
      cases: REAL_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], category: c.category, result: c.result[L], author: c.author[L], href: c.deepDive ? deepDiveUrl(c.deepDive, L) : c.href })),
    },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npm run test -- lib/course/showcase.test.ts`
Expected: PASS — `deepDiveUrl` canonical, all real cases carry a contract deep-dive URL, en uses the `/en/blog/` prefix.

- [ ] **Step 5: Full suite + build (no regression)**

Run: `cd LMS/tochka-sborki/web && npm run test`
Expected: PASS — full suite green (existing showcase tests still pass; real cases now also carry `href`).

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/showcase.ts LMS/tochka-sborki/web/lib/course/showcase.test.ts
git commit -m "feat(showcase): locale-aware deep-dive links to blog posts + contract guard (fb_83d05aa7ee6f)"
```

---

## Self-Review

**1. Spec coverage:**
- 4 deep-dive posts (echo, diagram-canvas, the-site-itself, second-brain), each = registry + body(RU/EN) + 2 routes → Tasks 1–4. ✅
- Grounded content + honest payoff reusing the `result` line; voice = horizons; boundary device → post bodies. ✅
- Locale-aware `deepDiveUrl` + `deepDive` field + getShowcase resolution + 4 slugs set → Task 5. ✅
- Gallery UI unchanged (already renders `href`) → no task touches showcase-filter/gallery. ✅
- Cross-app drift-guard: blog parametrized `CONTRACT_SLUGS` (Tasks 1–4) + LMS contract guard (Task 5). ✅
- Dark-ship order (posts before links) → Tasks 1–4 then 5. ✅
- Index/RSS/llms/manifest auto-derived, not edited → no task touches them. ✅

**2. Placeholder scan:** No TBD/TODO. Every post body, route, registry entry, helper, and test is complete verbatim. Prose wrapped in `{"…"}` per the lint constraint.

**3. Type consistency:** Component exports (`Echo`, `DiagramCanvas`, `TheSiteItself`, `SecondBrain`) match their import sites in the routes. Registry `Post` shape matches `blog/lib/posts.ts` (`en` block has `title`/`description`/`readingTime`). `deepDiveUrl(slug: string, locale: Locale): string` is defined in Task 5 Step 3(b) and consumed in 3(d) and the Task 5 test. `RealCase.deepDive?: string` defined in 3(a), set in 3(c), read in 3(d). `CONTRACT_SLUGS` final value is identical (4 slugs, same spelling) in both the blog test (Task 4) and the LMS test (Task 5). Slugs match the registry `slug` values and the route folder names exactly.
