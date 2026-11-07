'use client'

/** The painting at the top of the page.
 *
 *  Every pixel is computed in JS rather than drawn with paths, because the look
 *  it's after — heavy stipple grain, silhouette edges that dissolve into the sky
 *  instead of cutting against it — comes from dithering, and dithering needs the
 *  pixels. A layer's edge is a probability, not a line: at the crest a pixel has
 *  a 50% chance of belonging to the hill, and that chance falls off over a few
 *  pixels, so the boundary reads as spray rather than vector.
 *
 *  It paints once per size and per hour into an offscreen canvas; the frame loop
 *  only blits that and draws the handful of things that move (stars breathing,
 *  the lit window, fireflies). Clicking walks the clock: dusk → night → dawn → day.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { PLACE } from '@/lib/home'
import { HOURS, HOUR_LABEL, THEME_TRANSITION_MS, hourFromDocument, type Hour } from '@/lib/hours'
import Noise from './Noise'

type RGB = [number, number, number]

interface Palette {
  /** sky stops, top to horizon: [position 0–1, colour] */
  sky: [number, RGB][]
  /** the band of light sitting on the horizon */
  glow: RGB
  glowLift: number
  ridge: RGB
  town: RGB
  trees: RGB
  hill: RGB
  near: RGB
  /** the strip of lit ground just under the horizon */
  grass: RGB
  star: RGB
  /** the Golden Gate, a shade out of the haze — International Orange by day */
  bridge: RGB
  /** how strongly its towers are floodlit, 0 by day */
  flood: number
  /** how much colour the meadow's flowers show — full by day, a hint at night */
  bloom: number
  /** the meadow's flowers, in the hour's own colours (the same family as its
   *  trail ramp in home.css), and the light its grass tips catch */
  flowers: RGB[]
  tips: RGB
  /** lit windows downtown, and how many — 0 by day */
  windows: RGB
  windowRate: number
  /** how many sparks drift over the near ground */
  fireflies: number
  moon: number
  /** a sun in place of the moon, and how thick the fog bank is — day only */
  sun?: number
  fog?: number
}

const PALETTES: Record<Hour, Palette> = {
  dusk: {
    sky: [[0, [6, 6, 14]], [0.34, [23, 16, 52]], [0.62, [58, 21, 82]], [0.84, [132, 29, 88]], [1, [206, 48, 104]]],
    glow: [255, 70, 130], glowLift: 1,
    ridge: [52, 44, 104], town: [26, 18, 56], trees: [16, 12, 38], hill: [8, 10, 22], near: [4, 4, 11],
    flowers: [[255, 111, 163], [168, 112, 255], [255, 213, 110], [255, 226, 236]], tips: [196, 110, 150], bloom: 0.38, flood: 0.55, bridge: [70, 30, 58], windows: [255, 190, 150], windowRate: 0.012,
    grass: [34, 104, 52], star: [210, 210, 255], fireflies: 0, moon: 0.55,
  },
  night: {
    sky: [[0, [2, 3, 9]], [0.4, [7, 10, 30]], [0.72, [20, 26, 76]], [0.9, [48, 58, 140]], [1, [96, 112, 196]]],
    glow: [96, 120, 230], glowLift: 0.72,
    ridge: [26, 32, 76], town: [10, 13, 34], trees: [6, 8, 20], hill: [3, 4, 10], near: [2, 2, 6],
    flowers: [[143, 168, 255], [232, 236, 255], [95, 130, 232], [255, 242, 196]], tips: [110, 130, 200], bloom: 0.2, flood: 1, bridge: [14, 18, 44], windows: [255, 214, 160], windowRate: 0.02,
    grass: [18, 54, 40], star: [226, 232, 255], fireflies: 26, moon: 1,
  },
  dawn: {
    sky: [[0, [9, 8, 20]], [0.36, [34, 22, 56]], [0.64, [92, 40, 84]], [0.85, [192, 86, 92]], [1, [255, 170, 120]]],
    glow: [255, 160, 110], glowLift: 0.9,
    ridge: [66, 50, 86], town: [30, 22, 44], trees: [18, 14, 30], hill: [10, 9, 16], near: [5, 5, 9],
    flowers: [[239, 110, 147], [255, 173, 128], [255, 234, 184], [176, 106, 160]], tips: [214, 150, 130], bloom: 0.5, flood: 0.3, bridge: [96, 44, 50], windows: [255, 210, 170], windowRate: 0.006,
    grass: [48, 104, 56], star: [255, 230, 214], fireflies: 0, moon: 0.2,
  },
  // An afternoon over the Golden Gate: blue overhead paling to haze at the
  // horizon, the far hills gone blue with distance, the city a cool grey,
  // the bridge in its own orange, and the near hills the gold-green of
  // California grass in the sun. The fog bank is drawn separately.
  day: {
    sky: [[0, [50, 98, 156]], [0.38, [88, 138, 186]], [0.72, [140, 174, 202]], [1, [182, 202, 212]]],
    glow: [228, 230, 218], glowLift: 0.24,
    ridge: [118, 140, 162], town: [88, 106, 128],
    trees: [48, 82, 56], hill: [74, 100, 52], near: [26, 46, 30],
    flowers: [[79, 168, 240], [255, 224, 116], [244, 243, 232], [98, 214, 150]], tips: [188, 206, 118], bloom: 1, flood: 0, bridge: [168, 86, 64], windows: [255, 236, 200], windowRate: 0,
    grass: [150, 160, 88], star: [208, 216, 171], fireflies: 0, moon: 0, sun: 0.72, fog: 0.84,
  },
}

/* ── deterministic noise ─────────────────────────────────────────────── */

const hash1 = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453123
  return s - Math.floor(s)
}

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

/** 1D value noise — smooth between integer lattice points. */
function vnoise(x: number, seed: number) {
  const i = Math.floor(x)
  const f = x - i
  const u = f * f * (3 - 2 * f)
  return hash1(i + seed) * (1 - u) + hash1(i + 1 + seed) * u
}

function fbm(x: number, seed: number, octaves = 4) {
  let v = 0, a = 0.5, f = 1
  for (let o = 0; o < octaves; o++) {
    v += a * vnoise(x * f, seed + o * 57)
    f *= 2
    a *= 0.5
  }
  return v
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep01 = (t: number) => { const k = t < 0 ? 0 : t > 1 ? 1 : t; return k * k * (3 - 2 * k) }
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

function sampleSky(stops: [number, RGB][], t: number): RGB {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0] || i === stops.length - 1) {
      const [p0, c0] = stops[i - 1]
      const [p1, c1] = stops[i]
      const k = clamp01((t - p0) / (p1 - p0 || 1))
      return [lerp(c0[0], c1[0], k), lerp(c0[1], c1[1], k), lerp(c0[2], c1[2], k)]
    }
  }
  return stops[0][1]
}

/* ── the skyline ─────────────────────────────────────────────────────── */

/** Towers and spires scattered along the far bank, seeded so they never move. */
interface Tower { x: number; w: number; h: number; spire: boolean }

function towers(width: number): Tower[] {
  const out: Tower[] = []
  let x = -0.04
  for (let i = 0; i < 40 && x < 1.06; i++) {
    const w = 0.012 + hash1(i * 3.3) * 0.03
    const h = 0.18 + hash1(i * 7.7) ** 2.2 * 1.5
    out.push({ x: x * width, w: w * width, h, spire: hash1(i * 11.3) > 0.78 })
    x += w + 0.004 + hash1(i * 5.1) * 0.035
  }
  return out
}

export interface SceneOptions { width: number; height: number; hour: Hour }

/* ── San Francisco ───────────────────────────────────────────────────── */

/* The town on the horizon is San Francisco seen from the north: the Golden
 * Gate on the left, crossing in front of the far hills, and downtown on the
 * right, with the handful of buildings that make the skyline recognisable at
 * this size. Positions are fractions of the
 * banner's width, heights fractions of its height, so it holds at any size. */

/** Where downtown starts and ends, and where the bridge spans. */
const DOWNTOWN: [number, number] = [0.6, 0.86]
const SPAN: [number, number] = [0.035, 0.475]

interface Landmark { u: number; half: number; tall: number; top: (k: number, side: number) => number }

/** Downtown, by height. `top(k, side)` lowers the roof by a fraction of the
 *  building's height, given k = 0 at its centreline and 1 at its edge. */
const LANDMARKS: Landmark[] = [
  // Salesforce Tower: the tallest, its crown curving in to a rounded top
  { u: 0.705, half: 0.0085, tall: 0.215, top: k => 0.16 * k * k },
  // the Transamerica Pyramid: a needle-sharp pyramid, its spire handled below
  { u: 0.765, half: 0.0115, tall: 0.18, top: k => k },
  // 181 Fremont: slim, the roof cut on a slant
  { u: 0.683, half: 0.0062, tall: 0.168, top: (_k, side) => 0.07 * (side + 1) / 2 },
  // the rest of the financial district, square-topped
  { u: 0.622, half: 0.01, tall: 0.07, top: () => 0 },
  { u: 0.642, half: 0.008, tall: 0.098, top: () => 0 },
  { u: 0.657, half: 0.0072, tall: 0.12, top: () => 0 },
  { u: 0.724, half: 0.0095, tall: 0.135, top: () => 0 },
  { u: 0.742, half: 0.0065, tall: 0.094, top: () => 0 },
  { u: 0.788, half: 0.0085, tall: 0.112, top: () => 0 },
  { u: 0.806, half: 0.011, tall: 0.074, top: () => 0 },
  { u: 0.826, half: 0.0072, tall: 0.058, top: () => 0 },
]

/** The top of downtown at column x, in pixels — or Infinity where it's empty. */
function skyline(x: number, w: number, h: number, horizon: number): number {
  let top = Infinity
  for (const b of LANDMARKS) {
    const cx = b.u * w
    const half = Math.max(1.5, b.half * w)
    const dx = x + 0.5 - cx
    if (Math.abs(dx) > half) continue
    const k = Math.abs(dx) / half
    top = Math.min(top, horizon - b.tall * h * (1 - b.top(k, Math.sign(dx))))
  }
  // the Transamerica spire, and the two wings near its top
  const ta = LANDMARKS[1], tx = ta.u * w, tHalf = Math.max(1.5, ta.half * w)
  if (Math.abs(x + 0.5 - tx) < 0.75) top = Math.min(top, horizon - ta.tall * h - h * 0.032)
  if (Math.abs(x + 0.5 - tx) < tHalf * 0.3 + Math.max(1.2, w * 0.0016)) {
    top = Math.min(top, horizon - ta.tall * h * 0.86)
  }
  // Coit Tower on Telegraph Hill, at the north end of downtown
  const hill = Math.exp(-(((x / w - 0.852) / 0.018) ** 2)) * h * 0.022
  if (hill > 0.5) top = Math.min(top, horizon - hill)
  if (Math.abs(x + 0.5 - 0.852 * w) < Math.max(1.2, w * 0.0018)) top = Math.min(top, horizon - h * 0.022 - h * 0.042)
  return top
}

/** The Golden Gate, rasterised once into a coverage mask so the pixel loop
 *  can lay it down in the right place among the layers — in front of the far
 *  hills, behind the trees and the mist. Also reports where its tower tops
 *  are, for their aviation lights, and where its deck runs, for its lamps.
 *
 *  Sutro Tower was tried on the ridge and taken out: the ridge is so hazy
 *  that the tower read as a tripod floating in the sky. */
function landmarksMask(w: number, h: number, horizon: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = g.strokeStyle = '#fff'

  const deck = horizon - h * 0.008
  const xa = SPAN[0] * w, xb = SPAN[1] * w
  // towers about a fifth and four-fifths of the way along, as on the real one
  const t1 = xa + (xb - xa) * 0.22
  const t2 = xa + (xb - xa) * 0.79
  const top = deck - h * 0.17
  const sag = deck - h * 0.03
  const leg = Math.max(1, Math.round(w * 0.0026))
  const gap = Math.max(3, Math.round(w * 0.0052))

  for (const tx of [t1, t2]) {
    const left = Math.round(tx - gap / 2 - leg)
    const right = Math.round(tx + gap / 2)
    // two legs, running down past the deck into the haze
    g.fillRect(left, top, leg, deck - top + h * 0.03)
    g.fillRect(right, top, leg, deck - top + h * 0.03)
    // the portal struts, closer together near the top as on the real towers
    for (const f of [0, 0.16, 0.34, 0.55]) g.fillRect(left, Math.round(top + (deck - top) * f), right + leg - left, 1)
    // a stepped crown
    g.fillRect(left, Math.round(top) - 2, leg, 2)
    g.fillRect(right, Math.round(top) - 2, leg, 2)
  }

  // the main cable: side spans rising to the towers, the main span sagging
  // between them (a quadratic whose low point lands exactly on `sag`)
  const cy = 2 * sag - top
  g.lineWidth = Math.max(1, h * 0.0028)
  g.beginPath()
  g.moveTo(xa, deck)
  g.quadraticCurveTo((xa + t1) / 2, deck - (deck - top) * 0.36, t1, top)
  g.quadraticCurveTo((t1 + t2) / 2, cy, t2, top)
  g.quadraticCurveTo((t2 + xb) / 2, deck - (deck - top) * 0.36, xb, deck)
  g.stroke()

  // suspender cables, every few pixels from the main cable to the deck
  g.globalAlpha = 0.42
  const step = Math.max(3, Math.round(w * 0.0036))
  for (let x = t1 + step; x < t2 - 1; x += step) {
    const t = (x - t1) / (t2 - t1)
    const y = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * cy + t * t * top
    g.fillRect(Math.round(x), Math.round(y), 1, Math.round(deck - y))
  }
  g.globalAlpha = 1
  // the deck
  g.fillRect(Math.round(xa), Math.round(deck), Math.round(xb - xa), Math.max(2, Math.round(h * 0.005)))

  const data = g.getImageData(0, 0, w, h).data
  const cover = new Float32Array(w * h)
  for (let i = 0; i < cover.length; i++) cover[i] = data[i * 4 + 3] / 255
  return {
    cover,
    lights: [{ x: t1, y: top - 3 }, { x: t2, y: top - 3 }],
    deck: { x0: xa, x1: xb, y: Math.round(deck), stride: Math.max(4, Math.round(w * 0.0055)) },
    towers: [t1, t2].map(tx => ({
      left: Math.round(tx - gap / 2 - leg), right: Math.round(tx + gap / 2), leg, top: Math.round(top) - 2, base: Math.round(deck),
    })),
  }
}

/** One lit window, in the tallest tower near the middle — the single warm thing. */
interface Lit { x: number; y: number }

/** Paints the whole picture into `data` and reports where the lit window landed. */
function paint(data: Uint8ClampedArray, w: number, h: number, hour: Hour): {
  lit: Lit; crest: (x: number) => number; beacons: { x: number; y: number }[]
  deck: { x0: number; x1: number; y: number; stride: number }
  towers: { left: number; right: number; leg: number; top: number; base: number }[]
  near: (x: number) => number
} {
  const p = PALETTES[hour]
  const horizon = h * 0.52

  // every layer's silhouette, as a height in pixels for each column
  const ridgeH = new Float32Array(w)
  const townH = new Float32Array(w)
  const townSoft = new Float32Array(w)
  /** the billowing top of the fog bank, per column — day only */
  const fogH = new Float32Array(w)
  const treeH = new Float32Array(w)
  const hillH = new Float32Array(w)
  const fgH = new Float32Array(w)
  const leafLight = hour === 'day' ? new Float32Array(w) : null
  const T = towers(w)

  // the near trees, hanging into frame from the edges the way they do in the
  // paintings this is after: each is a lopsided dome rising off the bottom
  const CLUMPS = [
    { c: -0.03, r: 0.17, top: 0.40 },
    { c: 1.03, r: 0.19, top: 0.33 },
    { c: 0.86, r: 0.07, top: 0.68 },
  ]

  for (let x = 0; x < w; x++) {
    const u = x / w
    // one big soft mass, off to the left, the way a far mountain sits in haze
    const hump = Math.exp(-(((u - 0.42) / 0.26) ** 2)) * h * 0.30
    ridgeH[x] = horizon - hump * (0.8 + fbm(u * 3, 11) * 0.4) - h * 0.01

    // Under the bridge there's only the far shore. From where the bridge lands
    // the ground climbs — the Presidio, then the hills of the city — and the
    // low-rise neighbourhoods grow in over that climb, so the shore turns into
    // town gradually instead of stepping up at the bridge's end. They carry
    // on, lower, between the downtown towers, so downtown doesn't begin on a
    // line either.
    const rise = smoothstep01((u - SPAN[1]) / 0.15)
    const inDowntown = u > DOWNTOWN[0] && u < DOWNTOWN[1]
    const ground = 0.012 + 0.026 * rise + 0.012 * rise * Math.sin(u * 19 + 1.3) ** 2
    let t = horizon - h * ground - fbm(u * 6, 23) * h * (0.008 + 0.012 * rise)
    const lowRise = rise * (inDowntown ? 0.032 : 0.045)
    if (lowRise > 0.001) {
      for (const tw of T) {
        if (x >= tw.x && x < tw.x + tw.w) t = Math.min(t, horizon - h * ground - tw.h * h * lowRise)
      }
    }
    if (inDowntown) t = Math.min(t, skyline(x, w, h, horizon))
    townH[x] = t
    // low on the water: the top hugs the deck, billowing a little over it in
    // places, so the towers and most of the span stand clear
    fogH[x] = horizon - h * 0.008 - fbm(u * 11, 301, 3) * h * 0.03 - Math.abs(Math.sin(u * 23 + 0.7)) * h * 0.008
    townSoft[x] = inDowntown ? h * 0.006 : h * 0.018

    // crowns: lumps of foliage rather than a smooth line
    const crown = fbm(u * 9, 41, 3) * h * 0.05 + Math.abs(Math.sin(u * 37 + fbm(u * 4, 61) * 6)) * h * 0.035
    treeH[x] = horizon + h * 0.06 - crown
    if (leafLight) {
      const patches = Math.exp(-(((u - 0.23) / 0.075) ** 2)) +
        0.8 * Math.exp(-(((u - 0.73) / 0.06) ** 2))
      leafLight[x] = patches * (0.55 + fbm(u * 28, 211, 3) * 0.45)
    }

    hillH[x] = horizon + h * 0.2 - fbm(u * 2.2, 83) * h * 0.08 - Math.sin(u * 2.1 + 1.4) * h * 0.05

    let f = h * 2
    for (const cl of CLUMPS) {
      const k = (u - cl.c) / cl.r
      if (Math.abs(k) < 1) {
        const dome = Math.sqrt(1 - k * k)
        const leaf = (fbm(u * 26, 137, 3) - 0.5) * h * 0.06 + Math.abs(Math.sin(u * 61)) * h * 0.012
        f = Math.min(f, h * cl.top + (1 - dome) * h * 0.8 + leaf)
      }
    }
    fgH[x] = f
  }

  // the one lit window, high in a tower just south of Salesforce
  const lb = LANDMARKS[6]
  const lit: Lit = { x: Math.round(lb.u * w), y: Math.round(horizon - lb.tall * h * 0.72) }

  const sf = landmarksMask(w, h, horizon)

  // How open the horizon is, for the glow. Taken from a blurred skyline:
  // per column, every tall tower used to paint its own stripe up the sky.
  const openH = new Float32Array(w)
  {
    const radius = Math.max(4, Math.round(w * 0.045))
    let sum = 0
    for (let x = -radius; x < w + radius; x++) {
      sum += townH[Math.max(0, Math.min(w - 1, x + radius))]
      if (x - radius - 1 >= -radius) sum -= townH[Math.max(0, Math.min(w - 1, x - radius - 1))]
      if (x >= 0 && x < w) openH[x] = sum / (radius * 2 + 1)
    }
  }

  const glowCore = horizon - h * 0.012

  for (let y = 0; y < h; y++) {
    const skyT = clamp01(y / horizon)
    const base = sampleSky(p.sky, skyT)

    // the horizon band, falling off much faster upwards than down
    const d = y - glowCore
    const spread = hour === 'day' ? h * (d < 0 ? 0.12 : 0.035) : h * (d < 0 ? 0.20 : 0.05)
    const glowAmt = Math.exp(-((d / spread) ** 2)) * p.glowLift

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let r = base[0], g = base[1], b = base[2]

      if (glowAmt > 0.004) {
        // the band is brighter where the land dips, as if the light came from behind it
        const open = clamp01((openH[x] - (horizon - h * 0.16)) / (h * 0.16))
        const a = glowAmt * (0.35 + open * 0.65)
        r += (p.glow[0] - r) * a
        g += (p.glow[1] - g) * a
        b += (p.glow[2] - b) * a
      }

      // a hand-held moon, only worth drawing when the palette wants one
      if (p.sun) {
        // a soft afternoon sun, more halo than disc — in exactly the moon's
        // place, so stepping the hour changes what's in the sky, not where
        const sx = w * 0.82, sy = h * 0.14, sr = Math.max(5, h * 0.024)
        const ds = Math.hypot(x - sx, y - sy)
        if (ds < sr * 9) {
          const halo = Math.exp(-((ds / (sr * 3)) ** 2)) * 0.36
          const disc = ds < sr ? 1 - clamp01((ds - sr + 2) / 2) : 0
          const a = clamp01(halo + disc * 0.95) * p.sun
          r += (255 - r) * a
          g += (251 - g) * a
          b += (238 - b) * a
        }
      }

      if (p.moon > 0.05) {
        const mx = w * 0.82, my = h * 0.14, mr = Math.max(5, h * 0.022)
        const dm = Math.hypot(x - mx, y - my)
        if (dm < mr * 7) {
          const halo = Math.exp(-((dm / (mr * 2.6)) ** 2)) * 0.30 * p.moon
          const disc = dm < mr ? 1 - clamp01((dm - mr + 1.5) / 1.5) : 0
          const a = clamp01(halo + disc * 0.92 * p.moon)
          r += (236 - r) * a
          g += (238 - g) * a
          b += (255 - b) * a
        }
      }

      // stars, thinning out as the sky warms toward the horizon
      if (hour !== 'day' && y < horizon * 0.82) {
        const s = hash2(x, y)
        if (s > 0.99935) {
          const a = (1 - y / (horizon * 0.82)) * (0.4 + hash2(y, x) * 0.6)
          r += (p.star[0] - r) * a
          g += (p.star[1] - g) * a
          b += (p.star[2] - b) * a
        }
      }

      // the land, back to front. `soft` is how many pixels the edge sprays over.
      const n = hash2(x * 1.7, y * 2.3)
      const put = (hgt: number, col: RGB, soft: number, mix = 1) => {
        const cover = clamp01((y - hgt) / soft + 0.5)
        if (cover > 0 && n < cover) {
          r += (col[0] - r) * mix
          g += (col[1] - g) * mix
          b += (col[2] - b) * mix
        }
      }

      put(ridgeH[x], p.ridge, h * 0.16, 0.7)
      put(townH[x], p.town, townSoft[x], 0.9)

      // the bridge and Sutro, a shade lighter than the town for the distance
      const bc = sf.cover[y * w + x]
      if (bc > 0.02) {
        const a = bc * 0.92
        r += (p.bridge[0] - r) * a
        g += (p.bridge[1] - g) * a
        b += (p.bridge[2] - b) * a
      }

      // Karl the fog: a white bank lying on the water, thick through the Gate
      // and thinning toward the city, its top billowing, so the bridge's
      // towers stand up out of it the way they do most summer afternoons
      if (p.fog) {
        const reach = 1 - smoothstep01((x / w - 0.3) / 0.4)
        if (reach > 0.01) {
          const cover = clamp01((y - fogH[x]) / (h * 0.034) + 0.35)
          const below = 1 - clamp01((y - (horizon + h * 0.025)) / (h * 0.05))
          const a = cover * below * reach * 0.8 * p.fog
          if (a > 0.01 && n < cover) {
            r += (246 - r) * a
            g += (248 - g) * a
            b += (250 - b) * a
          }
        }
      }

      // the deck's lamps, a dotted line across the span whenever it's not day
      if (p.windowRate > 0 && y === sf.deck.y - 1 && x > sf.deck.x0 + 2 && x < sf.deck.x1 - 2 &&
          x % sf.deck.stride === 0) {
        r += (p.windows[0] - r) * 0.8
        g += (p.windows[1] - g) * 0.8
        b += (p.windows[2] - b) * 0.8
      }

      // downtown after dark: a scatter of lit windows on the towers' faces
      if (p.windowRate > 0 && y > townH[x] + 2 && y < horizon - 1 &&
          x > DOWNTOWN[0] * w && x < DOWNTOWN[1] * w && x % 2 === 0 && y % 2 === 0 &&
          hash2(x * 0.71, y * 1.37) < p.windowRate) {
        const a = 0.55 + hash2(y, x) * 0.4
        r += (p.windows[0] - r) * a
        g += (p.windows[1] - g) * a
        b += (p.windows[2] - b) * a
      }

      // the field below the town, catching what's left of the light and
      // dissolving into the dark rather than ending on a line
      const fieldTop = horizon + h * 0.015
      if (y > fieldTop) {
        const k = clamp01(1 - (y - fieldTop) / (h * 0.22)) ** 1.6 * 0.46
        const edge = clamp01((y - fieldTop) / (h * 0.03))
        if (n < edge) {
          r += (p.grass[0] - r) * k
          g += (p.grass[1] - g) * k
          b += (p.grass[2] - b) * k
        }
      }

      put(treeH[x], p.trees, h * 0.014)
      if (leafLight && leafLight[x] > 0.01) {
        const depth = (y - treeH[x]) / h
        if (depth > 0.007 && depth < 0.075 && n > 0.35) {
          const light = leafLight[x] * clamp01((depth - 0.007) / 0.015) *
            Math.exp(-(((depth - 0.026) / 0.023) ** 2)) * 0.46 * (0.45 + n * 0.55)
          r += (24 - r) * light
          g += (144 - g) * light
          b += (77 - b) * light
        }
      }

      // mist pooling in front of the town, so the trees sit in air not on glass
      const mist = Math.exp(-(((y - (horizon + h * 0.035)) / (h * 0.055)) ** 2)) * 0.13 * p.glowLift
      if (mist > 0.004) {
        r += (p.glow[0] - r) * mist
        g += (p.glow[1] - g) * mist
        b += (p.glow[2] - b) * mist
      }

      put(hillH[x], p.hill, h * 0.012)

      // by day the near slope is lit at the crest and falls into shade toward
      // the bottom of the frame, with a few darker swathes through the grass,
      // instead of reading as one flat lawn
      if (p.sun && y > hillH[x]) {
        const depth = clamp01((y - hillH[x]) / (h - hillH[x] + 1))
        const swathe = (fbm(x / w * 7 + y / h * 3, 401, 3) - 0.5) * 0.18
        const shade = clamp01(0.52 * depth ** 0.85 + swathe)
        r *= 1 - shade
        g *= 1 - shade * 0.92
        b *= 1 - shade * 0.7
      }
      put(fgH[x], p.near, h * 0.018)

      // the grain itself: strongest through the gradient, barely there in the dark
      const lum = (r + g + b) / 765
      const amp = 8 + 42 * Math.exp(-(((lum - 0.34) / 0.3) ** 2))
      const nz = (hash2(x * 3.1 + 0.5, y * 5.7 + 0.5) - 0.5) * amp
      const nc = (hash2(x * 9.3, y * 1.9) - 0.5) * amp * 0.45

      data[i] = r + nz + nc
      data[i + 1] = g + nz
      data[i + 2] = b + nz - nc
      data[i + 3] = 255
    }
  }

  return {
    lit, beacons: sf.lights, deck: sf.deck, towers: sf.towers,
    crest: (x: number) => hillH[Math.max(0, Math.min(w - 1, Math.round(x)))],
    near: (x: number) => fgH[Math.max(0, Math.min(w - 1, Math.round(x)))],
  }
}

/** The bridge after dark. Its towers are lit from below, so each leg glows
 *  amber at its foot and fades toward the crown, inside a soft halo; and every
 *  deck lamp gets a small glow of its own. Screen-blended onto the baked
 *  painting, which is why a lamp the trees hide is checked for first — it's
 *  only lit where the baked pixel shows it. */
function floodlight(
  ctx: CanvasRenderingContext2D,
  out: { deck: { x0: number; x1: number; y: number; stride: number }; towers: { left: number; right: number; leg: number; top: number; base: number }[] },
  img: ImageData, strength: number, w: number,
) {
  if (strength <= 0) return
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  for (const t of out.towers) {
    const tall = t.base - t.top
    const cx = (t.left + t.right + t.leg) / 2
    const halo = ctx.createRadialGradient(cx, t.base - tall * 0.25, 0, cx, t.base - tall * 0.25, tall * 0.75)
    halo.addColorStop(0, `rgba(255,150,70,${0.2 * strength})`)
    halo.addColorStop(1, 'rgba(255,150,70,0)')
    ctx.fillStyle = halo
    ctx.fillRect(cx - tall, t.top - tall * 0.2, tall * 2, tall * 1.5)
    const legs = ctx.createLinearGradient(0, t.base, 0, t.top)
    legs.addColorStop(0, `rgba(255,178,96,${0.9 * strength})`)
    legs.addColorStop(0.55, `rgba(255,160,84,${0.5 * strength})`)
    legs.addColorStop(1, `rgba(255,150,80,${0.22 * strength})`)
    ctx.fillStyle = legs
    ctx.fillRect(t.left, t.top, t.leg, tall)
    ctx.fillRect(t.right, t.top, t.leg, tall)
  }
  const y = out.deck.y - 1
  for (let x = Math.ceil(out.deck.x0 + 3); x < out.deck.x1 - 2; x++) {
    if (x % out.deck.stride !== 0) continue
    const i = (y * w + x) * 4
    // a lamp the trees have covered is dark in the baked image — leave it
    if (img.data[i] + img.data[i + 1] < 280) continue
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 3.5)
    glow.addColorStop(0, `rgba(255,200,130,${0.55 * strength})`)
    glow.addColorStop(1, 'rgba(255,200,130,0)')
    ctx.fillStyle = glow
    ctx.fillRect(x - 4, y - 4, 8, 8)
  }
  ctx.restore()
}

/** The near hill's grass and wildflowers.
 *
 *  Grass first, because that's most of what a meadow is: thousands of fine
 *  blades, dark at the root and catching the light at the tip, leaning a
 *  little with the wind, taller toward the front; a few stand up over the
 *  crest so its edge against the trees isn't a ruled line. Flowers grow the
 *  way wildflowers do — in patches, each mostly one kind — plus a light
 *  scatter between them; tiny and pale toward the crest, larger and brighter
 *  in front. Everything is drawn back to front, so blades nearer the eye lie
 *  across the flowers behind them. Then it's all grained like the land, so it
 *  sits in the painting rather than on it.
 *
 *  The flowers' colours are the hour's own (p.flowers), so a dusk meadow is
 *  pinks and violets, night blues, dawn rose and apricot, day blue and gold. */
function meadow(
  ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette,
  crest: (x: number) => number, near: (x: number) => number,
) {
  const hill = p.hill
  const light = p.bloom
  // the meadow runs right to the bottom edge — the bar along the bottom
  // carries its own soft shade (.scene-bar in home.css), so the hour and the
  // clock stay readable without leaving a bare strip under them
  const floor = h - 3
  const rgba = (c: RGB, a: number) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`
  const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
  const root: RGB = [hill[0] * 0.62, hill[1] * 0.66, hill[2] * 0.62]

  // grain applies only to what this draws, so take the painting as it was
  const top0 = Math.max(0, Math.floor(Math.min(crest(0), crest(w * 0.5), crest(w - 1)) - h * 0.06))
  const under = ctx.getImageData(0, top0, w, h - top0)

  type Item = { y: number; draw: () => void }
  const items: Item[] = []
  let k = 0
  const r = () => hash1(++k * 12.9898 + 0.731)

  // ── grass ────────────────────────────────────────────────────────────
  const blades = Math.round(w * 2.8)
  for (let i = 0; i < blades; i++) {
    const x = r() * w
    const top = crest(x)
    const bottom = Math.min(h - 1, near(x) - 2)
    if (bottom <= top + 1) continue
    // a few right on the crest, so its edge breaks up
    const onCrest = i % 9 === 0
    const depth = onCrest ? 0 : r() ** 0.85
    const y = onCrest ? top + 1 + r() * 2 : top + 2 + (bottom - top - 2) * depth
    const scale = 0.55 + depth * 1.9
    const tall = (3.5 + r() * 8.5) * scale * (onCrest ? 0.8 : 1)
    const lean = (r() - 0.35) * tall * 0.55
    const tipLight = 0.25 + r() * 0.45 + depth * 0.1
    const tip = mixRGB(hill, p.tips, tipLight)
    const alpha = 0.55 + r() * 0.4
    const width = depth > 0.72 ? 1.4 : 1
    items.push({ y, draw: () => {
      ctx.lineWidth = width
      const mx = x + lean * 0.35, my = y - tall * 0.55
      ctx.strokeStyle = rgba(root, alpha)
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.05, y - tall * 0.3, mx, my); ctx.stroke()
      ctx.strokeStyle = rgba(tip, alpha)
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(x + lean * 0.7, y - tall * 0.85, x + lean, y - tall); ctx.stroke()
    } })
  }

  // ── flowers ──────────────────────────────────────────────────────────
  const flower = (x: number, y: number, depth: number, colour: RGB) => {
    // far off they're paler and lower in contrast, as the air comes between
    const air = (1 - depth) * 0.45
    const c = mixRGB(mixRGB(hill, colour, light), mixRGB(hill, p.tips, 0.5), air)
    const hi = mixRGB(c, [255, 255, 255], 0.35 * light)
    const size = depth < 0.3 ? 1 : depth < 0.62 ? 2 : 3
    const alpha = (0.72 + r() * 0.28) * (0.75 + depth * 0.25)
    const stem = depth > 0.45 ? 2 + r() * 4 * depth : 0
    items.push({ y: y + 0.5, draw: () => {
      const fx = Math.round(x), fy = Math.round(y - stem)
      if (stem) {
        ctx.fillStyle = rgba(root, 0.8)
        ctx.fillRect(fx, fy, 1, Math.round(stem))
      }
      ctx.fillStyle = rgba(c, alpha)
      if (size === 1) ctx.fillRect(fx, fy, 1, 1)
      else if (size === 2) { ctx.fillRect(fx - 1, fy - 1, 2, 2); ctx.fillStyle = rgba(hi, alpha); ctx.fillRect(fx - 1, fy - 1, 1, 1) }
      else {
        // a little five-petalled head with a brighter middle
        ctx.fillRect(fx - 1, fy - 2, 3, 3)
        ctx.fillRect(fx - 2, fy - 1, 5, 1)
        ctx.fillRect(fx, fy - 3, 1, 5)
        ctx.fillStyle = rgba(hi, alpha)
        ctx.fillRect(fx, fy - 1, 1, 1)
      }
    } })
  }

  const place = (x: number, depth: number) => {
    const top = crest(x) + 3
    const bottom = Math.min(floor, near(x) - 3)
    return bottom > top ? top + (bottom - top) * depth : null
  }

  // patches: a centre, a spread that grows with nearness, mostly one colour
  const patches = Math.max(8, Math.round(w / 52))
  for (let i = 0; i < patches; i++) {
    const cx = r() * w
    const cd = 0.12 + r() * 0.85
    const main = p.flowers[Math.floor(r() * p.flowers.length)]
    const n = Math.round((10 + r() * 26) * (0.6 + cd * 0.8))
    const spreadX = (18 + r() * 30) * (0.6 + cd * 1.4)
    for (let f = 0; f < n; f++) {
      // a soft Gaussian scatter round the centre, flatter than it is wide
      const gx = (r() + r() + r() - 1.5) * spreadX
      const depth = Math.max(0, Math.min(1, cd + (r() + r() - 1) * 0.16))
      const x = cx + gx
      if (x < 0 || x >= w) continue
      const y = place(x, depth)
      if (y === null) continue
      const colour = r() < 0.82 ? main : p.flowers[Math.floor(r() * p.flowers.length)]
      flower(x, y, depth, colour)
    }
  }
  // and a light scatter between the patches
  const loose = Math.round(w * 0.35)
  for (let i = 0; i < loose; i++) {
    const x = r() * w
    const depth = r() ** 0.8
    const y = place(x, depth)
    if (y === null) continue
    flower(x, y, depth, p.flowers[Math.floor(r() * p.flowers.length)])
  }

  items.sort((a, b) => a.y - b.y)
  for (const item of items) item.draw()

  grain(ctx, 0, top0, w, h - top0, 18, under)
}

/* ── what stands on the crest ────────────────────────────────────────── */

/* A person and a parked car, drawn as vector silhouettes rather than pixel
 * blocks. The painting around them is grain, not a pixel grid, so a crisp
 * sprite always looked pasted on; a smooth shape with a thin rim of sky light,
 * grained the same way as the land, sits in it. Both are drawn in their own
 * unit space — the car one unit long, the person one unit tall, ground at
 * y = 0 and up negative — and scaled to the banner, so they keep their
 * proportions at any size. */

interface Inks { body: string; glass: string; rim: string; tyre: string; rimLine: string }

function inks(hour: Hour): Inks {
  // in daylight the car is a dark paint job rather than a silhouette: its glass
  // throws back the sky and the sun picks out its edges
  if (hour === 'day') return { body: '#2e3e4b', glass: '#9cbfd4', rim: 'rgba(255,255,255,0.55)', tyre: '#12171c', rimLine: 'rgba(255,255,255,0.3)' }
  if (hour === 'dawn') return { body: '#0a070c', glass: '#3a2632', rim: 'rgba(255,196,156,0.6)', tyre: '#040305', rimLine: 'rgba(255,196,156,0.22)' }
  if (hour === 'night') return { body: '#03040a', glass: '#1d2850', rim: 'rgba(170,190,255,0.55)', tyre: '#010206', rimLine: 'rgba(170,190,255,0.2)' }
  return { body: '#05040b', glass: '#2a1d3c', rim: 'rgba(255,140,186,0.6)', tyre: '#020205', rimLine: 'rgba(255,140,186,0.22)' }
}

/** The body of a long-hood fastback coupe, nose to the left. */
function carBody(): Path2D {
  const p = new Path2D()
  p.moveTo(0.012, -0.065)
  p.bezierCurveTo(0.0, -0.08, 0.0, -0.112, 0.016, -0.124)        // nose
  p.bezierCurveTo(0.07, -0.142, 0.22, -0.154, 0.37, -0.168)      // long hood
  p.bezierCurveTo(0.41, -0.2, 0.44, -0.236, 0.49, -0.256)        // windscreen
  p.bezierCurveTo(0.55, -0.276, 0.62, -0.272, 0.665, -0.258)     // roof
  p.bezierCurveTo(0.76, -0.226, 0.86, -0.19, 0.95, -0.168)       // fastback
  p.bezierCurveTo(0.985, -0.16, 1.0, -0.146, 0.998, -0.118)      // tail
  p.lineTo(0.992, -0.07)
  // underside, cut by the two wheel arches
  p.lineTo(0.875, -0.066)
  p.arc(0.785, -0.066, 0.09, 0, Math.PI, true)
  p.lineTo(0.3, -0.066)
  p.arc(0.21, -0.066, 0.09, 0, Math.PI, true)
  p.closePath()
  return p
}

/** The greenhouse: windscreen to rear quarter, split at the B-pillar. */
function carGlass(): Path2D {
  const p = new Path2D()
  p.moveTo(0.408, -0.176)
  p.bezierCurveTo(0.44, -0.208, 0.47, -0.236, 0.505, -0.248)
  p.bezierCurveTo(0.54, -0.258, 0.58, -0.258, 0.592, -0.256)
  p.lineTo(0.6, -0.18)
  p.closePath()
  p.moveTo(0.618, -0.254)
  p.bezierCurveTo(0.66, -0.25, 0.72, -0.232, 0.8, -0.196)
  p.lineTo(0.792, -0.182)
  p.lineTo(0.62, -0.18)
  p.closePath()
  return p
}

/** A person in a jacket, hands in pockets, weight on the back leg. */
function personBody(): Path2D {
  const p = new Path2D()
  // head, with a little hair at the back
  p.ellipse(-0.012, -0.918, 0.06, 0.07, 0, 0, Math.PI * 2)
  p.moveTo(0.03, -0.93)
  p.ellipse(0.012, -0.935, 0.058, 0.058, 0, 0, Math.PI * 2)
  // neck into the collar
  p.moveTo(-0.03, -0.86)
  p.lineTo(0.026, -0.86)
  p.lineTo(0.032, -0.8)
  p.lineTo(-0.036, -0.8)
  p.closePath()
  // jacket: rounded shoulders, arms hanging close, hem at the hip
  p.moveTo(-0.04, -0.82)
  p.bezierCurveTo(-0.1, -0.815, -0.13, -0.795, -0.132, -0.75)
  p.bezierCurveTo(-0.136, -0.66, -0.13, -0.58, -0.112, -0.49)    // front arm
  p.lineTo(-0.086, -0.47)                                        // hand at the pocket
  p.lineTo(-0.094, -0.44)
  p.lineTo(0.094, -0.44)
  p.lineTo(0.11, -0.47)
  p.bezierCurveTo(0.13, -0.58, 0.138, -0.66, 0.134, -0.75)       // back arm
  p.bezierCurveTo(0.13, -0.795, 0.1, -0.815, 0.04, -0.82)
  p.closePath()
  // legs: the front one straight, the back one taking the weight
  p.moveTo(-0.082, -0.45)
  p.lineTo(-0.008, -0.45)
  p.lineTo(-0.02, -0.035)
  p.lineTo(-0.066, -0.035)
  p.closePath()
  p.moveTo(0.004, -0.45)
  p.lineTo(0.08, -0.45)
  p.lineTo(0.066, -0.035)
  p.lineTo(0.02, -0.035)
  p.closePath()
  // shoes, pointing toward the town
  p.moveTo(-0.07, -0.04)
  p.bezierCurveTo(-0.11, -0.04, -0.118, -0.012, -0.1, 0)
  p.lineTo(-0.016, 0)
  p.lineTo(-0.018, -0.04)
  p.closePath()
  p.moveTo(0.018, -0.04)
  p.bezierCurveTo(-0.01, -0.035, -0.014, -0.01, 0.004, 0)
  p.lineTo(0.072, 0)
  p.lineTo(0.068, -0.04)
  p.closePath()
  return p
}

/** Fill a silhouette with a 1px rim along every upward-facing edge: the shape
 *  in rim colour nudged up, then the shape itself over it. */
function rimmed(ctx: CanvasRenderingContext2D, path: Path2D, ink: string, rim: string, unit: number) {
  ctx.save()
  ctx.translate(0, -1 / unit)
  ctx.fillStyle = rim
  ctx.fill(path)
  ctx.restore()
  ctx.fillStyle = ink
  ctx.fill(path)
}

/** Grain over whatever is already in a box, the same texture the land has, so
 *  a vector shape doesn't sit on the painting like a decal. Only touches
 *  pixels that differ from `under`, i.e. the silhouette itself. */
function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, amp: number, under?: ImageData) {
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y))
  w = Math.min(ctx.canvas.width - x, Math.ceil(w)); h = Math.min(ctx.canvas.height - y, Math.ceil(h))
  if (w <= 0 || h <= 0) return
  const img = ctx.getImageData(x, y, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    if (under && d[i] === under.data[i] && d[i + 1] === under.data[i + 1] && d[i + 2] === under.data[i + 2]) continue
    const px = x + (i / 4) % w, py = y + Math.floor(i / 4 / w)
    const n = (hash2(px * 3.1 + 0.5, py * 5.7 + 0.5) - 0.5) * amp
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1
  }
  ctx.putImageData(img, x, y)
}

interface CarPose { x: number; y: number; len: number; tilt: number }

function drawCar(ctx: CanvasRenderingContext2D, pose: CarPose, hour: Hour) {
  const ink = inks(hour)
  const { len } = pose
  const box = { x: pose.x - 4, y: pose.y - len * 0.32, w: len + 8, h: len * 0.34 }
  const under = ctx.getImageData(Math.max(0, Math.floor(box.x)), Math.max(0, Math.floor(box.y)),
    Math.max(1, Math.ceil(box.w)), Math.max(1, Math.ceil(box.h)))

  ctx.save()
  ctx.translate(pose.x, pose.y)
  ctx.rotate(pose.tilt)
  ctx.scale(len, len)

  // tyres first, so the body's arches sit over their tops
  for (const cx of [0.21, 0.785]) {
    ctx.fillStyle = ink.tyre
    ctx.beginPath(); ctx.arc(cx, -0.066, 0.074, 0, Math.PI * 2); ctx.fill()
    // the rim, a ring a shade up from the rubber
    ctx.strokeStyle = ink.rimLine
    ctx.lineWidth = 1.2 / len
    ctx.beginPath(); ctx.arc(cx, -0.066, 0.042, 0, Math.PI * 2); ctx.stroke()
  }

  rimmed(ctx, carBody(), ink.body, ink.rim, len)
  ctx.fillStyle = ink.glass
  ctx.fill(carGlass())

  // the shoulder line down the flank, catching the sky
  ctx.strokeStyle = ink.rimLine
  ctx.lineWidth = 1 / len
  ctx.beginPath()
  ctx.moveTo(0.04, -0.128)
  ctx.bezierCurveTo(0.3, -0.146, 0.7, -0.15, 0.97, -0.138)
  ctx.stroke()
  // the door's shut line
  ctx.beginPath()
  ctx.moveTo(0.402, -0.162); ctx.lineTo(0.41, -0.08)
  ctx.stroke()

  // tail light, a red slit; the headlight is lit in the frame loop
  ctx.fillStyle = '#ff3d55'
  ctx.fillRect(0.975, -0.138, 0.02, 0.016)
  ctx.restore()

  grain(ctx, box.x, box.y, box.w, box.h, 26, under)
}

/** Where the headlight sits on the canvas, for the glow drawn each frame. */
function headlight(pose: CarPose) {
  const lx = 0.022 * pose.len, ly = -0.112 * pose.len
  const c = Math.cos(pose.tilt), s = Math.sin(pose.tilt)
  return { x: pose.x + lx * c - ly * s, y: pose.y + lx * s + ly * c }
}

/** The person, rendered once into a small canvas of their own so the frame
 *  loop can redraw them each tick (they breathe) without re-graining. */
function renderPerson(height: number, hour: Hour): HTMLCanvasElement {
  const ink = inks(hour)
  const pad = 3
  const w = Math.ceil(height * 0.34) + pad * 2
  const h = Math.ceil(height) + pad * 2
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const x = c.getContext('2d')!
  x.translate(w / 2, h - pad)
  x.scale(height, height)
  rimmed(x, personBody(), ink.body, ink.rim, height)
  x.setTransform(1, 0, 0, 1, 0, 0)
  grain(x, 0, 0, w, h, 22)
  return c
}

/* ── the component ───────────────────────────────────────────────────── */

export default function Scene() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const paintedHour = useRef<Hour | null>(null)
  const [hour, setHour] = useState<Hour>('dusk')
  const [clock, setClock] = useState('')

  // The boot script already chose from the visitor's clock and coloured the
  // page; pick that up after hydration, so the server's HTML and the first
  // render still agree. Nothing else reads the attribute back — `step` writes
  // it, which is the only thing that ever changes it. An effect that mirrored
  // state onto the attribute instead would, on React's development double-
  // mount, write the stale initial hour over whatever the boot script chose.
  useEffect(() => setHour(hourFromDocument()), [])

  // Bruce's local time, under the picture
  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: PLACE.tz,
    }).format(new Date()))
    tick()
    const id = setInterval(tick, 20_000)
    return () => clearInterval(id)
  }, [])

  const step = useCallback(() => setHour(h => {
    const next = HOURS[(HOURS.indexOf(h) + 1) % HOURS.length]
    document.documentElement.dataset.hour = next
    return next
  }), [])

  useEffect(() => {
    const el = canvas.current, box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d', { alpha: false })
    if (!ctx) return

    const still = typeof window !== 'undefined' && new URLSearchParams(location.search).has('still')
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let calm = motion.matches
    const currentHour = hourFromDocument()
    let previousScene: HTMLCanvasElement | null = null
    let transitionStartedAt = 0

    if (!still && !calm && paintedHour.current && paintedHour.current !== currentHour) {
      previousScene = document.createElement('canvas')
      previousScene.width = el.width
      previousScene.height = el.height
      previousScene.getContext('2d')!.drawImage(el, 0, 0)
    }

    let raf = 0
    let stop = false
    const bounds = box.getBoundingClientRect()
    let visible = bounds.bottom > 0 && bounds.top < window.innerHeight
    // kept per effect run, not in a ref: React remounts effects in development,
    // and a cache that outlived its canvas would skip the paint and leave it black
    let painted: { w: number; h: number; hour: Hour } | null = null
    const scene = document.createElement('canvas')
    const sctx = scene.getContext('2d')!
    let lit: Lit = { x: 0, y: 0 }
    let crest: (x: number) => number = () => 0
    let beacons: { x: number; y: number }[] = []
    let sparks: { x: number; y: number; p: number; s: number }[] = []

    /** Repaint the still picture — only on a resize or an hour change. */
    const repaint = () => {
      // CSS pixels, not device pixels: the grain wants to be roughly a pixel wide,
      // and a retina canvas would render it at half the size and lose the texture
      const view = Math.max(320, Math.min(1600, Math.round(box.clientWidth)))
      const h = Math.max(200, Math.round(box.clientHeight))
      // Everything in the painting is placed by fractions of its width, so a
      // narrow phone banner used to squeeze the bridge and the city together.
      // Now the painting is never narrower than about the desktop's own
      // proportions; on a phone it's painted wider than the box and the box
      // shows a window onto it — the bridge's south tower, the car and the
      // person, and downtown — rather than the whole thing crushed.
      const w = Math.max(view, Math.round(h * 2.3))
      const offset = Math.max(0, Math.min(w - view, Math.round(w * 0.555 - view / 2)))
      if (painted && painted.w === w && painted.h === h && painted.hour === currentHour && viewOffset === offset) return false
      painted = { w, h, hour: currentHour }
      viewOffset = offset

      scene.width = w
      scene.height = h
      if (el.width !== view || el.height !== h) {
        previousScene = null
        el.width = view
        el.height = h
      }
      const img = sctx.createImageData(w, h)
      const out = paint(img.data, w, h, currentHour)
      lit = out.lit
      crest = out.crest
      beacons = out.beacons

      // The car sits a little right of centre with its nose toward the town,
      // resting on the slope: each wheel finds the ground under it and the
      // body tilts to match. The person stands just off its nose, a little
      // taller than the roofline, looking out the same way.
      const len = Math.round(Math.max(96, Math.min(190, h * 0.3)))
      const tall = Math.round(Math.max(36, Math.min(66, h * 0.112)))
      const carX = Math.round(w * 0.56)
      const front = crest(carX + len * 0.21)
      const rear = crest(carX + len * 0.785)
      const tilt = Math.atan2(rear - front, len * 0.575)
      sctx.putImageData(img, 0, 0)
      meadow(sctx, w, h, PALETTES[currentHour], out.crest, out.near)
      floodlight(sctx, out, img, PALETTES[currentHour].flood, w)
      car.pose = { x: carX, y: Math.round(front + 1 - Math.sin(tilt) * len * 0.21), len, tilt }
      drawCar(sctx, car.pose, currentHour)

      const fx = Math.round(carX - tall * 0.42)
      person = renderPerson(tall, currentHour)
      const fy = Math.round(crest(fx) + 1)

      const p = PALETTES[currentHour]
      sparks = Array.from({ length: p.fireflies }, (_, i) => ({
        x: hash1(i * 2.7) * w,
        y: h * 0.70 + hash1(i * 9.1) * h * 0.26,
        p: hash1(i * 4.4) * Math.PI * 2,
        s: 0.6 + hash1(i * 6.2) * 1.2,
      }))
      figure.x = fx; figure.y = fy
      return true
    }

    const figure = { x: 0, y: 0 }
    /** how far into the painting the visible box starts — 0 unless it's narrow */
    let viewOffset = 0
    const car: { pose: CarPose } = { pose: { x: 0, y: 0, len: 1, tilt: 0 } }
    let person: HTMLCanvasElement | null = null

    /** One frame: the still painting, then the few things that move over it. */
    const draw = (t: number) => {
      ctx.drawImage(scene, -viewOffset, 0)
      const w = scene.width, h = scene.height
      // everything below is placed in the painting's coordinates
      ctx.save()
      ctx.translate(-viewOffset, 0)

      // the one lit window, breathing — not in broad daylight
      if (currentHour !== 'day') {
        const pulse = still || calm ? 0.8 : 0.72 + Math.sin(t / 900) * 0.12
        const g = ctx.createRadialGradient(lit.x, lit.y, 0, lit.x, lit.y, Math.max(14, h * 0.05))
        const warm = currentHour === 'night' ? '255,170,120' : '255,90,140'
        g.addColorStop(0, `rgba(${warm},${0.55 * pulse})`)
        g.addColorStop(1, `rgba(${warm},0)`)
        ctx.fillStyle = g
        ctx.fillRect(lit.x - h * 0.06, lit.y - h * 0.06, h * 0.12, h * 0.12)
        ctx.fillStyle = `rgba(255,220,200,${0.85 * pulse})`
        ctx.fillRect(lit.x - 1, lit.y - 2, 2, 4)
      }

      for (const s of sparks) {
        const a = (0.35 + 0.65 * Math.sin(t / 700 * s.s + s.p)) * 0.8
        if (a <= 0) continue
        ctx.fillStyle = `rgba(190,255,160,${a * 0.75})`
        const dx = still || calm ? 0 : Math.sin(t / 2600 * s.s + s.p) * 6
        ctx.fillRect(s.x + dx, s.y + Math.cos(t / 3100 + s.p) * 3, 1.5, 1.5)
      }

      // Aviation lights on the bridge towers and Sutro, out of step with each
      // other the way real ones never quite agree. Only once the light's gone.
      if (currentHour === 'night' || currentHour === 'dusk') {
        beacons.forEach((bk, i) => {
          const on = still || calm ? 1 : Math.max(0, Math.sin(t / 900 + i * 2.1)) ** 3
          if (on < 0.05) return
          const halo = ctx.createRadialGradient(bk.x, bk.y, 0, bk.x, bk.y, 5)
          halo.addColorStop(0, `rgba(255,70,60,${0.5 * on})`)
          halo.addColorStop(1, 'rgba(255,70,60,0)')
          ctx.fillStyle = halo
          ctx.fillRect(bk.x - 5, bk.y - 5, 10, 10)
          ctx.fillStyle = `rgba(255,120,100,${0.95 * on})`
          ctx.fillRect(Math.round(bk.x) - 1, Math.round(bk.y), 2, 2)
        })
      }

      // The headlight, and the pool it throws on the grass ahead of the car —
      // the warmest thing on the hill, and what picks the person out of the
      // dark. Both breathe a little, like an engine idling.
      const lamp = headlight(car.pose)
      // by day it's only a running light, with no pool thrown on the grass
      const daylight = currentHour === 'day' ? 0.22 : 1
      const beat = (still || calm ? 0.85 : 0.8 + Math.sin(t / 620) * 0.1) * daylight
      const reach = car.pose.len * 0.55
      const pool = ctx.createRadialGradient(lamp.x - reach * 0.45, lamp.y + 3, 0, lamp.x - reach * 0.45, lamp.y + 3, reach)
      pool.addColorStop(0, `rgba(255,226,196,${0.11 * beat})`)
      pool.addColorStop(1, 'rgba(255,226,196,0)')
      ctx.save()
      ctx.translate(0, lamp.y + 3)
      ctx.scale(1, 0.28)
      ctx.translate(0, -(lamp.y + 3))
      ctx.fillStyle = pool
      ctx.fillRect(lamp.x - reach * 1.5, lamp.y + 3 - reach, reach * 2.1, reach * 2)
      ctx.restore()
      const glow = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, car.pose.len * 0.07)
      glow.addColorStop(0, `rgba(255,236,214,${0.6 * beat})`)
      glow.addColorStop(1, 'rgba(255,236,214,0)')
      ctx.fillStyle = glow
      ctx.fillRect(lamp.x - car.pose.len * 0.07, lamp.y - car.pose.len * 0.07, car.pose.len * 0.14, car.pose.len * 0.14)
      ctx.fillStyle = `rgba(255,244,230,${0.95 * beat})`
      ctx.fillRect(Math.round(lamp.x) - 1, Math.round(lamp.y) - 1, 2, 2)

      // the person, drawn over the pool so the light sits behind their legs —
      // on whole pixels, since a sub-pixel offset would soften the silhouette
      if (person) ctx.drawImage(person, Math.round(figure.x - person.width / 2), Math.round(figure.y - person.height + 3))

      ctx.restore()

      // the outgoing hour, a snapshot of the visible box, fading out over it
      if (previousScene) {
        const progress = clamp01((t - transitionStartedAt) / THEME_TRANSITION_MS)
        const blend = progress * progress * (3 - 2 * progress)
        ctx.globalAlpha = 1 - blend
        ctx.drawImage(previousScene, 0, 0)
        ctx.globalAlpha = 1
        if (progress === 1) previousScene = null
      }
    }

    const canAnimate = () => !stop && visible && !document.hidden && !still && !calm
    const loop = (t: number) => {
      raf = 0
      if (!canAnimate()) return
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const syncAnimation = () => {
      if (canAnimate()) {
        if (!raf) raf = requestAnimationFrame(loop)
      } else {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    const updateMotion = () => {
      calm = motion.matches
      if (calm) {
        previousScene = null
        draw(0)
      }
      syncAnimation()
    }

    repaint()
    paintedHour.current = currentHour
    transitionStartedAt = performance.now()
    draw(still || calm ? 0 : transitionStartedAt)
    syncAnimation()

    // a still page has no loop to pick the new size up, so draw it again here
    const ro = new ResizeObserver(() => { if (repaint()) draw(still || calm ? 0 : performance.now()) })
    ro.observe(box)
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      syncAnimation()
    })
    observer.observe(box)
    document.addEventListener('visibilitychange', syncAnimation)
    motion.addEventListener('change', updateMotion)
    return () => {
      stop = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      observer.disconnect()
      document.removeEventListener('visibilitychange', syncAnimation)
      motion.removeEventListener('change', updateMotion)
    }
  }, [hour])

  return (
    <div className="scene" ref={wrap}>
      <canvas ref={canvas} className="scene-canvas" aria-hidden />
      <Noise />
      <p className="scene-alt">
        A painted view of San Francisco from the hills to the north: the Golden Gate Bridge on the left, downtown's towers on the right, and a person standing beside a parked car on the near hill, looking out at the city.
      </p>
      <div className="scene-bar">
        <button type="button" className="scene-hour" onClick={step} aria-label={`Scene: ${HOUR_LABEL[hour]}. Click for the next hour.`}>
          <span className="scene-dot" data-hour={hour} aria-hidden />
          {HOUR_LABEL[hour]}
        </button>
        <span className="scene-where">{clock && <>{clock} · </>}{PLACE.label}</span>
      </div>
    </div>
  )
}
