'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLoader } from '@/lib/LoaderContext'

const LINKS: [string, string][] = [
  ['#about', 'About'], ['#experience', 'Experience'],
  ['#work', 'Work'], ['#stack', 'Stack'],
  ['#life', 'Life'], ['#contact', 'Contact'],
]

export default function TopBar() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { ready } = useLoader()

  // slide in once the hero scene is up (the bar sits transparent over it)
  useEffect(() => {
    if (!ready || !navRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(navRef.current, { y: -72, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' })
    }, navRef)
    return () => ctx.revert()
  }, [ready])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const navLinks = nav.querySelectorAll<HTMLAnchorElement>('.nav-link')
    // offsetTop is relative to the positioned .site-main wrapper — measure
    // against the document instead
    const pageTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY

    function updateNav() {
      nav!.classList.toggle('scrolled', window.scrollY > 20)
      const navH = nav!.offsetHeight
      const scrollY = window.scrollY
      let activeHref: string | null = null
      document.querySelectorAll<HTMLElement>('.site-main section[id]').forEach(section => {
        const top = pageTop(section) - navH - 60
        if (scrollY >= top && scrollY < top + section.offsetHeight) activeHref = `#${section.id}`
      })
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === activeHref))
    }
    updateNav()
    // re-measure once the hero has mounted and pushed the sections down
    const settle = requestAnimationFrame(updateNav)
    window.addEventListener('scroll', updateNav, { passive: true })
    return () => {
      cancelAnimationFrame(settle)
      window.removeEventListener('scroll', updateNav)
    }
  }, [ready])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    const target = document.querySelector<HTMLElement>(href)
    const nav = navRef.current
    if (target) {
      const offset = nav ? nav.offsetHeight : 0
      const top = target.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  return (
    <nav className="navbar" ref={navRef} style={{ visibility: 'hidden' }} role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <a
          href="#top"
          className="nav-brand"
          onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false) }}
          aria-label="Bruce Cheng – back to top"
        >
          <span className="nav-monogram">BC</span>
          <span className="nav-name">Bruce Cheng</span>
        </a>
        <ul className={`nav-menu${menuOpen ? ' active' : ''}`} role="list">
          {LINKS.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="nav-link" onClick={e => handleNavClick(e, href)}>{label}</a>
            </li>
          ))}
          <li>
            <a href="/Chi Cheng-Resume-2026-May.pdf" className="nav-resume" target="_blank" rel="noopener">
              Resume ↗
            </a>
          </li>
        </ul>
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(-5px, 6px)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(-5px, -6px)' : 'none' }} />
        </button>
      </div>
    </nav>
  )
}
