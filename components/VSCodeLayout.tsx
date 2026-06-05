'use client'
import { useEffect, useState } from 'react'

const NAV_ITEMS = [
  { id: 'hero',       label: 'index',     ext: '.tsx', icon: '⚛' },
  { id: 'about',      label: 'about',     ext: '.ts',  icon: '👤' },
  { id: 'work',       label: 'work',      ext: '.tsx', icon: '⚡' },
  { id: 'stack',      label: 'stack',     ext: '.ts',  icon: '🛠' },
  { id: 'life',       label: 'life',      ext: '.tsx', icon: '🎨' },
  { id: 'contact',    label: 'contact',   ext: '.ts',  icon: '📬' },
]

export default function VSCodeLayout() {
  const [activeId, setActiveId] = useState('hero')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const CHROME_H = 36 + 36  // titlebar + tabbar
    const observers: IntersectionObserver[] = []
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { rootMargin: `-${CHROME_H}px 0px 0px 0px`, threshold: 0.15 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  function scrollTo(id: string) {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    // Offset by the fixed chrome height so section headings aren't hidden behind tabs
    const CHROME_H = 36 + 36
    const top = el.getBoundingClientRect().top + window.scrollY - CHROME_H
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const activeItem = NAV_ITEMS.find(n => n.id === activeId) ?? NAV_ITEMS[0]

  return (
    <>
      {/* Title bar */}
      <header className="vsc-titlebar" aria-hidden="true">
        <div className="vsc-traffic">
          <span /><span /><span />
        </div>
        <span className="vsc-titlebar-label">
          bruce-portfolio — <em>{activeItem.label}{activeItem.ext}</em>
        </span>
      </header>

      {/* Activity bar */}
      <nav className="vsc-activity" aria-label="Activity bar">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`vsc-act-btn${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
            title={item.label}
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}
        <div className="vsc-act-spacer" />
        <button className="vsc-act-btn" title="Resume" aria-label="Download resume"
          onClick={() => window.open('/Chi Cheng-Resume-2026-May.pdf', '_blank')}>
          📄
        </button>
      </nav>

      {/* Sidebar */}
      <aside className="vsc-sidebar" aria-label="Explorer">
        <span className="vsc-sidebar-label">Explorer</span>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`vsc-file${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
          >
            <span className="vsc-file-icon">{item.icon}</span>
            <span>
              <span className="vsc-file-name">{item.label}</span>
              <span className="vsc-file-ext">{item.ext}</span>
            </span>
          </button>
        ))}
        <div className="vsc-sidebar-divider" />
        <div className="vsc-sidebar-bottom">
          <a href="https://github.com/Bruce0921" target="_blank" rel="noopener" className="vsc-social-link">
            ⬡ github.com/Bruce0921
          </a>
          <a href="https://linkedin.com/in/chi-cheng-779b4a259/" target="_blank" rel="noopener" className="vsc-social-link">
            ⬡ linkedin.com/in/chi-cheng
          </a>
          <a href="mailto:bruceche@andrew.cmu.edu" className="vsc-social-link">
            ⬡ bruceche@andrew.cmu.edu
          </a>
        </div>
      </aside>

      {/* Tab bar */}
      <div className="vsc-tabbar" aria-label="Open tabs">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`vsc-tab${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
          >
            <span className="vsc-tab-dot" />
            {item.label}{item.ext}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <footer className="vsc-statusbar" aria-label="Status bar">
        <div className="vsc-status-item open">
          <span className="status-dot-green" />
          main
        </div>
        <div className="vsc-status-item">⚡ Next.js 14</div>
        <div className="vsc-status-item">TypeScript</div>
        <div className="vsc-status-spacer" />
        <div className="vsc-status-item">GSAP + Lenis</div>
        <div className="vsc-status-item">
          <a href="/Chi Cheng-Resume-2026-May.pdf" download style={{ color: 'inherit', textDecoration: 'none' }}>
            ↓ Resume
          </a>
        </div>
        <div className="vsc-status-item">
          © {new Date().getFullYear()} Bruce Cheng
        </div>
      </footer>

      {/* Mobile bar */}
      <div className="vsc-mobile-bar">
        <span className="vsc-mobile-brand">BC.tsx</span>
        <button
          className="vsc-hamburger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen(v => !v)}
        >
          <span style={{ transform: mobileOpen ? 'rotate(45deg) translate(5px,5px)' : '' }} />
          <span style={{ opacity: mobileOpen ? 0 : 1 }} />
          <span style={{ transform: mobileOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          style={{
            position: 'fixed', top: 52, left: 0, right: 0, zIndex: 199,
            background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
            padding: '0.5rem 0',
          }}
        >
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`vsc-file${activeId === item.id ? ' active' : ''}`}
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => scrollTo(item.id)}>
              <span className="vsc-file-icon">{item.icon}</span>
              <span className="vsc-file-name">{item.label}</span>
              <span className="vsc-file-ext">{item.ext}</span>
            </button>
          ))}
          <div style={{ padding: '0.75rem 1rem' }}>
            <a href="/Chi Cheng-Resume-2026-May.pdf" download
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--lime)' }}>
              ↓ Download Resume
            </a>
          </div>
        </nav>
      )}
    </>
  )
}
