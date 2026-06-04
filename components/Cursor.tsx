'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

export default function Cursor() {
  useEffect(() => {
    const dot  = document.querySelector<HTMLElement>('.cursor-dot')
    const ring = document.querySelector<HTMLElement>('.cursor-ring')
    if (!dot || !ring || !window.matchMedia('(pointer:fine)').matches) return

    document.body.classList.add('has-custom-cursor')
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 })

    const onMove = (e: MouseEvent) => {
      gsap.to(dot,  { x: e.clientX, y: e.clientY, duration: 0.07, ease: 'none' })
      gsap.to(ring, { x: e.clientX, y: e.clientY, duration: 0.40, ease: 'power3.out' })
    }
    document.addEventListener('mousemove', onMove)

    const hoverEls = document.querySelectorAll('a, button, .btn, .bento-card, .exp-card, .hobby-card, .contact-card, .stack-pills span')
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hovered'))
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hovered'))
    })

    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <>
      <div className="cursor-dot"  aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
    </>
  )
}
