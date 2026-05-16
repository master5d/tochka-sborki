import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Unbounded } from 'next/font/google'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Александр Мамаев — AI builder, vibe coder, coach',
  description: 'Курсы по vibe-кодингу и услуги агентского инжиниринга для бизнеса',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme="model-kit"
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
