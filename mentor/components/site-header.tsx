import { ThemeToggle } from '@/components/theme-toggle'
import { HeaderLangSwitch } from '@/components/header-lang-switch'

/** Thin top bar: wordmark home-link + EN/RU switch + theme toggle. */
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
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
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
        Mamaev Agentic Lab
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <HeaderLangSwitch />
        <ThemeToggle />
      </div>
    </header>
  )
}
