'use client'
import { useEffect, useRef } from 'react'

// Full tartan palette — teal primary, crimson/gold/forest/navy as supporting
// Saturation pulled back ~15% from pure tartan values for visual comfort
const STRIPES_A = [
  { r: 0,   g: 175, b: 150, a: 0.85, w: 3.0 }, // teal primary thick
  { r: 185, g: 22,  b: 45,  a: 0.80, w: 2.0 }, // crimson
  { r: 25,  g: 100, b: 55,  a: 0.70, w: 1.5 }, // forest green
  { r: 190, g: 145, b: 20,  a: 0.65, w: 1.5 }, // muted gold (not orange)
  { r: 12,  g: 40,  b: 100, a: 0.45, w: 1.0 }, // navy
  { r: 0,   g: 175, b: 150, a: 0.55, w: 1.0 }, // teal thin
  { r: 185, g: 22,  b: 45,  a: 0.45, w: 1.0 }, // crimson thin
  { r: 38,  g: 165, b: 95,  a: 0.65, w: 2.0 }, // bright green
  { r: 0,   g: 175, b: 150, a: 0.72, w: 2.0 }, // teal medium
  { r: 190, g: 145, b: 20,  a: 0.45, w: 1.0 }, // gold thin
]

const STRIPES_B = [
  { r: 185, g: 22,  b: 45,  a: 0.78, w: 2.5 }, // crimson thick
  { r: 0,   g: 175, b: 150, a: 0.60, w: 1.5 }, // teal
  { r: 25,  g: 100, b: 55,  a: 0.72, w: 2.0 }, // forest thick
  { r: 12,  g: 40,  b: 100, a: 0.38, w: 1.0 }, // navy
  { r: 190, g: 145, b: 20,  a: 0.55, w: 1.5 }, // gold
  { r: 185, g: 22,  b: 45,  a: 0.42, w: 1.0 }, // crimson thin
  { r: 38,  g: 165, b: 95,  a: 0.55, w: 1.5 }, // bright green
  { r: 0,   g: 175, b: 150, a: 0.80, w: 1.0 }, // teal thin
]

const SPACING = 28   // px between stripe centres
const SPEED_A = 55   // px/sec — NW→SE set
const SPEED_B = 38   // px/sec — NE→SW set (opposite direction)

type Stripe = { r: number; g: number; b: number; a: number; w: number }
function si(arr: Stripe[], i: number, sp: number): Stripe {
  return arr[((Math.floor(i / sp) % arr.length) + arr.length) % arr.length]
}

export default function TartanWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const cvs = canvasRef.current as HTMLCanvasElement
    const ctx  = cvs.getContext('2d')!

    // Size canvas to match CSS display size
    function setSize() {
      cvs.width  = cvs.clientWidth
      cvs.height = cvs.clientHeight
    }
    setSize()

    // Debounced resize — avoids canvas reset mid-animation
    let resizeId = 0
    function onResize() {
      clearTimeout(resizeId)
      resizeId = window.setTimeout(setSize, 120) as unknown as number
    }
    window.addEventListener('resize', onResize)

    let elapsed = 0
    let lastTs  = -1
    let raf     = 0

    function draw(ts: number) {
      // Initialize timestamp on the very first frame so dt starts at 0
      if (lastTs < 0) lastTs = ts

      const dt  = Math.min(ts - lastTs, 50)   // cap at 50ms to survive tab-switch resume
      lastTs    = ts
      elapsed  += dt

      const W = cvs.width
      const H = cvs.height

      // Clear with the bg color so alpha compositing looks right
      ctx.clearRect(0, 0, W, H)

      // Phase offset for each set — wraps every SPACING pixels for seamless loop
      const pA = (elapsed * SPEED_A / 1000) % SPACING
      const pB = (elapsed * SPEED_B / 1000) % SPACING

      // ── Set A: NW→SE diagonal lines (y = x + c)
      // Visible when −W ≤ c ≤ H  →  i from −(W+SPACING) to H
      ctx.globalCompositeOperation = 'source-over'
      for (let i = -(W + SPACING); i <= H; i += SPACING) {
        const c = i + pA
        const s = si(STRIPES_A, i, SPACING) as typeof STRIPES_A[0]
        ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${s.a})`
        ctx.lineWidth   = s.w
        ctx.beginPath()
        ctx.moveTo(0, c)
        ctx.lineTo(W, c + W)
        ctx.stroke()
      }

      // ── Set B: NE→SW diagonal lines (y = −x + c)
      // Visible when 0 ≤ c ≤ W+H  →  i from 0 to W+H+SPACING
      ctx.globalCompositeOperation = 'screen'
      for (let i = 0; i <= W + H + SPACING; i += SPACING) {
        const c = i - pB
        const s = si(STRIPES_B, i, SPACING) as typeof STRIPES_B[0]
        ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${s.a * 0.65})`
        ctx.lineWidth   = s.w
        ctx.beginPath()
        ctx.moveTo(0, c)
        ctx.lineTo(W, c - W)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.62 }}
      aria-hidden="true"
    />
  )
}
