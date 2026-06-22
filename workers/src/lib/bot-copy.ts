export type BotLocale = 'ru' | 'en'

export interface BotCopy {
  greeting: string
  openCourse: string
  continueIntro: string
  continueLabel: string
  openFirst: string
  finished: string
  hint: string
  nudgeIntro: string
  nudgeLabel: string
  stopAck: string
  startResub: string
}

const RU: BotCopy = {
  greeting: 'Привет! Это Точка Сборки — курс по agentic AI в потоке.\nНажми кнопку, чтобы открыть курс прямо здесь, в Telegram.',
  openCourse: '▶️ Открыть курс',
  continueIntro: 'Продолжаем с того места, где ты остановился.',
  continueLabel: '▶️ Продолжить',
  openFirst: 'Сначала открой курс — так я свяжу твой прогресс.',
  finished: '🎉 Ты прошёл все модули. Красавчик. Возвращайся за повторением в любой момент.',
  hint: 'Я подскажу, что дальше. Жми кнопку ниже.',
  nudgeIntro: 'Привет! Не теряем темп — у тебя есть незаконченный модуль. Продолжим?',
  nudgeLabel: '▶️ Продолжить',
  stopAck: 'Окей, больше не буду напоминать. Захочешь снова — отправь /start.',
  startResub: 'Снова на связи — буду мягко напоминать продолжить. Выключить в любой момент: /stop.',
}

const EN: BotCopy = {
  greeting: 'Hi! This is Tochka Sborki — a course on agentic AI, in flow.\nTap the button to open the course right here in Telegram.',
  openCourse: '▶️ Open course',
  continueIntro: 'Picking up right where you left off.',
  continueLabel: '▶️ Continue',
  openFirst: 'Open the course first — that links your progress.',
  finished: '🎉 You finished every module. Nicely done. Come back for a refresher anytime.',
  hint: "I'll point you to what's next. Tap the button below.",
  nudgeIntro: "Hey! Let's keep the momentum — you've got an unfinished module. Continue?",
  nudgeLabel: '▶️ Continue',
  stopAck: "Got it — I won't remind you anymore. Want them back? Send /start.",
  startResub: "Back on — I'll gently remind you to continue. Turn off anytime: /stop.",
}

export function botCopy(locale: BotLocale): BotCopy {
  return locale === 'en' ? EN : RU
}

// Map a Telegram language_code or stored users.language to a bot locale (RU default).
export function pickLocale(code: string | null | undefined): BotLocale {
  return (code ?? '').toLowerCase().startsWith('en') ? 'en' : 'ru'
}
