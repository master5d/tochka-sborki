export type BotLocale = 'ru' | 'en'

export interface BotCopy {
  greeting: string
  openCourse: string
  continueIntro: string
  continueLabel: string
  openFirst: string
  finished: string
  hint: string
}

const RU: BotCopy = {
  greeting: 'Привет! Это Точка Сборки — курс по agentic AI в потоке.\nНажми кнопку, чтобы открыть курс прямо здесь, в Telegram.',
  openCourse: '▶️ Открыть курс',
  continueIntro: 'Продолжаем с того места, где ты остановился.',
  continueLabel: '▶️ Продолжить',
  openFirst: 'Сначала открой курс — так я свяжу твой прогресс.',
  finished: '🎉 Ты прошёл все модули. Красавчик. Возвращайся за повторением в любой момент.',
  hint: 'Я подскажу, что дальше. Жми кнопку ниже.',
}

const EN: BotCopy = {
  greeting: 'Hi! This is Tochka Sborki — a course on agentic AI, in flow.\nTap the button to open the course right here in Telegram.',
  openCourse: '▶️ Open course',
  continueIntro: 'Picking up right where you left off.',
  continueLabel: '▶️ Continue',
  openFirst: 'Open the course first — that links your progress.',
  finished: '🎉 You finished every module. Nicely done. Come back for a refresher anytime.',
  hint: "I'll point you to what's next. Tap the button below.",
}

export function botCopy(locale: BotLocale): BotCopy {
  return locale === 'en' ? EN : RU
}

// Map a Telegram language_code or stored users.language to a bot locale (RU default).
export function pickLocale(code: string | null | undefined): BotLocale {
  return (code ?? '').toLowerCase().startsWith('en') ? 'en' : 'ru'
}
