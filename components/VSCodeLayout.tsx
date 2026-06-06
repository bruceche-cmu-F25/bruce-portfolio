'use client'
import { useEffect, useState } from 'react'

// ── Nav items (tab bar + tree leaves) ───────────────────────────────
const NAV_ITEMS = [
  { id: 'hero',    label: 'index',   ext: '.tsx' },
  { id: 'about',   label: 'about',   ext: '.ts'  },
  { id: 'work',    label: 'work',    ext: '.tsx' },
  { id: 'stack',   label: 'stack',   ext: '.json'},
  { id: 'life',    label: 'life',    ext: '.tsx' },
  { id: 'contact', label: 'contact', ext: '.ts'  },
]

// ── Activity bar icons ───────────────────────────────────────────────
const ACT_ITEMS = [
  { id: 'hero',    sym: '⊟', title: 'Explorer'       },
  { id: 'about',   sym: '◉', title: 'About'          },
  { id: 'work',    sym: '⊡', title: 'Work'           },
  { id: 'stack',   sym: '⟨⟩', title: 'Stack'          },
  { id: 'life',    sym: '◈', title: 'Life'           },
  { id: 'contact', sym: '◎', title: 'Contact'        },
]

// ── Colored file-type badge ──────────────────────────────────────────
function FileTypeIcon({ ext }: { ext: string }) {
  const map: Record<string, { ch: string; color: string }> = {
    '.tsx':  { ch: '⚛',  color: '#4FC3F7' },
    '.ts':   { ch: 'TS', color: '#81C784' },
    '.json': { ch: '{ }',color: '#FFD54F' },
    '.md':   { ch: '##', color: '#64B5F6' },
    '.py':   { ch: 'py', color: '#A5D6A7' },
  }
  const { ch, color } = map[ext] ?? { ch: '·', color: '#556' }
  return <span className="vsc-ftype" style={{ color }}>{ch}</span>
}

// ── Sidebar file tree ─────────────────────────────────────────────────
type FileNode   = { type: 'file';   id: string; label: string; ext: string }
type FolderNode = { type: 'folder'; label: string; children: FileNode[] }
type TreeNode   = FileNode | FolderNode

const TREE: TreeNode[] = [
  {
    type: 'folder', label: 'experience',
    children: [
      { type: 'file', id: 'work', label: 'helport-ai',     ext: '.md'  },
      { type: 'file', id: 'work', label: 'convoloo',       ext: '.md'  },
    ],
  },
  {
    type: 'folder', label: 'projects',
    children: [
      { type: 'file', id: 'work', label: 'nightynight',    ext: '.tsx' },
      { type: 'file', id: 'work', label: 'research-agent', ext: '.ts'  },
      { type: 'file', id: 'work', label: 'parking-locator',ext: '.py'  },
      { type: 'file', id: 'work', label: 'capitawise',     ext: '.ts'  },
    ],
  },
  { type: 'file', id: 'hero',    label: 'index',   ext: '.tsx' },
  { type: 'file', id: 'about',   label: 'about',   ext: '.ts'  },
  { type: 'file', id: 'stack',   label: 'stack',   ext: '.json'},
  { type: 'file', id: 'life',    label: 'life',    ext: '.tsx' },
  { type: 'file', id: 'contact', label: 'contact', ext: '.ts'  },
  { type: 'file', id: '',        label: 'README',  ext: '.md'  },
]

function SidebarTree({ activeId, onNavigate }: { activeId: string; onNavigate: (id: string) => void }) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    experience: true, projects: true,
  })

  function toggle(label: string) {
    setOpenFolders(prev => ({ ...prev, [label]: !prev[label] }))
  }

  function renderNode(node: TreeNode, depth = 0) {
    if (node.type === 'folder') {
      const isOpen = openFolders[node.label] ?? true
      return (
        <div key={node.label}>
          <button
            className="vsc-tree-folder"
            style={{ paddingLeft: `${6 + depth * 12}px` }}
            onClick={() => toggle(node.label)}
          >
            <span className="vsc-chevron">{isOpen ? '▾' : '▸'}</span>
            <span className="vsc-folder-ico">⊟</span>
            {node.label}
          </button>
          {isOpen && node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )
    }

    const isActive = node.id && node.id === activeId
    return (
      <button
        key={`${node.label}${node.ext}`}
        className={`vsc-tree-file${isActive ? ' active' : ''}`}
        style={{ paddingLeft: `${6 + depth * 12 + 14}px` }}
        onClick={() => node.id && onNavigate(node.id)}
      >
        <FileTypeIcon ext={node.ext} />
        <span className="vsc-fname">{node.label}</span>
        <span className="vsc-fext">{node.ext}</span>
      </button>
    )
  }

  return <div className="vsc-tree">{TREE.map(n => renderNode(n))}</div>
}

// ── Main layout component ─────────────────────────────────────────────
export default function VSCodeLayout() {
  const [activeId, setActiveId] = useState('hero')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const CHROME_H = 36 + 36
    const observers: IntersectionObserver[] = []
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id) },
        { rootMargin: `-${CHROME_H}px 0px 0px 0px`, threshold: 0.15 },
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
    const CHROME_H = 36 + 36
    const top = el.getBoundingClientRect().top + window.scrollY - CHROME_H
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const activeItem = NAV_ITEMS.find(n => n.id === activeId) ?? NAV_ITEMS[0]

  return (
    <>
      {/* ── Title bar ─────────────────────────────────────────────── */}
      <header className="vsc-titlebar" aria-hidden="true">
        <div className="vsc-traffic">
          <span /><span /><span />
        </div>
        <span className="vsc-titlebar-label">
          ⚛ Bruce Cheng — <em>{activeItem.label}{activeItem.ext}</em>
        </span>
        <a
          href="/Chi Cheng-Resume-2026-May.pdf"
          download
          className="vsc-titlebar-cv"
          aria-label="Download CV"
        >
          ↓ Download CV
        </a>
      </header>

      {/* ── Activity bar ──────────────────────────────────────────── */}
      <nav className="vsc-activity" aria-label="Activity bar">
        {ACT_ITEMS.map(item => (
          <button
            key={item.id}
            className={`vsc-act-btn${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
            title={item.title}
            aria-label={item.title}
          >
            {item.sym}
          </button>
        ))}
        <div className="vsc-act-spacer" />
        <button className="vsc-act-btn" title="Settings" aria-label="Settings">⚙</button>
      </nav>

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="vsc-sidebar" aria-label="Explorer">
        <div className="vsc-sidebar-section-header">Explorer</div>
        <div className="vsc-sidebar-project-root">
          <span className="vsc-chevron">▾</span>
          BRUCE-PORTFOLIO
        </div>
        <SidebarTree activeId={activeId} onNavigate={scrollTo} />
        <div className="vsc-sidebar-divider" />
        <div className="vsc-sidebar-bottom">
          <a href="https://github.com/bruceche-cmu-F25" target="_blank" rel="noopener" className="vsc-social-link">
            ⬡ github.com/bruceche-cmu-F25
          </a>
          <a href="https://linkedin.com/in/chi-cheng-779b4a259/" target="_blank" rel="noopener" className="vsc-social-link">
            ⬡ linkedin.com/in/chi-cheng
          </a>
          <a href="mailto:bruceche@andrew.cmu.edu" className="vsc-social-link">
            ⬡ bruceche@andrew.cmu.edu
          </a>
        </div>
      </aside>

      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div className="vsc-tabbar" aria-label="Open tabs">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`vsc-tab${activeId === item.id ? ' active' : ''}`}
            onClick={() => scrollTo(item.id)}
          >
            <FileTypeIcon ext={item.ext} />
            {item.label}{item.ext}
            <span className="vsc-tab-close">×</span>
          </button>
        ))}
      </div>

      {/* ── Status bar ────────────────────────────────────────────── */}
      <footer className="vsc-statusbar" aria-label="Status bar">
        <div className="vsc-status-item open">
          <span className="status-dot-green" />
          ⎇ main
          <span className="vsc-status-hash">(ae09903)</span>
        </div>
        <div className="vsc-status-item">⚡ Next.js 14</div>
        <div className="vsc-status-spacer" />
        <div className="vsc-status-item">{activeItem.label}{activeItem.ext}</div>
        <div className="vsc-status-item">TypeScript</div>
        <div className="vsc-status-item">UTF-8</div>
        <div className="vsc-status-item">
          <a href="/Chi Cheng-Resume-2026-May.pdf" download style={{ color: 'inherit', textDecoration: 'none' }}>
            ↓ Resume
          </a>
        </div>
        <div className="vsc-status-item">© {new Date().getFullYear()} Bruce Cheng</div>
      </footer>

      {/* ── Mobile bar ────────────────────────────────────────────── */}
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

      {/* ── Mobile dropdown ───────────────────────────────────────── */}
      {mobileOpen && (
        <nav className="vsc-mobile-menu">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`vsc-tree-file${activeId === item.id ? ' active' : ''}`}
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => scrollTo(item.id)}
            >
              <FileTypeIcon ext={item.ext} />
              <span className="vsc-fname">{item.label}</span>
              <span className="vsc-fext">{item.ext}</span>
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
