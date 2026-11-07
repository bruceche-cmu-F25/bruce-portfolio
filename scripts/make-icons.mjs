/** Draws the site icons in the page's own language: ordered dither + pixels.
 *
 *    node scripts/make-icons.mjs
 *
 *  The mark is the banner painting at 20 pixels across: a Bayer-dithered sky
 *  burning brightest at the horizon, a black skyline under it, a moon. Same
 *  trick the real painting uses, at a size where you can count the pixels.
 *
 *  A bat emblem was tried first and thrown away — any wide dark shape with
 *  upswept ends, sitting inside a lit disc, reads as a grin at 16px. The
 *  landscape survives the size because it is only three bands.
 *
 *  Writes app/icon.svg (what browsers prefer), app/apple-icon.png (180×180 for
 *  the iOS home screen) and app/favicon.ico (16/32/48). Needs rsvg-convert
 *  (brew install librsvg) and python3 with Pillow.
 */
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')


const N = 20                       // the tile, in pixels
const HORIZON = 11                 // the row the flat land starts on
/** The sky, horizon first: hot where the light sits, cold at the top of the tile. */
const SKY = ['#ffd2a0', '#f5a35e', '#cf5f4f', '#7a2f58', '#331a4a', '#140e26']
const LAND = '#070610'
const MOON = '#ffeccd'

/** The skyline, as the first land row in each column — two towers break it. */
const RIDGE = [11, 11, 11, 11, 11, 11, 7, 7, 7, 11, 11, 11, 11, 11, 5, 5, 5, 11, 11, 11]

/** The 4×4 ordered-dither matrix, as thresholds in 0–1. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map(row => row.map(v => (v + 0.5) / 16))

/** Sky, land and moon, dithered rather than blended. */
function sceneTile(n) {
  const grid = []
  for (let y = 0; y < n; y++) {
    const row = []
    // the ramp runs up from the horizon, eased so the hot band stays thin
    const t = Math.max(0, (HORIZON - y) / HORIZON) ** 1.35 * (SKY.length - 1)
    const lo = Math.min(Math.floor(t), SKY.length - 2)
    const frac = t - lo
    for (let x = 0; x < n; x++) {
      row.push(y >= RIDGE[x] ? LAND : SKY[frac > BAYER[y % 4][x % 4] ? lo + 1 : lo])
    }
    grid.push(row)
  }
  // the moon, clear of the towers
  for (const [x, y] of [[2, 2], [3, 2], [2, 3], [3, 3]]) grid[y][x] = MOON
  return grid
}

const grid = sceneTile(N)

/** Merge each row's runs of one colour into a single rect. */
const rects = []
grid.forEach((row, y) => {
  let x = 0
  while (x < row.length) {
    let n = 1
    while (x + n < row.length && row[x + n] === row[x]) n++
    rects.push(`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${row[x]}"/>`)
    x += n
  }
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">
<defs><clipPath id="r"><rect width="${N}" height="${N}" rx="${(N * 0.17).toFixed(2)}"/></clipPath></defs>
<g clip-path="url(#r)">${rects.join('')}</g>
</svg>
`

writeFileSync(join(root, 'app', 'icon.svg'), svg)
console.log(`icons: app/icon.svg — ${rects.length} rects on a ${N}×${N} tile`)

const work = mkdtempSync(join(tmpdir(), 'icons-'))
try {
  const png = (out, size) =>
    execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), '-o', out, join(root, 'app', 'icon.svg')])

  png(join(root, 'app', 'apple-icon.png'), 180)
  console.log('icons: app/apple-icon.png — 180×180')

  // the .ico carries three sizes; Pillow writes them all from one source
  png(join(work, 'ico.png'), 256)
  execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(${JSON.stringify(join(work, 'ico.png'))}).convert('RGBA')
im.save(${JSON.stringify(join(root, 'app', 'favicon.ico'))}, sizes=[(16,16),(32,32),(48,48)])
`])
  console.log('icons: app/favicon.ico — 16/32/48')
} finally {
  rmSync(work, { recursive: true, force: true })
}
