// Site covers registry (spec 2026-09-11-site-covers-floor-ab). DATA ONLY — the
// Pages Function imports this file, so no React/Next imports may appear here.
// The floor is the base system theme; a trend cover is the owner's authored
// synthesis inspired by a DesOps trend (`trend` = provenance id, not a clone).

export type CoverLocale = 'ru' | 'en'

export interface Cover {
  id: string
  kind: 'floor' | 'trend'
  trend?: string
}

export const FLOOR = 'floor'

export const COVERS: readonly Cover[] = [
  { id: FLOOR, kind: 'floor' },
  { id: 'trend-adweek-2026-09', kind: 'trend', trend: 'trend-adweek-2026-09' },
]

export const COVER_IDS: readonly string[] = COVERS.map((c) => c.id)

export const trendCovers = (): Cover[] => COVERS.filter((c) => c.kind === 'trend')

export const isKnownCover = (id: unknown): id is string => typeof id === 'string' && COVER_IDS.includes(id)

// Hidden, unlinked, noindex home of a cover. Not `/_cover/`: Next App Router treats
// `_folder` as private and never routes it.
export function coverPath(id: string, locale: CoverLocale): string {
  return `${locale === 'en' ? '/en' : ''}/cover/${id}/`
}
