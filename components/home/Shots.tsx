'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import styles from './Shots.module.css'

export interface Shot {
  src: string
  alt: string
  label: string
  fit?: 'cover' | 'contain'
}

const LEVELS = [30, 15, 8, 4]
const STEP_MS = 62

function placement(iw: number, ih: number, bw: number, bh: number, fit: 'cover' | 'contain') {
  const scale = fit === 'cover' ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih)
  const dw = iw * scale, dh = ih * scale
  return { dx: (bw - dw) / 2, dy: fit === 'cover' ? 0 : (bh - dh) / 2, dw, dh }
}

function Chevron() {
  const px = [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3], [4, 3], [2, 4], [3, 4], [1, 5], [2, 5], [0, 6], [1, 6]]
  return (
    <svg viewBox="0 0 5 7" width="8" height="11" shapeRendering="crispEdges" aria-hidden>
      <path fill="currentColor" d={px.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join('')} />
    </svg>
  )
}

export default function Shots({ index, label, title, shots = [], children }: {
  index: string; label: string; title: string; shots?: Shot[]; children: ReactNode
}) {
  const total = shots.length + 1
  const [current, setCurrent] = useState(0)
  const [armed, setArmed] = useState(false)
  const [fx, setFx] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lightboxShot, setLightboxShot] = useState(0)
  const headingId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const viewer = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const root = useRef<HTMLSpanElement>(null)
  const stage = useRef<HTMLSpanElement>(null)
  const fxCanvas = useRef<HTMLCanvasElement>(null)
  const run = useRef(0)
  const shown = useRef(0)
  const pendingFrame = useRef<number | null>(null)

  useEffect(() => {
    if (!modalOpen) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => { document.documentElement.style.overflow = previousOverflow }
  }, [modalOpen])

  useEffect(() => { viewer.current?.scrollTo(0, 0) }, [lightboxShot, expanded])

  const openGallery = (button: HTMLButtonElement) => {
    if (!dialog.current || dialog.current.open) return
    opener.current = button
    setLightboxShot(Math.max(0, current - 1))
    setExpanded(false)
    setModalOpen(true)
    dialog.current.showModal()
  }

  const stepGallery = (step: number) => {
    setLightboxShot(value => (value + step + shots.length) % shots.length)
  }

  useEffect(() => () => {
    run.current += 1
    if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current)
  }, [])

  useEffect(() => {
    if (!shots.length) return
    const card = root.current?.closest('.card')
    if (!card) return
    const arm = () => setArmed(true)
    card.addEventListener('pointerenter', arm, { once: true })
    card.addEventListener('focusin', arm, { once: true })
    let seen: IntersectionObserver | undefined
    if (matchMedia('(hover: none)').matches) {
      seen = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { arm(); seen?.disconnect() } }, { rootMargin: '200px 0px' })
      seen.observe(card)
    }
    return () => { card.removeEventListener('pointerenter', arm); card.removeEventListener('focusin', arm); seen?.disconnect() }
  }, [shots.length])

  const resolve = useCallback(async (target: number, ticket: number) => {
    const box = stage.current
    const canvas = fxCanvas.current
    if (!box || !canvas || ticket !== run.current) return
    const quit = () => { if (ticket === run.current) setFx(false) }
    const slide = box.querySelectorAll<HTMLElement>('.shots-slide')[target]
    if (target === 0) {
      setCurrent(0)
      return quit()
    }
    const source = slide?.querySelector<HTMLImageElement>('img')
    if (!source) return quit()
    try { await source.decode() } catch { return quit() }
    if (ticket !== run.current) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(target)
      return quit()
    }
    const stageBox = box.getBoundingClientRect()
    const width = Math.round(stageBox.width), height = Math.round(stageBox.height)
    if (!width || !height) return quit()
    canvas.width = width; canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return quit()
    const sourceBox = source.getBoundingClientRect()
    const style = getComputedStyle(source)
    const paddingTop = parseFloat(style.paddingTop) || 0
    const paddingRight = parseFloat(style.paddingRight) || 0
    const paddingBottom = parseFloat(style.paddingBottom) || 0
    const paddingLeft = parseFloat(style.paddingLeft) || 0
    const area = placement(source.naturalWidth, source.naturalHeight,
      sourceBox.width - paddingLeft - paddingRight,
      sourceBox.height - paddingTop - paddingBottom, shots[target - 1]?.fit ?? 'cover')
    area.dx += sourceBox.left - stageBox.left + paddingLeft
    area.dy += sourceBox.top - stageBox.top + paddingTop
    const small = document.createElement('canvas')
    const tiny = small.getContext('2d')
    if (!tiny) return quit()
    for (const level of LEVELS) {
      if (ticket !== run.current) return
      const w = Math.max(1, Math.round(area.dw / level)), h = Math.max(1, Math.round(area.dh / level))
      small.width = w; small.height = h
      tiny.imageSmoothingEnabled = true
      tiny.drawImage(source, 0, 0, w, h)
      context.clearRect(0, 0, width, height)
      context.imageSmoothingEnabled = false
      context.drawImage(small, 0, 0, w, h, area.dx, area.dy, area.dw, area.dh)
      if (level === LEVELS[0]) {
        setCurrent(target)
        setFx(true)
      }
      await new Promise(r => setTimeout(r, STEP_MS))
    }
    quit()
  }, [shots])

  const go = useCallback((step: number) => {
    const next = (shown.current + step + total) % total
    const ticket = ++run.current
    shown.current = next
    if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current)
    setArmed(true)
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null
      void resolve(next, ticket)
    })
  }, [resolve, total])

  useEffect(() => {
    if (total < 2) return
    const card = root.current?.closest<HTMLElement>('.card')
    const frame = stage.current
    if (!card || !frame) return
    let start: { x: number; y: number; id: number } | null = null
    let swallow = false
    const down = (e: PointerEvent) => {
      swallow = false
      if (e.pointerType === 'mouse') return
      const r = frame.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      start = { x: e.clientX, y: e.clientY, id: e.pointerId }
    }
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return
      const dx = e.clientX - start.x, dy = e.clientY - start.y
      start = null
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.4) { swallow = true; go(dx < 0 ? 1 : -1) }
    }
    const cancel = () => { start = null; swallow = false }
    const click = (e: MouseEvent) => { if (swallow) { swallow = false; e.preventDefault(); e.stopPropagation() } }
    card.addEventListener('pointerdown', down)
    card.addEventListener('pointerup', up)
    card.addEventListener('pointercancel', cancel)
    card.addEventListener('click', click, true)
    return () => {
      card.removeEventListener('pointerdown', down)
      card.removeEventListener('pointerup', up)
      card.removeEventListener('pointercancel', cancel)
      card.removeEventListener('click', click, true)
    }
  }, [go, total])

  const shot = current > 0 ? shots[current - 1] : null

  return (
    <span ref={root} className="shots" data-fx={fx || undefined}
          onKeyDown={total > 1 ? e => {
            if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
          } : undefined}>
      <span className="card-art-meta" aria-hidden="true">
        <i>{index}</i>
        <span>{shot ? shot.label : label}</span>
      </span>
      <span ref={stage} className="shots-stage">
        <span className="shots-slide shots-art" data-on={current === 0 || undefined} aria-hidden="true">
          <span className="pixel-art">{children}</span>
        </span>
        {shots.map((s, i) => (
          <span key={s.src} className="shots-slide shots-shot" data-on={current === i + 1 || undefined}
                data-fit={s.fit ?? 'cover'} aria-hidden={current !== i + 1}>
            {armed && <img src={s.src} alt={s.alt} decoding="async" draggable={false} />}
          </span>
        ))}
        <canvas ref={fxCanvas} className="shots-fx" aria-hidden />
      </span>
      {total > 1 && <>
        {shot && <button type="button" className={`shots-view ${styles.view}`}
          aria-label={`Enlarge ${title}: ${shot.label}`} aria-haspopup="dialog"
          onClick={event => { event.stopPropagation(); openGallery(event.currentTarget) }} />}
        <button type="button" className="shots-nav" data-dir="prev" onClick={() => go(-1)}
                aria-label={`${title}: previous picture`}><Chevron /></button>
        <button type="button" className="shots-nav" data-dir="next" onClick={() => go(1)}
                aria-label={`${title}: next picture`}><Chevron /></button>
        <span className={`shots-dots ${styles.dots}`} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => <i key={i} data-on={i === current || undefined} />)}
        </span>
        <button type="button" className={`shots-open ${styles.open}`} aria-haspopup="dialog"
          aria-label={`View ${title} screenshots${shot ? `, ${current} of ${shots.length}` : ''}`}
          onClick={event => { event.stopPropagation(); openGallery(event.currentTarget) }}>
          {shot ? `View ${current} / ${shots.length}` : `${shots.length} screenshot${shots.length === 1 ? '' : 's'}`}
          <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor">
            <path d="M1 5V1h4M7 1h4v4M11 7v4H7M5 11H1V7" />
          </svg>
        </button>
        <span className="sr-only" aria-live="polite">
          {current === 0 ? `${title}: drawing` : `${title}: screenshot ${current} of ${shots.length} — ${shot?.alt}`}
        </span>
        <dialog ref={dialog} className={`shots-dialog ${styles.dialog}`} aria-labelledby={headingId} data-lenis-prevent
          onClose={() => { setModalOpen(false); opener.current?.focus({ preventScroll: true }) }}
          onPointerDown={event => event.stopPropagation()}
          onClick={event => {
            event.stopPropagation()
            if (event.target !== event.currentTarget) return
            const bounds = event.currentTarget.getBoundingClientRect()
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.current?.close()
          }}
          onKeyDown={event => {
            event.stopPropagation()
            if (event.key === 'ArrowRight' && !expanded) { event.preventDefault(); stepGallery(1) }
            if (event.key === 'ArrowLeft' && !expanded) { event.preventDefault(); stepGallery(-1) }
          }}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <b id={headingId}>{title}</b>
              <span aria-live="polite">{lightboxShot + 1} / {shots.length} · {shots[lightboxShot]?.label}</span>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} autoFocus aria-label="Close screenshots">Close <span aria-hidden="true">×</span></button>
          </div>
          <div ref={viewer} className={styles.viewer} data-expanded={expanded || undefined}
            tabIndex={0} aria-label={expanded ? 'Full-size screenshot. Scroll to explore.' : 'Complete screenshot'}>
            {modalOpen && <img src={shots[lightboxShot].src} alt={shots[lightboxShot].alt} draggable={false} />}
          </div>
          <div className={styles.footer}>
            <div className={styles.paging}>
              {shots.length > 1 && <>
                <button type="button" onClick={() => stepGallery(-1)} aria-label="Previous screenshot"><span className={styles.previous}><Chevron /></span></button>
                <button type="button" onClick={() => stepGallery(1)} aria-label="Next screenshot"><Chevron /></button>
              </>}
              <span>{expanded ? 'Scroll to explore' : shots.length > 1 ? '← → to browse' : 'Complete screenshot'}</span>
            </div>
            <button type="button" aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Fit to screen' : 'Actual size'}</button>
          </div>
        </dialog>
      </>}
    </span>
  )
}
