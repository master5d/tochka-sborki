// hub/lib/posts.ts
// Single source of truth for blog posts. Every agent-ready artifact (index,
// sitemap, llms.txt, RSS, JSON-LD) derives from here so they never drift.

export type Locale = 'ru' | 'en'

export type Localized = { title: string; description: string; readingTime: string }

export type Post = {
  slug: string
  title: string          // RU canon
  description: string     // RU canon
  date: string            // ISO 'YYYY-MM-DD' published
  updated?: string        // ISO modified → dateModified
  author: string
  readingTime: string     // RU canon, e.g. '~15 мин'
  tags: string[]          // graph-ready (not rendered as UI yet)
  related: string[]       // related post slugs (empty for now)
  draft?: boolean         // editorial control: drafts never appear in getAllPosts
  ogImage?: string        // absolute URL; defaults to the post's own OG route
  en?: Localized          // present ⇒ translated; shown on EN surfaces
}

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  nameEn: 'Alexander Mamaev', // EN agent surfaces (RSS title, llms.txt heading) — avoid Cyrillic for EN readers
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const posts: Post[] = [
  {
    slug: 'prologue',
    title: 'Точка Сборки. Пролог',
    description:
      'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
    date: '2026-05-30',
    author: 'Александр Мамаев',
    readingTime: '~12 мин',
    tags: ['AI', 'спиритуальность', 'Точка Сборки', 'агентский инжиниринг'],
    related: ['horizons', 'charter'],
    en: { title: 'Tochka Sborki. Prologue', description: "This isn't a programming course. It's a course in reassembling yourself in an age of fragmentation — through the very tool that once felt like the enemy.", readingTime: '~12 min' },
  },
  {
    slug: 'horizons',
    title: 'Горизонты: что вообще можно делать с AI, если ты не технарь',
    description:
      'Ты пользуешься AI каждый день и не знаешь, что им вообще можно. Четыре двери в комнату, в которую ты не заглядывал — без единой строчки кода.',
    date: '2026-05-31',
    author: 'Александр Мамаев',
    readingTime: '~7 мин',
    tags: ['AI', 'кейсы', 'нетехнари', 'Точка Сборки'],
    related: ['charter', 'prologue'],
    en: { title: "Horizons: what you can actually do with AI if you're not a techie", description: "You use AI every day and still don't know what it's capable of. Four doors into a room you've never looked into — without a single line of code.", readingTime: '~7 min' },
  },
  {
    slug: 'charter',
    title: 'Твой AI знакомится с тобой заново каждое утро',
    description:
      'Каждый раз объяснять AI, кто ты, — выматывает. Один лист на семь блоков превращает разовый инструмент в напарника, который помнит твой метод, голос и красные линии.',
    date: '2026-06-01',
    author: 'Александр Мамаев',
    readingTime: '~6 мин',
    tags: ['AI', 'кейсы', 'агенты', 'устав', 'Точка Сборки'],
    related: ['horizons', 'prologue'],
    en: { title: 'Your AI meets you from scratch every morning', description: "Re-explaining who you are to an AI every time is exhausting. One seven-block sheet turns a throwaway tool into a partner that remembers your method, your voice, and your red lines.", readingTime: '~6 min' },
  },
  {
    slug: 'desops-hub',
    title: 'Дизайн без рисования: Как инсталлировать «вкус» в AI-агентов',
    description:
      'Дизайн всегда был узким горлышком для инженеров. Мой отчет о том, как превратить дизайн из «творческой муки» в исполняемую инженерную спецификацию через DesOps Hub.',
    date: '2026-06-02',
    author: 'Александр Мамаев',
    readingTime: '~8 мин',
    tags: ['DesOps', 'дизайн', 'агенты', 'инжиниринг', 'SHA'],
    related: ['charter', 'prologue'],
    en: { title: 'Design without drawing: how to install "taste" into AI agents', description: 'Design has always been the bottleneck for engineers. My report on turning design from "creative agony" into an executable engineering spec through the DesOps Hub.', readingTime: '~8 min' },
  },
]

/**
 * Published posts, newest-first. Drafts excluded.
 * Locale defaults to 'ru' (the site canon): `getAllPosts()` returns every
 * non-draft post. For 'en' it additionally restricts to posts that carry an
 * `en` block — so it is NOT locale-neutral; pass 'ru' explicitly when you mean
 * "all posts regardless of translation status".
 * `source` defaults to the registry; the param exists so the draft-filter +
 * sort logic can be tested against fixtures without polluting the real registry.
 */
export function getAllPosts(locale: Locale = 'ru', source: Post[] = posts): Post[] {
  return source
    .filter(p => !p.draft && (locale === 'ru' || p.en != null))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Any post by slug (including drafts, for preview). */
export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug)
}

/** ISO date → human form. ru: '30 мая 2026'; en: '30 May 2026'. */
export function formatDate(iso: string, locale: Locale = 'ru'): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = locale === 'en' ? EN_MONTHS : RU_MONTHS
  return `${d} ${months[m - 1]} ${y}`
}

/** Canonical post URL with trailing slash. en is served under /en/blog/. */
export function postUrl(slug: string, locale: Locale = 'ru'): string {
  const prefix = locale === 'en' ? '/en/blog/' : '/blog/'
  return `${SITE.url}${prefix}${slug}/`
}

/** Strip the site origin from an absolute URL → root-relative path. */
export function stripOrigin(url: string): string {
  return url.startsWith(SITE.url) ? url.slice(SITE.url.length) : url
}

/** BCP-47 language tag for a locale. */
export function langTag(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'ru-RU'
}

export type ResolvedPost = {
  title: string
  description: string
  readingTime: string
  url: string
  langTag: string
  date: string
  formattedDate: string
}

/** All locale-dependent post fields resolved in one place. Falls back to ru canon. */
export function localizedPost(post: Post, locale: Locale): ResolvedPost {
  const loc = locale === 'en' && post.en ? post.en : post
  return {
    title: loc.title,
    description: loc.description,
    readingTime: loc.readingTime,
    url: postUrl(post.slug, locale),
    langTag: langTag(locale),
    date: post.date,
    formattedDate: formatDate(post.date, locale),
  }
}
