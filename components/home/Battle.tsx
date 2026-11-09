'use client'

/** A tiny sparring match for the player card (Mbti.tsx): Bruce steps in,
 *  swings, and a slime takes the hit — the damage it shows is one of his trait
 *  scores, a different one each round — then he steps back and they go again.
 *
 *  Drawn on a 52×22 canvas, one canvas pixel a sprite pixel, scaled up crisp
 *  by CSS. About ten frames a second, only while it's on screen; the colours
 *  are the page's, so the hour and neon recolour it. With reduced motion it
 *  holds the first frame. */

import { useEffect, useRef } from 'react'

const W = 52
const H = 22
const FRAME_MS = 95
const LOOP = 30
const GROUND = H - 3

/** facing right; h hair, s skin, e eye, b tunic, d boots */
const HERO = [
  '...hhhh.....',
  '..hhhhhh....',
  '..hhssss....',
  '..hsesse....',
  '...ssss.....',
  '..bbbbb.....',
  '.bbbbbbs....',
  '.sbbbbb.....',
]
const LEGS = {
  stand: ['..bb.bb.....', '..dd.dd.....', '.ddd.ddd....'],
  runA: ['..bb..bb....', '.dd....dd...', 'dd......dd..'],
  runB: ['...bbbb.....', '...ddd......', '...dddd.....'],
}
/** the blade, as [x, y] off the hero's top-left, for each pose */
const SWORD = {
  idle: [[8, 5], [9, 4], [10, 3], [11, 2]],
  windup: [[7, 5], [7, 4], [7, 3], [7, 2], [7, 1], [7, 0]],
  slash: [[8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6]],
}
/** the swing's trail, in front of the hero */
const ARC = [[13, 1], [14, 2], [15, 3], [15, 4], [16, 5], [15, 7], [14, 8], [13, 9]]
/** g body, l shine, e eye */
const SLIME = [
  '...gggg...',
  '..glgggg..',
  '.gggggggg.',
  '.ggegeggg.',
  'gggggggggg',
  'gggggggggg',
  '.gggggggg.',
]
const SQUAT = [
  '....gggg....',
  '..glgggggg..',
  '.ggegeggggg.',
  'gggggggggggg',
  '.gggggggggg.',
]
const DIGITS: Record<string, string[]> = {
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'],
  4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###'],
}

type Props = {
  /** one round a score: the damage it shows, and its colour as a custom-property name */
  hits: readonly { value: number; color: string }[]
  /** a round has landed its hit */
  onHit?: (round: number) => void
  /** start swinging (before this it stands still) */
  running?: boolean
}

export default function Battle({ hits, onHit, running = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const props = useRef({ hits, onHit, running })
  props.current = { hits, onHit, running }

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let palette: Record<string, string> = {}
    let paletteAt = -Infinity
    const readPalette = (now: number) => {
      if (now - paletteAt < 500) return
      paletteAt = now
      const css = getComputedStyle(canvas)
      const get = (name: string) => css.getPropertyValue(name).trim() || '#fff'
      palette = {
        h: get('--heat-2'), s: '#e8b48f', e: get('--bg'), b: get('--accent'), d: get('--mute'),
        w: get('--ink'), g: get('--heat-3'), l: get('--ink'), ground: get('--rule'), arc: get('--heat-4'),
      }
      for (const h of props.current.hits) palette[h.color] = get(h.color)
    }

    const sprite = (rows: readonly string[], x: number, y: number, flash?: string) => {
      rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const key = row[c]
          if (key === '.') continue
          ctx.fillStyle = flash ?? palette[key]
          ctx.fillRect(x + c, y + r, 1, 1)
        }
      })
    }
    const dots = (points: readonly number[][], x: number, y: number, color: string) => {
      ctx.fillStyle = color
      for (const [px, py] of points) ctx.fillRect(x + px, y + py, 1, 1)
    }

    let frame = 0
    let round = 0
    const draw = (f: number) => {
      ctx.clearRect(0, 0, W, H)
      // the floor, dashed
      ctx.fillStyle = palette.ground
      for (let x = 1; x < W - 1; x += 2) ctx.fillRect(x, GROUND, 1, 1)

      // Bruce: waits, dashes in, winds up, swings, walks back
      const home = 3
      const x = f < 8 ? home : f <= 10 ? home + (f - 7) * 4 : f <= 14 ? home + 12 : f <= 19 ? home + 12 - Math.round((f - 14) * 2.4) : home
      const bob = (f < 8 || f >= 20) && (f >> 2) & 1 ? 1 : 0
      const pose = f === 11 ? 'windup' : f === 12 || f === 13 ? 'slash' : 'idle'
      const legs = f >= 8 && f <= 10 ? (f & 1 ? LEGS.runA : LEGS.runB) : f >= 15 && f <= 19 ? (f & 1 ? LEGS.runB : LEGS.runA) : LEGS.stand
      const top = GROUND - HERO.length - legs.length + bob
      sprite(HERO, x, top)
      sprite(legs, x, top + HERO.length - bob)
      dots(SWORD[pose], x, top, palette.w)
      if (f === 12) dots(ARC, x, top, palette.arc)
      if (f === 13) { ctx.globalAlpha = 0.45; dots(ARC, x, top, palette.arc); ctx.globalAlpha = 1 }

      // the slime: bounces in place, flashes and slides back when it's hit
      const knock = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 4, 3, 2, 1][f] ?? 0
      const squat = f === 14 || f === 15 || (!(f >= 12 && f <= 19) && (f >> 2) & 1)
      const body = squat ? SQUAT : SLIME
      const sx = 30 + knock - (squat ? 1 : 0)
      sprite(body, sx, GROUND - body.length, f === 12 || f === 13 ? palette.w : undefined)

      // the damage: this round's score, rising off the slime and blinking out
      if (f >= 13 && f <= 23 && !(f >= 21 && f & 1)) {
        const hit = props.current.hits[round % props.current.hits.length]
        const text = String(hit.value)
        const dy = GROUND - SLIME.length - 7 - Math.min(5, f - 13)
        Array.from(text).forEach((digit, i) => sprite(DIGITS[digit].map(r => r.replace(/#/g, 'x')), sx + 1 + i * 4, dy, palette[hit.color]))
      }
    }

    let raf = 0
    let last = 0
    let visible = false
    const tick = (now: number) => {
      raf = 0
      if (!visible) return
      readPalette(now)
      if (now - last >= FRAME_MS) {
        last = now
        const run = props.current.running && !reduce
        draw(run ? frame : 0)
        if (run) {
          if (frame === 12) props.current.onHit?.(round)
          frame = (frame + 1) % LOOP
          if (frame === 0) round++
        }
      }
      raf = requestAnimationFrame(tick)
    }
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf) raf = requestAnimationFrame(tick)
    })
    seen.observe(canvas)
    readPalette(performance.now())
    draw(0)
    return () => { seen.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  return <canvas ref={ref} className="battle" width={W} height={H} role="img"
                 aria-label="A pixel Bruce sparring with a slime, each hit scoring one of his traits" />
}
