'use client'
import type { Locale } from '../../lib/dictionaries'
import { quest, type Fork } from '../../lib/quest/content'
import { Chapter, type Tint } from './chapter'
import { GatePlaques } from './gate-plaques'
import { OutcomeReveal } from './outcome-reveal'
import { PathFork } from './path-fork'
import { SceneLoop } from './scene-loop'
import { StickyStage } from './sticky-stage'

interface Props { locale: Locale }

const FORK_TINT: Record<Fork['id'], Tint> = { boulder: 'fork1', temple: 'fork2', gates: 'fork3' }

function Para({ text, lead = false }: { text: string; lead?: boolean }) {
  return <p style={{ fontSize: lead ? 'var(--text-lg)' : 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)', maxWidth: '40rem', marginBottom: '1rem' }}>{text}</p>
}

export function QuestHome({ locale }: Props) {
  const c = quest[locale]
  return (
    <main>
      <style>{`
        @media (max-width: 720px) {
          .hub-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .quest-hero h1 { font-size: clamp(1.6rem, 7vw, 3rem) !important; }
        }
      `}</style>

      {/* 0. Hero: the map, the four lines, the header line that stays. */}
      <Chapter id="hero" tint="hero">
        <div className="quest-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              {c.hero.name} · {c.hero.role}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '1.25rem', textWrap: 'balance' }}>
              {c.hero.lines[0]}
            </h1>
            {c.hero.lines.slice(1).map((l) => <Para key={l} text={l} lead />)}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>{c.hero.bio}</p>
          </div>
          <SceneLoop id={c.hero.scene} locale={locale} eager />
        </div>
      </Chapter>

      {/* 1. Intro: camp by the fire, three paragraphs as steps beside the sticky scene. */}
      <Chapter id="intro" tint="intro" eyebrow={c.intro.eyebrow} heading={c.intro.heading}>
        <StickyStage
          media={() => <SceneLoop id={c.intro.scene} locale={locale} />}
          steps={c.intro.paragraphs.map((p, i) => ({ key: `intro-${i}`, body: p }))}
        />
      </Chapter>

      {/* 2–4. Forks. */}
      {c.forks.map((fork) => (
        <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle}>
          <StickyStage
            media={(active) =>
              fork.id === 'gates'
                ? <GatePlaques locale={locale} plaques={c.labels.plaques} caption={active === 0 ? undefined : active === 1 ? c.labels.habit : c.labels.detour} />
                : <SceneLoop id={fork.scene} locale={locale} caption={active === 0 ? undefined : active === 1 ? c.labels.habit : c.labels.detour} />
            }
            steps={[
              { key: `${fork.id}-setup`, body: fork.setup.map((p, i) => <Para key={i} text={p} lead />) },
              { key: `${fork.id}-habit`, body: <PathFork fork={fork} labels={c.labels} /> },
              { key: `${fork.id}-outcomes`, body: <OutcomeReveal title={fork.outcomesTitle} outcomes={fork.outcomes} labels={c.labels} /> },
            ]}
          />
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
            {fork.cta ? <a href={fork.cta.href} className="quest-cta">{fork.cta.label}</a> : null}
            <Para text={fork.bridge} />
          </div>
        </Chapter>
      ))}

      {/* 5. Finale. */}
      <Chapter id="finale" tint="finale" eyebrow={c.finale.eyebrow} heading={c.finale.heading}>
        <StickyStage
          media={() => <SceneLoop id={c.finale.scene} locale={locale} />}
          steps={[
            ...c.finale.paragraphs.map((p, i) => ({ key: `finale-${i}`, body: p })),
            {
              key: 'finale-cta',
              body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div className="quest-number" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>{c.finale.closing}</div>
                  <a href={c.finale.cta.href} className="quest-cta">{c.finale.cta.label}</a>
                </div>
              ),
            },
          ]}
        />
      </Chapter>

      {/* 6. About × 2 + footer. */}
      <Chapter id="about" tint="about">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <SceneLoop id={c.about.scene} locale={locale} />
          <div className="quest-cards">
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.author.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.author.text}</p>
              <a href={c.about.author.cta.href} className="quest-cta quest-cta--ghost" style={{ alignSelf: 'flex-start' }}>{c.about.author.cta.label}</a>
              <p style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: '0.04em' }}>
                {c.about.author.links.map((l) => <a key={l.href} href={l.href}>→ {l.label}</a>)}
              </p>
            </article>
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.course.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.course.text}</p>
              <a href={c.about.course.href} className="quest-cta" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>{c.forks[2].detour.ctas?.[0]?.label ?? c.finale.cta.label}</a>
            </article>
          </div>
        </div>
        <footer style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {c.footer}
        </footer>
      </Chapter>
    </main>
  )
}
