export type Locale = 'ru' | 'en'

interface Service {
  label: string
  title: string
  body: string
  deliverable: string
  duration: string
}

interface Case {
  name: string
  tag: string
  body: string
  stack: string
}

export interface Dictionary {
  hero: {
    tagline: string
    titleLines: string[]   // shown as <br>-separated lines
    subtitleLead: string
    subtitleBoldFragment: string
    subtitleTail: string
    ctaPrimary: string
    ctaSecondary: string
  }
  servicesLabel: string
  servicesHeading: string
  services: Service[]
  casesLabel: string
  casesHeading: string
  cases: Case[]
  processLabel: string
  processHeading: string
  process: [string, string][]   // [num, text]
  contactHeading: string
  contactBody: string
  footerLeft: string
  footerLinks: { label: string; href: string }[]
  langSuggest: {
    message: string
    switchAction: string
    dismissAction: string
  }
  notFound: {
    code: string
    label: string
    heading: string
    body: string
    ctaHome: string
  }
}

export const CONTACT_EMAIL = 'sasha@mamaev.coach'

export const dictionaries: Record<Locale, Dictionary> = {
  ru: {
    hero: {
      tagline: '⚙  Agent Engineering · для бизнеса',
      titleLines: ['Когда промпт', 'перестаёт', 'работать'],
      subtitleLead: 'Проектирую и собираю ',
      subtitleBoldFragment: 'production agent-системы',
      subtitleTail: ': оркестрация, observability, fallback-маршрутизация, recovery. Не «один большой промпт» — инженерная архитектура с верификацией и трейсами.',
      ctaPrimary: '→ Discovery call',
      ctaSecondary: '⬡ Открытый курс',
    },
    servicesLabel: '// services',
    servicesHeading: 'Три формата работы',
    services: [
      {
        label: '01',
        title: 'Audit & Spec',
        body: 'Карта твоих ручных процессов → архитектурная спецификация агент-системы. Включает декомпозицию на AI/Tool/Code узлы, ROI-оценку.',
        deliverable: 'Implementation-ready spec',
        duration: '~2 недели',
      },
      {
        label: '02',
        title: 'Build & Ship',
        body: 'Реализация pipeline на n8n / Claude Code / custom backend. CI/CD, observability через Langfuse, fallback-маршруты на LLM, alerting.',
        deliverable: 'Production-ready system',
        duration: '~6 недель',
      },
      {
        label: '03',
        title: 'Embed Engineer',
        body: 'Работаю part-time как embedded agent engineer в команде. Помогаю проектировать, ревьюить, бить production-fires.',
        deliverable: 'Continuous capacity',
        duration: 'monthly retainer',
      },
    ],
    casesLabel: '// cases',
    casesHeading: 'Что я уже строю',
    cases: [
      {
        name: 'VIBERULER',
        tag: 'опубликованный CLI-инструмент',
        body: 'Бенчмарк для тех, кто кодит с ИИ: читает локальные транскрипты сессий и считает, как на самом деле шла работа. По умолчанию — ноль сетевых вызовов; при отправке результата показывает точный JSON и спрашивает разрешение. Опубликован в npm, ставится одной командой.',
        stack: 'TypeScript · npm · CF Worker',
      },
      {
        name: 'ASTROLABE',
        tag: 'мультидвижковый монорепо',
        body: '16 независимых движков интерпретации под одним зонтиком: детерминированный расчёт отдельно, LLM-объяснение поверх него. Правило governance жёсткое — без найденных источников модель не вызывается вовсе, поэтому система не выдумывает доктрину. Общий RAG-слой и единый шлюз к моделям.',
        stack: 'Python · RAG (BM25 + bge-m3) · uv-workspace',
      },
      {
        name: 'ECHO',
        tag: 'локальная речь-в-текст',
        body: 'Двуязычная диктовка, работающая на своём железе: русский и английский, в том числе вперемешку в одной фразе. Распознавание идёт на устройстве и печатает текст прямо в активное приложение — без облака, аккаунта и телеметрии. Windows, macOS, Linux.',
        stack: 'Whisper/Parakeet · GPU · desktop',
      },
      {
        name: 'OPENYOGA',
        tag: 'desktop-тьютор по корпусу',
        body: 'Монорепо вокруг корпуса первоисточников: конвертация в чистый Markdown, типизированный SDK для валидации и поиска, и десктоп-тьютор, который ведёт практику и читает уроки поверх этого корпуса. Работает офлайн; архитектура развязана от конкретной традиции.',
        stack: 'Tauri v2 · TypeScript · npm-workspaces',
      },
    ],
    processLabel: '// process',
    processHeading: 'Как работаем',
    process: [
      ['01', 'Discovery call (30 мин, бесплатно)'],
      ['02', 'Workshop: декомпозиция задачи, scope, acceptance criteria'],
      ['03', 'Spec → твой человек или я строим'],
      ['04', 'Build sprints с weekly check-ins'],
      ['05', 'Handover + observability + runbook'],
    ],
    contactHeading: 'Начнём с разговора',
    contactBody: '30 минут чтобы понять задачу и есть ли смысл работать вместе. Без воды, без слайдов.',
    footerLeft: '© {YEAR} · mentor.mamaev.coach',
    footerLinks: [
      { label: '← mamaev.coach', href: 'https://mamaev.coach' },
      { label: 'ai.synergify.com', href: 'https://ai.synergify.com' },
      { label: 'github', href: 'https://github.com/master5d' },
    ],
    langSuggest: {
      message: '🌐 This site is also available in English.',
      switchAction: 'Switch to English →',
      dismissAction: 'Stay in Russian',
    },
    notFound: {
      code: '404',
      label: '⚙  Страница не найдена',
      heading: 'Этой\nстраницы\nнет',
      body: 'Ссылка устарела или ведёт в никуда. Вернёмся к делу — посмотрите услуги или напишите напрямую.',
      ctaHome: 'На главную →',
    },
  },
  en: {
    hero: {
      tagline: '⚙  Agent Engineering · for business',
      titleLines: ['When the prompt', 'stops', 'working'],
      subtitleLead: 'I design and build ',
      subtitleBoldFragment: 'production agent systems',
      subtitleTail: ': orchestration, observability, fallback routing, recovery. Not "one big prompt" — engineering architecture with verification and traces.',
      ctaPrimary: '→ Discovery call',
      ctaSecondary: '⬡ Open course',
    },
    servicesLabel: '// services',
    servicesHeading: 'Three engagement formats',
    services: [
      {
        label: '01',
        title: 'Audit & Spec',
        body: 'Map your manual processes → architectural spec for an agent system. Includes AI/Tool/Code node decomposition and ROI assessment.',
        deliverable: 'Implementation-ready spec',
        duration: '~2 weeks',
      },
      {
        label: '02',
        title: 'Build & Ship',
        body: 'Pipeline implementation on n8n / Claude Code / custom backend. CI/CD, observability via Langfuse, LLM fallback routes, alerting.',
        deliverable: 'Production-ready system',
        duration: '~6 weeks',
      },
      {
        label: '03',
        title: 'Embed Engineer',
        body: 'Part-time embedded agent engineer with your team. Help with design, reviews, fighting production fires.',
        deliverable: 'Continuous capacity',
        duration: 'monthly retainer',
      },
    ],
    casesLabel: '// cases',
    casesHeading: 'What I’m already building',
    cases: [
      {
        name: 'VIBERULER',
        tag: 'published CLI tool',
        body: 'A benchmark for people who code with AI: it reads local session transcripts and measures how the work actually went. The default run makes zero network calls; before anything is submitted it prints the exact JSON and asks. Published on npm, one command to run.',
        stack: 'TypeScript · npm · CF Worker',
      },
      {
        name: 'ASTROLABE',
        tag: 'multi-engine monorepo',
        body: 'Sixteen independent interpretation engines under one umbrella: deterministic calculation first, LLM explanation on top. The governance rule is strict — with no retrieved sources the model is never called, so the system cannot invent doctrine. Shared RAG layer, single gateway to the models.',
        stack: 'Python · RAG (BM25 + bge-m3) · uv workspace',
      },
      {
        name: 'ECHO',
        tag: 'local speech-to-text',
        body: 'Bilingual dictation that runs on your own hardware: Russian and English, including both mixed inside one sentence. Recognition happens on-device and types straight into whatever app is in front of you — no cloud, no account, no telemetry. Windows, macOS, Linux.',
        stack: 'Whisper/Parakeet · GPU · desktop',
      },
      {
        name: 'OPENYOGA',
        tag: 'desktop tutor over a corpus',
        body: 'A monorepo built around a source corpus: conversion into clean Markdown, a typed SDK for validating and querying it, and a desktop tutor that runs practices and reads lessons over that corpus. Works offline; the architecture is decoupled from any single tradition.',
        stack: 'Tauri v2 · TypeScript · npm workspaces',
      },
    ],
    processLabel: '// process',
    processHeading: 'How we work',
    process: [
      ['01', 'Discovery call (30 min, free)'],
      ['02', 'Workshop: task decomposition, scope, acceptance criteria'],
      ['03', 'Spec → your team or I implement'],
      ['04', 'Build sprints with weekly check-ins'],
      ['05', 'Handover + observability + runbook'],
    ],
    contactHeading: 'Let’s start with a conversation',
    contactBody: '30 minutes to understand the task and whether it makes sense to work together. No fluff, no slides.',
    footerLeft: '© {YEAR} · mentor.mamaev.coach',
    footerLinks: [
      { label: '← mamaev.coach', href: 'https://mamaev.coach/en/' },
      { label: 'ai.synergify.com', href: 'https://ai.synergify.com/en/' },
      { label: 'github', href: 'https://github.com/master5d' },
    ],
    langSuggest: {
      message: '🌐 Этот сайт также доступен на русском.',
      switchAction: 'Переключить на русский →',
      dismissAction: 'Остаться на английском',
    },
    notFound: {
      code: '404',
      label: '⚙  Page not found',
      heading: 'This page\ndoes not\nexist',
      body: 'The link is outdated or leads nowhere. Let’s get back to business — take a look at the services or reach out directly.',
      ctaHome: 'Home →',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
