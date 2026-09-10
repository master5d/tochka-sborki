import type { Fork, QuestContent } from '../../lib/quest/content'
import type { PathMark } from '../../lib/quest/route'
import { GuideChip } from './guide-chip'
import { PathChoice } from './path-choice'
import { RoadStrip } from './road-strip'

interface Props {
  fork: Fork
  labels: QuestContent['labels']
  /** The reader's mark for THIS fork, if any (Wave F, from localStorage). */
  mark?: PathMark
  onMark: (mark: PathMark) => void
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{p}</p>
      ))}
    </>
  )
}

/**
 * Two cards: the habit road (Scroller) and the detour (Builder). Wave F: each
 * card's own title doubles as the "mark this road" control (`PathChoice`) — no
 * copy invented for it, `mark`/`onMark` wire it to localStorage via the caller's
 * `usePathChoice`.
 */
export function PathFork({ fork, labels, mark, onMark }: Props) {
  const guideName = (g: 'scroller' | 'builder') => (g === 'scroller' ? labels.scroller : labels.builder)
  return (
    <div className="quest-cards">
      {[fork.habit, fork.detour].map((path) => {
        const thisMark: PathMark = path === fork.habit ? 'habit' : 'detour'
        return (
        <div key={path.guide} className="quest-path">
          <RoadStrip forkId={fork.id} guide={path.guide} />
          <article className="quest-card">
            <GuideChip guide={path.guide} label={guideName(path.guide)} />
            <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              <PathChoice label={path.title} pressed={mark === thisMark} onPress={() => onMark(thisMark)} />
            </h3>
            <Paragraphs items={path.paragraphs} />
            {path.ctas?.length ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto' }}>
                {path.ctas.map((c, i) => (
                  <a key={c.href} href={c.href} className={i === 0 ? 'quest-cta' : 'quest-cta quest-cta--ghost'}>{c.label}</a>
                ))}
              </div>
            ) : null}
          </article>
        </div>
        )
      })}
    </div>
  )
}
