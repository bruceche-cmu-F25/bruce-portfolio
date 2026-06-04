'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function About() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    document.querySelectorAll<HTMLElement>('.stat-value[data-count]').forEach(el => {
      const target   = parseFloat(el.dataset.count!)
      const decimals = parseInt(el.dataset.decimals ?? '0', 10)
      const counter  = { val: 0 }
      el.textContent = (0).toFixed(decimals)
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter() {
          gsap.to(counter, {
            val: target, duration: 1.5, ease: 'power2.out',
            onUpdate() { el.textContent = counter.val.toFixed(decimals) },
          })
        },
      })
    })

    gsap.fromTo('.edu-card',
      { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.edu-cards', start: 'top 89%' } })

    gsap.fromTo('.about-body, .about-links',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-right', start: 'top 87%' } })
  }, [])

  return (
    <section id="about" className="section section-alt" aria-label="About Bruce Cheng">
      <div className="container">
        <div className="about-layout">
          <div className="about-left">
            <div className="stats-grid">
              <div className="stat-tile">
                <span className="stat-value" data-count="3.6" data-decimals="1">3.6</span>
                <span className="stat-label">GPA</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value" data-count="7" data-decimals="0">7</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value" data-count="2" data-decimals="0">2</span>
                <span className="stat-label">Roles</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value stat-text">CMU</span>
                <span className="stat-label">MS &apos;26</span>
              </div>
            </div>
            <div className="edu-cards">
              <div className="edu-card">
                <img src="/images/CMULogo.jpg" alt="Carnegie Mellon University" className="edu-logo" />
                <div className="edu-info">
                  <strong>Carnegie Mellon University</strong>
                  <span>MS Software Engineering</span>
                  <span className="edu-meta">GPA 3.6 · Silicon Valley · 2025–2026</span>
                </div>
              </div>
              <div className="edu-card">
                <div className="edu-logo edu-logo-ucsd" aria-label="UC San Diego">UCSD</div>
                <div className="edu-info">
                  <strong>UC San Diego</strong>
                  <span>BS Mathematics–Computer Science</span>
                  <span className="edu-meta">GPA 3.6 · San Diego · 2021–2025</span>
                </div>
              </div>
            </div>
          </div>
          <div className="about-right">
            <p className="section-kicker">About</p>
            <h2 className="about-heading">Building at the<br />frontier of AI</h2>
            <p className="about-body">MS student in Software Engineering at Carnegie Mellon University, Silicon Valley, with hands-on experience building AI systems and agentic workflows that ship to production. Previously at Helport AI — reduced intent-matching cost by 6× and average handling time by 35% across mortgage, healthcare, and insurance verticals. Actively seeking Summer 2026 internships in software engineering, AI/agentic systems, or product roles.</p>
            <div className="about-links">
              <a href="https://github.com/Bruce0921" target="_blank" rel="noopener" className="about-link">GitHub ↗</a>
              <a href="https://linkedin.com/in/chi-cheng-779b4a259/" target="_blank" rel="noopener" className="about-link">LinkedIn ↗</a>
              <a href="/Chi Cheng-Resume-2026-May.pdf" download className="about-link">Resume ↓</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
