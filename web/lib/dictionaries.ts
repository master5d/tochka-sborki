export type Locale = 'ru' | 'en'

export type Dictionary = {
  nav: {
    brand: string
    roadmap: string
    cheatsheet: string
    feedback: string
    certificate: string
    login: string
    logout: string
    osTitle: string
    osCurrent: (os: string) => string
  }
  hero: {
    tagline: string
    titleLine1: string
    titleLine2: string
    subtitle: string
    stats: [string, string][]
    cta: string
  }
  forWhoLabel: string
  forWhoHeading: string
  forWho: { title: string; body: string }[]
  program: { sectionLabel: string }
  venn: {
    label: string
    heading: string
    items: string[]
    excluded: string[]
    inLabel1: string
    inLabel2: string
    outLabel1: string
    outLabel2: string
    scope: string
    excludedLegend: string
    provoc: string
    mobileExcludedLabel: string
  }
  faq: { label: string; items: { q: string; a: string }[] }
  author: { label: string; name: string; bio: string; cta: string }
  sidebar: { label: string }
  lesson: { complete: string; completing: string; completed: string }
  wizard: {
    unit: (i: number, total: number) => string
    next: string
    complete: string
    done: string
    nextUnit: string
    moduleComplete: string
    phases: string[]
  }
  footer: {
    tagline: string
    topicsLabel: string
    resourcesLabel: string
    authorLabel: string
    courseLabel: string
    authorName: string
    sendFeedback: string
    githubRepo: string
    viewSource: string
    license: string
    licenseFull: string
    rights: string
    builtWith: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  ru: {
    nav: {
      brand: 'Точка Сборки',
      roadmap: 'Roadmap',
      cheatsheet: 'Шпаргалка',
      feedback: 'Фидбек',
      certificate: 'Сертификат',
      login: '→ Войти',
      logout: 'Выйти',
      osTitle: 'Сменить OS',
      osCurrent: (os: string) => `Текущая OS: ${os === 'mac' ? 'macOS' : 'Windows'}. Нажми для смены.`,
    },
    hero: {
      tagline: '⬡ Открытый курс · Бесплатно',
      titleLine1: 'Точка',
      titleLine2: 'Сборки',
      subtitle: 'Курс по vibe-кодингу в потоке. От нонкодера до AI-generalist’а — Claude Code, агенты, автоматизация, деплой.',
      stats: [
        ['8', 'тем'],
        ['~14', 'часов'],
        ['8', 'упражнений'],
        ['$0', 'стоимость'],
      ],
      cta: 'Начать →',
    },
    forWhoLabel: 'Для кого',
    forWhoHeading: 'Этот курс для тебя, если...',
    forWho: [
      { title: 'Хочешь понять AI изнутри', body: 'Не просто пользоваться ChatGPT, а строить с ним — pipeline\'ы, агентов, автоматизации.' },
      { title: 'Уже пробовал, но не систематизировал', body: 'Промпты работают хаотично. Хочешь выстроить процесс, который масштабируется.' },
      { title: 'Строишь AI-продукт', body: 'Нужен практический фундамент: Claude Code, MCP, агенты, деплой — без воды.' },
      { title: 'Ценишь суверенитет', body: 'Walk-away экономика, open-source стек, никаких lock-in платформ.' },
    ],
    program: {
      sectionLabel: 'Темы курса · выбирай в любом порядке',
    },
    venn: {
      label: '// программа',
      heading: 'Что войдёт\nв курс',
      items: [
        'Claude Code с нуля до продакшна — первый деплой',
        'MCP-серверы: подключить инструмент за 20 минут',
        'Pipeline: URL → скрапинг → анализ → инсайты',
        'Промпты, которые работают — не «переформулируй»',
        'Агенты, которые пашут пока ты спишь',
        'CLAUDE.md — агент, помнящий твой контекст',
      ],
      excluded: [
        'теории без практики',
        'обзоры 50 нейросетей',
        'ChatGPT-туториалы из 2023',
        'домашки без смысла',
      ],
      inLabel1: 'ТО, ЧТО',
      inLabel2: 'БУДЕТ',
      outLabel1: 'ТО, ЧЕГО',
      outLabel2: 'НЕ БУДЕТ',
      scope: 'SCOPE',
      excludedLegend: 'EXCLUDED',
      provoc: '// хуйни не будет. и воды тоже.',
      mobileExcludedLabel: '// чего не будет',
    },
    faq: {
      label: 'Вопросы',
      items: [
        { q: 'Нужно ли уметь программировать?', a: 'Нет. Vibe coding — это подход где AI пишет код, а ты управляешь. Мы начинаем с нуля.' },
        { q: 'Что такое vibe coding?', a: 'Разработка в потоке: ты описываешь задачу, AI реализует, ты итерируешь. Скорость ×10.' },
        { q: 'Сколько времени нужно в неделю?', a: '30–60 минут на тему + практика. Курс самостоятельный, без дедлайнов.' },
        { q: 'Чем отличается от других AI-курсов?', a: 'Мы не обзор нейросетей. Мы — практический стек: Claude Code, MCP, агенты, деплой, автоматизация.' },
      ],
    },
    author: {
      label: 'Об авторе',
      name: 'Александр\nМамаев',
      bio: 'Vibe coder, AI builder, коуч. Строю системы на Claude Code + агентах. Курс — дистилляция того, что работает на практике.',
      cta: 'Оставить фидбек →',
    },
    sidebar: {
      label: 'Темы курса',
    },
    lesson: {
      complete: '○ Отметить как пройденный',
      completing: '...',
      completed: '● Урок завершён',
    },
    wizard: {
      unit: (i: number, total: number) => `Unit ${i} из ${total}`,
      next: 'Далее →',
      complete: 'Отметить пройденным ✓',
      done: '● Пройдено',
      nextUnit: 'Следующий unit →',
      moduleComplete: 'Модуль завершён →',
      phases: ['Активация', 'Рефлексия', 'Концепция', 'Практика'],
    },
    footer: {
      tagline: 'Курс по vibe-кодингу. От нуля до агентских систем — 8 элективных тем.',
      topicsLabel: '// темы',
      resourcesLabel: '// материалы',
      authorLabel: '// автор',
      courseLabel: '// проект',
      authorName: 'Александр Мамаев',
      sendFeedback: 'Оставить фидбек →',
      githubRepo: 'GitHub @master5d',
      viewSource: 'Посмотреть код →',
      license: 'MIT',
      licenseFull: 'MIT License',
      rights: 'Открытый курс. Используй, форкай, делись.',
      builtWith: 'Собрано с Claude Code',
    },
  },
  en: {
    nav: {
      brand: 'Tochka Sborki',
      roadmap: 'Roadmap',
      cheatsheet: 'Cheatsheet',
      feedback: 'Feedback',
      certificate: 'Certificate',
      login: '→ Sign in',
      logout: 'Sign out',
      osTitle: 'Switch OS',
      osCurrent: (os: string) => `Current OS: ${os === 'mac' ? 'macOS' : 'Windows'}. Click to switch.`,
    },
    hero: {
      tagline: '⬡ Open course · Free',
      titleLine1: 'Tochka',
      titleLine2: 'Sborki',
      subtitle: 'A vibe-coding course in flow. From non-coder to AI generalist — Claude Code, agents, automation, deploys.',
      stats: [
        ['8', 'topics'],
        ['~14', 'hours'],
        ['8', 'exercises'],
        ['$0', 'cost'],
      ],
      cta: 'Start →',
    },
    forWhoLabel: 'Who it’s for',
    forWhoHeading: 'This course is for you if...',
    forWho: [
      { title: 'You want to understand AI from inside', body: 'Not just use ChatGPT — build with it: pipelines, agents, automations.' },
      { title: 'You’ve tried but it’s not systematic', body: 'Prompts work hit-or-miss. You want a process that scales.' },
      { title: 'You’re building an AI product', body: 'You need a practical foundation: Claude Code, MCP, agents, deploys — no fluff.' },
      { title: 'You value sovereignty', body: 'Walk-away economics, open-source stack, no platform lock-in.' },
    ],
    program: {
      sectionLabel: 'Course topics · pick any order',
    },
    venn: {
      label: '// program',
      heading: 'What’s\nincluded',
      items: [
        'Claude Code from zero to production — first deploy',
        'MCP servers: hook up a real tool in 20 minutes',
        'Pipeline: URL → scrape → analyze → insights',
        'Prompts that work — not «try rephrasing»',
        'Agents that hustle while you sleep',
        'CLAUDE.md — an agent that remembers your context',
      ],
      excluded: [
        'theory without practice',
        'reviews of 50 neural nets',
        'ChatGPT tutorials from 2023',
        'pointless homework',
      ],
      inLabel1: 'WHAT’S',
      inLabel2: 'IN',
      outLabel1: 'WHAT’S',
      outLabel2: 'OUT',
      scope: 'SCOPE',
      excludedLegend: 'EXCLUDED',
      provoc: '// no bullshit. no filler.',
      mobileExcludedLabel: '// what’s out',
    },
    faq: {
      label: 'Questions',
      items: [
        { q: 'Do I need to know how to code?', a: 'No. Vibe coding means AI writes code, you direct. We start from zero.' },
        { q: 'What is vibe coding?', a: 'Development in flow: you describe the task, AI implements, you iterate. 10× speed.' },
        { q: 'How much time per week?', a: '30–60 minutes per topic + practice. Self-paced, no deadlines.' },
        { q: 'How is this different from other AI courses?', a: 'We’re not a tour of neural nets. We’re a practical stack: Claude Code, MCP, agents, deploys, automation.' },
      ],
    },
    author: {
      label: 'About author',
      name: 'Alexander\nMamaev',
      bio: 'Vibe coder, AI builder, coach. I build systems on Claude Code + agents. This course is a distillation of what actually works.',
      cta: 'Send feedback →',
    },
    sidebar: {
      label: 'Course topics',
    },
    lesson: {
      complete: '○ Mark as complete',
      completing: '...',
      completed: '● Lesson complete',
    },
    wizard: {
      unit: (i: number, total: number) => `Unit ${i} of ${total}`,
      next: 'Next →',
      complete: 'Mark complete ✓',
      done: '● Done',
      nextUnit: 'Next unit →',
      moduleComplete: 'Topic complete →',
      phases: ['Activation', 'Reflection', 'Concept', 'Practice'],
    },
    footer: {
      tagline: 'A vibe-coding course. From zero to agentic systems across 8 elective topics.',
      topicsLabel: '// topics',
      resourcesLabel: '// resources',
      authorLabel: '// author',
      courseLabel: '// project',
      authorName: 'Alexander Mamaev',
      sendFeedback: 'Send feedback →',
      githubRepo: 'GitHub @master5d',
      viewSource: 'View source →',
      license: 'MIT',
      licenseFull: 'MIT License',
      rights: 'Open course. Use it, fork it, share it.',
      builtWith: 'Built with Claude Code',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
