import type { Fork, QuestContent } from '../../lib/quest/content'
import type { PathMark } from '../../lib/quest/route'
import { GuideChip } from './guide-chip'
import { PathChoice } from './path-choice'

interface Props {
  fork: Fork
  /** Which of the fork's two roads this card tells. */
  which: PathMark
  labels: QuestContent['labels']
  /** The reader's mark for THIS fork, if any (Wave F, from localStorage). */
  mark?: PathMark
  onMark: (mark: PathMark) => void
}

/**
 * One road of a fork as a card: the habit road (Scroller) or the detour
 * (Builder). Wave F: the card's own title doubles as the "mark this road"
 * control (`PathChoice`) — no copy invented for it. Wave M: the two cards no
 * longer sit side by side with road-strip thumbnails — each rides over the
 * fork's pinned road scene as its own panel (road-scene.tsx).
 */
export function PathCard({ fork, which, labels, mark, onMark }: Props) {
  const path = which === 'habit' ? fork.habit : fork.detour
  const guideName = path.guide === 'scroller' ? labels.scroller : labels.builder
  return (
    <article className="quest-card">
      <GuideChip guide={path.guide} label={guideName} />
      <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
        <PathChoice label={path.title} pressed={mark === which} onPress={() => onMark(which)} />
      </h3>
      {path.paragraphs.map((p, i) => (
        <p key={i} className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{p}</p>
      ))}
      {path.ctas?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {path.ctas.map((c, i) => (
            <a key={c.href} href={c.href} className={i === 0 ? 'quest-cta' : 'quest-cta quest-cta--ghost'}>{c.label}</a>
          ))}
        </div>
      ) : null}
    </article>
  )
}
