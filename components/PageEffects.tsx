'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Page-level motion that belongs to no single section:
 * the scroll progress hairline, the shared kicker/heading reveals,
 * the starfield parallax, and the reduced-motion escape hatch.
 */
export default function PageEffects() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.to('.scroll-progress', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 'top top', end: 'max', scrub: 0.3 },
      })

      // gentle depth: each star layer drifts at its own rate as the page scrolls
      const drift = [-6, -12, -20]
      gsap.utils.toArray<HTMLElement>('.starfield i').forEach((layer, i) => {
        gsap.to(layer, {
          yPercent: drift[i] ?? -8, ease: 'none',
          scrollTrigger: { start: 'top top', end: 'max', scrub: 1 },
        })
      })

      gsap.utils.toArray<HTMLElement>('.section-kicker').forEach(el => {
        gsap.fromTo(el,
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 91%' } })
      })
      gsap.utils.toArray<HTMLElement>('.section-heading, .about-heading, .contact-heading').forEach(el => {
        gsap.fromTo(el,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.72, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 89%' } })
      })

      gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
        gsap.globalTimeline.timeScale(100)
      })
    })
    return () => ctx.revert()
  }, [])

  return null
}
