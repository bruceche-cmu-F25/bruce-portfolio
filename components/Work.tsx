'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { bentoDetails, type BentoEntry } from '@/lib/bentoData'

function WorkOverlay({ open, entry, onClose }: { open: boolean; entry: BentoEntry | null; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    const panel   = panelRef.current
    if (!overlay || !panel) return
    if (open) {
      document.body.style.overflow = 'hidden'
      overlay.setAttribute('aria-hidden', 'false')
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.22, ease: 'none' })
      gsap.fromTo(panel,   { y: 48, scale: 0.93, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.38, ease: 'power3.out' })
    } else {
      gsap.to(panel,   { y: 28, scale: 0.96, autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
      gsap.to(overlay, { autoAlpha: 0, duration: 0.28, ease: 'none', delay: 0.06,
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
      ? <span className="live-badge" style={{ flexShrink: 0, padding: '0.4rem 0.75rem' }}>● LIVE</span>
      : null

  return (
    <div className="bento-overlay" ref={overlayRef} aria-hidden="true" role="dialog" aria-modal="true"
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
  )
}

const CARDS = [
  {
    key: 'helport', featured: true,
    badgeClass: 'badge-work', badgeLabel: 'Work',
    logo: '/images/HelportLogo.jpg', live: false,
    org: 'Helport AI', title: 'AI Product Developer / PM', date: 'Sep 2024 – Jun 2025',
    desc: 'Led product strategy for an AI call assistant across mortgage, healthcare, insurance, and government. Migrated intent matching from Dialogflow to Gemini 2.0 + Vertex AI, cutting per-match cost 6×.',
    metrics: [
      { label: '35% AHT ↓', color: 'green' }, { label: '6× cost reduction', color: 'green' },
      { label: '14d → 5d cycle', color: 'green' }, { label: '15% conversion ↑', color: 'green' },
    ],
    tags: ['FastAPI', 'Gemini 2.0', 'Vertex AI', 'A/B Testing', 'Docker', 'Python'],
    demo: undefined,
  },
  {
    key: 'nighty', featured: false,
    badgeClass: 'badge-project', badgeLabel: 'Project',
    logo: null, live: true,
    org: 'Independent', title: 'NightyNight', date: 'Apr 2025 – Present',
    desc: 'Full-stack AI bedtime science story generator with LangGraph multi-agent pipeline and ElevenLabs TTS.',
    metrics: [
      { label: 'LangGraph multi-agent', color: 'blue' }, { label: '7 narrator voices', color: 'blue' },
    ],
    tags: ['LangGraph', 'FastAPI', 'React/TS', 'ElevenLabs', 'SSE'],
    demo: 'https://nightynight-1.onrender.com/',
  },
  {
    key: 'convoloo', featured: false,
    badgeClass: 'badge-work', badgeLabel: 'Work',
    logo: '/images/convoloo_logo.jpeg', live: false,
    org: 'Convoloo', title: 'SDE Intern', date: 'Jul – Sep 2024',
    desc: 'AI event-matching with LangChain, GCP infra with Terraform. Powered 50+ confirmed bookings.',
    metrics: [
      { label: '2.5s → 1.5s', color: 'green' }, { label: '50+ bookings', color: 'green' },
    ],
    tags: ['LangChain', 'FastAPI', 'Terraform', 'MySQL', 'GCP'],
    demo: undefined,
  },
  {
    key: 'research', featured: false,
    badgeClass: 'badge-project', badgeLabel: 'Project',
    logo: '/images/CMULogo.jpg', live: false,
    org: 'CMU 14-825', title: 'Research Assistant Agent', date: 'Jan – Mar 2026',
    desc: 'LangGraph agentic pipeline with RAG over 30+ papers, deployed on GKE with auto-scaling.',
    metrics: [
      { label: '30+ papers indexed', color: 'blue' }, { label: 'GKE auto-scale', color: 'blue' },
    ],
    tags: ['LangGraph', 'RAG', 'Streamlit', 'GKE', 'Milvus'],
    demo: undefined,
  },
  {
    key: 'parking', featured: false,
    badgeClass: 'badge-project', badgeLabel: 'Project',
    logo: '/images/CMULogo.jpg', live: false,
    org: 'CMU × BOSCH', title: 'Parking Spot Locator', date: 'Aug – Dec 2025',
    desc: 'Vision-language parking locator using VLMap + CLIP; 3× speed improvement over baselines.',
    metrics: [{ label: '3× faster (45s → 15s)', color: 'green' }],
    tags: ['VLMap', 'CLIP', 'AWS', 'FastAPI', 'Python'],
    demo: 'https://psl.fogx.link',
  },
  {
    key: 'capitawise', featured: false,
    badgeClass: 'badge-project', badgeLabel: 'Project',
    logo: '/images/ft_logo_pos_0119.png', live: false,
    org: 'Franklin Templeton Hackathon', title: 'Capitawise', date: 'Mar – Jun 2024',
    desc: 'AI financial advisor — GPT-4o personalized investment recommendations.',
    metrics: [{ label: '🏆 2nd Place · $7,000', color: 'amber' }],
    tags: ['GPT-4o', 'React', 'Flask', 'OpenAI API'],
    demo: undefined,
  },
  {
    key: 'pawprints', featured: false,
    badgeClass: 'badge-project', badgeLabel: 'Project',
    logo: '/images/ft_logo_pos_0119.png', live: false,
    org: 'Franklin Templeton Hackathon', title: 'PawPrints', date: 'Mar – Jun 2023',
    desc: 'Web3 pet adoption platform. Led team of 4 as product owner and primary full-stack dev.',
    metrics: [{ label: '🥇 1st Place · $15,000', color: 'amber' }],
    tags: ['Web3', 'Express.js', 'React.js', 'MySQL', 'Blockchain'],
    demo: undefined,
  },
] as const

export default function Work() {
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const activeEntry = activeKey ? bentoDetails[activeKey] : null

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.work-card',
      { y: 50, scale: 0.94, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, stagger: 0.08, ease: 'back.out(1.3)',
        scrollTrigger: { trigger: '.work-grid', start: 'top 88%' } })
  }, [])

  return (
    <section id="work" className="section" aria-label="Work experience and projects">
      <div className="container">
        <p className="section-kicker">Work &amp; Projects</p>
        <h2 className="section-heading">What I&apos;ve Built</h2>
        <div className="work-grid">
          {CARDS.map(card => (
            <article
              key={card.key}
              className={`work-card${card.featured ? ' work-card-featured' : ''}`}
              role="button" tabIndex={0}
              aria-label={`${card.title} — click to expand`}
              onClick={() => setActiveKey(card.key)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveKey(card.key) } }}
            >
              <div className="work-card-head">
                {card.logo
                  ? <img src={card.logo} alt={card.org} className="work-card-logo" />
                  : <span />}
                <div className="work-card-badges">
                  <span className={`bento-badge ${card.badgeClass}`}>{card.badgeLabel}</span>
                  {card.live && <span className="live-badge">● LIVE</span>}
                </div>
              </div>
              <p className="work-card-org">{card.org}</p>
              <h3 className="work-card-title">{card.title}</h3>
              <p className="work-card-date">{card.date}</p>
              {card.desc && <p className="work-card-desc">{card.desc}</p>}
              <div className="work-card-metrics">
                {card.metrics.map((m, i) => (
                  <span key={i} className={`metric ${m.color}`}>{m.label}</span>
                ))}
              </div>
              <div className="work-card-tags">
                {card.tags.map(t => <span key={t}>{t}</span>)}
              </div>
              {card.demo && (
                <a href={card.demo} target="_blank" rel="noopener" className="work-card-demo"
                   onClick={e => e.stopPropagation()}>
                  Demo ↗
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
      <WorkOverlay open={!!activeKey} entry={activeEntry} onClose={() => setActiveKey(null)} />
    </section>
  )
}
