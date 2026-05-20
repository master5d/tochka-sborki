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
    ctaSecondary: string
    ctaSecondaryAuthed: string
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
  mobileGate: {
    title: string
    body: string
    emailAction: string
    emailSending: string
    emailSent: string
    emailFailed: string
    qrAction: string
    qrHint: string
    continueAction: string
    dismissHint: string
    backToHome: string
  }
  langSuggest: {
    message: string
    switchAction: string
    dismissAction: string
  }
  feedback: {
    pageLabel: string
    pageHeading: string
    pageSubtitle: string
    moduleLabel: string
    modulePlaceholder: string
    likertDisagree: string
    likertAgree: string
    recommendLabel: string
    impactLabel: string
    applyLabel: string
    unclearLabel: string
    otherLabel: string
    submitting: string
    submit: string
    successMessage: string
    errorMessage: string
    pageTitle: string
    pageDescription: string
  }
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
      subtitle: 'Курс по agentic AI в потоке. От нонкодера до AI-generalist’а — Claude Code, Hermes/Aider, локальные модели, MCP, оркестрация. Твой стек на выбор.',
      stats: [
        ['9', 'тем'],
        ['~15', 'часов'],
        ['8', 'упражнений'],
        ['$0', 'стоимость'],
      ],
      cta: 'Программа ↓',
      ctaSecondary: '→ Войти',
      ctaSecondaryAuthed: '→ Продолжить курс',
    },
    forWhoLabel: 'Для кого',
    forWhoHeading: 'Этот курс для тебя, если...',
    forWho: [
      { title: 'Хочешь понять AI изнутри', body: 'Не просто пользоваться ChatGPT, а строить с ним — pipeline’ы, агентов, автоматизации.' },
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
        'Карта местности AI-кодинга для нонкодеров',
        'Software 3.0 — четыре сдвига в разработке',
        'Базовый сетап: Warp, Claude Code, Git, Marp',
        'Выбор стека: Claude / Sovereign / Cloud-OSS / Behind-GFW',
        'Промпт-инжиниринг: магические слова и формулы',
        'CLAUDE.md, контекст и система памяти',
        'Pipeline: URL → скрапинг → анализ → инсайты',
        'MCP-серверы, Hooks, Skills, Superpowers',
        'Агентский инжиниринг и оркестрация систем',
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
    langSuggest: {
      // Shown to EN-locale visitors on RU pages — written in English
      message: '🌐 This site is also available in English.',
      switchAction: 'Switch to English →',
      dismissAction: 'Stay in Russian',
    },
    feedback: {
      pageLabel: '⬡ Фидбек',
      pageHeading: 'Оцени\nкурс',
      pageSubtitle: 'Твой отзыв помогает курсу самообновляться. 2 минуты — и урок станет лучше для следующего студента.',
      moduleLabel: 'Модуль',
      modulePlaceholder: 'Выбери модуль...',
      likertDisagree: 'Не согласен',
      likertAgree: 'Согласен',
      recommendLabel: 'Я бы порекомендовал(а) этот курс другу или коллеге',
      impactLabel: 'Этот урок изменил то, как я думаю о работе с AI',
      applyLabel: 'Я знаю, как применить это прямо сейчас',
      unclearLabel: 'Что было непонятно или хотелось бы разобрать подробнее? (опционально)',
      otherLabel: 'Что ещё хочешь сказать? (опционально)',
      submitting: 'Отправляем...',
      submit: 'Отправить фидбек →',
      successMessage: '✓ Спасибо! Фидбек отправлен.',
      errorMessage: 'Что-то пошло не так, попробуй снова.',
      pageTitle: 'Фидбек — Точка Сборки',
      pageDescription: 'Обратная связь по курсу',
    },
    mobileGate: {
      title: '💻 Этот урок — для десктопа',
      body: 'Тебе понадобится терминал, чтобы делать практику. Регистрация и обзор работают на мобилке, но уроки лучше открывать с ноута / десктопа.',
      emailAction: '✉️  Прислать ссылку на email',
      emailSending: '⏳ Отправляю…',
      emailSent: '✓ Ссылка отправлена на твой email. Открой её на ноуте.',
      emailFailed: 'Не получилось отправить. Попробуй QR-код или продолжи на мобиле.',
      qrAction: '📱 Показать QR-код',
      qrHint: 'Отсканируй с ноутбука — урок откроется в нём.',
      continueAction: 'Всё равно открыть на мобиле',
      dismissHint: 'Не показывать 7 дней',
      backToHome: '← На главную',
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
      tagline: 'Курс по agentic AI. От нуля до агентских систем — 9 элективных тем, твой стек на выбор.',
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
      subtitle: 'An agentic-AI course in flow. From non-coder to AI generalist — Claude Code, Hermes/Aider, local models, MCP, orchestration. Pick your stack.',
      stats: [
        ['9', 'topics'],
        ['~15', 'hours'],
        ['8', 'exercises'],
        ['$0', 'cost'],
      ],
      cta: 'See program ↓',
      ctaSecondary: '→ Sign in',
      ctaSecondaryAuthed: '→ Continue course',
    },
    forWhoLabel: 'Who it’s for',
    forWhoHeading: 'This course is for you if...',
    forWho: [
      { title: 'You want to understand AI from the inside', body: 'Not just use ChatGPT — build with it: pipelines, agents, automation.' },
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
        'Map of AI-coding tools for non-coders',
        'Software 3.0 — four shifts in development',
        'Setup essentials: Warp, Claude Code, Git, Marp',
        'Stack selection: Claude / Sovereign / Cloud-OSS / Behind-GFW',
        'Prompt engineering: magic words and formulas',
        'CLAUDE.md, context, and memory systems',
        'Pipeline: URL → scrape → analyze → insights',
        'MCP servers, Hooks, Skills, Superpowers',
        'Agent engineering and system orchestration',
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
      label: 'About the author',
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
    langSuggest: {
      // Shown to RU-locale visitors on EN pages — written in Russian
      message: '🌐 Этот сайт также доступен на русском.',
      switchAction: 'Переключить на русский →',
      dismissAction: 'Остаться на английском',
    },
    feedback: {
      pageLabel: '⬡ Feedback',
      pageHeading: 'Rate the\ncourse',
      pageSubtitle: 'Your feedback helps the course self-update. 2 minutes — and the lesson gets better for the next student.',
      moduleLabel: 'Module',
      modulePlaceholder: 'Pick a module...',
      likertDisagree: 'Disagree',
      likertAgree: 'Agree',
      recommendLabel: 'I would recommend this course to a friend or colleague',
      impactLabel: 'This lesson changed how I think about working with AI',
      applyLabel: 'I know how to apply this right now',
      unclearLabel: 'What was unclear or what would you like covered in more depth? (optional)',
      otherLabel: 'Anything else you want to say? (optional)',
      submitting: 'Sending...',
      submit: 'Send feedback →',
      successMessage: '✓ Thanks! Feedback sent.',
      errorMessage: 'Something went wrong, try again.',
      pageTitle: 'Feedback — Tochka Sborki',
      pageDescription: 'Feedback on the course',
    },
    mobileGate: {
      title: '💻 This lesson is for desktop',
      body: 'You’ll need a terminal for the practice. Sign-up and browsing work on mobile, but lessons are best opened on a laptop / desktop.',
      emailAction: '✉️  Email me the link',
      emailSending: '⏳ Sending…',
      emailSent: '✓ Link sent to your email. Open it on your laptop.',
      emailFailed: 'Couldn’t send. Try the QR code or continue on mobile.',
      qrAction: '📱 Show QR code',
      qrHint: 'Scan from your laptop — the lesson will open there.',
      continueAction: 'Open on mobile anyway',
      dismissHint: 'Don’t show for 7 days',
      backToHome: '← Back to home',
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
      tagline: 'An agentic-AI course. From zero to agentic systems across 9 elective topics, pick your stack.',
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
