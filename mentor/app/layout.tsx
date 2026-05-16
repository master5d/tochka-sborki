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
  title: 'Agent Engineering для бизнеса — Mamaev',
  description: 'Дизайн и реализация production agent-систем: оркестрация, observability, reliability. Claude Code + n8n + Langfuse.',
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
