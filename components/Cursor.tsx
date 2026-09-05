'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

const HOVER_SEL = 'a, button, [role="button"], .work-card, .hobby-card, .contact-card, .edu-card, label, input, textarea'

/** Celestial cursor: a single bright gold star-dot that snaps to the pointer.
 *  It swells over interactive elements and contracts on press. */
export default function Cursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot = document.querySelector<HTMLElement>('.cursor-dot')
    if (!dot) return

    document.body.classList.add('has-custom-cursor')
    gsap.set(dot, { autoAlpha: 0 })

    let mx = -400, my = -400
    let visible = false
    let hovering = false

    const tick = () => { gsap.set(dot, { x: mx, y: my }) }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (!visible) {
        visible = true
        gsap.to(dot, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
      }
    }
    document.addEventListener('mousemove', onMove)

    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return
      visible = false
      gsap.to(dot, { autoAlpha: 0, duration: 0.2 })
    }
    const onEnter = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      gsap.set(dot, { x: mx, y: my })   // snap — don't fly in from last position
      visible = true
      gsap.to(dot, { autoAlpha: 1, duration: 0.15 })
    }
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    // Hover — the star swells. With the ring gone this is the only affordance,
    // so it grows rather than shrinking the way it used to alongside the halo.
    const enterHover = () => {
      if (hovering) return
      hovering = true
      gsap.to(dot, { scale: 2.4, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
    }
    const leaveHover = () => {
      if (!hovering) return
      hovering = false
      gsap.to(dot, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: 'auto' })
    }

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(HOVER_SEL)) enterHover()
    }
    const onOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as Element | null
      if (!rel?.closest(HOVER_SEL)) leaveHover()
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)

    const onDown = () => {
      gsap.to(dot, { scale: hovering ? 1.5 : 0.6, duration: 0.12, ease: 'power3.in', overwrite: 'auto' })
    }
    const onUp = () => {
      gsap.to(dot, { scale: hovering ? 2.4 : 1, duration: 0.5, ease: 'back.out(3)', overwrite: 'auto' })
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup', onUp)

    return () => {
      gsap.ticker.remove(tick)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('mouseup', onUp)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [])

  return <div className="cursor-dot" aria-hidden="true" />
}
