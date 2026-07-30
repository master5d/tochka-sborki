import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S.A.S.H.A — Academy',
  description: 'Учебная семья курсов: древняя мудрость × современная наука и AI-инструменты. Первый курс — «Точка Сборки».',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
