'use client'

/** The player card: Bruce as a game character.
 *
 *  Up top, his type on four split-flap tiles. When the card first comes into
 *  view the tiles flap between the two sides of each trait and land on the
 *  one that won — the closer the call, the longer it takes — and the four
 *  perks unlock one after another. Pointing at a tile flips it to the side
 *  that lost, and its score with it.
 *
 *  Beside the tiles a pixel Bruce spars with a slime (Battle.tsx); each hit
 *  scores one trait, and that trait's perk lights up as it lands.
 *
 *  Without JS (or with reduced motion) it simply shows the card. */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { MBTI } from '@/lib/interests'
import Battle from './Battle'

/** 5×7 letters, '#' lit */
const GLYPHS: Record<string, string[]> = {
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
}
/** a 9×7 icon a perk, b bright and d dim, drawn like the section bullets */
const ICONS = [
  // agency: an arrow, going
  ['....b....', '....bb...', 'bbbbbbb..', 'bbbbbbbb.', 'bbbbbbb..', '....bb...', '....b....'],
  // creative: a bulb, lit
  ['...bbb...', '..b...b..', '..b.d.b..', '..b...b..', '...bbb...', '...ddd...', '....d....'],
  // product sense: an eye on the user
  ['.........', '..bbbbb..', '.b..d..b.', 'b..ddd..b', '.b..d..b.', '..bbbbb..', '.........'],
  // ownership: a shield
  ['.bbbbbbb.', '.bdddddb.', '.bdddddb.', '.bdddddb.', '..bdddb..', '...bdb...', '....b....'],
]

function pixelPath(rows: string[], tone: string) {
  let d = ''
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== tone) continue
      let end = x
      while (row[end + 1] === tone) end++
      d += `M${x} ${y}h${end - x + 1}v1h${-(end - x + 1)}Z`
      x = end
    }
  })
  return d
}
const LETTERS = Object.fromEntries(Object.entries(GLYPHS).map(([letter, rows]) => [letter, pixelPath(rows, '#')]))

const FLAP_MS = 85
const TRAITS = MBTI.traits
/** the trait colours, in the order home.css gives them */
const COLORS = ['--heat-4', '--heat-3', '--accent', '--heat-2'] as const
const HITS = TRAITS.map((t, i) => ({ value: t.value, color: COLORS[i] }))

function Glyph({ letter }: { letter: string }) {
  return (
    <svg viewBox="0 0 6 8" width="24" height="32" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      <path d={LETTERS[letter]} transform="translate(1 1)" opacity="0.28" />
      <path d={LETTERS[letter]} />
    </svg>
  )
}

export default function Mbti() {
  const box = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [on, setOn] = useState(false)
  /** what each tile shows, and how many times it has flapped (to restart the flap) */
  const [tiles, setTiles] = useState<{ letter: string; flaps: number }[]>(() => TRAITS.map(t => ({ letter: t.won, flaps: 0 })))
  const [hit, setHit] = useState<number | null>(null)
  const settled = useRef(false)
  const hitTimer = useRef(0)

  const show = (i: number, letter: string) =>
    setTiles(all => all.map((tile, k) => k === i && tile.letter !== letter ? { letter, flaps: tile.flaps + 1 } : tile))

  useEffect(() => {
    const el = box.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) { settled.current = true; return }
    setArmed(true)
    setTiles(TRAITS.map(t => ({ letter: t.lost, flaps: 0 })))
    const timers: number[] = []
    const seen = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      seen.disconnect()
      setOn(true)
      // more flaps the closer the call, one tile after another, always landing on the winner
      TRAITS.forEach((t, i) => {
        const flaps = 5 + Math.round((60 - Math.min(60, Math.abs(t.value - 50) * 4)) / 6) + i
        for (let f = 1; f <= flaps; f++) {
          timers.push(window.setTimeout(() => show(i, (flaps - f) % 2 ? t.lost : t.won), i * 140 + f * FLAP_MS * (1 + f / flaps)))
        }
      })
      timers.push(window.setTimeout(() => { settled.current = true }, 3200))
    }, { threshold: 0.5 })
    seen.observe(el)
    return () => { seen.disconnect(); timers.forEach(clearTimeout); clearTimeout(hitTimer.current) }
  }, [])

  const flip = (i: number, toLost: boolean) => {
    if (settled.current) show(i, toLost ? TRAITS[i].lost : TRAITS[i].won)
  }
  const onHit = (round: number) => {
    setHit(round % TRAITS.length)
    clearTimeout(hitTimer.current)
    hitTimer.current = window.setTimeout(() => setHit(null), 900)
  }

  return (
    <div ref={box} className="mbti" data-armed={armed || undefined} data-on={on || undefined}>
      <p className="mbti-top">
        <span><i aria-hidden>▸</i> player 1 · <b>Bruce</b></span>
        <span>class · <b>{MBTI.name.replace(/^the /i, '')}</b></span>
      </p>
      <div className="mbti-stage">
        <p className="mbti-tiles" aria-label={`Personality type ${MBTI.type}: ${TRAITS.map(t => `${t.value}% ${t.name}`).join(', ')}`}>
          {tiles.map((tile, i) => {
            const t = TRAITS[i]
            const lost = tile.letter !== t.won
            const close = Math.abs(t.value - 50) < 5
            return (
              <span key={i} className="mbti-slot" style={{ '--i': i } as CSSProperties}
                    title={`${t.value}% ${t.name} · ${100 - t.value}% ${t.opposite}${close ? ' — a close call' : ''}`}
                    onPointerEnter={() => flip(i, true)} onPointerLeave={() => flip(i, false)}>
                <span className="mbti-tile" data-lost={lost || undefined}>
                  <span key={tile.flaps} className="mbti-flap"><Glyph letter={tile.letter} /></span>
                </span>
                <small className="mbti-pct" data-lost={lost || undefined} aria-hidden>
                  {lost ? 100 - t.value : t.value}%{close && !lost && <i>!</i>}
                </small>
              </span>
            )
          })}
        </p>
        <Battle hits={HITS} onHit={onHit} running={on || !armed} />
      </div>
      <ul className="mbti-perks" aria-label="Perks">
        {TRAITS.map((t, i) => (
          <li key={t.strength} data-hit={hit === i || undefined} style={{ '--i': i } as CSSProperties}>
            <svg viewBox="0 0 9 7" width="14" height="11" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
              <path d={pixelPath(ICONS[i], 'd')} opacity="0.5" />
              <path d={pixelPath(ICONS[i], 'b')} />
            </svg>
            <b>{t.strength}</b>
            <span>{t.line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
