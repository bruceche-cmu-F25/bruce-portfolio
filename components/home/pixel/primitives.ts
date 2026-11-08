export const ART_WIDTH = 180
export const ART_HEIGHT = 108

export type PixelTone =
  | 'shadow' | 'outline' | 'side' | 'surface' | 'paper' | 'muted'
  | 'accent' | 'accentDark' | 'accentLight' | 'warm'
  // added for the scenes that need a colour the hour can't supply
  | 'leaf' | 'cork' | 'corkDark' | 'thread' | 'blush' | 'blushDark'
  // the hour's own four-step ramp, the same one the cursor's trail burns through
  | 'heat1' | 'heat2' | 'heat3' | 'heat4'
export type PixelPoint = [number, number]

/** How a shape is filled: every pixel, every other one in a checker, or one
 *  in four — the last two are how pixel art fakes glow and translucency. */
export type PixelPattern = 'solid' | 'checker' | 'sparse'

/** How far, in art pixels, a shadow's dithered edge reaches past its solid core. */
const SOFT_EDGE = 2.5
/** Tones a shadow's soft edge may fall across: the floor and other shadows. */
const GROUND = new Set<PixelTone>(['shadow', 'surface', 'side', 'accentDark'])

export interface RingOptions {
  /** start and end, in degrees clockwise from three o'clock */
  from?: number
  to?: number
  /** how thick the ring is, in art pixels */
  thickness?: number
  /** vertical squash, for a ring seen at an angle (0.5 is a 2:1 ellipse) */
  squash?: number
  /** on and off lengths, in degrees, for a dashed ring */
  dash?: [number, number]
  pattern?: PixelPattern
}

export interface PixelPainter {
  rect: (left: number, top: number, width: number, height: number, tone: PixelTone, pattern?: PixelPattern) => void
  line: (startX: number, startY: number, endX: number, endY: number, tone: PixelTone, thickness?: number) => void
  polygon: (points: PixelPoint[], tone: PixelTone, pattern?: PixelPattern) => void
  stamp: (rows: string[], left: number, top: number, tone: PixelTone, scale?: number) => void
  /** a circle's outline, or an arc of one */
  ring: (centerX: number, centerY: number, radius: number, tone: PixelTone, options?: RingOptions) => void
  /** a filled circle (or ellipse, with squash) */
  disc: (centerX: number, centerY: number, radius: number, tone: PixelTone, squash?: number, pattern?: PixelPattern) => void
}

const keep = (pattern: PixelPattern | 'fringe', column: number, row: number) =>
  pattern === 'solid' ||
  ((pattern === 'checker' || pattern === 'fringe') && (column + row) % 2 === 0) ||
  (pattern === 'sparse' && column % 2 === 0 && row % 2 === 0)

export function createScene() {
  const pixels: (PixelTone | undefined)[] = new Array(ART_WIDTH * ART_HEIGHT)

  const put = (column: number, row: number, tone: PixelTone, pattern: PixelPattern | 'fringe' = 'solid') => {
    if (column < 0 || row < 0 || column >= ART_WIDTH || row >= ART_HEIGHT || !keep(pattern, column, row)) return
    if (pattern === 'fringe') {
      // a shadow's soft edge falls on the ground, never across a lit object
      const under = pixels[row * ART_WIDTH + column]
      if (under !== undefined && !GROUND.has(under)) return
    }
    pixels[row * ART_WIDTH + column] = tone
  }

  const rect: PixelPainter['rect'] = (originX, originY, width, height, tone, pattern = 'solid') => {
    const left = Math.max(0, Math.round(originX))
    const top = Math.max(0, Math.round(originY))
    const right = Math.min(ART_WIDTH, Math.round(originX + width))
    const bottom = Math.min(ART_HEIGHT, Math.round(originY + height))
    for (let row = top; row < bottom; row++) {
      for (let column = left; column < right; column++) put(column, row, tone, pattern)
    }
  }

  const line: PixelPainter['line'] = (startX, startY, endX, endY, tone, thickness = 1) => {
    let column = Math.round(startX)
    let row = Math.round(startY)
    const targetX = Math.round(endX)
    const targetY = Math.round(endY)
    const distanceX = Math.abs(targetX - column)
    const distanceY = -Math.abs(targetY - row)
    const directionX = column < targetX ? 1 : -1
    const directionY = row < targetY ? 1 : -1
    let error = distanceX + distanceY
    while (true) {
      rect(column, row, thickness, thickness, tone)
      if (column === targetX && row === targetY) break
      const doubled = error * 2
      if (doubled >= distanceY) { error += distanceY; column += directionX }
      if (doubled <= distanceX) { error += distanceX; row += directionY }
    }
  }

  const fill = (points: PixelPoint[], tone: PixelTone, pattern: PixelPattern | 'fringe') => {
    if (points.length < 3) return
    const top = Math.max(0, Math.floor(Math.min(...points.map(point => point[1]))))
    const bottom = Math.min(ART_HEIGHT, Math.ceil(Math.max(...points.map(point => point[1]))))
    for (let row = top; row < bottom; row++) {
      const intersections: number[] = []
      const center = row + 0.5
      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length]
        if ((point[1] <= center && next[1] > center) || (next[1] <= center && point[1] > center)) {
          intersections.push(point[0] + (center - point[1]) * (next[0] - point[0]) / (next[1] - point[1]))
        }
      })
      intersections.sort((first, second) => first - second)
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        const left = Math.ceil(intersections[index] - 0.5)
        const right = Math.ceil(intersections[index + 1] - 0.5)
        for (let column = left; column < right; column++) put(column, row, tone, pattern)
      }
    }
  }

  const polygon: PixelPainter['polygon'] = (points, tone, pattern = 'solid') => {
    if (tone === 'shadow' && pattern === 'solid' && points.length > 2) {
      const cx = points.reduce((sum, point) => sum + point[0], 0) / points.length
      const cy = points.reduce((sum, point) => sum + point[1], 0) / points.length
      const grown = points.map(([x, y]): PixelPoint => {
        const dx = x - cx, dy = y - cy, distance = Math.hypot(dx, dy) || 1
        return [x + dx / distance * SOFT_EDGE, y + dy / distance * SOFT_EDGE]
      })
      fill(grown, tone, 'fringe')
    }
    fill(points, tone, pattern)
  }

  const stamp: PixelPainter['stamp'] = (rows, left, top, tone, scale = 1) => {
    rows.forEach((row, rowIndex) => [...row].forEach((pixel, columnIndex) => {
      if (pixel !== '.' && pixel !== ' ' && pixel !== '0') rect(left + columnIndex * scale, top + rowIndex * scale, scale, scale, tone)
    }))
  }

  const ring: PixelPainter['ring'] = (cx, cy, radius, tone, options = {}) => {
    const { from = 0, to = 360, thickness = 1, squash = 1, dash, pattern = 'solid' } = options
    const reach = radius + thickness + 1
    for (let row = Math.floor(cy - reach * squash); row <= Math.ceil(cy + reach * squash); row++) {
      for (let column = Math.floor(cx - reach); column <= Math.ceil(cx + reach); column++) {
        const dx = column + 0.5 - cx, dy = (row + 0.5 - cy) / squash
        if (Math.abs(Math.hypot(dx, dy) - radius) > thickness / 2) continue
        let angle = Math.atan2(dy, dx) * 180 / Math.PI
        if (angle < 0) angle += 360
        const start = ((from % 360) + 360) % 360
        const sweep = to - from >= 360 ? 360 : (((to - from) % 360) + 360) % 360
        const along = ((angle - start) + 360) % 360
        if (sweep < 360 && along > sweep) continue
        if (dash && along % (dash[0] + dash[1]) >= dash[0]) continue
        put(column, row, tone, pattern)
      }
    }
  }

  const disc: PixelPainter['disc'] = (cx, cy, radius, tone, squash = 1, pattern = 'solid') => {
    for (let row = Math.floor(cy - radius * squash - 1); row <= Math.ceil(cy + radius * squash + 1); row++) {
      for (let column = Math.floor(cx - radius - 1); column <= Math.ceil(cx + radius + 1); column++) {
        const dx = column + 0.5 - cx, dy = (row + 0.5 - cy) / squash
        if (dx * dx + dy * dy <= radius * radius) put(column, row, tone, pattern)
      }
    }
  }

  const paths = () => {
    const result = new Map<PixelTone, string>()
    for (let row = 0; row < ART_HEIGHT; row++) {
      let column = 0
      while (column < ART_WIDTH) {
        const tone = pixels[row * ART_WIDTH + column]
        if (!tone) { column++; continue }
        const start = column
        while (column < ART_WIDTH && pixels[row * ART_WIDTH + column] === tone) column++
        const width = column - start
        result.set(tone, `${result.get(tone) ?? ''}M${start} ${row}h${width}v1h-${width}z`)
      }
    }
    return [...result].map(([tone, path]) => ({ tone, path }))
  }

  return { rect, line, polygon, stamp, ring, disc, paths }
}
