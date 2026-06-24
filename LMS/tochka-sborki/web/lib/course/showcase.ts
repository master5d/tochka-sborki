import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export type CategoryKey =
  | 'co-thinking' | 'launch' | 'flow' | 'knowledge' | 'dictation' | 'platform'

export type CatFilter = 'all' | CategoryKey

interface CategoryDef { key: CategoryKey; label: Bi }

export interface ResolvedCategory { key: CategoryKey; label: string }

// Stable display order. Every key referenced by >=1 case becomes a tab.
const CATEGORIES: CategoryDef[] = [
  { key: 'co-thinking', label: { ru: 'Со-мышление', en: 'Co-thinking' } },
  { key: 'launch',      label: { ru: 'Запуск',       en: 'Launch' } },
  { key: 'flow',        label: { ru: 'Поток',        en: 'Flow' } },
  { key: 'knowledge',   label: { ru: 'Знание',       en: 'Knowledge' } },
  { key: 'dictation',   label: { ru: 'Диктовка',     en: 'Dictation' } },
  { key: 'platform',    label: { ru: 'Платформа',    en: 'Platform' } },
]

export const CATEGORY_KEYS: CategoryKey[] = CATEGORIES.map(c => c.key)

export function filterByCategory<T extends { category: CategoryKey }>(
  cases: T[], active: CatFilter,
): T[] {
  return active === 'all' ? cases : cases.filter(c => c.category === active)
}

export interface ShowcaseCase {
  id: string
  icon: string
  title: Bi
  blurb: Bi
  tag: Bi
  category: CategoryKey
  href?: string
}
export interface RealCase {
  id: string; icon: string; title: Bi; blurb: Bi; tag: Bi; category: CategoryKey
  result: Bi      // the "обернул во благо" payoff line
  author: Bi      // attribution
  href?: string   // → blog deep-dive; omitted until the post exists
}

interface ResolvedDream { id: string; icon: string; title: string; blurb: string; tag: string; category: CategoryKey; href?: string }
interface ResolvedReal extends ResolvedDream { result: string; author: string }

export interface ShowcaseVM {
  label: string
  video: { source: VideoSource | null; poster: string | null; caption: string }
  real: { heading: string; cases: ResolvedReal[] }
  dream: { heading: string; cases: ResolvedDream[] }
  categories: ResolvedCategory[]
  cta: string
}

const LABEL: Bi = { ru: 'Возможности', en: 'Possibilities' }
const REAL_HEADING: Bi = { ru: 'Реальные истории', en: 'Real stories' }
const DREAM_HEADING: Bi = { ru: 'О чём можно мечтать', en: 'What you can dream about' }
const CTA: Bi = { ru: 'Начать свой путь →', en: 'Start your path →' }
const VIDEO: { url: string | null; poster: string | null; caption: Bi } = {
  url: null,    // впиши YouTube/Vimeo watch-URL или путь к .mp4 — встроится автоматически
  poster: null, // путь к постеру в /public, например '/showcase-poster.jpg'
  caption: { ru: 'Короткий ролик о сути — скоро', en: 'A short film about the essence — coming soon' },
}

const DREAM_CASES: ShowcaseCase[] = [
  { id: 'partner', icon: '🤝',
    title: { ru: 'AI-напарник под твою нишу', en: 'An AI partner for your niche' },
    blurb: { ru: 'Не «сделай за меня», а со-мыслящий компаньон, который держит контекст твоего дела и двигает тебя думать.', en: 'Not a "do-it-for-me", but a co-thinking companion that holds the context of your work and moves you to think.' },
    tag: { ru: 'Со-мышление', en: 'Co-thinking' },
    category: 'co-thinking' },
  { id: 'weekend', icon: '🚀',
    title: { ru: 'Продукт за выходные', en: 'A product in a weekend' },
    blurb: { ru: 'От идеи до работающего прототипа — лендинг, бот, мини-сервис, — собранного с агентом за пару вечеров.', en: 'From idea to a working prototype — a landing page, a bot, a mini-service — built with an agent in a couple of evenings.' },
    tag: { ru: 'Запуск', en: 'Launch' },
    category: 'launch' },
  { id: 'routine', icon: '⚙️',
    title: { ru: 'Автоматизация рутины', en: 'Routine on autopilot' },
    blurb: { ru: 'Повторяющиеся задачи — отчёты, разборы, рассылки — уходят в пайплайн, который работает без тебя.', en: 'Repetitive tasks — reports, breakdowns, mailings — move into a pipeline that runs without you.' },
    tag: { ru: 'Поток', en: 'Flow' },
    category: 'flow' },
  { id: 'brain', icon: '🧠',
    title: { ru: 'Второй мозг', en: 'A second brain' },
    blurb: { ru: 'Твои заметки, источники и опыт — в граф знаний, который отвечает на вопросы и находит связи.', en: 'Your notes, sources, and experience — in a knowledge graph that answers questions and finds connections.' },
    tag: { ru: 'Знание', en: 'Knowledge' },
    category: 'knowledge' },
]

const REAL_CASES: RealCase[] = [
  { id: 'echo', icon: '🎙️',
    title: { ru: 'Echo — голос вместо клавиатуры', en: 'Echo — voice instead of keyboard' },
    blurb: { ru: 'Десктоп-приложение локальной диктовки: говоришь — появляется текст, офлайн, RU/EN. Собрано vibe-кодингом на Tauri, Rust и Whisper.', en: 'A desktop dictation app: you speak, text appears — offline, RU/EN. Built by vibe-coding with Tauri, Rust and Whisper.' },
    tag: { ru: 'Диктовка', en: 'Dictation' },
    category: 'dictation',
    result: { ru: 'Письма, заметки и код теперь надиктовываю — печать ушла на второй план.', en: 'I now dictate emails, notes and code — typing took a back seat.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'lms', icon: '🧭',
    title: { ru: 'Точка Сборки — этот самый сайт', en: 'Tochka Sborki — this very site' },
    blurb: { ru: 'RPG-платформа курса с AI-ментором, картой мира и квестами — собрана тем же vibe-кодингом, которому учит.', en: 'The course RPG platform with an AI mentor, world map and quests — built with the same vibe-coding it teaches.' },
    tag: { ru: 'Платформа', en: 'Platform' },
    category: 'platform',
    result: { ru: 'Целый обучающий продукт собран в одиночку, без классической команды разработки.', en: 'A whole learning product built solo, without a classic dev team.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'canvas', icon: '🗺️',
    title: { ru: 'Канвас AI-диаграмм', en: 'AI diagramming canvas' },
    blurb: { ru: 'Один холст, где идея превращается в схему: генераторы работают в фоне, ты двигаешь смысл, а не рисуешь прямоугольники.', en: 'One canvas where an idea becomes a diagram: generators run in the background, you move meaning instead of drawing rectangles.' },
    tag: { ru: 'Запуск', en: 'Launch' },
    category: 'launch',
    result: { ru: 'Схемы, на которые уходил час в редакторе, рождаются за минуты.', en: 'Diagrams that took an hour in an editor now appear in minutes.' },
    author: { ru: 'Александр', en: 'Alexander' } },
  { id: 'brain', icon: '🧠',
    title: { ru: 'Граф знаний — второй мозг', en: 'Knowledge graph — a second brain' },
    blurb: { ru: 'Заметки, источники и опыт собраны в граф, который отвечает на вопросы и находит связи между ними.', en: 'Notes, sources and experience gathered into a graph that answers questions and finds connections between them.' },
    tag: { ru: 'Знание', en: 'Knowledge' },
    category: 'knowledge',
    result: { ru: 'Перестал терять идеи — спрашиваю собственный архив как живого собеседника.', en: 'Stopped losing ideas — I query my own archive like a living interlocutor.' },
    author: { ru: 'Александр', en: 'Alexander' } },
]

export function videoEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

export interface VideoSource { kind: 'embed' | 'file'; src: string }

export function resolveVideoSource(url: string | null): VideoSource | null {
  if (!url) return null
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(url)) return { kind: 'file', src: url }
  const embed = videoEmbedUrl(url)
  return embed ? { kind: 'embed', src: embed } : null
}

export function withAutoplay(embedUrl: string): string {
  return embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1'
}

export function getShowcase(locale: Locale): ShowcaseVM {
  const L: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  const used = new Set<CategoryKey>([...REAL_CASES, ...DREAM_CASES].map(c => c.category))
  return {
    label: LABEL[L],
    video: { source: resolveVideoSource(VIDEO.url), poster: VIDEO.poster, caption: VIDEO.caption[L] },
    real: {
      heading: REAL_HEADING[L],
      cases: REAL_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], category: c.category, result: c.result[L], author: c.author[L], href: c.href })),
    },
    dream: {
      heading: DREAM_HEADING[L],
      cases: DREAM_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], category: c.category, href: c.href })),
    },
    categories: CATEGORIES.filter(c => used.has(c.key)).map(c => ({ key: c.key, label: c.label[L] })),
    cta: CTA[L],
  }
}
