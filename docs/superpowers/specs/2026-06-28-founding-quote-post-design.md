# Founding-quote blog post — Design

**Ticket:** `fb_6ed2f4b2f921` (Founding-quote / narrative artifact: Yogi Bhajan's 1996 "knowledge
at the press of a button needs nervous strength" prophecy — intro / «Горизонты» blog / brand
narrative).

**Date:** 2026-06-28

## Goal

Publish a short, de-guru'd narrative blog post built around a 1996 prophecy — "you will have four
mega-billion units of knowledge at the press of a button; I pray you have the nervous strength to
hold yourself, or we'll be depressed all the time" — framed as a 30-year-old prediction (not
scripture) whose answer is inner strength + practice. It is strikingly on-thesis for Точка Сборки's
two-axis model (capability × inner sovereignty), so the post lands the quote where the brand
narrative already lives: the blog.

## Decision (owner, at design gate)

Of the ticket's three candidate homes (course intro / a «Горизонты» blog post / brand narrative),
the owner chose a **new blog post** (narrative essay) — the founding quote gets its own artifact,
in the established blog-essay vein (prologue / horizons / imagination). The full prose is owner-
voiced: this spec carries a complete draft (ru + en) for the owner to rewrite into his voice; the
implementer ships the owner-approved prose verbatim.

## Scope (carved by honest triage)

- **In scope:** one new blog post — registry entry + ru/en post component + ru/en routes — plus one
  additive CSS class for the quote epigraph.
- **Out of scope (carved):**
  - An epigraph in the course intro or the prologue post (a new dedicated post was chosen).
  - A reusable epigraph engine/component for other surfaces (YAGNI — one post needs one quote block).
  - New tag taxonomies, a custom per-post OG image (the blog uses a default OG route — mirror it),
    or mutating other posts' `related` lists.

## Architecture

A new post following the blog's established pattern (no engine). The blog (`blog/`) is a standalone
Next app; every post is: a `Post` entry in `blog/lib/posts.ts` (the single source of truth that
feeds index / sitemap / llms.txt / RSS / JSON-LD), a hand-authored ru+en TSX component using the
`blog-prose.module.css` classes, and two route files (`/blog/<slug>/` + `/en/blog/<slug>/`) that
mirror an existing post (e.g. `imagination`). OG is the blog's default route — no per-post OG file.

**Proposed identifiers (owner may override at the spec-review gate):**
- **slug:** `nervous-strength` → `/blog/nervous-strength/`, `/en/blog/nervous-strength/`
- **title (RU canon):** «Пророчество 1996 года: знание по кнопке — и сила, чтобы себя удержать»
- **title (EN):** "A 1996 prophecy: knowledge at the press of a button — and the strength to hold yourself"
- **date:** `2026-06-28` (sorts newest-first), **author:** `Александр Мамаев`, **readingTime:** `~5 мин` / `~5 min`
- **tags:** `['AI', 'суверенность', 'практика', 'Точка Сборки', 'нарратив']`
- **related:** `['prologue', 'imagination']`

## Component

### `blog/lib/posts.ts` (modified — append one entry)

Append to the `posts` array (existing entries unchanged):

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

### `blog/components/blog/posts/nervous-strength.tsx` (new)

`{ locale: 'ru' | 'en' }`; mirrors `imagination.tsx` structure (en branch first, then ru). Uses
`styles.prose`, `styles.lead`, `styles.quote`, `styles.quoteSource`, `<h2>` plates, and the
standalone-`<strong>` pull-line. **Draft prose below — owner rewrites into his voice; ship the
approved version verbatim.**

**RU draft:**

- lead: «Кнопку нам выдали. Знание — по нажатию: спроси что угодно, и через секунду перед тобой развёрнут ответ, которого хватило бы на диссертацию. Ровно то, что обещали. Откуда тогда этот ровный, фоновый гул — будто ты всё время немного не справляешься?»

- h2 «Это предсказали тридцать лет назад»
  «В 1996-м учитель по имени Йоги Бхаджан сказал своим ученикам фразу, которая тогда звучала как мистика, а сейчас — как сводка новостей:»
  - quote: «В компьютеризированную эпоху Водолея у тебя будет четыре мега-миллиарда единиц знания по нажатию кнопки. Молюсь, чтобы у тебя хватило нервной силы удержать себя — иначе мы будем подавлены всё время.»
  - quoteSource: «— Йоги Бхаджан, 1996»
  «Не как писание. Как прогноз — и он постарел странно точно.»

- h2 «Первую половину он угадал дословно»
  «Четыре мега-миллиарда единиц знания по нажатию — это уже не метафора. Это твоя лента, твой поиск, твоя модель, отвечающая быстрее, чем ты дочитываешь вопрос. Доступ к знанию перестал быть проблемой ещё на нашем веку. Кнопка есть у каждого.»

- h2 «А вот часть, которую все пропускают»
  «„Нервная сила, чтобы удержать себя.“ Вот где он смотрел дальше. Узким горлышком никогда не было знание — его теперь в избытке. Узкое горлышко — удержать себя, когда знания бесконечно. Остаться собой, когда в тебя ежесекундно льётся чужой контекст, чужая срочность, чужой ответ.»
  - pull-line (strong only-child): «Знание мы масштабировали. Способность его удержать — нет.»

- h2 «Поэтому здесь две оси, а не одна»
  «Точка Сборки стоит на двух осях. Первая — способность: умей пользоваться кнопкой, со-мыслить с агентом, доводить замысел до результата. Этому учат везде. Вторая — внутренний суверенитет: та самая нервная сила. Она не приходит от ещё одной статьи или ещё одного инструмента. Она приходит от практики — повторяемой, телесной, скучноватой, которая собирает тебя обратно в одну точку.»
  «Имя курса — не поэзия. Точка сборки — место, из которого ты смотришь на мир и не рассыпаешься. Под четырьмя мега-миллиардами единиц знания это уже не роскошь, а навык выживания.»

- h2 «Что с этим делать»
  «Тебе не нужна его космология — ни Водолей, ни эпохи. Нужна практика, которая возвращает тебя в точку, откуда видно: что из этого знания — твоё, а что просто громкое. Это и есть курс — не больше знания (его и так по кнопке), а сила удержать себя рядом с ним.»

**EN draft (mirror):**

- lead: "We got the button. Knowledge, one press away: ask anything and a second later you have an answer thorough enough for a thesis. Exactly what was promised. So where does the low, background hum come from — the sense that you're always slightly not coping?"

- h2 "Someone predicted this thirty years ago"
  "In 1996 a teacher named Yogi Bhajan said something to his students that sounded like mysticism then and reads like a news bulletin now:"
  - quote: "In the computerized Age of Aquarius you will have four mega-billion units of knowledge at the press of a button. I pray you have the nervous strength to hold yourself, or we'll be depressed all the time."
  - quoteSource: "— Yogi Bhajan, 1996"
  "Not as scripture. As a forecast — and it has aged strangely well."

- h2 "He got the first half word for word"
  "Four mega-billion units of knowledge at the press of a button is no longer a metaphor. It's your feed, your search, your model answering faster than you finish the question. Access to knowledge stopped being the problem within our lifetime. Everyone has the button."

- h2 "Here's the part everyone skips"
  "\"The nervous strength to hold yourself.\" That's where he saw further. Knowledge was never the bottleneck — there's a glut of it now. The bottleneck is holding yourself when knowledge is infinite. Staying yourself while someone else's context, someone else's urgency, someone else's answer pours into you every second."
  - pull-line (strong only-child): "We scaled knowledge. We never scaled the strength to hold it."

- h2 "That's why there are two axes here, not one"
  "Точка Сборки stands on two axes. The first is capability: use the button, co-think with the agent, carry an intent through to a result. Everyone teaches that. The second is inner sovereignty — the nervous strength itself. It doesn't come from one more article or one more tool. It comes from practice: repeatable, bodily, a little boring, the kind that gathers you back into a single point."
  "The course's name isn't poetry. An assembly point is the place you look at the world from without falling apart. Under four mega-billion units of knowledge, that's not a luxury anymore — it's a survival skill."

- h2 "What to do with this"
  "You don't need his cosmology — not the Age of Aquarius, not the epochs. You need the practice that returns you to the point from which you can see which of this knowledge is yours and which is merely loud. That's the course — not more knowledge (it's already one button away) but the strength to hold yourself beside it."

### `blog/app/blog/nervous-strength/page.tsx` (new) + `blog/app/en/blog/nervous-strength/page.tsx` (new)

Mirror `imagination`'s route files exactly — `metadata` (metadataBase, title/description = the
post's locale title/description, `alternates.canonical` + `languages` ru/en/x-default, `openGraph`
url + `locale: 'ru_RU'`/`'en_US'`, `twitter` summary_large_image), and a default export rendering
`<PostLayout post={getPost('nervous-strength')!} locale="ru|en"><NervousStrength locale="ru|en" /></PostLayout>`.

### `blog/components/blog/blog-prose.module.css` (modified — append, additive)

The module has no quote style. Append a framed epigraph + source line (existing classes unchanged):

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

## Data flow

Static. The post component renders prose; `blog/lib/posts.ts` feeds every agent-ready surface
(index, sitemap, RSS, llms.txt, JSON-LD) from the new registry entry automatically. No endpoint,
no client state.

## Authenticity (binding)

- **De-guru'd:** honest attribution (Yogi Bhajan, a teacher, 1996); explicitly framed "not
  scripture — a forecast"; the closing section drops his cosmology and keeps the practice. No
  religious authority asserted, no esoteric claim presented as truth.
- On-thesis with the two-axis model (capability × inner sovereignty); ties to the course name
  honestly, no hype.
- Owner's voice: the shipped prose is the owner's rewrite of the draft above.

## Testing

- `blog/lib/posts.test.ts` (extend): assert the `nervous-strength` post exists with required
  metadata (title non-empty, `author === 'Александр Мамаев'`, `tags`/`related` arrays, `en` block
  present) — mirroring the existing prologue assertion. The generic registry tests (draft filter,
  newest-first sort, en-only filter) stay green.
- Validated by `npm run build` of the blog app (both routes ru/en compile; registry-derived
  surfaces include the post).

Run: `cd blog && npx vitest run` then `npm run build`.

## Global constraints

- Files under `blog/` (the standalone blog app → `mamaev.coach/blog/*` + `/en/blog/*`). Static.
- Bilingual ru (canon) + en (the `en` block + the en branch + the `/en/` route).
- Follow the existing post pattern exactly (registry entry + ru/en component + two routes); reuse
  `blog-prose.module.css`; default OG (no per-post OG file).
- Additive: existing posts, routes, and CSS classes stay byte-identical apart from the listed
  insertions.
- Ship the owner-approved prose verbatim (the draft here is for the owner to rewrite).

## Files

| File | Responsibility |
|---|---|
| `blog/lib/posts.ts` | append the `nervous-strength` `Post` registry entry |
| `blog/components/blog/posts/nervous-strength.tsx` | ru+en post prose (owner-approved) |
| `blog/app/blog/nervous-strength/page.tsx` | ru route (metadata + PostLayout) |
| `blog/app/en/blog/nervous-strength/page.tsx` | en route (metadata + PostLayout) |
| `blog/components/blog/blog-prose.module.css` | additive `.quote` + `.quoteSource` epigraph styles |
| `blog/lib/posts.test.ts` | assert the new post exists with required metadata |

## Out of scope

- Intro/prologue epigraph; reusable epigraph engine; new tag taxonomy; custom OG image; mutating
  other posts' `related`.
