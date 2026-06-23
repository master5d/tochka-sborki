import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface ShowcaseCase {
  id: string
  icon: string
  title: Bi
  blurb: Bi
  tag: Bi
  href?: string
}
export interface ShowcaseVM {
  label: string
  heading: string
  videoUrl: string | null
  videoCaption: string
  cases: { id: string; icon: string; title: string; blurb: string; tag: string; href?: string }[]
  cta: string
}

const LABEL: Bi = { ru: 'Возможности', en: 'Possibilities' }
const HEADING: Bi = { ru: 'О чём можно мечтать', en: 'What you can dream about' }
const CTA: Bi = { ru: 'Начать свой путь →', en: 'Start your path →' }
const VIDEO: { url: string | null; poster: string | null; caption: Bi } = {
  url: null,    // впиши YouTube/Vimeo watch-URL или путь к .mp4 — встроится автоматически
  poster: null, // путь к постеру в /public, например '/showcase-poster.jpg'
  caption: { ru: 'Короткий ролик о сути — скоро', en: 'A short film about the essence — coming soon' },
}

const CASES: ShowcaseCase[] = [
  { id: 'partner', icon: '🤝',
    title: { ru: 'AI-напарник под твою нишу', en: 'An AI partner for your niche' },
    blurb: { ru: 'Не «сделай за меня», а со-мыслящий компаньон, который держит контекст твоего дела и двигает тебя думать.', en: 'Not a "do-it-for-me", but a co-thinking companion that holds the context of your work and moves you to think.' },
    tag: { ru: 'Со-мышление', en: 'Co-thinking' } },
  { id: 'weekend', icon: '🚀',
    title: { ru: 'Продукт за выходные', en: 'A product in a weekend' },
    blurb: { ru: 'От идеи до работающего прототипа — лендинг, бот, мини-сервис, — собранного с агентом за пару вечеров.', en: 'From idea to a working prototype — a landing page, a bot, a mini-service — built with an agent in a couple of evenings.' },
    tag: { ru: 'Запуск', en: 'Launch' } },
  { id: 'routine', icon: '⚙️',
    title: { ru: 'Автоматизация рутины', en: 'Routine on autopilot' },
    blurb: { ru: 'Повторяющиеся задачи — отчёты, разборы, рассылки — уходят в пайплайн, который работает без тебя.', en: 'Repetitive tasks — reports, breakdowns, mailings — move into a pipeline that runs without you.' },
    tag: { ru: 'Поток', en: 'Flow' } },
  { id: 'brain', icon: '🧠',
    title: { ru: 'Второй мозг', en: 'A second brain' },
    blurb: { ru: 'Твои заметки, источники и опыт — в граф знаний, который отвечает на вопросы и находит связи.', en: 'Your notes, sources, and experience — in a knowledge graph that answers questions and finds connections.' },
    tag: { ru: 'Знание', en: 'Knowledge' } },
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
  return {
    label: LABEL[L],
    heading: HEADING[L],
    videoUrl: VIDEO.url,
    videoCaption: VIDEO.caption[L],
    cases: CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], href: c.href })),
    cta: CTA[L],
  }
}
