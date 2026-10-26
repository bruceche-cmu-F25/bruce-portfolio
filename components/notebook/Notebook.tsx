'use client'
/** The notebook.
 *
 *  React renders every page once into a hidden source tree (static HTML, so the
 *  content is there for crawlers and no-JS readers). page-flip then gets clones
 *  of those nodes inside a host element React doesn't own: the library moves its
 *  pages around and deletes its whole block on destroy, which would corrupt any
 *  tree React still thinks it manages — and StrictMode mounts this twice.
 *
 *  Both layouts hold the same pages in the same order — cover, then a note and
 *  the page it's about for every spread, then the back cover:
 *  - spread: a real two-page spread. The whole closed book lies on the desk; once
 *    the cover is turned the camera moves in until the right page reaches the
 *    window's edges and only the spine side of the left page is left in view.
 *    Turning back to either cover pulls out to the closed book again.
 *  - pages: phones and portrait screens. One page at a time, as big as the
 *    screen, scrolling when its writing runs longer; each spread's note rides
 *    at the foot of its page, and only the contents keep a page of their own. */

import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import type { PageFlip as PageFlipT, Point } from 'page-flip'
import { SPREADS } from '@/lib/notebook'
import { Pages } from './Pages'
import { Hand, HAND_TIP } from './Hand'
import { Lightbox, type Lifted } from './Lightbox'
import { DeskProps } from './Desk'
import { CardDefs, cardTitle } from './Cards'

/** Where a visitor's collected cards are kept, in their own browser. */
const DECK_KEY = 'bruceche-notebook-deck'

/** What a phone's page leaves of the screen: a margin above, the page-turn buttons below. */
const PHONE_CHROME = 64

type Layout = 'spread' | 'pages'
const layoutFor = (): Layout => (innerWidth < 720 || innerWidth / innerHeight < 0.9 ? 'pages' : 'spread')

/** page-flip's own listeners — silenced while the hand is doing the turning. */
const POINTER_EVENTS = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend'] as const

/** Everything stuck in the notebook can be moved around it; the writing can't. */
const LOOSE = '.nb-pile, .nb-card, .nb-pcard, .nb-sticker, .nb-logo, .nb-seal, .nb-doodle, .nb-prop'

/** How long the closed book waits before the hand opens it: long enough to
 *  take in the cover, short enough that nobody is kept waiting. */
const INTRO_DELAY = 1200

export default function Notebook() {
  const rootRef   = useRef<HTMLElement>(null)
  const worldRef  = useRef<HTMLDivElement>(null)
  const sourceRef = useRef<HTMLDivElement>(null)
  const mountRef  = useRef<HTMLDivElement>(null)
  const handRef   = useRef<HTMLDivElement>(null)
  /** the picture lifted off the page, if any */
  const [lifted, setLifted] = useState<Lifted | null>(null)
  const liftedRef = useRef(lifted)
  liftedRef.current = lifted
  const pages = useMemo(() => <Pages />, [])

  useEffect(() => {
    const root = rootRef.current!, world = worldRef.current!, source = sourceRef.current!
    const mount = mountRef.current!, hand = handRef.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    let book: PageFlipT | null = null
    let host: HTMLDivElement | null = null
    let layout = layoutFor()
    let busy = false
    let disposed = false
    let introTimer = 0
    let resizeTimer = 0

    const N = SPREADS.length
    /** A spread's page: its right-hand page in a spread, its only page on a phone. The front cover is page 0. */
    const pageOf = (spread: number) => (layout === 'spread' ? 2 * spread + 2 : spread + 2)
    /** The spread a page belongs to (a phone's contents page belongs to About). */
    const spreadAt = (index: number) => (layout === 'spread' ? Math.floor((index - 1) / 2) : Math.max(0, index - 2))
    /** The back cover's page. */
    const backCover = () => (layout === 'spread' ? 2 * N + 1 : N + 2)
    const last = () => (book ? book.getPageCount() - 1 : 0)
    const shutAt = (index: number) => index === 0 || index === last()
    const block = () => host?.querySelector<HTMLElement>('.stf__block') ?? null
    /** how much the camera has shrunk the book right now (1 when it's in close) */
    const shrink = (el: HTMLElement) => el.getBoundingClientRect().width / el.offsetWidth || 1

    /* ── the camera ── */

    /** Open: in close, as laid out by CSS. Shut: back far enough to see the
     *  whole closed book — the front cover lies right of the spine, the back left. */
    function viewFor(index: number) {
      if (layout !== 'spread' || !book || !shutAt(index)) return { scale: 1, x: 0, y: 0 }
      const W = innerWidth, H = innerHeight
      const R = book.getBoundsRect().pageWidth
      const spine = W - R                          // where the CSS puts it, in the world
      const centre = index === 0 ? spine + R / 2 : spine - R / 2
      const scale = Math.min(0.74, (W * 0.8) / R)
      return { scale, x: W / 2 - scale * centre, y: H / 2 - (scale * H) / 2 }
    }

    function frame(index: number, duration = reduced ? 0.3 : 1.15) {
      const view = viewFor(index)
      root.toggleAttribute('data-cover', shutAt(index))
      root.toggleAttribute('data-shut', layout === 'spread' && shutAt(index))
      if (layout === 'spread' && shutAt(index) && book) {
        // where the closed book lies on the desk, for the things around it
        const R = book.getBoundsRect().pageWidth, spine = innerWidth - R
        const left = index === 0 ? spine : spine - R
        root.style.setProperty('--cover-l', `${view.x + view.scale * left}px`)
        root.style.setProperty('--cover-r', `${view.x + view.scale * (left + R)}px`)
        root.style.setProperty('--cover-t', `${view.y}px`)
        root.style.setProperty('--cover-b', `${view.y + view.scale * innerHeight}px`)
      }
      gsap.to(world, { ...view, duration, ease: 'power3.inOut', overwrite: true })
    }

    /** "5 / 13" between the page-turn buttons; nothing on a cover. */
    const count = () => root.querySelector<HTMLElement>('.nb-nav-count')!
    function onPage(index: number) {
      frame(index)
      const slug = shutAt(index) ? undefined : SPREADS[spreadAt(index)].slug
      history.replaceState(null, '', slug ? `#${slug}` : location.pathname + location.search)
      count().textContent = shutAt(index) ? '' : `${spreadAt(index) + 1} / ${N}`
      if (!shutAt(index)) collect(spreadAt(index) + 1)
    }

    /* ── the deck: every page read is a card collected ── */

    const collected = new Set<number>()
    try {
      for (const n of JSON.parse(localStorage.getItem(DECK_KEY) ?? '[]')) if (n >= 1 && n <= N) collected.add(n)
    } catch { /* private window, or storage off: the deck starts empty and isn't remembered */ }
    /** a page's card, as drawn in the source tree */
    const faceOf = (n: number) => source.querySelector<HTMLElement>(`.nb-page[data-slug="${SPREADS[n - 1].slug}"] .nb-pcard-face`)!

    /** Turn the deck's backs over for the cards collected so far, and count them. */
    function paintDeck() {
      if (!host) return
      host.querySelectorAll<HTMLElement>('.nb-deck-slot').forEach(slot => {
        const n = Number(slot.dataset.card)
        if (!collected.has(n) || slot.hasAttribute('data-have')) return
        const lift = document.createElement('button')
        Object.assign(lift, { type: 'button', className: 'nb-lift' })
        lift.dataset.zoom = `card:${n}`
        lift.setAttribute('aria-label', `Look at the ${cardTitle(n)}, collected on page ${n}`)
        slot.replaceChildren(faceOf(n).cloneNode(true), lift)
        slot.setAttribute('data-have', '')
      })
      const full = collected.size === N
      host.querySelectorAll('.nb-deck-n').forEach(e => { e.textContent = String(collected.size) })
      host.querySelectorAll('.nb-deck').forEach(e => e.toggleAttribute('data-full', full))
      host.querySelectorAll('.nb-deck-hint').forEach(e => { e.textContent = full ? 'a full deck — thanks for reading every page' : 'every page has a card — read them all' })
      host.querySelectorAll<HTMLElement>('.nb-deck-replay').forEach(e => { e.hidden = !full })
    }

    let toastTimer = 0
    function toast(text: string) {
      const el = root.querySelector<HTMLElement>('.nb-toast')!
      el.textContent = text
      el.setAttribute('data-on', '')
      clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => el.removeAttribute('data-on'), 2200)
    }

    /** A page has been opened: its card is collected, if it wasn't already. */
    function collect(n: number) {
      if (collected.has(n) || root.hasAttribute('data-still')) return
      collected.add(n)
      try { localStorage.setItem(DECK_KEY, JSON.stringify([...collected])) } catch { /* not remembered, then */ }
      paintDeck()
      const card = host?.querySelector<HTMLElement>(`.nb-page[data-slug="${SPREADS[n - 1].slug}"] .nb-pcard`)
      if (card) {
        card.setAttribute('data-new', '')
        setTimeout(() => card.removeAttribute('data-new'), 1200)
      }
      if (collected.size < N) toast(`+1 card · ${cardTitle(n)} · ${collected.size} / ${N}`)
      else {
        toast(`a full deck — all ${N} cards`)
        setTimeout(() => cascade(card?.getBoundingClientRect()), 700)
      }
    }

    /** A page's card as a picture, for the cascade: its drawing, with the filters
     *  and patterns it uses written into it — or its painting, rank tabs on top. */
    async function cardPicture(n: number, w: number, h: number) {
      const face = faceOf(n), dpr = Math.min(2, devicePixelRatio || 1)
      const raster = async (svg: SVGSVGElement) => {
        const copy = svg.cloneNode(true) as SVGSVGElement
        copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
        copy.setAttribute('width', '250')
        copy.setAttribute('height', '350')
        copy.insertBefore(document.querySelector('.nb-defs defs')!.cloneNode(true), copy.firstChild)
        const img = new Image()
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy))
        await img.decode()
        return img
      }
      const art = face.querySelector('img') ?? await raster(face.querySelector<SVGSVGElement>('svg.nb-pcard-art')!)
      if (art instanceof HTMLImageElement && !art.complete) await art.decode()
      const tabs = face.querySelector<SVGSVGElement>('svg.nb-pcard-index')
      const pic = document.createElement('canvas')
      pic.width = w * dpr
      pic.height = h * dpr
      const g = pic.getContext('2d')!
      g.scale(dpr, dpr)
      g.beginPath()
      g.roundRect(0, 0, w, h, w * 0.07)
      g.clip()
      g.fillStyle = '#fff'
      g.fillRect(0, 0, w, h)
      g.drawImage(art, 0, 0, w, h)
      if (tabs) g.drawImage(await raster(tabs), 0, 0, w, h)
      g.lineWidth = 1
      g.strokeStyle = 'rgba(0, 0, 0, 0.35)'
      g.stroke()
      return pic
    }

    /** The full deck's reward, after Windows Solitaire: the cards leave the deck
     *  one by one and bounce off the bottom of the screen, leaving trails. A
     *  click or a key ends it early. */
    let cascading = false
    async function cascade(from?: DOMRect) {
      if (cascading || reduced) return
      cascading = true
      const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1)
      const w = Math.round(Math.min(96, Math.max(60, W * 0.11))), h = Math.round(w * 1.4)
      const pictures = await Promise.all(SPREADS.map((_, i) => cardPicture(i + 1, w, h)))
      const canvas = document.createElement('canvas')
      canvas.className = 'nb-cascade'
      canvas.width = W * dpr
      canvas.height = H * dpr
      const g = canvas.getContext('2d')!
      g.scale(dpr, dpr)
      root.appendChild(canvas)
      const x0 = from ? from.left + from.width / 2 - w / 2 : W / 2 - w / 2
      const y0 = from ? Math.min(from.top, H - h * 1.5) : H * 0.3
      let next = 0, last = performance.now(), launched = 0, stopped = false
      const live: { pic: HTMLCanvasElement; x: number; y: number; vx: number; vy: number }[] = []
      const end = () => {
        if (stopped) return
        stopped = true
        canvas.style.opacity = '0'
        setTimeout(() => { canvas.remove(); cascading = false }, 1000)
        window.removeEventListener('keydown', end)
      }
      canvas.addEventListener('pointerdown', end)
      window.addEventListener('keydown', end)
      const tick = (now: number) => {
        if (stopped) return
        const dt = Math.min(2.5, (now - last) / 16.7)
        last = now
        if (launched < pictures.length && now >= next) {
          const left = (launched + Math.floor(launched / 3)) % 2 === 0
          live.push({ pic: pictures[launched], x: x0, y: y0, vx: (left ? -1 : 1) * (2.5 + Math.random() * 4), vy: -4 - Math.random() * 6 })
          launched++
          next = now + 320
        }
        for (const c of live) {
          c.vy += 0.55 * dt
          c.x += c.vx * dt
          c.y += c.vy * dt
          if (c.y + h > H) { c.y = H - h; c.vy = -c.vy * 0.8 }
          g.drawImage(c.pic, c.x, c.y, w, h)
        }
        for (let i = live.length - 1; i >= 0; i--) if (live[i].x < -w || live[i].x > W) live.splice(i, 1)
        if (launched === pictures.length && live.length === 0) { setTimeout(end, 1400); return }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    async function build(startPage: number) {
      root.dataset.layout = layout
      gsap.set(world, { transformOrigin: '0 0', scale: 1, x: 0, y: 0 })
      const { PageFlip } = await import('page-flip')
      await document.fonts.ready
      if (disposed) return

      host = document.createElement('div')
      host.className = 'nb-book'
      mount.appendChild(host)
      // a phone keeps the contents as a page of its own; every other note rides on its page
      const kept = Array.from(source.querySelectorAll<HTMLElement>(':scope > .nb-page'))
        .filter((p, i) => layout === 'spread' || p.dataset.kind !== 'note' || i === 1)
      const items = kept.map(n => n.cloneNode(true) as HTMLElement)
      items.forEach(p => host!.appendChild(p))

      // spread: each page is half the stage, as tall as the window; phone: the whole screen
      const width = mount.getBoundingClientRect().width
      const shape = layout === 'spread'
        ? { width: Math.round(width / 2), height: Math.round(innerHeight) }
        : { width: Math.round(width), height: Math.round(innerHeight - PHONE_CHROME) }

      book = new PageFlip(host, {
        ...shape,
        size: 'stretch',
        // pages: one page wide. page-flip only goes single-page below
        // 2 × minWidth, so make that threshold unreachable there.
        minWidth: layout === 'pages' ? 4000 : 100, maxWidth: 4000,
        minHeight: 100, maxHeight: 4000,
        usePortrait: layout === 'pages',
        showCover: true,
        startPage,
        flippingTime: reduced ? 300 : 950,
        maxShadowOpacity: 0.4,
        // a phone's page scrolls (see onTouchMove for how a finger is shared)
        mobileScrollSupport: layout === 'pages',
        showPageCorners: true,
      })
      let state = 'read'
      book.on<number>('flip', e => onPage(e.data))
      book.on<string>('changeState', e => { state = e.data })
      book.loadFromHTML(items)
      // page-flip reads the pointer against the block's on-screen box, which
      // the camera shrinks; map it back into the book's own coordinates.
      // (The UI only exists once pages are loaded.)
      Object.assign(book.getUI(), {
        getMousePos: (x: number, y: number): Point => {
          const el = block()!, r = el.getBoundingClientRect(), k = shrink(el)
          // page-flip lifts a corner, and turns the page on a click, anywhere
          // near it — so over the card in the corner, or anything else stuck
          // there, a book at rest is told the pointer is in the middle instead
          if (layout === 'spread' && (state === 'read' || state === 'fold_corner') && document.elementFromPoint(x, y)?.closest(`${LOOSE}, .nb-on-cover`)) {
            return { x: r.width / k / 2, y: r.height / k / 2 }
          }
          return { x: (x - r.left) / k, y: (y - r.top) / k }
        },
      })
      paintDeck()
      onPage(book.getCurrentPageIndex())
      frame(book.getCurrentPageIndex(), 0)
    }

    function teardown() {
      book?.destroy()
      host?.remove()
      book = null
      host = null
    }

    /* ── the hand ── */

    const swallow = (e: Event) => { e.stopImmediatePropagation(); if (e.type !== 'mousemove' && e.cancelable) e.preventDefault() }
    const silence = (on: boolean) => POINTER_EVENTS.forEach(t =>
      on ? window.addEventListener(t, swallow, { capture: true, passive: false })
         : window.removeEventListener(t, swallow, { capture: true }))

    /** Pin the fingertip to a point given in the book's own coordinates. */
    function placeHand(p: Point, rotation: number) {
      const el = block()!, r = el.getBoundingClientRect(), k = shrink(el)
      placeHandOnScreen({ x: r.left + p.x * k, y: r.top + p.y * k }, rotation)
    }
    function placeHandOnScreen(p: Point, rotation: number) {
      const el = block()
      const page = (book?.getBoundsRect().pageWidth ?? 500) * (el ? shrink(el) : 1)
      const width = Math.min(200, Math.max(76, page * 0.3))
      const k = width / HAND_TIP.w
      gsap.set(hand, {
        width, x: p.x - HAND_TIP.x * k, y: p.y - HAND_TIP.y * k,
        rotation, transformOrigin: `${HAND_TIP.x * k}px ${HAND_TIP.y * k}px`,
      })
    }

    /** Reach in from the lower right, take the corner, turn the page, leave. */
    async function handTurn() {
      if (!book || busy) return
      busy = true
      const r = book.getBoundsRect()
      const spine = r.left + r.pageWidth
      // where the hand lets go, just past the spine: onto the visible part of
      // the left page, or — a closed book's cover swings the rest of the way itself
      const visibleLeft = innerWidth - r.pageWidth
      const reach = layout === 'pages' ? r.pageWidth * 0.75
        : root.hasAttribute('data-shut') ? r.pageWidth * 0.35 : visibleLeft * 0.75
      const corner = { x: spine + r.pageWidth - 3, y: r.top + r.height - 3 }
      const lift   = { x: spine + r.pageWidth * 0.08, y: r.top + r.height * 0.5 }
      const land   = { x: spine - reach, y: r.top + r.height - 2 }
      const along = (t: number) => ({
        x: (1 - t) ** 2 * corner.x + 2 * (1 - t) * t * lift.x + t ** 2 * land.x,
        y: (1 - t) ** 2 * corner.y + 2 * (1 - t) * t * lift.y + t ** 2 * land.y,
      })

      // reach in
      const el = block()!, b = el.getBoundingClientRect(), k = shrink(el)
      const at = { x: innerWidth + 60, y: innerHeight + 120, rot: -52, o: 0 }
      await gsap.to(at, {
        x: b.left + corner.x * k, y: b.top + corner.y * k, rot: -36, o: 1,
        duration: k < 1 ? 0.75 : 0.35, ease: 'power2.out',
        onUpdate: () => { hand.style.opacity = String(at.o); placeHandOnScreen(at, at.rot) },
      })
      if (disposed || !book) return

      // turn
      silence(true)
      book.startUserTouch(corner)
      const turn = { t: 0 }
      await gsap.to(turn, {
        t: 1, duration: reduced ? 0.4 : 1.25, ease: 'power1.inOut',
        onUpdate: () => {
          const p = along(turn.t)
          book?.userMove(p, true)
          placeHand(p, -36 + 26 * turn.t)
        },
      })
      book?.userStop(land)
      silence(false)

      // leave
      const end = block()!, e = end.getBoundingClientRect(), ke = shrink(end)
      const away = { x: e.left + land.x * ke, y: e.top + land.y * ke, rot: -10, o: 1 }
      await gsap.to(away, {
        x: away.x - 40, y: innerHeight + 160, rot: 8, o: 0, duration: 0.7, ease: 'power2.in', delay: 0.15,
        onUpdate: () => { hand.style.opacity = String(away.o); placeHandOnScreen(away, away.rot) },
      })
      busy = false
    }

    /** Open a spread. Forward, the hand turns the last page; back, the book does. */
    async function goTo(spread: number) {
      if (!book || busy) return
      const page = pageOf(spread), current = book.getCurrentPageIndex()
      // page-flip reports a spread by its left page; one page at a time, by the page
      const there = layout === 'spread' ? page - 1 : page
      if (current === there) return
      if (page < current || reduced) { book.flip(page, 'bottom'); return }
      // jump to the page before, unseen, so the hand only has one page to turn
      const lastShown = layout === 'spread' && current > 0 ? current + 1 : current
      if (page - (layout === 'spread' ? 2 : 1) > lastShown) book.turnToPage(page - (layout === 'spread' ? 2 : 1))
      await handTurn()
    }

    /** Back to the start: the closed book is turned over, front up, and the hand comes again. */
    async function restart() {
      if (!book || busy) return
      busy = true
      cancelIntro()
      if (reduced) {
        book.turnToPage(0)
        onPage(0)
        busy = false
        return
      }
      // the cover in view, as a point in the mount — what the book turns about
      const axis = (front: boolean) => {
        const el = block()!, k = shrink(el), b = el.getBoundingClientRect(), m = mount.getBoundingClientRect()
        const r = book!.getBoundsRect()
        const x = r.left + r.pageWidth * (layout === 'spread' && front ? 1.5 : 0.5)
        return `${(b.left - m.left) / k + x}px ${(b.top - m.top) / k + r.top + r.height / 2}px`
      }
      gsap.set(mount, { transformPerspective: 2200, transformOrigin: axis(false) })
      await gsap.to(mount, { rotationY: 90, duration: 0.4, ease: 'power2.in' })
      if (disposed || !book) return
      // edge on, nobody sees the swap: open at the front, the camera on the front cover
      book.turnToPage(0)
      frame(0, 0)
      history.replaceState(null, '', location.pathname + location.search)
      gsap.set(mount, { rotationY: -90, transformOrigin: axis(true) })
      await gsap.to(mount, { rotationY: 0, duration: 0.55, ease: 'power2.out' })
      gsap.set(mount, { clearProps: 'transform' })
      busy = false
      introTimer = window.setTimeout(handTurn, INTRO_DELAY)
    }

    /* ── moving things around the page ── */

    // Caught on the way down (capture), so page-flip never sees the press and
    // doesn't start folding the page under it. A press that moves becomes a
    // drag; one that doesn't is still a click — on a link, a sticker, a card.
    let drag: { el: HTMLElement; x0: number; y0: number; dx: number; dy: number; k: number; moved: boolean; lastX: number; lean: number } | null = null
    let swallowClick = false
    /** whatever was picked up last lies on top */
    let topmost = 10
    const point = (e: MouseEvent | TouchEvent) => ('touches' in e ? e.touches[0] ?? e.changedTouches[0] : e)
    const onPress = (e: MouseEvent | TouchEvent) => {
      // after a tap, a phone also sends the mouse events a click is made of, and
      // page-flip turns the page on those — but a tap on a phone's page is for reading
      if (!('touches' in e) && layout === 'pages' && Date.now() - lastTouch < 800) {
        e.stopPropagation()
        return
      }
      swallowClick = false
      const t = e.target as Element
      // a whole pile, or a whole sticker on the cover, rather than the bit under the pointer
      const el = t.closest<HTMLElement>('.nb-pile') ?? t.closest<HTMLElement>('.nb-on-cover') ?? t.closest<HTMLElement>(LOOSE)
      const inBook = !!el && !!host?.contains(el)
      if (!el || busy || !(inBook || el.closest('.nb-props'))) return
      // on a phone a finger on a picture is scrolling the page or swiping it, not picking the picture up
      if ('touches' in e && layout === 'pages') return
      e.stopPropagation()
      // stickers and logos are links, pictures are images: both would start the
      // browser's own drag (a ghost image) and stop sending us mouse moves
      if (!('touches' in e)) e.preventDefault()
      cancelIntro()
      const [dx = 0, dy = 0] = (el.style.translate || '').split(' ').map(parseFloat)
      const p = point(e)
      // the book may be shrunk by the camera; the desk isn't
      drag = { el, x0: p.clientX, y0: p.clientY, dx: dx || 0, dy: dy || 0, k: inBook ? shrink(block()!) : 1, moved: false, lastX: p.clientX, lean: 0 }
    }
    const onDrag = (e: MouseEvent | TouchEvent) => {
      if (!drag) return
      e.stopImmediatePropagation()   // page-flip folds a corner the mouse passes over
      const p = point(e)
      const x = (p.clientX - drag.x0) / drag.k, y = (p.clientY - drag.y0) / drag.k
      if (!drag.moved && Math.hypot(x, y) < 4) return
      if (e.cancelable) e.preventDefault()
      if (!drag.moved) drag.el.style.zIndex = String(++topmost)
      drag.moved = true
      drag.el.classList.add('nb-dragging')
      drag.el.style.translate = `${drag.dx + x}px ${drag.dy + y}px`
      // it leans the way it's being pulled, like paper held by one corner
      drag.lean = Math.max(-14, Math.min(14, drag.lean * 0.7 + (p.clientX - drag.lastX) * 0.9))
      drag.lastX = p.clientX
      drag.el.style.setProperty('--lean', `${drag.lean}deg`)
    }
    const onDrop = () => {
      if (!drag) return
      if (drag.moved) {
        drag.el.classList.remove('nb-dragging')
        drag.el.style.removeProperty('--lean')
        swallowClick = true
        setTimeout(() => { swallowClick = false })
      }
      drag = null
    }
    const onClickAfterDrag = (e: MouseEvent) => {
      if (!swallowClick) return
      e.preventDefault()
      e.stopPropagation()
      swallowClick = false
    }

    /** On a phone a page scrolls, and a finger is shared between the browser and
     *  page-flip by the way it first moves:
     *  - mostly up or down, it's scrolling: page-flip — which would start folding
     *    the page once the finger strays 10px sideways — is told the touch never happened;
     *  - mostly sideways, it's turning the page. The browser hands those moves over
     *    as uncancelable, which page-flip ignores, so they're passed to it here;
     *  - not at all, it was a tap or a press for reading, and page-flip, which would
     *    turn the page under a long press, is told the touch never happened. */
    let touch: { x: number; y: number; scroll: boolean | null } | null = null
    /** when a finger last touched the screen — the mouse events that follow a tap aren't a click to turn */
    let lastTouch = 0
    const forgetTouch = () => {
      if (!book) return
      Object.assign(book.getUI(), { touchPoint: null })
      Object.assign(book, { isUserTouch: false })
    }
    const onTouchStart = (e: TouchEvent) => {
      lastTouch = Date.now()
      const t = e.touches[0]
      touch = layout === 'pages' && t && e.touches.length === 1 ? { x: t.clientX, y: t.clientY, scroll: null } : null
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!touch || !t || !book) return
      if (touch.scroll === null) {
        const dx = Math.abs(t.clientX - touch.x), dy = Math.abs(t.clientY - touch.y)
        if (Math.max(dx, dy) < 8) return
        touch.scroll = dy > dx
        if (touch.scroll) forgetTouch()
      }
      e.stopImmediatePropagation()
      if (touch.scroll) return
      const ui = book.getUI() as { getMousePos: (x: number, y: number) => Point }
      book.userMove(ui.getMousePos(t.clientX, t.clientY), true)
    }
    const onTouchEnd = () => {
      lastTouch = Date.now()
      if (touch?.scroll === null) forgetTouch()
      touch = null
    }

    /** The light on a card's finish follows the pointer while it's over the card. */
    let lit: HTMLElement | null = null
    const onHover = (e: PointerEvent) => {
      const face = (e.target as Element).closest?.('.nb-pcard')?.querySelector<HTMLElement>('.nb-pcard-face') ?? null
      if (lit && lit !== face) {
        lit.removeAttribute('data-live')
        lit.style.removeProperty('--mx')
        lit.style.removeProperty('--my')
      }
      lit = face
      if (!face) return
      const r = face.getBoundingClientRect()
      face.setAttribute('data-live', '')
      face.style.setProperty('--mx', `${Math.round(((e.clientX - r.left) / r.width) * 100)}%`)
      face.style.setProperty('--my', `${Math.round(((e.clientY - r.top) / r.height) * 100)}%`)
    }

    /* ── wiring ── */

    const cancelIntro = () => clearTimeout(introTimer)
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element
      const lift = target.closest<HTMLElement>('[data-zoom]')
      if (lift) {
        cancelIntro()
        const card = lift.parentElement!
        const tilt = parseFloat(getComputedStyle(card).getPropertyValue('--tilt')) || 0
        setLifted({ key: lift.dataset.zoom!, from: card.getBoundingClientRect(), tilt })
        lift.blur()
        return
      }
      const replay = target.closest<HTMLElement>('[data-cascade]')
      if (replay) {
        cascade(replay.getBoundingClientRect())
        return
      }
      if (target.closest('[data-restart]')) {
        e.preventDefault()
        restart()
        return
      }
      // a phone's cover opens at a tap anywhere on it (page-flip only turns it from a corner there)
      if (layout === 'pages' && book?.getCurrentPageIndex() === 0 && target.closest('.nb-cover-front')) {
        cancelIntro()
        handTurn()
        return
      }
      const link = target.closest<HTMLElement>('[data-goto]')
      if (!link) return
      e.preventDefault()
      cancelIntro()
      goTo(Number(link.dataset.goto))
    }
    const onKey = (e: KeyboardEvent) => {
      if (!book || busy || liftedRef.current) return
      if (e.key === 'ArrowRight') { cancelIntro(); book.flipNext('bottom') }
      if (e.key === 'ArrowLeft')  { cancelIntro(); book.flipPrev('bottom') }
    }
    /** A scroll, from a wheel or a trackpad, turns one page per gesture: once a
     *  page has turned, the wheel has to go quiet before it can turn another —
     *  a trackpad's momentum would otherwise leaf through half the book. */
    let wheelSum = 0, wheelHeld = false, wheelQuiet = 0
    const onWheel = (e: WheelEvent) => {
      if (!book || liftedRef.current) return
      clearTimeout(wheelQuiet)
      wheelQuiet = window.setTimeout(() => { wheelSum = 0; wheelHeld = false }, 220)
      if (wheelHeld || busy) return
      wheelSum += Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(wheelSum) < 40) return
      cancelIntro()
      if (wheelSum > 0) book.flipNext('bottom'); else book.flipPrev('bottom')
      wheelSum = 0
      wheelHeld = true
    }
    const onNav = (e: Event) => {
      const dir = (e.target as Element).closest<HTMLElement>('[data-dir]')?.dataset.dir
      if (!book || busy || !dir) return
      cancelIntro()
      if (dir === 'next') book.flipNext('bottom'); else book.flipPrev('bottom')
    }
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(function relayout() {
        if (!book) return
        // mid-turn: lay it out again once the hand has let go
        if (busy) { resizeTimer = window.setTimeout(relayout, 250); return }
        // every page is cut to the window, so any resize re-cuts them — on the same
        // spread, though a phone and a spread number their pages differently
        const at = book.getCurrentPageIndex()
        const spread = spreadAt(at), front = at === 0, back = at === last()
        teardown()
        layout = layoutFor()
        build(front ? 0 : back ? backCover() : pageOf(spread))
      }, 160)
    }

    const fromHash = SPREADS.findIndex(s => s.slug === location.hash.slice(1))
    // reduced motion skips the hand opening the cover: start on the first spread
    const startPage = fromHash >= 0 ? pageOf(fromHash) : reduced ? 1 : 0

    // ?still keeps the book shut — the hand never comes. The share preview is shot this way.
    const still = new URLSearchParams(location.search).has('still')
    root.toggleAttribute('data-still', still)

    build(startPage).then(() => {
      if (disposed || startPage !== 0 || still) return
      introTimer = window.setTimeout(handTurn, INTRO_DELAY)
    })
    const nav = root.querySelector('.nb-nav')!
    root.addEventListener('click', onClick)
    mount.addEventListener('pointerdown', cancelIntro)
    nav.addEventListener('click', onNav)
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('resize', onResize)
    root.addEventListener('mousedown', onPress, true)
    root.addEventListener('touchstart', onPress, { capture: true, passive: true })
    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true })
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true })
    window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true })
    window.addEventListener('mousemove', onDrag, true)
    window.addEventListener('touchmove', onDrag, { capture: true, passive: false })
    window.addEventListener('mouseup', onDrop, true)
    window.addEventListener('touchend', onDrop, true)
    root.addEventListener('click', onClickAfterDrag, true)
    root.addEventListener('pointermove', onHover, { passive: true })

    return () => {
      disposed = true
      clearTimeout(introTimer)
      clearTimeout(resizeTimer)
      clearTimeout(toastTimer)
      silence(false)
      gsap.killTweensOf(world)
      root.removeEventListener('click', onClick)
      mount.removeEventListener('pointerdown', cancelIntro)
      nav.removeEventListener('click', onNav)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', onWheel)
      clearTimeout(wheelQuiet)
      window.removeEventListener('resize', onResize)
      root.removeEventListener('mousedown', onPress, true)
      root.removeEventListener('touchstart', onPress, true)
      window.removeEventListener('touchstart', onTouchStart, true)
      window.removeEventListener('touchmove', onTouchMove, true)
      window.removeEventListener('touchend', onTouchEnd, true)
      window.removeEventListener('mousemove', onDrag, true)
      window.removeEventListener('touchmove', onDrag, true)
      window.removeEventListener('mouseup', onDrop, true)
      window.removeEventListener('touchend', onDrop, true)
      root.removeEventListener('click', onClickAfterDrag, true)
      root.removeEventListener('pointermove', onHover)
      gsap.killTweensOf(mount)
      teardown()
    }
  }, [])

  return (
    <main className="nb" ref={rootRef}>
      <h1 className="nb-sr">Bruce Cheng — software engineer. A notebook portfolio.</h1>
      <CardDefs />
      <DeskProps />
      <div className="nb-world" ref={worldRef}>
        <div className="nb-stage">
          <div className="nb-mount" ref={mountRef} />
        </div>
      </div>
      <nav className="nb-nav" aria-label="Turn pages">
        <button type="button" data-dir="prev">previous</button>
        <span className="nb-nav-count" aria-live="polite" />
        <button type="button" data-dir="next">next</button>
      </nav>
      <p className="nb-toast" role="status" aria-live="polite" />
      <div className="nb-source" ref={sourceRef} hidden>{pages}</div>
      <Hand ref={handRef} />
      {lifted && (
        <Lightbox lifted={lifted} onClose={() => setLifted(null)} />
      )}
    </main>
  )
}
