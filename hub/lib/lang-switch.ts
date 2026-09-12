// Target of the header EN/RU switch. Infers the locale from the path (the shared
// header has no locale prop) and links to the mirrored route, trailingSlash-safe.
//
// `document: true` means a plain <a>, not a Next <Link>: the home page is chosen by
// the backend cover function (functions/_middleware.ts), and a client-side Link
// would fetch the floor's RSC files around it. A full load also skips the Link
// prefetch that would otherwise be spent on every view of a cover.
const COVER_PATH = /^(\/en)?\/cover\/[^/]+\/?$/

export interface LangSwitchTarget {
  href: string
  label: 'EN' | 'RU'
  isEn: boolean
  document: boolean
}

export function langSwitchTarget(pathname: string): LangSwitchTarget {
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const label = isEn ? 'RU' : 'EN'
  if (COVER_PATH.test(pathname)) return { href: isEn ? '/' : '/en/', label, isEn, document: true }
  const href = isEn
    ? pathname.replace(/^\/en(\/|$)/, '/') || '/'
    : pathname === '/'
      ? '/en/'
      : '/en' + pathname
  return { href, label, isEn, document: href === '/' || href === '/en/' }
}