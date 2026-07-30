import type { Locale } from './registry'

export type { Locale }

export interface AcademyDictionary {
  academy: {
    eyebrow: string
    wordmark: string
    fullName: string
    positioning: string[]
    gate: string
    gateCta: string
    coursesLabel: string
    comingSoon: string
    metaTitle: string
    metaDescription: string
  }
}

export const dictionaries: Record<Locale, AcademyDictionary> = {
  ru: {
    academy: {
      eyebrow: 'академия',
      wordmark: 'S.A.S.H.A',
      fullName: 'Synergema Authentica Starseed Holon Academy',
      positioning: [
        'S.A.S.H.A — учебная семья курсов, где древняя мудрость встречается с современной наукой и AI-инструментами. Каждый курс — самостоятельный мир; вход в них общий.',
        'Первый курс академии — «Точка Сборки», курс по vibe-кодингу. Семья будет расти — без спешки и без обещаний, которых мы не можем сдержать.',
      ],
      gate: 'Вход в академию открывается после прохождения «Точки Сборки».',
      gateCta: 'Пройти Точку Сборки →',
      coursesLabel: 'Курсы',
      comingSoon: 'скоро',
      metaTitle: 'S.A.S.H.A — академия курсов',
      metaDescription: 'Учебная семья курсов: древняя мудрость × современная наука и AI-инструменты. Первый курс — «Точка Сборки».',
    },
  },
  en: {
    academy: {
      eyebrow: 'academy',
      wordmark: 'S.A.S.H.A',
      fullName: 'Synergema Authentica Starseed Holon Academy',
      positioning: [
        'S.A.S.H.A is a learning family of courses where ancient wisdom meets modern science and AI tools. Each course is a world of its own; the door in is shared.',
        "The academy's first course is Tochka Sborki, a course on vibe coding. The family will grow — without rush and without promises we can't keep.",
      ],
      gate: 'Admission opens after completing Tochka Sborki.',
      gateCta: 'Take Tochka Sborki →',
      coursesLabel: 'Courses',
      comingSoon: 'coming soon',
      metaTitle: 'S.A.S.H.A — course academy',
      metaDescription: 'A learning family of courses: ancient wisdom × modern science and AI tools. First course — Tochka Sborki.',
    },
  },
}

export function getDictionary(locale: Locale): AcademyDictionary {
  return dictionaries[locale]
}
