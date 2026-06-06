'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

const HOVER_SEL = 'a, button, [role="button"], .work-card, .hobby-card, .contact-card, .edu-card, label, input, textarea'

export default function Cursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const cross = document.querySelector<HTMLElement>('.cursor-cross')
    const top   = cross?.querySelector<HTMLElement>('.c-t')
    const right = cross?.querySelector<HTMLElement>('.c-r')
    const bot   = cross?.querySelector<HTMLElement>('.c-b')
    const left  = cross?.querySelector<HTMLElement>('.c-l')
    if (!cross || !top || !right || !bot || !left) return

    document.body.classList.add('has-custom-cursor')
    gsap.set(cross, { autoAlpha: 0 })

    let mx = -400, my = -400
    let visible  = false
    let hovering = false

    // Crosshair snaps exactly — precision is the point
    const tick = () => { gsap.set(cross, { x: mx, y: my }) }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // Mouse position
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      if (!visible) {
        visible = true
        gsap.to(cross, { autoAlpha: 0.82, duration: 0.3, ease: 'power2.out' })
      }
    }
    document.addEventListener('mousemove', onMove)

    // Window leave / enter
    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget !== null) return
      visible = false
      gsap.to(cross, { autoAlpha: 0, duration: 0.2 })
    }
    const onEnter = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      gsap.set(cross, { x: mx, y: my })   // snap — don't fly in from last position
      visible = true
      gsap.to(cross, { autoAlpha: 0.82, duration: 0.15 })
    }
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    // Hover — arms extend outward
    const enterHover = () => {
      if (hovering) return
      hovering = true
      gsap.to(top,   { height: 16, bottom: 5, duration: 0.2, ease: 'power2.out' })
      gsap.to(bot,   { height: 16, top:    5, duration: 0.2, ease: 'power2.out' })
      gsap.to(right, { width:  16, left:   5, duration: 0.2, ease: 'power2.out' })
      gsap.to(left,  { width:  16, right:  5, duration: 0.2, ease: 'power2.out' })
      gsap.to(cross, { autoAlpha: 1, duration: 0.15 })
    }
    const leaveHover = () => {
      if (!hovering) return
      hovering = false
      gsap.to(top,   { height: 9, bottom: 4, duration: 0.22, ease: 'power2.out' })
      gsap.to(bot,   { height: 9, top:    4, duration: 0.22, ease: 'power2.out' })
      gsap.to(right, { width:  9, left:   4, duration: 0.22, ease: 'power2.out' })
      gsap.to(left,  { width:  9, right:  4, duration: 0.22, ease: 'power2.out' })
      gsap.to(cross, { autoAlpha: 0.82, duration: 0.2 })
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

    // Click — squish + bounce
    const onDown = () =>
      gsap.to(cross, { scale: 0.55, duration: 0.09, ease: 'power3.in', overwrite: 'auto' })
    const onUp = () =>
      gsap.to(cross, { scale: 1, duration: 0.5, ease: 'back.out(4)', overwrite: 'auto' })
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
    <div className="cursor-cross" aria-hidden="true">
      <span className="c-t" />
      <span className="c-r" />
      <span className="c-b" />
      <span className="c-l" />
    </div>
  )
}
