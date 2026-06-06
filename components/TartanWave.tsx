'use client'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// ── Coordinate space ────────────────────────────────────────────
const VW = 1600, VH = 900   // 16:9 viewBox (SVG handles scaling)
const SP = 40                // px between stripe centres — denser tartan

// ── Tartan palette ───────────────────────────────────────────────
// Thick stripes cycle across crimson, teal, gold, bright-green, forest.
// Thin accent lines separate them. No single colour dominates.
const PAL = [
  { s: 'rgba(185,22,45,0.92)',  w: 2.8 }, // crimson THICK
  { s: 'rgba(25,100,55,0.72)',  w: 1.1 }, // forest (always visible)
  { s: 'rgba(185,22,45,0.62)',  w: 1.2 }, // crimson medium
  { s: 'rgba(0,175,150,0.90)',  w: 2.6 }, // teal THICK
  { s: 'rgba(12,40,100,0.62)',  w: 1.0 }, // navy (always visible)
  { s: 'rgba(0,175,150,0.65)',  w: 1.1 }, // teal medium
  { s: 'rgba(190,145,20,0.88)', w: 2.8 }, // gold THICK
  { s: 'rgba(0,175,150,0.65)',  w: 1.1 }, // teal medium
  { s: 'rgba(12,40,100,0.60)',  w: 1.0 }, // navy (always visible)
  { s: 'rgba(38,165,95,0.92)',  w: 2.8 }, // bright-green THICK
  { s: 'rgba(12,40,100,0.58)',  w: 1.0 }, // navy (always visible)
  { s: 'rgba(185,22,45,0.62)',  w: 1.2 }, // crimson medium
  { s: 'rgba(25,100,55,0.90)',  w: 2.6 }, // forest THICK
  { s: 'rgba(185,22,45,0.55)',  w: 1.0 }, // crimson (always visible)
] as const

function pal(n: number) { return PAL[((n % PAL.length) + PAL.length) % PAL.length] }

// ── Build SVG path specs at module level (SSR-safe) ──────────────
interface Spec { d: string; stroke: string; sw: number }

// Set A — NW→SE arcs (y = x + c, with gentle upward bow)
const LINES_A: Spec[] = (() => {
  const out: Spec[] = []
  let step = 0
  for (let c = -(VW + SP); c <= VH + SP; c += SP, step++) {
    const { s, w } = pal(step)
    const y1 = c, y2 = c + VW
    const bow = 24  // arc height in viewBox units
    out.push({
      d: `M0,${y1} Q${VW / 2},${(y1 + y2) / 2 - bow} ${VW},${y2}`,
      stroke: s, sw: w,
    })
  }
  return out
})()

// Set B — NE→SW arcs (y = -x + c, with gentle downward bow)
const LINES_B: Spec[] = (() => {
  const out: Spec[] = []
  let step = 0
  for (let c = -SP; c <= VW + VH + SP; c += SP, step++) {
    const { s, w } = pal(step + 3)  // offset palette for variety
    const y1 = c, y2 = c - VW
    const bow = 24
    out.push({
      d: `M0,${y1} Q${VW / 2},${(y1 + y2) / 2 + bow} ${VW},${y2}`,
      stroke: s, sw: w,
    })
  }
  return out
})()

export default function TartanWave() {
  const svgRef = useRef<SVGSVGElement>(null)

  useGSAP(() => {
    const svg = svgRef.current
    if (!svg) return

    const pathsA = Array.from(svg.querySelectorAll<SVGPathElement>('.tw-a'))
    const pathsB = Array.from(svg.querySelectorAll<SVGPathElement>('.tw-b'))

    // Initialise each path for draw-in using its actual arc length
    ;[...pathsA, ...pathsB].forEach(p => {
      const len = p.getTotalLength()
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })
    })

    // ── Entrance: arcs draw in from their starting edge ──────────
    const ENTER = 1.5   // duration per line
    const SA    = 0.022 // stagger between Set-A lines (tighter with more lines)
    const SB    = 0.024 // stagger between Set-B lines

    // Both sets start together — simultaneous entrance from opposite corners
    const ENTRANCE_DELAY = 0.15
    gsap.to(pathsA, {
      strokeDashoffset: 0,
      duration: ENTER,
      stagger: { each: SA, from: 'start' },
      ease: 'power2.inOut',
      delay: ENTRANCE_DELAY,
    })
    gsap.to(pathsB, {
      strokeDashoffset: 0,
      duration: ENTER,
      stagger: { each: SB, from: 'end' },
      ease: 'power2.inOut',
      delay: ENTRANCE_DELAY,
    })

    // Estimate when the last line finishes drawing
    const entranceEnd =
      ENTRANCE_DELAY + Math.max(SA * pathsA.length, SB * pathsB.length) + ENTER + 0.15

    // ── Continuous: per-line strokeWidth pulse ────────────────────
    // Each line gets its own independent infinite yoyo tween (no restarts)
    // so the rotation illusion ripples smoothly across the fabric.
    ;[...pathsA, ...pathsB].forEach((path, i) => {
      const base    = parseFloat(path.getAttribute('stroke-width') ?? '1')
      const dur     = 1.8 + (i % 7) * 0.22   // 1.8 s → 3.1 s, varied per line
      const lineDelay = entranceEnd + i * 0.04  // rolling start

      gsap.fromTo(
        path,
        { strokeWidth: Math.max(0.55, base * 0.35) },  // never thinner than 0.55px
        {
          strokeWidth: base * 2.8,
          duration: dur,
          yoyo: true,
          repeat: -1,
          delay: lineDelay,
          ease: 'sine.inOut',
        },
      )
    })
  }, { scope: svgRef })

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        opacity: 0.65,
      }}
      aria-hidden="true"
    >
      {LINES_A.map((l, i) => (
        <path key={`a${i}`} className="tw-a"
          d={l.d} stroke={l.stroke} strokeWidth={l.sw}
          fill="none" strokeLinecap="round"
        />
      ))}
      {LINES_B.map((l, i) => (
        <path key={`b${i}`} className="tw-b"
          d={l.d} stroke={l.stroke} strokeWidth={l.sw}
          fill="none" strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
