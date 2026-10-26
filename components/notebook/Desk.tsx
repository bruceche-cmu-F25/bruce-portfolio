/** Things lying on the desk beside the closed book: a pencil, a mug, a sticky
 *  note. They're only there while the book is shut — open it and the camera
 *  moves in past them. Like everything else, they can be pushed around. */

import rough from 'roughjs'
import { INK, settle } from './Ink'

const gen = rough.generator()
type Shape = ReturnType<typeof gen.circle>

function Drawn({ shape }: { shape: Shape }) {
  return (
    <>
      {gen.toPaths(shape).map((p, i) => (
        <path key={i} d={settle(p.d)} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'}
              strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </>
  )
}

const solid = (fill: string, seed: number, stroke = INK.ink, strokeWidth = 1.6) =>
  ({ seed, fill, fillStyle: 'solid', stroke, strokeWidth, roughness: 0.8 })

/** A yellow HB pencil, point to the left. */
function Pencil() {
  return (
    <svg viewBox="0 0 320 40" aria-hidden="true">
      <Drawn shape={gen.polygon([[4, 20], [42, 6], [42, 34]], solid('#e8c49a', 61))} />
      <Drawn shape={gen.polygon([[4, 20], [16, 15.5], [16, 24.5]], solid('#3a3d44', 62))} />
      <Drawn shape={gen.rectangle(42, 6, 228, 28, solid('#f2c230', 63))} />
      <Drawn shape={gen.line(46, 15, 266, 15, { seed: 64, stroke: '#d9a91f', strokeWidth: 1.4, roughness: 0.6 })} />
      <Drawn shape={gen.line(46, 25, 266, 25, { seed: 65, stroke: '#d9a91f', strokeWidth: 1.4, roughness: 0.6 })} />
      <Drawn shape={gen.rectangle(270, 5, 20, 30, solid('#b9bdc4', 66))} />
      <Drawn shape={gen.rectangle(290, 6, 24, 28, solid('#ee8aa6', 67))} />
    </svg>
  )
}

/** A mug of coffee, seen from above. */
function Mug() {
  return (
    <svg viewBox="0 0 150 120" aria-hidden="true">
      <Drawn shape={gen.ellipse(118, 60, 42, 30, { seed: 71, stroke: INK.ink, strokeWidth: 9, roughness: 0.6 })} />
      <Drawn shape={gen.ellipse(118, 60, 42, 30, { seed: 72, stroke: '#f4f0e6', strokeWidth: 6, roughness: 0.6 })} />
      <Drawn shape={gen.circle(60, 60, 104, solid('#f4f0e6', 73))} />
      <Drawn shape={gen.circle(60, 60, 84, solid('#6b4226', 74, '#5a3720', 1.2))} />
      <Drawn shape={gen.ellipse(50, 50, 30, 16, { seed: 75, fill: '#a87b52', fillStyle: 'solid', stroke: 'none', roughness: 1 })} />
    </svg>
  )
}

/** A hand-drawn, empty checkbox. */
function Box({ seed }: { seed: number }) {
  return (
    <svg className="nb-todo-box" viewBox="0 0 20 20" aria-hidden="true">
      <Drawn shape={gen.rectangle(2.5, 2.5, 15, 15, { seed, stroke: INK.ink, strokeWidth: 1.5, roughness: 1.1 })} />
    </svg>
  )
}

const TODO = ['job search', 'research', 'build AI product']

export function DeskProps() {
  return (
    <div className="nb-props" aria-hidden="true">
      <span className="nb-prop nb-prop-mug"><Mug /></span>
      <span className="nb-prop nb-prop-pencil"><Pencil /></span>
      <span className="nb-prop nb-prop-note">No Pain No Gain</span>
      <span className="nb-prop nb-prop-note nb-prop-todo">
        <span className="nb-todo-title">todo</span>
        {TODO.map((t, i) => <span key={t} className="nb-todo-item"><Box seed={100 + i} />{t}</span>)}
      </span>
    </div>
  )
}
