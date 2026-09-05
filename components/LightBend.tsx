'use client'
import { useEffect } from 'react'

/**
 * All the photon rendering on the page, on one canvas and one loop.
 *
 * Moving the pointer drags a short light trail behind the cursor's star; the
 * tail lengthens and brightens with speed and retracts when you stop.
 *
 * Click anywhere and a point mass appears there for a moment. Photons are
 * launched from a ring around it and their paths are integrated against its
 * pull, so every trail is a real trajectory rather than a straight spark —
 * some swing past on a bent hyperbola, some loop the photon ring once before
 * escaping, and the ones aimed too close spiral in and are absorbed.
 *
 * The force is Newtonian inverse-square with a short-range term added:
 *
 *     a = -GM / r² · (1 + 1.5 · rs / r)
 *
 * That extra term is not general relativity, but it reproduces the part that
 * reads on screen — orbits precess instead of closing, so a captured photon
 * winds inward instead of tracing the same ellipse forever.
 */

const GM = 2.4e6 // px³/s², tuned so a photon orbits at a legible radius
const RS = 10 // px, the absorbing radius
const SPAWN_R = 24 // px, launch ring
const COUNT = 15
const LIFE = 1.15 // s
const TRAIL = 26 // samples kept per photon
const SUBSTEPS = 4 // per frame, so a close pass doesn't tunnel through the mass

const TAIL_MS = 190 // how long a scrap of trail survives behind the cursor
const TAIL_MAX = 48 // ring-buffer cap
const TAIL_WIDTH = 2.6 // px at the head

type Sample = { x: number; y: number; t: number }

type Photon = {
  x: number
  y: number
  vx: number
  vy: number
  trail: number[] // flat x,y pairs, newest last
  captured: boolean
  born: number
}

export default function LightBend() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;z-index:9990;pointer-events:none'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    type Burst = { cx: number; cy: number; born: number; photons: Photon[] }
    let bursts: Burst[] = []
    let trail: Sample[] = []
    const fine = window.matchMedia('(pointer: fine)').matches
    let raf = 0
    let last = 0

    const step = (p: Photon, cx: number, cy: number, dt: number) => {
      for (let s = 0; s < SUBSTEPS; s++) {
        const h = dt / SUBSTEPS
        const dx = cx - p.x
        const dy = cy - p.y
        const r2 = dx * dx + dy * dy + 4 // softened, so the centre can't blow up
        const r = Math.sqrt(r2)
        // inverse-square plus the short-range term that makes orbits precess
        const a = (GM / r2) * (1 + (1.5 * RS) / r)
        p.vx += (dx / r) * a * h
        p.vy += (dy / r) * a * h
        p.x += p.vx * h
        p.y += p.vy * h
        if (r < RS) {
          p.captured = true
          return
        }
      }
    }

    const draw = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
      last = now
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      bursts = bursts.filter(b => now - b.born < LIFE * 1000)
      while (trail.length && now - trail[0].t > TAIL_MS) trail.shift()
      if (!bursts.length && trail.length < 2) {
        last = 0
        return
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalCompositeOperation = 'lighter'

      // the cursor's own wake: newest segment is brightest and widest
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1]
        const b = trail[i]
        const t = 1 - (now - b.t) / TAIL_MS // 1 at the head, 0 at the tip
        if (t <= 0) continue
        const span = Math.hypot(b.x - a.x, b.y - a.y)
        if (span > 180) continue // a jump across the page shouldn't draw a streak
        // a faster pointer emits a longer, hotter wake
        const heat = Math.min(1, span / 26)
        ctx.strokeStyle = `rgba(243, 206, 139, ${t * t * (0.16 + heat * 0.5)})`
        ctx.lineWidth = TAIL_WIDTH * t * (0.55 + heat * 0.6)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      for (const b of bursts) {
        const age = (now - b.born) / 1000
        const fade = Math.max(0, 1 - age / LIFE)

        // the mass itself, and the ring light orbits at
        ctx.strokeStyle = `rgba(212, 162, 78, ${0.3 * fade})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(b.cx, b.cy, RS * 1.5, 0, Math.PI * 2)
        ctx.stroke()

        for (const p of b.photons) {
          if (!p.captured) {
            step(p, b.cx, b.cy, dt)
            p.trail.push(p.x, p.y)
            if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2)
          } else if (p.trail.length > 2) {
            p.trail.splice(0, 2) // absorbed: let the tail drain into the mass
          }

          const n = p.trail.length / 2
          if (n < 2) continue
          // redshift as a photon is captured; escaping light stays gold
          const hue = p.captured ? [176, 74, 44] : [243, 206, 139]
          const weight = p.captured ? 0.45 : 1
          for (let i = 1; i < n; i++) {
            const t = i / (n - 1) // 0 oldest → 1 newest
            ctx.strokeStyle = `rgba(${hue[0]}, ${hue[1]}, ${hue[2]}, ${t * t * fade * weight})`
            ctx.lineWidth = (0.4 + t * 1.5) * (p.captured ? 0.7 : 1)
            ctx.beginPath()
            ctx.moveTo(p.trail[(i - 1) * 2], p.trail[(i - 1) * 2 + 1])
            ctx.lineTo(p.trail[i * 2], p.trail[i * 2 + 1])
            ctx.stroke()
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    const onClick = (e: MouseEvent) => {
      const cx = e.clientX
      const cy = e.clientY
      const vCirc = Math.sqrt(GM / SPAWN_R)
      const photons: Photon[] = []
      for (let i = 0; i < COUNT; i++) {
        const a = (2 * Math.PI * i) / COUNT + Math.random() * 0.2
        const x = cx + Math.cos(a) * SPAWN_R
        const y = cy + Math.sin(a) * SPAWN_R
        // aim off-radial by a varying amount: that spread of impact parameters
        // is what makes some paths escape and others wind in
        const aim = a + (Math.random() - 0.5) * 2.0
        const speed = vCirc * (0.92 + Math.random() * 0.95)
        photons.push({
          x,
          y,
          vx: Math.cos(aim) * speed,
          vy: Math.sin(aim) * speed,
          trail: [x, y],
          captured: false,
          born: performance.now(),
        })
      }
      bursts.push({ cx, cy, born: performance.now(), photons })
      if (bursts.length > 4) bursts.shift()
      if (!raf) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('click', onClick)

    const onMove = (e: MouseEvent) => {
      if (!fine) return
      const now = performance.now()
      const head = trail[trail.length - 1]
      // one sample per few pixels keeps the polyline smooth without flooding it
      if (head && Math.hypot(e.clientX - head.x, e.clientY - head.y) < 2) return
      trail.push({ x: e.clientX, y: e.clientY, t: now })
      if (trail.length > TAIL_MAX) trail.shift()
      if (!raf) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('mousemove', onMove, { passive: true })

    const onLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) trail = []
    }
    document.addEventListener('mouseleave', onLeave)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }, [])

  return null
}
