'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

const HOVER_SEL = 'a, button, [role="button"], .work-card, .hobby-card, .contact-card, .edu-card, label, input, textarea'

/** Celestial cursor: a bright gold star-dot that snaps to the pointer,
 *  with a thin gold halo trailing on a soft lag. The halo blooms open
 *  over interactive elements and contracts on press. */
export default function Cursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot  = document.querySelector<HTMLElement>('.cursor-dot')
    const halo = document.querySelector<HTMLElement>('.cursor-halo')
    if (!dot || !halo) return

    document.body.classList.add('has-custom-cursor')
    gsap.set([dot, halo], { autoAlpha: 0 })

    let mx = -400, my = -400
    let hx = -400, hy = -400   // halo position, eased toward the pointer
    let visible  = false
    let hovering = false

    // dot snaps exactly; the halo drifts behind like it has mass
    const tick = () => {
      gsap.set(dot, { x: mx, y: my })
      hx += (mx - hx) * 0.16
      hy += (my - hy) * 0.16
      gsap.set(halo, { x: hx, y: hy })
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (!visible) {
        visible = true
        gsap.to(dot,  { autoAlpha: 1,    duration: 0.3, ease: 'power2.out' })
        gsap.to(halo, { autoAlpha: 0.85, duration: 0.3, ease: 'power2.out' })
      }
    }
    document.addEventListener('mousemove', onMove)

    // Window leave / enter
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return
      visible = false
      gsap.to([dot, halo], { autoAlpha: 0, duration: 0.2 })
    }
    const onEnter = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      hx = mx; hy = my
      gsap.set(dot,  { x: mx, y: my })   // snap — don't fly in from last position
      gsap.set(halo, { x: hx, y: hy })
      visible = true
      gsap.to(dot,  { autoAlpha: 1,    duration: 0.15 })
      gsap.to(halo, { autoAlpha: 0.85, duration: 0.15 })
    }
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    // Hover — the halo blooms, the star settles
    const enterHover = () => {
      if (hovering) return
      hovering = true
      gsap.to(halo, {
        scale: 1.6, autoAlpha: 1,
        borderColor: 'rgba(243,206,139,0.9)',
        backgroundColor: 'rgba(212,162,78,0.06)',
        duration: 0.3, ease: 'power3.out', overwrite: 'auto',
      })
      gsap.to(dot, { scale: 0.55, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
    }
    const leaveHover = () => {
      if (!hovering) return
      hovering = false
      gsap.to(halo, {
        scale: 1, autoAlpha: 0.85,
        borderColor: 'rgba(212,162,78,0.55)',
        backgroundColor: 'rgba(212,162,78,0)',
        duration: 0.35, ease: 'power2.out', overwrite: 'auto',
      })
      gsap.to(dot, { scale: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
    }

    const onOver = (e: MouseEvent) => {
      if ((e.target as Element).closest(HOVER_SEL)) enterHover()
    }
    const onOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as Element | null
      if (!rel?.closest(HOVER_SEL)) leaveHover()
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)

    // Click — the halo contracts around the star, then springs back
    const onDown = () => {
      gsap.to(halo, { scale: hovering ? 1.15 : 0.72, duration: 0.12, ease: 'power3.in', overwrite: 'auto' })
      gsap.to(dot,  { scale: 0.7, duration: 0.1, ease: 'power3.in', overwrite: 'auto' })
    }
    const onUp = () => {
      gsap.to(halo, { scale: hovering ? 1.6 : 1, duration: 0.55, ease: 'back.out(3)', overwrite: 'auto' })
      gsap.to(dot,  { scale: hovering ? 0.55 : 1, duration: 0.4, ease: 'back.out(3)', overwrite: 'auto' })
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)

    return () => {
      gsap.ticker.remove(tick)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
      document.removeEventListener('mouseover',  onOver)
      document.removeEventListener('mouseout',   onOut)
      document.removeEventListener('mousedown',  onDown)
      document.removeEventListener('mouseup',    onUp)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div className="cursor-halo" aria-hidden="true" />
      <div className="cursor-dot" aria-hidden="true" />
    </>
  )
}
