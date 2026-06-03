// SHARED CHROME — mirror of hub/app/layout.tsx. Keep in sync; see docs/superpowers/specs/2026-06-02-blog-split-design.md
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
  title: 'Александр Мамаев — AI builder, vibe coder, coach',
  description: 'Курсы по vibe-кодингу и услуги агентского инжиниринга для бизнеса',
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
