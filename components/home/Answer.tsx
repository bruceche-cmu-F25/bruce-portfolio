'use client'

/** The interest shelves stay face up after the black-hole passage.
 *  Shuffling only changes which covers are shown and their order. */
import { useEffect, useRef, useState, type ReactNode } from 'react'

function shuffle<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function Answer({ hand, children }: { hand: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const again = useRef<(() => void) | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const lists = Array.from(el.querySelectorAll<HTMLElement>('.shelf ul'))
    const shelves = lists.map(ul => Array.from(ul.children) as HTMLElement[])
    let dealt = shelves.map(cards => cards.filter(card => !card.hasAttribute('data-out')))
    const measure = () => {
      lists.forEach((ul, row) => {
        for (const card of dealt[row]) {
          card.toggleAttribute('data-edge', card.offsetLeft + card.offsetWidth > ul.offsetLeft + ul.offsetWidth * 0.72)
        }
      })
    }
    again.current = () => {
      dealt = shelves.map((cards, row) => {
        const unseen = shuffle(cards.filter(card => !dealt[row].includes(card)))
        let next = shuffle([...unseen, ...shuffle(dealt[row])].slice(0, Math.min(hand, cards.length)))
        for (let tries = 0; tries < 4 && next.every((card, i) => card === dealt[row][i]); tries++) next = shuffle(next)
        for (const card of cards) {
          const rank = next.indexOf(card)
          card.toggleAttribute('data-out', rank < 0)
          card.style.order = rank < 0 ? '' : String(rank)
        }
        return next
      })
      measure()
    }
    measure()
    setReady(true)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => { ro.disconnect(); again.current = null }
  }, [hand])

  return (
    <div ref={box} className="answer" data-live={ready ? '' : undefined}>
      {children}
      <button type="button" className="answer-again" hidden={!ready} onClick={() => again.current?.()}
              aria-label="Shuffle films, games and books">
        <svg viewBox="0 0 7 7" width="9" height="9" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M2 0h3v1h-3zM6 0h1v1h-1zM1 1h1v1h-1zM5 1h2v1h-2zM0 2h1v1h-1zM4 2h3v1h-3zM0 3h1v1h-1zM0 4h1v1h-1zM6 4h1v1h-1zM1 5h1v1h-1zM5 5h1v1h-1zM2 6h3v1h-3z" />
        </svg>
        shuffle
      </button>
    </div>
  )
}
