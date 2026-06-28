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
  heroBadges: string[]
  pitch: { eyebrow: string; body: string; cta: string }
  founder: { eyebrow: string; heading: string; paragraphs: string[] }
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
  notFound: {
    code: string
    label: string
    heading: string
    body: string
    ctaHome: string
  }
  blog: {
    indexHeading: string
    backToSite: string
    empty: string
    readCta: string
    backToBlog: string
    relatedLabel: string
    footerThinkAloud: string
    footerPractice: string
    courseUrl: string
  }
  capture: {
    nameLabel: string
    emailLabel: string
    phoneLabel: string
    cityLabel: string
    cityPlaceholder: string
    messageLabel: string
    submitting: string
    errorMessage: string
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
    heroBadges: ['9 модулей', 'RU · EN', 'бесплатно', 'agent-agnostic'],
    pitch: {
      eyebrow: 'замена залипанию',
      body: 'Бинж-вотчинг и бесконечная лента дают дофамин, после которого пусто. Vibe coding даёт тот же заряд — но к утру у тебя в руках работающая штука, а не разряженная батарея.',
      cta: 'Поменять скролл на сборку →',
    },
    founder: {
      eyebrow: '// путь',
      heading: 'Усиливать голос, не заменять',
      paragraphs: [
        'Раньше я был учителем кундалини-йоги — с духовным именем (Рави Ангад Синх), мантрами, линией передачи, тренингами для учителей. Это был мир преданности гуру.',
        'Я намеренно ушёл из модели зависимости от учителя. Не потому что путь был плохим — а потому что сильный учитель растит не последователя, а другого учителя.',
        'Тот же принцип теперь в инструментах, которые я строю: AI усиливает твой голос, а не заменяет. Суверенность и агентность вместо зависимости — этому учит Точка Сборки, и так я живу сам.',
      ],
    },
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
        color: '#00d1ff',
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
    notFound: {
      code: '404',
      label: '⬡ Тупик',
      heading: 'Здесь\nпусто',
      body: 'Этой страницы нет. Зато есть всё остальное — проекты, курс, контакты.',
      ctaHome: 'На главную →',
    },
    blog: {
      indexHeading: 'Блог',
      backToSite: '← mamaev.coach',
      empty: 'Пока нет публикаций.',
      readCta: 'Читать',
      backToBlog: '← Блог',
      relatedLabel: 'По теме',
      footerThinkAloud: 'Думаю вслух в Telegram —',
      footerPractice: '. Практика — в открытом бесплатном курсе',
      courseUrl: 'https://ai.mamaev.coach',
    },
    capture: {
      nameLabel: 'Имя',
      emailLabel: 'Email',
      phoneLabel: 'Телефон / WhatsApp (по желанию)',
      cityLabel: 'Город',
      cityPlaceholder: 'Выбери город...',
      messageLabel: 'Вопрос или комментарий (по желанию)',
      submitting: 'Отправляем...',
      errorMessage: 'Что-то пошло не так, попробуй снова.',
    },
  },
  en: {
    tagline: '// mamaev.coach',
    name: 'Alexander\nMamaev',
    bio: 'Vibe coder, AI builder, coach. I build agent systems on Claude Code + n8n. I teach others to do the same.',
    heroBadges: ['9 modules', 'RU · EN', 'free', 'agent-agnostic'],
    pitch: {
      eyebrow: 'a swap for the scroll',
      body: "Binge-watching and the endless feed give you a dopamine hit that leaves you empty. Vibe coding gives the same charge — but by morning you're holding a working thing, not a drained battery.",
      cta: 'Trade the scroll for building →',
    },
    founder: {
      eyebrow: '// the path',
      heading: "Amplify the voice, don't replace it",
      paragraphs: [
        'I used to be a Kundalini-yoga teacher — with a spiritual name (Ravi Angad Singh), mantras, a lineage, teacher trainings. It was a world of devotion to the guru.',
        'I deliberately left the teacher-dependency model. Not because the path was bad — but because a strong teacher raises another teacher, not a follower.',
        "The same principle now lives in the tools I build: AI amplifies your voice, it doesn't replace it. Sovereignty and agency over dependency — that's what Tochka Sborki teaches, and how I live.",
      ],
    },
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
        color: '#00d1ff',
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
    notFound: {
      code: '404',
      label: '⬡ Dead end',
      heading: 'Nothing\nhere',
      body: 'This page does not exist. But everything else does — projects, the course, contacts.',
      ctaHome: 'Home →',
    },
    blog: {
      indexHeading: 'Blog',
      backToSite: '← mamaev.coach',
      empty: 'No posts yet.',
      readCta: 'Read',
      backToBlog: '← Blog',
      relatedLabel: 'Related',
      footerThinkAloud: 'Thinking out loud on Telegram —',
      footerPractice: '. Practice lives in the free open course',
      courseUrl: 'https://ai.mamaev.coach/en/',
    },
    capture: {
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone / WhatsApp (optional)',
      cityLabel: 'City',
      cityPlaceholder: 'Choose a city...',
      messageLabel: 'Question or comment (optional)',
      submitting: 'Sending...',
      errorMessage: 'Something went wrong, please try again.',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
