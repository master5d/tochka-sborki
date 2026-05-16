const SERVICES = [
  {
    label: '01',
    title: 'Audit & Spec',
    body: 'Карта твоих ручных процессов → архитектурная спецификация агент-системы. Включает декомпозицию на AI/Tool/Code узлы, ROI-оценку.',
    deliverable: 'Implementation-ready spec',
    duration: '~2 недели',
  },
  {
    label: '02',
    title: 'Build & Ship',
    body: 'Реализация pipeline на n8n / Claude Code / custom backend. CI/CD, observability через Langfuse, fallback-маршруты на LLM, alerting.',
    deliverable: 'Production-ready system',
    duration: '~6 недель',
  },
  {
    label: '03',
    title: 'Embed Engineer',
    body: 'Работаю part-time как embedded agent engineer в команде. Помогаю проектировать, ревьюить, бить production-fires.',
    deliverable: 'Continuous capacity',
    duration: 'monthly retainer',
  },
]

const CASES = [
  {
    name: 'ENERV',
    tag: 'personal knowledge pipeline',
    body: 'Семантический журнал на 1400+ Markdown-нод. Gmail Trigger → Gemini Router → ACL Transformer → Obsidian vault. 9 узлов, 2 LLM, idempotent через Gmail labels.',
    stack: 'n8n · Gemini · Qdrant · Docker',
  },
  {
    name: 'SOVERN',
    tag: 'production infrastructure',
    body: 'Self-hosted agent stack: Hetzner CX22 + Cloudflare Tunnel + Docker bridge. n8n + Langfuse + Postgres. LiteLLM 5-fallback routing, SMTP через Resend.',
    stack: 'Hetzner · CF Tunnel · Docker · LiteLLM',
  },
]

const PROCESS = [
  ['01', 'Discovery call (30 мин, бесплатно)'],
  ['02', 'Workshop: декомпозиция задачи, scope, acceptance criteria'],
  ['03', 'Spec → твой человек или я строим'],
  ['04', 'Build sprints с weekly check-ins'],
  ['05', 'Handover + observability + runbook'],
]

const CONTACT_EMAIL = 'mamaev.sasha@gmail.com'

export default function HomePage() {
  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{
        padding: '6rem 2rem 4rem',
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
          ⚙  Agent Engineering · для бизнеса
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2.8rem, 9vw, 7rem)',
          fontWeight: 900,
          lineHeight: 0.88,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          marginBottom: '2rem',
        }}>
          Когда промпт<br />перестаёт<br />работать
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          Проектирую и собираю <strong style={{ color: 'var(--text-primary)' }}>production agent-системы</strong>: оркестрация,
          observability, fallback-маршрутизация, recovery. Не «один большой промпт» —
          инженерная архитектура с верификацией и трейсами.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'var(--text-accent)',
              color: '#000',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius)',
            }}
          >
            → Discovery call
          </a>
          <a
            href="https://ai.mamaev.coach"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius)',
            }}
          >
            ⬡ Открытый курс
          </a>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            // services
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            Три формата работы
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {SERVICES.map(s => (
              <div key={s.label} style={{
                padding: '2rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}>
                  {s.label}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  letterSpacing: '-0.01em',
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  flexGrow: 1,
                }}>
                  {s.body}
                </p>
                <div style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                }}>
                  <span>{s.deliverable}</span>
                  <span>{s.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASES ──────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            // cases
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            Что я уже строю
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '2rem',
          }}>
            {CASES.map(c => (
              <div key={c.name} style={{
                padding: '2rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display), system-ui, sans-serif',
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    textTransform: 'uppercase',
                  }}>
                    {c.name}
                  </h3>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-accent)',
                    letterSpacing: '0.05em',
                  }}>
                    {c.tag}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}>
                  {c.body}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  letterSpacing: '0.05em',
                }}>
                  stack: <span style={{ color: 'var(--text-primary)' }}>{c.stack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            // process
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            Как работаем
          </h2>
          <div style={{ maxWidth: '720px' }}>
            {PROCESS.map(([num, text]) => (
              <div key={num} style={{
                display: 'grid',
                gridTemplateColumns: '4rem 1fr',
                gap: '1.5rem',
                alignItems: 'baseline',
                padding: '1.25rem 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  letterSpacing: '0.05em',
                }}>
                  {num}
                </span>
                <span style={{
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
            lineHeight: 0.95,
          }}>
            Начнём с разговора
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '500px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}>
            30 минут чтобы понять задачу и есть ли смысл работать вместе.
            Без воды, без слайдов.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'var(--text-accent)',
              color: '#000',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: 'var(--radius)',
            }}
          >
            → {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
      }}>
        <span>© {new Date().getFullYear()} · mentor.mamaev.coach</span>
        <span style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="https://mamaev.coach" style={{ color: 'var(--text-secondary)' }}>← mamaev.coach</a>
          <a href="https://ai.mamaev.coach" style={{ color: 'var(--text-secondary)' }}>ai.mamaev.coach</a>
          <a href="https://github.com/master5d" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)' }}>github</a>
        </span>
      </footer>
    </>
  )
}
