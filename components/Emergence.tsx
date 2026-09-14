'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * The way out. The hero ends by falling into the black hole; this is the other
 * mouth, just before Contact. Scroll scrubs it the same way the dive is scrubbed:
 *
 *   dark → a single point of light → it opens and the light pours out past you,
 *   stars stretching into streaks → the stream slows, the mouth shrinks behind
 *   you until it is gone → the scene's own black lifts, the page's real
 *   starfield is simply there, and the children (Contact's heading) are
 *   already on screen in ordinary space.
 *
 * Star travel is a pure function of scroll progress, not of time, so stopping
 * mid-scroll freezes the frame and scrolling back runs it in reverse — the same
 * contract as the dive.
 */

const TRAVEL = 5.5 // how many star-tunnel depths the whole exit covers

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** how fast you're being carried out, 0…1 */
const speedAt = (p: number) => smooth(0.06, 0.3, p) * (1 - smooth(0.4, 0.9, p))

type Star = { x: number; y: number; z0: number; tone: number }

export default function Emergence({ children }: { children?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = canvas.getContext('2d')!
    const copy = copyRef.current

    // distance travelled by progress p = ∫ speed dp, tabulated once
    const N = 400
    const dist = new Float32Array(N + 1)
    for (let i = 1; i <= N; i++) dist[i] = dist[i - 1] + speedAt(i / N) / N
    const distAt = (p: number) => {
      const f = clamp01(p) * N
      const i = Math.floor(f)
      return i >= N ? dist[N] : dist[i] + (dist[i + 1] - dist[i]) * (f - i)
    }

    const count = window.innerWidth < 700 ? 300 : 560
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: (Math.random() * 2 - 1) * 1.3,
      y: (Math.random() * 2 - 1) * 1.3,
      z0: Math.random(),
      tone: Math.random(),
    }))

    let w = 0, h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const state = { p: 0 }

    const draw = () => {
      const p = state.p
      const cx = w / 2, cy = h / 2, m = Math.min(w, h)
      ctx.clearRect(0, 0, w, h)

      // the scene's own darkness: comes up as you enter, lifts once you're out
      const dark = smooth(0, 0.1, p) * (1 - smooth(0.62, 0.92, p))
      if (dark > 0) {
        ctx.fillStyle = `rgba(3, 4, 8, ${dark})`
        ctx.fillRect(0, 0, w, h)
      }

      const s = speedAt(p)
      const D = distAt(p) * TRAVEL
      const f = m * 0.5
      // our stars hand over to the page's starfield at the end
      const starFade = smooth(0.03, 0.12, p) * (1 - 0.75 * smooth(0.8, 1, p))

      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'
      for (const st of stars) {
        const zz = (((st.z0 - D) % 1) + 1) % 1
        const z = 0.03 + zz * 0.97
        const sx = cx + (st.x * f) / z
        const sy = cy + (st.y * f) / z
        if (sx < -40 || sx > w + 40 || sy < -40 || sy > h + 40) continue
        const near = 1 - z
        const a = starFade * (0.18 + 0.82 * near * near)
        const warm = st.tone > 0.7 ? '243, 206, 139' : '255, 244, 226'
        if (s > 0.02) {
          // a streak from where the star was a moment of travel ago
          const zt = Math.min(1, z + s * 0.09)
          const tx = cx + (st.x * f) / zt
          const ty = cy + (st.y * f) / zt
          ctx.strokeStyle = `rgba(${warm}, ${a})`
          ctx.lineWidth = 0.5 + near * 1.6
          ctx.beginPath()
          ctx.moveTo(tx, ty)
          ctx.lineTo(sx, sy)
          ctx.stroke()
        } else {
          ctx.fillStyle = `rgba(${warm}, ${a})`
          const r = 0.4 + near * 1.1
          ctx.fillRect(sx - r / 2, sy - r / 2, r, r)
        }
      }

      // the mouth: a point, then a flood, then a distant star behind you.
      // The instant you pass through it the core swells past the screen edges,
      // so the flash is the light itself rather than a flat wash laid on top.
      const on = smooth(0.02, 0.12, p) * (1 - smooth(0.6, 0.8, p))
      const open = smooth(0.05, 0.3, p) * (1 - smooth(0.3, 0.88, p))
      const through = smooth(0.2, 0.29, p) * (1 - smooth(0.29, 0.42, p))
      const R = m * (0.012 + 0.5 * open + 0.85 * through)
      if (on > 0) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
        g.addColorStop(0, `rgba(255, 252, 244, ${on})`)
        g.addColorStop(0.16, `rgba(255, 238, 206, ${0.92 * on})`)
        g.addColorStop(0.45, `rgba(243, 206, 139, ${0.32 * on})`)
        g.addColorStop(1, 'rgba(212, 162, 78, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.globalCompositeOperation = 'source-over'

      // the heading surfaces as the last of the light goes
      if (copy) {
        const t = smooth(0.66, 0.84, p)
        copy.style.opacity = String(t)
        copy.style.transform = `translateY(${(1 - t) * 18}px)`
      }
    }

    resize()
    draw()
    const ro = new ResizeObserver(() => { resize(); draw() })
    ro.observe(canvas)

    const tween = gsap.to(state, {
      p: 1, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 1 },
      onUpdate: draw,
    })

    return () => {
      ro.disconnect()
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return (
    <div className="emergence" ref={rootRef}>
      {/* where the nav's Contact link lands: the frame the heading has fully
          surfaced in, not the start of the tunnel */}
      <span className="emergence-land" data-nav-land aria-hidden="true" />
      <div className="emergence-stage">
        <canvas ref={canvasRef} aria-hidden="true" />
        {/* visible by default, so reduced motion (no animation) still shows it */}
        <div className="emergence-copy" ref={copyRef}>{children}</div>
      </div>
    </div>
  )
}
