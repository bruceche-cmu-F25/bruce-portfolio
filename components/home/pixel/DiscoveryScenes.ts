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
  painter.polygon([[62, 37], [90, 23], [104, 30], [76, 44]], 'warm')
  painter.polygon([[76, 44], [104, 30], [104, 36], [76, 50]], 'accentDark')
  painter.polygon([[62, 37], [76, 44], [76, 50], [62, 43]], 'side')
  painter.polygon([[74, 25], [86, 19], [96, 24], [100, 32], [82, 41], [68, 34]], 'outline')
  painter.polygon([[74, 24], [86, 18], [96, 23], [84, 29]], 'warm')
  painter.polygon([[75, 27], [83, 31], [81, 37], [71, 32]], 'accentLight')
  painter.polygon([[87, 31], [96, 26], [98, 31], [85, 38]], 'accentDark')
  painter.line(91, 29, 93, 34, 'outline')
  painter.line(64, 38, 74, 43, 'paper')
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

export function drawResearch(painter: PixelPainter) {
  painter.polygon([[29, 52], [82, 79], [143, 48], [89, 22]], 'shadow')
  painter.polygon([[32, 48], [84, 74], [142, 45], [90, 19]], 'outline')
  painter.polygon([[32, 46], [84, 72], [142, 43], [90, 17]], 'side')
  painter.polygon([[29, 47], [81, 73], [139, 44], [87, 18]], 'outline')
  painter.polygon([[29, 44], [81, 70], [139, 41], [87, 15]], 'surface')
  painter.polygon([[26, 48], [78, 74], [128, 49], [128, 38], [84, 16]], 'outline')
  painter.polygon([[26, 45], [78, 71], [126, 47], [126, 37], [84, 16]], 'paper')
  painter.polygon([[126, 37], [116, 42], [126, 47]], 'accentLight')
  painter.line(116, 42, 126, 47, 'muted')

  const pagePoint = (horizontal: number, vertical: number): Point => [84 + horizontal * 2 - vertical * 2, 16 + horizontal + vertical]
  const pageLine = (horizontal1: number, vertical1: number, horizontal2: number, vertical2: number, tone: PixelTone, thickness = 1) => {
    const start = pagePoint(horizontal1, vertical1)
    const end = pagePoint(horizontal2, vertical2)
    painter.line(start[0], start[1], end[0], end[1], tone, thickness)
  }

  pageLine(3, 5, 18, 5, 'outline', 3)
  pageLine(3, 8, 13, 8, 'muted', 2)
  painter.polygon([pagePoint(3, 11), pagePoint(23, 11), pagePoint(23, 15), pagePoint(3, 15)], 'accentLight')
  pageLine(4, 12, 20, 12, 'accentDark')
  pageLine(4, 14, 15, 14, 'accentDark')

  for (const row of [18, 21, 24]) {
    pageLine(3, row, row === 24 ? 10 : 12, row, 'muted')
    pageLine(15, row, row === 21 ? 21 : 23, row, 'muted')
  }
  pageLine(3, 27, 16, 27, 'accentDark')

  painter.rect(67, 66, 5, 5, 'accentDark')
  painter.rect(68, 67, 3, 3, 'accentLight')
  painter.line(69, 71, 69, 86, 'accentDark', 2)
  painter.line(69, 86, 103, 86, 'accentDark', 2)
  painter.line(103, 86, 103, 71, 'accentDark', 2)
  painter.line(103, 71, 113, 71, 'accentDark', 2)
  painter.polygon([[113, 71], [107, 67], [107, 75]], 'accentDark')

  painter.polygon([[115, 56], [159, 56], [164, 61], [164, 89], [114, 89], [111, 86], [111, 59]], 'shadow')
  painter.polygon([[115, 53], [157, 53], [162, 58], [162, 86], [112, 86], [109, 83], [109, 59]], 'outline')
  painter.polygon([[115, 55], [156, 55], [160, 59], [160, 84], [113, 84], [111, 82], [111, 59]], 'surface')
  painter.rect(114, 59, 3, 21, 'accent')
  painter.stamp(['#####', '#####', '  ###', ' ### ', '##   '], 121, 60, 'accentDark')
  painter.stamp(['#####', '#####', '  ###', ' ### ', '##   '], 130, 60, 'accentDark')
  painter.rect(121, 70, 31, 2, 'outline')
  painter.rect(121, 75, 26, 2, 'muted')
  painter.rect(121, 80, 18, 2, 'muted')
}
