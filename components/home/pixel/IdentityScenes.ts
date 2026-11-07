import type { PixelPainter } from './primitives'

function paper(painter: PixelPainter, x: number, y: number, width: number, height: number) {
  painter.polygon([[x + 3, y + height + 3], [x + width + 3, y + height + 3], [x + width + 11, y + height - 1], [x + 11, y + height - 1]], 'shadow')
  painter.polygon([[x, y], [x + 8, y - 4], [x + width + 8, y - 4], [x + width, y]], 'surface')
  painter.polygon([[x + width, y], [x + width + 8, y - 4], [x + width + 8, y + height - 4], [x + width, y + height]], 'side')
  painter.rect(x, y, width, height, 'outline')
  painter.rect(x + 1, y + 1, width - 2, height - 2, 'paper')
  painter.line(x + 2, y + 1, x + width - 2, y + 1, 'accentLight')
}

function speech(painter: PixelPainter, x: number, y: number, width: number, height: number) {
  painter.polygon([[x + 4, y + 3], [x + width + 3, y + 3], [x + width + 3, y + height + 3], [x + 17, y + height + 3], [x + 8, y + height + 9], [x + 8, y + height + 3], [x + 4, y + height + 3]], 'shadow')
  painter.polygon([[x + 2, y], [x + width - 2, y], [x + width - 2, y + 2], [x + width, y + 2], [x + width, y + height - 2], [x + width - 2, y + height - 2], [x + width - 2, y + height], [x + 15, y + height], [x + 6, y + height + 6], [x + 6, y + height], [x + 2, y + height], [x + 2, y + height - 2], [x, y + height - 2], [x, y + 2], [x + 2, y + 2]], 'outline')
  painter.rect(x + 2, y + 2, width - 4, height - 4, 'surface')
  painter.rect(x + 3, y + height - 3, width - 6, 2, 'surface')
  painter.polygon([[x + 7, y + height - 1], [x + 13, y + height - 1], [x + 7, y + height + 3]], 'surface')
  painter.rect(x + 3, y + 2, width - 6, 1, 'paper')
}

function check(painter: PixelPainter, x: number, y: number) {
  painter.stamp(['000001', '000011', '100110', '111100', '011000'], x, y, 'accentLight')
}

export function drawFinance(painter: PixelPainter) {
  paper(painter, 29, 24, 67, 66)
  painter.rect(36, 31, 3, 10, 'accentDark')
  painter.rect(43, 32, 25, 3, 'outline')
  painter.rect(43, 38, 15, 2, 'muted')
  painter.rect(80, 32, 8, 8, 'surface')
  painter.rect(82, 34, 2, 4, 'accent')
  painter.rect(85, 33, 1, 5, 'accentDark')
  painter.line(37, 45, 87, 45, 'muted')
  painter.rect(37, 50, 3, 3, 'accentDark')
  painter.rect(44, 50, 19, 2, 'muted')
  painter.rect(77, 50, 11, 2, 'outline')
  painter.rect(37, 57, 3, 3, 'warm')
  painter.rect(44, 57, 25, 2, 'muted')
  painter.rect(80, 57, 8, 2, 'outline')
  painter.line(37, 63, 87, 63, 'surface')
  painter.line(38, 83, 87, 83, 'muted')
  painter.rect(42, 76, 5, 7, 'accentDark')
  painter.rect(51, 71, 5, 12, 'accent')
  painter.rect(60, 74, 5, 9, 'accentDark')
  painter.rect(69, 67, 5, 16, 'accent')
  painter.rect(78, 69, 5, 14, 'accentDark')
  painter.line(40, 73, 49, 69, 'warm')
  painter.line(49, 69, 59, 72, 'warm')
  painter.line(59, 72, 70, 65, 'warm')
  painter.line(70, 65, 86, 66, 'warm')
  painter.rect(48, 68, 2, 2, 'paper')
  painter.rect(69, 64, 2, 2, 'paper')

  speech(painter, 99, 19, 59, 33)
  painter.rect(106, 27, 9, 9, 'accentDark')
  check(painter, 108, 29)
  painter.rect(120, 28, 25, 2, 'paper')
  painter.rect(120, 33, 18, 2, 'muted')
  painter.rect(106, 41, 11, 3, 'accent')
  painter.rect(119, 41, 7, 3, 'accentDark')
  painter.rect(128, 41, 19, 3, 'warm')
  painter.rect(106, 46, 29, 1, 'muted')

  speech(painter, 111, 67, 44, 20)
  painter.rect(118, 73, 17, 2, 'paper')
  painter.rect(118, 78, 11, 2, 'muted')
  painter.rect(141, 72, 8, 9, 'accentDark')
  check(painter, 142, 74)
}

function cat(painter: PixelPainter, x: number, y: number) {
  painter.polygon([[x, y + 9], [x, y], [x + 3, y], [x + 9, y + 6], [x + 19, y + 6], [x + 25, y], [x + 28, y], [x + 28, y + 17], [x + 26, y + 17], [x + 26, y + 23], [x + 23, y + 23], [x + 23, y + 26], [x + 5, y + 26], [x + 5, y + 23], [x + 2, y + 23], [x + 2, y + 17], [x, y + 17]], 'outline')
  painter.rect(x + 2, y + 9, 24, 8, 'warm')
  painter.rect(x + 4, y + 17, 20, 6, 'warm')
  painter.rect(x + 6, y + 23, 16, 2, 'warm')
  painter.rect(x + 4, y + 7, 20, 4, 'warm')
  painter.polygon([[x + 2, y + 2], [x + 7, y + 7], [x + 2, y + 9]], 'warm')
  painter.polygon([[x + 26, y + 2], [x + 26, y + 9], [x + 21, y + 7]], 'warm')
  painter.polygon([[x + 4, y + 5], [x + 7, y + 8], [x + 4, y + 9]], 'accentDark')
  painter.polygon([[x + 24, y + 5], [x + 24, y + 9], [x + 21, y + 8]], 'accentDark')
  painter.rect(x + 12, y + 7, 2, 4, 'muted')
  painter.rect(x + 16, y + 7, 2, 3, 'muted')
  painter.rect(x + 7, y + 13, 3, 3, 'outline')
  painter.rect(x + 19, y + 13, 3, 3, 'outline')
  painter.rect(x + 8, y + 13, 1, 1, 'paper')
  painter.rect(x + 20, y + 13, 1, 1, 'paper')
  painter.rect(x + 10, y + 18, 10, 4, 'paper')
  painter.rect(x + 13, y + 17, 4, 2, 'outline')
  painter.rect(x + 14, y + 19, 2, 2, 'outline')
  painter.rect(x + 8, y + 19, 2, 1, 'outline')
  painter.rect(x + 20, y + 19, 2, 1, 'outline')
  painter.rect(x + 3, y + 17, 3, 1, 'paper')
  painter.rect(x + 23, y + 17, 3, 1, 'paper')
  painter.rect(x + 2, y + 20, 4, 1, 'paper')
  painter.rect(x + 23, y + 20, 3, 1, 'paper')
}

function record(painter: PixelPainter, y: number, kind: 'heart' | 'medical' | 'home') {
  painter.polygon([[119, y + 2], [123, y], [159, y], [155, y + 2]], 'surface')
  painter.polygon([[155, y + 2], [159, y], [159, y + 15], [155, y + 17]], 'side')
  painter.rect(119, y + 2, 36, 15, 'outline')
  painter.rect(120, y + 3, 34, 13, 'paper')
  painter.rect(122, y + 5, 9, 9, 'surface')
  if (kind === 'heart') painter.stamp(['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'], 123, y + 6, 'accent')
  if (kind === 'medical') {
    painter.rect(126, y + 6, 2, 7, 'accentDark')
    painter.rect(123, y + 8, 8, 2, 'accentDark')
  }
  if (kind === 'home') {
    painter.stamp(['0001000', '0011100', '0111110', '1111111', '0111110', '0110110', '0110110'], 123, y + 5, 'accentDark')
  }
  painter.rect(135, y + 6, 14, 2, 'outline')
  painter.rect(135, y + 11, 10, 1, 'muted')
  painter.rect(149, y + 11, 2, 2, 'accent')
}

export function drawAdoption(painter: PixelPainter) {
  painter.line(103, 56, 112, 56, 'muted')
  painter.line(112, 31, 112, 85, 'muted')
  painter.line(112, 31, 119, 31, 'muted')
  painter.line(112, 58, 119, 58, 'muted')
  painter.line(112, 85, 119, 85, 'muted')
  painter.rect(110, 29, 4, 4, 'accentDark')
  painter.rect(111, 30, 2, 2, 'accent')
  painter.rect(110, 56, 4, 4, 'accentDark')
  painter.rect(111, 57, 2, 2, 'accent')
  painter.rect(110, 83, 4, 4, 'accentDark')
  painter.rect(111, 84, 2, 2, 'accent')

  paper(painter, 26, 23, 72, 67)
  painter.rect(34, 30, 39, 33, 'surface')
  cat(painter, 39, 33)
  painter.rect(78, 32, 13, 3, 'outline')
  painter.rect(78, 39, 8, 2, 'muted')
  painter.rect(78, 46, 3, 3, 'accent')
  painter.rect(84, 46, 8, 2, 'muted')
  painter.rect(78, 53, 13, 2, 'muted')
  painter.rect(78, 59, 9, 2, 'muted')
  painter.line(34, 68, 90, 68, 'surface')
  painter.stamp(['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'], 35, 74, 'accentDark')
  painter.rect(47, 74, 23, 2, 'outline')
  painter.rect(47, 79, 16, 2, 'muted')
  painter.rect(80, 74, 10, 10, 'accentDark')
  check(painter, 82, 77)
  painter.rect(33, 87, 18, 1, 'surface')
  painter.rect(56, 87, 7, 1, 'surface')

  record(painter, 22, 'heart')
  record(painter, 49, 'medical')
  record(painter, 76, 'home')
}
