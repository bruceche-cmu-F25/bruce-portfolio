'use client'

/** Sizes a pixel scene to a whole number of screen pixels per art pixel.
 *
 *  The scenes are 180×108 grids. Stretched to whatever width a card happens to
 *  be (2.14× on a desktop card), some art pixels land two screen pixels wide
 *  and some three, and every 2:1 diagonal goes ragged. This picks the largest
 *  whole multiple of *device* pixels that fits, and lines the drawing up on
 *  the device-pixel grid, so every art pixel is the same crisp square. Where
 *  the whole step would leave the drawing much smaller than its frame (a
 *  phone's short card), it keeps the plain fit instead.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { ART_HEIGHT, ART_WIDTH } from '@/components/home/pixel/primitives'

export default function PixelFit({ children }: { children: ReactNode }) {
  const box = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = box.current
    const svg = el?.querySelector('svg')
    if (!el || !svg) return

    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) return
      const fill = Math.min(r.width * dpr / ART_WIDTH, r.height * dpr / ART_HEIGHT)
      // whole device pixels when they fill the frame; on a phone's short,
      // dense frame the nearest whole step can be a fifth smaller, so there
      // it keeps the full fit — at that density the unevenness can't be seen
      const k = Math.floor(fill) >= 1 && Math.floor(fill) / fill >= 0.9 ? Math.floor(fill) : fill
      const w = ART_WIDTH * k / dpr, h = ART_HEIGHT * k / dpr
      // centred, then nudged onto a device-pixel boundary
      const left = Math.round((r.left + (r.width - w) / 2) * dpr) / dpr - r.left
      const top = Math.round((r.top + (r.height - h) / 2) * dpr) / dpr - r.top
      svg.style.cssText = `position:absolute;left:${left}px;top:${top}px;width:${w}px;height:${h}px`
    }

    fit()
    const resize = new ResizeObserver(fit)
    resize.observe(el)
    // Re-arm against the current density after every move between screens.
    // A query for the initial density only notices the first move away.
    let density: MediaQueryList
    const watchDensity = () => {
      density?.removeEventListener('change', onDensityChange)
      density = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
      density.addEventListener('change', onDensityChange)
    }
    const onDensityChange = () => { fit(); watchDensity() }
    watchDensity()
    return () => { resize.disconnect(); density.removeEventListener('change', onDensityChange) }
  }, [])

  return <span ref={box} className="pixel-fit">{children}</span>
}
