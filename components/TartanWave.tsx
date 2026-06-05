'use client'
import { useEffect, useRef } from 'react'

// CMU tartan — teal/green primary, crimson/navy supporting
const STRIPES_A = [
  { r: 0,   g: 196, b: 167, a: 0.90, w: 3   }, // teal thick
  { r: 27,  g: 115, b: 64,  a: 0.65, w: 1.5 }, // forest
  { r: 196, g: 18,  b: 48,  a: 0.70, w: 2   }, // crimson
  { r: 10,  g: 35,  b: 90,  a: 0.40, w: 1   }, // navy
  { r: 0,   g: 196, b: 167, a: 0.50, w: 1   }, // teal thin
  { r: 196, g: 18,  b: 48,  a: 0.40, w: 1.5 }, // crimson thin
  { r: 45,  g: 200, b: 110, a: 0.60, w: 2   }, // bright green
  { r: 10,  g: 35,  b: 90,  a: 0.30, w: 1   }, // navy thin
  { r: 0,   g: 196, b: 167, a: 0.75, w: 2   }, // teal medium
]

const STRIPES_B = [
  { r: 196, g: 18,  b: 48,  a: 0.75, w: 2.5 }, // crimson thick
  { r: 0,   g: 196, b: 167, a: 0.55, w: 1.5 }, // teal
  { r: 27,  g: 115, b: 64,  a: 0.70, w: 2   }, // forest thick
  { r: 10,  g: 35,  b: 90,  a: 0.35, w: 1   }, // navy
  { r: 196, g: 18,  b: 48,  a: 0.45, w: 1   }, // crimson thin
  { r: 45,  g: 200, b: 110, a: 0.50, w: 1.5 }, // bright green
  { r: 0,   g: 196, b: 167, a: 0.80, w: 1   }, // teal thin
  { r: 196, g: 18,  b: 48,  a: 0.60, w: 2   }, // crimson
]

const SPACING = 26  // px between stripe centres
const NA = STRIPES_A.length
const NB = STRIPES_B.length

function stripe(arr: typeof STRIPES_A, i: number) {
  return arr[((Math.floor(i / SPACING) % arr.length) + arr.length) % arr.length]
}

export default function TartanWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const cvs = canvasRef.current as HTMLCanvasElement
    const ctx  = cvs.getContext('2d')!

    function resize() { cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cvs)

    // Time-based offsets (ms) for frame-rate independence
    let lastTs = 0
    let elapsed = 0
    const SPEED_A = 55  // px / sec  — NW→SE set travels this fast
    const SPEED_B = 38  // px / sec  — NE→SW set travels opposite direction, slower

    let raf = 0

    function drawSet(
      stripes: typeof STRIPES_A,
      dir: 1 | -1,
      phase: number,
      alphaScale: number,
      blendMode: GlobalCompositeOperation
    ) {
      const W = cvs.width, H = cvs.height
      ctx.globalCompositeOperation = blendMode

      for (let i = -(H + W + SPACING); i <= W + H + SPACING; i += SPACING) {
        const c = i + phase * dir
        const s = stripes[((Math.floor(i / SPACING) % stripes.length) + stripes.length) % stripes.length]
        ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${s.a * alphaScale})`
        ctx.lineWidth   = s.w
        ctx.beginPath()
        if (dir === 1) {
          // y = x + c  →  NW→SE
          ctx.moveTo(0, c)
          ctx.lineTo(W, c + W)
        } else {
          // y = -x + c  →  NE→SW (using c measured from top-right corner)
          ctx.moveTo(0, c)
          ctx.lineTo(W, c - W)
        }
        ctx.stroke()
      }
    }

    function draw(ts: number) {
      const dt = Math.min(ts - lastTs, 50)  // cap at 50ms so big pauses don't jump
      lastTs  = ts
      elapsed += dt

      const W = cvs.width, H = cvs.height
      ctx.clearRect(0, 0, W, H)

      const phaseA = (elapsed * SPEED_A / 1000) % SPACING   // phase cycles every SPACING pixels
      const phaseB = (elapsed * SPEED_B / 1000) % SPACING

      ctx.globalCompositeOperation = 'source-over'

      // Set A: NW→SE lines marching downward-right
      drawSet(STRIPES_A, 1, phaseA, 0.95, 'source-over')

      // Set B: NE→SW lines marching upward-right — screen blend so crossings glow
      // Their reference offset runs from 0 to W+H covering the canvas
      ctx.globalCompositeOperation = 'screen'
      for (let i = -(H); i <= W + H + SPACING; i += SPACING) {
        const c = (i + H * 0.5) - phaseB  // NE→SW: y = -x + c
        const s = STRIPES_B[((Math.floor(i / SPACING) % NB) + NB) % NB]
        ctx.strokeStyle = `rgba(${s.r},${s.g},${s.b},${s.a * 0.6})`
        ctx.lineWidth   = s.w
        ctx.beginPath()
        ctx.moveTo(0, c)
        ctx.lineTo(W, c - W)
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame((ts) => { lastTs = ts; raf = requestAnimationFrame(draw) })
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6 }}
      aria-hidden="true"
    />
  )
}
