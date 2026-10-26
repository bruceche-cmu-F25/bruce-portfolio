'use client'
/** A picture lifted off the page. It rises from where it was tipped in. When it
 *  belongs to a set, the whole set comes up as a loose pile, and the hand leafs
 *  through it: it takes the top picture by its edge, slides it out and tucks it
 *  under the rest — or, going back, pulls the bottom one out and lays it on top. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ALBUMS, SPREADS, type Picture } from '@/lib/notebook'
import { Diagram, Glyph } from './Ink'
import { diagramSeed } from './Pages'
import { Hand, HAND_TIP } from './Hand'
import { CardFace, DECK, cardTitle } from './Cards'

/** `album:index`, `diagram:spread` or `card:page` — what a card's `data-zoom` says. */
export type Lifted = { key: string; from: DOMRect; tilt: number }

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Rise from the card on the page: start at its place, size and tilt. */
function rise(el: HTMLElement, shade: HTMLElement, from: DOMRect, tilt: number, size = el.getBoundingClientRect()) {
  const to = el.getBoundingClientRect()
  gsap.fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.3 })
  gsap.fromTo(el, {
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    scale: from.width / size.width,
    rotation: tilt,
  }, { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.55, ease: 'power3.out' })
}

export function Lightbox({ lifted, onClose }: { lifted: Lifted; onClose: () => void }) {
  const [kind, id] = lifted.key.split(':')
  if (kind === 'card') return <CardView n={Number(id)} lifted={lifted} onClose={onClose} />
  const album = kind === 'diagram' ? null : ALBUMS[kind]
  if (album && album.length > 1) return <PileView album={album} start={Number(id)} lifted={lifted} onClose={onClose} />
  return <Single kind={kind} index={Number(id)} lifted={lifted} onClose={onClose} />
}

function useEscape(onClose: () => void, more?: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); else more?.(e) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
}

/* ── one picture, or a diagram ── */

function Single({ kind, index, lifted, onClose }: { kind: string; index: number; lifted: Lifted; onClose: () => void }) {
  const cardRef = useRef<HTMLElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const pic = kind === 'diagram' ? null : ALBUMS[kind][index]
  const main = kind === 'diagram' ? SPREADS[index].main : null

  useLayoutEffect(() => { rise(cardRef.current!, shadeRef.current!, lifted.from, lifted.tilt) }, [lifted.from, lifted.tilt])
  useEscape(onClose)

  return (
    <div className={`nb-lightbox${kind === 'resume' ? ' nb-lb-tall' : ''}`} role="dialog" aria-modal="true"
         aria-label={pic ? pic.alt : 'Diagram'} onClick={onClose}>
      <div className="nb-lb-shade" ref={shadeRef} />
      <figure className={`nb-lb-card${main ? ' nb-lb-diagram' : ''}`} ref={cardRef} onClick={e => e.stopPropagation()}>
        {pic && <img src={pic.src} alt={pic.alt} />}
        {main?.kind === 'project' && (
          <Diagram spec={main.diagram} seed={diagramSeed(index)} title={`How ${SPREADS[index].label} fits together`} />
        )}
        {pic?.caption && <figcaption>{pic.caption}</figcaption>}
      </figure>
      <button type="button" className="nb-lb-close" onClick={onClose}>put it back</button>
    </div>
  )
}

/* ── a page's playing card, turned in the light ── */

function CardView({ n, lifted, onClose }: { n: number; lifted: Lifted; onClose: () => void }) {
  const cardRef = useRef<HTMLElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const tiltRef = useRef<HTMLDivElement>(null)
  const { style, edition } = DECK[n - 1]

  useLayoutEffect(() => { rise(cardRef.current!, shadeRef.current!, lifted.from, lifted.tilt) }, [lifted.from, lifted.tilt])
  useEscape(onClose)

  /** It leans toward the pointer, and the light on its finish goes where the pointer is. */
  const turn = (e: React.PointerEvent) => {
    const el = tiltRef.current!, r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.setAttribute('data-live', '')
    el.style.setProperty('--ry', `${((px - 0.5) * 28).toFixed(1)}deg`)
    el.style.setProperty('--rx', `${((0.5 - py) * 24).toFixed(1)}deg`)
    el.style.setProperty('--mx', `${Math.round(px * 100)}%`)
    el.style.setProperty('--my', `${Math.round(py * 100)}%`)
  }
  const settle = () => {
    const el = tiltRef.current!
    el.removeAttribute('data-live')
    ;['--rx', '--ry', '--mx', '--my'].forEach(v => el.style.removeProperty(v))
  }

  return (
    <div className="nb-lightbox" role="dialog" aria-modal="true" aria-label={`Page ${n}: ${cardTitle(n)}`} onClick={onClose}>
      <div className="nb-lb-shade" ref={shadeRef} />
      <figure className="nb-lb-pcard" ref={cardRef} onClick={e => e.stopPropagation()} onPointerMove={turn} onPointerLeave={settle}>
        <div className="nb-lb-tilt" ref={tiltRef}><CardFace n={n} /></div>
        <figcaption>{cardTitle(n)} · {style} · {edition}<span>page {n} — {SPREADS[n - 1].label}</span></figcaption>
      </figure>
      <button type="button" className="nb-lb-close" onClick={onClose}>put it back</button>
    </div>
  )
}

/* ── a pile, leafed through by hand ── */

/** Where a picture lies at each depth of the pile: offset (px) and tilt (deg). */
const DEPTH = [{ x: 0, y: 0, rotation: 0 }, { x: 16, y: 12, rotation: 3.5 }, { x: -14, y: 20, rotation: -4 }, { x: 10, y: 28, rotation: 2.2 }]
const at = (d: number) => DEPTH[Math.min(d, DEPTH.length - 1)]

function PileView({ album, start, lifted, onClose }: { album: Picture[]; start: number; lifted: Lifted; onClose: () => void }) {
  const n = album.length
  const [order, setOrder] = useState(() => album.map((_, i) => (start + i) % n))
  const orderRef = useRef(order)
  const sheets = useRef<(HTMLDivElement | null)[]>([])
  const pileRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const handRef = useRef<HTMLDivElement>(null)
  const busy = useRef(false)

  useLayoutEffect(() => {
    orderRef.current.forEach((pic, d) => gsap.set(sheets.current[pic], { ...at(d), zIndex: n - d }))
    rise(pileRef.current!, shadeRef.current!, lifted.from, lifted.tilt, sheets.current[orderRef.current[0]]!.getBoundingClientRect())
    // only on lifting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Pin the fingertip to a point on screen; the hand reaches in from the right. */
  function placeHand(x: number, y: number, rotation: number) {
    const width = Math.min(170, Math.max(110, innerWidth * 0.11)), k = width / HAND_TIP.w
    gsap.set(handRef.current, {
      width, x: x - HAND_TIP.x * k, y: y - HAND_TIP.y * k,
      rotation, transformOrigin: `${HAND_TIP.x * k}px ${HAND_TIP.y * k}px`,
    })
  }
  /** Near its lower-right corner — where a hand coming up from below takes hold. */
  const grip = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return { x: r.right - r.width * 0.1, y: r.bottom - r.height * 0.16 }
  }

  /** 1: the top picture goes to the bottom. -1: the bottom one comes to the top. */
  async function leaf(dir: 1 | -1) {
    if (busy.current) return
    busy.current = true
    const was = orderRef.current
    const moving = dir === 1 ? was[0] : was[n - 1]
    const next = dir === 1 ? [...was.slice(1), moving] : [moving, ...was.slice(0, -1)]
    const el = sheets.current[moving]!
    const hand = handRef.current!
    const restack = () => {
      orderRef.current = next
      setOrder(next)
      next.forEach((pic, d) => {
        gsap.set(sheets.current[pic], { zIndex: n - d })
        if (pic !== moving) gsap.to(sheets.current[pic], { ...at(d), duration: 0.4, ease: 'power2.out' })
      })
    }

    if (reduced()) {
      restack()
      gsap.to(el, { ...at(next.indexOf(moving)), duration: 0.2 })
      busy.current = false
      return
    }

    // reach in from the right and take hold of the picture's edge
    const g0 = grip(el)
    const reach = { x: innerWidth + 60, y: innerHeight + 140, rot: -55, o: 0 }
    await gsap.to(reach, {
      x: g0.x, y: g0.y, rot: -36, o: 1, duration: 0.4, ease: 'power2.out',
      onUpdate: () => { hand.style.opacity = String(reach.o); placeHand(reach.x, reach.y, reach.rot) },
    })

    // slide it out to the side, lifting a little as it comes
    const out = el.getBoundingClientRect().width * 0.72
    const base = at(was.indexOf(moving))
    const pull = { t: 0 }
    await gsap.to(pull, {
      t: 1, duration: 0.46, ease: 'power2.inOut',
      onUpdate: () => {
        gsap.set(el, { x: base.x + out * pull.t, y: base.y - 22 * Math.sin(Math.PI * pull.t * 0.9), rotation: base.rotation + 9 * pull.t })
        const g = grip(el)
        placeHand(g.x, g.y, -36 + 10 * pull.t)
      },
    })

    // it changes places in the pile, then goes back in — under the rest, or on top
    restack()
    const lifted = { x: gsap.getProperty(el, 'x') as number, y: gsap.getProperty(el, 'y') as number, r: gsap.getProperty(el, 'rotation') as number }
    const home = at(next.indexOf(moving))
    const tuck = { t: 0 }
    const handFrom = grip(el)
    await gsap.to(tuck, {
      t: 1, duration: 0.5, ease: 'power2.inOut',
      onUpdate: () => {
        gsap.set(el, {
          x: lifted.x + (home.x - lifted.x) * tuck.t,
          y: lifted.y + (home.y - lifted.y) * tuck.t,
          rotation: lifted.r + (home.rotation - lifted.r) * tuck.t,
        })
        // the hand pushes it most of the way, then lets go
        const g = tuck.t < 0.65 ? grip(el) : { x: handFrom.x + (grip(el).x - handFrom.x) * 0.65, y: handFrom.y }
        placeHand(g.x, g.y, -26)
      },
    })

    // and leaves
    const g1 = grip(el)
    const away = { x: g1.x, y: g1.y, o: 1 }
    await gsap.to(away, {
      x: g1.x + 120, y: innerHeight + 160, o: 0, duration: 0.42, ease: 'power2.in',
      onUpdate: () => { hand.style.opacity = String(away.o); placeHand(away.x, away.y, -20) },
    })
    busy.current = false
  }

  useEscape(onClose, e => { if (e.key === 'ArrowRight') leaf(1); if (e.key === 'ArrowLeft') leaf(-1) })

  const top = album[order[0]]
  return (
    <div className="nb-lightbox nb-lb-piled" role="dialog" aria-modal="true" aria-label={top.alt} onClick={onClose}>
      <div className="nb-lb-shade" ref={shadeRef} />
      <div className="nb-lb-pile" ref={pileRef} onClick={e => { e.stopPropagation(); leaf(1) }}>
        {album.map((pic, i) => (
          <div key={pic.src} className="nb-lb-sheet" ref={el => { sheets.current[i] = el }}>
            <img src={pic.src} alt={i === order[0] ? pic.alt : ''} />
          </div>
        ))}
      </div>
      <p className="nb-lb-caption" onClick={e => e.stopPropagation()}>
        {top.caption}<span className="nb-lb-count">{order[0] + 1} / {n}</span>
      </p>
      <button type="button" className="nb-lb-step nb-lb-prev" aria-label="Previous picture"
              onClick={e => { e.stopPropagation(); leaf(-1) }}><Glyph ch="→" /></button>
      <button type="button" className="nb-lb-step nb-lb-next" aria-label="Next picture"
              onClick={e => { e.stopPropagation(); leaf(1) }}><Glyph ch="→" /></button>
      <button type="button" className="nb-lb-close" onClick={onClose}>put them back</button>
      <Hand ref={handRef} />
    </div>
  )
}
