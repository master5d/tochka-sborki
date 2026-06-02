import { ThemeToggle } from '@/components/theme-toggle'

/** Thin top bar: wordmark home-link + theme toggle. hub has no other nav. */
export function SiteHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(var(--bg-primary-rgb), 0.85)', // Slightly more opaque for better legibility
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000, // Force topmost layer
      }}
    >
      <a
        href="/"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          letterSpacing: '0.04em',
          color: 'var(--text-primary)',
          textDecoration: 'none',
        }}
      >
        mamaev.coach
      </a>
      <ThemeToggle />
    </header>
  )
}
