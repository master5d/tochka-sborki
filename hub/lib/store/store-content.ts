import type { Locale } from '@/lib/dictionaries'

export interface StoreContent {
  eyebrow: string
  title: string
  lead: string
  priceFmt: (cents: number) => string
  buyLabel: string
  emptyMsg: string
  errorMsg: string
  footnote: string
  thanksTitle: string
  thanksBody: string
}

export function buildStoreContent(locale: Locale): StoreContent {
  const priceFmt = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
  if (locale === 'en') {
    return {
      eyebrow: 'Store',
      title: 'Digital goods',
      lead: 'Practical kits and templates. The course itself stays free — these are optional extras.',
      priceFmt,
      buyLabel: 'Buy →',
      emptyMsg: 'Nothing here yet — new items are on the way.',
      errorMsg: 'Temporarily unavailable — please try again.',
      footnote: 'These are digital goods sold by the creator (a sole proprietor), not a nonprofit.',
      thanksTitle: 'Thank you 🙏',
      thanksBody: 'A download link is on its way to your email. Check your inbox (and spam, just in case).',
    }
  }
  return {
    eyebrow: 'Магазин',
    title: 'Цифровые товары',
    lead: 'Практичные наборы и шаблоны. Сам курс остаётся бесплатным — это опциональные дополнения.',
    priceFmt,
    buyLabel: 'Купить →',
    emptyMsg: 'Пока пусто — новые материалы уже в пути.',
    errorMsg: 'Временно недоступно — попробуй ещё раз.',
    footnote: 'Это цифровые товары от автора (ИП), не нонпрофит.',
    thanksTitle: 'Спасибо 🙏',
    thanksBody: 'Ссылка на скачивание уже летит тебе на почту. Загляни во входящие (и в спам на всякий случай).',
  }
}
