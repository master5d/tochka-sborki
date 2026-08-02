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

export const CONTACT_EMAIL = 'mamaev.sasha@gmail.com'

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
        name: 'SOVERN GATEWAY',
        tag: 'llm-маршрутизация',
        body: 'Одна OpenAI-совместимая точка входа для всего парка агентов: 16 пул-алиасов поверх 7 провайдеров, 29 маршрутов с приоритетами. Цепочка сначала вычерпывает бесплатные квоты, а терминальный фолбэк — модель на собственном железе, поэтому работа не останавливается при отказе любого облака. Доступ через приватную сеть, без публичного порта.',
        stack: 'LiteLLM · Tailscale · Apple silicon · GitOps',
      },
      {
        name: 'MC_HUB',
        tag: 'edge-платформа',
        body: 'Семь поверхностей на одном движке: три сайта, курс, API-воркер и D1. Вход — magic-link, Google OAuth и Telegram Mini App, все через один session-слой; платежи, транзакционная почта и ежедневный cron живут в том же воркере. 1100+ тестов и 16 миграций базы — деплой идёт с ветки без ручных шагов.',
        stack: 'CF Workers · Pages · D1 · Stripe · SES',
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
        name: 'SOVERN GATEWAY',
        tag: 'llm routing',
        body: 'One OpenAI-compatible entry point for a whole fleet of agents: 16 pool aliases over 7 providers, 29 prioritised routes. The chain drains free quotas first and terminates in a model running on our own hardware, so work continues when any cloud fails. Reachable over a private network, with no public port.',
        stack: 'LiteLLM · Tailscale · Apple silicon · GitOps',
      },
      {
        name: 'MC_HUB',
        tag: 'edge platform',
        body: 'Seven surfaces on one engine: three sites, a course, an API worker and D1. Sign-in via magic link, Google OAuth and a Telegram Mini App all mint the same session; payments, transactional mail and a daily cron live in the same worker. 1100+ tests and 16 database migrations — deploys run from the branch with no manual steps.',
        stack: 'CF Workers · Pages · D1 · Stripe · SES',
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
