import type { PixelPainter, PixelPoint, PixelTone } from './primitives'

/** The Chase octagon: four blades turning round a square hole, each a hair
 *  apart from the next. `size` is the octagon's inner radius. */
function octagon(painter: PixelPainter, cx: number, cy: number, size: number, tone: PixelTone) {
  const hole = size * 0.25, side = size * Math.tan(Math.PI / 8), gap = Math.max(0.6, size * 0.035)
  const top: PixelPoint[] = [[-hole + gap, -hole - gap], [-hole + gap, -size], [side, -size], [size, -side], [size, -hole - gap]]
  let blade = top
  for (let turn = 0; turn < 4; turn++) {
    painter.polygon(blade.map(([x, y]): PixelPoint => [cx + x, cy + y]), tone)
    blade = blade.map(([x, y]): PixelPoint => [-y, x])
  }
}

/** A chat bubble with a little tail on one side. */
function bubble(painter: PixelPainter, x: number, y: number, width: number, height: number, tone: PixelTone, side: 'left' | 'right') {
  painter.rect(x + 1, y, width - 2, height, tone)
  painter.rect(x, y + 1, width, height - 2, tone)
  if (side === 'left') painter.polygon([[x, y + height - 5], [x - 4, y + height], [x + 5, y + height - 1]], tone)
  else painter.polygon([[x + width, y + height - 5], [x + width + 4, y + height], [x + width - 5, y + height - 1]], tone)
}

/** Capitawise as a bank's chatbot: Chase's octagon, in the hour's colour,
 *  glowing beside a chat in full flow — the assistant's greeting, the customer's question, an answer
 *  with a little spending chart in it, and the assistant already typing. */
export function drawFinance(painter: PixelPainter) {
  // the octagon, and its glow
  painter.disc(142, 42, 33, 'accentDark', 1, 'sparse')
  octagon(painter, 142, 42, 24, 'accent')
  // coins, stacked and spinning off it
  painter.disc(126, 88, 9, 'shadow', 0.34)
  for (let level = 0; level < 4; level++) {
    painter.disc(126, 86 - level * 3, 7.5, 'corkDark', 0.38)
    painter.disc(126, 85 - level * 3, 7.5, 'warm', 0.38)
  }
  painter.ring(126, 76, 4.5, 'corkDark', { squash: 0.38 })
  painter.disc(163, 80, 5, 'warm')
  painter.ring(163, 80, 5, 'corkDark')
  painter.stamp(['.#.', '###', '#..', '###', '..#', '###', '.#.'], 162, 77, 'corkDark')

  // the chat window
  painter.polygon([[13, 10], [104, 10], [106, 12], [106, 101], [104, 103], [13, 103], [11, 101], [11, 12]], 'shadow')
  painter.rect(10, 7, 94, 94, 'outline')
  painter.rect(12, 9, 90, 90, 'surface')
  // its header: the bank's mark, a name, and the dot that says it's online
  painter.rect(12, 9, 90, 13, 'accentDark')
  painter.disc(20, 15.5, 4.6, 'accent')
  painter.rect(19, 14, 3, 3, 'accentDark')
  painter.rect(28, 13, 26, 2, 'paper')
  painter.rect(28, 17, 14, 1, 'muted')
  painter.rect(44, 17, 2, 2, 'leaf')
  painter.rect(92, 14, 6, 1, 'muted')
  painter.rect(92, 16, 6, 1, 'muted')

  // the assistant: a little robot avatar, then its greeting
  painter.rect(15, 28, 9, 8, 'paper')
  painter.rect(17, 30, 5, 3, 'accent')
  painter.rect(18, 31, 1, 1, 'accentLight')
  painter.rect(20, 31, 1, 1, 'accentLight')
  painter.rect(19, 25, 1, 3, 'muted')
  painter.rect(18, 24, 3, 1, 'accent')
  bubble(painter, 29, 26, 48, 14, 'paper', 'left')
  painter.rect(33, 30, 34, 2, 'outline')
  painter.rect(33, 34, 24, 1, 'muted')
  // the customer's question
  bubble(painter, 48, 45, 48, 11, 'accent', 'right')
  painter.rect(52, 48, 38, 1, 'paper')
  painter.rect(52, 51, 26, 1, 'accentLight')
  // the answer, with a chart in it
  painter.rect(15, 66, 9, 8, 'paper')
  painter.rect(17, 68, 5, 3, 'accent')
  painter.rect(18, 69, 1, 1, 'accentLight')
  painter.rect(20, 69, 1, 1, 'accentLight')
  bubble(painter, 29, 61, 58, 23, 'paper', 'left')
  painter.rect(33, 64, 30, 1, 'outline')
  painter.rect(33, 80, 50, 1, 'muted')
  ;[5, 9, 7, 12, 10, 15].forEach((height, index) => {
    painter.rect(34 + index * 7, 79 - height, 5, height, index === 5 ? 'accent' : 'accentDark')
  })
  painter.rect(73, 66, 10, 3, 'leaf')
  // and already typing the next one
  bubble(painter, 29, 89, 20, 8, 'paper', 'left')
  ;[33, 38, 43].forEach((x, index) => painter.rect(x, 92, 2, 2, index === 1 ? 'outline' : 'muted'))
}

/** PawPrints as the meme that's pixel art to begin with: Nyan Cat, flying
 *  through the night on its rainbow — a rainbow made of the hour's own colours
 *  — with an adoption ID badge in the corner, because every pet on PawPrints
 *  has one, and because Nyan Cat itself ended up on-chain. Drawn fresh on a
 *  3× grid rather than copied: a pastry body with icing and sprinkles, a grey
 *  head with a happy little face, stub legs and a tail. */
export function drawAdoption(painter: PixelPainter) {
  const s = 3, ox = 62, oy = 26
  const px = (x: number, y: number, width: number, height: number, tone: PixelTone) =>
    painter.rect(ox + x * s, oy + y * s, width * s, height * s, tone)

  // the rainbow, six bands, rippling in steps the way the original does
  const bands: PixelTone[] = ['heat4', 'warm', 'heat3', 'accent', 'heat2', 'heat1']
  for (let x = 0; x < ox + 6 * s; x += 3 * s) {
    const lift = Math.floor(x / (3 * s)) % 2 ? 0 : s
    // its far end thins out to nothing rather than stopping at the frame
    const pattern = x < 3 * s ? 'sparse' : x < 6 * s ? 'checker' : 'solid'
    bands.forEach((tone, band) => painter.rect(x, oy + 4 * s + band * 5 - lift + 3, 3 * s, 5, tone, pattern))
  }

  // stars, twinkling at different sizes
  for (const [x, y, big] of [[18, 14, true], [44, 90, false], [150, 12, false], [172, 70, true], [96, 98, false], [30, 74, false], [126, 6, false]] as [number, number, boolean][]) {
    if (big) {
      painter.rect(x - 4, y, 9, 1, 'paper')
      painter.rect(x, y - 4, 1, 9, 'paper')
      painter.rect(x - 1, y - 1, 3, 3, 'paper')
    } else {
      painter.rect(x - 1, y, 3, 1, 'muted')
      painter.rect(x, y - 1, 1, 3, 'muted')
    }
  }

  // the tail, and the four stub legs
  px(1, 9, 5, 3, 'outline')
  px(2, 10, 4, 1, 'muted')
  px(0, 10, 2, 2, 'outline')
  for (const x of [5, 9, 18, 22]) {
    px(x, 16, 4, 4, 'outline')
    px(x + 1, 17, 2, 2, 'muted')
  }

  // the pastry: a dark outline, a golden crust, pink-ish icing and sprinkles
  px(5, 0, 19, 18, 'outline')
  px(4, 1, 21, 16, 'outline')
  px(5, 1, 19, 16, 'warm')
  px(6, 2, 17, 14, 'accentLight')
  px(5, 2, 1, 1, 'outline')
  px(23, 2, 1, 1, 'outline')
  px(5, 15, 1, 1, 'outline')
  px(23, 15, 1, 1, 'outline')
  px(6, 2, 1, 1, 'warm')
  px(22, 2, 1, 1, 'warm')
  px(6, 15, 1, 1, 'warm')
  px(22, 15, 1, 1, 'warm')
  for (const [x, y] of [[8, 4], [12, 3], [17, 5], [10, 8], [7, 11], [14, 10], [19, 9], [11, 13], [16, 13]]) px(x, y, 1, 1, 'accent')

  // the head: grey, two ears, wide dark eyes with a shine, pink cheeks, a w-mouth
  px(17, 5, 14, 11, 'outline')
  px(16, 6, 16, 9, 'outline')
  px(17, 6, 14, 9, 'muted')
  px(18, 5, 12, 1, 'muted')
  // ears
  px(17, 2, 3, 4, 'outline')
  px(18, 3, 2, 3, 'muted')
  px(28, 2, 3, 4, 'outline')
  px(28, 3, 2, 3, 'muted')
  px(20, 4, 1, 2, 'outline')
  px(27, 4, 1, 2, 'outline')
  // eyes
  px(19, 8, 2, 2, 'outline')
  px(26, 8, 2, 2, 'outline')
  px(19, 8, 1, 1, 'paper')
  px(26, 8, 1, 1, 'paper')
  // cheeks
  px(17, 11, 2, 1, 'blush')
  px(29, 11, 2, 1, 'blush')
  // nose and mouth
  px(23, 10, 1, 1, 'outline')
  px(20, 12, 1, 1, 'outline')
  px(21, 13, 2, 1, 'outline')
  px(23, 12, 1, 1, 'outline')
  px(24, 13, 2, 1, 'outline')
  px(26, 12, 1, 1, 'outline')

  // the adoption ID badge, pinned in the corner
  const hex: PixelPoint[] = [[160, 82], [169, 87], [169, 97], [160, 102], [151, 97], [151, 87]]
  painter.polygon(hex, 'accent')
  painter.polygon(hex.map(([x, y]): PixelPoint => [160 + (x - 160) * 0.76, 92 + (y - 92) * 0.76]), 'accentDark')
  painter.disc(160, 94.5, 2.6, 'accentLight')
  for (const [x, y] of [[156, 90.5], [158.6, 88.6], [161.4, 88.6], [164, 90.5]]) painter.disc(x, y, 1.1, 'accentLight')
}
