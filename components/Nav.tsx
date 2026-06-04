'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

export default function Nav() {
  const navRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    gsap.from('.navbar', { y: -72, autoAlpha: 0, duration: 0.8, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    const nav = navRef.current
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-link')

    function updateNav() {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20)
      const navH  = nav ? nav.offsetHeight : 0
      const scrollY = window.pageYOffset
      document.querySelectorAll<HTMLElement>('section[id]').forEach(section => {
        const top  = section.offsetTop - navH - 60
        const link = document.querySelector<HTMLElement>(`.nav-link[href="#${section.id}"]`)
        if (scrollY >= top && scrollY < top + section.offsetHeight) {
          navLinks.forEach(l => l.classList.remove('active'))
          link?.classList.add('active')
        }
      })
    }
    window.addEventListener('scroll', updateNav, { passive: true })
    return () => window.removeEventListener('scroll', updateNav)
  }, [])

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    const target = document.querySelector<HTMLElement>(href)
    const nav = navRef.current
    if (target) {
      const offset = nav ? nav.offsetHeight : 0
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' })
    }
    setMenuOpen(false)
  }

  return (
    <nav className="navbar" ref={navRef} role="navigation" aria-label="Main navigation">
      <div className="container nav-inner">
        <a href="#hero" className="nav-brand" onClick={e => handleNavClick(e, '#hero')} aria-label="Bruce Cheng – home">
          <span className="nav-monogram">BC</span>
          <span className="nav-name">Bruce Cheng</span>
        </a>
        <ul className={`nav-menu${menuOpen ? ' active' : ''}`} role="list">
          {[
            ['#about', 'About'], ['#experience', 'Experience'],
            ['#work', 'Work'], ['#stack', 'Stack'],
            ['#life', 'Life'], ['#contact', 'Contact'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="nav-link" onClick={e => handleNavClick(e, href)}>{label}</a>
            </li>
          ))}
          <li>
            <a href="/Chi Cheng-Resume-2026-May.pdf" className="nav-resume" target="_blank" rel="noopener" download>
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
