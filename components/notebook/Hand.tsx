/** The hand that reaches in and turns pages, drawn in the same pen as the book. */

import rough from 'roughjs'
import { forwardRef } from 'react'
import { INK, settle } from './Ink'

const gen = rough.generator()

/** viewBox is 120 × 200; the index fingertip sits here. Notebook pins this point to the page corner. */
export const HAND_TIP = { x: 44, y: 5, w: 120 }

const OUTLINE =
  'M36 80 L35 20 C35 7 53 6 53 19 L54 68 C56 59 70 59 70 71 C72 64 84 65 84 77 C86 72 96 75 95 89 ' +
  'C95 106 92 121 88 136 L86 200 L40 200 L42 142 C38 129 27 119 20 107 C14 97 16 88 24 88 ' +
  'C30 88 34 94 36 101 Z'

const DETAILS = [
  'M40 17 C41 11 49 11 49 17',            // nail
  'M56 75 C60 78 66 78 70 73',            // curled middle finger
  'M70 82 C74 85 80 85 84 80',            // curled ring finger
  'M37 101 C42 104 46 108 47 114',        // thumb crease
]

const CUFF = ['M41 162 C56 166 72 166 87 161', 'M41 172 C56 176 72 176 87 171']

export const Hand = forwardRef<HTMLDivElement>(function Hand(_, ref) {
  const body = gen.toPaths(gen.path(OUTLINE, {
    seed: 11, roughness: 0.55, stroke: INK.ink, strokeWidth: 2.2, fill: '#fffdf7', fillStyle: 'solid',
  }))
  const lines = DETAILS.flatMap((d, i) => gen.toPaths(gen.path(d, { seed: 20 + i, roughness: 0.4, stroke: INK.ink, strokeWidth: 1.6 })))
  const cuff = CUFF.flatMap((d, i) => gen.toPaths(gen.path(d, { seed: 30 + i, roughness: 0.5, stroke: INK.blue, strokeWidth: 2 })))
  return (
    <div className="nb-hand" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 120 200">
        {[...body, ...lines, ...cuff].map((p, i) => (
          <path key={i} d={settle(p.d)} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'}
                strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  )
})
