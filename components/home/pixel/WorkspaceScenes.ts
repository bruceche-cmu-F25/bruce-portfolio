import type { PixelPainter, PixelTone } from './primitives'

function face(painter: PixelPainter, left: number, top: number, width: number, height: number, tone: PixelTone) {
  const slope = Math.floor(width / 2)
  painter.polygon([[left + 3, top + height + 4], [left + width + 5, top + slope + height + 5], [left + width + 12, top + slope + height + 1], [left + 10, top + height]], 'shadow')
  painter.polygon([[left, top], [left + width, top + slope], [left + width, top + slope + height], [left, top + height]], 'outline')
  painter.polygon([[left + 2, top + 3], [left + width - 2, top + slope + 1], [left + width - 2, top + slope + height - 2], [left + 2, top + height - 1]], tone)
  painter.polygon([[left + width, top + slope], [left + width + 3, top + slope - 2], [left + width + 3, top + slope + height - 2], [left + width, top + slope + height]], 'side')
  painter.line(left, top, left + width, top + slope, 'muted')
}

function detail(painter: PixelPainter, left: number, top: number, width: number, height: number, tone: PixelTone) {
  painter.polygon([[left, top], [left + width, top + Math.floor(width / 2)], [left + width, top + Math.floor(width / 2) + height], [left, top + height]], tone)
}

export function drawWorkspace(painter: PixelPainter) {
  painter.line(42, 84, 68, 97, 'accentDark', 2)
  painter.line(68, 97, 97, 82, 'accentDark', 2)
  painter.line(105, 84, 121, 92, 'accentDark', 2)
  painter.line(121, 92, 139, 83, 'accentDark', 2)
  painter.rect(65, 95, 3, 3, 'accent')
  painter.rect(119, 90, 3, 3, 'accent')

  face(painter, 20, 31, 38, 29, 'paper')
  painter.polygon([[23, 35], [39, 58], [55, 51]], 'surface')
  painter.line(23, 35, 39, 58, 'muted')
  painter.line(39, 58, 55, 51, 'muted')
  painter.line(23, 57, 33, 51, 'muted')
  painter.line(46, 62, 55, 73, 'muted')
  painter.rect(51, 45, 4, 4, 'accent')

  face(painter, 70, 10, 39, 49, 'surface')
  detail(painter, 72, 14, 35, 9, 'accentDark')
  detail(painter, 77, 10, 3, 7, 'accentLight')
  detail(painter, 98, 20, 3, 7, 'accentLight')
  detail(painter, 76, 29, 27, 1, 'muted')
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 4; column++) {
      detail(painter, 76 + column * 7, 34 + row * 8 + Math.floor(column * 7 / 2), 4, 4, row === 1 && column === 2 ? 'accent' : 'muted')
    }
  }
  detail(painter, 76, 61, 13, 2, 'accentLight')

  face(painter, 122, 26, 35, 45, 'surface')
  detail(painter, 127, 33, 23, 3, 'accentLight')
  for (let row = 0; row < 3; row++) {
    const top = 44 + row * 10
    detail(painter, 127, top, 4, 4, row < 2 ? 'accentDark' : 'muted')
    if (row < 2) {
      painter.line(127, top + 1, 129, top + 4, 'accentLight')
      painter.line(129, top + 4, 133, top + 1, 'accentLight')
    }
    detail(painter, 136, top + 5, row === 2 ? 11 : 15, 2, row < 2 ? 'paper' : 'muted')
    detail(painter, 136, top + 9, 8, 1, 'muted')
  }
}

export function drawStory(painter: PixelPainter) {
  painter.polygon([[33, 66], [87, 93], [160, 57], [107, 31]], 'shadow')
  painter.polygon([[28, 54], [81, 81], [158, 43], [105, 16]], 'outline')
  painter.polygon([[28, 54], [81, 81], [81, 87], [28, 60]], 'accentDark')
  painter.polygon([[81, 81], [158, 43], [158, 49], [81, 87]], 'side')
  painter.line(30, 61, 81, 86, 'accent')
  painter.line(82, 85, 157, 48, 'accent')
  painter.polygon([[31, 53], [80, 29], [131, 55], [82, 79]], 'paper')
  painter.polygon([[80, 29], [103, 18], [154, 44], [131, 55]], 'paper')
  painter.polygon([[80, 29], [85, 27], [137, 53], [131, 55]], 'surface')
  painter.line(32, 55, 82, 80, 'muted')
  painter.line(83, 80, 154, 45, 'muted')
  painter.line(80, 29, 131, 55, 'accentDark', 2)
  painter.line(82, 28, 133, 54, 'accentLight')

  painter.line(51, 53, 66, 45, 'accentDark')
  painter.line(66, 45, 84, 51, 'accentDark')
  painter.line(84, 51, 95, 43, 'accentDark')
  ;[[51, 53], [66, 45], [84, 51], [95, 43]].forEach(([column, row]) => painter.rect(column - 1, row - 1, 3, 3, 'accent'))
  painter.line(47, 61, 67, 71, 'muted')
  painter.line(53, 60, 77, 72, 'muted')
  painter.line(60, 58, 84, 70, 'muted')
  painter.line(99, 29, 126, 43, 'muted')
  painter.line(95, 33, 116, 44, 'muted')
  painter.line(100, 40, 119, 50, 'muted')

  painter.stamp([
    '......####......',
    '....#####.......',
    '...#####........',
    '..#####.........',
    '.######.........',
    '.######.........',
    '#######.........',
    '#######.........',
    '########........',
    '.########.......',
    '.##########.....',
    '..############..',
    '...############.',
    '....###########.',
    '......#######...',
    '........###.....',
  ], 140, 10, 'warm')
  painter.line(133, 10, 133, 16, 'accentLight')
  painter.line(130, 13, 136, 13, 'accentLight')
  painter.line(160, 29, 160, 33, 'warm')
  painter.line(158, 31, 162, 31, 'warm')
  ;[5, 9, 15, 11, 7].forEach((height, index) => {
    painter.rect(145 + index * 4, 76 - Math.floor(height / 2), 2, height, index === 2 ? 'warm' : 'accent')
  })
}
