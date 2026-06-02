import type { Metadata } from 'next'
import { Prologue } from '@/components/prologue/Prologue'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Точка Сборки. Пролог',
  description:
    'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
  alternates: {
    canonical: 'https://mamaev.coach/blog/prologue/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/prologue/',
      'en-US': 'https://mamaev.coach/en/blog/prologue/',
      'x-default': 'https://mamaev.coach/blog/prologue/',
    },
  },
  openGraph: {
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
    url: 'https://mamaev.coach/blog/prologue/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
  },
}

export default function ProloguePage() {
  return (
    <PostLayout post={getPost('prologue')!} locale="ru">
      <Prologue locale="ru" />
    </PostLayout>
  )
}
