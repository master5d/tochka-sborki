# Founding-quote Blog Post Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a new de-guru'd narrative blog post (`nervous-strength`) built around a 1996 prophecy, following the blog's established post pattern (registry entry + ru/en component + ru/en routes), with an additive epigraph CSS style.

**Architecture:** No engine. A new `Post` entry in `blog/lib/posts.ts` (single source of truth feeding index/sitemap/RSS/llms.txt/JSON-LD) + a hand-authored ru+en TSX component using `blog-prose.module.css` + two route files mirroring an existing post (`imagination`). Default OG (no per-post OG file).

**Tech Stack:** Next.js (standalone `blog/` app, static), TypeScript, CSS Modules, Vitest.

## Global Constraints

- All files under `blog/` (the standalone blog app → `mamaev.coach/blog/*` + `/en/blog/*`). Static. Run tests from there: `cd blog && npx vitest run`. Build: `cd blog && npm run build`.
- Bilingual ru (canon) + en (the `en` block + the en branch + the `/en/` route).
- Follow the existing post pattern exactly (registry entry + ru/en component + two routes); reuse `blog-prose.module.css`; default OG (no per-post OG file).
- Additive only: existing posts, routes, and CSS classes stay byte-identical apart from the listed insertions.
- Ship the spec's owner-approved draft prose VERBATIM (do not paraphrase Russian/English strings).
- slug `nervous-strength`; author `Александр Мамаев`; date `2026-06-28`.

---

### Task 1: register the post + registry test

**Files:**
- Modify: `blog/lib/posts.ts`
- Test: `blog/lib/posts.test.ts` (extend)

**Interfaces:**
- Consumes: the existing `Post` type and `posts` array in `blog/lib/posts.ts`; `getPost` for the test.
- Produces: a `Post` entry with `slug: 'nervous-strength'` (consumed by Task 2's routes via `getPost('nervous-strength')`).

- [ ] **Step 1: Add the failing test**

In `blog/lib/posts.test.ts`, append this `it` block inside the `describe('posts registry', ...)` block (before its closing `})`), mirroring the existing prologue assertion:

```ts
  it('the nervous-strength post exists with required metadata', () => {
    const p = getPost('nervous-strength')!
    expect(p.title.length).toBeGreaterThan(0)
    expect(p.description.length).toBeGreaterThan(0)
    expect(p.author).toBe('Александр Мамаев')
    expect(Array.isArray(p.tags)).toBe(true)
    expect(Array.isArray(p.related)).toBe(true)
    expect(p.en).toBeTruthy()
    expect(p.en!.title.length).toBeGreaterThan(0)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd blog && npx vitest run lib/posts.test.ts`
Expected: FAIL — `getPost('nervous-strength')` is `undefined`, so `p!.title` throws (post not registered yet).

- [ ] **Step 3: Add the registry entry**

In `blog/lib/posts.ts`, append this entry to the `posts` array, after the existing `imagination` entry (before the closing `]`), verbatim:

```ts
  {
    slug: 'nervous-strength',
    title: 'Пророчество 1996 года: знание по кнопке — и сила, чтобы себя удержать',
    description:
      'Тридцать лет назад предсказали мир, где знание — по нажатию кнопки, и предупредили: без внутренней опоры оно не освобождает, а накрывает. Ответ — не больше знания, а нервная сила и практика.',
    date: '2026-06-28',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['AI', 'суверенность', 'практика', 'Точка Сборки', 'нарратив'],
    related: ['prologue', 'imagination'],
    en: { title: "A 1996 prophecy: knowledge at the press of a button — and the strength to hold yourself", description: "Thirty years ago someone predicted a world where knowledge sits one button away — and warned that without inner footing it doesn't free you, it buries you. The answer isn't more knowledge; it's nervous strength and practice.", readingTime: '~5 min' },
  },
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd blog && npx vitest run lib/posts.test.ts`
Expected: PASS — the new assertion green; the existing registry tests (draft filter, newest-first sort, en-only filter, prologue metadata) stay green.

- [ ] **Step 5: Run the full blog suite (no regression)**

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green (posts, ai-prompt, graph).

- [ ] **Step 6: Commit**

```bash
git add blog/lib/posts.ts blog/lib/posts.test.ts
git commit -m "feat(blog): register nervous-strength founding-quote post (fb_6ed2f4b2f921)"
```

---

### Task 2: epigraph CSS + post component + ru/en routes

**Files:**
- Modify: `blog/components/blog/blog-prose.module.css`
- Create: `blog/components/blog/posts/nervous-strength.tsx`
- Create: `blog/app/blog/nervous-strength/page.tsx`
- Create: `blog/app/en/blog/nervous-strength/page.tsx`

**Interfaces:**
- Consumes: `styles` from `../blog-prose.module.css` (classes `prose`, `lead`, `quote`, `quoteSource`); `PostLayout` from `@/components/blog/post-layout`; `getPost` from `@/lib/posts`; the `nervous-strength` registry entry from Task 1.
- Produces: `NervousStrength` component (`{ locale: 'ru' | 'en' }`) + the two static routes.

- [ ] **Step 1: Add the epigraph styles (additive)**

Append to `blog/components/blog/blog-prose.module.css` (existing classes unchanged):

```css
/* Founding-quote epigraph: framed pull-quote with a source line. */
.quote {
  font-family: var(--font-display), system-ui, sans-serif;
  font-size: clamp(1.3rem, 3.2vw, 1.8rem);
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  text-wrap: balance;
  border-left: 2px solid var(--border-accent);
  padding: 0.2rem 0 0.2rem 1.25rem;
  margin: 2rem 0 0.75rem;
}

.quoteSource {
  font-family: var(--font-mono), monospace;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 2rem 1.25rem;
}
```

- [ ] **Step 2: Create the post component**

Create `blog/components/blog/posts/nervous-strength.tsx`, mirroring `imagination.tsx` (en branch first, then ru; strings wrapped in `{'...'}` to avoid quote/apostrophe escaping). Ship the prose verbatim:

```tsx
import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function NervousStrength({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {"We got the button. Knowledge, one press away: ask anything and a second later you have an answer thorough enough for a thesis. Exactly what was promised. So where does the low, background hum come from — the sense that you're always slightly not coping?"}
        </p>

        <h2>Someone predicted this thirty years ago</h2>
        <p>
          {"In 1996 a teacher named Yogi Bhajan said something to his students that sounded like mysticism then and reads like a news bulletin now:"}
        </p>
        <p className={styles.quote}>
          {"In the computerized Age of Aquarius you will have four mega-billion units of knowledge at the press of a button. I pray you have the nervous strength to hold yourself, or we'll be depressed all the time."}
        </p>
        <p className={styles.quoteSource}>{"— Yogi Bhajan, 1996"}</p>
        <p>{"Not as scripture. As a forecast — and it has aged strangely well."}</p>

        <h2>He got the first half word for word</h2>
        <p>
          {"Four mega-billion units of knowledge at the press of a button is no longer a metaphor. It's your feed, your search, your model answering faster than you finish the question. Access to knowledge stopped being the problem within our lifetime. Everyone has the button."}
        </p>

        <h2>{"Here's the part everyone skips"}</h2>
        <p>
          {"\"The nervous strength to hold yourself.\" That's where he saw further. Knowledge was never the bottleneck — there's a glut of it now. The bottleneck is holding yourself when knowledge is infinite. Staying yourself while someone else's context, someone else's urgency, someone else's answer pours into you every second."}
        </p>
        <p><strong>{"We scaled knowledge. We never scaled the strength to hold it."}</strong></p>

        <h2>{"That's why there are two axes here, not one"}</h2>
        <p>
          {"Точка Сборки stands on two axes. The first is capability: use the button, co-think with the agent, carry an intent through to a result. Everyone teaches that. The second is inner sovereignty — the nervous strength itself. It doesn't come from one more article or one more tool. It comes from practice: repeatable, bodily, a little boring, the kind that gathers you back into a single point."}
        </p>
        <p>
          {"The course's name isn't poetry. An assembly point is the place you look at the world from without falling apart. Under four mega-billion units of knowledge, that's not a luxury anymore — it's a survival skill."}
        </p>

        <h2>What to do with this</h2>
        <p>
          {"You don't need his cosmology — not the Age of Aquarius, not the epochs. You need the practice that returns you to the point from which you can see which of this knowledge is yours and which is merely loud. That's the course — not more knowledge (it's already one button away) but the strength to hold yourself beside it."}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>
        {'Кнопку нам выдали. Знание — по нажатию: спроси что угодно, и через секунду перед тобой развёрнут ответ, которого хватило бы на диссертацию. Ровно то, что обещали. Откуда тогда этот ровный, фоновый гул — будто ты всё время немного не справляешься?'}
      </p>

      <h2>Это предсказали тридцать лет назад</h2>
      <p>
        {'В 1996-м учитель по имени Йоги Бхаджан сказал своим ученикам фразу, которая тогда звучала как мистика, а сейчас — как сводка новостей:'}
      </p>
      <p className={styles.quote}>
        {'В компьютеризированную эпоху Водолея у тебя будет четыре мега-миллиарда единиц знания по нажатию кнопки. Молюсь, чтобы у тебя хватило нервной силы удержать себя — иначе мы будем подавлены всё время.'}
      </p>
      <p className={styles.quoteSource}>{'— Йоги Бхаджан, 1996'}</p>
      <p>{'Не как писание. Как прогноз — и он постарел странно точно.'}</p>

      <h2>Первую половину он угадал дословно</h2>
      <p>
        {'Четыре мега-миллиарда единиц знания по нажатию — это уже не метафора. Это твоя лента, твой поиск, твоя модель, отвечающая быстрее, чем ты дочитываешь вопрос. Доступ к знанию перестал быть проблемой ещё на нашем веку. Кнопка есть у каждого.'}
      </p>

      <h2>А вот часть, которую все пропускают</h2>
      <p>
        {'„Нервная сила, чтобы удержать себя.“ Вот где он смотрел дальше. Узким горлышком никогда не было знание — его теперь в избытке. Узкое горлышко — удержать себя, когда знания бесконечно. Остаться собой, когда в тебя ежесекундно льётся чужой контекст, чужая срочность, чужой ответ.'}
      </p>
      <p><strong>{'Знание мы масштабировали. Способность его удержать — нет.'}</strong></p>

      <h2>Поэтому здесь две оси, а не одна</h2>
      <p>
        {'Точка Сборки стоит на двух осях. Первая — способность: умей пользоваться кнопкой, со-мыслить с агентом, доводить замысел до результата. Этому учат везде. Вторая — внутренний суверенитет: та самая нервная сила. Она не приходит от ещё одной статьи или ещё одного инструмента. Она приходит от практики — повторяемой, телесной, скучноватой, которая собирает тебя обратно в одну точку.'}
      </p>
      <p>
        {'Имя курса — не поэзия. Точка сборки — место, из которого ты смотришь на мир и не рассыпаешься. Под четырьмя мега-миллиардами единиц знания это уже не роскошь, а навык выживания.'}
      </p>

      <h2>Что с этим делать</h2>
      <p>
        {'Тебе не нужна его космология — ни Водолей, ни эпохи. Нужна практика, которая возвращает тебя в точку, откуда видно: что из этого знания — твоё, а что просто громкое. Это и есть курс — не больше знания (его и так по кнопке), а сила удержать себя рядом с ним.'}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create the RU route**

Create `blog/app/blog/nervous-strength/page.tsx` (mirror `blog/app/blog/imagination/page.tsx`):

```tsx
import type { Metadata } from 'next'
import { NervousStrength } from '@/components/blog/posts/nervous-strength'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Пророчество 1996 года: знание по кнопке — и сила, чтобы себя удержать'
const description =
  'Тридцать лет назад предсказали мир, где знание — по нажатию кнопки, и предупредили: без внутренней опоры оно не освобождает, а накрывает. Ответ — не больше знания, а нервная сила и практика.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/nervous-strength/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/nervous-strength/',
      'en-US': 'https://mamaev.coach/en/blog/nervous-strength/',
      'x-default': 'https://mamaev.coach/blog/nervous-strength/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/nervous-strength/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function NervousStrengthPage() {
  return (
    <PostLayout post={getPost('nervous-strength')!} locale="ru">
      <NervousStrength locale="ru" />
    </PostLayout>
  )
}
```

- [ ] **Step 4: Create the EN route**

Create `blog/app/en/blog/nervous-strength/page.tsx` (mirror `blog/app/en/blog/imagination/page.tsx`):

```tsx
import type { Metadata } from 'next'
import { NervousStrength } from '@/components/blog/posts/nervous-strength'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = "A 1996 prophecy: knowledge at the press of a button — and the strength to hold yourself"
const description =
  "Thirty years ago someone predicted a world where knowledge sits one button away — and warned that without inner footing it doesn't free you, it buries you. The answer isn't more knowledge; it's nervous strength and practice."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/nervous-strength/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/nervous-strength/',
      'en-US': 'https://mamaev.coach/en/blog/nervous-strength/',
      'x-default': 'https://mamaev.coach/blog/nervous-strength/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/nervous-strength/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function NervousStrengthPageEn() {
  return (
    <PostLayout post={getPost('nervous-strength')!} locale="en">
      <NervousStrength locale="en" />
    </PostLayout>
  )
}
```

- [ ] **Step 5: Typecheck + build**

Run: `cd blog && npm run build`
Expected: PASS — TypeScript accepts the component + routes; both `/blog/nervous-strength/` and `/en/blog/nervous-strength/` are statically generated; the blog index, sitemap, RSS, and llms.txt include the new post (derived from the registry).

- [ ] **Step 6: Full suite (no regression)**

Run: `cd blog && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 7: Commit**

```bash
git add blog/components/blog/blog-prose.module.css blog/components/blog/posts/nervous-strength.tsx blog/app/blog/nervous-strength/page.tsx blog/app/en/blog/nervous-strength/page.tsx
git commit -m "feat(blog): nervous-strength post component + routes (fb_6ed2f4b2f921)"
```

---

## Self-Review

**Spec coverage:**
- Registry entry (`nervous-strength` Post, all fields + en block) → Task 1 (Step 3). ✓
- Registry test asserting the post exists with required metadata → Task 1 (Step 1). ✓
- Post component ru+en, verbatim prose, lead/quote/quoteSource/h2/pull-line → Task 2 (Step 2). ✓
- Epigraph CSS (`.quote` + `.quoteSource`, additive) → Task 2 (Step 1). ✓
- RU + EN routes mirroring imagination (metadata + PostLayout + default OG) → Task 2 (Steps 3, 4). ✓
- Build-validated (both routes + registry-derived surfaces) → Task 2 (Step 5). ✓
- Additive (existing posts/routes/CSS unchanged) → respected throughout. ✓
- De-guru authenticity (honest attribution, "not scripture", drops cosmology, two-axis tie) → the verbatim prose in Task 2 (Step 2). ✓
- Carve (no intro/prologue epigraph, no epigraph engine, no new taxonomy, no custom OG, no mutating other posts' related) → nothing added. ✓

**Placeholder scan:** none — every code step carries full content; prose verbatim from the spec draft.

**Type consistency:** `slug: 'nervous-strength'` is identical across the registry entry, both routes (`getPost('nervous-strength')`), and the test. The component export name `NervousStrength` matches both route imports. The CSS classes `quote`/`quoteSource` defined in Task 2 (Step 1) match those referenced in the component (Step 2). The `Post` shape (slug/title/description/date/author/readingTime/tags/related/en) matches the existing `Post` type and the `localizedPost`/route usage. ✓
