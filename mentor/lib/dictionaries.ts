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
        name: 'ENERV',
        tag: 'personal knowledge pipeline',
        body: 'Семантический журнал на 1400+ Markdown-нод. Gmail Trigger → Gemini Router → ACL Transformer → Obsidian vault. 9 узлов, 2 LLM, idempotent через Gmail labels.',
        stack: 'n8n · Gemini · Qdrant · Docker',
      },
      {
        name: 'SOVERN',
        tag: 'production infrastructure',
        body: 'Self-hosted agent stack: Hetzner CX22 + Cloudflare Tunnel + Docker bridge. n8n + Langfuse + Postgres. LiteLLM 5-fallback routing, SMTP через Resend.',
        stack: 'Hetzner · CF Tunnel · Docker · LiteLLM',
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
      { label: 'ai.mamaev.coach', href: 'https://ai.mamaev.coach' },
      { label: 'github', href: 'https://github.com/master5d' },
    ],
    langSuggest: {
      message: '🌐 This site is also available in English.',
      switchAction: 'Switch to English →',
      dismissAction: 'Stay in Russian',
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
        name: 'ENERV',
        tag: 'personal knowledge pipeline',
        body: 'A semantic journal across 1400+ Markdown nodes. Gmail Trigger → Gemini Router → ACL Transformer → Obsidian vault. 9 nodes, 2 LLMs, idempotent via Gmail labels.',
        stack: 'n8n · Gemini · Qdrant · Docker',
      },
      {
        name: 'SOVERN',
        tag: 'production infrastructure',
        body: 'Self-hosted agent stack: Hetzner CX22 + Cloudflare Tunnel + Docker bridge. n8n + Langfuse + Postgres. LiteLLM 5-way fallback routing, SMTP via Resend.',
        stack: 'Hetzner · CF Tunnel · Docker · LiteLLM',
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
      { label: 'ai.mamaev.coach', href: 'https://ai.mamaev.coach/en/' },
      { label: 'github', href: 'https://github.com/master5d' },
    ],
    langSuggest: {
      message: '🌐 Этот сайт также доступен на русском.',
      switchAction: 'Переключить на русский →',
      dismissAction: 'Остаться на английском',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
