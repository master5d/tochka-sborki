import type { Fork, QuestContent } from '../../lib/quest/content'
import { GuideChip } from './guide-chip'

interface Props { fork: Fork; labels: QuestContent['labels'] }

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{p}</p>
      ))}
    </>
  )
}

/** Two cards: the habit road (Scroller) and the detour (Builder). */
export function PathFork({ fork, labels }: Props) {
  const guideName = (g: 'scroller' | 'builder') => (g === 'scroller' ? labels.scroller : labels.builder)
  return (
    <div className="quest-cards">
      {[fork.habit, fork.detour].map((path) => (
        <article key={path.guide} className="quest-card">
          <GuideChip guide={path.guide} label={guideName(path.guide)} />
          <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{path.title}</h3>
          <Paragraphs items={path.paragraphs} />
          {path.ctas?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto' }}>
              {path.ctas.map((c, i) => (
                <a key={c.href} href={c.href} className={i === 0 ? 'quest-cta' : 'quest-cta quest-cta--ghost'}>{c.label}</a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
