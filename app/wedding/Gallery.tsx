'use client'

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import LenisInit from '@/components/LenisInit'
import styles from './page.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ─── 婚礼信息 ───────────────────────────────────────────────────────
const DATE = '二零二六年 六月二十二日'
const TRANSITION_WORDS = ['Through', 'thick', 'and', 'thin']
const TRANSITION_ZH = '第二站，水神殿'
const TRANSITION_SUB = 'The Water Temple · 水神殿'

const TEAL = '#47837C'
const TEAL_PAPER = '#EDF3F0'

import { DIMS, P, pageSrc, largeSrc, type Photo } from './photos'

// 拼版行：12 列宽度单位，h = 行高（列单位）。行内高度严格一致 →
// 不会出现空洞；格子比例和原图的偏差由轻微裁切消化（lightbox 永远是全图）
// cell.drop: 单格轻微下沉，让上缘有一点错落（下缘保持对齐）
type CollageRow = {
  h: number
  cells: { id: string; span: number; drop?: boolean }[]
}

type Block =
  | { type: 'collage'; rows: CollageRow[] }
  | { type: 'solo';    photos: Photo[]; large?: boolean }
  | { type: 'duo';     photos: Photo[]; large?: boolean; secondSmaller?: boolean }
  | { type: 'feature'; photos: Photo[]; large?: boolean }

const blockPhotos = (b: Block): Photo[] =>
  b.type === 'collage' ? b.rows.flatMap(r => r.cells.map(c => P(c.id))) : b.photos

const INDOOR_BLOCKS: Block[] = [
  { type: 'solo', photos: [P('1')], large: true },
  { type: 'collage', rows: [
    { h: 6.2, cells: [{ id: '2',  span: 4 }, { id: '3',  span: 4, drop: true }, { id: '4', span: 4 }] },
    { h: 9,   cells: [{ id: '13', span: 7 }, { id: '6',  span: 5, drop: true }] },
    { h: 6,   cells: [{ id: '7',  span: 4 }, { id: '8',  span: 4, drop: true }, { id: '9', span: 4 }] },
    // 6+6 等宽、h9 → 两格都是 2:3 原始比例，零裁切
    { h: 9,   cells: [{ id: '10', span: 6, drop: true }, { id: '11', span: 6 }] },
    { h: 6.4, cells: [{ id: '12', span: 4 }, { id: '5', span: 4, drop: true }, { id: '14', span: 4 }] },
  ] },
  { type: 'duo', photos: [P('15'), P('16')] },
  { type: 'collage', rows: [
    { h: 9,   cells: [{ id: '17', span: 7 }, { id: '18', span: 5, drop: true }] },
    { h: 6.2, cells: [{ id: '19', span: 4 }, { id: '20', span: 4, drop: true }, { id: '21', span: 4 }] },
    { h: 8.6, cells: [{ id: '22', span: 5 }, { id: '23', span: 7, drop: true }] },
    { h: 6,   cells: [{ id: '24', span: 4 }, { id: '25', span: 4, drop: true }, { id: '26', span: 4 }] },
    { h: 7.8, cells: [{ id: '27', span: 6, drop: true }, { id: '28', span: 6 }] },
  ] },
  { type: 'collage', rows: [
    // 37 是横构图，配一张竖图同排（span8/h5.6 ≈ 3:2）
    { h: 6.2, cells: [{ id: '29', span: 4 }, { id: '30', span: 4, drop: true }, { id: '39', span: 4 }] },
    { h: 9,   cells: [{ id: '32', span: 6 }, { id: '33', span: 6, drop: true }] },
    { h: 9,   cells: [{ id: '31', span: 6 }, { id: '34', span: 6, drop: true }] },
    { h: 5.6, cells: [{ id: '40', span: 4, drop: true }, { id: '37', span: 8 }] },
    { h: 6.2, cells: [{ id: '38', span: 4 }, { id: '35', span: 4, drop: true }, { id: '36', span: 4 }] },
  ] },
  // 41、43 都是竖幅，并排展示
  { type: 'duo', photos: [P('41'), P('43')], secondSmaller: true },
  // 44 拥抱照，独占一行、放大
  { type: 'feature', photos: [P('44')] },
  // 45（原 44）竖幅收章
  { type: 'solo', photos: [P('45')], large: true },
]

const OUTDOOR_BLOCKS: Block[] = [
  { type: 'solo', photos: [P('01o')] },
  { type: 'collage', rows: [
    { h: 9, cells: [{ id: '02o', span: 6, drop: true }, { id: '03o', span: 6 }] },
  ] },
  { type: 'feature', photos: [P('04o')] },
  { type: 'collage', rows: [
    { h: 5.6, cells: [{ id: '05o', span: 4, drop: true }, { id: '06o', span: 8 }] },
    { h: 5.6, cells: [{ id: '08o', span: 8 }, { id: '09o', span: 4, drop: true }] },
    { h: 4.3, cells: [{ id: '10o', span: 6 }, { id: '12o', span: 6, drop: true }] },
  ] },
  { type: 'collage', rows: [
    { h: 4.3, cells: [{ id: '13o', span: 6, drop: true }, { id: '14o', span: 6 }] },
    { h: 5.6, cells: [{ id: '15o', span: 8 }, { id: '16o', span: 4, drop: true }] },
  ] },
  { type: 'collage', rows: [
    // 17o + 18o 都是 ~3:2 横构图，并排展示（span6/h4.1，接近零裁切）
    { h: 4.1, cells: [{ id: '17o', span: 6 }, { id: '18o', span: 6, drop: true }] },
  ] },
  // 20o 横幅独占最后一排收章（19o 不再展示）
  { type: 'feature', photos: [P('20o')] },
]
// ────────────────────────────────────────────────────────────────────

const ALL: Photo[] = [...INDOOR_BLOCKS, ...OUTDOOR_BLOCKS].flatMap(blockPhotos)
const OUTDOOR_START = INDOOR_BLOCKS.reduce((n, b) => n + blockPhotos(b).length, 0)


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
                className={`${styles.ccell} ${cell.drop ? styles.cellDrop : ''} wg-cell`}
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

function SpotlightMat({ photo, index, large, onOpen }: {
  photo: Photo
  index: number
  large?: boolean
  onOpen: (index: number) => void
}) {
  const orientation = photo.w > photo.h ? styles.showcaseLandscape : styles.showcasePortrait
  return (
    <div
      className={`${styles.showcaseMat} ${orientation} ${large ? styles.showcaseLarge : ''}`}
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

function Solo({ photo, index, large, onOpen }: { photo: Photo; index: number; large?: boolean; onOpen: (i: number) => void }) {
  return (
    <div className={`${styles.showcase} wg-feature`}>
      <SpotlightMat photo={photo} index={index} large={large} onOpen={onOpen} />
    </div>
  )
}

function Duo({ photos, offset, large, secondSmaller, onOpen }: {
  photos: Photo[]
  offset: number
  large?: boolean
  secondSmaller?: boolean
  onOpen: (i: number) => void
}) {
  return (
    <div className={`${styles.duo} ${large ? styles.duoLarge : ''}`}>
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={`${styles.duoItem} ${secondSmaller && i === 1 ? styles.duoItemSmall : ''} wg-feature`}
        >
          <SpotlightMat photo={p} index={offset + i} onOpen={onOpen} />
        </div>
      ))}
    </div>
  )
}

function Feature({ photo, index, large, onOpen }: {
  photo: Photo
  index: number
  large?: boolean
  onOpen: (i: number) => void
}) {
  const orientation = photo.w > photo.h ? styles.featureLandscape : styles.featurePortrait
  return (
    <div className={`${styles.feature} ${large ? styles.featureLarge : ''} ${orientation} wg-feature`}>
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
            return <Solo key={bi} photo={block.photos[0]} index={at} large={block.large} onOpen={onOpen} />
          case 'duo':
            return <Duo key={bi} photos={block.photos} offset={at} large={block.large} secondSmaller={block.secondSmaller} onOpen={onOpen} />
          case 'feature':
            return <Feature key={bi} photo={block.photos[0]} index={at} large={block.large} onOpen={onOpen} />
        }
      })}
    </>
  )
}

const CHAPTER_ART = {
  dome: '/wedding/art/cityhall.png',
  watertemple: '/wedding/art/watertemple.png',
} as const

function ChapterHead({ art, kicker, title, titleZh }: {
  art: keyof typeof CHAPTER_ART
  kicker: string
  title: string
  titleZh: string
}) {
  // Chapter Two's in-flow header only exists for reduced-motion visitors:
  // in motion mode the fixed `.wg-water-preview` (revealed by the curtain
  // opening) *is* the chapter art, and photos follow directly — a second
  // in-flow copy would show up right below it as a duplicate.
  const isWater = art === 'watertemple'
  return (
    <div className={`${styles.chapterHead} ${isWater ? styles.chapterHeadWater : ''} wg-chapter-head ${isWater ? 'wg-chapter-head-water' : ''}`}>
      {/* width/height reserve the box before the PNG arrives — without
          them a late-loading art image grows the page mid-scroll, which
          reads as the scrollbar jumping and the pinned scene stuttering */}
      <img
        src={CHAPTER_ART[art]}
        alt={`${kicker} · ${title} · ${titleZh}`}
        width={857}
        height={1200}
        className={`${styles.chapterArt} wg-chapter-ghost`}
      />
    </div>
  )
}

export default function Gallery() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const bgmStarted = useRef(false)
  const [bgmOn, setBgmOn] = useState(true)

  // ── BGM：入场后渐入；被浏览器拦截时等第一次交互 ────────────────────
  const startBgm = useCallback(() => {
    const a = audioRef.current
    if (!a || bgmStarted.current) return
    a.volume = 0
    a.play().then(() => {
      bgmStarted.current = true
      gsap.to(a, { volume: 0.5, duration: 4, ease: 'power1.inOut' })
    }).catch(() => { /* 无手势，等用户第一次点击/按键 */ })
  }, [])

  useEffect(() => {
    if (!loaded) return
    startBgm()
    const onGesture = () => startBgm()
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [loaded, startBgm])

  const toggleBgm = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    const isPlaying = bgmStarted.current && !a.paused
    if (isPlaying) {
      gsap.to(a, { volume: 0, duration: 0.8, ease: 'power1.out', onComplete: () => a.pause() })
      setBgmOn(false)
    } else {
      if (bgmStarted.current) {
        a.play()
        gsap.to(a, { volume: 0.5, duration: 1.2, ease: 'power1.inOut' })
      } else {
        startBgm()
      }
      setBgmOn(true)
    }
  }, [startBgm])

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
    // Line-art PNGs load alongside the photos — a late-arriving one would
    // otherwise pop in mid-scroll (their boxes are reserved via width/height
    // attributes, but the drawing itself would still appear abruptly)
    const urls = [
      ...ALL.map(p => pageSrc(p.id)),
      ...Object.values(CHAPTER_ART),
      '/wedding/art/sf_sd.png',
    ]
    urls.forEach(url => {
      const img = new Image()
      const tick = () => {
        done++
        setProgress(Math.round((done / urls.length) * 100))
        if (done === urls.length) finish()
      }
      img.onload = tick
      img.onerror = tick
      img.src = url
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

      // ── City ↔ Water line-art divider: rises into view, then fades away
      //    across the *entire* curtain-close motion (not just a sliver of
      //    it) so it visibly dissolves together with the curtains instead
      //    of sitting at full opacity and snapping away at the last beat.
      //    The two triggers meet exactly at ".wg-transition top bottom"
      //    (both resolve to opacity 1 there), so they hand off cleanly
      //    with no overlapping range and no competing tweens. ──────────
      gsap.utils.toArray<HTMLElement>('.wg-city-art').forEach(art => {
        gsap.fromTo(art, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out',
          scrollTrigger: {
            trigger: art, start: 'top 88%',
            endTrigger: '.wg-transition', end: 'top bottom',
            scrub: true,
          } })
        gsap.fromTo(art, { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none',
          scrollTrigger: { trigger: '.wg-transition', start: 'top bottom', end: 'top top', scrub: true } })
      })

      // ── Chapter headers (Chapter Two's is display:none in motion mode —
      //    the fixed water preview plays its role — so skip it here) ────
      gsap.utils.toArray<HTMLElement>('.wg-chapter-head:not(.wg-chapter-head-water)').forEach(head => {
        gsap.fromTo(head.querySelector('.wg-chapter-ghost'),
          { scale: 1.08, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power2.out',
            scrollTrigger: { trigger: head, start: 'top 80%' } })
      })

      // ── Water Temple art: in motion mode the chapter has no in-flow
      //    header at all — `.wg-water-preview` (fixed-position, revealed
      //    by the curtains parting) *is* the chapter art. It stays put
      //    through the emptied-out transition section's remaining scroll
      //    (100vh that must pass before the photos arrive), then fades out
      //    as the first photos scroll up over it.
      //
      //    Opacity is set from each relevant ScrollTrigger's own onUpdate
      //    (never from a second independent scrubbed tween on the same
      //    property, and never from a raw gsap.ticker callback — the latter
      //    isn't tracked by useGSAP's context, so it survives React's
      //    dev-mode double-invoke of effects as a leaked, stale closure).
      //    Two scrub tweens on the same target can each get re-rendered by
      //    an unrelated ScrollTrigger.refresh() (e.g. triggered by a
      //    lazy-loaded image below shifting layout), and whichever renders
      //    last that frame wins — which is exactly what caused the preview
      //    to leak through the still-closing curtain and then get stuck at
      //    full opacity, showing alongside the real art.
      //
      //    Note: the ScrollTrigger.create() for the hand-off (below, after
      //    tTl) MUST be created after the pinned tTl timeline, not before.
      //    Its trigger element sits after the pin in the DOM, so its
      //    position depends on the pin's spacer (200% of a viewport tall)
      //    already existing — creating it earlier measures the page before
      //    that spacer is in place, silently shifting its start/end by
      //    exactly that spacer's height. ─────────────────────────────────
      let waterHandoff = 0
      let curtainPinActive = false
      const applyWaterPreviewOpacity = (curtainOpen: number) => {
        const opacity = curtainPinActive ? Math.max(0, Math.min(curtainOpen, 1 - waterHandoff)) : 0
        gsap.set('.wg-water-preview', { autoAlpha: opacity })
      }

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

      // ── Transition: curtains close as the section scrolls into view,
      //    no dead gap before the pin engages ──────────────────────
      gsap.fromTo('.wg-t-left',  { x: 0, xPercent: -101 }, { x: 0, xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.wg-transition', start: 'top bottom', end: 'top top', scrub: true } })
      gsap.fromTo('.wg-t-right', { x: 0, xPercent: 101 },  { x: 0, xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.wg-transition', start: 'top bottom', end: 'top top', scrub: true } })

      // ── Words → colour morph → part ────────────────────────────────
      const tTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.wg-transition',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1,
          // Gate + drive the water-preview opacity above: only compute it
          // once curtains have actually closed and the pin has engaged
          // (stays active through the door-open + dead-scroll zone, resets
          // only if the user scrolls back up above the whole transition).
          // onUpdate fires throughout the pin, including exactly while the
          // curtain-open tweens below are running, so reading the curtain's
          // live xPercent here tracks the door opening in real time.
          onEnter: () => { curtainPinActive = true },
          onEnterBack: () => { curtainPinActive = true },
          onLeaveBack: () => { curtainPinActive = false; applyWaterPreviewOpacity(0) },
          onUpdate: () => {
            const xPercent = Math.abs(gsap.getProperty('.wg-t-left', 'xPercent') as number)
            applyWaterPreviewOpacity(Math.min(1, xPercent / 101))
          },
        },
        defaults: { ease: 'power2.inOut' },
      })
      tTl
        // scroll cue up first and held through the whole pinned scene —
        // elderly guests won't know a static-looking screen wants more
        // scrolling, so this stays until the doors themselves take over
        .fromTo('.wg-t-cue',
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }, 0)
        .fromTo('.wg-t-word',
          { y: 26, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, 0)
        .to({}, { duration: 0.3 })
        // camel → teal while the curtains hold the stage
        .to('.wg-t-curtain', { backgroundColor: TEAL, duration: 0.7, ease: 'power1.inOut' })
        .to('.wg-transition', { backgroundColor: TEAL_PAPER, duration: 0.7, ease: 'power1.inOut' }, '<')
        .fromTo('.wg-t-sub',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' }, '<+0.25')
        .to({}, { duration: 0.35 })
        .to('.wg-t-word, .wg-t-sub', { y: -18, autoAlpha: 0, duration: 0.35, stagger: 0.03 })
        // Water Temple preview's scale settles while still hidden behind the
        // closed curtains — its opacity is owned entirely by tTl's own
        // scrollTrigger.onUpdate above, not animated here
        .fromTo('.wg-water-preview', { scale: 1.06 }, { scale: 1, duration: 0.6, ease: 'power2.out' }, '<+0.1')
        .to('.wg-t-left',  { xPercent: -101, duration: 1.0 }, '+=0.1')
        .to('.wg-t-right', { xPercent: 101,  duration: 1.0 }, '<')
        .to('.wg-t-cue', { autoAlpha: 0, duration: 0.3 }, '<')
        .to({}, { duration: 0.15 })

      // Created after tTl on purpose — see the note further up. Fades the
      // preview out as Chapter Two's first photos scroll up to cover it.
      ScrollTrigger.create({
        trigger: '.wg-ch2', start: 'top 65%', end: 'top 20%', scrub: true,
        onUpdate: self => { waterHandoff = self.progress; applyWaterPreviewOpacity(1) },
        onLeaveBack: () => { waterHandoff = 0; applyWaterPreviewOpacity(1) },
      })

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
      // hero cue only — the transition's cue (also .wg-cue for the shared
      // bob) has its visibility owned by the pinned transition timeline
      .fromTo('.wg-hero-cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, '-=0.15')
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
      <audio ref={audioRef} src="/GoldenHour.mp3" loop preload="auto" />
      <button
        className={`${styles.bgmBtn} ${bgmOn ? '' : styles.bgmOff}`}
        onClick={toggleBgm}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={bgmOn ? '关闭背景音乐' : '播放背景音乐'}
      >♪</button>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.pageEdges} aria-hidden="true" />
      <div className={`${styles.progress} wg-progress`} aria-hidden="true" />

      {/* Opening curtains */}
      <div className={`${styles.loaderCurtain} ${styles.loaderL} wg-loader wg-loader-l`} aria-hidden="true" />
      <div className={`${styles.loaderCurtain} ${styles.loaderR} wg-loader wg-loader-r`} aria-hidden="true" />

      {/* Preloader — on the closed curtains while all photos load */}
      <div className={`${styles.preloader} wg-preloader`} role="status" aria-live="polite">
        <span className={styles.preFleuron} aria-hidden="true">❦</span>
        <p className={styles.preNames}>Bruce  &amp; Christy</p>
        <div className={styles.preTrack}>
          <div className={styles.preFill} style={{ width: `${progress}%` }} />
        </div>
        <p className={styles.prePct}>照片加载中 · {progress}%</p>
      </div>

      {/* ── Hero — invitation card ── */}
      <header className={styles.hero}>
        <div className={`${styles.heroCard} wg-hero-card`}>
          <Corners />
          <p className={`${styles.heroKicker} wg-hero-item`}>Our Marriage Ceremony</p>
          <h1 className={styles.heroName}>
            <span className={styles.mask}><span className={`${styles.heroLine} wg-hero-line`}>Bruce <span className={styles.cnName}>程驰</span></span></span>
            <span className={styles.mask}><span className={`${styles.heroAmp} wg-hero-line`}>&amp;</span></span>
            <span className={styles.mask}><span className={`${styles.heroLine} wg-hero-line`}>Christy <span className={styles.cnName}>歐陽安怡</span></span></span>
          </h1>
          <div className="wg-hero-item">
            <Ornament className={styles.heroOrnament} />
          </div>
          <p className={`${styles.heroDate} wg-hero-item`}>{DATE}</p>
        </div>
        <div className={`${styles.scrollCue} wg-cue wg-hero-cue`}>
          <span className={styles.scrollCueText}>下滑</span>
          <span className={styles.scrollCueLine} />
        </div>
        
      </header>

      {/* ── Chapter Ⅰ · City Hall ── */}
      <section className={styles.patternedSection}>
        <div className={`${styles.sectionPattern} ${styles.hallPattern} wg-pattern`} aria-hidden="true" />
        <ChapterHead art="dome" kicker="Chapter One · 第一章" title="City Hall" titleZh="旧金山市政厅" />
        <ChapterBlocks blocks={INDOOR_BLOCKS} start={0} onOpen={setActive} />
        <img
          src="/wedding/art/sf_sd.png"
          alt=""
          width={1874}
          height={656}
          className={`${styles.cityArt} wg-city-art`}
          aria-hidden="true"
        />
      </section>

      {/* ── Curtain transition: camel → teal ── */}
      <section className={`${styles.transition} wg-transition`}>
        <div className={`${styles.tCurtain} ${styles.tLeft} wg-t-curtain wg-t-left`} aria-hidden="true" />
        <div className={`${styles.tCurtain} ${styles.tRight} wg-t-curtain wg-t-right`} aria-hidden="true" />
        <div className={styles.tText}>
          <span className={`${styles.tFleuron} wg-t-word`} aria-hidden="true">❧</span>
          <p className={styles.tWords}>
            {TRANSITION_WORDS.map((word, i) => (
              <span key={i} className={`${styles.tWord} wg-t-word`}>{word}</span>
            ))}
          </p>
          <p className={`${styles.tZh} wg-t-word`}>{TRANSITION_ZH}</p>
          <p className={`${styles.tSub} wg-t-sub`}>{TRANSITION_SUB}</p>
        </div>
        {/* Scroll cue for guests who don't realise the pinned scene needs
            more scrolling (grandparents!) — same look as the hero's cue
            (wg-cue joins its bobbing tween), shown the whole time the
            curtains hold the stage, dismissed only as the doors part */}
        <div className={`${styles.tScrollCue} wg-t-cue wg-cue`} aria-hidden="true">
          <span className={styles.tCueText}>下滑</span>
          <span className={styles.tCueLine} />
        </div>
        <div className={`${styles.waterPreview} wg-water-preview`} aria-hidden="true">
          <img
            src={CHAPTER_ART.watertemple}
            alt=""
            width={857}
            height={1200}
            className={styles.waterPreviewImg}
          />
        </div>
      </section>

      {/* ── Chapter Ⅱ · Water Temple (teal) ── */}
      <section className={`${styles.themeTeal} ${styles.patternedSection} wg-ch2`}>
        {/* In-flow header renders only for reduced-motion (see ChapterHead) */}
        <ChapterHead art="watertemple" kicker="Chapter Two · 第二章" title="Water Temple" titleZh="水神殿" />
        <ChapterBlocks blocks={OUTDOOR_BLOCKS} start={OUTDOOR_START} onOpen={setActive} />

        {/* ── Closing (teal) ── */}
        <footer className={`${styles.closing} wg-closing`}>
          <div className={styles.closingFrame}>
            <Corners />
            <p className={`${styles.closingMono} wg-closing-item`}>Bruce 程驰 <em>&amp;</em><br />Christy 歐陽安怡</p>
            <div className="wg-closing-item">
              <Ornament className={styles.closingOrnament} light />
            </div>
            <p className={`${styles.closingText} wg-closing-item`}>Thank you for celebrating with us ♥</p>
            <p className={`${styles.closingZh} wg-closing-item`}>感谢您与我们共同见证这一刻</p>
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
