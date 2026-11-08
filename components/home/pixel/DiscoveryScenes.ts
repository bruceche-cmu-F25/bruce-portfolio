import type { PixelPainter } from './primitives'

type PixelTone = Parameters<PixelPainter['rect']>[4]
type Point = [number, number]

const parkingPoint = (horizontal: number, vertical: number, height = 0): Point => [
  88 + horizontal * 2 - vertical * 2,
  21 + horizontal + vertical - height,
]

export function drawParking(painter: PixelPainter) {
  painter.polygon([[22, 57], [90, 23], [160, 58], [92, 92]], 'shadow')
  painter.polygon([[20, 55], [88, 21], [158, 56], [90, 90]], 'side')
  painter.polygon([[20, 53], [88, 19], [158, 54], [90, 88]], 'surface')
  painter.polygon([[20, 53], [44, 41], [108, 73], [84, 85]], 'accentDark')
  painter.polygon([[88, 19], [158, 54], [152, 57], [82, 22]], 'paper')
  painter.line(88, 20, 154, 53, 'muted')
  painter.line(152, 57, 90, 88, 'outline')
  painter.polygon([[118, 40], [144, 53], [108, 71], [82, 58]], 'accentDark')
  painter.polygon([[118, 43], [138, 53], [108, 68], [88, 58]], 'accent')

  const parkingLine = (horizontal1: number, vertical1: number, horizontal2: number, vertical2: number, tone: PixelTone) => {
    const start = parkingPoint(horizontal1, vertical1)
    const end = parkingPoint(horizontal2, vertical2)
    painter.line(start[0], start[1], end[0], end[1], tone, 2)
  }

  parkingLine(2, 2, 2, 20, 'paper')
  parkingLine(2, 20, 14, 20, 'paper')
  parkingLine(14, 20, 14, 2, 'paper')
  parkingLine(17, 2, 30, 2, 'accentLight')
  parkingLine(30, 2, 30, 20, 'accentLight')
  parkingLine(30, 20, 17, 20, 'accentLight')
  parkingLine(17, 20, 17, 2, 'accentLight')

  painter.line(29, 55, 39, 60, 'paper', 2)
  painter.line(47, 64, 57, 69, 'paper', 2)
  painter.line(65, 73, 75, 78, 'paper', 2)
  painter.line(83, 82, 91, 86, 'paper', 2)

  painter.polygon([[61, 45], [89, 30], [108, 39], [80, 55]], 'shadow')
  painter.polygon([[62, 37], [90, 23], [104, 30], [104, 38], [76, 52], [62, 45]], 'outline')
  painter.polygon([[62, 37], [90, 23], [104, 30], [76, 44]], 'paper')
  painter.polygon([[76, 44], [104, 30], [104, 36], [76, 50]], 'surface')
  painter.polygon([[62, 37], [76, 44], [76, 50], [62, 43]], 'muted')
  painter.polygon([[74, 25], [86, 19], [96, 24], [100, 32], [82, 41], [68, 34]], 'outline')
  painter.polygon([[74, 24], [86, 18], [96, 23], [84, 29]], 'paper')
  painter.polygon([[75, 27], [83, 31], [81, 37], [71, 32]], 'accentDark')
  painter.line(76, 29, 80, 31, 'accentLight')
  painter.polygon([[87, 31], [96, 26], [98, 31], [85, 38]], 'side')
  painter.line(91, 29, 93, 34, 'outline')
  painter.line(64, 38, 74, 43, 'accentLight')
  painter.rect(63, 40, 3, 2, 'warm')
  painter.rect(71, 44, 3, 2, 'warm')
  painter.line(64, 44, 73, 48, 'outline')
  painter.stamp([' ### ', '#####', '#####', '## ##', '#####', ' ### '], 98, 34, 'outline')
  painter.stamp([' ### ', '#####', '#####', '## ##', '#####', ' ### '], 78, 44, 'outline')
  painter.rect(100, 36, 1, 2, 'muted')
  painter.rect(80, 46, 1, 2, 'muted')

  painter.polygon([[103, 56], [113, 51], [123, 56], [113, 61]], 'accentLight')
  painter.polygon([[108, 56], [113, 53], [118, 56], [113, 59]], 'accentDark')
  painter.line(113, 45, 113, 53, 'accentLight', 2)
  painter.stamp([
    '    #####    ',
    '  #########  ',
    ' ########### ',
    '#############',
    '#############',
    '#############',
    '#############',
    '#############',
    ' ########### ',
    ' ########### ',
    '  #########  ',
    '   #######   ',
    '    #####    ',
    '     ###     ',
    '      #      ',
  ], 107, 29, 'outline')
  painter.stamp([
    '   #####   ',
    ' ######### ',
    '###########',
    '###########',
    '###########',
    '###########',
    '###########',
    ' ######### ',
    ' ######### ',
    '  #######  ',
    '   #####   ',
    '    ###    ',
    '     #     ',
  ], 108, 30, 'accent')
  painter.stamp([' ### ', '#####', '#####', '#####', ' ### '], 111, 32, 'accentLight')
  painter.rect(113, 33, 1, 3, 'paper')
}

/** A little deterministic noise, so textures don't shimmer between renders. */
const speckle = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

/** The research agent as a detective working a case: a fedora and an upturned
 *  collar under a hanging lamp, a magnifying glass held up to an evidence
 *  board of photos, notes and a map, all strung together with red thread. */
export function drawResearch(painter: PixelPainter) {
  // the lamp and the cone of light it throws over the board
  painter.polygon([[64, 15], [84, 15], [176, 92], [44, 104]], 'warm', 'sparse')
  painter.line(74, 0, 74, 9, 'outline')
  painter.polygon([[67, 9], [81, 9], [86, 15], [62, 15]], 'surface')
  painter.rect(62, 14, 24, 1, 'muted')
  painter.disc(74, 16, 3, 'warm')
  painter.rect(73, 15, 2, 1, 'paper')

  // the evidence board: a cork face in a darker frame
  painter.polygon([[86, 19], [175, 19], [175, 89], [86, 89]], 'shadow')
  painter.rect(84, 16, 90, 72, 'corkDark')
  painter.rect(87, 19, 84, 66, 'cork')
  for (let y = 19; y < 85; y++) {
    for (let x = 87; x < 171; x++) if (speckle(x, y) > 0.9) painter.rect(x, y, 1, 1, 'corkDark')
  }

  // what's pinned up: a suspect's photo, a note, a map, a question, a report
  painter.rect(93, 25, 20, 23, 'paper')
  painter.rect(95, 27, 16, 15, 'surface')
  painter.disc(103, 33, 3.6, 'outline')
  painter.polygon([[96, 42], [98, 37], [108, 37], [110, 42]], 'outline')
  painter.rect(95, 44, 10, 1, 'muted')

  painter.rect(121, 23, 22, 15, 'paper')
  for (const [row, length] of [[27, 16], [30, 12], [33, 15]]) painter.rect(124, row, length, 1, 'muted')

  painter.rect(148, 27, 20, 20, 'paper')
  painter.line(149, 41, 166, 30, 'muted')
  painter.line(152, 28, 160, 46, 'muted')
  painter.line(149, 35, 167, 37, 'muted')
  painter.stamp(['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], 157, 38, 'thread')

  painter.rect(99, 56, 17, 17, 'warm')
  painter.rect(99, 56, 17, 2, 'corkDark', 'checker')
  painter.stamp(['.###.', '#...#', '...#.', '..#..', '.....', '..#..'], 105, 61, 'outline')

  painter.rect(126, 53, 24, 27, 'paper')
  for (const [row, length] of [[57, 18], [60, 14], [63, 18], [66, 10], [72, 16], [75, 12]]) painter.rect(129, row, length, 1, 'muted')
  painter.ring(136, 66.5, 5.5, 'thread', { squash: 0.6 })

  painter.rect(155, 57, 14, 16, 'paper')
  painter.rect(157, 59, 10, 9, 'surface')
  painter.disc(162, 63, 2.4, 'outline')

  // the red thread, pin to pin
  const pins: [number, number][] = [[103, 25], [132, 23], [158, 27], [107, 56], [138, 53], [162, 57]]
  for (const [a, b] of [[0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [4, 5], [1, 4]]) {
    painter.line(pins[a][0], pins[a][1], pins[b][0], pins[b][1], 'thread')
  }
  pins.forEach(([x, y], index) => painter.rect(x - 1, y - 1, 3, 3, index % 2 ? 'accent' : 'thread'))

  // the detective: coat, collar up, hat brim low — in silhouette, lit from the board's side
  painter.polygon([[13, 100], [16, 64], [30, 56], [56, 55], [68, 64], [75, 100]], 'surface')
  painter.polygon([[40, 58], [56, 55], [68, 64], [75, 100], [52, 100]], 'outline', 'checker')
  // the coat fades out below the frame rather than stopping dead
  painter.rect(13, 100, 62, 4, 'surface', 'checker')
  painter.rect(13, 104, 62, 4, 'surface', 'sparse')
  painter.line(30, 57, 40, 79, 'outline')
  painter.line(56, 56, 46, 79, 'outline')
  painter.rect(16, 86, 58, 3, 'outline')
  painter.rect(42, 86, 6, 3, 'muted')
  painter.rect(42, 94, 2, 2, 'muted')
  // the upturned collar
  painter.polygon([[26, 46], [38, 54], [34, 64], [22, 58]], 'side')
  painter.polygon([[54, 46], [60, 52], [64, 62], [52, 60]], 'side')
  painter.line(54, 46, 64, 62, 'muted')
  // the face, mostly in the hat's shadow, its profile catching the light
  painter.polygon([[32, 34], [54, 34], [58, 41], [56, 44], [57, 47], [53, 52], [36, 54]], 'outline')
  painter.line(54, 35, 58, 41, 'warm')
  painter.line(58, 41, 56, 44, 'warm')
  painter.line(57, 47, 53, 52, 'warm')
  painter.rect(48, 39, 3, 1, 'muted')
  // the fedora
  painter.polygon([[30, 30], [33, 19], [44, 16], [52, 19], [55, 30]], 'surface')
  painter.line(37, 19, 44, 22, 'outline')
  painter.rect(30, 27, 26, 4, 'outline')
  painter.rect(30, 27, 26, 1, 'accentDark')
  painter.polygon([[18, 32], [66, 30], [70, 34], [16, 37]], 'surface')
  painter.line(18, 32, 66, 30, 'muted')
  painter.line(16, 37, 70, 34, 'outline')

  // the arm up to the board, and the glass, showing the thread magnified
  painter.polygon([[56, 60], [80, 52], [84, 58], [62, 70]], 'surface')
  painter.line(58, 61, 80, 53, 'muted')
  painter.disc(83, 56, 3, 'corkDark')
  painter.line(84, 55, 87, 51, 'warm', 2)
  painter.disc(93, 45, 7.5, 'cork')
  painter.line(86, 40, 100, 50, 'thread', 2)
  painter.rect(91, 43, 4, 4, 'thread')
  painter.ring(93, 45, 7.6, 'paper', { thickness: 1.8 })
  painter.ring(93, 45, 5.5, 'paper', { from: 200, to: 250 })
}
