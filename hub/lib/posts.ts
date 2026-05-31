// hub/lib/posts.ts
// Single source of truth for blog posts. Every agent-ready artifact (index,
// sitemap, llms.txt, RSS, JSON-LD) derives from here so they never drift.
export type Post = {
  slug: string
  title: string
  description: string
  date: string            // ISO 'YYYY-MM-DD' published
  updated?: string        // ISO modified → dateModified
  author: string
  readingTime: string     // human label, e.g. '~15 мин'
  tags: string[]          // graph-ready (not rendered as UI yet)
  related: string[]       // related post slugs (empty for now)
  draft?: boolean         // editorial control: drafts never appear in getAllPosts
  ogImage?: string        // absolute URL; defaults to the post's own OG route
}

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
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
  },
]

/**
 * Published posts, newest-first. Drafts are excluded.
 * `source` defaults to the registry; the param exists so the draft-filter +
 * sort logic can be tested against fixtures without polluting the real registry.
 * `filter` returns a fresh array, so the subsequent `sort` never mutates `source`.
 */
export function getAllPosts(source: Post[] = posts): Post[] {
  return source
    .filter(p => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Any post by slug (including drafts, for preview). */
export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug)
}

/** ISO date → Russian human form, e.g. '30 мая 2026'. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${RU_MONTHS[m - 1]} ${y}`
}

/** Canonical post URL with trailing slash (matches trailingSlash: true). */
export function postUrl(slug: string): string {
  return `${SITE.url}/blog/${slug}/`
}
