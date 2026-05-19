export type Locale = 'ru' | 'en'

interface Project {
  badge: string
  title: string
  subtitle: string
  href: string
  cta: string
  status: string
  color: string
}

interface Social {
  label: string
  href: string
}

export interface Dictionary {
  tagline: string
  name: string
  bio: string
  projectsLabel: string
  contactsLabel: string
  projects: Project[]
  socials: Social[]
  footerTagline: string
  langSuggest: {
    message: string
    switchAction: string
    dismissAction: string
  }
  langSwitch: {
    toEn: string
    toRu: string
  }
}

const SOCIALS_COMMON: Social[] = [
  { label: 'GitHub', href: 'https://github.com/master5d' },
  { label: 'Email', href: 'mailto:mamaev.sasha@gmail.com' },
]

export const dictionaries: Record<Locale, Dictionary> = {
  ru: {
    tagline: '// mamaev.coach',
    name: 'Александр\nМамаев',
    bio: 'Vibe coder, AI builder, коуч. Строю agent-системы на Claude Code + n8n. Учу других делать то же самое.',
    projectsLabel: '// проекты',
    contactsLabel: '// контакты',
    projects: [
      {
        badge: '⬡  AI КУРС',
        title: 'Точка Сборки',
        subtitle: 'Открытый курс по vibe-кодингу — Claude Code, MCP, агенты, автоматизация.',
        href: 'https://ai.mamaev.coach',
        cta: 'Начать курс →',
        status: 'open · бесплатно',
        color: '#00ff88',
      },
      {
        badge: '⚙  ДЛЯ БИЗНЕСА',
        title: 'Агентский инжиниринг',
        subtitle: 'Дизайн и реализация production agent-систем для команд — от спецификации до n8n + observability.',
        href: 'https://mentor.mamaev.coach',
        cta: 'Узнать больше →',
        status: 'b2b · по запросу',
        color: '#00aaff',
      },
    ],
    socials: SOCIALS_COMMON,
    footerTagline: '⬡ vibe in motion',
    langSuggest: {
      message: '🌐 This site is also available in English.',
      switchAction: 'Switch to English →',
      dismissAction: 'Stay in Russian',
    },
    langSwitch: {
      toEn: 'EN',
      toRu: 'RU',
    },
  },
  en: {
    tagline: '// mamaev.coach',
    name: 'Alexander\nMamaev',
    bio: 'Vibe coder, AI builder, coach. I build agent systems on Claude Code + n8n. I teach others to do the same.',
    projectsLabel: '// projects',
    contactsLabel: '// contacts',
    projects: [
      {
        badge: '⬡  AI COURSE',
        title: 'Tochka Sborki',
        subtitle: 'An open course on vibe-coding — Claude Code, MCP, agents, automation.',
        href: 'https://ai.mamaev.coach/en/',
        cta: 'Start the course →',
        status: 'open · free',
        color: '#00ff88',
      },
      {
        badge: '⚙  FOR BUSINESS',
        title: 'Agent engineering',
        subtitle: 'Design and delivery of production agent systems for teams — from spec to n8n + observability.',
        href: 'https://mentor.mamaev.coach/en/',
        cta: 'Learn more →',
        status: 'b2b · on request',
        color: '#00aaff',
      },
    ],
    socials: SOCIALS_COMMON,
    footerTagline: '⬡ vibe in motion',
    langSuggest: {
      message: '🌐 Этот сайт также доступен на русском.',
      switchAction: 'Переключить на русский →',
      dismissAction: 'Остаться на английском',
    },
    langSwitch: {
      toEn: 'EN',
      toRu: 'RU',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
