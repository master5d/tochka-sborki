// Служба заботы mamaev.coach (волна 18, 2026-09-28): /care/ (+ /en/care/).
// Одно окно помощи для трёх сайтов (Точка Сборки, академия, mamaev.coach) — приёмник один:
// POST /api/care воркера lms-engine (mamaev.coach/api/* маршрутизирован на него).
// Канон тем, срока ответа и лимитов — lms-engine LMS/care.json; сюда он приходит через
// GET /api/care на клиенте. FALLBACK ниже — только на случай недоступного воркера при
// загрузке страницы; при смене канона обнови и его (repo другой, импорт невозможен).
export type Locale = 'ru' | 'en'

interface Bi { ru: string; en: string }
export interface CareConfig {
  responseTime: Bi
  topics: ({ key: string } & Bi)[]
  limits: { messageMin: number; messageMax: number; pageUrlMax: number }
}

export const CARE_FALLBACK: CareConfig = {
  responseTime: { ru: 'в течение 2 рабочих дней', en: 'within 2 business days' },
  topics: [
    { key: 'access', ru: 'Вход и доступ', en: 'Sign-in and access' },
    { key: 'stuck', ru: 'Застрял в уроке', en: 'Stuck in a lesson' },
    { key: 'content', ru: 'Вопрос по содержанию', en: 'Question about the content' },
    { key: 'tech', ru: 'Техническая проблема', en: 'Technical problem' },
    { key: 'idea', ru: 'Предложение', en: 'Suggestion' },
    { key: 'other', ru: 'Другое', en: 'Other' },
  ],
  limits: { messageMin: 5, messageMax: 4000, pageUrlMax: 500 },
}

/** Ответ GET /api/care → конфиг; кривой/неполный ответ → null (страница остаётся на FALLBACK). */
export function parseCareConfig(raw: unknown): CareConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<CareConfig>
  const bi = (v: unknown): v is Bi => !!v && typeof (v as Bi).ru === 'string' && typeof (v as Bi).en === 'string'
  if (!bi(r.responseTime) || !Array.isArray(r.topics) || r.topics.length === 0) return null
  if (!r.topics.every((t) => t && typeof t.key === 'string' && bi(t))) return null
  const l = r.limits
  if (!l || typeof l.messageMin !== 'number' || typeof l.messageMax !== 'number' || typeof l.pageUrlMax !== 'number') return null
  return { responseTime: r.responseTime, topics: r.topics, limits: l }
}

export async function loadCareConfig(fetchImpl: typeof fetch): Promise<CareConfig | null> {
  try {
    const res = await fetchImpl('/api/care')
    if (!res.ok) return null
    return parseCareConfig(await res.json())
  } catch {
    return null
  }
}

export interface CareCopy {
  eyebrow: string
  title: string
  lead: string
  promises: (when: string) => string[]
  topicLabel: string
  topicPlaceholder: string
  messageLabel: string
  messageHint: string
  emailLabel: string
  emailHint: string
  pageUrlLabel: string
  pageUrlHint: string
  submit: string
  submitting: string
  success: (when: string) => string
  error: string
  rateLimited: string
  requiredError: string
  relatedLabel: string
  related: { label: string; href: string; note: string }[]
  footerLink: string
}

export function careCopy(locale: Locale): CareCopy {
  if (locale === 'en') {
    return {
      eyebrow: 'Care desk',
      title: 'Care desk',
      lead: 'One window for help across my projects — the Tochka Sborki course, the academy and this site.',
      promises: (when) => [
        'Sign-in and access, a lesson you’re stuck in, a question about the content, a technical problem, a suggestion.',
        `A person answers by email ${when}.`,
        'Your email is used only to reply to this message.',
      ],
      topicLabel: 'Topic',
      topicPlaceholder: 'Choose a topic',
      messageLabel: 'What happened',
      messageHint: 'What you did, what you expected, what you saw instead.',
      emailLabel: 'Email for the reply',
      emailHint: 'We reply to this address.',
      pageUrlLabel: 'Link to the page where it happened (optional)',
      pageUrlHint: 'Copy it from the address bar.',
      submit: 'Send',
      submitting: 'Sending…',
      success: (when) => `Got it. We sent a confirmation to your email and will reply ${when}.`,
      error: 'Couldn’t send. Check your connection and try again.',
      rateLimited: 'Too many messages in a short time. Please try again in an hour.',
      requiredError: 'Choose a topic and describe what happened.',
      relatedLabel: 'Also',
      related: [
        { label: 'Module feedback', href: 'https://ai.synergify.com/en/feedback/', note: 'a review of a course module' },
        { label: 'Open Q&A (AMA)', href: 'https://ai.synergify.com/en/ama/', note: 'a live group session for questions' },
      ],
      footerLink: 'Care desk',
    }
  }
  return {
    eyebrow: 'Служба заботы',
    title: 'Служба заботы',
    lead: 'Одно окно помощи по моим проектам — курс «Точка Сборки», академия и этот сайт.',
    promises: (when) => [
      'Вход и доступ, застрявший урок, вопрос по содержанию, техническая проблема, предложение.',
      `Отвечает живой человек, на почту, ${when}.`,
      'Email нужен только для ответа на это обращение.',
    ],
    topicLabel: 'Тема',
    topicPlaceholder: 'Выбери тему',
    messageLabel: 'Что случилось',
    messageHint: 'Что делал, чего ждал, что увидел вместо этого.',
    emailLabel: 'Email для ответа',
    emailHint: 'Ответим на этот адрес.',
    pageUrlLabel: 'Ссылка на страницу, где это случилось (необязательно)',
    pageUrlHint: 'Скопируй из адресной строки.',
    submit: 'Отправить',
    submitting: 'Отправляем…',
    success: (when) => `Получили. Подтверждение ушло на почту, ответим ${when}.`,
    error: 'Не получилось отправить. Проверь соединение и попробуй ещё раз.',
    rateLimited: 'Слишком много обращений подряд. Попробуй через час.',
    requiredError: 'Выбери тему и опиши, что случилось.',
    relatedLabel: 'Ещё',
    related: [
      { label: 'Отзыв о модуле', href: 'https://ai.synergify.com/feedback/', note: 'оценка модуля курса' },
      { label: 'Открытый разбор (AMA)', href: 'https://ai.synergify.com/ama/', note: 'живая групповая встреча для вопросов' },
    ],
    footerLink: 'Служба заботы',
  }
}

export interface CareFields { topic: string; message: string; email: string; pageUrl: string; company: string }

export function validateCareFields(f: CareFields, cfg: CareConfig): (keyof CareFields)[] {
  const bad: (keyof CareFields)[] = []
  if (!cfg.topics.some((t) => t.key === f.topic)) bad.push('topic')
  const m = f.message.trim()
  if (m.length < cfg.limits.messageMin || m.length > cfg.limits.messageMax) bad.push('message')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) bad.push('email')
  return bad
}

export type CareSubmitResult = 'ok' | 'rate-limited' | 'error'

export async function submitCare(fetchImpl: typeof fetch, f: CareFields, locale: Locale): Promise<CareSubmitResult> {
  try {
    const res = await fetchImpl('/api/care', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site: 'mamaev-coach', locale,
        topic: f.topic, message: f.message.trim(), email: f.email.trim(), pageUrl: f.pageUrl.trim(), company: f.company,
      }),
    })
    if (res.ok) return 'ok'
    return res.status === 429 ? 'rate-limited' : 'error'
  } catch {
    return 'error'
  }
}
