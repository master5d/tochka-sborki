import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Unbounded } from 'next/font/google'
import { ProgressProvider } from '@/components/progress-provider'
import { LangSuggestBanner } from '@/components/lang-suggest-banner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

// Keep the 'theme-pref' key + 'system' default in sync with lib/theme-pref.ts.
// This runs before paint so the resolved theme is applied with no flash (FOUC).
const themeScript = `(function(){try{` +
  `var p=localStorage.getItem('theme-pref');` +
  `var sys=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
  // Only an explicit light/dark wins; 'system' and any junk value fall back to sys.
  `document.documentElement.setAttribute('data-theme',(p==='light'||p==='dark')?p:sys);` +
  `}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию. Presented by Mamaev Institute for AI.',
  publisher: 'Mamaev Institute for AI',
  authors: [{ name: 'Alexander Mamaev' }],
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
          <ProgressProvider>
            <LangSuggestBanner />
            {children}
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
