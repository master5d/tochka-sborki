import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { PT_Serif, Unbounded } from 'next/font/google'
import { LangSuggestBanner } from '../components/lang-suggest-banner'
import { ThemeProvider, MaterialThemeProvider } from '@desops/ui-kit'
import { SiteHeader } from '../components/site-header'
import './globals.css'

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['900'],
  variable: '--font-display',
  display: 'swap',
})

// Wave H (H3): an editorial serif for the quest's narrative body text only —
// PT Serif (Paratype) is a NATIVE Cyrillic type family (not a Latin face with a
// bolted-on Cyrillic subset), reads well at a narrow measure, and next/font
// self-hosts it at build time (no runtime request to fonts.googleapis.com, so
// it works even stricter-than-Google-fonts CSPs). `subsets` controls which
// glyphs actually ship; both are requested since the quest page is bilingual.
const ptSerif = PT_Serif({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-serif',
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
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable} ${ptSerif.variable}`}
    >
      <body className="bg-background text-on-background min-h-screen">
        {/* attribute ОБЯЗАН быть data-theme: токены в themes/model-kit.css живут в
            [data-theme="dark"]/[data-theme="light"]. С attribute="class" провайдер
            ставил class="dark", селекторы не совпадали, переменные не применялись —
            и лендинг рендерился чёрным по чёрному. */}
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MaterialThemeProvider sourceColor="#00D1FF">
            <LangSuggestBanner />
            <SiteHeader />
            {children}
          </MaterialThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
