import type { Locale } from '../lib/dictionaries'
import { QuestHome } from './quest/quest-home'

// Home page of a trend cover, keyed by the cover id from lib/covers.ts.
export function CoverHome({ id, locale }: { id: string; locale: Locale }) {
  switch (id) {
    case 'trend-adweek-2026-09':
      return <QuestHome locale={locale} />
    default:
      throw new Error(`cover-home: no home page for cover "${id}"`)
  }
}
