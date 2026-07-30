export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#070810', color: 'rgba(255,255,255,0.92)', padding: '2rem', textAlign: 'center' }}>
      <div>
        <p style={{ color: '#d9a95c', fontFamily: 'var(--font-mono)', letterSpacing: '0.14em', textTransform: 'lowercase', marginBottom: '0.75rem' }}>404</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 8vw, 4rem)', marginBottom: '1rem' }}>S.A.S.H.A</h1>
        <a href="/" style={{ color: '#d9a95c' }}>На главную →</a>
      </div>
    </main>
  )
}
