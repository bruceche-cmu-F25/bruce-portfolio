'use client'

/** The cursor leaves heat on the page's pixel grid.
 *
 *  The viewport is a grid of CELL-sized squares, each holding a heat from 0 to
 *  1. Moving the pointer deposits a Gaussian of heat along the whole path it
 *  travelled since the last frame, the field cools every frame, and each cell
 *  is painted in one of four hard colour bands by how hot it is — so the trail
 *  is a comet of squares, white-hot at the head and cooling down the tail, the
 *  way craft.wild.as's is.
 *
 *  At the pointer sits a pixel arrow aimed at the middle of the text on
 *  screen, which turns into something else over parts of the page that mean
 *  something: a heart over email links and the things Bruce loves, a thumbs-up
 *  on a project, a sparkle over the stack, and the word HI over the contact
 *  section and footer. Over a like button it steps back entirely.
 *
 *  A click throws out embers — cells that fly, fall and cool from white-hot
 *  through the bands — behind a flash and a shockwave; holding still on a
 *  click charges a bigger burst, which also throws the page into neon — the
 *  accent and the ramp stepping round the colour wheel (home.css, `neon`) —
 *  and the next one brings it back. The black-hole passage hides the cursor
 *  and pauses every effect here. Skipped on touch and under reduced motion.
 */

import { useEffect, useState } from 'react'
import sprites from '@/lib/sprites.json'
import { THEME_TRANSITION_MS } from '@/lib/hours'

export const CELL = 9

const BRUSH_SIGMA = 1.6
const FIELD_LIFE_MS = 240
const MAX_TRAIL_DISTANCE = CELL * 13
/** Heat thresholds for the four colour bands, coolest first. Below the first
 *  a cell is dark. Set low enough that a good part of the comet reaches the
 *  two hot bands — that's where the colour is. */
const BANDS = [0.06, 0.15, 0.28, 0.46]
const ANGLE_EASE_MS = 85
const SHAPE_EASE_MS = 110
/** The arrow's size on the grid: one and a half times the drawing's own units. */
const ARROW_SCALE = 1.5
/** Glyphs grow in from this fraction of their size, overshooting a little. */
const GROW_FROM = 0.5
const TAP_MS = 640
const TAP_REACH = CELL * 16
const HOLD_MS = 650
/** A held burst's wave runs right off the screen, so it takes its time. */
const BURST_WAVE_MS = 2300
const MIN_HEAT = 0.045
const ARROW_SAMPLES = 4
const MAX_EMBERS = 260
const RAY_MS = 300

type RGB = [number, number, number]
type Glyph = 'heart' | 'thumb' | 'star' | 'hi' | 'branch'
type WaveKind = 'tap' | 'burst'

/** What the arrow turns into, and over what. First match wins. */
const ZONES: { glyph: Glyph; sel: string }[] = [
  { glyph: 'heart', sel: 'a[href^="mailto:"], #life' },
  { glyph: 'branch', sel: '.graph' },
  { glyph: 'thumb', sel: '.card' },
  { glyph: 'star', sel: '#stack' },
  { glyph: 'hi', sel: '#contact, .foot' },
]
const GLYPHS: Glyph[] = ['heart', 'thumb', 'star', 'hi', 'branch']
const QUIET_TARGETS = '.like, .shots-nav, .shots-open, .shots-view, .shots-dialog, .deck-again'
const READING_TARGETS = '.intro, .who, .role-body, .card-head, .card-meta, .card-blurb, .card-facts, .card-tags, .stack, .contact, .seek, .sec-head, .graph-foot'

interface Wave { x: number; y: number; startedAt: number; kind: WaveKind; reach: number }
interface Press { x: number; y: number; startedAt: number; fired: boolean }
/** A spark thrown out by a click. Velocities in px/ms. A chunk is drawn as
 *  two cells by two — debris rather than a spark. */
interface Ember { x: number; y: number; px: number; py: number; vx: number; vy: number; born: number; life: number; chunk: boolean }
/** One spoke of the starburst a click opens with. */
interface Ray { x: number; y: number; angle: number; length: number; born: number }

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (value: number) => {
  const progress = clamp01(value)
  return progress * progress * (3 - 2 * progress)
}
/** Ease out with a small overshoot — a glyph pops past full size and settles. */
const backOut = (t: number) => {
  const k = clamp01(t) - 1
  return 1 + 2.4 * k * k * k + 1.4 * k * k
}

const mixColor = (from: RGB, to: RGB, amount: number): RGB => [
  from[0] + (to[0] - from[0]) * amount,
  from[1] + (to[1] - from[1]) * amount,
  from[2] + (to[2] - from[2]) * amount,
]

const colorString = (color: RGB) =>
  'rgb(' + color.map(channel => Math.round(channel)).join(',') + ')'

function segmentDistance(x: number, y: number, startX: number, startY: number, endX: number, endY: number) {
  const deltaX = endX - startX
  const deltaY = endY - startY
  const position = clamp01(((x - startX) * deltaX + (y - startY) * deltaY) / (deltaX * deltaX + deltaY * deltaY))
  return Math.hypot(x - startX - position * deltaX, y - startY - position * deltaY)
}

/** A cheap deterministic random, so embers from the same click don't all match. */
let seed = 1
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

export default function Trail() {
  const [calm, setCalm] = useState<boolean | null>(null)

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setCalm(motion.matches)
    syncMotion()
    motion.addEventListener('change', syncMotion)
    return () => motion.removeEventListener('change', syncMotion)
  }, [])

  useEffect(() => {
    if (calm !== false || !matchMedia('(pointer: fine)').matches) return

    const canvas = document.createElement('canvas')
    canvas.className = 'trail'
    canvas.setAttribute('aria-hidden', 'true')
    document.body.append(canvas)
    const context = canvas.getContext('2d', { alpha: true })!
    const page = document.querySelector<HTMLElement>('.page')!
    const scene = document.querySelector<HTMLElement>('.scene')
    const frameElement = document.querySelector<HTMLElement>('.frame')

    const paletteCanvas = document.createElement('canvas')
    paletteCanvas.width = paletteCanvas.height = 1
    const paletteContext = paletteCanvas.getContext('2d', { willReadFrequently: true })!
    const readColor = (value: string): RGB => {
      paletteContext.fillStyle = value
      paletteContext.fillRect(0, 0, 1, 1)
      const channels = paletteContext.getImageData(0, 0, 1, 1).data
      return [channels[0], channels[1], channels[2]]
    }

    const readHeat = () => {
      const styles = getComputedStyle(page)
      return [1, 2, 3, 4].map(i => readColor(styles.getPropertyValue(`--heat-${i}`))) as RGB[]
    }

    /** The four bands as strings, plus a fifth — the hottest band run most of
     *  the way to white — for the arrow's head, a flash and newborn embers.
     *  Rebuilt only when the hour changes. */
    let heatColors = readHeat()
    const buildRamp = () => [...heatColors.map(colorString), colorString(mixColor(heatColors[3], [255, 255, 255], 0.55))]
    let ramp = buildRamp()
    /** Re-read the ramp, but only rebuild it when the page's colours have
     *  actually moved — under neon they step ten times a second, not sixty.
     *  Returns whether anything changed. */
    let heatKey = ''
    const refreshRamp = () => {
      const styles = getComputedStyle(page)
      const values = [1, 2, 3, 4].map(i => styles.getPropertyValue(`--heat-${i}`))
      const key = values.join()
      if (key === heatKey) return false
      heatKey = key
      heatColors = values.map(readColor) as RGB[]
      ramp = buildRamp()
      return true
    }
    const HOT = 4

    let themeEndsAt = 0
    let sceneBounds = scene?.getBoundingClientRect()
    let targetX = innerWidth / 2
    let targetY = innerHeight / 2
    let columns = 0
    let rows = 0
    let heat = new Float32Array(0)
    const activeCells = new Set<number>()
    let animationFrame = 0
    let previousFrameAt = 0
    let cursorTransitionTimer = 0
    let stopped = false
    let lastBurstAt = -Infinity
    let chargeX = -1
    let chargeY = -1
    let chargeProgress = 0
    let press: Press | null = null
    let waves: Wave[] = []
    let embers: Ember[] = []
    let flashes: { x: number; y: number; startedAt: number; size: number }[] = []
    let rays: Ray[] = []
    const mix: Record<Glyph, number> = { heart: 0, thumb: 0, star: 0, hi: 0, branch: 0 }
    const pointer: {
      x: number; y: number; previousX: number; previousY: number
      on: boolean; inScene: boolean; glyph: Glyph | null
      angle: number; aimed: boolean; chargeMix: number
      quiet: boolean; quietMix: number; reading: boolean; readingMix: number
    } = {
      x: -1, y: -1, previousX: -1, previousY: -1,
      on: false, inScene: false, glyph: null,
      angle: 0, aimed: false, chargeMix: 0,
      quiet: false, quietMix: 0, reading: false, readingMix: 0,
    }

    const wake = () => {
      if (!stopped && !animationFrame) animationFrame = requestAnimationFrame(frame)
    }

    const clearCursorTransition = () => {
      window.clearTimeout(cursorTransitionTimer)
      cursorTransitionTimer = 0
      document.documentElement.removeAttribute('data-cursor-transition')
    }

    /** The arrow aims at the middle of whatever part of the text column is on
     *  screen below the painting — it always points you back at the content. */
    const updateBounds = () => {
      sceneBounds = scene?.getBoundingClientRect()
      const bounds = frameElement?.getBoundingClientRect()
      if (!bounds) return
      const visibleTop = Math.max(0, bounds.top, sceneBounds?.bottom ?? 0)
      const visibleBottom = Math.min(innerHeight, bounds.bottom)
      targetX = Math.max(0, Math.min(innerWidth, bounds.left + bounds.width / 2))
      targetY = visibleTop < visibleBottom ? (visibleTop + visibleBottom) / 2 : innerHeight / 2
    }

    const size = () => {
      const width = innerWidth
      const height = innerHeight
      const scale = Math.min(devicePixelRatio || 1, 2)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
      columns = Math.ceil(width / CELL) + 1
      rows = Math.ceil(height / CELL) + 1
      heat = new Float32Array(columns * rows)
      activeCells.clear()
      updateBounds()
      wake()
    }

    const drawCell = (column: number, row: number) => {
      context.fillRect(column * CELL + 1, row * CELL + 1, CELL - 2, CELL - 2)
    }

    const deposit = (x: number, y: number, amount: number, sigma = BRUSH_SIGMA) => {
      const centerColumn = x / CELL
      const centerRow = y / CELL
      const radius = Math.ceil(sigma * 2.6)
      const inverse = 1 / (2 * sigma * sigma)
      for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
        for (let columnOffset = -radius; columnOffset <= radius; columnOffset++) {
          const column = Math.floor(centerColumn + columnOffset)
          const row = Math.floor(centerRow + rowOffset)
          if (column < 0 || row < 0 || column >= columns || row >= rows) continue
          const deltaX = column + 0.5 - centerColumn
          const deltaY = row + 0.5 - centerRow
          const weight = Math.exp(-(deltaX * deltaX + deltaY * deltaY) * inverse)
          if (weight < 0.025) continue
          const index = row * columns + column
          heat[index] = Math.min(1, heat[index] + amount * weight)
          activeCells.add(index)
        }
      }
    }

    /** A click: a flash, embers flung out, and the grid scorched where it
     *  landed so the spot cools through the bands after the sparks have gone. */
    const explode = (x: number, y: number, power: number) => {
      const now = performance.now()
      seed = (Math.round(x * 31 + y * 17 + now) % 2147483646) + 1
      flashes.push({ x, y, startedAt: now, size: 2.4 + power * 2.6 })
      flashes = flashes.slice(-4)

      // the starburst: white-hot spokes that shoot out and are gone before
      // the embers have got anywhere
      const spokes = Math.round(8 + power * 6)
      for (let i = 0; i < spokes; i++) {
        rays.push({ x, y, born: now, angle: (i / spokes) * Math.PI * 2 + (rand() - 0.5) * 0.5,
          length: CELL * (4 + rand() * 4) * (0.8 + power * 0.7) })
      }
      rays = rays.slice(-48)

      // about half what it once threw: enough to read as a blast, few enough
      // that the page isn't buried in debris (Bruce, Nov 2026)
      const count = Math.round(18 + power * 32)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.9
        // a few fly much faster than the rest, which is what reads as force
        const fast = rand() < 0.18 ? 1.7 : 1
        const speed = (0.2 + rand() * 0.42) * (0.8 + power * 0.6) * fast
        embers.push({
          x, y, px: x, py: y,
          vx: Math.cos(angle) * speed,
          // a little lift, so they arc before they fall
          vy: Math.sin(angle) * speed - 0.08 - rand() * 0.1,
          born: now,
          life: 560 + rand() * 520 + power * 260,
          chunk: rand() < 0.2,
        })
      }
      if (embers.length > MAX_EMBERS) embers = embers.slice(-MAX_EMBERS)
      deposit(x, y, 0.9 + power * 0.3, 1.8 + power * 1.1)
      wake()
    }

    const updatePointerTarget = (target: Element | null) => {
      const inScene = Boolean(target?.closest('.scene'))
      if (inScene !== pointer.inScene) {
        pointer.previousX = pointer.x
        pointer.previousY = pointer.y
      }
      pointer.inScene = inScene
      // over a like button the cursor steps back entirely: the button has its
      // own heart, and two on top of each other is just noise
      pointer.quiet = Boolean(target?.closest(QUIET_TARGETS))
      const artBounds = target?.closest('.card')?.querySelector('.card-art')?.getBoundingClientRect()
      pointer.reading = Boolean(target?.closest(READING_TARGETS)) || Boolean(artBounds && pointer.y >= artBounds.bottom)
      pointer.glyph = null
      if (!inScene) {
        for (const zone of ZONES) {
          if (target?.closest(zone.sel)) { pointer.glyph = zone.glyph; break }
        }
      }
      if (inScene) press = null
      if (cursorTransitionTimer || document.documentElement.hasAttribute('data-cursor-transition')) {
        document.documentElement.toggleAttribute('data-cursor-transition', pointer.on && !inScene)
      }
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      if (!pointer.on) {
        pointer.previousX = event.clientX
        pointer.previousY = event.clientY
        pointer.on = true
      }
      pointer.x = event.clientX
      pointer.y = event.clientY
      updatePointerTarget(event.target instanceof Element ? event.target : null)
      if (press && Math.hypot(pointer.x - press.x, pointer.y - press.y) > CELL * 1.6) press = null
      wake()
    }

    const down = (event: PointerEvent) => {
      if ((event.pointerType && event.pointerType !== 'mouse') || !event.isPrimary || event.button !== 0) return
      if (document.documentElement.hasAttribute('data-warp')) {
        press = null
        move(event)
        return
      }
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest(`${QUIET_TARGETS}, .scene, .graph-cell, input, textarea, select, [contenteditable]`)) return
      if (!pointer.on) {
        pointer.previousX = event.clientX
        pointer.previousY = event.clientY
        pointer.on = true
      }
      pointer.x = event.clientX
      pointer.y = event.clientY
      updatePointerTarget(target)
      // a link or a button may take you elsewhere straight away, so it gets
      // its pop on the way down rather than waiting for a release
      if (target?.closest('a, button, summary, [role="button"]')) {
        explode(event.clientX, event.clientY, 0.55)
        return
      }
      if (pointer.reading || target?.closest('p, h1, h2, h3, h4, li, blockquote, pre')) return
      chargeX = event.clientX
      chargeY = event.clientY
      chargeProgress = 0
      press = { x: event.clientX, y: event.clientY, startedAt: performance.now(), fired: false }
      wake()
    }

    const release = (event: PointerEvent) => {
      if ((event.pointerType && event.pointerType !== 'mouse') || !event.isPrimary || event.button !== 0) return
      if (document.documentElement.hasAttribute('data-warp')) {
        press = null
        move(event)
        return
      }
      if (!press) return
      const held = press
      press = null
      if (!held.fired && Math.hypot(event.clientX - held.x, event.clientY - held.y) <= CELL * 1.6 &&
          !(event.target instanceof Element && event.target.closest('.scene'))) {
        waves.push({ x: held.x, y: held.y, startedAt: performance.now(), kind: 'tap', reach: TAP_REACH })
        waves = waves.slice(-4)
        explode(held.x, held.y, 0.8)
        // a second, slower ring a beat behind the first
        waves.push({ x: held.x, y: held.y, startedAt: performance.now() + 110, kind: 'tap', reach: TAP_REACH })
      }
      wake()
    }

    const leave = () => {
      clearCursorTransition()
      pointer.on = false
      pointer.previousX = -1
      pointer.previousY = -1
      pointer.inScene = false
      pointer.glyph = null
      pointer.aimed = false
      pointer.quiet = false
      pointer.quietMix = 0
      pointer.reading = false
      pointer.readingMix = 0
      for (const g of GLYPHS) mix[g] = 0
      pointer.chargeMix = 0
      press = null
      wake()
    }

    const cancel = (event: PointerEvent) => {
      if (!event.pointerType || event.pointerType === 'mouse') leave()
    }

    const scroll = () => {
      updateBounds()
      if (pointer.on) updatePointerTarget(document.elementFromPoint(pointer.x, pointer.y))
      wake()
    }

    /** A cell's colour band for a given brightness, so a ring runs from
     *  white-hot at its crest down through the ramp at its edges. */
    const band = (value: number) => value > 0.8 ? ramp[HOT] : value > 0.52 ? ramp[3] : value > 0.3 ? ramp[2] : ramp[1]

    const drawWaves = (now: number) => {
      waves = waves.filter(wave => now - wave.startedAt < (wave.kind === 'burst' ? BURST_WAVE_MS : TAP_MS))
      for (const wave of waves) {
        if (now < wave.startedAt) continue
        if (wave.kind === 'burst') { drawBurst(wave, now); continue }
        const progress = clamp01((now - wave.startedAt) / TAP_MS)
        const radius = wave.reach * (1 - Math.pow(1 - progress, 2))
        const sigma = CELL * 0.8
        const amplitude = 0.85 * Math.pow(1 - progress, 1.2)
        // the ring is hottest at its leading edge, cooling behind it
        context.fillStyle = progress < 0.35 ? ramp[3] : ramp[2]
        const extent = radius + sigma * 2.5
        const firstRow = Math.max(0, Math.floor((wave.y - extent) / CELL))
        const lastRow = Math.min(rows - 1, Math.ceil((wave.y + extent) / CELL))
        const firstColumn = Math.max(0, Math.floor((wave.x - extent) / CELL))
        const lastColumn = Math.min(columns - 1, Math.ceil((wave.x + extent) / CELL))

        for (let row = firstRow; row <= lastRow; row++) {
          for (let column = firstColumn; column <= lastColumn; column++) {
            const distance = Math.hypot((column + 0.5) * CELL - wave.x, (row + 0.5) * CELL - wave.y)
            if (Math.abs(distance - radius) > sigma * 3.2) continue
            const front = Math.exp(-((distance - radius) ** 2) / (2 * sigma * sigma))
            const texture = 0.84 + ((column * 17 + row * 11) % 7) / 37.5
            const value = amplitude * front * texture
            if (value < 0.01) continue
            context.globalAlpha = Math.min(1, value)
            drawCell(column, row)
          }
        }
      }
      context.globalAlpha = 1
    }

    /** The held burst: a shockwave that crosses the whole screen like a stone
     *  dropped in water — a white-hot crest that thickens as it travels, two
     *  smaller rings following it out, and a glitter of cells left twinkling
     *  in the water behind them. */
    const drawBurst = (wave: Wave, now: number) => {
      const progress = clamp01((now - wave.startedAt) / BURST_WAVE_MS)
      const radius = wave.reach * (1 - Math.pow(1 - progress, 1.75))
      const spread = radius / wave.reach
      const sigma = CELL * (1.1 + spread * 2)
      const amplitude = smoothstep(progress / 0.04) * smoothstep(clamp01((1 - progress) / 0.3))
      const rings: [number, number][] = [
        [radius, 1],
        [radius * 0.78 - CELL * 2, 0.55],
        [radius * 0.56 - CELL * 4, 0.3],
      ]
      const outer = radius + sigma * 3.2
      const tick = Math.floor(now / 70)
      const firstRow = Math.max(0, Math.floor((wave.y - outer) / CELL))
      const lastRow = Math.min(rows - 1, Math.ceil((wave.y + outer) / CELL))
      const firstColumn = Math.max(0, Math.floor((wave.x - outer) / CELL))
      const lastColumn = Math.min(columns - 1, Math.ceil((wave.x + outer) / CELL))

      for (let row = firstRow; row <= lastRow; row++) {
        for (let column = firstColumn; column <= lastColumn; column++) {
          const distance = Math.hypot((column + 0.5) * CELL - wave.x, (row + 0.5) * CELL - wave.y)
          if (distance > outer) continue
          let value = 0
          for (const [r, strength] of rings) {
            if (r <= 0) continue
            const offset = distance - r
            if (Math.abs(offset) > sigma * 3.2) continue
            value += strength * Math.exp(-(offset * offset) / (2 * sigma * sigma))
          }
          // the water the crest has already crossed keeps glinting for a moment
          if (distance < radius - sigma) {
            const glint = (((column * 73856093) ^ (row * 19349663) ^ (tick * 83492791)) >>> 0) % 1000
            if (glint > 982) value += 0.38 * (0.4 + 0.6 * distance / radius)
          }
          const texture = 0.86 + ((column * 17 + row * 11) % 7) / 42
          value *= amplitude * texture
          if (value < 0.04) continue
          context.fillStyle = band(value)
          context.globalAlpha = Math.min(1, value * 1.15)
          drawCell(column, row)
        }
      }
      context.globalAlpha = 1
    }

    /** The click's first instant: a white-hot disc of cells, gone in a blink. */
    const drawFlashes = (now: number) => {
      flashes = flashes.filter(f => now - f.startedAt < 220)
      for (const f of flashes) {
        const t = (now - f.startedAt) / 220
        const r = f.size * (0.7 + t * 0.8)
        const cx = f.x / CELL, cy = f.y / CELL
        context.fillStyle = ramp[HOT]
        for (let row = Math.floor(cy - r - 1); row <= Math.ceil(cy + r); row++) {
          for (let column = Math.floor(cx - r - 1); column <= Math.ceil(cx + r); column++) {
            const d = Math.hypot(column + 0.5 - cx, row + 0.5 - cy)
            if (d > r) continue
            context.globalAlpha = (1 - t) ** 1.4 * (1 - (d / r) * 0.5)
            drawCell(column, row)
          }
        }
      }
      context.globalAlpha = 1
    }

    /** The starburst: each spoke a line of cells that shoots out to its full
     *  length and burns back from the centre, white-hot at its tip. */
    const drawRays = (now: number) => {
      rays = rays.filter(ray => now - ray.born < RAY_MS)
      for (const ray of rays) {
        const t = (now - ray.born) / RAY_MS
        const reach = ray.length * (1 - (1 - Math.min(1, t * 2.2)) ** 3)
        const start = ray.length * Math.max(0, (t - 0.3) / 0.7)
        const cos = Math.cos(ray.angle), sin = Math.sin(ray.angle)
        for (let d = start; d <= reach; d += CELL * 0.7) {
          const along = (d - start) / Math.max(1, reach - start)
          context.fillStyle = ramp[along > 0.66 ? HOT : along > 0.33 ? 3 : 2]
          context.globalAlpha = (1 - t) ** 0.8
          drawCell(Math.floor((ray.x + cos * d) / CELL), Math.floor((ray.y + sin * d) / CELL))
        }
      }
      context.globalAlpha = 1
    }

    /** Embers: each one a cell that flies, slows, falls and cools — white-hot,
     *  then down through the bands — with a dimmer cell behind it as a streak. */
    const drawEmbers = (now: number, elapsed: number) => {
      const dt = Math.min(elapsed, 40)
      const drag = Math.pow(0.9965, dt)
      const next: Ember[] = []
      for (const e of embers) {
        const age = (now - e.born) / e.life
        if (age >= 1) continue
        e.px = e.x; e.py = e.y
        e.vy += 0.00034 * dt
        e.vx *= drag; e.vy *= drag
        e.x += e.vx * dt; e.y += e.vy * dt
        const band = age < 0.16 ? HOT : age < 0.36 ? 3 : age < 0.6 ? 2 : age < 0.82 ? 1 : 0
        const alpha = age < 0.75 ? 1 : 1 - (age - 0.75) / 0.25
        const column = Math.floor(e.x / CELL), row = Math.floor(e.y / CELL)
        const tailColumn = Math.floor(e.px / CELL), tailRow = Math.floor(e.py / CELL)
        if (tailColumn !== column || tailRow !== row) {
          context.fillStyle = ramp[Math.max(0, Math.min(3, band - 1))]
          context.globalAlpha = alpha * 0.55
          drawCell(tailColumn, tailRow)
        }
        context.fillStyle = ramp[band]
        context.globalAlpha = alpha
        drawCell(column, row)
        if (e.chunk && age < 0.7) {
          drawCell(column + 1, row)
          drawCell(column, row + 1)
          drawCell(column + 1, row + 1)
        }
        next.push(e)
      }
      embers = next
      context.globalAlpha = 1
    }

    /** A glyph from lib/sprites.json, resampled onto the grid. Each character
     *  is its own tone — `K` the body, `h` a highlight, `c` a darker part like
     *  a cuff — so a shape can carry more than one colour. */
    const drawShape = (name: Glyph | 'plus', x: number, y: number, opacity: number,
                       tones: Record<string, string>, scale = 1) => {
      if (opacity <= 0.005 || scale <= 0.05) return
      const shape = sprites.cursor[name]
      const width = shape[0].length * scale
      const height = shape.length * scale
      const left = x / CELL - width / 2
      const top = y / CELL - height / 2
      for (const tone of Object.keys(tones)) {
        const filled = (column: number, row: number) => shape[row]?.[column] === tone ? 1 : 0
        context.fillStyle = tones[tone]
        for (let row = Math.floor(top); row <= Math.ceil(top + height); row++) {
          for (let column = Math.floor(left); column <= Math.ceil(left + width); column++) {
            const sourceX = (column - left) / scale
            const sourceY = (row - top) / scale
            const sourceColumn = Math.floor(sourceX)
            const sourceRow = Math.floor(sourceY)
            const blendX = sourceX - sourceColumn
            const blendY = sourceY - sourceRow
            const coverage = filled(sourceColumn, sourceRow) * (1 - blendX) * (1 - blendY) +
              filled(sourceColumn + 1, sourceRow) * blendX * (1 - blendY) +
              filled(sourceColumn, sourceRow + 1) * (1 - blendX) * blendY +
              filled(sourceColumn + 1, sourceRow + 1) * blendX * blendY
            if (coverage < 0.015) continue
            context.globalAlpha = opacity * Math.min(1, coverage * 1.15)
            drawCell(column, row)
          }
        }
      }
      context.globalAlpha = 1
    }

    /** The arrow: a stem and a chevron head, sampled onto the grid. A wider,
     *  fainter copy goes down first in a cooler band — a glow it sits in. */
    const drawArrow = (x: number, y: number, angle: number, opacity: number, scale = 1) => {
      if (opacity <= 0.005 || scale <= 0.05) return
      const originColumn = Math.floor(x / CELL)
      const originRow = Math.floor(y / CELL)
      const cosine = Math.cos(angle)
      const sine = Math.sin(angle)
      const reach = Math.ceil(4.6 * scale)

      for (let rowOffset = -reach; rowOffset <= reach; rowOffset++) {
        for (let columnOffset = -reach; columnOffset <= reach; columnOffset++) {
          const column = originColumn + columnOffset
          const row = originRow + rowOffset
          let stemCoverage = 0
          let headCoverage = 0
          let glowCoverage = 0
          for (let sampleY = 0; sampleY < ARROW_SAMPLES; sampleY++) {
            for (let sampleX = 0; sampleX < ARROW_SAMPLES; sampleX++) {
              const deltaX = ((column + (sampleX + 0.5) / ARROW_SAMPLES) - x / CELL) / scale
              const deltaY = ((row + (sampleY + 0.5) / ARROW_SAMPLES) - y / CELL) / scale
              const localX = deltaX * cosine + deltaY * sine
              const localY = -deltaX * sine + deltaY * cosine
              const stem = segmentDistance(localX, localY, -3, 0, 1.1, 0)
              const head = Math.min(
                segmentDistance(localX, localY, -0.1, -1.7, 3, 0),
                segmentDistance(localX, localY, -0.1, 1.7, 3, 0),
              )
              if (stem < 0.36) stemCoverage++
              if (head < 0.44) headCoverage++
              if (Math.min(stem, head) < 0.95) glowCoverage++
            }
          }
          const samples = ARROW_SAMPLES * ARROW_SAMPLES
          stemCoverage /= samples
          headCoverage /= samples
          glowCoverage /= samples
          if (glowCoverage > 0.1 && headCoverage < 0.1 && stemCoverage < 0.1) {
            context.fillStyle = ramp[1]
            context.globalAlpha = opacity * glowCoverage * 0.55
            drawCell(column, row)
          }
          if (stemCoverage > 0.1) {
            context.fillStyle = ramp[3]
            context.globalAlpha = opacity * Math.min(1, stemCoverage * 1.15)
            drawCell(column, row)
          }
          if (headCoverage > 0.1) {
            context.fillStyle = ramp[HOT]
            context.globalAlpha = opacity * Math.min(1, headCoverage * 1.15)
            drawCell(column, row)
          }
        }
      }
      context.globalAlpha = 1
    }

    const drawCharge = () => {
      if (pointer.chargeMix < 0.005) return
      const progress = smoothstep(chargeProgress)
      const radius = CELL * (7 - progress * 4)
      context.fillStyle = ramp[progress > 0.7 ? HOT : 3]
      for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6 + progress * 0.6
        const column = Math.floor((chargeX + Math.cos(angle) * radius) / CELL)
        const row = Math.floor((chargeY + Math.sin(angle) * radius) / CELL)
        context.globalAlpha = pointer.chargeMix * (0.3 + progress * 0.7) * (index % 3 === 0 ? 1 : 0.7)
        drawCell(column, row)
      }
      context.globalAlpha = 1
    }

    /** Which tones each glyph is painted in. */
    const tonesFor = (g: Glyph): Record<string, string> => {
      if (g === 'thumb') return { c: ramp[1], K: ramp[3] }
      if (g === 'star') return { K: ramp[3], h: ramp[HOT] }
      if (g === 'hi') return { K: ramp[3] }
      return { K: ramp[3], h: ramp[HOT] }
    }

    function frame(now: number) {
      animationFrame = 0
      if (stopped) return
      // Freeze the last painting for the CSS fade, discard transient state
      // and sleep. The warp observer repaints the current pointer on exit.
      if (document.documentElement.hasAttribute('data-warp')) {
        heat.fill(0)
        activeCells.clear()
        waves.length = embers.length = flashes.length = rays.length = 0
        press = null
        chargeProgress = 0
        pointer.chargeMix = 0
        lastBurstAt = -Infinity
        pointer.previousX = pointer.x
        pointer.previousY = pointer.y
        previousFrameAt = 0
        return
      }
      const elapsed = previousFrameAt ? now - previousFrameAt : 16.7
      previousFrameAt = now

      let angleMoving = false
      if (pointer.on && !pointer.inScene) {
        const deltaX = pointer.x - pointer.previousX
        const deltaY = pointer.y - pointer.previousY
        const distance = Math.hypot(deltaX, deltaY)
        if (distance > 0.25) {
          const trailDistance = Math.min(distance, MAX_TRAIL_DISTANCE)
          const steps = Math.ceil(trailDistance / (CELL * 0.7))
          const amount = Math.min(0.2, 0.2 * trailDistance / (steps * CELL)) * (1 - pointer.readingMix * 0.4) * (1 - pointer.quietMix)
          for (let step = 1; step <= steps; step++) {
            const position = 1 - trailDistance / distance * (1 - step / steps)
            deposit(pointer.previousX + deltaX * position, pointer.previousY + deltaY * position, amount)
          }
        }
        pointer.previousX = pointer.x
        pointer.previousY = pointer.y

        const aimX = targetX - pointer.x
        const aimY = targetY - pointer.y
        if (Math.hypot(aimX, aimY) > CELL) {
          const targetAngle = Math.atan2(aimY, aimX)
          if (!pointer.aimed) {
            pointer.angle = targetAngle
            pointer.aimed = true
          } else {
            const difference = Math.atan2(Math.sin(targetAngle - pointer.angle), Math.cos(targetAngle - pointer.angle))
            pointer.angle += difference * (1 - Math.exp(-Math.min(elapsed, 64) / ANGLE_EASE_MS))
            angleMoving = Math.abs(difference) > 0.006
          }
        }
      }

      const decay = Math.exp(-elapsed / FIELD_LIFE_MS)
      for (const index of activeCells) {
        const column = index % columns
        const row = Math.floor(index / columns)
        const distance = Math.hypot((column + 0.5) * CELL - pointer.x, (row + 0.5) * CELL - pointer.y)
        const proximity = pointer.on && !pointer.inScene
          ? clamp01((MAX_TRAIL_DISTANCE - distance) / (CELL * 3)) : 1
        // cells scorched by a click stay put; only the trail is reeled in
        const reel = heat[index] > 0.7 ? 1 : Math.pow(smoothstep(proximity), Math.min(elapsed, 64) / 16.7)
        heat[index] *= decay * reel
        if (heat[index] < MIN_HEAT) {
          heat[index] = 0
          activeCells.delete(index)
        }
      }

      if (press && !press.fired) chargeProgress = clamp01((now - press.startedAt) / HOLD_MS)
      if (press && !press.fired && chargeProgress >= 1) {
        press.fired = true
        lastBurstAt = now
        // far enough to clear the corner furthest from the press
        const reach = Math.hypot(Math.max(press.x, innerWidth - press.x), Math.max(press.y, innerHeight - press.y)) + CELL * 8
        waves.push({ x: press.x, y: press.y, startedAt: now, kind: 'burst', reach })
        waves = waves.slice(-4)
        explode(press.x, press.y, 1.5)
        // the held burst throws the page into neon; the next one brings it back
        document.documentElement.toggleAttribute('data-neon')
      }

      const ease = 1 - Math.exp(-Math.min(elapsed, 64) / SHAPE_EASE_MS)
      let glyphsMoving = false
      for (const g of GLYPHS) {
        const goal = pointer.glyph === g ? 1 : 0
        mix[g] += (goal - mix[g]) * ease
        if (Math.abs(mix[g] - goal) > 0.004) glyphsMoving = true
      }
      pointer.quietMix += ((pointer.quiet ? 1 : 0) - pointer.quietMix) * ease
      pointer.readingMix += ((pointer.reading ? 1 : 0) - pointer.readingMix) * ease
      pointer.chargeMix += ((press && !press.fired ? 1 : 0) - pointer.chargeMix) * ease

      // The ramp is fixed within an hour, so it's only read while the hour is
      // changing, or while the neon is stepping it round the wheel.
      if (themeEndsAt || neonTicker) {
        refreshRamp()
        if (now >= themeEndsAt) themeEndsAt = 0
      }
      const colorMoving = themeEndsAt > 0

      context.clearRect(0, 0, innerWidth, innerHeight)

      // draw band by band, so the fill colour changes four times a frame
      // rather than once per cell
      for (let band = 0; band < BANDS.length; band++) {
        const low = BANDS[band]
        const high = band + 1 < BANDS.length ? BANDS[band + 1] : Infinity
        context.fillStyle = ramp[band]
        for (const index of activeCells) {
          const value = heat[index]
          if (value >= low && value < high) drawCell(index % columns, Math.floor(index / columns))
        }
      }

      drawWaves(now)
      drawEmbers(now, elapsed)
      drawRays(now)
      drawFlashes(now)

      if (pointer.on && !pointer.inScene) {
        const recovery = 1 - 0.25 * Math.exp(-(now - lastBurstAt) / 180)
        const shapeOpacity = recovery * (1 - pointer.chargeMix) * (1 - pointer.quietMix) * (1 - pointer.readingMix * 0.48)
        const readingScale = 1 - pointer.readingMix * 0.12
        const taken = Math.min(1, GLYPHS.reduce((sum, g) => sum + mix[g], 0))
        const grow = (m: number) => GROW_FROM + (1 - GROW_FROM) * backOut(m)
        // as a glyph grows in, the arrow shrinks out, so the two trade places
        drawArrow(pointer.x, pointer.y, pointer.angle, shapeOpacity * (1 - taken),
          ARROW_SCALE * (1 - 0.45 * smoothstep(taken)) * readingScale)
        for (const g of GLYPHS) {
          if (mix[g] < 0.01) continue
          drawShape(g, pointer.x, pointer.y, shapeOpacity * Math.min(1, mix[g] * 1.4), tonesFor(g), grow(mix[g]) * readingScale)
        }
        if (pointer.chargeMix > 0.005) {
          drawCharge()
          drawShape('plus', chargeX, chargeY,
            pointer.chargeMix * (0.45 + smoothstep(chargeProgress) * 0.55), { K: ramp[3], h: ramp[HOT] })
        }
      }

      if (sceneBounds && sceneBounds.bottom > -32 && sceneBounds.top < innerHeight + 32) {
        context.clearRect(sceneBounds.left, sceneBounds.top, sceneBounds.width, sceneBounds.height)
        const feather = 32
        context.globalCompositeOperation = 'destination-out'
        const edges = [
          [0, sceneBounds.bottom, 0, sceneBounds.bottom + feather, sceneBounds.left, sceneBounds.bottom, sceneBounds.width, feather],
          [sceneBounds.left, 0, sceneBounds.left - feather, 0, sceneBounds.left - feather, sceneBounds.top, feather, sceneBounds.height],
          [sceneBounds.right, 0, sceneBounds.right + feather, 0, sceneBounds.right, sceneBounds.top, feather, sceneBounds.height],
          [0, sceneBounds.top, 0, sceneBounds.top - feather, sceneBounds.left, sceneBounds.top - feather, sceneBounds.width, feather],
        ]
        for (const [fromX, fromY, toX, toY, left, top, edgeWidth, edgeHeight] of edges) {
          const fade = context.createLinearGradient(fromX, fromY, toX, toY)
          fade.addColorStop(0, 'rgb(0 0 0 / 1)')
          fade.addColorStop(1, 'rgb(0 0 0 / 0)')
          context.fillStyle = fade
          context.fillRect(left, top, edgeWidth, edgeHeight)
        }
        context.globalCompositeOperation = 'source-over'
      }

      const quietMoving = Math.abs(pointer.quietMix - (pointer.quiet ? 1 : 0)) > 0.005 ||
        Math.abs(pointer.readingMix - (pointer.reading ? 1 : 0)) > 0.005 ||
        Math.abs(pointer.chargeMix - (press && !press.fired ? 1 : 0)) > 0.005
      const recovering = pointer.on && now - lastBurstAt < 600
      if (activeCells.size || waves.length || embers.length || flashes.length || rays.length || (press && !press.fired) ||
          angleMoving || glyphsMoving || quietMoving || colorMoving || recovering) {
        wake()
      } else {
        previousFrameAt = 0
      }
    }

    // Under neon the colours step by themselves. When nothing else is moving,
    // look ten times a second and repaint the cursor only on a step, rather
    // than holding the loop open at sixty frames for a colour that hasn't moved.
    let neonTicker = 0
    const syncNeon = () => {
      const on = document.documentElement.hasAttribute('data-neon')
      if (on && !neonTicker) neonTicker = window.setInterval(() => { if (pointer.on && refreshRamp()) wake() }, 100)
      else if (!on && neonTicker) { window.clearInterval(neonTicker); neonTicker = 0 }
    }

    const resize = () => size()
    const themeObserver = new MutationObserver(() => {
      themeEndsAt = performance.now() + THEME_TRANSITION_MS + 50
      syncNeon()
      wake()
    })
    const boundsObserver = new ResizeObserver(() => {
      updateBounds()
      wake()
    })
    const warpObserver = new MutationObserver(() => {
      if (stopped) return
      window.clearTimeout(cursorTransitionTimer)
      cursorTransitionTimer = 0
      const root = document.documentElement
      const warp = root.hasAttribute('data-warp')
      if (!warp && pointer.on) updatePointerTarget(document.elementFromPoint(pointer.x, pointer.y))
      root.toggleAttribute('data-cursor-transition', pointer.on && !pointer.inScene)
      cancelAnimationFrame(animationFrame)
      animationFrame = 0
      // Paint before the first visible fade-in frame, so no stale cursor or
      // trail appears at its position from before the passage.
      frame(performance.now())
      if (!warp && pointer.on && !pointer.inScene) {
        cursorTransitionTimer = window.setTimeout(() => {
          cursorTransitionTimer = 0
          if (!root.hasAttribute('data-warp')) root.removeAttribute('data-cursor-transition')
        }, 420)
      }
    })
    size()
    syncNeon()
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-hour', 'data-neon'] })
    warpObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-warp'] })
    if (scene) boundsObserver.observe(scene)
    if (frameElement) boundsObserver.observe(frameElement)
    addEventListener('resize', resize)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down, { passive: true })
    addEventListener('pointerup', release, { passive: true })
    addEventListener('pointercancel', cancel, { passive: true })
    addEventListener('scroll', scroll, true)
    addEventListener('blur', leave)
    document.addEventListener('visibilitychange', leave)
    document.addEventListener('pointerleave', leave)

    return () => {
      stopped = true
      window.clearInterval(neonTicker)
      clearCursorTransition()
      cancelAnimationFrame(animationFrame)
      themeObserver.disconnect()
      warpObserver.disconnect()
      boundsObserver.disconnect()
      removeEventListener('resize', resize)
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', release)
      removeEventListener('pointercancel', cancel)
      removeEventListener('scroll', scroll, true)
      removeEventListener('blur', leave)
      document.removeEventListener('visibilitychange', leave)
      document.removeEventListener('pointerleave', leave)
      canvas.remove()
    }
  }, [calm])

  return null
}
