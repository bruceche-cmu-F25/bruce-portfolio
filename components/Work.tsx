'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bentoDetails, logoNeedsTile, type BentoEntry } from '@/lib/bentoData'
import { setPageScrollLocked } from './LenisInit'

function WorkOverlay({ open, entry, onClose }: { open: boolean; entry: BentoEntry | null; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return
    if (open) {
      overlay.setAttribute('aria-hidden', 'false')
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'none' })
      gsap.fromTo(panel,   { y: 48, scale: 0.93, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.38, ease: 'power3.out' })
    } else {
      gsap.to(panel,   { y: 28, scale: 0.96, autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
      gsap.to(overlay, { autoAlpha: 0, duration: 0.28, ease: 'none', delay: 0.06,
        onComplete() { overlay.setAttribute('aria-hidden', 'true') } })
    }
  }, [open])

  /* Owned by its own effect so the cleanup always runs — including when the
     panel unmounts, which is what the animation effect above cannot see. */
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'   // for the no-Lenis case
    setPageScrollLocked(true)
    return () => {
      document.body.style.overflow = ''
      setPageScrollLocked(false)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!entry) return null

  const logoEl = entry.logo
    ? <img src={entry.logo} alt={entry.org} className={`overlay-logo${logoNeedsTile(entry.logo) ? ' logo-tile' : ''}`} />
    : entry.live
      ? <span className="live-badge" style={{ flexShrink: 0, padding: '0.4rem 0.75rem' }}>● LIVE</span>
      : null

  return (
    <div className="bento-overlay" ref={overlayRef} aria-hidden="true" role="dialog" aria-modal="true"
         /* Lenis preventDefaults wheel events to drive the page itself, which
            would also swallow this panel's own scrolling — this is its opt-out */
         data-lenis-prevent
         onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bento-overlay-panel" ref={panelRef}>
        <button className="bento-close-btn" aria-label="Close" onClick={onClose}>✕</button>
        <div className="overlay-header">
          {logoEl}
          <div className="overlay-header-info">
            <span className={`bento-badge ${entry.badge}`}>{entry.type}</span>
            <span className="overlay-org">{entry.org}</span>
          </div>
        </div>
        {entry.award && <div className="overlay-award">{entry.award}</div>}
        <h2 className="overlay-title">{entry.title}</h2>
        <p className="overlay-date">{entry.date}</p>
        {entry.note && <p className="overlay-note">{entry.note}</p>}
        <div className="overlay-metrics">
          {entry.metrics.map((m, i) => <span key={i} className={`metric ${m.color}`}>{m.label}</span>)}
        </div>
        <ul className="overlay-points">
          {entry.points.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
        {entry.shots?.map(shot => (
          <figure key={shot.src} className="overlay-shot">
            <img src={shot.src} alt={shot.alt} loading="lazy" />
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
        <div className="overlay-tags">
          {entry.tags.map((t, i) => <span key={i}>{t}</span>)}
        </div>
        {(entry.demo || entry.repo) && (
          <div className="overlay-links">
            {entry.demo && (
              <a href={entry.demo} target="_blank" rel="noopener" className="overlay-link">View Demo ↗</a>
            )}
            {entry.repo && (
              <a href={entry.repo} target="_blank" rel="noopener" className="overlay-link">Read the source ↗</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Two case studies, then one supporting project. Everything else is a single line. */
const CASES = [
  {
    key: 'robin',
    layout: 'split',
    desc: 'A personal assistant built on the pi coding agent\'s web UI — same agent, but registered with a fixed tool allow-list instead of a shell. Todos and calendar, read-only Gmail triage, a scored job hunt with Telegram digests, and a coding coach that hints instead of answering.',
  },
  {
    key: 'helport',
    layout: 'metrics',
    desc: 'Backend systems for an AI call assistant across mortgage, healthcare, insurance and government — 20ms response latency. Rebuilt intent matching on Gemini 2.0 + Vertex AI, cutting inference cost 6× ($0.002 → $0.00031 per match).',
  },
  {
    key: 'parking',
    layout: 'slim',
    desc: 'Bosch-sponsored locator using vision-language models and CLIP embeddings for spatial reasoning over sensor data.',
  },
] as const

const ALSO: { key: keyof typeof bentoDetails; hint: string }[] = [
  { key: 'nighty', hint: 'Live' },
  { key: 'research', hint: '30+ papers' },
  { key: 'capitawise', hint: '2nd · $7,000' },
  { key: 'pawprints', hint: '1st · $15,000' },
]

export default function Work() {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const activeEntry = activeKey ? bentoDetails[activeKey] : null

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.work-card',
      { y: 28, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.work-cases', start: 'top 88%' } })
  }, [])

  function open(key: string) { setActiveKey(key) }

  return (
    <section id="work" className="section" aria-label="Selected work">
      <div className="container">
        <p className="section-kicker">Selected work</p>
        <h2 className="section-heading">What I&apos;ve Built</h2>
        <div className="work-cases">
          {CASES.map(card => {
            const entry = bentoDetails[card.key]
            const shot = entry.shots?.[0]
            const link = entry.demo || entry.repo
            return (
              <article
                key={card.key}
                id={`work-${card.key}`}
                className={`work-card work-case work-case-${card.layout}`}
                role="button" tabIndex={0}
                aria-label={`${entry.title} — click to expand`}
                onClick={() => open(card.key)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card.key) } }}
              >
                {card.layout === 'split' && shot && (
                  <figure className="work-card-shot">
                    <img src={shot.src} alt={shot.alt} />
                  </figure>
                )}
                <div className="work-case-copy">
                  <div className="work-card-head">
                    {entry.logo
                      ? <img src={entry.logo} alt={entry.org} className={`work-card-logo${logoNeedsTile(entry.logo) ? ' logo-tile' : ''}`} />
                      : <span />}
                    <div className="work-card-badges">
                      <span className={`bento-badge ${entry.badge}`}>{entry.type}</span>
                      {entry.live && <span className="live-badge">● LIVE</span>}
                    </div>
                  </div>
                  <p className="work-card-org">{entry.org}</p>
                  <h3 className="work-card-title">{entry.title}</h3>
                  <p className="work-card-date">{entry.date}</p>
                  {entry.note && <p className="work-card-note">{entry.note}</p>}
                  <p className="work-card-desc">{card.desc}</p>
                  <div className="work-card-metrics">
                    {entry.metrics.map(m => (
                      <span key={m.label} className={`metric ${m.color}`}>{m.label}</span>
                    ))}
                  </div>
                  {link && (
                    <a href={link} target="_blank" rel="noopener" className="work-card-demo"
                       onClick={e => e.stopPropagation()}>
                      {entry.demo ? 'Demo ↗' : 'Source ↗'}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        <div className="work-also">
          <span className="work-also-label">Also</span>
          {ALSO.map(item => (
            <button key={item.key} type="button" className="work-also-item" onClick={() => open(item.key)}>
              {bentoDetails[item.key].title}
              <span className="work-also-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <WorkOverlay open={!!activeKey} entry={activeEntry} onClose={() => setActiveKey(null)} />
    </section>
  )
}
