/**
 * Cover motion: the hero title arrives word by word over the world. Pure data
 * for the component — the words in reading order and the delay each one waits
 * before it rises. Whitespace between words is kept by the renderer, not here.
 */
export interface TitleWord {
  word: string
  delayMs: number
}

export const TITLE_BASE_MS = 120
export const TITLE_STEP_MS = 90
/** The last word never waits longer than this, however long the line is. */
export const TITLE_MAX_DELAY_MS = 900

export function splitTitle(text: string): TitleWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const step = words.length > 1
    ? Math.min(TITLE_STEP_MS, (TITLE_MAX_DELAY_MS - TITLE_BASE_MS) / (words.length - 1))
    : 0
  return words.map((word, i) => ({ word, delayMs: Math.round(TITLE_BASE_MS + i * step) }))
}
