// blog/lib/posts.ts
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
  kind?: 'note' | 'post'  // default 'post'; 'note' = atomic evergreen note (graph-only, excluded from index/RSS/manifest)
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
  {
    slug: 'imagination',
    title: 'Барьер не в воображении: почему сто идей не доходят до дела',
    description:
      'Тебя останавливает не «нет воображения» — образ результата есть у всех. Останавливает непереведённое в задачу воображение. Три ступени: воображение → задача → автоматизация, и порядок важен.',
    date: '2026-06-17',
    author: 'Александр Мамаев',
    readingTime: '~6 мин',
    tags: ['AI', 'воображение', 'задачи', 'нетехнари', 'Точка Сборки'],
    related: ['horizons', 'prologue'],
    en: { title: "The barrier isn't imagination: why a hundred ideas never get done", description: "You're not stopped by \"no imagination\" — the image of the result is there. You're stopped by imagination that was never translated into a task. Three stages: imagination → task → automation, and the order matters.", readingTime: '~6 min' },
  },
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
]

const byDateDesc = (a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)
const visible = (p: Post, locale: Locale) => !p.draft && (locale === 'ru' || p.en != null)

/**
 * Published ESSAYS (kind !== 'note'), newest-first. Drafts and notes excluded.
 * Feeds the blog index, RSS, and the SEO manifest — the essay "publication".
 * `source` defaults to the registry; the param exists for fixture-testing.
 */
export function getAllPosts(locale: Locale = 'ru', source: Post[] = posts): Post[] {
  return source.filter(p => visible(p, locale) && p.kind !== 'note').sort(byDateDesc)
}

/**
 * All published entries — posts AND notes — newest-first. The knowledge graph's input,
 * so atomic notes thicken its edges. Drafts excluded; locale-gated like getAllPosts.
 */
export function getGraphEntries(locale: Locale = 'ru', source: Post[] = posts): Post[] {
  return source.filter(p => visible(p, locale)).sort(byDateDesc)
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
