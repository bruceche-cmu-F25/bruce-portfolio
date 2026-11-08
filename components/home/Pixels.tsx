/** Pixel art, authored as text and emitted as SVG.
 *
 *  The drawings live in lib/sprites.json. A
 *  character is a colour in that drawing's palette and `.` is nothing.
 *
 *  Horizontal runs are merged into single rects, so the glyphs cost a handful
 *  each instead of one per pixel, and it all renders on the server — no canvas,
 *  no script, crisp at any size because it's vector underneath.
 */

import sprites from '@/lib/sprites.json'

type Palette = Record<string, string>

export interface Rect { x: number; y: number; w: number; fill: string; ch: string }

/** Merge each row's runs of one colour into a single rect. */
export function runs(rows: readonly string[], palette: Palette): Rect[] {
  const out: Rect[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let n = 1
      while (x + n < row.length && row[x + n] === ch) n++
      if (ch !== '.' && palette[ch]) out.push({ x, y, w: n, fill: palette[ch], ch })
      x += n
    }
  })
  return out
}

function Sprite({ rows, palette, alpha, className, title }: {
  rows: readonly string[]; palette: Palette; alpha?: Record<string, number>
  className?: string; title?: string
}) {
  return (
    <svg className={className} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges"
         role={title ? 'img' : 'presentation'} aria-label={title} aria-hidden={title ? undefined : true}>
      {runs(rows, palette).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} fillOpacity={alpha?.[r.ch]} />
      ))}
    </svg>
  )
}

/** The small glyphs on buttons and in the contact list — `currentColor`, so each
 *  one takes the colour of the text it sits beside and follows the hour with it. */
export type GlyphName = keyof typeof sprites.ui

export function Glyph({ name, className }: { name: GlyphName; className?: string }) {
  return <Sprite rows={sprites.ui[name]} palette={{ K: 'currentColor', M: 'currentColor' }} alpha={{ M: 0.55 }} className={`glyph ${className ?? ''}`} />
}

/** The footer's sleeping bat. */
export function SleepingBat({ className }: { className?: string }) {
  return <Sprite rows={sprites.bat.rows} palette={sprites.bat.palette} className={className} />
}

/** The pixel guests standing in the page's gutters. They take the ink colour
 *  around them, which is also how they follow the hour. */
export type GuestName = Exclude<keyof typeof sprites.guests, 'comment'>

const GUEST_LABEL: Record<GuestName, string> = {
  gundam: 'A pixel-art mecha',
  ultraman: 'A pixel-art giant hero',
}

export function Guest({ name, side }: { name: GuestName; side: 'left' | 'right' }) {
  return (
    <span className="guest" data-side={side} title={GUEST_LABEL[name]}>
      <Sprite rows={sprites.guests[name]}
              palette={{ K: 'currentColor', d: 'currentColor', e: 'var(--accent)' }}
              alpha={{ d: 0.5 }} />
    </span>
  )
}
