'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bentoDetails, type BentoEntry } from '@/lib/bentoData'

function BentoOverlay({ open, entry, onClose }: { open: boolean; entry: BentoEntry | null; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return
    overlay.style.transition = 'none'
    if (open) {
      document.body.style.overflow = 'hidden'
      overlay.setAttribute('aria-hidden', 'false')
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'none' })
      gsap.fromTo(panel,   { y: 52, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.42, ease: 'power3.out' })
    } else {
      gsap.to(panel,   { y: 32, scale: 0.96, autoAlpha: 0, duration: 0.22, ease: 'power2.in' })
      gsap.to(overlay, { autoAlpha: 0, duration: 0.3, ease: 'none', delay: 0.08,
        onComplete() { overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '' } })
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!entry) return null

  const logoEl = entry.logo
    ? <img src={entry.logo} alt={entry.org} className="overlay-logo" />
    : entry.live
      ? <span className="live-badge" style={{ flexShrink: 0 }}>● LIVE</span>
      : null

  return (
    <div className="bento-overlay" ref={overlayRef} aria-hidden="true" role="dialog" aria-modal="true" aria-label="Project details"
         onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className="bento-overlay-panel" ref={panelRef}>
        <button className="bento-close-btn" aria-label="Close details" onClick={onClose}>✕</button>
        <div className="bento-overlay-body">
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
          <div className="overlay-metrics">
            {entry.metrics.map((m, i) => <span key={i} className={`metric ${m.color}`}>{m.label}</span>)}
          </div>
          <ul className="overlay-points">
            {entry.points.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
          <div className="overlay-tags">
            {entry.tags.map((t, i) => <span key={i}>{t}</span>)}
          </div>
          {entry.demo && (
            <div className="overlay-links">
              <a href={entry.demo} target="_blank" rel="noopener" className="overlay-link">View Demo ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface BentoCardProps {
  dataKey: string; badgeClass: string; badgeLabel: string
  logo?: React.ReactNode; live?: boolean
  org?: string; title: string; date: string
  metrics: React.ReactNode; tags: React.ReactNode
  desc?: string; demo?: string
  className: string; onClick: () => void
}
function BentoCard({ dataKey, badgeClass, badgeLabel, logo, live, org, title, date, metrics, tags, desc, demo, className, onClick }: BentoCardProps) {
  return (
    <article className={`bento-card ${className}`} data-key={dataKey}
      role="button" tabIndex={0} aria-label={`${title} — click to expand`}
      onClick={onClick} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}>
      <div className="bento-inner">
        <div className="bento-meta-row">
          <span className={`bento-badge ${badgeClass}`}>{badgeLabel}</span>
          {logo}
          {live && <span className="live-badge">● LIVE</span>}
        </div>
        {org && <p className="bento-org">{org}</p>}
        <h3 className="bento-title">{title}</h3>
        <p className="bento-date">{date}</p>
        <div className="bento-metrics">{metrics}</div>
        {desc && <p className="bento-desc">{desc}</p>}
        <div className="bento-tags">{tags}</div>
        {demo && <a href={demo} target="_blank" rel="noopener" className="bento-demo-link" onClick={e => e.stopPropagation()}>Demo ↗</a>}
      </div>
    </article>
  )
}

export default function Work() {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const activeEntry = activeKey ? bentoDetails[activeKey] : null

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.bento-card',
      { y: 44, scale: 0.95, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.65, stagger: 0.07, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.bento-grid', start: 'top 87%' } })
  }, [])

  const open  = (key: string) => setActiveKey(key)
  const close = () => setActiveKey(null)

  return (
    <section id="work" className="section" aria-label="Work experience and projects">
      <div className="container">
        <p className="section-kicker">Work &amp; Projects</p>
        <h2 className="section-heading">What I&apos;ve Built</h2>
        <div className="bento-grid">
          <BentoCard dataKey="helport" badgeClass="badge-work" badgeLabel="Work" className="bento-helport"
            logo={<img src="/images/HelportLogo.jpg" alt="Helport AI" className="bento-logo" />}
            org="Helport AI" title="AI Product Developer / PM" date="Sep 2024 – Jun 2025"
            desc="Led product strategy for an AI-driven call assistant across mortgage, healthcare, insurance, and government. Migrated intent matching from Dialogflow to Gemini 2.0 + Vertex AI, slashing per-match cost 6×."
            metrics={<>
              <span className="metric green">35% AHT ↓</span>
              <span className="metric green">6× cost reduction</span>
              <span className="metric green">14d → 5d cycle</span>
              <span className="metric green">15% conversion ↑</span>
            </>}
            tags={<>
              {['FastAPI','Gemini 2.0','Vertex AI','A/B Testing','Docker','Python'].map(t => <span key={t}>{t}</span>)}
            </>}
            onClick={() => open('helport')} />

          <BentoCard dataKey="nighty" badgeClass="badge-project" badgeLabel="Project" className="bento-nighty" live
            org="Independent" title="NightyNight" date="Apr 2025 – Present"
            desc="Full-stack AI bedtime science story generator with React/TS frontend and FastAPI backend over SSE, age-adaptive prompting for 4 audience profiles and 7 narrator voices."
            demo="https://nightynight-1.onrender.com/"
            metrics={<>
              <span className="metric blue">LangGraph multi-agent</span>
              <span className="metric blue">ElevenLabs TTS</span>
            </>}
            tags={<>{['LangGraph','FastAPI','React/TS','ElevenLabs','SSE'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('nighty')} />

          <BentoCard dataKey="convoloo" badgeClass="badge-work" badgeLabel="Work" className="bento-convoloo"
            logo={<img src="/images/convoloo_logo.jpeg" alt="Convoloo" className="bento-logo" />}
            org="Convoloo" title="Software Development Engineer Intern" date="Jul 2024 – Sep 2024"
            metrics={<>
              <span className="metric green">2.5s → 1.5s response</span>
              <span className="metric green">50+ bookings</span>
            </>}
            tags={<>{['LangChain','FastAPI','Terraform','MySQL','GCP'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('convoloo')} />

          <BentoCard dataKey="research" badgeClass="badge-project" badgeLabel="Project" className="bento-research"
            logo={<img src="/images/CMULogo.jpg" alt="CMU" className="bento-logo" />}
            org="CMU 14-825" title="Research Assistant Agent" date="Jan 2026 – Mar 2026"
            metrics={<>
              <span className="metric blue">30 papers indexed</span>
              <span className="metric blue">GKE auto-scale</span>
              <span className="metric blue">Multilingual</span>
            </>}
            tags={<>{['LangGraph','RAG','Streamlit','GKE','Milvus'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('research')} />

          <BentoCard dataKey="parking" badgeClass="badge-project" badgeLabel="Project" className="bento-parking"
            logo={<div className="bento-logos-pair">
              <img src="/images/CMULogo.jpg" alt="CMU" className="bento-logo-sm" />
              <img src="/images/bosch_logo.png" alt="Bosch" className="bento-logo-sm bento-logo-wide-sm" />
            </div>}
            title="Parking Spot Locator" date="Aug – Dec 2025"
            metrics={<span className="metric green">3× faster (45s→15s)</span>}
            tags={<>{['VLMap','CLIP','AWS'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('parking')} />

          <BentoCard dataKey="capitawise" badgeClass="badge-project" badgeLabel="Project" className="bento-capitawise"
            logo={<img src="/images/ft_logo_pos_0119.png" alt="Franklin Templeton" className="bento-logo bento-logo-ft" />}
            title="Capitawise" date="Mar – Jun 2024"
            metrics={<span className="metric amber">🏆 2nd Place · $7,000</span>}
            tags={<>{['GPT-4o','React','Flask'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('capitawise')} />

          <BentoCard dataKey="pawprints" badgeClass="badge-project" badgeLabel="Project" className="bento-pawprints"
            logo={<img src="/images/ft_logo_pos_0119.png" alt="Franklin Templeton" className="bento-logo bento-logo-ft" />}
            title="PawPrints" date="Mar – Jun 2023"
            metrics={<span className="metric amber">🥇 1st Place · $15,000</span>}
            tags={<>{['Web3','Express.js','MySQL'].map(t => <span key={t}>{t}</span>)}</>}
            onClick={() => open('pawprints')} />
        </div>
      </div>

      <BentoOverlay open={!!activeKey} entry={activeEntry} onClose={close} />
    </section>
  )
}
