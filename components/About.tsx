'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SITE } from '@/lib/siteConfig'

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
                <span className="stat-value" data-count="6" data-decimals="0">6</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-tile">
                <span className="stat-value" data-count="4" data-decimals="0">4</span>
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
                  <span className="edu-meta">GPA 3.6 · Silicon Valley · Dec 2026</span>
                </div>
              </div>
              <div className="edu-card">
                <div className="edu-logo edu-logo-ucsd" aria-label="UC San Diego">UCSD</div>
                <div className="edu-info">
                  <strong>UC San Diego</strong>
                  <span>BS Mathematics–Computer Science</span>
                  <span className="edu-meta">GPA 3.6 · San Diego · Apr 2025</span>
                </div>
              </div>
            </div>
          </div>
          <div className="about-right">
            <p className="section-kicker">About</p>
            <h2 className="about-heading">Building at the<br />frontier of AI</h2>
            <p className="about-body">Software engineer building AI systems, agentic pipelines, and full-stack applications. Currently a graduate researcher at Carnegie Mellon&apos;s Applied Generative AI lab, working on LLM hallucination detection, mitigation, and interpretability. Previously shipped production backend at Helport AI — 20ms response latency, 6× lower inference cost, 35% shorter handling time. MS in Software Engineering at CMU, Dec 2026; seeking Summer 2026 SWE internships.</p>
            <div className="about-links">
              <a href={SITE.github} target="_blank" rel="noopener" className="about-link">GitHub ↗</a>
              <a href={SITE.linkedin} target="_blank" rel="noopener" className="about-link">LinkedIn ↗</a>
              <a href={SITE.resume} download className="about-link">Resume ↓</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
