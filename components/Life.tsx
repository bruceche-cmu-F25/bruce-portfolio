'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function Life() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.artwork-card',
      { y: 28, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.14, ease: 'power3.out',
        scrollTrigger: { trigger: '.artwork-grid', start: 'top 88%' } })
  }, [])

  return (
    <section id="life" className="section" aria-label="Life and interests">
      <div className="container">
        <p className="section-kicker">Beyond Code</p>
        <h2 className="section-heading">Life &amp; Interests</h2>
        <p className="life-lead">Characters and sci-fi scenes I draw between builds.</p>
        <div className="artwork-grid">
          <figure className="artwork-card">
            <img src="/art/gwen.webp" alt="Ghost-Spider in a white hood, painted over orange and teal brushstrokes" loading="lazy" />
          </figure>
          <figure className="artwork-card">
            <img src="/art/sci-fi.webp" alt="Two figures on a lunar surface, with Earth filling the sky" loading="lazy" />
          </figure>
        </div>
      </div>
    </section>
  )
}
