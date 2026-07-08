'use client'

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import LenisInit from '@/components/LenisInit'
import styles from './page.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ─── 婚礼信息 ───────────────────────────────────────────────────────
const DATE = 'July 2026'
const TRANSITION_WORDS = ['and', 'then,', 'we', 'stepped', 'outside…']
const TRANSITION_SUB = 'The Water Temple'

const TEAL = '#47837C'
const TEAL_PAPER = '#EDF3F0'

// 真实像素尺寸（sips 测量）
type Photo = { id: string; w: number; h: number }

const DIMS: Record<string, [number, number]> = {
  '1':  [6063, 9094], '2':  [6153, 9235], '3':  [4160, 6240], '4':  [6102, 9152],
  '5':  [4160, 6240], '6':  [6289, 9434], '7':  [6336, 9504], '8':  [4160, 6240],
  '9':  [4160, 6240], '10': [6336, 9504], '11': [4160, 6240], '12': [4160, 6240],
  '13': [4160, 6240], '14': [6336, 9504], '15': [6336, 9504], '16': [6336, 9504],
  '17': [6094, 9141], '18': [6262, 9393], '19': [5920, 8879], '20': [6336, 9504],
  '21': [4160, 6240], '22': [6219, 9329], '23': [6336, 9504], '24': [5996, 8994],
  '25': [6167, 9250], '26': [6159, 9238], '27': [6336, 9504], '28': [6336, 9504],
  '29': [6336, 9504], '30': [6336, 9504], '31': [6258, 9387], '32': [6115, 9172],
  '33': [6252, 9378], '34': [6336, 9504], '35': [6336, 9504], '36': [6336, 9504],
  '37': [6054, 9082], '38': [5754, 8631], '39': [6248, 9373], '40': [6336, 9504],
  '41': [6240, 4160], '42': [5999, 9000], '43': [6240, 4160],
  '001o': [6376, 4403], '002o': [3316, 5120], '003o': [3305, 4957], '004o': [5120, 3413],
  '005o': [7008, 4672], '006o': [2464, 3552], '007o': [6300, 4200], '008o': [5120, 3413],
  '009o': [7008, 4672], '010o': [3115, 4672], '011o': [2591, 3886], '012o': [7008, 4672],
}

const P = (id: string): Photo => ({ id, w: DIMS[id][0], h: DIMS[id][1] })

// 拼版行：12 列宽度单位，h = 行高（列单位）。行内高度严格一致 →
// 不会出现空洞；格子比例和原图的偏差由轻微裁切消化（lightbox 永远是全图）
type CollageRow = { h: number; cells: { id: string; span: number }[] }

type Block =
  | { type: 'collage'; rows: CollageRow[] }
  | { type: 'solo';    photos: Photo[] }
  | { type: 'duo';     photos: Photo[] }
  | { type: 'feature'; photos: Photo[] }

const blockPhotos = (b: Block): Photo[] =>
  b.type === 'collage' ? b.rows.flatMap(r => r.cells.map(c => P(c.id))) : b.photos

const INDOOR_BLOCKS: Block[] = [
  { type: 'solo', photos: [P('1')] },
  { type: 'collage', rows: [
    { h: 9,   cells: [{ id: '2',  span: 7 }, { id: '3',  span: 5 }] },
    { h: 6,   cells: [{ id: '4',  span: 4 }, { id: '5',  span: 4 }, { id: '6',  span: 4 }] },
    { h: 8.6, cells: [{ id: '7',  span: 5 }, { id: '8',  span: 7 }] },
    { h: 6,   cells: [{ id: '9',  span: 5 }, { id: '10', span: 4 }, { id: '11', span: 3 }] },
    { h: 6.2, cells: [{ id: '12', span: 4 }, { id: '13', span: 4 }, { id: '14', span: 4 }] },
  ] },
  { type: 'duo', photos: [P('15'), P('16')] },
  { type: 'collage', rows: [
    { h: 6,   cells: [{ id: '17', span: 4 }, { id: '18', span: 4 }, { id: '19', span: 4 }] },
    { h: 9,   cells: [{ id: '20', span: 7 }, { id: '21', span: 5 }] },
    { h: 6,   cells: [{ id: '22', span: 3 }, { id: '23', span: 4 }, { id: '24', span: 5 }] },
    { h: 8.6, cells: [{ id: '25', span: 5 }, { id: '26', span: 7 }] },
    { h: 9,   cells: [{ id: '27', span: 7 }, { id: '28', span: 5 }] },
  ] },
  { type: 'feature', photos: [P('41')] },
  { type: 'collage', rows: [
    { h: 8.6, cells: [{ id: '29', span: 5 }, { id: '30', span: 7 }] },
    { h: 6,   cells: [{ id: '31', span: 4 }, { id: '32', span: 4 }, { id: '33', span: 4 }] },
    { h: 9,   cells: [{ id: '34', span: 7 }, { id: '35', span: 5 }] },
    { h: 6.2, cells: [{ id: '36', span: 5 }, { id: '37', span: 4 }, { id: '38', span: 3 }] },
    { h: 9,   cells: [{ id: '39', span: 5 }, { id: '40', span: 7 }] },
  ] },
  { type: 'solo', photos: [P('42')] },
  { type: 'feature', photos: [P('43')] },
]

const OUTDOOR_BLOCKS: Block[] = [
  { type: 'solo', photos: [P('001o')] },
  { type: 'collage', rows: [
    { h: 5.6, cells: [{ id: '004o', span: 8 }, { id: '002o', span: 4 }] },
    { h: 5.0, cells: [{ id: '006o', span: 4 }, { id: '007o', span: 8 }] },
  ] },
  { type: 'solo', photos: [P('003o')] },
  { type: 'collage', rows: [
    { h: 5.2, cells: [{ id: '008o', span: 8 }, { id: '010o', span: 4 }] },
    { h: 5.6, cells: [{ id: '011o', span: 4 }, { id: '009o', span: 8 }] },
  ] },
  { type: 'solo', photos: [P('005o')] },
  { type: 'feature', photos: [P('012o')] },
]
// ────────────────────────────────────────────────────────────────────

const ALL: Photo[] = [...INDOOR_BLOCKS, ...OUTDOOR_BLOCKS].flatMap(blockPhotos)
const OUTDOOR_START = INDOOR_BLOCKS.reduce((n, b) => n + blockPhotos(b).length, 0)

// 两档尺寸：页面显示 1600px/q85（~330KB/张），lightbox 2600px/q88（~850KB/张）。
// 相机原图在项目根目录 wedding_originals/（gitignore，不参与部署）。
const pageSrc  = (id: string) => `/wedding/page/${id}.jpg`
const largeSrc = (id: string) => `/wedding/large/${id}.jpg`

function Ornament({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={`${styles.ornament} ${light ? styles.ornamentLight : ''} ${className ?? ''}`} aria-hidden="true">
      <span className={styles.ornamentLine} />
      <span className={styles.ornamentMark}>❦</span>
      <span className={styles.ornamentLine} />
    </div>
  )
}

function Corners() {
  return (
    <>
      <span className={`${styles.corner} ${styles.cTL}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.cTR}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.cBL}`} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.cBR}`} aria-hidden="true" />
    </>
  )
}

/* SF City Hall dome — beaux-arts line art */
function DomeArt() {
  return (
    <svg className={`${styles.domeArt} wg-chapter-ghost`} viewBox="0 0 220 150" fill="none"
      stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.4" aria-hidden="true">
      {/* lantern */}
      <line x1="110" y1="6" x2="110" y2="16" />
      <circle cx="110" cy="20" r="4" />
      <path d="M100 32 Q110 24 120 32" />
      <line x1="100" y1="32" x2="100" y2="40" />
      <line x1="120" y1="32" x2="120" y2="40" />
      <line x1="96" y1="40" x2="124" y2="40" />
      {/* dome */}
      <path d="M56 92 Q110 34 164 92" />
      <path d="M68 92 Q110 44 152 92" />
      {/* dome ribs */}
      <path d="M110 41 L110 92" />
      <path d="M88 50 Q92 70 84 92" />
      <path d="M132 50 Q128 70 136 92" />
      {/* drum with columns */}
      <line x1="56" y1="92" x2="164" y2="92" />
      <line x1="60" y1="112" x2="160" y2="112" />
      {[66, 78, 90, 102, 114, 126, 138, 150].map(x => (
        <line key={x} x1={x} y1="94" x2={x} y2="110" />
      ))}
      {/* pediment wings */}
      <line x1="20" y1="112" x2="200" y2="112" />
      <line x1="14" y1="132" x2="206" y2="132" />
      {[28, 40, 52, 168, 180, 192].map(x => (
        <line key={x} x1={x} y1="114" x2={x} y2="130" />
      ))}
      {/* steps */}
      <line x1="24" y1="138" x2="196" y2="138" />
      <line x1="34" y1="144" x2="186" y2="144" />
    </svg>
  )
}

/* arcade divider — a row of beaux-arts arches */
function Arcade() {
  return (
    <svg className={`${styles.arcade} wg-chapter-item`} viewBox="0 0 300 30" fill="none"
      stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const x = 24 + i * 36
        return <path key={i} d={`M${x} 28 L${x} 16 A14 14 0 0 1 ${x + 28} 16 L${x + 28} 28`} />
      })}
      <line x1="12" y1="28" x2="288" y2="28" />
    </svg>
  )
}

function Collage({ rows, offset, onOpen }: {
  rows: CollageRow[]
  offset: number
  onOpen: (index: number) => void
}) {
  let idx = offset
  return (
    <div className={styles.collage}>
      {rows.map((row, ri) => (
        <div
          key={ri}
          className={styles.crow}
          style={{ '--rh': `12 / ${row.h}` } as CSSProperties}
        >
          {row.cells.map(cell => {
            const at = idx++
            const [w, h] = DIMS[cell.id]
            return (
              <div
                key={cell.id}
                className={`${styles.ccell} wg-cell`}
                style={{ flex: `${cell.span} ${cell.span} 0%`, '--car': `${w} / ${h}` } as CSSProperties}
                onClick={() => onOpen(at)}
              >
                <div className={styles.ccellInner}>
                  <img
                    src={pageSrc(cell.id)}
                    alt={`Wedding photo ${at + 1}`}
                    className={styles.img}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SpotlightMat({ photo, index, onOpen }: {
  photo: Photo
  index: number
  onOpen: (index: number) => void
}) {
  return (
    <div
      className={`${styles.showcaseMat} ${photo.w > photo.h ? styles.showcaseLandscape : styles.showcasePortrait}`}
      onClick={() => onOpen(index)}
    >
      <Corners />
      <div className={styles.showcaseInner} style={{ aspectRatio: `${photo.w} / ${photo.h}` }}>
        <img
          src={pageSrc(photo.id)}
          alt={`Wedding photo ${index + 1}`}
          className={`${styles.featureImg} wg-feature-img`}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  )
}

function Solo({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: (i: number) => void }) {
  return (
    <div className={`${styles.showcase} wg-feature`}>
      <SpotlightMat photo={photo} index={index} onOpen={onOpen} />
    </div>
  )
}

function Duo({ photos, offset, onOpen }: { photos: Photo[]; offset: number; onOpen: (i: number) => void }) {
  return (
    <div className={styles.duo}>
      {photos.map((p, i) => (
        <div key={p.id} className={`${styles.duoItem} wg-feature`}>
          <SpotlightMat photo={p} index={offset + i} onOpen={onOpen} />
        </div>
      ))}
    </div>
  )
}

function Feature({ photo, index, onOpen }: { photo: Photo; index: number; onOpen: (i: number) => void }) {
  return (
    <div className={`${styles.feature} wg-feature`}>
      <div className={styles.featureMat} onClick={() => onOpen(index)}>
        <div className={styles.featureInner} style={{ aspectRatio: `${photo.w} / ${photo.h}` }}>
          <img
            src={pageSrc(photo.id)}
            alt={`Wedding photo ${index + 1}`}
            className={`${styles.featureImg} wg-feature-img`}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>
  )
}

function ChapterBlocks({ blocks, start, onOpen }: {
  blocks: Block[]
  start: number
  onOpen: (index: number) => void
}) {
  let offset = start
  return (
    <>
      {blocks.map((block, bi) => {
        const at = offset
        offset += blockPhotos(block).length
        switch (block.type) {
          case 'collage':
            return <Collage key={bi} rows={block.rows} offset={at} onOpen={onOpen} />
          case 'solo':
            return <Solo key={bi} photo={block.photos[0]} index={at} onOpen={onOpen} />
          case 'duo':
            return <Duo key={bi} photos={block.photos} offset={at} onOpen={onOpen} />
          case 'feature':
            return <Feature key={bi} photo={block.photos[0]} index={at} onOpen={onOpen} />
        }
      })}
    </>
  )
}

function ChapterHead({ ghost, art, kicker, title }: {
  ghost?: string
  art?: 'dome'
  kicker: string
  title: string
}) {
  return (
    <div className={`${styles.chapterHead} wg-chapter-head`}>
      {art === 'dome'
        ? <DomeArt />
        : <span className={`${styles.chapterGhost} wg-chapter-ghost`} aria-hidden="true">{ghost}</span>}
      <p className={`${styles.chapterKicker} wg-chapter-item`}>{kicker}</p>
      <div className="wg-chapter-item">
        <Ornament className={styles.chapterOrnament} />
      </div>
      <h2 className={`${styles.chapterTitle} wg-chapter-item`}>{title}</h2>
      {art === 'dome' && <Arcade />}
    </div>
  )
}

export default function Gallery() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const close = useCallback(() => setActive(null), [])
  const prev  = useCallback(() => setActive(i => (i !== null && i > 0) ? i - 1 : i), [])
  const next  = useCallback(() => setActive(i => (i !== null && i < ALL.length - 1) ? i + 1 : i), [])

  // ── Preload every photo before opening the curtains ──────────────
  useEffect(() => {
    // Reduced motion: no preloader shown, so don't gate entry on loading
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLoaded(true)
      return
    }
    let done = 0
    let finished = false
    const finish = () => { if (!finished) { finished = true; setLoaded(true) } }
    ALL.forEach(p => {
      const img = new Image()
      const tick = () => {
        done++
        setProgress(Math.round((done / ALL.length) * 100))
        if (done === ALL.length) finish()
      }
      img.onload = tick
      img.onerror = tick
      img.src = pageSrc(p.id)
    })
    // Safety valve: never trap a guest on a stalled connection
    const cap = setTimeout(finish, 45000)
    return () => clearTimeout(cap)
  }, [])

  // Lock scrolling while the preloader holds the stage
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.body.style.overflow = loaded ? '' : 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [loaded])

  useGSAP(() => {
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {

      // ── Curtains close over the page, preloader appears ──────────
      // CSS keeps curtains off-screen via translateX(±101%); GSAP reads
      // that as a baked px offset, so explicitly zero `x` when bringing
      // them on screen and animate with xPercent only.
      gsap.set('.wg-loader', { x: 0, xPercent: 0 })
      gsap.fromTo('.wg-preloader', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' })

      gsap.to('.wg-cue', { y: 7, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })

      // ── Scroll progress ──────────────────────────────────────────
      gsap.to('.wg-progress', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      })

      // ── Section background patterns ease in with the chapter ─────
      gsap.utils.toArray<HTMLElement>('.wg-pattern').forEach(pattern => {
        gsap.fromTo(pattern,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1.8, ease: 'power1.inOut',
            scrollTrigger: { trigger: pattern.parentElement, start: 'top 72%' } })
      })

      // ── Chapter headers ──────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('.wg-chapter-head').forEach(head => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: head, start: 'top 80%' },
          defaults: { ease: 'power2.out' },
        })
        tl.fromTo(head.querySelector('.wg-chapter-ghost'),
            { scale: 1.08, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 1.1 })
          .fromTo(head.querySelectorAll('.wg-chapter-item'),
            { y: 20, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 }, '-=0.75')
      })

      // ── Collage cells: gentle rise + image settle ────────────────
      gsap.utils.toArray<HTMLElement>('.wg-cell').forEach(cell => {
        const img = cell.querySelector('img')
        const tl = gsap.timeline({
          scrollTrigger: { trigger: cell, start: 'top 91%' },
        })
        tl.fromTo(cell,
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' })
          .fromTo(img,
            { scale: 1.06 },
            { scale: 1, duration: 1.1, ease: 'power2.out' }, 0)
      })

      // ── Spotlights & features: reveal + slow parallax drift ──────
      gsap.utils.toArray<HTMLElement>('.wg-feature').forEach(feature => {
        const img = feature.querySelector('.wg-feature-img')
        gsap.fromTo(feature,
          { y: 36, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.9, ease: 'power2.out',
            scrollTrigger: { trigger: feature, start: 'top 86%' } })
        gsap.fromTo(img,
          { yPercent: -6, scale: 1.14 },
          { yPercent: 6, scale: 1.14, ease: 'none',
            scrollTrigger: { trigger: feature, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
      })

      // ── Transition: curtains close → words → colour morph → part ─
      const tTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.wg-transition',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1,
        },
        defaults: { ease: 'power2.inOut' },
      })
      tTl
        .fromTo('.wg-t-left',  { x: 0, xPercent: -101 }, { x: 0, xPercent: 0, duration: 1.0 })
        .fromTo('.wg-t-right', { x: 0, xPercent: 101 },  { x: 0, xPercent: 0, duration: 1.0 }, '<')
        .fromTo('.wg-t-word',
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, '-=0.15')
        .to({}, { duration: 0.3 })
        // camel → teal while the curtains hold the stage
        .to('.wg-t-curtain', { backgroundColor: TEAL, duration: 0.7, ease: 'power1.inOut' })
        .to('.wg-transition', { backgroundColor: TEAL_PAPER, duration: 0.7, ease: 'power1.inOut' }, '<')
        .fromTo('.wg-t-sub',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, '<+0.25')
        .to({}, { duration: 0.35 })
        .to('.wg-t-word, .wg-t-sub', { y: -18, autoAlpha: 0, duration: 0.35, stagger: 0.03 })
        .to('.wg-t-left',  { xPercent: -101, duration: 1.0 })
        .to('.wg-t-right', { xPercent: 101,  duration: 1.0 }, '<')
        .to({}, { duration: 0.15 })

      // ── Closing block ────────────────────────────────────────────
      gsap.fromTo('.wg-closing-item',
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.11, ease: 'power2.out',
          scrollTrigger: { trigger: '.wg-closing', start: 'top 78%' } })
    })
  }, { scope: rootRef })

  // ── Entrance: photos ready → preloader exits, curtains part ──────
  useGSAP(() => {
    if (!loaded) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    intro
      .to('.wg-preloader', { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in', delay: 0.25 })
      .to('.wg-loader-l', { xPercent: -101, duration: 0.9, ease: 'power3.inOut' }, '-=0.05')
      .to('.wg-loader-r', { xPercent: 101,  duration: 0.9, ease: 'power3.inOut' }, '<')
      .set('.wg-loader, .wg-preloader', { display: 'none' })
      .fromTo('.wg-hero-card', { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 }, '-=0.5')
      .fromTo('.wg-hero-line', { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.12 }, '-=0.55')
      .fromTo('.wg-hero-item', { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.09 }, '-=0.5')
      .fromTo('.wg-cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.15')
  }, { scope: rootRef, dependencies: [loaded] })

  // ── Lightbox keyboard nav ────────────────────────────────────────
  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     close()
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, close, prev, next])

  useEffect(() => {
    document.body.style.overflow = active !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [active])

  // Preload neighbouring images so arrow navigation feels instant
  useEffect(() => {
    if (active === null) return
    ;[active - 1, active + 1]
      .filter(i => i >= 0 && i < ALL.length)
      .forEach(i => { new Image().src = largeSrc(ALL[i].id) })
  }, [active])

  return (
    <div ref={rootRef} className={styles.page}>
      <LenisInit />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.pageEdges} aria-hidden="true" />
      <div className={`${styles.progress} wg-progress`} aria-hidden="true" />

      {/* Opening curtains */}
      <div className={`${styles.loaderCurtain} ${styles.loaderL} wg-loader wg-loader-l`} aria-hidden="true" />
      <div className={`${styles.loaderCurtain} ${styles.loaderR} wg-loader wg-loader-r`} aria-hidden="true" />

      {/* Preloader — on the closed curtains while all photos load */}
      <div className={`${styles.preloader} wg-preloader`} role="status" aria-live="polite">
        <span className={styles.preFleuron} aria-hidden="true">❦</span>
        <p className={styles.preNames}>Bruce &amp; Christy</p>
        <div className={styles.preTrack}>
          <div className={styles.preFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.prePct}>{progress}%</p>
      </div>

      {/* ── Hero — invitation card ── */}
      <header className={styles.hero}>
        <div className={`${styles.heroCard} wg-hero-card`}>
          <Corners />
          <p className={`${styles.heroKicker} wg-hero-item`}>The Wedding Of</p>
          <h1 className={styles.heroName}>
            <span className={styles.mask}><span className={`${styles.heroLine} wg-hero-line`}>Bruce</span></span>
            <span className={styles.mask}><span className={`${styles.heroAmp} wg-hero-line`}>&amp;</span></span>
            <span className={styles.mask}><span className={`${styles.heroLine} wg-hero-line`}>Christy</span></span>
          </h1>
          <div className="wg-hero-item">
            <Ornament className={styles.heroOrnament} />
          </div>
          <p className={`${styles.heroDate} wg-hero-item`}>{DATE}</p>
        </div>
        <div className={`${styles.scrollCue} wg-cue`}>
          <span className={styles.scrollCueText}>Scroll</span>
          <span className={styles.scrollCueLine} />
        </div>
      </header>

      {/* ── Chapter Ⅰ · City Hall ── */}
      <section className={styles.patternedSection}>
        <div className={`${styles.sectionPattern} ${styles.hallPattern} wg-pattern`} aria-hidden="true" />
        <ChapterHead art="dome" kicker="Chapter One" title="City Hall" />
        <ChapterBlocks blocks={INDOOR_BLOCKS} start={0} onOpen={setActive} />
      </section>

      {/* ── Curtain transition: camel → teal ── */}
      <section className={`${styles.transition} wg-transition`}>
        <div className={`${styles.tCurtain} ${styles.tLeft} wg-t-curtain wg-t-left`} aria-hidden="true" />
        <div className={`${styles.tCurtain} ${styles.tRight} wg-t-curtain wg-t-right`} aria-hidden="true" />
        <div className={styles.tText}>
          <span className={`${styles.tFleuron} wg-t-word`} aria-hidden="true">❧</span>
          <p className={styles.tWords}>
            {TRANSITION_WORDS.map(word => (
              <span key={word} className={`${styles.tWord} wg-t-word`}>{word}</span>
            ))}
          </p>
          <p className={`${styles.tSub} wg-t-sub`}>{TRANSITION_SUB}</p>
        </div>
      </section>

      {/* ── Chapter Ⅱ · Water Temple (teal) ── */}
      <section className={`${styles.themeTeal} ${styles.patternedSection}`}>
        <div className={`${styles.sectionPattern} ${styles.tealPattern} wg-pattern`} aria-hidden="true" />
        <ChapterHead ghost="II" kicker="Chapter Two" title="Water Temple" />
        <ChapterBlocks blocks={OUTDOOR_BLOCKS} start={OUTDOOR_START} onOpen={setActive} />

        {/* ── Closing (teal) ── */}
        <footer className={`${styles.closing} wg-closing`}>
          <div className={styles.closingFrame}>
            <Corners />
            <p className={`${styles.closingMono} wg-closing-item`}>Bruce <em>&amp;</em> Christy</p>
            <div className="wg-closing-item">
              <Ornament className={styles.closingOrnament} light />
            </div>
            <p className={`${styles.closingText} wg-closing-item`}>Thank you for celebrating with us ♥</p>
            <p className={`${styles.closingDate} wg-closing-item`}>{DATE}</p>
          </div>
        </footer>
      </section>

      {/* ── Lightbox ── */}
      {active !== null && (
        <div className={styles.lightbox} onClick={close}>
          <button className={styles.lbClose} onClick={close} aria-label="Close">×</button>

          {active > 0 && (
            <button
              className={`${styles.lbArrow} ${styles.lbPrev}`}
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
            >‹</button>
          )}

          <img
            src={largeSrc(ALL[active].id)}
            alt={`Wedding photo ${active + 1}`}
            className={styles.lbImg}
            onClick={e => e.stopPropagation()}
          />

          {active < ALL.length - 1 && (
            <button
              className={`${styles.lbArrow} ${styles.lbNext}`}
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next photo"
            >›</button>
          )}

          <p className={styles.lbCount}>{String(active + 1).padStart(2, '0')} / {ALL.length}</p>
        </div>
      )}
    </div>
  )
}
