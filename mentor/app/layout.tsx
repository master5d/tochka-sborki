import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Unbounded } from 'next/font/google'
import { LangSuggestBanner } from '../components/lang-suggest-banner'
import { ThemeProvider } from '../components/theme-provider'
import { SiteHeader } from '../components/site-header'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

// Keep the 'theme-pref' key + 'system' default in sync with lib/theme-pref.ts.
// Runs before paint so the resolved theme applies with no flash (FOUC).
const themeScript = `(function(){try{` +
  `var p=localStorage.getItem('theme-pref');` +
  `var sys=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
  `document.documentElement.setAttribute('data-theme',(p==='light'||p==='dark')?p:sys);` +
  `}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export const metadata: Metadata = {
  title: 'Agent Engineering для бизнеса — Mamaev',
  description: 'Дизайн и реализация production agent-систем: оркестрация, observability, reliability. Claude Code + n8n + Langfuse.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LangSuggestBanner />
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
