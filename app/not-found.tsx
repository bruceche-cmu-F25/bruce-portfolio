import type { Metadata } from 'next'

/** The 404, written out as 404.html by the static export. It stands on its
 *  own — no homepage CSS, no scripts — and borrows only the homepage's dusk:
 *  the dark page, the mono type, the pink accent and a little pixel pip. */

export const metadata: Metadata = {
  title: 'Not found · Bruce Cheng',
  robots: { index: false },
}

const PIP = 'M4 0h1v2h1v1h2v1H6v1H5v2H4V5H3V4H1V3h2V2h1Z'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24,
      background: '#0b0a10', color: '#e9e3ef',
      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    }}>
      <div style={{ maxWidth: 420 }}>
        <svg viewBox="0 0 9 7" width="27" height="21" fill="#ff4f93" shapeRendering="crispEdges" aria-hidden="true">
          <path d={PIP} opacity="0.55" />
          <path d="M4 2h1v1h1v1H5v1H4V4H3V3h1Z" />
        </svg>
        <p style={{ margin: '18px 0 6px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c8496' }}>
          404 · nothing here
        </p>
        <h1 style={{ margin: 0, font: '500 20px/1.35 Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
          This page wandered off.
        </h1>
        <p style={{ margin: '10px 0 22px', font: '400 13.5px/1.6 Inter, system-ui, sans-serif', color: '#a59dae' }}>
          The link may be old, or the address mistyped. Everything that&apos;s here is on the homepage.
        </p>
        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 13px',
          fontSize: 12, color: '#e9e3ef', textDecoration: 'none',
          border: '1px solid rgba(255, 79, 147, 0.45)', borderRadius: 3, background: 'rgba(255, 79, 147, 0.08)',
        }}>
          ← back to bruceche.com
        </a>
      </div>
    </main>
  )
}
