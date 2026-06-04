'use client'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const cards = [
  { logo: '/images/HelportLogo.jpg', logoAlt: 'Helport AI', badge: 'Work', badgeClass: 'badge-work', org: 'Helport AI', role: 'AI Product Developer / PM', date: 'Sep 2024 – Jun 2025', chips: [{ label: '35% AHT ↓', cls: 'green' }, { label: '6× cost ↓', cls: 'green' }] },
  { logo: '/images/convoloo_logo.jpeg', logoAlt: 'Convoloo', badge: 'Work', badgeClass: 'badge-work', org: 'Convoloo', role: 'SDE Intern', date: 'Jul 2024 – Sep 2024', chips: [{ label: '2.5s → 1.5s', cls: 'green' }] },
  { logo: '/images/CMULogo.jpg', logoAlt: 'CMU', badge: 'Project', badgeClass: 'badge-project', org: 'CMU 14-825', role: 'Research Assistant Agent', date: 'Jan 2026 – Mar 2026', chips: [{ label: '30+ papers indexed', cls: 'blue' }] },
  { logo: null, live: true, badge: 'Project', badgeClass: 'badge-project', org: 'Independent', role: 'NightyNight', date: 'Apr 2025 – Present', chips: [{ label: 'LangGraph', cls: 'blue' }, { label: 'ElevenLabs', cls: 'blue' }] },
  { logo: '/images/ft_logo_pos_0119.png', logoAlt: 'Franklin Templeton', badge: 'Project', badgeClass: 'badge-project', org: 'Franklin Templeton', role: 'Capitawise', date: 'Mar – Jun 2024', chips: [{ label: '🏆 $7,000', cls: 'amber' }] },
  { logo: '/images/ft_logo_pos_0119.png', logoAlt: 'Franklin Templeton', badge: 'Project', badgeClass: 'badge-project', org: 'Franklin Templeton', role: 'PawPrints', date: 'Mar – Jun 2023', chips: [{ label: '🥇 $15,000', cls: 'amber' }] },
  { logo: '/images/bosch_logo.png', logoAlt: 'Bosch', badge: 'Project', badgeClass: 'badge-project', org: 'CMU × BOSCH', role: 'Parking Spot Locator', date: 'Aug – Dec 2025', chips: [{ label: '3× faster', cls: 'green' }] },
]

function ExpCard({ card, hidden }: { card: typeof cards[0]; hidden?: boolean }) {
  return (
    <article className="exp-card" aria-hidden={hidden ? 'true' : undefined}>
      <div className="exp-card-head">
        {card.logo
          ? <img src={card.logo} alt={hidden ? '' : card.logoAlt} className={`exp-logo${card.logo?.includes('ft_logo') ? ' exp-logo-ft' : ''}`} />
          : card.live
            ? <span className="live-badge">● LIVE</span>
            : null}
        <span className={`bento-badge ${card.badgeClass}`}>{card.badge}</span>
      </div>
      <p className="exp-org">{card.org}</p>
      <h3 className="exp-role">{card.role}</h3>
      <p className="exp-date">{card.date}</p>
      <div className="exp-chips">
        {card.chips.map((c, i) => <span key={i} className={`metric ${c.cls}`}>{c.label}</span>)}
      </div>
    </article>
  )
}

export default function Experience() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    gsap.fromTo('.section-experience .section-heading',
      { y: 30, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: '.section-experience', start: 'top 85%' } })
  }, [])

  return (
    <section id="experience" className="section section-experience" aria-label="Work experience timeline">
      <div className="exp-cmu-bg" aria-hidden="true" />
      <div className="container">
        <p className="section-kicker">Timeline</p>
        <h2 className="section-heading">Where I&apos;ve Worked</h2>
      </div>
      <div className="exp-marquee-wrap">
        <div className="exp-marquee-inner" id="expMarquee">
          {cards.map((c, i) => <ExpCard key={i} card={c} />)}
          {cards.map((c, i) => <ExpCard key={`dup-${i}`} card={c} hidden />)}
        </div>
      </div>
    </section>
  )
}
