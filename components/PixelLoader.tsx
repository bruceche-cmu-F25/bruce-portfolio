'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function PixelLoader() {
  const loaderRef  = useRef<HTMLDivElement>(null)
  const tileRef    = useRef<HTMLDivElement>(null)
  const barRef     = useRef<HTMLDivElement>(null)
  const statusRef  = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const loader  = loaderRef.current
    const tileGrid = tileRef.current
    const barFill  = barRef.current
    const statusEl = statusRef.current
    if (!loader || !tileGrid) {
      document.dispatchEvent(new Event('loaderDone'))
      return
    }

    const TILE = window.innerWidth < 600 ? 48 : 64
    const cols = Math.ceil(window.innerWidth  / TILE) + 1
    const rows = Math.ceil(window.innerHeight / TILE) + 1
    const tileEls: HTMLDivElement[] = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t = document.createElement('div')
        t.className = 'pixel-tile'
        t.style.cssText = `width:${TILE}px;height:${TILE}px;left:${c*TILE}px;top:${r*TILE}px;`
        tileGrid.appendChild(t)
        tileEls.push(t)
      }
    }

    const STAGES = [
      { pct: 28,  text: 'LOADING ASSETS', ms: 220 },
      { pct: 60,  text: 'BUILDING UI',    ms: 280 },
      { pct: 88,  text: 'ALMOST READY',   ms: 240 },
      { pct: 100, text: 'READY',          ms: 160 },
    ]
    let si = 0

    function beginReveal() {
      const inner = loader!.querySelector('.pixel-loader-inner')
      gsap.to(inner, { autoAlpha: 0, y: -14, duration: 0.32, ease: 'power2.in' })
      gsap.to(tileEls, {
        scale: 0, duration: 0.28, ease: 'power2.in',
        stagger: { amount: 0.55, from: 'random' },
        delay: 0.18,
        onComplete() {
          loader!.classList.add('is-done')
          document.dispatchEvent(new Event('loaderDone'))
        },
      })
    }

    function nextStage() {
      if (si >= STAGES.length) { beginReveal(); return }
      const s = STAGES[si++]
      if (barFill)  barFill.style.width = s.pct + '%'
      if (statusEl) statusEl.textContent = s.text
      setTimeout(nextStage, s.ms + Math.random() * 80)
    }
    setTimeout(nextStage, 140)
  }, [])

  return (
    <div className="pixel-loader" ref={loaderRef} role="status" aria-label="Loading">
      <div className="pixel-scanlines" aria-hidden="true" />
      <div className="pixel-loader-inner">
        <div className="pixel-bc" aria-hidden="true">
          <span className="px-letter">B</span>
          <span className="px-letter">C</span>
        </div>
        <div className="pixel-bar-wrap">
          <div className="pixel-bar-inner" ref={barRef} />
        </div>
        <div className="pixel-loader-status">
          <span className="pixel-cursor" aria-hidden="true">▋</span>
          <span ref={statusRef}>INITIALIZING</span>
        </div>
      </div>
      <div className="pixel-tile-grid" ref={tileRef} aria-hidden="true" />
    </div>
  )
}
