import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { defaultTheme } from '@/lib/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={defaultTheme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
