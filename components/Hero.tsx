'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function CharSplit({ text, className }: { text: string; className: string }) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span key={i} className="hero-char" style={{ display: 'inline-block' }}>
          {char}
        </span>
      ))}
    </span>
  )
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const vantaRef   = useRef<HTMLDivElement>(null)
  const vantaFx    = useRef<{ destroy: () => void } | null>(null)
  const [ready, setReady] = useState(false)

  // Vanta.js NET background
  useEffect(() => {
    let alive = true
    ;(async () => {
      const THREE = await import('three')
      // @ts-expect-error — no official types
      const VANTA = await import('vanta/dist/vanta.net.min')
      if (!alive || !vantaRef.current) return
      vantaFx.current = VANTA.default({
        el: vantaRef.current,
        THREE,
        color: 0x9D4EDD,
        backgroundColor: 0x0D0D14,
        points: 9,
        maxDistance: 24,
        spacing: 18,
        showDots: true,
      })
    })()
    return () => { alive = false; vantaFx.current?.destroy() }
  }, [])

  // Wait for pixel loader
  useEffect(() => {
    const fallback = setTimeout(() => setReady(true), 3800)
    const handler = () => { clearTimeout(fallback); setReady(true) }
    document.addEventListener('loaderDone', handler, { once: true })
    return () => document.removeEventListener('loaderDone', handler)
  }, [])

  // Hero entrance animation
  useEffect(() => {
    if (!ready) return
    gsap.registerPlugin(ScrollTrigger)

    // Scroll progress bar
    gsap.to('.scroll-progress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { start: 'top top', end: 'max', scrub: 0.3 },
    })

    gsap.set([
      '.hero-status', '.hero-char', '.hero-name-underline',
      '.hero-role', '.hero-tagline', '.hero-ctas .btn', '.hero-photo-wrap',
    ], { autoAlpha: 0 })

    const svgPath = document.querySelector<SVGPathElement>('.hero-name-underline path')
    if (svgPath) {
      const len = svgPath.getTotalLength()
      gsap.set(svgPath, { strokeDasharray: len, strokeDashoffset: len })
    }

    gsap.timeline()
      .fromTo('.hero-status',         { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' })
      .fromTo('.hero-char',           { y: 80,  autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.03, ease: 'back.out(1.5)' }, '-=0.3')
      .fromTo('.hero-name-underline', { autoAlpha: 0 },         { autoAlpha: 1, duration: 0.1 }, '-=0.4')
      .to('.hero-name-underline path',                          { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' }, '<')
      .fromTo('.hero-role',           { y: 22,  autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6,  ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-tagline',        { y: 18,  autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, '-=0.38')
      .fromTo('.hero-ctas .btn',      { y: 16,  autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5,  stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.32')
      .fromTo('.hero-photo-wrap',     { scale: 0.82, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.95, ease: 'back.out(1.3)' }, '-=1.0')

    gsap.to('.hero-photo', { y: -12, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4 })

    // Section reveals (registered here so ScrollTrigger is ready)
    gsap.utils.toArray<HTMLElement>('.section-kicker').forEach(el => {
      gsap.fromTo(el, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 91%' } })
    })
    gsap.utils.toArray<HTMLElement>('.section-heading, .about-heading, .contact-heading').forEach(el => {
      gsap.fromTo(el, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.72, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 89%' } })
    })

    gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
      gsap.globalTimeline.timeScale(100)
    })
  }, [ready])

  // Mouse parallax
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect()
      const x = (e.clientX - r.left - r.width  / 2) / r.width
      const y = (e.clientY - r.top  - r.height / 2) / r.height
      gsap.to('.hero-photo-wrap', { x: x * 20, y: y * 10, duration: 0.9, ease: 'power2.out', overwrite: 'auto' })
      gsap.to('.hero-content',    { x: x * -8,            duration: 0.9, ease: 'power2.out', overwrite: 'auto' })
    }
    const onLeave = () => {
      gsap.to('.hero-photo-wrap', { x: 0, y: 0, duration: 1.1, ease: 'power2.out', overwrite: 'auto' })
      gsap.to('.hero-content',    { x: 0,       duration: 1.1, ease: 'power2.out', overwrite: 'auto' })
    }
    section.addEventListener('mousemove', onMove)
    section.addEventListener('mouseleave', onLeave)
    return () => {
      section.removeEventListener('mousemove', onMove)
      section.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <section id="hero" className="hero" ref={sectionRef} aria-label="Introduction">
      <div ref={vantaRef} className="hero-vanta-bg" aria-hidden="true" />
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-status">
            <span className="status-dot" aria-hidden="true" />
            <span>Open to Summer 2026 Internships</span>
          </div>
          <h1 className="hero-name">
            <CharSplit text="BRUCE" className="hero-name-line1" />
            <CharSplit text="CHENG" className="hero-name-line2" />
          </h1>
          <svg className="hero-name-underline" viewBox="0 0 380 14" fill="none" aria-hidden="true" preserveAspectRatio="none">
            <path d="M2,9 C60,3 130,13 200,8 C260,4 310,12 378,7" stroke="#CBFF47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          </svg>
          <p className="hero-role">Software Engineer · AI Builder · MS @ CMU Silicon Valley</p>
          <p className="hero-tagline">Building AI systems and agentic workflows that actually ship.</p>
          <div className="hero-ctas">
            <a href="#work"    className="btn btn-primary">View My Work →</a>
            <a href="#contact" className="btn btn-ghost">Get in Touch</a>
          </div>
        </div>
        <div className="hero-photo-wrap" aria-hidden="true">
          <img src="/images/profile.jpg" alt="Bruce Cheng" className="hero-photo" />
        </div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <div className="hero-scroll-bar" />
      </div>
    </section>
  )
}
