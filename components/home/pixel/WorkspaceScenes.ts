import type { PixelPainter, PixelTone } from './primitives'

const rad = (degrees: number) => degrees * Math.PI / 180
const at = (cx: number, cy: number, radius: number, degrees: number): [number, number] =>
  [cx + Math.cos(rad(degrees)) * radius, cy + Math.sin(rad(degrees)) * radius]

/** A holographic window: a dot-matrix body, a hairline frame with bright
 *  corner brackets, and a header readout. */
function hologram(painter: PixelPainter, x: number, y: number, width: number, height: number) {
  painter.rect(x, y, width, height, 'accentDark', 'sparse')
  painter.rect(x, y, width, 1, 'accent')
  painter.rect(x, y + height - 1, width, 1, 'accentDark')
  painter.rect(x, y, 1, height, 'accentDark')
  painter.rect(x + width - 1, y, 1, height, 'accentDark')
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + width - 1, y, -1, 1], [x, y + height - 1, 1, -1], [x + width - 1, y + height - 1, -1, -1]]) {
    painter.rect(Math.min(cx, cx + dx * 3), cy, 4, 1, 'accentLight')
    painter.rect(cx, Math.min(cy, cy + dy * 3), 1, 4, 'accentLight')
  }
  painter.rect(x + 3, y + 3, 9, 1, 'accentLight')
  painter.rect(x + 14, y + 3, 5, 1, 'accent')
  painter.rect(x + width - 6, y + 3, 3, 1, 'accent')
}

/** Robin as a JARVIS-style heads-up display: a reactor-like core inside
 *  segmented rings and a radar sweep, with the four things it keeps track of
 *  floating around it as holographic panels — mail, the calendar, messages
 *  and the task list — each wired into the rings. */
export function drawWorkspace(painter: PixelPainter) {
  const cx = 90, cy = 52

  // the hologram's haze, a band round the outside so the rings stay clean,
  // and the projector it rises from
  painter.ring(cx, cy, 44, 'accentDark', { thickness: 9, pattern: 'sparse' })
  painter.polygon([[cx - 9, 99], [cx + 9, 99], [cx + 22, 86], [cx - 22, 86]], 'accentDark', 'checker')
  painter.disc(cx, 101, 20, 'shadow', 0.24)
  painter.disc(cx, 100, 14, 'surface', 0.26)
  painter.disc(cx, 99.5, 10, 'outline', 0.26)
  painter.disc(cx, 99, 6, 'accent', 0.3)

  // ticks round the outside, longer every thirty degrees
  for (let degrees = 0; degrees < 360; degrees += 10) {
    const long = degrees % 30 === 0
    const [x1, y1] = at(cx, cy, 43, degrees), [x2, y2] = at(cx, cy, long ? 46 : 44, degrees)
    painter.line(x1, y1, x2, y2, long ? 'accent' : 'accentDark')
  }
  // the outer ring, broken at the sides
  painter.ring(cx, cy, 40, 'accent', { from: 205, to: 335 })
  painter.ring(cx, cy, 40, 'accent', { from: 25, to: 155 })
  painter.ring(cx, cy, 40, 'accentDark', { from: 335, to: 385, dash: [4, 4] })
  painter.ring(cx, cy, 40, 'accentDark', { from: 155, to: 205, dash: [4, 4] })
  // a heavy segmented ring, one segment lit
  for (const [from, to, tone] of [[8, 82, 'accent'], [98, 172, 'accent'], [188, 232, 'accentLight'], [242, 352, 'accent']] as [number, number, PixelTone][]) {
    painter.ring(cx, cy, 34.5, tone, { from, to, thickness: 2.6 })
  }
  painter.ring(cx, cy, 28.5, 'accentDark', { dash: [5, 4] })

  // the radar: a sweep trailing its bright leading edge, and what it's found
  const sweep: [number, number][] = [[cx, cy]]
  for (let degrees = 288; degrees <= 338; degrees += 5) sweep.push(at(cx, cy, 27, degrees))
  painter.polygon(sweep, 'accent', 'checker')
  const [ex, ey] = at(cx, cy, 27, 338)
  painter.line(cx, cy, ex, ey, 'accentLight')
  for (const [x, y, tone] of [[104, 38, 'warm'], [74, 62, 'accentLight'], [101, 66, 'accentLight'], [79, 40, 'warm']] as [number, number, PixelTone][]) painter.rect(x, y, 2, 2, tone)

  painter.ring(cx, cy, 21, 'accent')
  painter.ring(cx, cy, 16.5, 'accentDark', { dash: [14, 6] })
  // the core, lit like a reactor
  painter.disc(cx, cy, 11, 'shadow')
  painter.ring(cx, cy, 10.5, 'accent', { thickness: 1.6 })
  painter.disc(cx, cy, 7, 'accentLight')
  painter.ring(cx, cy, 7, 'accent', { dash: [20, 10] })
  painter.disc(cx, cy, 3.6, 'paper')

  // a readout above the rings
  painter.rect(cx - 15, 3, 12, 1, 'accentDark')
  painter.rect(cx - 1, 3, 3, 1, 'accentLight')
  painter.rect(cx + 5, 3, 10, 1, 'accentDark')

  // mail
  hologram(painter, 3, 9, 44, 34)
  painter.stamp(['#########', '##.....##', '#.#...#.#', '#..#.#..#', '#...#...#', '#.......#', '#########'], 7, 17, 'accentLight')
  for (const [row, length, unread] of [[18, 22, true], [22, 18, true], [27, 24, false], [31, 15, false], [36, 20, false]] as [number, number, boolean][]) {
    painter.rect(20, row, length, 1, unread ? 'accentLight' : 'accent')
    if (unread) painter.rect(43, row, 1, 1, 'paper')
  }
  // messages, as a voice trace
  hologram(painter, 3, 52, 40, 36)
  painter.rect(6, 70, 34, 1, 'accentDark')
  const trace = [0, -3, 4, -7, 6, -2, 8, -9, 3, -4, 5, 0, -2, 2]
  trace.forEach((offset, index) => {
    if (index === 0) return
    painter.line(6 + (index - 1) * 2.6, 70 + trace[index - 1], 6 + index * 2.6, 70 + offset, index > 9 ? 'accent' : 'accentLight')
  })
  painter.rect(6, 81, 12, 1, 'accent')
  painter.rect(21, 81, 7, 1, 'accentDark')
  // the calendar
  hologram(painter, 133, 8, 44, 38)
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 5; column++) {
      const lit = row === 1 && column === 3
      painter.rect(137 + column * 8, 16 + row * 9, 5, 5, lit ? 'warm' : 'accentDark')
      if (!lit) painter.rect(137 + column * 8, 16 + row * 9, 5, 1, 'accent')
    }
  }
  painter.ring(163.5, 27.5, 5.5, 'paper', { dash: [30, 15] })
  // the task list
  hologram(painter, 135, 55, 42, 36)
  for (let row = 0; row < 3; row++) {
    const top = 63 + row * 8
    painter.rect(139, top, 5, 5, row < 2 ? 'accent' : 'accentDark')
    if (row < 2) painter.stamp(['....#', '#..#.', '.##..'], 139, top + 1, 'paper')
    painter.rect(147, top + 1, row === 1 ? 18 : 24, 1, row < 2 ? 'accentLight' : 'accent')
    painter.rect(147, top + 3, 12, 1, 'accentDark')
  }

  // the wiring from each panel into the rings, with a node where it lands
  for (const [points, landing] of [
    [[[47, 26], [52, 26], [57, 31]], [57, 31]],
    [[[43, 70], [49, 70], [53, 66]], [53, 66]],
    [[[133, 26], [128, 26], [123, 31]], [123, 31]],
    [[[135, 72], [130, 72], [126, 68]], [126, 68]],
  ] as [[number, number][], [number, number]][]) {
    for (let index = 1; index < points.length; index++) {
      painter.line(points[index - 1][0], points[index - 1][1], points[index][0], points[index][1], 'accent')
    }
    painter.rect(landing[0] - 1, landing[1] - 1, 3, 3, 'accentLight')
  }
}

/** NightyNight as bedtime: a child asleep under a patchwork quilt, moonlight
 *  through the window, and the story itself floating open above the bed —
 *  telling itself aloud, with a planet and stars drifting up out of it. */
export function drawStory(painter: PixelPainter) {
  // the floor, and the moonlight falling across it
  painter.disc(104, 101, 78, 'shadow', 0.1)
  painter.polygon([[22, 50], [54, 50], [128, 99], [70, 99]], 'muted', 'sparse')

  // the window: frame, night glass, a crescent moon and stars
  painter.rect(16, 8, 42, 44, 'surface')
  painter.rect(19, 11, 36, 38, 'outline')
  painter.disc(30, 22, 6.5, 'warm')
  painter.disc(33, 20, 5.6, 'outline')
  for (const [x, y] of [[45, 16], [48, 31], [24, 38], [40, 42], [51, 22]]) painter.rect(x, y, 1, 1, 'paper')
  painter.stamp(['.#.', '###', '.#.'], 41, 26, 'accentLight')
  painter.rect(36, 11, 2, 38, 'surface')
  painter.rect(19, 29, 36, 2, 'surface')
  painter.rect(14, 51, 46, 3, 'surface')
  // curtains, gathered at the sides
  for (const left of [9, 58]) {
    painter.rect(left, 6, 8, 52, 'accentDark')
    painter.rect(left + 2, 6, 1, 52, 'accent')
    painter.rect(left + 5, 6, 1, 52, 'side')
  }
  painter.rect(8, 4, 60, 3, 'outline')

  // the bed: frame, mattress, a patchwork quilt, the pillow and its sleeper
  painter.polygon([[68, 92], [170, 92], [168, 97], [70, 97]], 'shadow')
  painter.rect(162, 50, 9, 46, 'surface')
  painter.rect(162, 50, 9, 2, 'paper')
  painter.rect(68, 66, 6, 30, 'surface')
  painter.rect(68, 66, 6, 2, 'paper')
  painter.rect(72, 80, 92, 8, 'paper')
  painter.rect(72, 86, 92, 2, 'muted')
  painter.rect(70, 88, 96, 3, 'outline')
  painter.rect(71, 91, 3, 5, 'outline')
  painter.rect(160, 91, 3, 5, 'outline')
  // pillow
  painter.rect(138, 66, 22, 12, 'paper')
  painter.rect(138, 76, 22, 2, 'muted')
  // the sleeper: a mop of hair, a face turned toward us, a closed eye, a
  // pink cheek, and a small mouth
  painter.disc(147, 65, 7, 'corkDark')
  painter.disc(145, 68.5, 5.6, 'paper')
  painter.rect(141, 63, 8, 2, 'corkDark')
  painter.stamp(['#...#', '.###.'], 141, 67, 'outline')
  painter.rect(141, 70, 2, 1, 'blush')
  painter.rect(147, 70, 2, 1, 'blush')
  painter.rect(144, 71, 2, 1, 'muted')
  // quilt, pulled up to the chin
  painter.polygon([[74, 72], [140, 70], [142, 84], [74, 86]], 'accent')
  for (let x = 78; x < 138; x += 8) {
    for (let y = 73; y < 84; y += 6) if ((x + y) % 16 < 8) painter.rect(x, y, 4, 4, 'accentDark')
  }
  painter.line(74, 72, 140, 70, 'accentLight')
  // z z
  painter.stamp(['###', '..#', '.#.', '#..', '###'], 152, 52, 'muted')
  painter.stamp(['##', '.#', '#.', '##'], 158, 45, 'muted')

  // the story, open in the air above the bed, glowing
  const bx = 104, by = 34
  painter.disc(bx, by, 27, 'accentDark', 1, 'sparse')
  painter.polygon([[bx - 22, by - 6], [bx, by - 2], [bx, by + 12], [bx - 22, by + 8]], 'accent')
  painter.polygon([[bx + 22, by - 6], [bx, by - 2], [bx, by + 12], [bx + 22, by + 8]], 'accent')
  painter.polygon([[bx - 20, by - 9], [bx, by - 4], [bx, by + 10], [bx - 20, by + 5]], 'paper')
  painter.polygon([[bx + 20, by - 9], [bx, by - 4], [bx, by + 10], [bx + 20, by + 5]], 'paper')
  painter.line(bx, by - 4, bx, by + 10, 'muted')
  for (let row = 0; row < 4; row++) {
    painter.line(bx - 17, by - 4 + row * 3, bx - 3, by + row * 3, 'muted')
    painter.line(bx + 3, by + row * 3, bx + 17 - (row === 3 ? 6 : 0), by - 4 + row * 3, 'muted')
  }
  painter.rect(bx - 17, by - 6, 3, 3, 'accent')
  // read aloud: sound rippling out to the side
  painter.ring(bx, by + 2, 26, 'accent', { from: 160, to: 200 })
  painter.ring(bx, by + 2, 30, 'accentDark', { from: 163, to: 197 })
  painter.ring(bx, by + 2, 26, 'accent', { from: 340, to: 380 })
  painter.ring(bx, by + 2, 30, 'accentDark', { from: 343, to: 377 })
  // and what the story is about, drifting up out of it
  painter.disc(122, 15, 4.5, 'warm')
  painter.ring(122, 15.5, 7.5, 'accentLight', { squash: 0.34, from: 0, to: 180 })
  painter.ring(122, 15.5, 7.5, 'accentLight', { squash: 0.34, from: 200, to: 340 })
  painter.stamp(['..#..', '..#..', '#####', '..#..', '..#..'], 88, 12, 'accentLight')
  painter.stamp(['.#.', '###', '.#.'], 104, 6, 'warm')
  painter.rect(96, 22, 1, 1, 'paper')
  painter.rect(132, 28, 1, 1, 'paper')
  painter.rect(113, 25, 1, 1, 'warm')
}
