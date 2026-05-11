import Link from 'next/link'

export function Nav() {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '0 1.5rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ Точка Сборки
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
        <Link href="/roadmap/" style={{ color: 'var(--text-secondary)' }}>Roadmap</Link>
        <Link href="/cheatsheet/" style={{ color: 'var(--text-secondary)' }}>Шпаргалка</Link>
        <Link href="/feedback/" style={{ color: 'var(--text-secondary)' }}>Фидбек</Link>
      </div>
    </nav>
  )
}
