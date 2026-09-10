// Pure route assembly for Wave F's "path choice with memory" (no DOM, no storage
// here — see components/quest/use-path-choice.ts for the localStorage side).
import type { QuestContent } from './content'
import type { ForkId } from './scenes'

/** Which road the reader marked at a given fork. */
export type PathMark = 'habit' | 'detour'

/** One mark per fork, keyed by fork id; forks the reader hasn't marked are absent. */
export type PathMarks = Partial<Record<ForkId, PathMark>>

export interface RouteStep {
  forkId: ForkId
  mark: PathMark
  /** Canon wording only — `fork.obstacle` with the "Obstacle N. " / "Препятствие
   *  N. " prefix stripped programmatically (see `obstacleNoun`), so it names
   *  what THIS fork was about instead of repeating the same road title three
   *  times (fork titles are identical strings across all three forks). */
  obstacleNoun: string
  /** Canon wording only — labels.habit or labels.detour, matching `mark`. */
  roadLabel: string
}

/**
 * Strips the fork's own "<word> <number>. " lead-in from `fork.obstacle`,
 * leaving only the noun the canon gave that fork — e.g. "Obstacle 1. The
 * boulder" → "The boulder", "Препятствие 2. Учитель" → "Учитель". Generic
 * across both locales (matches "leading non-digits, then digits, then a dot"
 * rather than a hardcoded word list, so it never needs updating if the canon's
 * own lead-in wording changes), and leaves the noun's own case exactly as the
 * canon wrote it. Falls back to the trimmed original if the pattern doesn't
 * match (so a future obstacle string without a "N." lead-in still renders
 * something instead of nothing).
 */
export function obstacleNoun(obstacle: string): string {
  const match = obstacle.match(/^\D+\d+\.\s*(.+)$/)
  return (match ? match[1] : obstacle).trim()
}

/**
 * Assembles the reader's route from three marks. Returns `null` unless ALL THREE
 * forks are marked: a route built from one or two legs would need connective
 * words nobody wrote (a half-built sentence), so an incomplete set gets the same
 * "no route" treatment as an empty one, matching how the finale reads today.
 */
export function buildRoute(marks: PathMarks, content: QuestContent): RouteStep[] | null {
  const steps: RouteStep[] = []
  for (const fork of content.forks) {
    const mark = marks[fork.id]
    if (!mark) return null
    const roadLabel = mark === 'habit' ? content.labels.habit : content.labels.detour
    steps.push({ forkId: fork.id, mark, obstacleNoun: obstacleNoun(fork.obstacle), roadLabel })
  }
  return steps
}

/**
 * Renders a complete route as one line: each fork's own obstacle noun plus the
 * road taken there, joined with the same middle-dot the footer already uses to
 * join its own fragments. Nothing here is composed prose — every word is canon,
 * and the three entries differ from each other because the obstacle nouns do
 * (unlike the road titles, which repeat across forks).
 */
export function routeText(steps: RouteStep[]): string {
  return steps.map((s) => `${s.obstacleNoun} — ${s.roadLabel}`).join(' · ')
}
