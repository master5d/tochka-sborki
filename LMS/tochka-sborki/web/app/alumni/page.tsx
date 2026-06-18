import type { Metadata } from 'next'
import { AlumniClient } from '@/components/alumni-client'

export const metadata: Metadata = {
  title: 'Выпускники — Точка Сборки',
  description: 'Opt-in справочник соучеников по сферам.',
  robots: { index: false, follow: false },
}

export default function Page() {
  return <AlumniClient locale="ru" />
}
