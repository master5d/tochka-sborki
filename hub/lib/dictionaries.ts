export type Locale = 'ru' | 'en'

export interface Dictionary {
  langSuggest: {
    message: string
    switchAction: string
    dismissAction: string
  }
  langSwitch: {
    toEn: string
    toRu: string
  }
  notFound: {
    code: string
    label: string
    heading: string
    body: string
    ctaHome: string
  }
  blog: {
    indexHeading: string
    backToSite: string
    empty: string
    readCta: string
    backToBlog: string
    relatedLabel: string
    footerThinkAloud: string
    footerPractice: string
    courseUrl: string
  }
  capture: {
    nameLabel: string
    emailLabel: string
    phoneLabel: string
    cityLabel: string
    cityPlaceholder: string
    messageLabel: string
    submitting: string
    errorMessage: string
  }
}

export const dictionaries: Record<Locale, Dictionary> = {
  ru: {
    langSuggest: {
      message: '🌐 This site is also available in English.',
      switchAction: 'Switch to English →',
      dismissAction: 'Stay in Russian',
    },
    langSwitch: {
      toEn: 'EN',
      toRu: 'RU',
    },
    notFound: {
      code: '404',
      label: '⬡ Тупик',
      heading: 'Здесь\nпусто',
      body: 'Этой страницы нет. Зато есть всё остальное — проекты, курс, контакты.',
      ctaHome: 'На главную →',
    },
    blog: {
      indexHeading: 'Блог',
      backToSite: '← mamaev.coach',
      empty: 'Пока нет публикаций.',
      readCta: 'Читать',
      backToBlog: '← Блог',
      relatedLabel: 'По теме',
      footerThinkAloud: 'Думаю вслух в Telegram —',
      footerPractice: '. Практика — в открытом бесплатном курсе',
      courseUrl: 'https://ai.synergify.com',
    },
    capture: {
      nameLabel: 'Имя',
      emailLabel: 'Email',
      phoneLabel: 'Телефон / WhatsApp (по желанию)',
      cityLabel: 'Город',
      cityPlaceholder: 'Выбери город...',
      messageLabel: 'Вопрос или комментарий (по желанию)',
      submitting: 'Отправляем...',
      errorMessage: 'Что-то пошло не так, попробуй снова.',
    },
  },
  en: {
    langSuggest: {
      message: '🌐 Этот сайт также доступен на русском.',
      switchAction: 'Переключить на русский →',
      dismissAction: 'Остаться на английском',
    },
    langSwitch: {
      toEn: 'EN',
      toRu: 'RU',
    },
    notFound: {
      code: '404',
      label: '⬡ Dead end',
      heading: 'Nothing\nhere',
      body: 'This page does not exist. But everything else does — projects, the course, contacts.',
      ctaHome: 'Home →',
    },
    blog: {
      indexHeading: 'Blog',
      backToSite: '← mamaev.coach',
      empty: 'No posts yet.',
      readCta: 'Read',
      backToBlog: '← Blog',
      relatedLabel: 'Related',
      footerThinkAloud: 'Thinking out loud on Telegram —',
      footerPractice: '. Practice lives in the free open course',
      courseUrl: 'https://ai.synergify.com/en/',
    },
    capture: {
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone / WhatsApp (optional)',
      cityLabel: 'City',
      cityPlaceholder: 'Choose a city...',
      messageLabel: 'Question or comment (optional)',
      submitting: 'Sending...',
      errorMessage: 'Something went wrong, please try again.',
    },
  },
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
