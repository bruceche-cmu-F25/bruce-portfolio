'use client'
import { useEffect, useRef } from 'react'

const STRIPES = [
  { r: 196, g: 18,  b: 48,  a: 0.75, w: 3   }, // crimson thick
  { r: 255, g: 184, b: 28,  a: 0.50, w: 1.5 }, // gold thin
  { r: 27,  g: 115, b: 64,  a: 0.60, w: 2   }, // forest
  { r: 10,  g: 35,  b: 90,  a: 0.45, w: 1.5 }, // navy
  { r: 196, g: 18,  b: 48,  a: 0.40, w: 1   }, // crimson thin
  { r: 255, g: 184, b: 28,  a: 0.65, w: 2   }, // gold medium
  { r: 27,  g: 115, b: 64,  a: 0.40, w: 1   }, // forest thin
  { r: 196, g: 18,  b: 48,  a: 0.55, w: 2.5 }, // crimson
  { r: 10,  g: 35,  b: 90,  a: 0.35, w: 1   }, // navy thin
]
const SPACING = 20
const N = STRIPES.length

export default function TartanWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    // Non-null assertion so TypeScript sees a stable HTMLCanvasElement in all closures
    const cvs = canvasRef.current as HTMLCanvasElement
    const ctx  = cvs.getContext('2d')!

    function resize() { cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cvs)

    let t = 0, raf = 0

    function drawDiag(dir: 1 | -1, alpha: number) {
      const W = cvs.width, H = cvs.height
      for (let s = -H; s < W + H; s += SPACING) {
        const stripe = STRIPES[((Math.floor(s / SPACING) % N) + N) % N]
        ctx.strokeStyle = `rgba(${stripe.r},${stripe.g},${stripe.b},${stripe.a * alpha})`
        ctx.lineWidth   = stripe.w
        ctx.beginPath()
        let first = true
        for (let x = 0; x <= W; x += 4) {
          const wave = Math.sin(x * 0.007 + t * dir * 0.6) * 22
                     + Math.sin(x * 0.002 + t * dir * 0.25) * 12
          const y = dir === 1 ? x + s + wave : -x + s + H * 0.5 + wave
          first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cvs.width, cvs.height)
      ctx.globalCompositeOperation = 'source-over'
      drawDiag(1, 0.9)
      ctx.globalCompositeOperation = 'screen'
      drawDiag(-1, 0.55)
      ctx.globalCompositeOperation = 'source-over'
      t += 0.006
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
      aria-hidden="true"
    />
  )
}
