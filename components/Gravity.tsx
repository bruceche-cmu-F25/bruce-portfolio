'use client'
import { useEffect } from 'react'
import gsap from 'gsap'

/** Cards in the résumé are still inside the hero's gravity well: a light source
 *  bends across each one as the pointer passes, and the card leans toward it.
 *
 *  The lean has to go through GSAP rather than the stylesheet. Each section's
 *  reveal animation writes an inline `transform` on these same elements, which
 *  beats any `transform` a CSS rule sets — that is also why the old
 *  `:hover { transform: translateY(-8px) }` never actually fired. Letting GSAP
 *  own the transform lets the lean, the lift and the reveal compose. The light
 *  itself is a background, so it stays in CSS as --px / --py. */
const CARDS = '.work-card, .exp-card, .contact-card, .edu-card, .stat-tile, .hobby-card'

/** degrees of lean at the corners, and how far the card lifts under the pointer */
const TILT = 5
const LIFT: Record<string, number> = { 'work-card': -8, 'contact-card': -3, 'edu-card': -2 }

type Setters = {
  rx: (v: number) => void
  ry: (v: number) => void
  y: (v: number) => void
}

export default function Gravity() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const setters = new WeakMap<HTMLElement, Setters>()
    const get = (el: HTMLElement): Setters => {
      let s = setters.get(el)
      if (!s) {
        gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 50%' })
        s = {
          rx: gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }),
          ry: gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' }),
        }
        setters.set(el, s)
      }
      return s
    }

    const liftFor = (el: HTMLElement) =>
      Object.entries(LIFT).find(([cls]) => el.classList.contains(cls))?.[1] ?? 0

    let raf = 0
    let pending: { el: HTMLElement; x: number; y: number } | null = null

    const apply = () => {
      raf = 0
      if (!pending) return
      const { el, x, y } = pending
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`)
      const s = get(el)
      // lean toward the pointer: the far edge lifts, the near edge drops
      s.ry((x - 0.5) * 2 * TILT)
      s.rx((0.5 - y) * 2 * TILT)
      s.y(liftFor(el))
    }

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element)?.closest<HTMLElement>(CARDS)
      if (!el) return
      const r = el.getBoundingClientRect()
      pending = {
        el,
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      }
      if (!raf) raf = requestAnimationFrame(apply)
    }

    // let go when the pointer leaves the card, not when it crosses a child
    const onOut = (e: PointerEvent) => {
      const el = (e.target as Element)?.closest<HTMLElement>(CARDS)
      if (!el || el.contains(e.relatedTarget as Node)) return
      if (pending?.el === el) pending = null
      const s = get(el)
      s.rx(0); s.ry(0); s.y(0)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [])

  return null
}
