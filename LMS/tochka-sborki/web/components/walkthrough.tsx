/**
 * Embeds a self-contained "Learn-mode walkthrough" HTML (exported from the sovern-mindmap app)
 * into a lesson via a sandboxed iframe. The file in public/walkthroughs/<slug>.html is fully
 * self-contained (zero external resources) — no code dependency on the app; it keeps working if
 * the app goes away. Static asset + iframe ONLY (never cross-import app sources into workers/).
 *
 * MDX usage:
 *   <Walkthrough slug="my-diagram" title="Как собрать пайплайн" />
 *
 * Keep exported diagrams SMALL (~5 nodes) — cumulative inline-SVG frames get heavy.
 */
export function Walkthrough({ slug, title, minHeight = 480 }: { slug: string; title?: string; minHeight?: number }) {
  return (
    <figure style={{ margin: '1.5rem 0' }}>
      <iframe
        src={`/walkthroughs/${slug}.html`}
        title={title ?? 'walkthrough'}
        loading="lazy"
        // Self-contained file: scripts to run the step-through, but no same-origin/storage/forms.
        sandbox="allow-scripts"
        style={{ width: '100%', minHeight, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-surface)' }}
      />
      {title && (
        <figcaption style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
          {title}
        </figcaption>
      )}
    </figure>
  )
}
