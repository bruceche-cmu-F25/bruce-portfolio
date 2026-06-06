'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

// Selector for interactive elements (event delegation — picks up dynamic content)
const HOVER_SEL = 'a, button, [role="button"], label, input, textarea, select, .work-card, .hobby-card, .contact-card, .edu-card'

export default function Cursor() {
  useEffect(() => {
    // Only on true pointer devices (not touch)
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot  = document.querySelector<HTMLElement>('.cursor-dot')
    const ring = document.querySelector<HTMLElement>('.cursor-ring')
    if (!dot || !ring) return

    document.body.classList.add('has-custom-cursor')

    // Start both off-screen and invisible
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, autoAlpha: 0 })

    // Tracked state
    let mx = -200, my = -200   // mouse position (start offscreen)
    let rx = -200, ry = -200   // ring lerp position
    let px = -200, py = -200   // previous frame mouse (for velocity)
    let hovering  = false
    let dotBusy   = false      // true while dot bounce-in is playing
    let visible   = false

    const LERP = 0.115  // ring lag factor — lower = more lag

    // ── GSAP ticker: runs every frame, no per-event tween creation ──────
    const tick = () => {
      // Ring follows mouse with smooth lag
      rx += (mx - rx) * LERP
      ry += (my - ry) * LERP
      gsap.set(ring, { x: rx, y: ry })

      // Dot always snaps to exact mouse position
      gsap.set(dot, { x: mx, y: my })

      // Velocity-based stretch: dot becomes a pill in direction of movement
      if (!hovering && !dotBusy) {
        const vx = mx - px
        const vy = my - py
        const speed = Math.sqrt(vx * vx + vy * vy)

        if (speed > 0.8) {
          const angle = Math.atan2(vy, vx) * (180 / Math.PI)
          const sx = 1 + Math.min(speed * 0.055, 1.0)
          const sy = 1 / (1 + Math.min(speed * 0.028, 0.5))
          gsap.set(dot, { scaleX: sx, scaleY: sy, rotation: angle })
        } else {
          gsap.set(dot, { scaleX: 1, scaleY: 1, rotation: 0 })
        }
      }

      px = mx; py = my
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)  // prevent large dt spikes after tab-switch

    // ── Mouse position tracking ──────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!visible) {
        visible = true
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
      }
    }
    document.addEventListener('mousemove', onMove)

    // ── Window enter / leave ─────────────────────────────────────────────
    const onDocLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        visible = false
        gsap.to([dot, ring], { autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
      }
    }
    const onDocEnter = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY
      rx = mx; ry = my  // snap ring so it doesn't slide in from offscreen
      visible = true
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 })
    }
    document.addEventListener('mouseleave', onDocLeave)
    document.addEventListener('mouseenter', onDocEnter)

    // ── Hover: expand ring, hide dot ─────────────────────────────────────
    const enterHover = (isCard: boolean) => {
      if (hovering) return
      hovering = true
      dotBusy = false
      gsap.killTweensOf(dot)
      const ringSize = isCard ? 58 : 46
      gsap.to(ring, { width: ringSize, height: ringSize, borderColor: 'rgba(0,196,167,0.9)', duration: 0.22, ease: 'power2.out' })
      gsap.to(dot,  { scale: 0, duration: 0.15, ease: 'power2.in' })
    }

    const leaveHover = () => {
      if (!hovering) return
      hovering = false
      dotBusy = true
      gsap.killTweensOf(dot)
      gsap.to(ring, { width: 28, height: 28, borderColor: 'rgba(0,196,167,0.45)', duration: 0.28, ease: 'power2.out' })
      gsap.to(dot,  {
        scale: 1, scaleX: 1, scaleY: 1, rotation: 0,
        duration: 0.38, ease: 'back.out(2.5)',
        onComplete() { dotBusy = false },
      })
    }

    // Event delegation — works on elements added after mount
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element
      if (!t.closest(HOVER_SEL)) return
      const isCard = !!t.closest('.work-card, .hobby-card, .contact-card, .edu-card')
      enterHover(isCard)
    }
    const onOut = (e: MouseEvent) => {
      const rel = e.relatedTarget as Element | null
      if (rel?.closest(HOVER_SEL)) return  // still inside an interactive element
      leaveHover()
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout',  onOut)

    // ── Click: ring squish + bounce ──────────────────────────────────────
    const onDown = () => gsap.to(ring, { scale: 0.70, duration: 0.09, ease: 'power3.in',  overwrite: 'auto' })
    const onUp   = () => gsap.to(ring, { scale: 1,    duration: 0.55, ease: 'back.out(4)', overwrite: 'auto' })
    document.addEventListener('mousedown', onDown)
    document.addEventListener('mouseup',   onUp)

    return () => {
      gsap.ticker.remove(tick)
      document.removeEventListener('mousemove',  onMove)
      document.removeEventListener('mouseleave', onDocLeave)
      document.removeEventListener('mouseenter', onDocEnter)
      document.removeEventListener('mouseover',  onOver)
      document.removeEventListener('mouseout',   onOut)
      document.removeEventListener('mousedown',  onDown)
      document.removeEventListener('mouseup',    onUp)
      document.body.classList.remove('has-custom-cursor')
    }
  }, [])

  return (
    <>
      <div className="cursor-dot"  aria-hidden="true" />
      <div className="cursor-ring" aria-hidden="true" />
    </>
  )
}
