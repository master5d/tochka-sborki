import type { Metadata } from 'next'
import { Prologue } from '@/components/prologue/Prologue'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Точка Сборки. Пролог',
  description:
    'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
  openGraph: {
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
    url: 'https://mamaev.coach/prologue',
    images: ['/prologue/og.svg'],
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
    images: ['/prologue/og.svg'],
  },
}

export default function ProloguePage() {
  return <Prologue locale="ru" />
}
