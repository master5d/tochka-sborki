import type { Locale } from '@/lib/dictionaries'

export interface CaptureFormConfig {
  /** Lead tag stored on the row; matches the LMS-web capture id so both surfaces share the taxonomy. */
  event: string
  heading: string
  blurb: string
  /** City <select> options. Empty array → free-text city input. */
  cities: string[]
  /** Transparent reason the optional phone field is asked (shown beneath it). */
  phoneJustification: string
  consentLabel: string
  cta: string
  successMessage: string
}

export interface EventConfig {
  slug: string
  /** A label, e.g. "Ретрит" — never a countdown. */
  format: string
  eyebrow: string
  title: string
  summary: string
  /** Prose location, e.g. "Нашвилл · Остин · онлайн". */
  locationLabel: string
  /** Prose timing, e.g. "Осень 2026, даты уточняются" — NOT a deadline. */
  whenLabel: string
  facilitator: string
  /** Prose bullets — what the event offers. */
  whatToExpect: string[]
  capture: CaptureFormConfig
}

const EVENTS: Record<string, Record<Locale, EventConfig>> = {
  'retreat-inner-evolution': {
    ru: {
      slug: 'retreat-inner-evolution',
      format: 'Ретрит',
      eyebrow: 'Оффлайн-ретрит',
      title: 'Внутренняя эволюция',
      summary:
        'Несколько дней вдали от шума — чтобы собрать себя и свою практику с ИИ заново, в кругу тех, кто идёт тем же путём.',
      locationLabel: 'Нашвилл · Остин · Сан-Франциско · онлайн-формат',
      whenLabel: 'Осень 2026, даты уточняются',
      facilitator: 'Александр Мамаев',
      whatToExpect: [
        'Тихое пространство и время подумать — без спешки и инфошума.',
        'Практика с ИИ-инструментами руками, а не в теории.',
        'Маленькая группа единомышленников: живой разговор и обратная связь.',
        'Личный план: с чем ты приходишь и с чем уезжаешь.',
      ],
      capture: {
        event: 'retreat-inner-evolution',
        heading: 'Интерес к ретриту «Внутренняя эволюция»',
        blurb:
          'Оставь контакты — расскажем о ближайших датах и городах, без спама и давления. Отпишешься в один клик в любой момент.',
        cities: ['Нашвилл', 'Остин', 'Сан-Франциско', 'Онлайн'],
        phoneJustification:
          'Телефон по желанию — для ретритов и когорт нужен личный контакт, не только письмо. Можно оставить только email.',
        consentLabel:
          'Согласен(на) на обработку контактов, чтобы получать информацию об этом событии.',
        cta: 'Оставить заявку',
        successMessage: '✓ Спасибо! Мы на связи — напишем о датах и деталях.',
      },
    },
    en: {
      slug: 'retreat-inner-evolution',
      format: 'Retreat',
      eyebrow: 'Offline retreat',
      title: 'Inner Evolution',
      summary:
        'A few days away from the noise — to reassemble yourself and your AI practice, among people walking the same path.',
      locationLabel: 'Nashville · Austin · San Francisco · online format',
      whenLabel: 'Fall 2026, dates TBA',
      facilitator: 'Alexander Mamaev',
      whatToExpect: [
        'Quiet space and time to think — no rush, no information noise.',
        'Hands-on practice with AI tools, not theory.',
        'A small group of peers: real conversation and feedback.',
        'A personal plan: what you arrive with and what you leave with.',
      ],
      capture: {
        event: 'retreat-inner-evolution',
        heading: 'Interest in the "Inner Evolution" retreat',
        blurb:
          'Leave your details — we will share upcoming dates and cities. No spam, no pressure. Unsubscribe anytime in one click.',
        cities: ['Nashville', 'Austin', 'San Francisco', 'Online'],
        phoneJustification:
          'Phone is optional — retreats and cohorts need personal contact, not just email. You can leave email only.',
        consentLabel:
          'I consent to my contact details being processed to receive information about this event.',
        cta: 'Register interest',
        successMessage: '✓ Thank you! We will be in touch with dates and details.',
      },
    },
  },
}

export { EVENTS }

export function getEvent(slug: string, locale: Locale): EventConfig | null {
  return EVENTS[slug]?.[locale] ?? null
}

export function listEvents(locale: Locale): EventConfig[] {
  return Object.keys(EVENTS).map((slug) => EVENTS[slug][locale])
}
