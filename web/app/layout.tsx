import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Unbounded } from 'next/font/google'
import { defaultTheme } from '@/lib/themes'
import { ProgressProvider } from '@/components/progress-provider'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={defaultTheme}
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable}`}
    >
      <body>
        <ProgressProvider>
          {children}
        </ProgressProvider>
      </body>
    </html>
  )
}
