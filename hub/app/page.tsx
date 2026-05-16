import Link from 'next/link'

const PROJECTS = [
  {
    badge: '⬡  AI COURSE',
    title: 'Точка Сборки',
    subtitle: 'Открытый курс по vibe-кодингу — Claude Code, MCP, агенты, автоматизация.',
    href: 'https://ai.mamaev.coach',
    cta: 'Начать курс →',
    status: 'open · бесплатно',
    color: '#00ff88',
  },
  {
    badge: '⚙  FOR BUSINESS',
    title: 'Агентский инжиниринг',
    subtitle: 'Дизайн и реализация production agent-систем для команд — от спецификации до n8n + observability.',
    href: 'https://mentor.mamaev.coach',
    cta: 'Узнать больше →',
    status: 'b2b · по запросу',
    color: '#00aaff',
  },
]

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/master5d' },
  { label: 'Email', href: 'mailto:mamaev.sasha@gmail.com' },
]

export default function HomePage() {
  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: '6rem 2rem 3rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          // mamaev.coach
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(3rem, 11vw, 9rem)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.06em',
          marginBottom: '2rem',
        }}>
          Александр<br />Мамаев
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '0',
        }}>
          Vibe coder, AI builder, коуч. Строю agent-системы на Claude Code + n8n.
          Учу других делать то же самое.
        </p>
      </section>

      {/* ── PROJECTS ───────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '3rem',
          }}>
            // проекты
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
          }}>
            {PROJECTS.map(p => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '2rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'inherit',
                  textDecoration: 'none',
                  minHeight: '280px',
                  transition: 'border-color 0.2s, transform 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Accent line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  background: p.color,
                }} />

                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: p.color,
                  letterSpacing: '0.15em',
                  marginBottom: '1.5rem',
                }}>
                  {p.badge}
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                  textTransform: 'uppercase',
                  marginBottom: '1rem',
                }}>
                  {p.title}
                </h2>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  flexGrow: 1,
                }}>
                  {p.subtitle}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                  }}>
                    {p.status}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: p.color,
                    fontWeight: 700,
                  }}>
                    {p.cta}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / SOCIALS ────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '2rem',
          }}>
            // контакты
          </div>
          <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
          }}>
            {SOCIALS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--text-accent)',
                  padding: '0.75rem 1.25rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                }}
              >
                → {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
      }}>
        © {new Date().getFullYear()} · mamaev.coach · ⬡ vibe in motion
      </footer>
    </>
  )
}
