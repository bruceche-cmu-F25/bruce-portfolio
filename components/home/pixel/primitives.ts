export const ART_WIDTH = 180
export const ART_HEIGHT = 108

export type PixelTone = 'shadow' | 'outline' | 'side' | 'surface' | 'paper' | 'muted' | 'accent' | 'accentDark' | 'accentLight' | 'warm'
export type PixelPoint = [number, number]

export interface PixelPainter {
  rect: (left: number, top: number, width: number, height: number, tone: PixelTone) => void
  line: (startX: number, startY: number, endX: number, endY: number, tone: PixelTone, thickness?: number) => void
  polygon: (points: PixelPoint[], tone: PixelTone) => void
  stamp: (rows: string[], left: number, top: number, tone: PixelTone, scale?: number) => void
}

export function createScene() {
  const pixels: (PixelTone | undefined)[] = new Array(ART_WIDTH * ART_HEIGHT)

  const rect: PixelPainter['rect'] = (originX, originY, width, height, tone) => {
    const left = Math.max(0, Math.round(originX))
    const top = Math.max(0, Math.round(originY))
    const right = Math.min(ART_WIDTH, Math.round(originX + width))
    const bottom = Math.min(ART_HEIGHT, Math.round(originY + height))
    for (let row = top; row < bottom; row++) {
      for (let column = left; column < right; column++) pixels[row * ART_WIDTH + column] = tone
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

  const polygon: PixelPainter['polygon'] = (points, tone) => {
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
        rect(left, row, right - left, 1, tone)
      }
    }
  }

  const stamp: PixelPainter['stamp'] = (rows, left, top, tone, scale = 1) => {
    rows.forEach((row, rowIndex) => [...row].forEach((pixel, columnIndex) => {
      if (pixel !== '.' && pixel !== ' ' && pixel !== '0') rect(left + columnIndex * scale, top + rowIndex * scale, scale, scale, tone)
    }))
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

  return { rect, line, polygon, stamp, paths }
}
