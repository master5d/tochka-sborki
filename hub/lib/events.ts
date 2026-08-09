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
  'ai-for-healers': {
    ru: {
      slug: 'ai-for-healers',
      format: 'Воркшоп',
      eyebrow: 'Бесплатный интро-воркшоп',
      title: 'AI для практикующих: первый честный шаг',
      summary:
        'Два часа руками: что AI уже умеет делать для частной практики — заметки, подготовка к сессиям, рутина — и где его границы. Без хайпа и без кода.',
      locationLabel: 'The Healing Society · East Nashville',
      whenLabel:
        'Дату объявим после согласования с площадкой — оставь контакт, напишем первым',
      facilitator: 'Александр Мамаев',
      whatToExpect: [
        'Живая демонстрация на реальных задачах практики: заметки, подготовка, переписка.',
        'Разбор трёх поз работы с AI — от чужих инструментов к суверенной практике.',
        'Маленькая группа, можно с ноутбуком: попробуешь сам, а не посмотришь со стороны.',
        'Честный разговор о границах: что AI не должен делать в помогающей практике.',
      ],
      capture: {
        event: 'ai-for-healers',
        heading: 'Интерес к воркшопу «AI для практикующих»',
        blurb:
          'Оставь контакты — напишем, когда объявим дату. Без спама и давления; отписка в один клик.',
        cities: ['Nashville'],
        phoneJustification:
          'Телефон по желанию — для локального события удобен личный контакт. Можно оставить только email.',
        consentLabel:
          'Согласен(на) на обработку контактов, чтобы получать информацию об этом событии.',
        cta: 'Оставить заявку',
        successMessage: '✓ Спасибо! Напишем, как только появится дата.',
      },
    },
    en: {
      slug: 'ai-for-healers',
      format: 'Workshop',
      eyebrow: 'Free intro workshop',
      title: 'AI for practitioners: an honest first step',
      summary:
        'Two hands-on hours: what AI can already do for a private practice — notes, session prep, admin — and where its limits are. No hype, no code.',
      locationLabel: 'The Healing Society · East Nashville',
      whenLabel:
        'Date announced once confirmed with the venue — leave your contact and hear first',
      facilitator: 'Alexander Mamaev',
      whatToExpect: [
        'A live walkthrough on real practice tasks: notes, session prep, correspondence.',
        'The three postures of working with AI — from borrowed tools to a sovereign practice.',
        'A small group, laptops welcome: you try it yourself instead of watching.',
        'An honest conversation about limits: what AI should not do in a helping practice.',
      ],
      capture: {
        event: 'ai-for-healers',
        heading: 'Interest in the "AI for practitioners" workshop',
        blurb:
          'Leave your details — we will write when the date is set. No spam, no pressure. Unsubscribe anytime in one click.',
        cities: ['Nashville'],
        phoneJustification:
          'Phone is optional — for a local event personal contact is handy. Email only is fine.',
        consentLabel:
          'I consent to my contact details being processed to receive information about this event.',
        cta: 'Register interest',
        successMessage: '✓ Thank you! We will write as soon as the date is set.',
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
