// Pure route assembly for Wave F's "path choice with memory" (no DOM, no storage
// here — see components/quest/use-path-choice.ts for the localStorage side).
import type { Guide, QuestContent } from './content'
import type { ForkId } from './scenes'

/** Which road the reader marked at a given fork. */
export type PathMark = 'habit' | 'detour'

/** One mark per fork, keyed by fork id; forks the reader hasn't marked are absent. */
export type PathMarks = Partial<Record<ForkId, PathMark>>

export interface RouteStep {
  forkId: ForkId
  mark: PathMark
  guide: Guide
  /** Canon wording only — the fork's own habit/detour title, verbatim from content.ts. */
  title: string
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
    const block = mark === 'habit' ? fork.habit : fork.detour
    steps.push({ forkId: fork.id, mark, guide: block.guide, title: block.title })
  }
  return steps
}

/**
 * Renders a complete route as one line, built only from the two ingredients the
 * spec allows — each fork's own habit/detour title and the guides' names — joined
 * with the same middle-dot the footer already uses to join its own fragments.
 * Nothing here is composed prose; it's a canon-only list.
 */
export function routeText(steps: RouteStep[], labels: QuestContent['labels']): string {
  return steps
    .map((s) => `${s.title} (${s.guide === 'scroller' ? labels.scroller : labels.builder})`)
    .join(' · ')
}
