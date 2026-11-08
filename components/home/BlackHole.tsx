'use client'

/** The black hole, back — redrawn in the page's pixel grid.
 *
 *  The old space site's hero ended by falling into a black hole. This is that fall
 *  for the homepage, drawn in the same 9px cells and the same heat ramp as the
 *  cursor's trail, so it takes the hour's colours. It is one sky, fixed behind
 *  the page, driven by scroll from Projects to the far side of the passage:
 *
 *    over What I've Built, stars begin behind the content, a few at first,
 *      gathering through Tech Stack,
 *      drifting up a little slower than the page (they're further away) →
 *    past it, the passage: a point of light, then a black hole forms around it
 *      — shadow, photon ring, an accretion disk seen almost edge-on, its far
 *      side lensed up over the top, the same stars now bending round it →
 *    you slide in sideways, the disk rolling as it swells past you, the sky
 *      swirling toward the middle until the shadow is all there is →
 *    a point of light in the dark, which opens and pours out past you as
 *      streaks, then thins away — and Life & Interests is on the far side.
 *
 *  The stars over Tech Stack and the stars round the hole are the same stars:
 *  one field, hashed on position, which the hole sees through its lens and the
 *  drift brings to rest exactly as the passage begins, so nothing jumps.
 *
 *  Each cell's brightness is worked out from a small model every frame and
 *  quantised to the ramp's bands with an ordered dither, so falloffs read as
 *  pixel art. Only the disk's surface flow and stars' twinkle run on the clock;
 *  everything else is a function of scroll, so scrolling back plays it
 *  backwards. With reduced motion it is one still frame in a short block.
 */

import { useEffect, useRef, useState } from 'react'
import { hum } from '@/lib/sound'

const CELL = 9
/** How much slower than the page the stars drift over Tech Stack. */
const DRIFT = 0.16
type RGB = [number, number, number]

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** Cheap, stable hash of two integers to 0…1. */
const hash = (a: number, b: number) => {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}
/** Periodic, continuous grain: material flows around the disk without jumping bins. */
function diskGrain(turn: number, radius: number) {
  const u = ((turn % 1 + 1) % 1) * 40
  const a = Math.floor(u), b = Math.floor(radius), next = (a + 1) % 40
  const x = smooth(0, 1, u - a), y = smooth(0, 1, radius - b)
  const lo = hash(a, b) * (1 - x) + hash(next, b) * x
  const hi = hash(a, b + 1) * (1 - x) + hash(next, b + 1) * x
  return lo * (1 - y) + hi * y
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16 - 0.5)

/** The star field: is there a star at this point of the sky, and how bright. */
function star(x: number, y: number, density: number, t: number) {
  if (density <= 0) return 0
  const h = hash(Math.floor(x / CELL) + 7919, Math.floor(y / CELL) + 104729)
  if (h <= 1 - density) return 0
  // Each fixed star fades in as the growing density reaches its seed, rather
  // than the entire sky crossing a shared brightness threshold at once.
  const birth = smooth(0, density * 0.22, density - (1 - h))
  const tone = hash(Math.floor(x / CELL), Math.floor(y / CELL))
  // a slow twinkle, each star at its own rate
  return birth * (0.55 + 0.45 * tone) * (0.78 + 0.22 * Math.sin(t * (0.8 + tone * 2.4) + tone * 40))
}

/** Broken arcs and outward-running fragments cling to the opening's edge.
 *  Most of the wake stays outside it, leaving the revealed page readable. */
function rimLight(x: number, y: number, d: number, radius: number, t: number) {
  const edge = d - radius
  if (edge < -CELL * 1.5 || edge > CELL * 13) return 0
  const angle = (Math.atan2(y, x) / (Math.PI * 2) + 0.5) * 192
  const arc = Math.floor(angle)
  const grain = hash(Math.floor(x / CELL) + 31, Math.floor(y / CELL) + 71)
  const jitter = (hash(arc, 53) - 0.3) * CELL * 2
  const crest = edge - jitter
  let v = 0
  if (Math.abs(crest) < CELL * 4 && grain < 0.25 + 0.5 * Math.max(0, 1 - Math.abs(crest) / (CELL * 4))) {
    v = Math.exp(-(crest ** 2) / (2 * (CELL * 1.3) ** 2)) * (0.45 + 0.6 * hash(arc, 37))
  }
  if (hash(arc, 17) > 0.5 && angle - arc < 0.55) {
    const travel = (t * 0.65 + hash(arc, 97)) % 1
    const tip = CELL * (1 + travel * 11)
    const length = CELL * (2 + hash(arc, 43) * 4)
    const shard = smooth(tip - length, tip - length + CELL, edge) * (1 - smooth(tip, tip + CELL, edge))
    const hotTip = Math.exp(-((edge - tip) ** 2) / (2 * (CELL * 0.65) ** 2))
    v = Math.max(v, (shard * 0.45 + hotTip * 0.55) * (1 - travel * 0.75))
  }
  return v
}

/** Where the camera is at each moment of the passage. */
function shot(p: number, view: number) {
  // Overlap the approach and dive so the push-in keeps moving between shots.
  const form = smooth(0.04, 0.4, p)
  const dive = smooth(0.34, 0.72, p)
  const exit = smooth(0.74, 0.9, p)
  return {
    // how much of the hole there is yet
    presence: smooth(0.0, 0.12, p) * (1 - smooth(0.7, 0.76, p)),
    // the stars hold until the dark takes them
    sky: 1 - smooth(0.66, 0.74, p),
    // shadow radius: grows as it forms, then swells past you on the dive
    rs: view * 0.085 * (0.22 + 0.78 * form) * (1 + 11 * dive * dive),
    // the sideways slide: the hole drifts across as you fall toward it
    drift: Math.sin(Math.PI * dive) * 0.2,
    // Tilt and roll begin with formation, well before the dive accelerates.
    tilt: 0.16 + 0.21 * smooth(0, 0.72, p),
    roll: -0.06 - 0.65 * smooth(0, 0.74, p),
    // the sky swirling in
    swirl: 0.25 * form + 4 * dive,
    dive,
    // the way out
    exit,
    travel: (p - 0.74) / 0.22,
    fade: 1 - smooth(0.88, 0.99, p),
    dark: smooth(0.62, 0.72, p) * (1 - exit),
  }
}

export default function BlackHole() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rimRef = useRef<HTMLCanvasElement>(null)
  const [calm, setCalm] = useState<boolean | null>(null)

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setCalm(motion.matches)
    syncMotion()
    motion.addEventListener('change', syncMotion)
    return () => motion.removeEventListener('change', syncMotion)
  }, [])

  useEffect(() => {
    if (calm === null) return
    const el = wrap.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!el || !canvas || !context) return
    const rimCanvas = rimRef.current
    const rim = rimCanvas?.getContext('2d')
    el.dataset.calm = calm ? 'true' : 'false'
    const arrival = document.querySelector<HTMLElement>('.arrival')
    const root = document.documentElement

    // the hour's ramp, read off the page like the cursor trail does
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const rgb = (value: string): RGB => {
      probe.fillStyle = '#000'
      probe.fillStyle = value.trim() || '#fff'
      probe.fillRect(0, 0, 1, 1)
      const d = probe.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]]
    }
    let ramp: string[] = []
    let rampKey = ''
    const readRamp = () => {
      const styles = getComputedStyle(el.closest('.page') ?? document.documentElement)
      const values = [1, 2, 3, 4].map(i => styles.getPropertyValue(`--heat-${i}`))
      // under neon this runs every frame; the colours only step ten times a second
      const key = values.join()
      if (key === rampKey) return
      rampKey = key
      const heat = values.map(rgb)
      const hot = heat[3].map(c => Math.round(c + (255 - c) * 0.6))
      ramp = [...heat, hot].map(c => `rgb(${c[0]} ${c[1]} ${c[2]})`)
    }
    readRamp()

    let width = 0, height = 0, columns = 0, rows = 0
    const resize = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const scale = Math.min(devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
      if (rimCanvas && rim) {
        rimCanvas.width = canvas.width
        rimCanvas.height = canvas.height
        rim.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
      }
      columns = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
    }

    /** The star field builds through Projects and Tech Stack before the passage. */
    const where = () => {
      if (calm) return { pre: 1, p: 0.3, offset: 0, live: true }
      const y = scrollY
      const built = document.getElementById('built')?.getBoundingClientRect()
      const stack = document.getElementById('stack')?.getBoundingClientRect()
      const holeTop = el.getBoundingClientRect().top + y
      // The exit clears while Life rises into view, leaving the shelves and
      // Contact directly on the far side, with no intervening card sequence.
      const life = document.getElementById('life')?.getBoundingClientRect()
      const target = life ? life.top + y - innerHeight * 0.14 : holeTop + el.offsetHeight - innerHeight * 0.14
      // A tall viewport must still be able to finish opening at the page end.
      const end = Math.min(target, Math.max(0, document.documentElement.scrollHeight - innerHeight))
      const preStart = built ? built.top + y - innerHeight * 0.85 : stack ? stack.top + y - innerHeight * 0.85 : holeTop - innerHeight
      const start = stack ? stack.bottom + y - innerHeight * 0.5 : holeTop
      return {
        pre: clamp01((y - preStart) / Math.max(1, start - preStart)),
        p: clamp01((y - start) / Math.max(1, end - start)),
        // Across Projects and Tech Stack the sky lags the page, then settles.
        offset: Math.min(0, y - start) * DRIFT,
        live: y > preStart && y < end,
      }
    }

    const bands: number[][] = [[], [], [], [], []]
    const rimBands: number[][] = [[], [], [], [], []]
    const black: number[] = []
    let blank = false
    let diskPhase = 0, lastTime: number | undefined
    let progress: number | undefined
    let arrivalState = ''

    const draw = (time = performance.now(), snap = false) => {
      if (!width) return false
      rim?.clearRect(0, 0, width, height)
      const { pre, p: target, offset, live } = where()
      const dt = lastTime === undefined ? 0 : Math.max(0, Math.min(0.1, (time - lastTime) / 1000))
      lastTime = time
      // A short, frame-rate-independent follow absorbs wheel steps without
      // overshoot. Camera position and orientation remain a function of scroll.
      if (progress === undefined || calm || snap) progress = target
      else progress += (target - progress) * -Math.expm1(-dt / 0.1)
      if (Math.abs(target - progress) < 0.0001) progress = target
      const p = progress
      const settling = p !== target
      // Keep the far side out of view during the particle rush. Only the
      // opening at the centre reveals it, growing to fill the viewport.
      const opening = calm ? 1 : smooth(0.9, 0.995, p)
      const aperture = Math.hypot(width, height) * 0.5 * opening
      const s = shot(p, Math.min(width, height) * 1.15)
      const nextArrival = opening <= 0 ? 'hidden' : opening >= 1 ? 'open' : `${aperture}:${scrollY}:${width}:${height}`
      if (arrival && !calm && arrivalState !== nextArrival) {
        arrivalState = nextArrival
        const bounds = opening > 0 && opening < 1 ? arrival.getBoundingClientRect() : null
        arrival.inert = opening < 1
        arrival.dataset.opening = opening.toFixed(3)
        arrival.style.visibility = opening <= 0 ? 'hidden' : ''
        if (opening >= 1) {
          arrival.style.clipPath = arrival.style.maskImage = arrival.style.webkitMaskImage = ''
        }
        else if (bounds) {
          const centre = `${(width / 2 - bounds.left).toFixed(1)}px ${(height / 2 - bounds.top).toFixed(1)}px`
          arrival.style.clipPath = `circle(${aperture.toFixed(1)}px at ${centre})`
          const feather = `radial-gradient(circle at ${centre}, #000 ${Math.max(0, aperture - CELL * 2).toFixed(1)}px, transparent ${aperture.toFixed(1)}px)`
          arrival.style.maskImage = arrival.style.webkitMaskImage = feather
        }
      }
      // Keep the pointer out of the passage; it comes back with the point of
      // light at the start of the way out, when there's somewhere to go.
      const warp = !calm && p > 0 && p < 0.74
      if (warp !== root.hasAttribute('data-warp')) root.toggleAttribute('data-warp', warp)
      // the drone (lib/sound.ts): it sinks an octave and darkens the closer
      // you fall, then climbs two and a bit and brightens as the light pours
      // out, and fades once you're through — silent outside the passage
      if (!calm) hum(
        smooth(0.03, 0.45, p) * (1 - smooth(0.88, 0.99, p)),
        (1 - 0.5 * smooth(0.04, 0.72, p)) * (1 + 4 * s.exit),
        0.3 - 0.2 * s.dive + 0.9 * s.exit,
      )
      if (!live && !settling) {
        lastTime = undefined
        if (!blank) { context.clearRect(0, 0, width, height); blank = true }
        return false
      }
      blank = false
      // the neon steps the ramp round the wheel under us; keep up with it
      if (root.hasAttribute('data-neon')) readRamp()
      const t = calm ? 0 : time / 1000
      // Like the Three.js scene, rotate material in the disk's own plane,
      // leaving the projected silhouette and camera roll tied only to scroll.
      if (!calm && p > 0 && p < 0.76) diskPhase += dt * (0.16 + 0.1 * s.dive)
      const rimFade = !calm && opening > 0 && opening < 1 ? smooth(0, 0.08, opening) * (1 - smooth(0.82, 1, opening)) : 0
      const cx = width * (0.5 + s.drift), cy = height * 0.5
      const rs = s.rs
      const cosR = Math.cos(s.roll), sinR = Math.sin(s.roll)
      const lens = (rs * 2.5) ** 2 * s.presence
      // Begin with roughly one or two seeds, then add stars individually as
      // Projects gives way to Tech Stack. Only the short entry fades together.
      const sparse = Math.min(0.012, 1.5 / Math.max(1, columns * rows))
      const density = sparse + (0.012 - sparse) * pre ** 1.5
      const entry = smooth(0, 0.025, pre)
      for (const band of bands) band.length = 0
      for (const band of rimBands) band.length = 0
      black.length = 0

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const x = (column + 0.5) * CELL - cx, y = (row + 0.5) * CELL - cy
          const d = Math.hypot(x, y)
          let v = 0

          if (p <= 0) {
            // before the passage: only the stars, drifting
            const bright = star(x, y - offset, density, t)
            if (bright) v = 0.6 * bright * entry
          } else {
            if (s.presence > 0.001) {
              // the shadow
              if (d < rs) { if (s.presence > 0.05) black.push(row * columns + column); continue }
              const xr = x * cosR - y * sinR, yr = x * sinR + y * cosR
              // a ring of light hugging the shadow
              v = Math.max(v, Math.exp(-((d - rs * 1.07) ** 2) / (2 * Math.max(4, rs * 0.07) ** 2)) * 1.15)
              // the disk, in its own plane
              const dy = yr / s.tilt, rd = Math.hypot(xr, dy)
              if (rd > rs * 1.3 && rd < rs * 5.6) {
                const ang = Math.atan2(dy, xr)
                // its top half is behind the shadow, so only the far rim shows above it
                if (yr > 0 || rd > rs * 1.9) {
                  const fall = Math.pow((rs * 1.3) / rd, 1.25)
                  const doppler = 0.72 + 0.28 * Math.cos(ang)
                  const spin = diskPhase * Math.pow((rs * 1.3) / rd, 1.5)
                  const grain = diskGrain((ang + spin) / (Math.PI * 2), rd / Math.max(5, rs * 0.28))
                  v = Math.max(v, fall * doppler * (0.55 + 0.6 * grain) * smooth(rs * 5.6, rs * 4.2, rd))
                }
              }
              // the disk's far side, lensed up over the top — and faintly under
              const up = -yr / d
              v = Math.max(v,
                Math.exp(-((d - rs * 1.5) ** 2) / (2 * Math.max(5, rs * 0.16) ** 2)) * smooth(-0.1, 0.55, up) * 0.95,
                Math.exp(-((d - rs * 1.22) ** 2) / (2 * Math.max(4, rs * 0.08) ** 2)) * smooth(-0.3, -0.9, up) * 0.5)
              v *= s.presence
            }

            // the sky behind it, seen through the lens: the same stars as over
            // Tech Stack, and a faint grid, each drawn where its light arrives
            if (s.sky > 0.001 && d >= rs) {
              const source = rs > 0 ? d - lens / d : d
              const twist = (s.swirl * (rs / Math.max(d, 1)) + s.swirl * 0.04) * s.presence
              const angle = Math.atan2(y, x) - twist
              const sx = Math.cos(angle) * source, sy = Math.sin(angle) * source
              const near = smooth(rs * 7, rs * 1.6, d) * s.presence
              const bright = star(sx, sy, 0.012 + near * 0.02, t)
              if (bright) v = Math.max(v, bright * (0.6 + 0.4 * near) * s.sky)
              const pitch = CELL * 7
              const gx = Math.abs(((sx % pitch) + pitch) % pitch - pitch / 2), gy = Math.abs(((sy % pitch) + pitch) % pitch - pitch / 2)
              const close = smooth(rs * 5, rs * 2, d)
              if (Math.min(gx, gy) < CELL * 0.5) v = Math.max(v, 0.12 * close * s.presence * (1 - s.dive))
            }
          }

          // the dark of the fall, and then the way out of it
          if (s.dark > 0.02 && hash(column, row) < s.dark * 1.2) {
            if (!(s.exit > 0 && d < (s.exit * 1.25) * Math.hypot(width, height) * 0.6)) { black.push(row * columns + column); continue }
          }
          if (s.exit > 0.001 && s.fade > 0.001) {
            const reach = s.exit * 1.25 * Math.hypot(width, height) * 0.6
            if (d < reach) {
              // light streaming out past you: narrow spokes, a few of them lit,
              // each carrying long dashes outward — stretched more the further
              // out they are — and the run of each set by scroll, not the clock
              const spoke = Math.floor((Math.atan2(y, x) / (Math.PI * 2) + 0.5) * 320)
              if (hash(spoke, 5) > 0.58) {
                const speed = 0.55 + hash(spoke, 29)
                const period = CELL * (10 + 8 * hash(spoke, 41))
                const runs = d / period - s.travel * 5 * speed + hash(spoke, 17) * 3
                const dash = runs - Math.floor(runs)
                const length = 0.18 + 0.4 * smooth(0, reach, d)
                if (dash < length) v = Math.max(v, (0.3 + 0.75 * smooth(reach, 0, d)) * s.fade * (0.6 + 0.4 * hash(spoke, 3)))
              }
              // The opening expands and clears into the interest shelves.
              const mouth = Math.max(CELL * 3, reach * 0.14)
              v = Math.max(v, smooth(mouth, 0, d) * 1.2 * (1 - smooth(0.9, 0.99, p)))
            }
          }

          // The same iris that uncovers the page clears the stars inside it;
          // light stays on the rim instead of shining through the new content.
          if (opening > 0 && !calm) v *= smooth(aperture - CELL * 4, aperture + CELL, d)

          if (rim && rimFade > 0) {
            const light = rimLight(x, y, d, aperture, t) * rimFade
            const tone = light * 5 + BAYER[(row % 4) * 4 + (column % 4)] * 0.7
            if (light > 0 && tone >= 0.55) rimBands[Math.min(4, Math.floor(tone))].push(row * columns + column)
          }

          if (v <= 0) continue
          const level = v * 5 + BAYER[(row % 4) * 4 + (column % 4)] * 0.9
          if (level < 0.55) continue
          bands[Math.min(4, Math.floor(level))].push(row * columns + column)
        }
      }

      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgb(0 0 0)'
      for (const index of black) context.fillRect((index % columns) * CELL + 1, Math.floor(index / columns) * CELL + 1, CELL - 2, CELL - 2)
      bands.forEach((cells, band) => {
        context.fillStyle = ramp[band]
        for (const index of cells) context.fillRect((index % columns) * CELL + 1, Math.floor(index / columns) * CELL + 1, CELL - 2, CELL - 2)
      })
      if (rim) rimBands.forEach((cells, band) => {
        rim.fillStyle = ramp[band]
        for (const index of cells) rim.fillRect((index % columns) * CELL + 1, Math.floor(index / columns) * CELL + 1, CELL - 2, CELL - 2)
      })
      return live || settling
    }

    const hours = new MutationObserver(() => { readRamp(); draw() })
    hours.observe(document.documentElement, { attributes: true, attributeFilter: ['data-hour', 'data-neon'] })
    const ro = new ResizeObserver(() => { resize(); draw() })
    ro.observe(canvas)
    resize()
    draw()
    // The animated spacer gets its height on mount. Re-align far-side deep
    // links after that layout, rather than keeping the pre-hydration offset.
    const alignHash = () => {
      if (!location.hash) return
      if (location.hash === '#life' || location.hash === '#contact') {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
      draw(performance.now(), true)
    }
    const anchorFrame = requestAnimationFrame(alignHash)
    addEventListener('hashchange', alignHash)
    if (calm) return () => {
      cancelAnimationFrame(anchorFrame)
      removeEventListener('hashchange', alignHash)
      ro.disconnect()
      hours.disconnect()
    }

    // run while the sky is in play — over Tech Stack and through the passage —
    // and sleep the rest of the time, woken by scrolling
    let frame = 0
    const loop = (time: number) => {
      frame = draw(time) ? requestAnimationFrame(loop) : 0
    }
    // Draw once after a jump across the passage as well, so direct links to
    // Life or Contact release the iris without needing to cross the tunnel.
    const wake = () => { if (!frame) frame = requestAnimationFrame(loop) }
    addEventListener('scroll', wake, { passive: true })
    addEventListener('resize', wake)
    wake()
    return () => {
      root.removeAttribute('data-warp')
      if (arrival) {
        arrival.inert = false
        arrival.style.clipPath = arrival.style.visibility = arrival.style.maskImage = arrival.style.webkitMaskImage = ''
        delete arrival.dataset.opening
      }
      cancelAnimationFrame(frame)
      cancelAnimationFrame(anchorFrame)
      removeEventListener('hashchange', alignHash)
      removeEventListener('scroll', wake)
      removeEventListener('resize', wake)
      ro.disconnect()
      hours.disconnect()
    }
  }, [calm])

  return (
    <div ref={wrap} className="hole" aria-hidden="true">
      <canvas ref={canvasRef} className="hole-sky" />
      <canvas ref={rimRef} className="hole-rim" />
    </div>
  )
}
